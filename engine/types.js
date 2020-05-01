/* Template for all game objects to derive from */
import * as data from "./data.js";
import { vec3, vec4, mat3, mat4 } from "./emath.js";

//template to create game instances
export class GameObject {
  constructor(model,material,scripts,render_type,layer) {
    this.model = model;
    this.material = material;
    this.scripts = scripts;
    this.render_type = render_type;
    this.layer = layer; //lowest drawn first
  }

  createInstance(position,rotation, id) {
    var models = null;
    if(this.model) models = [this.model];
    return new Instance(position, rotation, id, models, this.material,this.scripts);
  }
}

export var RenderType = {
INSTANCED: "instanced", 
NORMAL: "normal",
INVISIBLE: "invisible"
}

//must have an object parent for tenderer
export class Instance {
  constructor(position,rotation,id,models,material,scripts) {
    this.id = id;
    this.position = position;
    this.rotation = rotation; //quaternion, should be normalized (default 0 0 0 1)
    this.material = material;
    this.models = models;
    if(this.models){
      for(var model of this.models){
        model.loadMemory(); //TODO: this call can be redundant
      }
    }
    this.scripts = []
    if(scripts){
      scripts.forEach(function(script) {
        script = new script(this);
        this.scripts.push(script);
      },this);
    }
  }

  start() {
    this.scripts.forEach(function(script) {
      script.start();
    });
  }

  step(timestamp) {
    this.scripts.forEach(function(script) {
      script.initStep(timestamp);
    });
  }
}

//For static instances, baked with rotation and position
export class InstanceBaker {
  constructor(position, rotation, obj_name) { //origin offset
    this.position = position;
    this.rotation = rotation;
    this.obj_name = obj_name;
    this.instances = [];
  }

  addInstance(position, rotation) {
    this.instances.push([position,rotation]);
  }
  
  //bake instances into large meshes based on positions, rotations
  bake() {
    var obj = data.getObject(this.obj_name);
    var models = []; //models for rendering shapes, may be split over multiple draw calls
    var instance_verts = obj.model.verts.length/3;
    var instance_indeces = obj.model.indeces.length;
    var max_buff_verts = 65535; // multiple of 3 for triangles
    var max_buff_instances = Math.floor(max_buff_verts/instance_verts);
    var buff_instances = Math.min(max_buff_instances, this.instances.length);
    var verts = new Float32Array(buff_instances*instance_verts*3);
    var normals = new Float32Array(buff_instances*instance_verts*3);
    var uvs = new Float32Array(buff_instances*instance_verts*2);
    var indeces = new Uint16Array(buff_instances*instance_indeces);
    var mat4_tmp = new Float32Array(16);
    var vec4_tmp = new Float32Array(4);
    var mat3_tmp = new Float32Array(9);
    var vec3_tmp = new Float32Array(3);

    var total = 0;
    var offset = 0;
    for(var ins_pos of this.instances) {
      if(offset == max_buff_instances) {
        var model = new Model(verts,indeces,normals,uvs);
        models.push(model);
        total += offset;
        offset = 0;
        buff_instances = Math.min(max_buff_instances, this.instances.length - total);
        verts = new Float32Array(buff_instances*instance_verts*3);
        normals = new Float32Array(buff_instances*instance_verts*3);
        uvs = new Float32Array(buff_instances*instance_verts*2);
        indeces = new Uint16Array(buff_instances*instance_indeces);
      }
      var position_matrix = mat4.modelOp(ins_pos[1], ins_pos[0], mat4_tmp);
      var position_matrix_3by3 = mat3_tmp; //use all same buffer
      position_matrix_3by3[0] = position_matrix[0];
      position_matrix_3by3[1] = position_matrix[1];
      position_matrix_3by3[2] = position_matrix[2];
      position_matrix_3by3[3] = position_matrix[4];
      position_matrix_3by3[4] = position_matrix[5];
      position_matrix_3by3[5] = position_matrix[6];
      position_matrix_3by3[6] = position_matrix[8];
      position_matrix_3by3[7] = position_matrix[9];
      position_matrix_3by3[8] = position_matrix[10];
      var normal_matrix = mat3.transpose(mat3.inverse(position_matrix_3by3,mat3_tmp),mat3_tmp);
      for(var i = 0; i < obj.model.verts.length/3; i++) {
        var vert = vec4_tmp;
        vert[0] = obj.model.verts[i*3];
        vert[1] = obj.model.verts[i*3+1];
        vert[2] = obj.model.verts[i*3+2];
        vert[3] = 1; //assumed always 1
        var world_vert = mat4.multiplyVec(position_matrix, vert, vert)
                         verts[offset*obj.model.verts.length + i*3] = world_vert[0];
        verts[offset*obj.model.verts.length + i*3+1] = world_vert[1];
        verts[offset*obj.model.verts.length + i*3+2] = world_vert[2];
        var normal = vec3_tmp;
        normal[0] = obj.model.normals[i*3];
        normal[1] = obj.model.normals[i*3+1];
        normal[2] = obj.model.normals[i*3+2];
        var worlld_normal = mat3.multiplyVec(normal_matrix,normal, normal);
        normals[offset*obj.model.verts.length + i*3] = worlld_normal[0];
        normals[offset*obj.model.verts.length + i*3+1] = worlld_normal[1];
        normals[offset*obj.model.verts.length + i*3+2] = worlld_normal[2];
        uvs[offset*obj.model.uvs.length + i*2] = obj.model.uvs[i*2]
            uvs[offset*obj.model.uvs.length + i*2+1] = obj.model.uvs[i*2+1];
      }

      for(var i = 0; i < obj.model.indeces.length; i++) {
        indeces[offset*obj.model.indeces.length + i] = instance_verts*offset + obj.model.indeces[i];
      }
      offset++;
    }
    var model = new Model(verts,indeces,normals,uvs);
    models.push(model);
    data.addBakedInstances(this.position,this.rotation,this.obj_name,models);
  }
}


export class Script {
  constructor(parent) {
    this.parent = parent; //Instance
    this.diff = null;
    this.init = false;
  }

  initStart() { 
    this.start();
    this.init = true;
  }

  initStep(timestamp) {
    if(this.init) {
      this.step();
    }
  }
  
  start() {
  }

  step() {
  }
}


export class Model {
  constructor(verts,indeces,normals,uvs) {
    this.verts = verts;
    this.indeces = indeces;
    this.normals = normals;
    this.uvs = uvs;
    this.vert_buffer = null;
    this.index_buffer = null;
    this.normal_buffer = null;
    this.uv_buffer = null;
  }
  
  //calculate normal per vert based on triangles around it
  calculateNormals() {
    var normals = new Array(this.verts.length).fill(0);
    var normal_num = new Array(this.verts.length/3).fill(0); //number of triangles in each normal
    for(var i=0; i < this.indeces.length/3; i++) {
      var a_index = this.indeces[i*3];
      var a = this.verts.slice(a_index*3,a_index*3+3);
      var b_index = this.indeces[i*3+1];
      var b = this.verts.slice(b_index*3,b_index*3+3);
      var c_index = this.indeces[i*3+2];
      var c = this.verts.slice(c_index*3,c_index*3+3);
      var ac = vec3.sub(c,a,new Float32Array(3));
      var ab = vec3.sub(b,a,new Float32Array(3));
      var norm = vec3.cross(ab,ac,new Float32Array(3));

      normals[a_index*3] += norm[0];
      normals[a_index*3+1] += norm[1];
      normals[a_index*3+2] += norm[2];
      normal_num[a_index] += 1;
      normals[b_index*3] += norm[0];
      normals[b_index*3+1] += norm[1];
      normals[b_index*3+2] += norm[2];
      normal_num[b_index] += 1;
      normals[c_index*3] += norm[0];
      normals[c_index*3+1] += norm[1];
      normals[c_index*3+2] += norm[2];
      normal_num[c_index] += 1;
    }

    for(var i=0; i < normal_num.length; i++) {
      normals[i*3] /= normal_num[i];
      normals[i*3+1] /= normal_num[i];
      normals[i*3+2] /= normal_num[i];
    }
    this.normals = normals;
  }
  
  //load webgl buffers
  loadMemory() {
    if(this.vert_buffer) {
      this.purgeMemory();
    }
    var glcontext = data.getGlobal("glcontext");
    var vert_buffer = null;
    if(this.verts) {
      vert_buffer = glcontext.createBuffer();
      glcontext.bindBuffer(glcontext.ARRAY_BUFFER, vert_buffer);
      glcontext.bufferData(glcontext.ARRAY_BUFFER, new Float32Array(this.verts), glcontext.STATIC_DRAW);
    }
    var normal_buffer = null;
    if(this.normals) {
      normal_buffer = glcontext.createBuffer();
      glcontext.bindBuffer(glcontext.ARRAY_BUFFER, normal_buffer);
      glcontext.bufferData(glcontext.ARRAY_BUFFER, new Float32Array(this.normals), glcontext.STATIC_DRAW);
    }
    var uv_buffer = null;
    if(this.uvs) {
      var uv_buffer = glcontext.createBuffer();
      glcontext.bindBuffer(glcontext.ARRAY_BUFFER, uv_buffer);
      glcontext.bufferData(glcontext.ARRAY_BUFFER, new Float32Array(this.uvs), glcontext.STATIC_DRAW);
    }
    var index_buffer = null;
    if(this.indeces) {
      var index_buffer = glcontext.createBuffer();
      glcontext.bindBuffer(glcontext.ELEMENT_ARRAY_BUFFER,index_buffer);
      glcontext.bufferData(glcontext.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indeces),glcontext.STATIC_DRAW);
    }
    this.vert_buffer = vert_buffer;
    this.index_buffer = index_buffer;
    this.normal_buffer = normal_buffer;
    this.uv_buffer  = uv_buffer;
  }
  
  //remove webgl buffers
  purgeMemory() {
    var glcontext = data.getGlobal("glcontext");
    if(this.vert_buffer) {
      glcontext.deleteBuffer(this.vert_buffer);
      this.vert_buffer = null;
    }
    if(this.index_buffer) {
      glcontext.deleteBuffer(this.index_buffer);
      this.index_buffer = null;
    }
    if(this.normal_buffer) {
      glcontext.deleteBuffer(this.normal_buffer);
      this.normal_buffer = null;
    }
    if(this.uv_buffer) {
      glcontext.deleteBuffer(this.uv_buffer);
      this.normal_buffer = null;
    }
  }
};

export class Material {
  constructor(shader,textures, engine_attributes, attributes, engine_uniforms, uniforms) {
    this.shader = shader;
    this.textures = textures;
    this.engine_attributes = engine_attributes;
    this.engine_uniforms = engine_uniforms;
    this.attributes = attributes; //TODO add custom support
    this.uniforms = uniforms; //excludes textures
  }

  loadMemory() {
    //todo, not needed for now
  }

  purgeMemory() {
    //todo
  }
};

export class Texture {
  constructor(texture,type) {
    this.texture = texture;
    this.type = type;
  }
}

//stores instances in a level
export class Level {
  constructor(objects) {
    this.objects = objects;
  }

  start() {
    for(var i = 0; i < this.objects.length; i++) { //TODO: store position/rotation info level manifest
      data.addInstance(new Float32Array(4), new Float32Array([0,0,0,1]), this.objects[i]);
    }
  }
}

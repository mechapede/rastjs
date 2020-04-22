/* Template for all game objects to derive from */
import * as data from "./data.js";
import { vec3 } from "./emath.js";

export class GameObject {
  constructor(model,material,scripts,render_type,layer) {
    this.model = model;
    this.material = material;
    this.scripts = scripts;
    this.render_type = render_type;
    this.layer = layer; //lowest drawn first
  }

  createInstance(position,rotation, id) {
    return new Instance(position, rotation, id, this.model, this.material,this.scripts);
  }
}

export var RenderType = {
  INSTANCED: "instanced", //share same mesh
  NORMAL: "normal",
  INVISIBLE: "invisible" //will not be drawn
}

export class Instance {
  constructor(position,rotation,id,model,material,scripts) {
    this.id = id;
    this.position = position; 
    this.rotation = rotation; //quaternion, should be normalized (default 0 0 0 1)
    this.material = material;
    this.model = model;
    if(this.model) this.model.loadMemory();
    this.scripts = []
    scripts.forEach(function(script) {
      script = new script(this);
      this.scripts.push(script);
    },this);
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

export class Script {
  constructor(parent) {
    this.parent = parent; //Instance
    this.diff = null;
  }

  //time since script was last called.... must be set by caller in mainloop
  timeDelta() {
    return this.diff/1000; //make sure call returns same well step is running
  }

  initStart() { //TODO: these times are broken, but unused
    this.start();
    this.last_call = performance.now()

  }

  initStep(timestamp) {
    if(!this.init) {

    }

    var curr_call = performance.now();
    this.diff = curr_call - this.last_call;
    this.last_call = curr_call;
    this.step();
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

  calculateNormals() {
    //calculate averge normal per vert based on triangles around it
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

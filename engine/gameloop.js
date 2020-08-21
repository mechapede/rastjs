/* Main Rendering Loop for engine */
import { get_key, get_mouse_x, get_mouse_y, frame_done } from "./input.js";
import { mat4, vec4, mat3, vec3 } from "./emath.js";
import { RenderType } from "./types.js";
import * as data from "./data.js";

var glcontext = null;
var angle_extention = null;
var run = false;
var gameobject = null;
var last_frame = null;

var camera = data.camera;

var elapsed_time = 0;
var ticks = 0;

var lightpos = new Float32Array([64,100,64,1]);
var lightcolor = new Float32Array([1,1,1]);

//shared buffers, to reduce memory allocations
const vec3_tmp = new Float32Array(3);
const vec4_tmp = new Float32Array(4);
const mat3_tmp = new Float32Array(9);
const mat4_tmp = new Float32Array(16);
const mat4_tmp2 = new Float32Array(16);

//each setup for a instance, shared between render modes
function setupAttributes(material, model) {
  if("a_position" in material.engine_attributes) {
    var positionAttributeLocation = material.engine_attributes["a_position"];
    var positionBuffer = model.vert_buffer;
    var size = 3;
    var type = glcontext.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    glcontext.bindBuffer(glcontext.ARRAY_BUFFER, positionBuffer);
    glcontext.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)
  }
  if("a_normal" in material.engine_attributes) {
    var normalAttributeLocation = material.engine_attributes["a_normal"];
    var normalBuffer = model.normal_buffer;
    var size = 3;
    var type = glcontext.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    glcontext.bindBuffer(glcontext.ARRAY_BUFFER,normalBuffer);
    glcontext.vertexAttribPointer(normalAttributeLocation,size,type,normalize,stride,offset);
  }
  if("a_uv" in material.engine_attributes) {
    var uvAttributeLocation = material.engine_attributes["a_uv"];
    var size = 2;
    var type = glcontext.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    var uvBuffer = model.uv_buffer;
    glcontext.bindBuffer(glcontext.ARRAY_BUFFER,uvBuffer);
    glcontext.vertexAttribPointer(uvAttributeLocation,size,type,normalize,stride,offset);
  }
  var indexBuffer = model.index_buffer;
  glcontext.bindBuffer(glcontext.ELEMENT_ARRAY_BUFFER,indexBuffer);
}

function setupConstantUniforms(material,camera_matrix_inverse,timestamp,light_pos) {
  if("u_matrix_inverse" in material.engine_uniforms) {
    var uni_inverse_offset = material.engine_uniforms["u_matrix_inverse"];
    glcontext.uniformMatrix4fv(uni_inverse_offset,false,camera_matrix_inverse);
  }
  if("u_light_pos" in material.engine_uniforms) {
    var uni_light_pos = material.engine_uniforms["u_light_pos"];
    glcontext.uniform3fv(uni_light_pos, light_pos.slice(0,3));
  }
  if("u_time" in material.engine_uniforms) {
    var uni_time = material.engine_uniforms["u_time"];
    glcontext.uniform1f(uni_time,timestamp/1000.0);
  }

  for(var i = 0; i < material.textures.length; i++) {
    var texture = material.textures[i];
    var texture_location = material.texture_locations[i];
    glcontext.activeTexture(glcontext.TEXTURE0+i);
    if(texture["type"] == "TEXTURE_2D") {
      glcontext.bindTexture(glcontext.TEXTURE_2D,texture["texture"]);
    } else {
      glcontext.bindTexture(glcontext.TEXTURE_CUBE_MAP,texture["texture"]);
    }
    glcontext.uniform1i(texture_location, i);
  }

}

function setupPositionUniforms(instance,camera_matrix) {
  var world_matrix = mat4.modelOp(instance.rotation, instance.position,mat4_tmp);
  var all_matrix = mat4.multiplyMat(camera_matrix,world_matrix, mat4_tmp2);
  if("u_matrix" in instance.material.engine_uniforms) {
    var uni_offset = instance.material.engine_uniforms["u_matrix"];
    glcontext.uniformMatrix4fv(uni_offset,false, all_matrix);
  }

  if("u_normal_matrix" in instance.material.engine_uniforms) {
    var all_matrix_3by3 = mat3_tmp; //use all same buffer
    all_matrix_3by3[0] = all_matrix[0];
    all_matrix_3by3[1] = all_matrix[1];
    all_matrix_3by3[2] = all_matrix[2];
    all_matrix_3by3[3] = all_matrix[4];
    all_matrix_3by3[4] = all_matrix[5];
    all_matrix_3by3[5] = all_matrix[6];
    all_matrix_3by3[6] = all_matrix[8];
    all_matrix_3by3[7] = all_matrix[9];
    all_matrix_3by3[8] = all_matrix[10];
    var normal_matrix = mat3.transpose(mat3.inverse(all_matrix_3by3,all_matrix_3by3),all_matrix_3by3);
    var uni_normal_offset = instance.material.engine_uniforms["u_normal_matrix"];
    glcontext.uniformMatrix3fv(uni_normal_offset,false, normal_matrix);
  }
}

function mainloop(timestamp) {
  elapsed_time += (timestamp - last_frame);
  
  data.resizeCanvas();
  data.setTimedelta(timestamp);
  var timedelta = data.timedelta;
  var tris = 0;
  last_frame = timestamp;

  var forward = new Float32Array([-Math.cos(camera.rotation[0]) * Math.sin(camera.rotation[1]),Math.sin(camera.rotation[0]),Math.cos(camera.rotation[0]) * Math.cos(camera.rotation[1])]);
  forward = vec3.normalize(forward,forward);
  if(!camera.locked){
    if(get_key("w")) {
      camera.position[0] += 10 * timedelta * forward[0];
      camera.position[1] += 10 * timedelta * forward[1];
      camera.position[2] += 10 * timedelta * forward[2];
    } else if(get_key("s")) {
      camera.position[0] -= 10 * timedelta * forward[0];
      camera.position[1] -= 10 * timedelta * forward[1];
      camera.position[2] -= 10 * timedelta * forward[2];
    }
    var right = vec3.cross(forward,[0,1,0],new Float32Array(3));
    var right = vec3.normalize(right,right);
    if(get_key("a")) {
      camera.position[0] -= 10 * timedelta * right[0];
      camera.position[1] -= 10 * timedelta * right[1];
      camera.position[2] -= 10 * timedelta * right[2];
    } else if(get_key("d")) {
      camera.position[0] += 10 * timedelta * right[0];
      camera.position[1] += 10 * timedelta * right[1];
      camera.position[2] += 10 * timedelta * right[2];
    }
    if(get_key("q")) {
      camera.position[1] += 10 * timedelta;
    } else if(get_key("e")) {
      camera.position[1] -= 10 * timedelta;
    }    
  }

  camera.rotation[0] -= get_mouse_y() / 720;
  camera.rotation[1] -= get_mouse_x() / 720;
  camera.rotation[0] =  Math.min(Math.max(camera.rotation[0],-Math.PI/2 + 0.0001),Math.PI/2 - 0.0001); //prevent flipped camera
  camera.rotation[1] %= 2*Math.PI;
  frame_done();

  var camera_translation = mat4.translate([-camera.position[0],-camera.position[1],-camera.position[2]], new Float32Array(16));
  var camera_rotation = mat4.multiplyMats(new Float32Array(16),mat4.xRotate(camera.rotation[0],new Float32Array(16)),mat4.yRotate(camera.rotation[1],new Float32Array(16)));
  var camera_position = mat4.multiplyMat(camera_rotation,camera_translation, new Float32Array(16));
  var aspect = glcontext.canvas.clientWidth / glcontext.canvas.clientHeight;
  var camera_perspective = mat4.perspective((60 * Math.PI)/180, aspect, 0.01, 400,new Float32Array(16));
  var camera_matrix = mat4.multiplyMat(camera_perspective,camera_position, new Float32Array(16));
  var camera_matrix_inverse = mat4.inverse(mat4.multiplyMat(camera_perspective,camera_rotation, new Float32Array(16)),new Float32Array(16)); //for skybox

  var light_pos = mat4.multiplyVec(camera_matrix,lightpos,new Float32Array(4));
  var last_program = null;

  for(var new_instance of data.iterNewInstances) {
    new_instance.start();
  }

  for(var object_instances of data.iterInstanceByLayer) {
    var object_name = object_instances.name;
    var object = data.getObject(object_instances.name);

    switch(object.render_type) {
    case RenderType.NORMAL:
      var first_instance = object_instances[Symbol.iterator]().next().value;
      var program = first_instance.material.shader;
      if( program != last_program){
        glcontext.useProgram(program);
        last_program = program;
      }
      setupConstantUniforms(first_instance.material,camera_matrix_inverse,timestamp,light_pos);
      for(var instance of object_instances) {
        instance.step();
        if(instance.material && instance.models.length > 0) { //for dynamic generated meshes
          setupPositionUniforms(instance,camera_matrix);
          for(var model of instance.models) {
            setupAttributes(instance.material,model);
            var count = model.indeces.length;
            tris += count;
            glcontext.drawElements(glcontext.TRIANGLES, count, glcontext.UNSIGNED_SHORT, 0);
          }
        }
      }
      break;
    case RenderType.INSTANCED:
      var first_instance = object_instances[Symbol.iterator]().next().value;
      var program = first_instance.material.shader;
      if( program != last_program){
        glcontext.useProgram(program);
        last_program = program;
      }
      setupConstantUniforms(first_instance.material,camera_matrix_inverse,timestamp,light_pos);
      var model = first_instance.models[0]; //instanced only supports one mesh
      setupAttributes(first_instance.material,model);
      for(var instance of object_instances) {
        instance.step();
        setupPositionUniforms(instance,camera_matrix);
        var count = model.indeces.length;
        tris += count;
        glcontext.drawElements(glcontext.TRIANGLES, count, glcontext.UNSIGNED_SHORT, 0);
      }
      break;
    case RenderType.INVISIBLE: //all instances of type are invisable
      for(var instance of object_instances) {
        instance.step();
        //no render
      }
      break;
    default:
      console.assert(false, {name:object_name,object:object, errorMsg:"Object does not have valid RenderType value."});
    }
  }

  ticks += 1;
  if(elapsed_time >= 1000) {
    var end_frame_time = performance.now();
    var frame_time = end_frame_time - timestamp;
    data.setStats(ticks, tris/3, frame_time);
    ticks = 0;
    elapsed_time -= 1000;
  }

  if(run) requestAnimationFrame(mainloop);
}

export function start() {
  glcontext = data.getGlobal("glcontext");
  run = true;
  last_frame = performance.now();
  requestAnimationFrame(mainloop);
}

export function stop() {
  run = false;
  last_frame = null;
}

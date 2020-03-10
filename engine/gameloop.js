/* Main Rendering Loop */
import * as data from "/engine/data.js"
import { get_key, get_mouse_x, get_mouse_y, frame_done } from "/engine/input.js"
import { mat4, vec4 } from "/engine/emath.js"

var glcontext = null;
var run = false;
var gameobject = null;
var last_frame = null;

//TODO: support multiple camera logic
var camera_x_rotate = 0; //
var camera_y_rotate = 0;
var camera_z_rotate = 0;
var camera_x = 1;
var camera_y = 10;
var camera_z = 1;

var j = 0;

function mainloop(timestamp) {

    var timedelta = (timestamp - last_frame)/1000; //in seconds
    last_frame = timestamp; //TODO: cleanup

    glcontext.clearColor(1, 1, 1, 1);
    glcontext.clear(glcontext.COLOR_BUFFER_BIT | glcontext.DEPTH_BUFFER_BIT);

    var direction_x = -Math.cos(camera_x_rotate) * Math.sin(camera_y_rotate);
    var direction_y = Math.sin(camera_x_rotate);
    var direction_z = Math.cos(camera_x_rotate) * Math.cos(camera_y_rotate);
    if( get_key("w") ) {
        camera_x += 10 * timedelta * direction_x;
        camera_y += 10 * timedelta * direction_y;
        camera_z += 10 * timedelta * direction_z;
    } else if ( get_key("s") ) {
        camera_x -= 10 * timedelta * direction_x;
        camera_y -= 10 * timedelta * direction_y;
        camera_z -= 10 * timedelta * direction_z;
    }
    var right = vec4.cross([direction_x,direction_y,direction_z],[0,1,0]);
    if( get_key("a") ) {
        camera_x += 10 * timedelta * right[0];
        camera_y += 10 * timedelta * right[1];
        camera_z += 10 * timedelta * right[2];
    } else if ( get_key("d") ) {
        camera_x -= 10 * timedelta * right[0];
        camera_y -= 10 * timedelta * right[1];
        camera_z -= 10 * timedelta * right[2];
    }

    if ( get_key("q") ) {
        camera_y += 10* timedelta ;
    }

    camera_x_rotate += get_mouse_y() / 720;
    camera_y_rotate -= get_mouse_x() / 720;
    frame_done(); //todo cleanup all keys

    var camera_translation = mat4.translate([-camera_x,-camera_y,-camera_z]);
    var camera_rotation = mat4.multiplyMat(mat4.zRotate(camera_z_rotate),mat4.xRotate(camera_x_rotate),mat4.yRotate(camera_y_rotate));
    var camera_position = mat4.multiplyMat(camera_rotation,camera_translation);
    var aspect = glcontext.canvas.clientWidth / glcontext.canvas.clientHeight;
    var camera_perspective = mat4.perspective(50, aspect, 0.1, 200);
    var camera_matrix = mat4.multiplyMat(camera_perspective,camera_position); //TODO rename these all

    var camera_matrix_inverse = mat4.inverse(mat4.multiplyMat(camera_perspective,camera_rotation)); //for skybox
    //mat4.log(mat4.multiplyMat(camera_matrix_inverse,camera_world_rotation_matrix));
    
        j = (j + 1) % 360;
    for (var instance of data.iterInstances) {

        if(j == 240 ){
            console.log(instance);
        }
        instance.step();
        var program = instance.material.shader;
        glcontext.useProgram(program);

        //TODO: normal world matrix
        var translation = mat4.translate(instance.position);
        var x_rotate = mat4.xRotate(instance.rotation[0]);
        var y_rotate = mat4.yRotate(instance.rotation[1]);
        var z_rotate = mat4.zRotate(instance.rotation[2]);
        var world_matrix = mat4.multiplyMat(translation,z_rotate,x_rotate,y_rotate);
        var all_matrix = mat4.multiplyMat(camera_matrix,world_matrix);

        //TODO: uniform int locations don't behave the same as attributes
        if( "u_matrix" in instance.material.engine_uniforms ) {
            var uni_offset = glcontext.getUniformLocation(program,"u_matrix");
            glcontext.uniformMatrix4fv(uni_offset,false, new Float32Array(all_matrix));
        }
        if( "u_matrix_inverse" in instance.material.engine_uniforms ) {
            var uni_offset = glcontext.getUniformLocation(program,"u_matrix_inverse");
            glcontext.uniformMatrix4fv(uni_offset,false, new Float32Array(camera_matrix_inverse));
        }
        if( "u_camera_pos" in instance.material.engine_uniforms ) {
            var uni_camera_pos = glcontext.getUniformLocation(program,"u_camera_pos");
            glcontext.uniform4fv(uni_camera_pos, new Float32Array([camera_x,camera_y,camera_z,1]));
        }
        if( "u_time" in instance.material.engine_uniforms ) {
            var uni_time = glcontext.getUniformLocation(program,"u_time");
            glcontext.uniform1f(uni_time,timestamp/1000.0);
        }

        if( "a_position" in instance.material.engine_attributes ) {
            var positionAttributeLocation = instance.material.engine_attributes["a_position"];
            glcontext.enableVertexAttribArray(positionAttributeLocation);
            var positionBuffer = instance.model.vert_buffer;
            var size = 3;
            var type = glcontext.FLOAT;
            var normalize = false;
            var stride = 0;
            var offset = 0;
            glcontext.bindBuffer(glcontext.ARRAY_BUFFER, positionBuffer);
            glcontext.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)
        }
        if( "a_normal" in instance.material.engine_attributes ) {
            var normalAttributeLocation = instance.material.engine_attributes["a_normal"];
            glcontext.enableVertexAttribArray(normalAttributeLocation);
            var normalBuffer = instance.model.normal_buffer;
            var size = 3;
            var type = glcontext.FLOAT;
            var normalize = false;
            var stride = 0;
            var offset = 0;
            glcontext.bindBuffer(glcontext.ARRAY_BUFFER,normalBuffer);
            glcontext.vertexAttribPointer(normalAttributeLocation,size,type,normalize,stride,offset);
        }
        if( "a_uv" in instance.material.engine_attributes ) {
            var uvAttributeLocation = instance.material.engine_attributes["a_uv"];
            glcontext.enableVertexAttribArray(uvAttributeLocation);
            size = 2;
            var type = glcontext.FLOAT;
            var normalize = false;
            var stride = 0;
            var offset = 0;
            var uvBuffer = instance.model.uv_buffer;
            glcontext.bindBuffer(glcontext.ARRAY_BUFFER,uvBuffer);
            glcontext.vertexAttribPointer(uvAttributeLocation,size,type,normalize,stride,offset);
        }

        for( var i = 0; i < instance.material.textures.length; i++) {
            var texture = instance.material.textures[i];
            var texture_location = glcontext.getUniformLocation(program,"u_tex" + i);
            glcontext.activeTexture(glcontext.TEXTURE0+i);
            if(texture["type"] == "TEXTURE_2D" ) {
                glcontext.bindTexture(glcontext.TEXTURE_2D,texture["texture"]);
            } else {
                glcontext.bindTexture(glcontext.TEXTURE_CUBE_MAP,texture["texture"]);
            }

            glcontext.uniform1i(texture_location, i);
        }

        var indexBuffer = instance.model.index_buffer;
        glcontext.bindBuffer(glcontext.ELEMENT_ARRAY_BUFFER,indexBuffer);
        var count = instance.model.indeces.length;
        glcontext.drawElements(glcontext.TRIANGLES, count, glcontext.UNSIGNED_SHORT, 0);

    }
    var error = glcontext.getError();
    if(error) console.log(error);

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

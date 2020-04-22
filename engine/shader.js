/* Helper Functions for loading and compiling shaders */
var id = 1

export function Shader(id,shader) {
    this.id = id;
    this.shader = shader
}

/* */
export function loadShaderProgram(gl, vertex_file, frag_file ) {

    // Load files and build program
    const vertex_shader = loadShader(gl, gl.VERTEX_SHADER, vertex_file);
    const fragment_shader = loadShader(gl,gl.FRAGMENT_SHADER, frag_file);

    const shader_program = gl.createProgram();

    gl.attachShader(shader_program, vertex_shader);
    gl.attachShader(shader_program, fragment_shader);
    gl.linkProgram(shader_program);

    // Check for errors
    if ( !gl.getProgramParameter(shader_program, gl.LINK_STATUS) ) {
        var error = gl.getProgramInfoLog(shader_program);
        console.log("Loading shader failed:\n"+error);
        return null;
    }

    return shader_program;
}

/* Creates a shader for a file, based on type of shader given */
function loadShader(gl, type, file) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader,file);
    gl.compileShader(shader);

    if( !gl.getShaderParameter(shader,gl.COMPILE_STATUS) ) {
        var compilationLog = gl.getShaderInfoLog(shader);
        console.log("Compiling a shader failed:\n" + compilationLog);
        return null;
    }
    return shader;
}

/* Load texture based on format */
export function loadTexture(gl,path, manifest) {
    var texture = null;
    switch(manifest["type"]) {
        case "TEXTURE_2D":
            texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            //make textures 1 pixel so other procesing can be done for now
            const level = 0;
            const internalFormat = gl.RGBA;
            const width = 1;
            const height = 1;
            const border = 0;
            const srcFormat = gl.RGBA;
            const srcType = gl.UNSIGNED_BYTE;
            const pixel = new Uint8Array([0,0,255,255]); //blue
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                          width, height, border, srcFormat, srcType,
                          pixel);

            const image = new Image();
            image.onload = function() {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                              srcFormat, srcType, image);
                //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.generateMipmap(gl.TEXTURE_2D); // must be a power of 2
            };

            image.src = path + "textures/" + manifest["textures"][0];
            break;
        case "TEXTURE_CUBE_MAP":
            texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            const faces = [ { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                                src: path + "textures/" + manifest["textures"][0]},
                            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                                src: path + "textures/" + manifest["textures"][1]},
                            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                                src: path + "textures/" + manifest["textures"][2]},
                            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                                src: path + "textures/" + manifest["textures"][3]},
                            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                                src: path + "textures/" + manifest["textures"][4]},
                            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
                                src: path + "textures/" + manifest["textures"][5]}];
            faces.forEach( function(face){
                const {target, src} = face;
                
                const level = 0;
                const internalFormat = gl.RGBA;
                const width = 1024;//TODO: don't hardcode default sizes
                const height = 1024;
                const border = 0;
                const srcFormat = gl.RGBA;
                const srcType = gl.UNSIGNED_BYTE;
                gl.texImage2D(target, level, internalFormat,
                              width, height, border, srcFormat, srcType,
                              null);
                const image = new Image();
                image.onload = function(){
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP,texture);
                    gl.texImage2D(target, level, internalFormat, srcFormat, srcType, image);
                    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                }
                image.src = src;
            });
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            break;
        default:
            console.log("Texture type is unknown"); // TODO a better error message
    }
    return texture;
}

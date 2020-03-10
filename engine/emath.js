/* Libs for math required for game engine
 vec4 expects a 4 val typed float32 array (some functions don't use forth value)
 mat4 expects a 16 val typed float32 array *
 follows webgl conventions for indexing matrices */


export class vec2 {
        static sub(vec2a, vec2b) {
            return [vec2a[0]-vec2b[0],vec2a[1]-vec2b[1]]
        }
        static dot (vec2a,vec2b) {
            return vec2a[0]*vec2b[0] + vec2a[1]*vec2b[1];
        }
}

export class vec3 {
        static sub(vec3a, vec3b) {
            return [vec3a[0]-vec3b[0],vec3a[1]-vec3b[1],vec3a[2]-vec3b[2]]
        }

        static add(vec3a, vec3b) {
            return [vec3a[0]+vec3b[0],vec3a[1]+vec3b[1],vec3a[2]+vec3b[2]]
        }

        static cross(vec3a,vec3b) {
            return [ vec3a[1] * vec3b[2] - vec3a[2] * vec3b[1],
                              -(vec3a[0] * vec3b[2] - vec3a[2] * vec3b[0]),
                              vec3a[0] * vec3b[1] - vec3a[1] * vec3b[0]];
        }
}

export class vec4 {
        static logVec(vec4) {
            var out = ""
            for( var i = 0; i < 4; i++) {
                out += "[";
                out += " " + vec4[i];
                out += " ]\n";
            }
            console.log(out);
        }

        static cross(vec4a,vec4b) {
            return [ vec4a[1] * vec4b[2] - vec4a[2] * vec4b[1],
                              -(vec4a[0] * vec4b[2] - vec4a[2] * vec4b[0]),
                              vec4a[0] * vec4b[1] - vec4a[1] * vec4b[0],
                              1];
        }
}

export class mat4 {
        static perspective(fov,aspect, near, far) {
            var f = Math.tan(Math.PI * 0.5 - 0.5 *fov);
            var rangeInv = 1.0 / (near - far);

            return new Float32Array ([f / aspect, 0, 0, 0,
                                        0, f, 0, 0,
                                        0, 0, -(near + far) * rangeInv, 1,
                                        0, 0, near * far * rangeInv * 2, 0]);
        }

        static idenity() {
            return new Float32Array([1,0,0,0,
                                     0,1,0,0,
                                     0,0,1,0,
                                     0,0,0,1]);
        }

        static translate(vec4) {
            return new Float32Array([1,0,0,0,
                                     0,1,0,0,
                                     0,0,1,0,
                                     vec4[0],vec4[1],vec4[2],1]);
        }

        static xRotate(radians) {
            var c = Math.cos(radians);
            var s = Math.sin(radians);

            return new Float32Array([1,0,0,0,
                                     0,c,s,0,
                                     0,-s,c,0,
                                     0,0,0,1]);
        }

        static yRotate(radians) {
            var c = Math.cos(radians);
            var s = Math.sin(radians);

            return new Float32Array([c,0,-s,0,
                                     0,1,0,0,
                                     s,0,c,0,
                                     0,0,0,1]);
        }

        static zRotate(radians) {
            var c = Math.cos(radians);
            var s = Math.sin(radians);
            return new Float32Array([c,s,0,0,
                                     -s,c,0,0,
                                     0,0,1,0,
                                     0,0,0,1]);
        }

        static scale(vec4) {
            return new Float32Array([vec4[0],0,0,0,
                                     0,vec4[1],0,0,
                                     0,0,vec4[2],0,
                                     0,0,0,1]);
        }

        static multiplyMat(...mat4s) {
            var result = mat4s[0];
            for( var m = 1; m < mat4s.length; m++) {
                var buff = new Float32Array(16);
                var next = mat4s[m];
                for(var x=0; x<4; x++) {
                    for(var y=0; y < 4; y++) {
                        var sum = 0;
                        for(var j=0; j <4; j++) {
                            sum += result[y + 4*j] * next[x*4+j];
                        }
                        buff[y + 4*x] = sum;
                    }
                }
                result = buff;
            }
            return result;
        }

        static multiplyVec(mat4,vec4) {
            var result = [];
            for( var y = 0; y < 4; y++ ) {
                var sum = 0;
                for( var j = 0; j < 4; j++) {
                    sum += mat4[y+4*j] * vec4[j];
                }
                result[y] = sum;
            }
            return result;
        }

        static inverse(mat4) {
            //make 2 temp 2d array for gausian elimination //TODO: fix names and make it do it to idenity + rescale
            var m = mat4.slice(0,16);
            var cm = this.idenity();
            for( var i = 0; i<4; i++) {
                var max_row = i; //pivot
                for(var j = i+1; j <4; j++) {
                    if( Math.abs(m[max_row + i*4]) < Math.abs(m[j + i*4]) ) {
                        max_row = j;
                    }
                }
                for(var j=0; j <4; j++) {
                    var t = m[i + j*4];
                    m[i + j*4] = m[max_row +j*4];
                    m[max_row + j*4] = t;
                    t = cm[i + j*4];
                    cm[i+j*4] = cm[max_row + j*4];
                    cm[max_row +j*4] = t;
                }
                if( m[i+i*4] == 0 ) { //TODO: is this case good enough?
                    console.log("Matrix inverse does not exist");
                    return null;
                }
                for(var j = 0; j < 4; j++) {
                    if( m[j+i*4] == 0 || j == i) {
                        continue;
                    }
                    var row_factor = -m[j+i*4]/m[i+i*4];

                    for(var k = 0; k < 4; k++) {
                        m[j+k*4] += (row_factor * m[i+k*4]); //do it to idenity
                        cm[j+k*4] += (row_factor * cm[i+k*4]);
                    }
                    m[j+i*4] = 0;

                }
            }
            for(var i = 0; i < 4; i++) { //normalize
                for(var j =0; j < 4; j++) {
                    cm[i+j*4] /= m[i+i*4];

                }
                m[i+i*4] = 1;
            }
            return cm;
        }

        static log(mat4) {
            var out = ""
            for( var i = 0; i < 4; i++) {
                out += "["
                for( var j=0; j < 4; j++) {
                    out += " " + mat4[i + 4*j]
                }
                out += " ]\n";
            }
            console.log(out);
        }
}

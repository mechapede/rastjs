/* Libs for math required for game engine
 vec4 expects a 4 val typed float32 array (some functions don't use forth value)
 mat4 expects a 16 val typed float32 array
 quaternion expects vec4 for rotaions
 All operations are based on left hand convention (positive z into screen)
 matrix is grouped by row values such that matrix:
 *  x = [1  2  3  4  ] is shown in program as x = [1,5,9,13
 *      [5  6  7  8  ]                             2,6,10,14
 *      [9  10 11 12 ]                             3,7,11,15
 *      [13 14 15 16 ]                             13,14,15,16]
 * */

export class vec2 {
  static sub(vec2a, vec2b) {
    return [vec2a[0]-vec2b[0],vec2a[1]-vec2b[1]]
  }
  static dot(vec2a,vec2b) {
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

  static dot(vec3a,vec3b) {
    return vec3a[0]*vec3b[0] + vec3a[1]*vec3b[1] + vec3a[2]*vec3b[2];
  }

  static cross(vec3a,vec3b) {
    return [ vec3b[1] * vec3a[2] - vec3b[2] * vec3a[1],
                      -(vec3b[0] * vec3a[2] - vec3b[2] * vec3a[0]),
                      vec3b[0] * vec3a[1] - vec3b[1] * vec3a[0],
                      1];
  }

  static normalize(vec3a) {
    var length = Math.sqrt(Math.pow(vec3a[0],2) + Math.pow(vec3a[1],2) + Math.pow(vec3a[2],2));
    if(length == 0) return [vec3a[0], vec3a[1], vec3a[2]];
    return [vec3a[0]/length, vec3a[1]/length, vec3a[2]/length];
  }
}

export class vec4 {
  static cross(vec4a,vec4b) {
    return [ vec4b[1] * vec4a[2] - vec4b[2] * vec4a[1],
                      -(vec4b[0] * vec4a[2] - vec4b[2] * vec4a[0]),
                      vec4b[0] * vec4a[1] - vec4b[1] * vec4a[0],
                      1];
  }
}

export class mat3 {
  
  static idenity(){
      return new Float32Array([1,0,0,
                             0,1,0,
                             0,0,1]);  
  }
  
  static transpose(mat3a){
    return [mat3a[0], mat3a[3], mat3a[6],
                 mat3a[1], mat3a[4], mat3a[7],
                 mat3a[2], mat3a[5], mat3a[8] ];
  }
  
  static inverse(mat3a){
    var m = mat3a.slice(0,9);
    var cm = this.idenity();
    for(var i = 0; i<3; i++) {
      var max_row = i; //pivot
      for(var j = i+1; j <3; j++) {
        if(Math.abs(m[max_row + i*3]) < Math.abs(m[j + i*3])) {
          max_row = j;
        }
      }
      for(var j=0; j <3; j++) {
        var t = m[i + j*3];
        m[i + j*3] = m[max_row +j*3];
        m[max_row + j*3] = t;
        t = cm[i + j*3];
        cm[i+j*3] = cm[max_row + j*3];
        cm[max_row +j*3] = t;
      }
      if(m[i+i*3] == 0) {
        console.assert(false, {name:name, errorMsg:"Matrix inverse does not exist"});
        return null;
      }
      for(var j = 0; j < 3; j++) {
        if(m[j+i*3] == 0 || j == i) {
          continue;
        }
        var row_factor = -m[j+i*3]/m[i+i*3];

        for(var k = 0; k < 3; k++) {
          m[j+k*3] += (row_factor * m[i+k*3]); //perform on m,cm matrix
          cm[j+k*3] += (row_factor * cm[i+k*3]);
        }
        m[j+i*3] = 0;

      }
    }
    for(var i = 0; i < 3; i++) { //normalize to idenity
      for(var j =0; j < 3; j++) {
        cm[i+j*3] /= m[i+i*3];

      }
      m[i+i*3] = 1;
    }
    return cm;
  }
  
}

export class mat4 {
  static perspective(fov,aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 *fov);
    var rangeInv = 1.0 / (near - far);

    return new Float32Array([f / aspect, 0, 0, 0,
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

  // performs ops for rotation and translation for instances
  // precomputed into one matrix to save ops
  static modelOp(rotation, position) {
    var a11 = 1 - Math.pow(rotation[1],2) - Math.pow(rotation[2],2);
    var a12 = 2*(rotation[0]*rotation[1] - rotation[2]*rotation[3]);
    var a13 = 2*(rotation[0]*rotation[2] + rotation[1]*rotation[3]);
    var a21 = 2*(rotation[0]*rotation[1] + rotation[2]*rotation[3]);
    var a22 = 1 - Math.pow(rotation[0],2) - Math.pow(rotation[2],2);
    var a23 = 2*(rotation[1]*rotation[2] - rotation[0]*rotation[3]);
    var a31 = 2*(rotation[0]*rotation[2] - rotation[1]*rotation[3]);
    var a32 = 2*(rotation[0]*rotation[3] + rotation[1]*rotation[2]);
    var a33 = 1 - Math.pow(rotation[0],2) + Math.pow(rotation[1],2);
    return new Float32Array([a11, a21, a31, 0,
                                  a12, a22, a32, 0,
                                  a13, a23, a33, 0,
                                  position[0], position[1], position[2], 1]);
  }

  static scale(vec4) {
    return new Float32Array([vec4[0],0,0,0,
                             0,vec4[1],0,0,
                             0,0,vec4[2],0,
                             0,0,0,1]);
  }

  static multiplyMat(...mat4s) {
    var result = mat4s[0];
    for(var m = 1; m < mat4s.length; m++) {
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
    for(var y = 0; y < 4; y++) {
      var sum = 0;
      for(var j = 0; j < 4; j++) {
        sum += mat4[y+4*j] * vec4[j];
      }
      result[y] = sum;
    }
    return result;
  }

  //using Gauss–Jordan elimination with partial pivoting
  static inverse(mat4a) {
    var m = mat4a.slice(0,16);
    var cm = this.idenity();
    for(var i = 0; i<4; i++) {
      var max_row = i; //pivot
      for(var j = i+1; j <4; j++) {
        if(Math.abs(m[max_row + i*4]) < Math.abs(m[j + i*4])) {
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
      if(m[i+i*4] == 0) {
        console.assert(false, {name:name, errorMsg:"Matrix inverse does not exist"});
        return null;
      }
      for(var j = 0; j < 4; j++) {
        if(m[j+i*4] == 0 || j == i) {
          continue;
        }
        var row_factor = -m[j+i*4]/m[i+i*4];

        for(var k = 0; k < 4; k++) {
          m[j+k*4] += (row_factor * m[i+k*4]); //perform on m,cm matrix
          cm[j+k*4] += (row_factor * cm[i+k*4]);
        }
        m[j+i*4] = 0;

      }
    }
    for(var i = 0; i < 4; i++) { //normalize to idenity
      for(var j =0; j < 4; j++) {
        cm[i+j*4] /= m[i+i*4];

      }
      m[i+i*4] = 1;
    }
    return cm;
  }

  static log(mat4) {
    var out = ""
    for(var i = 0; i < 4; i++) {
      out += "["
      for(var j=0; j < 4; j++) {
        out += " " + mat4[i + 4*j]
      }
      out += " ]\n";
    }
    console.log(out);
  }
}

/* For rotations of objects */
export class quaternion {
  static getRotaionBetweenVectors(vec3a, vec3b) {
    var norm_u_v = Math.sqrt(vec3.dot(vec3a,vec3a) + vec3.dot(vec3b,vec3b));
    var real_part = norm_u_v + vec3.dot(vec3a,vec3b);
    var w = null;
    
    if(real_part < 1e-6 * norm_u_v){
      real_part = 0;
      if( Math.abs(vec3a[0]) > Math.abs(vec31[2]) ){
        w = [-vec3a[1],vec3a[0],0];
      }else{
        w = [0,-vec3a[2],vec3a[1]];
      }
    } else {
      w = vec3.cross(vec3a, vec3b);
    }
    return quaternion.normalize([w[0],w[1],w[2],real_part]);
  }

  static normalize(quat) {
    var length = Math.sqrt(Math.pow(quat[0],2) + Math.pow(quat[1],2) + Math.pow(quat[2],2) + Math.pow(quat[3],2));
    if(length == 0) return [quat[0], quat[1], quat[2], quat[3]];
    return [quat[0]/length, quat[1]/length, quat[2]/length, quat[3]/length];
  }
}

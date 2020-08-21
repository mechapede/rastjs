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
  static sub(vec2a, vec2b, dest) {
    dest[0] = vec2a[0] - vec2b[0];
    dest[1] = vec2a[1] - vec2b[1];
    return dest;
  }
  static dot(vec2a,vec2b) {
    return vec2a[0]*vec2b[0] + vec2a[1]*vec2b[1];
  }
}

const vec3_tmp = new Float32Array(3); //buffer
export class vec3 {
  static sub(vec3a, vec3b, dest) {
    dest[0] = vec3a[0]-vec3b[0];
    dest[1] = vec3a[1]-vec3b[1];
    dest[2] = vec3a[2]-vec3b[2];
    return dest;
  }

  static add(vec3a, vec3b, dest) {
    dest[0] = vec3a[0] + vec3b[0];
    dest[1] = vec3a[1] + vec3b[1];
    dest[2] = vec3a[2] + vec3b[2];
    return dest;
  }

  static dot(vec3a,vec3b) {
    return vec3a[0]*vec3b[0] + vec3a[1]*vec3b[1] + vec3a[2]*vec3b[2];
  }

  static cross(vec3a, vec3b, dest) {
    var inter = dest;
    if(dest == vec3a || dest == vec3b) {
      inter = vec3_tmp; //use tmp buffer for result
    }
    inter[0] = vec3b[1] * vec3a[2] - vec3b[2] * vec3a[1];
    inter[1] = -(vec3b[0] * vec3a[2] - vec3b[2] * vec3a[0]);
    inter[2] = vec3b[0] * vec3a[1] - vec3b[1] * vec3a[0]

    if(inter != dest) {
      dest[0] = inter[0];
      dest[1] = inter[1];
      dest[2] = inter[2];
    }
    return dest;
  }

  static magnitude(vec3a) {
    return Math.sqrt(Math.pow(vec3a[0],2) + Math.pow(vec3a[1],2) + Math.pow(vec3a[2],2))
  }

  static normalize(vec3a, dest) {
    var length = this.magnitude(vec3a);
    if(length == 0) length = 1;
    dest[0] = vec3a[0] / length;
    dest[1] = vec3a[1] / length;
    dest[2] = vec3a[2] / length;
    return dest;
  }
  
  static mulConstant(constant, vec3a, dest) {
    dest[0] = constant * vec3a[0];
    dest[1] = constant * vec3a[1];
    dest[2] = constant * vec3a[2];
    return dest;
  }
}

const vec4_tmp = new Float32Array(4);
export class vec4 {
  static cross(vec4a,vec4b) {
    return [ vec4b[1] * vec4a[2] - vec4b[2] * vec4a[1],
                      -(vec4b[0] * vec4a[2] - vec4b[2] * vec4a[0]),
                      vec4b[0] * vec4a[1] - vec4b[1] * vec4a[0],
                      1];
  }
}

const mat3_tmp = new Float32Array(9);
export class mat3 {
  static idenity(dest) {
    dest[0] = 1;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 1;
    dest[5] = 0;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = 1;
    return dest;
  }

  static transpose(mat3a, dest) {
    if(dest == mat3a) {
      var c = dest[1];
      dest[1] = mat3a[3];
      dest[3] = c;
      c = dest[2];
      dest[2] = mat3a[6];
      dest[6] = c;
      c = dest[5];
      dest[5] = mat3a[7];
      dest[7] = c;
    } else {
      dest[0] = mat3a[0];
      dest[1] = mat3a[3];
      dest[2] = mat3a[6];
      dest[3] = mat3a[1];
      dest[4] = mat3a[4];
      dest[5] = mat3a[7];
      dest[6] = mat3a[2];
      dest[7] = mat3a[5];
      dest[8] = mat3a[8];
    }
    return dest;
  }
  
  static determinant(mat3a){
    var asum = mat3a[0]*(mat3a[4]*mat3a[8]-mat3a[5]*mat3a[7]);
    var bsum = mat3a[3]*(mat3a[1]*mat3a[8]-mat3a[2]*mat3a[7]);
    var csum = mat3a[6]*(mat3a[1]*mat3a[5]-mat3a[2]*mat3a[4]);
    return asum - bsum + csum;
  }
  
  //inverse using determinants
  static inverse_det(mat3a, dest){
    var deter = this.determinant(mat3a);
    console.assert(deter!=0, {name:name, errorMsg:"Matrix inverse does not exist"});
    var trans = this.transpose(mat3a,mat3_tmp);
    var inv = this.multiplyScaler(trans,1/deter,dest);
    return inv;
  }

  //inverse based on Gauss–Jordan elimination with partial pivoting
  static inverse(mat3a, dest) {
    var m = mat3_tmp;
    for(var i =0; i < 9; i++) {
      m[i] = mat3a[i];
    }
    var cm = this.idenity(dest);
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
    return dest;
  }
  
  static multiplyScaler(mat3a,scaler,dest){
    for(var i=0; i<9; i++){
      dest[i] = mat3a[i]*scaler;
    }
    return dest;
  }

  static multiplyVec(mat3a, vec3a, dest) {
    var inter = dest;
    if(dest == vec3a){
      inter = vec3_tmp;
    }
    for(var y = 0; y < 3; y++) {
      var sum = 0;
      for(var j = 0; j < 3; j++) {
        sum += mat3a[y+3*j] * vec3a[j];
      }
      inter[y] = sum;
    }
    if( dest != inter){
      for(var i =0; i < 3; i++){
        dest[i] = inter[i];
      }
    }
    return dest;
  }
}

const mat4_tmp = new Float32Array(16);
const mat4_tmp2 = new Float32Array(16);
export class mat4 {
  static perspective(fov, aspect, near, far, dest) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 *fov);
    var rangeInv = 1.0 / (near - far);
    dest[0] = f/aspect;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = f;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = 0;
    dest[9] = 0;
    dest[10] = -(near + far) * rangeInv;
    dest[11] = 1;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = near * far * rangeInv * 2;
    dest[15] = 0;
    return dest
  }

  static idenity(dest) {
    dest[0] = 1;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = 1;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = 0;
    dest[9] = 0;
    dest[10] = 1;
    dest[11] = 0;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = 0;
    dest[15] = 1;
    return dest;
  }

  static translate(vec3a, dest) {
    dest[0] = 1;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = 1;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = 0;
    dest[9] = 0;
    dest[10] = 1;
    dest[11] = 0;
    dest[12] = vec3a[0];
    dest[13] = vec3a[1];
    dest[14] = vec3a[2];
    dest[15] = 1;
    return dest;
  }

  static xRotate(radians, dest) {
    var c = Math.cos(radians);
    var s = Math.sin(radians);
    dest[0] = 1;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = c;
    dest[6] = s;
    dest[7] = 0;
    dest[8] = 0;
    dest[9] = -s;
    dest[10] = c;
    dest[11] = 0;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = 0;
    dest[15] = 1;
    return dest;
  }

  static yRotate(radians, dest) {
    var c = Math.cos(radians);
    var s = Math.sin(radians);
    dest[0] = c;
    dest[1] = 0;
    dest[2] = -s;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = 1;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = s;
    dest[9] = 0;
    dest[10] = c;
    dest[11] = 0;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = 0;
    dest[15] = 1;
    return dest;
  }

  static zRotate(radians, dest) {
    var c = Math.cos(radians);
    var s = Math.sin(radians);
    dest[0] = c;
    dest[1] = s;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = -s;
    dest[5] = c;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = 0;
    dest[9] = 0;
    dest[10] = 1;
    dest[11] = 0;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = 0;
    dest[15] = 1;
    return dest;
  }
  
  //performs rotation and based on camera, rotation in radians
  // xaxis, yaxis, axis rotation order
  static allRotate(rotation, dest){
    var xc = Math.cos(rotation[0]);
    var xs = Math.sin(rotation[0]);
    var yc = Math.cos(rotation[1]); 
    var ys = Math.sin(rotation[1]);
    var zc = Math.cos(rotation[2]);
    var zs = Math.sin(rotation[2]);
    var a11 = zc*yc;
    var a12 = zc*ys*xs-zs*xc;
    var a13 = zc*ys*xc+zs*xs;
    var a21 = zs*yc;
    var a22 = zs*ys*xs+zc*xc;
    var a23 = zs*ys*xc-zc*xs;
    var a31 = -ys;
    var a32 = yc*xs;
    var a33 = yc*xc;
    dest[0] = a11;
    dest[1] = a21;
    dest[2] = a31;
    dest[3] = 0;
    dest[4] = a12;
    dest[5] = a22;
    dest[6] = a32;
    dest[7] = 0;
    dest[8] = a13;
    dest[9] = a23;
    dest[10] = a33;
    dest[11] = 0;
    dest[12] = 0; 
    dest[13] = 0;
    dest[14] = 0;
    dest[15] = 1;
    return dest;
  }

  // performs ops for rotation and translation for instances
  // precomputed into one matrix to save ops, rotation in quaternions
  static modelOp(rotation, position, dest) {
    var a11 = 1 - Math.pow(rotation[1],2) - Math.pow(rotation[2],2);
    var a12 = 2*(rotation[0]*rotation[1] - rotation[2]*rotation[3]);
    var a13 = 2*(rotation[0]*rotation[2] + rotation[1]*rotation[3]);
    var a21 = 2*(rotation[0]*rotation[1] + rotation[2]*rotation[3]);
    var a22 = 1 - Math.pow(rotation[0],2) - Math.pow(rotation[2],2);
    var a23 = 2*(rotation[1]*rotation[2] - rotation[0]*rotation[3]);
    var a31 = 2*(rotation[0]*rotation[2] - rotation[1]*rotation[3]);
    var a32 = 2*(rotation[0]*rotation[3] + rotation[1]*rotation[2]);
    var a33 = 1 - Math.pow(rotation[0],2) + Math.pow(rotation[1],2);
    dest[0] = a11;
    dest[1] = a21;
    dest[2] = a31;
    dest[3] = 0;
    dest[4] = a12;
    dest[5] = a22;
    dest[6] = a32;
    dest[7] = 0;
    dest[8] = a13;
    dest[9] = a23;
    dest[10] = a33;
    dest[11] = 0;
    dest[12] = position[0];
    dest[13] = position[1];
    dest[14] = position[2];
    dest[15] = 1;
    return dest;
  }

  static scale(vec3a, dest) {
    dest[0] = vec3a[0];
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = vec3a[1];
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = 0;
    dest[9] = 0;
    dest[10] = vec3a[2];
    dest[11] = 0;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = 0;
    dest[15] = 1;
    return dest;
  }
  
  static multiplyMat(mat4a, mat4b, dest) {
    var inter = dest;
    if(dest == mat4a || dest == mat4b) {
      inter = mat4_tmp;
    }
    for(var x=0; x<4; x++) {
      for(var y=0; y < 4; y++) {
        var sum = 0;
        for(var j=0; j <4; j++) {
          sum += mat4a[y + 4*j] * mat4b[x*4+j];
        }
        inter[y + 4*x] = sum;
      }
    }
    if(dest != inter) {
      for(var i = 0; i < 16; i++) {
        dest[i] = inter[i];
      }
    }
    return dest;
  }

  static multiplyMats(dest,...mat4s) { 
    var result = mat4s[0];
    for(var i = 1; i < mat4s.length; i++){
      result = this.multiplyMat(result,mat4s[i],mat4_tmp2);
    }
    for(var i = 0; i < 16; i++){
      dest[i] = result[i];
    }
    return dest;
  }

  static multiplyVec(mat4a, vec4a, dest) {
    var inter = dest;
    if(dest == vec4a){
      inter = vec4_tmp;
    }
    for(var y = 0; y < 4; y++) {
      var sum = 0;
      for(var j = 0; j < 4; j++) {
        sum += mat4a[y+4*j] * vec4a[j];
      }
      inter[y] = sum;
    }
    if( dest != inter){
      for(var i =0; i < 4; i++){
        dest[i] = inter[i];
      }
    }
    return dest;
  }

  //using Gauss–Jordan elimination with partial pivoting
  static inverse(mat4a, dest) {
    var m = mat4_tmp;
    for(var i =0; i < 16; i++) {
      m[i] = mat4a[i];
    }
    var cm = this.idenity(dest);
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

  static log(mat4a) {
    var out = ""
    for(var i = 0; i < 4; i++) {
      out += "["
      for(var j=0; j < 4; j++) {
        out += " " + mat4a[i + 4*j]
      }
      out += " ]\n";
    }
    console.log(out);
  }
}

/* For rotations of objects */
const quat_tmp = new Float32Array(4);
export class quaternion {
  static getRotaionBetweenVectors(vec3a, vec3b, dest) { 
    var norm_u_v = Math.sqrt(vec3.dot(vec3a,vec3a) + vec3.dot(vec3b,vec3b));
    var real_part = norm_u_v + vec3.dot(vec3a,vec3b);
    var w = dest;
    if(real_part < 1e-6 * norm_u_v) {
      real_part = 0;
      if(Math.abs(vec3a[0]) > Math.abs(vec31[2])) {
        var c = vec3a[0];
        w[0] = -vec3a[1];
        w[1] = c;
        w[2] = 0;
      } else {
        var c = vec3a[1];
        w[0] = 0;
        w[1] = -vec3a[2];
        w[2] = c;
      }
    } else {
      w = vec3.cross(vec3b, vec3a,dest);
    }
    w[3] = real_part;
    return quaternion.normalize(w,w);
  }

  static normalize(quat, dest) {
    var length = Math.sqrt(Math.pow(quat[0],2) + Math.pow(quat[1],2) + Math.pow(quat[2],2) + Math.pow(quat[3],2));
    dest[0] = quat[0]/length;
    dest[1] = quat[1]/length;
    dest[2] = quat[2]/length;
    dest[3] = quat[3]/length;
    return dest;
  }
  
  static multiply(quat1, quat2, dest){
    var buff = dest;
    if(buff == quat1 || buff == quat2){
      buff = quat_tmp;
    }
    buff[0] = quat1[3]*quat2[0] + quat1[0]*quat2[3] + quat1[1]*quat2[2] - quat1[2]*quat2[1];
    buff[1] = quat1[3]*quat2[1] - quat1[0]*quat2[2] + quat1[1]*quat2[3] + quat1[2]*quat2[0];
    buff[2] = quat1[3]*quat2[2] + quat1[0]*quat2[1] - quat1[1]*quat2[0] + quat1[2]*quat2[3];
    buff[3] = quat1[3]*quat2[3] - quat1[0]*quat2[0] - quat1[1]*quat2[1] - quat1[2]*quat2[2];
    if(buff != dest){
      dest[0] = buff[0];
      dest[1] = buff[1];
      dest[2] = buff[2];
      dest[3] = buff[3];
    }
    return dest;
  }
}

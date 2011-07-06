//math.js
//Vec3, Mat4 and Quat classes

(function() {
  var sqrt = Math.sqrt, 
      sin = Math.sin,
      cos = Math.cos,
      tan = Math.tan,
      pi = Math.PI,
      slice = Array.prototype.slice;
  
  //Vec3 Class
  var Vec3 = function(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
  };

  var generics = {
    
    setVec3: function(dest, vec) {
      dest.x = vec.x;
      dest.y = vec.y;
      dest.z = vec.z;
      return dest;
    },

    set: function(dest, x, y, z) {
      dest.x = x;
      dest.y = y;
      dest.z = z;
      return dest;
    },
    
    add: function(dest, vec) {
      return new Vec3(dest.x + vec.x,
                      dest.y + vec.y, 
                      dest.z + vec.z);
    },
    
    $add: function(dest, vec) {
      dest.x += vec.x;
      dest.y += vec.y;
      dest.z += vec.z;
      return dest;
    },
    
    add2: function(dest, a, b) {
      dest.x = a.x + b.x;
      dest.y = a.y + b.y;
      dest.z = a.z + b.z;
      return dest;
    },
    
    sub: function(dest, vec) {
      return new Vec3(dest.x - vec.x,
                      dest.y - vec.y, 
                      dest.z - vec.z);
    },
    
    $sub: function(dest, vec) {
      dest.x -= vec.x;
      dest.y -= vec.y;
      dest.z -= vec.z;
      return dest;
    },
    
    sub2: function(dest, a, b) {
      dest.x = a.x - b.x;
      dest.y = a.y - b.y;
      dest.z = a.z - b.z;
      return dest;
    },
    
    scale: function(dest, s) {
      return new Vec3(dest.x * s,
                      dest.y * s,
                      dest.z * s);
    },
    
    $scale: function(dest, s) {
      dest.x *= s;
      dest.y *= s;
      dest.z *= s;
      return dest;
    },

    neg: function(dest) {
      return new Vec3(-dest.x,
                      -dest.y,
                      -dest.z);
    },

    $neg: function(dest) {
      dest.x = -dest.x;
      dest.y = -dest.y;
      dest.z = -dest.z;
      return dest;
    },

    unit: function(dest) {
      var len = Vec3.norm(dest);
      
      if (len > 0) {
        return Vec3.scale(dest, 1 / len);
      }
      return Vec3.clone(dest);
    },

    $unit: function(dest) {
      var len = Vec3.norm(dest);

      if (len > 0) {
        return Vec3.$scale(dest, 1 / len);
      }
      return dest;
    },
    
    cross: function(dest, vec) {
      var dx = dest.x,
          dy = dest.y,
          dz = dest.z,
          vx = vec.x,
          vy = vec.y,
          vz = vec.z;
      
      return new Vec3(dy * vz - dz * vy,
                      dz * vx - dx * vz,
                      dx * vy - dy * vx);
    },
    
    $cross: function(dest, vec) {
      var dx = dest.x,
          dy = dest.y,
          dz = dest.z,
          vx = vec.x,
          vy = vec.y,
          vz = vec.z;

      dest.x = dy * vz - dz * vy;
      dest.y = dz * vx - dx * vz;
      dest.z = dx * vy - dy * vx;
      return dest;
    },

    distTo: function(dest, vec) {
      var dx = dest.x - vec.x,
          dy = dest.y - vec.y,
          dz = dest.z - vec.z;
      
      return sqrt(dx * dx +
                  dy * dy +
                  dz * dz);
    },

    distToSq: function(dest, vec) {
      var dx = dest.x - vec.x,
          dy = dest.y - vec.y,
          dz = dest.z - vec.z;

      return dx * dx + dy * dy + dz * dz;
    },

    norm: function(dest) {
      var dx = dest.x, dy = dest.y, dz = dest.z;

      return sqrt(dx * dx + dy * dy + dz * dz);
    },

    normSq: function(dest) {
      var dx = dest.x, dy = dest.y, dz = dest.z;

      return dx * dx + dy * dy + dz * dz;
    },

    dot: function(dest, vec) {
      return dest.x * vec.x + dest.y * vec.y + dest.z * vec.z;
    },

    clone: function(dest) {
      return new Vec3(dest.x, dest.y, dest.z);
    }
  };
  
  //add generics and instance methods
  var proto = Vec3.prototype = {};
  for (var method in generics) {
    Vec3[method] = generics[method];
    proto[method] = (function (m) {
      return function() {
        var args = slice.call(arguments);
        
        args.unshift(this);
        return Vec3[m].apply(Vec3, args);
      };
   })(method);
  }

  //Mat4 Class
  var Mat4 = function(n11, n12, n13, n14,
                      n21, n22, n23, n24,
                      n31, n32, n33, n34,
                      n41, n42, n43, n44) {
    if (typeof n11 == 'number') {
      this.set(n11, n12, n13, n14,
               n21, n22, n23, n24,
               n31, n32, n33, n34,
               n41, n42, n43, n44);
    
    } else {
      this.id();
    }
 };

  generics = {
    
    id: function(dest) {
      dest.n11 = dest.n22 = dest.n33 = dest.n44 = 1;
      dest.n12 = dest.n13 = dest.n14 = 0;
      dest.n21 = dest.n23 = dest.n24 = 0;
      dest.n31 = dest.n32 = dest.n34 = 0;
      dest.n41 = dest.n42 = dest.n43 = 0;
      return dest;
    },

    clone: function(dest) {
      return new Mat4(dest.n11, dest.n12, dest.n13, dest.n14,
                      dest.n21, dest.n22, dest.n23, dest.n24,
                      dest.n31, dest.n32, dest.n33, dest.n34,
                      dest.n41, dest.n42, dest.n43, dest.n44);
    },

    set: function(dest, n11, n12, n13, n14,
                  n21, n22, n23, n24,
                  n31, n32, n33, n34,
                  n41, n42, n43, n44) {
      dest.n11 = n11;
      dest.n12 = n12;
      dest.n13 = n13;
      dest.n14 = n14;
      dest.n21 = n21;
      dest.n22 = n22;
      dest.n23 = n23;
      dest.n24 = n24;
      dest.n31 = n31;
      dest.n32 = n32;
      dest.n33 = n33;
      dest.n34 = n34;
      dest.n41 = n41;
      dest.n42 = n42;
      dest.n43 = n43;
      dest.n44 = n44;
      return dest;
    },

    mulVec3: function(dest, vec) {
      var vx = vec.x,
          vy = vec.y,
          vz = vec.z;

      return new Vec3(dest.n11 * vx + dest.n12 * vy + dest.n13 * vz + dest.n14,
                      dest.n21 * vx + dest.n22 * vy + dest.n23 * vz + dest.n24,
                      dest.n31 * vx + dest.n32 * vy + dest.n33 * vz + dest.n34);
    },

    $mulVec3: function(dest, vec) {
      var vx = vec.x,
          vy = vec.y,
          vz = vec.z;

      vec.x = dest.n11 * vx + dest.n12 * vy + dest.n13 * vz + dest.n14;
      vec.y = dest.n21 * vx + dest.n22 * vy + dest.n23 * vz + dest.n24;
      vec.z = dest.n31 * vx + dest.n32 * vy + dest.n33 * vz + dest.n34;
      return vec;
    },

    mulMat42: function(dest, a, b) {
      var an11 = a.n11, an12 = a.n12, an13 = a.n13, an14 = a.n14,
          an21 = a.n21, an22 = a.n22, an23 = a.n23, an24 = a.n24,
          an31 = a.n31, an32 = a.n32, an33 = a.n33, an34 = a.n34,
          an41 = a.n41, an42 = a.n42, an43 = a.n43, an44 = a.n44,
          bn11 = b.n11, bn12 = b.n12, bn13 = b.n13, bn14 = b.n14,
          bn21 = b.n21, bn22 = b.n22, bn23 = b.n23, bn24 = b.n24,
          bn31 = b.n31, bn32 = b.n32, bn33 = b.n33, bn34 = b.n34,
          bn41 = b.n41, bn42 = b.n42, bn43 = b.n43, bn44 = b.n44;


      dest.n11 = an11 * bn11 + an12 * bn21 + an13 * bn31 + an14 * bn41;
      dest.n12 = an11 * bn12 + an12 * bn22 + an13 * bn32 + an14 * bn42;
      dest.n13 = an11 * bn13 + an12 * bn23 + an13 * bn33 + an14 * bn43;
      dest.n14 = an11 * bn14 + an12 * bn24 + an13 * bn34 + an14 * bn44;

      dest.n21 = an21 * bn11 + an22 * bn21 + an23 * bn31 + an24 * bn41;
      dest.n22 = an21 * bn12 + an22 * bn22 + an23 * bn32 + an24 * bn42;
      dest.n23 = an21 * bn13 + an22 * bn23 + an23 * bn33 + an24 * bn43;
      dest.n24 = an21 * bn14 + an22 * bn24 + an23 * bn34 + an24 * bn44;

      dest.n31 = an31 * bn11 + an32 * bn21 + an33 * bn31 + an34 * bn41;
      dest.n32 = an31 * bn12 + an32 * bn22 + an33 * bn32 + an34 * bn42;
      dest.n33 = an31 * bn13 + an32 * bn23 + an33 * bn33 + an34 * bn43;
      dest.n34 = an31 * bn14 + an32 * bn24 + an33 * bn34 + an34 * bn44;

      dest.n41 = an41 * bn11 + an42 * bn21 + an43 * bn31 + an44 * bn41;
      dest.n42 = an41 * bn12 + an42 * bn22 + an43 * bn32 + an44 * bn42;
      dest.n43 = an41 * bn13 + an42 * bn23 + an43 * bn33 + an44 * bn43;
      dest.n44 = an41 * bn14 + an42 * bn24 + an43 * bn34 + an44 * bn44;
      return dest;
    },
    
    mulMat4: function(a, b) {
      var an11 = a.n11, an12 = a.n12, an13 = a.n13, an14 = a.n14,
          an21 = a.n21, an22 = a.n22, an23 = a.n23, an24 = a.n24,
          an31 = a.n31, an32 = a.n32, an33 = a.n33, an34 = a.n34,
          an41 = a.n41, an42 = a.n42, an43 = a.n43, an44 = a.n44,
          bn11 = b.n11, bn12 = b.n12, bn13 = b.n13, bn14 = b.n14,
          bn21 = b.n21, bn22 = b.n22, bn23 = b.n23, bn24 = b.n24,
          bn31 = b.n31, bn32 = b.n32, bn33 = b.n33, bn34 = b.n34,
          bn41 = b.n41, bn42 = b.n42, bn43 = b.n43, bn44 = b.n44;

      var dest = new Mat4();

      dest.n11 = an11 * bn11 + an12 * bn21 + an13 * bn31 + an14 * bn41;
      dest.n12 = an11 * bn12 + an12 * bn22 + an13 * bn32 + an14 * bn42;
      dest.n13 = an11 * bn13 + an12 * bn23 + an13 * bn33 + an14 * bn43;
      dest.n14 = an11 * bn14 + an12 * bn24 + an13 * bn34 + an14 * bn44;

      dest.n21 = an21 * bn11 + an22 * bn21 + an23 * bn31 + an24 * bn41;
      dest.n22 = an21 * bn12 + an22 * bn22 + an23 * bn32 + an24 * bn42;
      dest.n23 = an21 * bn13 + an22 * bn23 + an23 * bn33 + an24 * bn43;
      dest.n24 = an21 * bn14 + an22 * bn24 + an23 * bn34 + an24 * bn44;

      dest.n31 = an31 * bn11 + an32 * bn21 + an33 * bn31 + an34 * bn41;
      dest.n32 = an31 * bn12 + an32 * bn22 + an33 * bn32 + an34 * bn42;
      dest.n33 = an31 * bn13 + an32 * bn23 + an33 * bn33 + an34 * bn43;
      dest.n34 = an31 * bn14 + an32 * bn24 + an33 * bn34 + an34 * bn44;

      dest.n41 = an41 * bn11 + an42 * bn21 + an43 * bn31 + an44 * bn41;
      dest.n42 = an41 * bn12 + an42 * bn22 + an43 * bn32 + an44 * bn42;
      dest.n43 = an41 * bn13 + an42 * bn23 + an43 * bn33 + an44 * bn43;
      dest.n44 = an41 * bn14 + an42 * bn24 + an43 * bn34 + an44 * bn44;
      return dest;
    },

    $mulMat4: function(a, b) {
      var an11 = a.n11, an12 = a.n12, an13 = a.n13, an14 = a.n14,
          an21 = a.n21, an22 = a.n22, an23 = a.n23, an24 = a.n24,
          an31 = a.n31, an32 = a.n32, an33 = a.n33, an34 = a.n34,
          an41 = a.n41, an42 = a.n42, an43 = a.n43, an44 = a.n44,
          bn11 = b.n11, bn12 = b.n12, bn13 = b.n13, bn14 = b.n14,
          bn21 = b.n21, bn22 = b.n22, bn23 = b.n23, bn24 = b.n24,
          bn31 = b.n31, bn32 = b.n32, bn33 = b.n33, bn34 = b.n34,
          bn41 = b.n41, bn42 = b.n42, bn43 = b.n43, bn44 = b.n44;

      a.n11 = an11 * bn11 + an12 * bn21 + an13 * bn31 + an14 * bn41;
      a.n12 = an11 * bn12 + an12 * bn22 + an13 * bn32 + an14 * bn42;
      a.n13 = an11 * bn13 + an12 * bn23 + an13 * bn33 + an14 * bn43;
      a.n14 = an11 * bn14 + an12 * bn24 + an13 * bn34 + an14 * bn44;

      a.n21 = an21 * bn11 + an22 * bn21 + an23 * bn31 + an24 * bn41;
      a.n22 = an21 * bn12 + an22 * bn22 + an23 * bn32 + an24 * bn42;
      a.n23 = an21 * bn13 + an22 * bn23 + an23 * bn33 + an24 * bn43;
      a.n24 = an21 * bn14 + an22 * bn24 + an23 * bn34 + an24 * bn44;

      a.n31 = an31 * bn11 + an32 * bn21 + an33 * bn31 + an34 * bn41;
      a.n32 = an31 * bn12 + an32 * bn22 + an33 * bn32 + an34 * bn42;
      a.n33 = an31 * bn13 + an32 * bn23 + an33 * bn33 + an34 * bn43;
      a.n34 = an31 * bn14 + an32 * bn24 + an33 * bn34 + an34 * bn44;

      a.n41 = an41 * bn11 + an42 * bn21 + an43 * bn31 + an44 * bn41;
      a.n42 = an41 * bn12 + an42 * bn22 + an43 * bn32 + an44 * bn42;
      a.n43 = an41 * bn13 + an42 * bn23 + an43 * bn33 + an44 * bn43;
      a.n44 = an41 * bn14 + an42 * bn24 + an43 * bn34 + an44 * bn44;
      return a;
    },

   add: function(dest, m) {
     var ndest = new Mat4();

     ndest.n11 = dest.n11 + m.n11;
     ndest.n12 = dest.n12 + m.n12;
     ndest.n13 = dest.n13 + m.n13;
     ndest.n14 = dest.n14 + m.n14;
     ndest.n21 = dest.n21 + m.n21;
     ndest.n22 = dest.n22 + m.n22;
     ndest.n23 = dest.n23 + m.n23;
     ndest.n24 = dest.n24 + m.n24;
     ndest.n31 = dest.n31 + m.n31;
     ndest.n32 = dest.n32 + m.n32;
     ndest.n33 = dest.n33 + m.n33;
     ndest.n34 = dest.n34 + m.n34;
     ndest.n41 = dest.n41 + m.n41;
     ndest.n42 = dest.n42 + m.n42;
     ndest.n43 = dest.n43 + m.n43;
     ndest.n44 = dest.n44 + m.n44;
     return ndest;
   },
   
   $add: function(dest, m) {
     dest.n11 += m.n11;
     dest.n12 += m.n12;
     dest.n13 += m.n13;
     dest.n14 += m.n14;
     dest.n21 += m.n21;
     dest.n22 += m.n22;
     dest.n23 += m.n23;
     dest.n24 += m.n24;
     dest.n31 += m.n31;
     dest.n32 += m.n32;
     dest.n33 += m.n33;
     dest.n34 += m.n34;
     dest.n41 += m.n41;
     dest.n42 += m.n42;
     dest.n43 += m.n43;
     dest.n44 += m.n44;
     return dest;
   },

   transpose: function(dest) {
     var n11 = dest.n11, n12 = dest.n12, n13 = dest.n13, n14 = dest.n14,
         n21 = dest.n21, n22 = dest.n22, n23 = dest.n23, n24 = dest.n24,
         n31 = dest.n31, n32 = dest.n32, n33 = dest.n33, n34 = dest.n34,
         n41 = dest.n41, n42 = dest.n42, n43 = dest.n43, n44 = dest.n44;
     
     return new Mat4(n11, n21, n31, n41,
                     n12, n22, n32, n42,
                     n13, n23, n33, n43,
                     n14, n24, n34, n44);
   },

   $transpose: function(dest) {
     var n11 = dest.n11, n12 = dest.n12, n13 = dest.n13, n14 = dest.n14,
         n21 = dest.n21, n22 = dest.n22, n23 = dest.n23, n24 = dest.n24,
         n31 = dest.n31, n32 = dest.n32, n33 = dest.n33, n34 = dest.n34,
         n41 = dest.n41, n42 = dest.n42, n43 = dest.n43, n44 = dest.n44;
     
     return Mat4.set(dest, n11, n21, n31, n41,
              n12, n22, n32, n42,
              n13, n23, n33, n43,
              n14, n24, n34, n44);
   },

   rotateAxis: function(dest, theta, vec) {
     var s = sin(theta), c = cos(theta), nc = 1 - c,
         vx = vec.x, vy = vec.y, vz = vec.z,
         m = new Mat4(vx * vx * nc + c, vx * vy * nc - vz * s, vx * vz * nc + vy * s, 0,
                      vy * vx * nc + vz * s, vy * vy * nc + c, vy * vz * nc - vx * s, 0,
                      vx * vz * nc - vy * s, vy * vz * nc + vx * s, vz * vz * nc + c, 0,
                      0,                    0,                     0,                 1);
     
     return Mat4.mulMat4(dest, m);
   },

   $rotateAxis: function(dest, theta, vec) {
     var s = sin(theta), c = cos(theta), nc = 1 - c,
         vx = vec.x, vy = vec.y, vz = vec.z,
         m = new Mat4(vx * vx * nc + c, vx * vy * nc - vz * s, vx * vz * nc + vy * s, 0,
                      vy * vx * nc + vz * s, vy * vy * nc + c, vy * vz * nc - vx * s, 0,
                      vx * vz * nc - vy * s, vy * vz * nc + vx * s, vz * vz * nc + c, 0,
                      0,                    0,                     0,                 1);
     
     return Mat4.$mulMat4(dest, m);
   },

  rotateXYZ: function(dest, rx, ry, rz) {
     var m = new Mat4(cos(ry) * cos(rz), -cos(rx) * sin(rz) + sin(rx) * sin(ry) * cos(rz), sin(rx) * sin(rz) + cos(rx) * sin(ry) * cos(rz), 0,
                      cos(ry) * sin(rz), cos(rx) * cos(rz) + sin(rx) * sin(ry) * sin(rz), -sin(rx) * cos(rz) + cos(rx) * sin(ry) * sin(rz), 0,
                      -sin(ry),          sin(rx) * cos(ry),                               cos(rx) * cos(ry),                                0,
                      0,                 0,                                               0,                                                1);
     
     return Mat4.mulMat4(dest, m);
  },
  
  $rotateXYZ: function(dest, rx, ry, rz) {
     var m = new Mat4(cos(ry) * cos(rz), -cos(rx) * sin(rz) + sin(rx) * sin(ry) * cos(rz), sin(rx) * sin(rz) + cos(rx) * sin(ry) * cos(rz), 0,
                      cos(ry) * sin(rz), cos(rx) * cos(rz) + sin(rx) * sin(ry) * sin(rz), -sin(rx) * cos(rz) + cos(rx) * sin(ry) * sin(rz), 0,
                      -sin(ry),          sin(rx) * cos(ry),                               cos(rx) * cos(ry),                                0,
                      0,                 0,                                               0,                                                1);
     
     return Mat4.$mulMat4(dest, m);
  },

  translate: function(dest, x, y, z) {
     var m = new Mat4(1, 0, 0, x,
                      0, 1, 0, y,
                      0, 0, 1, z,
                      0, 0, 0, 1);
     
     return Mat4.mulMat4(dest, m);
   },
   
   $translate: function(dest, x, y, z) {
     var m = new Mat4(1, 0, 0, x,
                      0, 1, 0, y,
                      0, 0, 1, z,
                      0, 0, 0, 1);
     return Mat4.$mulMat4(dest, m);
   },

   scale: function(dest, x, y, z) {
     var m = new Mat4(x, 0, 0, 0,
                      0, y, 0, 0,
                      0, 0, z, 0,
                      0, 0, 0, 1);
     
     return Mat4.mulMat4(dest, m);
   },

   $scale: function(dest, x, y, z) {
     var m = new Mat4(x, 0, 0, 0,
                      0, y, 0, 0,
                      0, 0, z, 0,
                      0, 0, 0, 1);
     
     return Mat4.$mulMat4(dest, m);
   },
   
   //Method based on PreGL https://github.com/deanm/pregl/ (c) Dean McNamee.
   invert: function(dest) {
     var  ndest = new Mat4(), 
          x0 = dest.n11,  x1 = dest.n12,  x2 = dest.n13,  x3 = dest.n14,
          x4 = dest.n21,  x5 = dest.n22,  x6 = dest.n23,  x7 = dest.n24,
          x8 = dest.n31,  x9 = dest.n32, x10 = dest.n33, x11 = dest.n34,
          x12 = dest.n41, x13 = dest.n42, x14 = dest.n43, x15 = dest.n44;

     var a0 = x0*x5 - x1*x4,
         a1 = x0*x6 - x2*x4,
         a2 = x0*x7 - x3*x4,
         a3 = x1*x6 - x2*x5,
         a4 = x1*x7 - x3*x5,
         a5 = x2*x7 - x3*x6,
         b0 = x8*x13 - x9*x12,
         b1 = x8*x14 - x10*x12,
         b2 = x8*x15 - x11*x12,
         b3 = x9*x14 - x10*x13,
         b4 = x9*x15 - x11*x13,
         b5 = x10*x15 - x11*x14;

     var invdet = 1 / (a0*b5 - a1*b4 + a2*b3 + a3*b2 - a4*b1 + a5*b0);

     ndest.n11 = (+ x5*b5 - x6*b4 + x7*b3) * invdet;
     ndest.n12 = (- x1*b5 + x2*b4 - x3*b3) * invdet;
     ndest.n13 = (+ x13*a5 - x14*a4 + x15*a3) * invdet;
     ndest.n14 = (- x9*a5 + x10*a4 - x11*a3) * invdet;
     ndest.n21 = (- x4*b5 + x6*b2 - x7*b1) * invdet;
     ndest.n22 = (+ x0*b5 - x2*b2 + x3*b1) * invdet;
     ndest.n23 = (- x12*a5 + x14*a2 - x15*a1) * invdet;
     ndest.n24 = (+ x8*a5 - x10*a2 + x11*a1) * invdet;
     ndest.n31 = (+ x4*b4 - x5*b2 + x7*b0) * invdet;
     ndest.n32 = (- x0*b4 + x1*b2 - x3*b0) * invdet;
     ndest.n33 = (+ x12*a4 - x13*a2 + x15*a0) * invdet;
     ndest.n34 = (- x8*a4 + x9*a2 - x11*a0) * invdet;
     ndest.n41 = (- x4*b3 + x5*b1 - x6*b0) * invdet;
     ndest.n42 = (+ x0*b3 - x1*b1 + x2*b0) * invdet;
     ndest.n43 = (- x12*a3 + x13*a1 - x14*a0) * invdet;
     ndest.n44 = (+ x8*a3 - x9*a1 + x10*a0) * invdet;

     return ndest;
   },

  $invert: function(dest) {
     var  x0 = dest.n11,  x1 = dest.n12,  x2 = dest.n13,  x3 = dest.n14,
          x4 = dest.n21,  x5 = dest.n22,  x6 = dest.n23,  x7 = dest.n24,
          x8 = dest.n31,  x9 = dest.n32, x10 = dest.n33, x11 = dest.n34,
          x12 = dest.n41, x13 = dest.n42, x14 = dest.n43, x15 = dest.n44;

     var a0 = x0*x5 - x1*x4,
         a1 = x0*x6 - x2*x4,
         a2 = x0*x7 - x3*x4,
         a3 = x1*x6 - x2*x5,
         a4 = x1*x7 - x3*x5,
         a5 = x2*x7 - x3*x6,
         b0 = x8*x13 - x9*x12,
         b1 = x8*x14 - x10*x12,
         b2 = x8*x15 - x11*x12,
         b3 = x9*x14 - x10*x13,
         b4 = x9*x15 - x11*x13,
         b5 = x10*x15 - x11*x14;

     var invdet = 1 / (a0*b5 - a1*b4 + a2*b3 + a3*b2 - a4*b1 + a5*b0);

     dest.n11 = (+ x5*b5 - x6*b4 + x7*b3) * invdet;
     dest.n12 = (- x1*b5 + x2*b4 - x3*b3) * invdet;
     dest.n13 = (+ x13*a5 - x14*a4 + x15*a3) * invdet;
     dest.n14 = (- x9*a5 + x10*a4 - x11*a3) * invdet;
     dest.n21 = (- x4*b5 + x6*b2 - x7*b1) * invdet;
     dest.n22 = (+ x0*b5 - x2*b2 + x3*b1) * invdet;
     dest.n23 = (- x12*a5 + x14*a2 - x15*a1) * invdet;
     dest.n24 = (+ x8*a5 - x10*a2 + x11*a1) * invdet;
     dest.n31 = (+ x4*b4 - x5*b2 + x7*b0) * invdet;
     dest.n32 = (- x0*b4 + x1*b2 - x3*b0) * invdet;
     dest.n33 = (+ x12*a4 - x13*a2 + x15*a0) * invdet;
     dest.n34 = (- x8*a4 + x9*a2 - x11*a0) * invdet;
     dest.n41 = (- x4*b3 + x5*b1 - x6*b0) * invdet;
     dest.n42 = (+ x0*b3 - x1*b1 + x2*b0) * invdet;
     dest.n43 = (- x12*a3 + x13*a1 - x14*a0) * invdet;
     dest.n44 = (+ x8*a3 - x9*a1 + x10*a0) * invdet;

     return dest;
   
   },
    //TODO(nico) breaking convention here... 
    //because I don't think it's useful to add
    //two methods for each of these.
   lookAt: function(dest, eye, center, up) {
     var z = Vec3.sub(eye, center);
     z.$unit();
     var x = Vec3.cross(up, z);
     x.$unit();
     var y = Vec3.cross(z, x);
     y.$unit();
     return Mat4.set(dest, x.x, x.y, x.z, -x.dot(eye),
              y.x, y.y, y.z, -y.dot(eye),
              z.x, z.y, z.z, -z.dot(eye),
              0,   0,   0,   1);
   },

   frustum: function(dest, left, right, bottom, top, near, far) {
     var x = 2 * near / (right - left),
         y = 2 * near / (top - bottom),
         a = (right + left) / (right - left),
         b = (top + bottom) / (top - bottom),
         c = - (far + near) / (far - near),
         d = -2 * far * near / (far - near);
     
     return Mat4.set(dest, x, 0, a, 0,
                           0, y, b, 0,
                           0, 0, c, d,
                           0, 0, -1,0);

   },

   perspective: function(dest, fov, aspect, near, far) {
     var ymax = near * tan(fov * pi / 360),
         ymin = -ymax,
         xmin = ymin * aspect,
         xmax = ymax * aspect;
     
     return Mat4.frustum(dest, xmin, xmax, ymin, ymax, near, far);
   },
   
   ortho: function(dest, left, right, bottom, top, near, far) {
      var w = right - left,
          h = top - bottom,
          p = far - near,
          x = (right + left) / w,
          y = (top + bottom) / h,
          z = (far + near) / p,
          w2 =  2 / w,
          h2 =  2 / h,
          p2 = -2 / p;
     
     return Mat4.set(dest, w2, 0, 0, -x,
                           0, h2, 0, -y,
                           0, 0, p2, -z,
                           0, 0,  0,  1);
   },

   toFloat32Array: function(dest) {
     return new Float32Array([dest.n11, dest.n21, dest.n31, dest.n41,
                              dest.n12, dest.n22, dest.n32, dest.n42,
                              dest.n13, dest.n23, dest.n33, dest.n43,
                              dest.n14, dest.n24, dest.n34, dest.n44]);
   }
 };
  //add generics and instance methods
  proto = Mat4.prototype = {};
  for (method in generics) {
    Mat4[method] = generics[method];
    proto[method] = (function (m) {
      return function() {
        var args = slice.call(arguments);
        
        args.unshift(this);
        return Mat4[m].apply(Mat4, args);
      };
   })(method);
  }

  //Quaternion class
  var Quat = function(x, y, z, w) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.w = w || 0;
  };

  generics = {

    setQuat: function(dest, q) {
      dest.x = q.x;
      dest.y = q.y;
      dest.z = q.z;
      dest.w = q.w;

      return dest;
    },

    set: function(dest, x, y, z, w) {
      dest.x = x || 0;
      dest.y = y || 0;
      dest.z = z || 0;
      dest.w = w || 0;

      return dest;
    },
    
    clone: function(dest) {
      return new Quat(dest.x, dest.y, dest.z, dest.w);
    },

    neg: function(dest) {
      return new Quat(-dest.x, -dest.y, -dest.z, -dest.w);
    },

    $neg: function(dest) {
      dest.x = -dest.x;
      dest.y = -dest.y;
      dest.z = -dest.z;
      dest.w = -dest.w;
      
      return dest;
    },

    add: function(dest, q) {
      return new Quat(dest.x + q.x,
                      dest.y + q.y,
                      dest.z + q.z,
                      dest.w + q.w);
    },

    $add: function(dest, q) {
      dest.x += q.x;
      dest.y += q.y;
      dest.z += q.z;
      dest.w += q.w;
      
      return dest;
    },

    sub: function(dest, q) {
      return new Quat(dest.x - q.x,
                      dest.y - q.y,
                      dest.z - q.z,
                      dest.w - q.w);
    },

    $sub: function(dest, q) {
      dest.x -= q.x;
      dest.y -= q.y;
      dest.z -= q.z;
      dest.w -= q.w;
      
      return dest;
    },

    scale: function(dest, s) {
      return new Quat(dest.x * s,
                      dest.y * s,
                      dest.z * s,
                      dest.w * s);
    },

    $scale: function(dest, s) {
      dest.x *= s;
      dest.y *= s;
      dest.z *= s;
      dest.w *= s;
      
      return dest;
    },

    mulQuat: function(dest, q) {
      var aX = dest.x,
          aY = dest.y,
          aZ = dest.z,
          aW = dest.w,
          bX = q.x,
          bY = q.y,
          bZ = q.z,
          bW = q.w;

      return new Quat(aW * bX + aX * bW + aY * bZ - aZ * bY,
                      aW * bY + aY * bW + aZ * bX - aX * bZ,
                      aW * bZ + aZ * bW + aX * bY - aY * bX,
                      aW * bW - aX * bX - aY * bY - aZ * bZ);
    },

    $mulQuat: function(dest, q) {
      var aX = dest.x,
          aY = dest.y,
          aZ = dest.z,
          aW = dest.w,
          bX = q.x,
          bY = q.y,
          bZ = q.z,
          bW = q.w;

      dest.a = aW * bX + aX * bW + aY * bZ - aZ * bY;
      dest.b = aW * bY + aY * bW + aZ * bX - aX * bZ;
      dest.c = aW * bZ + aZ * bW + aX * bY - aY * bX;
      dest.d = aW * bW - aX * bX - aY * bY - aZ * bZ;

      return dest;
    },

    divQuat: function(dest, q) {
      var aX = dest.x,
          aY = dest.y,
          aZ = dest.z,
          aW = dest.w,
          bX = q.x,
          bY = q.y,
          bZ = q.z,
          bW = q.w;

      var d = 1 / (bW * bW + bX * bX + bY * bY + bZ * bZ);
      
      return new Quat((aX * bW - aW * bX - aY * bZ + aZ * bY) * d,
                      (aX * bZ - aW * bY + aY * bW - aZ * bX) * d,
                      (aY * bX + aZ * bW - aW * bZ - aX * bY) * d,
                      (aW * bW + aX * bX + aY * bY + aZ * bZ) * d);
    },

    $divQuat: function(dest, q) {
      var aX = dest.x,
          aY = dest.y,
          aZ = dest.z,
          aW = dest.w,
          bX = q.x,
          bY = q.y,
          bZ = q.z,
          bW = q.w;

      var d = 1 / (bW * bW + bX * bX + bY * bY + bZ * bZ);
      
      dest.a = (aX * bW - aW * bX - aY * bZ + aZ * bY) * d;
      dest.b = (aX * bZ - aW * bY + aY * bW - aZ * bX) * d;
      dest.c = (aY * bX + aZ * bW - aW * bZ - aX * bY) * d;
      dest.d = (aW * bW + aX * bX + aY * bY + aZ * bZ) * d;

      return dest;
    },

    invert: function(dest) {
      var q0 = dest.x,
          q1 = dest.y,
          q2 = dest.z,
          q3 = dest.w;

      var d = 1 / (q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);
      
      return new Quat(-q0 * d, -q1 * d, -q2 * d, q3 * d);
    },

    $invert: function(dest) {
      var q0 = dest.x,
          q1 = dest.y,
          q2 = dest.z,
          q3 = dest.w;

      var d = 1 / (q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);

      dest.a = -q0 * d;
      dest.b = -q1 * d;
      dest.c = -q2 * d;
      dest.d =  q3 * d;
      
      return dest;
    },

    norm: function(dest) {
      var a = dest.x,
          b = dest.y,
          c = dest.z,
          d = dest.w;

      return sqrt(a * a + b * b + c * c + d * d);
    },

    normSq: function(dest) {
      var a = dest.x,
          b = dest.y,
          c = dest.z,
          d = dest.w;

      return a * a + b * b + c * c + d * d;
    },

    unit: function(dest) {
      return Quat.scale(dest, 1 / Quat.norm(dest));
    },

    $unit: function(dest) {
      return Quat.$scale(dest, 1 / Quat.norm(dest));
    },

    conjugate: function(dest) {
      return new Quat(-dest.x,
                      -dest.y,
                      -dest.z,
                       dest.w);
    },

    $conjugate: function(dest) {
      dest.x = -dest.x;
      dest.y = -dest.y;
      dest.z = -dest.z;
      
      return dest;
    }
  };
  //add generics and instance methods
  proto = Quat.prototype = {};
  for (method in generics) {
    Quat[method] = generics[method];
    proto[method] = (function (m) {
      return function() {
        var args = slice.call(arguments);
        
        args.unshift(this);
        return Quat[m].apply(Quat, args);
      };
   })(method);
  }
  
  //Add static methods
  Vec3.fromQuat = function(q) {
    return new Vec3(q.x, q.y, q.z);
  };

  Quat.fromVec3 = function(v, r) {
    return new Quat(v.x, v.y, v.z, r || 0);
  };

  Quat.fromMat4 = function(m) {
    var u;
    var v;
    var w;

    // Choose u, v, and w such that u is the index of the biggest diagonal entry
    // of m, and u v w is an even permutation of 0 1 and 2.
    if (m.n11 > m.n22 && m.n11 > m.n33) {
      u = 0;
      v = 1;
      w = 2;
    } else if (m.n22 > m.n11 && m.n22 > m.n33) {
      u = 1;
      v = 2;
      w = 0;
    } else {
      u = 2;
      v = 0;
      w = 1;
    }

    var r = sqrt(1 + m['n' + u + '' + u] - m['n' + v + '' + v] - m['n' + w + '' + w]);
    var q = new Quat,
        props = ['x', 'y', 'z'];
    
    q[props[u]] = 0.5 * r;
    q[props[v]] = 0.5 * (m['n' + v + '' + u] + m['n' + u + '' + v]) / r;
    q[props[w]] = 0.5 * (m['n' + u + '' + w] + m['n' + w + '' + u]) / r;
    q.w =         0.5 * (m['n' + v + '' + w] - m['n' + w + '' + v]) / r;

    return q;
  };
  
  Quat.fromXRotation = function(angle) {
    return new Quat(sin(angle / 2), 0, 0, cos(angle / 2));
  };

  Quat.fromYRotation = function(angle) {
    return new Quat(0, sin(angle / 2), 0, cos(angle / 2));
  };

  Quat.fromZRotation = function(angle) {
    return new Quat(0, 0, sin(angle / 2), cos(angle / 2));
  };

  Quat.fromAxisRotation = function(vec, angle) {
    var x = vec.x,
        y = vec.y,
        z = vec.z,
        d = 1 / sqrt(x * x + y * y + z * z),
        s = sin(angle / 2),
        c = cos(angle / 2);

    return new Quat(s * x * d,
                    s * y * d,
                    s * z * d,
                    c);
  };
  
  Mat4.fromQuat = function(q) {
    var a = q.w,
        b = q.x,
        c = q.y,
        d = q.z;
    
    return new Mat4(a * a + b * b - c * c - d * d, 2 * b * c - 2 * a * d, 2 * b * d + 2 * a * c, 0,
                    2 * b * c + 2 * a * d, a * a - b * b + c * c - d * d, 2 * c * d - 2 * a * b, 0,
                    2 * b * d - 2 * a * c, 2 * c * d + 2 * a * b, a * a - b * b - c * c + d * d, 0,
                    0,                     0,                     0,                             1);
  };

  PhiloGL.Vec3 = Vec3;
  PhiloGL.Mat4 = Mat4;
  PhiloGL.Quat = Quat;

})();


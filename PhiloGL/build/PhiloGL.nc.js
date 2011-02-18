/**
@preserve
Copyright (c) 2011 Sencha Inc. - Author: Nicolas Garcia Belmonte (http://philogb.github.com/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
(function() { 
//core.js
//Provides general utility methods, module unpacking methods and the PhiloGL app creation method.

//Global
this.PhiloGL = null;

//Creates a single application object asynchronously
//with a gl context, a camera, a program, a scene, and an event system.
(function () {
  PhiloGL = function(canvasId, opt) {
    opt = $.merge({
      context: {
        /* 
         debug: true 
        */
      },
      camera: {
        fov: 45,
        near: 0.1,
        far: 500
      },
      program: {
        from: 'defaults', //(defaults|ids|sources|uris)
        vs: 'Default',
        fs: 'Default'
      },
      scene: {
        /*
         All the scene.js options:
         lights: { ... }
        */
      },
      textures: {
        src: []
      },
      events: {
        /*
         All the events.js options:
         onClick: fn,
         onTouchStart: fn...
        */
      },
      onLoad: $.empty,
      onError: $.empty

    }, opt || {});
    
    var optContext = opt.context,
        optCamera = opt.camera,
        optEvents = opt.events,
        optTextures = opt.textures,
        optProgram = opt.program,
        pfrom = optProgram.from,
        optScene = opt.scene;
    
    //get Context
    gl = PhiloGL.WebGL.getContext(canvasId, optContext);

    if (!gl) {
        opt.onError();
        return null;
    }

    //get Program
    var popt = {
      'defaults': 'fromDefaultShaders',
      'ids': 'fromShaderIds',
      'sources': 'fromShaderSources',
      'uris': 'fromShaderURIs'
    };

    for (var p in popt) {
      if (pfrom == p) {
        program = PhiloGL.Program[popt[p]]($.extend({
          onSuccess: function(p) {
            loadProgramDeps(gl, p, function(app) {
              opt.onLoad(app); 
            });
          },
          onError: function(e) {
            opt.onError(e);
          }
        }, optProgram));
        break;
      }
    }

    if (program) {
      loadProgramDeps(gl, program, function(app) {
        opt.onLoad(app);
      });
    }

    function loadProgramDeps(gl, program, callback) {
      //Use program
      program.use();
      
      //get Camera
      var canvas = gl.canvas,
          camera = new PhiloGL.Camera(optCamera.fov, 
                                      canvas.width / canvas.height, 
                                      optCamera.near, 
                                      optCamera.far, optCamera);
      camera.update();
      
      //get Scene
      var scene = new PhiloGL.Scene(program, camera, optScene);
      
      //make app object
      var app = {
        '$$family': 'app',
        gl: gl,
        canvas: canvas,
        program: program,
        scene: scene,
        camera: camera
      };

      //get Events
      if (optEvents) {
        PhiloGL.Events.create(canvas, $.extend(optEvents, {
          bind: app
        }));
      }

      //load Textures
      if (optTextures.src.length) {
        new PhiloGL.IO.Textures(program, $.extend(optTextures, {
          onComplete: function() {
            callback(app);
          }
        }));
      } else {
        callback(app);
      }
    }
  };

})();


//Unpacks the submodules to the global space.
PhiloGL.unpack = function(global) {
  ['Vec3', 'Mat4', 'Camera', 'Program', 'WebGL', 'O3D', 'Scene', 'Shaders', 'IO', 'Events', 'WorkerGroup', 'Fx'].forEach(function(module) {
      window[module] = PhiloGL[module];
  });
};

//Version
PhiloGL.version = '1.0.1';

//Holds the 3D context
var gl;


//Utility functions
function $(d) {
  return document.getElementById(d);
}

$.empty = function() {};

//TODO(nico): check for mozAnimationTime implementations
$.time = Date.now || function() {
  return +new Date;
};

$.extend = function(to, from) {
  for (var p in from) {
    to[p] = from[p];
  }
  return to;
};

$.type = (function() {
  var oString = Object.prototype.toString,
      re = /^\[object\s(.*)\]$/,
      type = function(e) { return oString.call(e).match(re)[1].toLowerCase(); };
  
  return function(elem) {
    var elemType = type(elem);
    if (elemType != 'object') {
      return elemType;
    }
    if (elem.$$family) return elem.$$family;
    return (elem && elem.nodeName && elem.nodeType == 1)? 'element' : elemType;
  };
})();

(function() {
  function detach(elem) {
    var type = $.type(elem), ans;
    if (type == 'object') {
      ans = {};
      for (var p in elem) {
        ans[p] = detach(elem[p]);
      }
      return ans;
    } else if (type == 'array') {
      ans = [];
      for (var i = 0, l = elem.length; i < l; i++) {
        ans[i] = detach(elem[i]);
      }
      return ans;
    } else {
      return elem;
    }
  }

  $.merge = function() {
    var mix = {};
    for (var i = 0, l = arguments.length; i < l; i++){
        var object = arguments[i];
        if ($.type(object) != 'object') continue;
        for (var key in object){
            var op = object[key], mp = mix[key];
            if (mp && $.type(op) == 'object' && $.type(mp) == 'object') {
              mix[key] = $.merge(mp, op);
            } else{
              mix[key] = detach(op);
            }
        }
    }
    return mix;
  };
})();

$.splat = (function() {
  var isArray = Array.isArray;
  return function(a) {
    return isArray(a) && a || [a];
  };
})();


//math.js
//Vec3 and Mat4 classes

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
      
      return sqrt(dx * dx,
                  dy * dy,
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

  
  PhiloGL.Vec3 = Vec3;
  PhiloGL.Mat4 = Mat4;

})();


//event.js
//Handle keyboard/mouse/touch events in the Canvas

(function() {
  
  //Returns an element position
  var getPos = function(elem) {
    var offset = getOffsets(elem);
    var scroll = getScrolls(elem);
    return {
      x: offset.x - scroll.x,
      y: offset.y - scroll.y
    };

    function getOffsets(elem) {
      var position = {
        x: 0,
        y: 0
      };
      while (elem && !isBody(elem)) {
        position.x += elem.offsetLeft;
        position.y += elem.offsetTop;
        elem = elem.offsetParent;
      }
      return position;
    }

    function getScrolls(elem) {
      var position = {
        x: 0,
        y: 0
      };
      while (elem && !isBody(elem)) {
        position.x += elem.scrollLeft;
        position.y += elem.scrollTop;
        elem = elem.parentNode;
      }
      return position;
    }

    function isBody(element) {
      return (/^(?:body|html)$/i).test(element.tagName);
    }
  };

  //event object wrapper
  var event = {
    get: function(e, win) {
      win = win || window;
      return e || win.event;
    },
    getWheel: function(e) {
      return e.wheelDelta? e.wheelDelta / 120 : -(e.detail || 0) / 3;
    },
    getKey: function(e) {
      var code = e.which || e.keyCode;
      var key = keyOf(code);
      //onkeydown
      var fKey = code - 111;
      if (fKey > 0 && fKey < 13) key = 'f' + fKey;
      key = key || String.fromCharCode(code).toLowerCase();
      
      return {
        code: code,
        key: key,
        shift: e.shiftKey,
        control: e.ctrlKey,
        alt: e.altKey,
        meta: e.metaKey
      };
    },
    isRightClick: function(e) {
      return (e.which == 3 || e.button == 2);
    },
    getPos: function(e, win) {
      // get mouse position
      win = win || window;
      e = e || win.event;
      var doc = win.document;
      doc = doc.documentElement || doc.body;
      //TODO(nico): make touch event handling better
      if(e.touches && e.touches.length) {
        e = e.touches[0];
      }
      var page = {
        x: e.pageX || (e.clientX + doc.scrollLeft),
        y: e.pageY || (e.clientY + doc.scrollTop)
      };
      return page;
    },
    stop: function(e) {
      if (e.stopPropagation) e.stopPropagation();
      e.cancelBubble = true;
      if (e.preventDefault) e.preventDefault();
      else e.returnValue = false;
    }
  };

  var EventsProxy = function(domElem, opt) {
    this.domElem = domElem;
    this.pos = getPos(domElem);
    this.opt = this.callbacks = opt;

    this.size = {
      width: domElem.width || domElem.offsetWidth,
      height: domElem.height || domElem.offsetHeight
    };

    this.attachEvents();
  };
  
  EventsProxy.prototype = {
    hovered: false,
    pressed: false,
    touched: false,

    touchMoved: false,
    moved: false,
    
    attachEvents: function() {
      var domElem = this.domElem,
          opt = this.opt,
          that = this;
      
      if (opt.disableContextMenu) {
        domElem.oncontextmenu = function() { return false; };
      }
      
      ['mouseup', 'mousedown', 'mousemove', 'mouseover', 'mouseout', 
       'touchstart', 'touchmove', 'touchend'].forEach(function(action) {
        domElem.addEventListener(action, function(e, win) {
          that[action](that.eventInfo(action, e, win));
        }, false);
      });
      
       ['keydown', 'keyup'].forEach(function(action) {
        document.addEventListener(action, function(e, win) {
          that[action](that.eventInfo(action, e, win));
        }, false);
      });

      //"well, this is embarrassing..."
      var type = '';
      if (!document.getBoxObjectFor && window.mozInnerScreenX == null) {
        type = 'mousewheel';
      } else {
        type = 'DOMMouseScroll';
      }
      domElem.addEventListener(type, function(e, win) {
        that['mousewheel'](that.eventInfo('mousewheel', e, win));
      }, false);
    },
    
    eventInfo: function(type, e, win) {
      var domElem = this.domElem,
          opt = this.opt,
          size = this.getSize(),
          relative = opt.relative,
          centerOrigin = opt.centerOrigin,
          pos = opt.cachePosition && this.pos || getPos(domElem),
          ge = event.get(e, win),
          epos = event.getPos(e, win),
          evt = {};

      //get Position
      var x = epos.x, y = epos.y;
      if (relative) {
        x -= pos.x; y-= pos.y;
        if (centerOrigin) {
          x -= size.width / 2;
          y -= size.height / 2;
          y *= -1; //y axis now points to the top of the screen
        }
      }

      switch (type) {
        case 'mousewheel':
          evt.wheel = event.getWheel(ge);
          break;
        case 'keydown':
          $.extend(evt, event.getKey(ge));
          break;
        case 'mouseup':
          evt.isRightClick = event.isRightClick(ge);
          break;
      }

      $.extend(evt, {
        x: x,
        y: y,
        stop: function() {
          event.stop(ge);
        }
      });
      //wrap native event
      evt.event = ge;
      
      return evt;
    },

    getSize: function() {
      if (this.cacheSize) {
        return this.size;
      }
      var domElem = this.domElem;
      return {
        width: domElem.width || domElem.offsetWidth,
        height: domElem.height || domElem.offsetHeight
      };
    },
    
    mouseup: function(e) {
      if(!this.moved) {
        if(e.isRightClick) {
          this.callbacks.onRightClick(e, this.hovered);
        } else {
          this.callbacks.onClick(e, this.pressed);
        }
      }
      if(this.pressed) {
        if(this.moved) {
          this.callbacks.onDragEnd(e, this.pressed);
        } else {
          this.callbacks.onDragCancel(e, this.pressed);
        }
        this.pressed = this.moved = false;
      }
    },

    mouseout: function(e) {
      //mouseout canvas
      var rt = e.relatedTarget,
          domElem = this.domElem;
      while(rt && rt.parentNode) {
        if(domElem == rt.parentNode) return;
        rt = rt.parentNode;
      }
      if(this.hovered) {
        this.callbacks.onMouseLeave(e, this.hovered);
        this.hovered = false;
      }
    },
    
    mouseover: function(e) {},
    
    mousemove: function(e) {
      if(this.pressed) {
        this.moved = true;
        this.callbacks.onDragMove(e, this.pressed);
        return;
      }
      this.callbacks.onMouseMove(e, false);
    },
    
    mousewheel: function(e) {
      this.callbacks.onMouseWheel(e);
    },
    
    mousedown: function(e) {
      this.pressed = true;
      this.callbacks.onDragStart(e, this.pressed);
    },
    
    touchstart: function(e) {
      this.touched = true;
      this.callbacks.onTouchStart(e, this.touched);
    },
    
    touchmove: function(e) {
      if(this.touched) {
        this.touchMoved = true;
        this.callbacks.onTouchMove(e, this.touched);
      }
    },
    
    touchend: function(e) {
      if(this.touched) {
        if(this.touchMoved) {
          this.callbacks.onTouchEnd(e, this.touched);
        } else {
          this.callbacks.onTouchCancel(e, this.touched);
        }
        this.touched = this.touchMoved = false;
      }
    },

    keydown: function(e) {
      this.callbacks.onKeyDown(e);
    },

    keyup: function(e) {
      this.callbacks.onKeyUp(e);
    }
  };
    
  var Events = {};

  Events.create = function(domElem, opt) {
    opt = $.merge({
      cachePosition: true,
      cacheSize: true,
      relative: true,
      centerOrigin: true,
      disableContextMenu: true,
      bind: false,
      
      onClick: $.empty,
      onRightClick: $.empty,
      onDragStart: $.empty,
      onDragMove: $.empty,
      onDragEnd: $.empty,
      onDragCancel: $.empty,
      onTouchStart: $.empty,
      onTouchMove: $.empty,
      onTouchEnd: $.empty,
      onTouchCancel: $.empty,
      onMouseMove: $.empty,
      onMouseEnter: $.empty,
      onMouseLeave: $.empty,
      onMouseWheel: $.empty,
      onKeyDown: $.empty,
      onKeyUp: $.empty
      
    }, opt || {});

    var bind = opt.bind;

    if (bind) {
      for (var name in opt) {
        if (name.match(/^on[a-zA-Z0-9]+$/)) {
          (function (name, fn) {
            opt[name] = function() {
              return fn.apply(bind, Array.prototype.slice.call(arguments));
            };
          })(name, opt[name]);
        }
      }
    }

    new EventsProxy(domElem, opt);
  };

  Events.Keys = {
	'enter': 13,
	'up': 38,
	'down': 40,
	'left': 37,
	'right': 39,
	'esc': 27,
	'space': 32,
	'backspace': 8,
	'tab': 9,
	'delete': 46
  };

  function keyOf(code) {
    var keyMap = Events.Keys;
    for (var name in keyMap) {
      if (keyMap[name] == code) {
        return name;
      }
    }
  }

  PhiloGL.Events = Events;
    
})();

//program.js
//Creates programs out of shaders and provides convenient methods for loading
//buffers attributes and uniforms

(function() {
  //First, some privates to handle compiling/linking shaders to programs.
  
  //Creates a shader from a string source.
  var createShader = function(gl, shaderSource, shaderType) {
    var shader = gl.createShader(shaderType);
    if (shader == null) {
      throw "Error creating the shader with shader type: " + shaderType;
      //return false;
    }
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      gl.deleteShader(shader);
      throw "Error while compiling the shader " + gl.getShaderInfoLog(shader);
      //return false;
    }
    return shader;
  };
  
  //Creates a program from vertex and fragment shader sources.
  var createProgram = function(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(
        program,
        createShader(gl, vertexShader, gl.VERTEX_SHADER));
    gl.attachShader(
        program,
        createShader(gl, fragmentShader,  gl.FRAGMENT_SHADER));
    linkProgram(gl, program);
    return program;
  };
  
  //Link a program.
  var linkProgram = function(gl, program) {
    gl.linkProgram(program);
    var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      throw "Error linking the shader: " + gl.getProgramInfoLog(program);
      //return false;
    }
    return true;
  };

  //Returns a Magic Uniform Setter
  var getUniformSetter = function(program, info) {
    var loc = gl.getUniformLocation(program, info.name),
        type = info.type;
    
    switch (type) {
      case gl.FLOAT:
        return function(val) { gl.uniform1f(loc, val); };
      case gl.FLOAT_VEC2:
        return function(val) { gl.uniform2fv(loc, new Float32Array(val)); };
      case gl.FLOAT_VEC3:
        return function(val) { gl.uniform3fv(loc, new Float32Array(val)); };
      case gl.FLOAT_VEC4:
        return function(val) { gl.uniform4fv(loc, new Float32Array(val)); };
      case gl.INT: case gl.BOOL: case gl.SAMPLER_2D: case gl.SAMPLER_CUBE:
        return function(val) { gl.uniform1i(loc, val); };
      case gl.INT_VEC2: case gl.BOOL_VEC2:
        return function(val) { gl.uniform2iv(loc, new Uint16Array(val)); };
      case gl.INT_VEC3: case gl.BOOL_VEC3:
        return function(val) { gl.uniform3iv(loc, new Uint16Array(val)); };
      case gl.INT_VEC4: case gl.BOOL_VEC4:
        return function(val) { gl.uniform4iv(loc, new Uint16Array(val)); };
      case gl.FLOAT_MAT2:
        return function(val) { gl.uniformMatrix2fv(loc, false, val.toFloat32Array()); };
      case gl.FLOAT_MAT3:
        return function(val) { gl.uniformMatrix3fv(loc, false, val.toFloat32Array()); };
      case gl.FLOAT_MAT4:
        return function(val) { gl.uniformMatrix4fv(loc, false, val.toFloat32Array()); };
    }
    throw "Unknown type: " + type;
  };

  //Program Class: Handles loading of programs and mapping of attributes and uniforms
  var Program = function(vertexShader, fragmentShader) {
    var program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return false;
    
    var buffers = {},
        frameBuffers = {},
        renderBuffers = {},
        attributes = {},
        uniforms = {},
        textures = {};
  
    //fill attribute locations
    var len = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < len; i++) {
      var info = gl.getActiveAttrib(program, i),
          name = info.name,
          index = gl.getAttribLocation(program, info.name);
      attributes[name] = index;
    }
    
    //create uniform setters
    len = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (i = 0; i < len; i++) {
      info = gl.getActiveUniform(program, i);
      name = info.name;
      uniforms[name] = getUniformSetter(program, info);
    }

    this.program = program;
    //handle attributes and uniforms
    this.attributes = attributes;
    this.uniforms = uniforms;
    //handle buffers
    this.buffers = buffers;
    this.bufferMemo = {};
    //handle framebuffers
    this.frameBuffers = frameBuffers;
    this.frameBufferMemo = {};
    //handle framebuffers
    this.renderBuffers = renderBuffers;
    this.renderBufferMemo = {};
    //handle textures
    this.textures = textures;
    this.textureMemo = {};
  };

  Program.prototype = {
    
    '$$family': 'program',

    setState: function(program) {
      $.extend(program, {
        buffers: this.buffers,
        bufferMemo: this.bufferMemo,
        renderBuffers: this.renderBuffers,
        renderBufferMemo: this.renderBufferMemo,
        frameBuffers: this.frameBuffers,
        frameBufferMemo: this.frameBufferMemo,
        textures: this.textures,
        textureMemo: this.textureMemo
      });
      return this;
    },
    
    setUniform: function(name, val) {
      if (this.uniforms[name])
        this.uniforms[name](val);
      return this;
    },

    setUniforms: function(obj) {
      for (var name in obj) {
        this.uniforms[name](obj[name]);
        //this.setUniform(name, obj[name]);
      }
      return this;
    },

    setBuffer: function(name, opt) {
      //set defaults
      opt = $.merge({
        bufferType: gl.ARRAY_BUFFER,
        size: 1,
        dataType: gl.FLOAT,
        stride: 0,
        offset: 0,
        drawType: gl.STATIC_DRAW
      }, this.bufferMemo[name] || {}, opt || {});

      var attributeName = opt.attribute || name,
          bufferType = opt.bufferType,
          hasBuffer = name in this.buffers,
          buffer = hasBuffer? this.buffers[name] : gl.createBuffer(),
          hasValue = 'value' in opt,
          value = opt.value,
          size = opt.size,
          dataType = opt.dataType,
          stride = opt.stride,
          offset = opt.offset,
          drawType = opt.drawType,
          loc = this.attributes[attributeName],
          isAttribute = loc !== undefined;

      if (!hasBuffer) {
        this.buffers[name] = buffer;
        isAttribute && gl.enableVertexAttribArray(loc);
      }
      
      gl.bindBuffer(bufferType, buffer);
      
      if (hasValue) {
        gl.bufferData(bufferType, value, drawType);
      }
      
      isAttribute && gl.vertexAttribPointer(loc, size, dataType, false, stride, offset);
      
      //set default options so we don't have to next time.
      delete opt.value;
      this.bufferMemo[name] = opt;

      return this;
    },

    setBuffers: function(obj) {
      for (var name in obj) {
        this.setBuffer(name, obj[name]);
      }
      return this;
    },

    setFrameBuffer: function(name, opt) {
      //bind/unbind framebuffer
      if (typeof opt != 'object') {
        gl.bindFramebuffer(gl.FRAMEBUFFER, opt? this.frameBuffers[name] : null);
        return;
      }
      //get options
      opt = $.merge({
        width: 0,
        height: 0,
        //All texture params
        bindToTexture: false,
        textureOptions: {
          attachment: gl.COLOR_ATTACHMENT0
        },
        //All render buffer params
        bindToRenderBuffer: false,
        renderBufferOptions: {
          attachment: gl.DEPTH_ATTACHMENT
        }
      }, this.frameBufferMemo[name] || {}, opt || {});
      
      var bindToTexture = opt.bindToTexture,
          bindToRenderBuffer = opt.bindToRenderBuffer,
          hasBuffer = name in this.frameBuffers,
          frameBuffer = hasBuffer? this.frameBuffers[name] : gl.createFramebuffer(gl.FRAMEBUFFER);

      gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

      if (!hasBuffer) {
        this.frameBuffers[name] = frameBuffer;
      }
      
      if (bindToTexture) {
        var texBindOpt = $.merge({
              data: {
                width: opt.width,
                height: opt.height
              }
            }, $.type(bindToTexture) == 'object'? bindToTexture : {}),
            texName = name + '-texture',
            texOpt = opt.textureOptions;
            
        this.setTexture(texName, texBindOpt);
        
        gl.framebufferTexture2D(gl.FRAMEBUFFER, texOpt.attachment, this.textureMemo[texName].textureType, this.textures[texName], 0);
      }

      if (bindToRenderBuffer) {
        var rbBindOpt = $.merge({
              width: opt.width,
              height: opt.height
            }, $.type(bindToRenderBuffer) == 'object'? bindToRenderBuffer : {}),
            rbName = name + '-renderbuffer',
            rbOpt = opt.renderBufferOptions;
        
        this.setRenderBuffer(rbName, rbBindOpt);

        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, rbOpt.attachment, gl.RENDERBUFFER, this.renderBuffers[rbName]);
      }

      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      this.frameBufferMemo[name] = opt;

      return this;
    },

    setFrameBuffers: function(obj) {
      for (var name in obj) {
        this.setFrameBuffer(name, obj[name]);
      }
      return this;
    },

    setRenderBuffer: function(name, opt) {
      if (typeof opt != 'object') {
        gl.bindRenderbuffer(gl.RENDERBUFFER, opt? this.renderBufferMemo[name] : null);
        return;
      }

      opt = $.merge({
        storageType: gl.DEPTH_COMPONENT16,
        width: 0,
        height: 0
      }, this.renderBufferMemo[name] || {}, opt || {});

      var hasBuffer = name in this.renderBuffers,
          renderBuffer = hasBuffer? this.renderBuffers[name] : gl.createRenderbuffer(gl.RENDERBUFFER);

      if (!hasBuffer) {
        this.renderBuffers[name] = renderBuffer;
      }
      
      gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);

      gl.renderbufferStorage(gl.RENDERBUFFER, opt.storageType, opt.width, opt.height);

      this.renderBufferMemo[name] = opt;

      return this;
    },

    setRenderBuffers: function(obj) {
      for (var name in obj) {
        this.setRenderBuffer(name, obj[name]);
      }
      return this;
    },

    setTexture: function(name, opt) {
      //bind texture
      if (!opt || typeof opt != 'object') {
        gl.activeTexture(opt || gl.TEXTURE0);
        gl.bindTexture(this.textureMemo[name].textureType || gl.TEXTURE_2D, this.textures[name]);
        return;
      }
      //get defaults
      opt = $.merge({
        textureType: gl.TEXTURE_2D,
        pixelStore: [{
          name: gl.UNPACK_FLIP_Y_WEBGL,
          value: true
        }],
        parameters: [{
          name: gl.TEXTURE_MAG_FILTER,
          value: gl.NEAREST
        }, {
          name: gl.TEXTURE_MIN_FILTER,
          value: gl.NEAREST
        }],
        data: {
          format: gl.RGBA,
          value: false,
          
          width: 0,
          height: 0,
          border: 0
        }

      }, this.textureMemo[name] || {}, opt || {});

      var textureType = ('textureType' in opt)? opt.textureType : gl.TEXTURE_2D,
          hasTexture = name in this.textures,
          texture = hasTexture? this.textures[name] : gl.createTexture(),
          pixelStore = opt.pixelStore,
          parameters = opt.parameters,
          data = opt.data,
          hasValue = !!opt.data.value;

      //save texture
      if (!hasTexture) {
        this.textures[name] = texture;
      }
      gl.bindTexture(textureType, texture);
      if (!hasTexture) {
        //set texture properties
        pixelStore.forEach(function(opt) {
          opt.name = typeof opt.name == 'string'? gl[opt.name] : opt.name;
          gl.pixelStorei(opt.name, opt.value);
        });
      }
      //load texture
      if (hasValue) {
        gl.texImage2D(textureType, 0, data.format, data.format, gl.UNSIGNED_BYTE, data.value);
      } else if (data.width || data.height) {
        gl.texImage2D(textureType, 0, data.format, data.width, data.height, data.border, data.format, gl.UNSIGNED_BYTE, null);
      }
      //set texture parameters
      if (!hasTexture) {
        parameters.forEach(function(opt) {
          opt.name = gl.get(opt.name);
          opt.value = gl.get(opt.value);
          gl.texParameteri(textureType, opt.name, opt.value);
          if (opt.generateMipmap) {
            gl.generateMipmap(textureType);
          }
        });
      }
      //set default options so we don't have to next time.
      delete opt.data;
      this.textureMemo[name] = opt;
      
      return this;
    },

    setTextures: function(obj) {
      for (var name in obj) {
        this.setTexture(name, obj[name]);
      }
      return this;
    },

    use: function() {
      gl.useProgram(this.program);
      return this;
    }
  
  };

  //Get options in object or arguments
  function getOptions() {
    var opt;
    if (arguments.length == 2) {
      opt = {
        vs: arguments[0],
        fs: arguments[1]
      };
    } else {
      opt = arguments[0] || {};
    }
    return opt;
  }
  
  //Create a program from vertex and fragment shader node ids
  Program.fromShaderIds = function() {
    var opt = getOptions.apply({}, arguments),
        vs = $(opt.vs),
        fs = $(opt.fs);

    return new Program(vs.innerHTML, fs.innerHTML);
  };

  //Create a program from vs and fs sources
  Program.fromShaderSources = function(opt) {
    var opt = getOptions.apply({}, arguments),
        vs = opt.vs,
        fs = opt.fs;

    return new Program(opt.vs, opt.fs);
  };

  //Build program from default shaders (requires Shaders)
  Program.fromDefaultShaders = function() {
    var opt = getOptions.apply({}, arguments),
        vs = opt.vs || 'Default',
        fs = opt.fs || 'Default',
        sh = PhiloGL.Shaders;

    return PhiloGL.Program.fromShaderSources(sh.Vertex[vs], 
                                              sh.Fragment[fs]);
  };
  
  //Implement Program.fromShaderURIs (requires IO)
  Program.fromShaderURIs = function(opt) {
    opt = $.merge({
      path: '',
      vs: '',
      fs: '',
      onSuccess: $.empty,
      onError: $.empty
    }, opt || {});

    var vertexShaderURI = opt.path + opt.vs,
        fragmentShaderURI = opt.path + opt.fs,
        XHR = PhiloGL.IO.XHR;

    new XHR({
      url: vertexShaderURI,
      onError: function(arg) {
        opt.onError(arg);
      },
      onSuccess: function(vs) {        
        new XHR({
          url: fragmentShaderURI,
          onError: function(arg) {
            opt.onError(arg);
          },
          onSuccess: function(fs) {
            opt.onSuccess(Program.fromShaderSources(vs, fs));  
          }
        }).send();
      }
    }).send();
  };

  PhiloGL.Program = Program;

})();

//io.js
//Provides loading of assets with XHR and JSONP methods.

(function () {
  var IO = {};

  var XHR = function(opt) {
    opt = $.merge({
      url: 'http://sencha.com/',
      method: 'GET',
      async: true,
      //body: null,
      sendAsBinary: false,
      onProgress: $.empty,
      onSuccess: $.empty,
      onError: $.empty,
      onAbort: $.empty,
      onComplete: $.empty
    }, opt || {});

    this.opt = opt;
    this.initXHR();
  };

  XHR.State = {};
  ['UNINITIALIZED', 'LOADING', 'LOADED', 'INTERACTIVE', 'COMPLETED'].forEach(function(stateName, i) {
    XHR.State[stateName] = i;
  });

  XHR.prototype = {
    initXHR: function() {
      var req = this.req = new XMLHttpRequest(),
          that = this;

      ['Progress', 'Error', 'Abort', 'Load'].forEach(function(event) {
        req.addEventListener(event.toLowerCase(), function(e) {
          that['handle' + event](e);
        }, false);
      });
    },
    
    send: function(body) {
      var req = this.req,
          opt = this.opt,
          async = opt.async;
      
      req.open(opt.method, opt.url, async);
      
      if (async) {
        req.onreadystatechange = function(e) {
          if (req.readyState == XHR.State.COMPLETED) {
            if (req.status == 200) {
              opt.onSuccess(req.responseText);
            } else {
              opt.onError(req.status);
            }
          }
        };
      }
      
      if (opt.sendAsBinary) {
        req.sendAsBinary(body || opt.body || null);
      } else {
        req.send(body || opt.body || null);
      }

      if (!async) {
        if (req.status == 200) {
          opt.onSuccess(req.responseText);
        } else {
          opt.onError(req.status);
        }
      }
    },

    setRequestHeader: function(header, value) {
      this.req.setRequestHeader(header, value);
      return this;
    },

    handleProgress: function(e) {
      if (e.lengthComputable) {
        this.opt.onProgress(e, Math.round(e.loaded / e.total * 100));
      } else {
        this.opt.onProgress(e, -1);
      }
    },

    handleError: function(e) {
      this.opt.onError(e);
    },

    handleAbort: function() {
      this.opt.onAbort(e);
    },

    handleLoad: function(e) {
       this.opt.onComplete(e);
    }
  };

  var JSONP = function(opt) {
    opt = $.merge({
      url: 'http://sencha.com/',
      data: {},
      onComplete: $.empty,
      callbackKey: 'callback'
    }, opt || {});
    
    var index = JSONP.counter++;
    //create query string
    var data = [];
    for(var prop in opt.data) {
      data.push(prop + '=' + opt.data[prop]);
    }
    data = data.join('&');
    //create source url
    var src = opt.url + 
      (opt.url.indexOf('?') > -1 ? '&' : '?') +
      opt.callbackKey + '=PhiloGL.IO.JSONP.requests.request_' + index +
      (data.length > 0 ? '&' + data : '');
    //create script
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    //create callback
    JSONP.requests['request_' + index] = function(json) {
      opt.onComplete(json);
      //remove script
      if(script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if(script.clearAttributes) {
        script.clearAttributes();
      } 
    };
    //inject script
    document.getElementsByTagName('head')[0].appendChild(script);
  };

  JSONP.counter = 0;
  JSONP.requests = {};

  //Load multiple Image assets async
  var Images = function(opt) {
    opt = $.merge({
      src: [],
      onProgress: $.empty,
      onComplete: $.empty
    }, opt || {});

    var count = 0, l = opt.src.length;
    //Image onload handler
    var load = function() {
      opt.onProgress(Math.round(++count / l * 100));
      if (count == l) {
        opt.onComplete(images);
      }
    };
    //Image error handler
    var error = function() {
      if (++count == l) {
        opt.onComplete(images);
      }
    };
    //Create image array
    var images = opt.src.map(function(src, i) {
      var img = new Image();
      img.index = i;
      img.onload = load;
      img.onerror = error;
      img.src = src;
      return img;
    });
    return images;
  };

  //Load multiple textures from images
  var Textures = function(program, opt) {
    opt = $.merge({
      src: [],
      onComplete: $.empty
    }, opt || {});

    Images({
      src: opt.src,
      onComplete: function(images) {
        var textures = {};
        images.forEach(function(img, i) {
          textures[opt.src[i]] = $.merge({
            data: {
              value: img
            }
          }, opt);
        });
        program.setTextures(textures);
        opt.onComplete();
      }
    });
  };
  
  IO.XHR = XHR;
  IO.JSONP = JSONP;
  IO.Images = Images;
  IO.Textures = Textures;
  PhiloGL.IO = IO;

})();

//camera.js
//Provides a Camera with ModelView and Projection matrices

(function () {
  //Define some locals
  var Vec3 = PhiloGL.Vec3,
      Mat4 = PhiloGL.Mat4;

  //Camera class
  var Camera = function(fov, aspect, near, far, opt) {
    opt = opt || {};

    var pos = opt.position,
        target = opt.target,
        up = opt.up;

    this.position = pos && new Vec3(pos.x, pos.y, pos.z) || new Vec3;
    this.target = target && new Vec3(target.x, target.y, target.z) || new Vec3;
    this.up = up && new Vec3(up.x, up.y, up.z) || new Vec3(0, 1, 0);
    
    this.projection = new Mat4().perspective(fov, aspect, near, far);
    this.modelView = new Mat4;

  };

  Camera.prototype = {
    
    update: function() {
      this.modelView.lookAt(this.position, this.target, this.up);  
    }
  
  };

  PhiloGL.Camera = Camera;

})();

//webgl.js
//Checks if WebGL is enabled and creates a context for using WebGL.

(function () {

  var WebGL = {
    
    getContext: function(canvas, opt) {
      var canvas = typeof canvas == 'string'? $(canvas) : canvas, ctx;
      ctx = canvas.getContext('experimental-webgl', opt);
      if (!ctx) {
        ctx = canvas.getContext('webgl', opt);
      }
      //Set as debug handler
      if (ctx && opt && opt.debug) {
        gl = {};
        for (var m in ctx) {
          var f = ctx[m];
          if (typeof f == 'function') {
            gl[m] = (function(k, v) {
              return function() {
                console.log(k, Array.prototype.join.call(arguments), Array.prototype.slice.call(arguments));
                try {
                  var ans = v.apply(ctx, arguments);
                } catch (e) {
                  throw k + " " + e;                  
                }
                var errorStack = [], error;
                while((error = ctx.getError()) !== ctx.NO_ERROR) {
                  errorStack.push(error);
                }
                if (errorStack.length) {
                  throw errorStack.join();
                }
                return ans;
              };
            })(m, f);
          } else {
            gl[m] = f;
          }
        }
      } else {
        gl = ctx;
      }

      //add a get by name param
      gl.get = function(name) {
        return typeof name == 'string'? gl[name] : name;
      };

      return gl;
    } 

  };

  //Feature test WebGL
  (function() {
    try {
      var canvas = document.createElement('canvas');
      PhiloGL.hasWebGL = function() {
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      };
    } catch(e) {
      PhiloGL.hasWebGL = function() {
          return false;
      };
    }
  })();

  PhiloGL.WebGL = WebGL;
  
})();

//o3d.js
//Scene Objects

(function () {
  //Define some locals
  var Vec3 = PhiloGL.Vec3,
      Mat4 = PhiloGL.Mat4;
      cos = Math.cos,
      sin = Math.sin,
      pi = Math.PI,
      max = Math.max,
      flatten = function(arr) {
        if (arr && arr.length && $.type(arr[0]) == 'array') 
          return [].concat.apply([], arr);
        return arr;
      };
  
  //Model repository
  var O3D = {};

  //Model abstract O3D Class
  O3D.Model = function(opt) {
    this.$$family = 'model';

    this.vertices = flatten(opt.vertices);
    this.faces = flatten(opt.faces);
    this.normals = flatten(opt.normals);
    this.textures = opt.textures && $.splat(opt.textures);
    this.centroids = flatten(opt.centroids);
    this.colors = flatten(opt.colors);
    this.indices = flatten(opt.indices);
    this.shininess = opt.shininess || 0;
    this.uniforms = opt.uniforms || {};
    this.render = opt.render;
    this.drawType = opt.drawType;
    if (opt.texCoords) {
      this.texCoords = $.type(opt.texCoords) == 'object'? opt.texCoords : flatten(opt.texCoords);
    }
    this.onBeforeRender = opt.onBeforeRender || $.empty;
    this.onAfterRender = opt.onAfterRender || $.empty;

    this.position = new Vec3;
    this.rotation = new Vec3;
    this.scale = new Vec3(1, 1, 1);
    this.matrix = new Mat4;
    
    //Set a color per vertex if this is not the case
    this.normalizeColors();

    if (opt.computeCentroids) {
      this.computeCentroids();
    }
    if (opt.computeNormals) {
      this.computeNormals();
    }
  
  };

  //Shader setter mixin
  var setters = {
    
    setUniforms: function(program) {
      program.setUniforms(this.uniforms);
    },
    
    setShininess: function(program) {
      program.setUniform('shininess', this.shininess || 0);
    },
    
    setVertices: function(program, force) {
      if (!this.vertices) return;

      if (force || this.dynamic) {
        program.setBuffer('vertices-' + this.id, {
          attribute: 'position',
          value: this.toFloat32Array('vertices'),
          size: 3
        });
      } else {
        program.setBuffer('vertices-' + this.id);
      }
    },
    
    setNormals: function(program, force) {
      if (!this.normals) return;

      if (force || this.dynamic) {
        program.setBuffer('normals-' + this.id, {
          attribute: 'normal',
          value: this.toFloat32Array('normals'),
          size: 3
        });
      } else {
        program.setBuffer('normals-' + this.id);
      }
    },

    setIndices: function(program, force) {
      if (!this.indices) return;

      if (force || this.dynamic) {
        program.setBuffer('indices-' + this.id, {
          bufferType: gl.ELEMENT_ARRAY_BUFFER,
          drawType: gl.STATIC_DRAW,
          value: this.toUint16Array('indices'),
          size: 1
        });
      } else {
        program.setBuffer('indices-' + this.id);
      }
    },

   setColors: function(program, force) {
      if (!this.colors) return;

      if (force || this.dynamic) {
        program.setBuffer('colors-' + this.id, {
          attribute: 'color',
          value: this.toFloat32Array('colors'),
          size: 4
        });
      } else {
        program.setBuffer('colors-' + this.id);
      }
    },

    setTexCoords: function(program, force) {
      if (!this.texCoords) return;

      var id = this.id;

      if (force || this.dynamic) {
        //If is an object containing textureName -> textureCoordArray
        //Set all textures, samplers and textureCoords.
        if ($.type(this.texCoords) == 'object') {
          this.textures.forEach(function(tex, i) {
            program.setBuffer('texCoords-' + i + '-' + id, {
              attribute: 'texCoord' + (i + 1),
              value: new Float32Array(this.texCoords[tex]),
              size: 2
            });
          });
        //An array of textureCoordinates
        } else {
          program.setBuffer('texCoords-' + id, {
            attribute: 'texCoord1',
            value: this.toFloat32Array('texCoords'),
            size: 2
          });
        }
      } else {
        if ($.type(this.texCoords) == 'object') {
          this.textures.forEach(function(tex, i) {
            program.setBuffer('texCoords-' + i + '-' + id);
          });
        } else {
          program.setBuffer('texCoords-' + id);
        }
      }
    },

    setTextures: function(program, force) {
      this.textures = this.textures? $.splat(this.textures) : [];
      for (var i = 0, texs = this.textures, l = texs.length; i < PhiloGL.Scene.MAX_TEXTURES; i++) {
        if (i < l) {
          program.setUniform('hasTexture' + (i + 1), true);
          program.setUniform('sampler' + (i + 1), i);
          program.setTexture(texs[i], gl['TEXTURE' + i]);
        } else {
          program.setUniform('hasTexture' + (i + 1), false);
        }
      }
    }
 };


  O3D.Model.prototype = {
    
    update: function() {
      var matrix = this.matrix,
          pos = this.position,
          rot = this.rotation,
          scale = this.scale;

      matrix.id();
      matrix.$translate(pos.x, pos.y, pos.z);
      matrix.$rotateXYZ(rot.x, rot.y, rot.z);
      matrix.$scale(scale.x, scale.y, scale.z);
    },

    toFloat32Array: function(name) {
      return new Float32Array(this[name]);
    },

    toUint16Array: function(name) {
      return new Uint16Array(this[name]);
    },
    
    normalizeColors: function() {
      if (!this.vertices) return;

      var lv = this.vertices.length * 4 / 3;
      if (this.colors && this.colors.length < lv) {
        var times = lv / this.colors.length,
            colors = this.colors,
            colorsCopy = colors.slice();
        while (--times) {
          colors.push.apply(colors, colorsCopy);
        }
      }
    },
 
    computeCentroids: function() {
      var faces = this.faces,
          vertices = this.vertices,
          centroids = [];

      faces.forEach(function(face) {
        var centroid = [0, 0, 0],
            acum = 0;
        
        face.forEach(function(idx) {
          var vertex = vertices[idx];
          
          centroid[0] += vertex[0];
          centroid[1] += vertex[1];
          centroid[2] += vertex[2];
          acum++;
        
        });

        centroid[0] /= acum;
        centroid[1] /= acum;
        centroid[2] /= acum;

        centroids.push(centroid);
      
      });

      this.centroids = centroids;
    },

    computeNormals: function() {
      var faces = this.faces,
          vertices = this.vertices,
          normals = [];

      faces.forEach(function(face) {
        var v1 = vertices[face[0]],
            v2 = vertices[face[1]],
            v3 = vertices[face[2]],
            dir1 = {
              x: v3[0] - v2[0],
              y: v3[1] - v2[1],
              z: v3[1] - v2[2]
            },
            dir2 = {
              x: v1[0] - v2[0],
              y: v1[1] - v2[1],
              z: v1[2] - v2[2]
            };

        Vec3.$cross(dir2, dir1);
        
        if (Vec3.norm(dir2) > 1e-6) {
          Vec3.unit(dir2);
        }
        
        normals.push([dir2.x, dir2.y, dir2.z]);
      
      });

      this.normals = normals;
    }

  };
  
  //Apply our setters mixin
  $.extend(O3D.Model.prototype, setters);
/*
  //O3D.Group will group O3D elements into one group
  O3D.Group = function(opt) {
    O3D.Model.call(this, opt);
    this.models = [];
  };

  O3D.Group.prototype = Object.create(O3D.Model.prototype, {
    //Add model(s)
    add: {
      value: function() {
        this.models.push.apply(this.models, Array.prototype.slice.call(arguments));
      }
    },
    updateProperties: {
      value: function(propertyNames) {
        var vertices = [],
            normals = [],
            colors = [],
            texCoords = [],
            textures = [],
            indices = [],
            lastIndex = 0,

            doVertices = 'vertices' in propertyNames,
            doNormals = 'normals' in propertyNames,
            doColors = 'colors' in propertyNames,
            doTexCoords = 'texCoords' in propertyNames,
            doTextures = 'textures' in propertyNames,
            doIndices = 'indices' in propertyNames,

            view = new PhiloGL.Mat4;

        for (var i = 0, models = this.models, l = models.length; i < l; i++) {
          var model = models[i];
          //transform vertices and transform normals
          vertices.push.apply(vertices, model.vertices || []);
          normals.push.apply(normals, model.normals || []);

          texCoords.push.apply(texCoords, model.texCoords || []);
          textures.push.apply(textures, model.textures || []);
          colors.push.apply(colors, model.colors || []);
          //Update indices
          (function(model, lastIndex) {
            indices.push.apply(indices, (model.indices || []).map(function(n) { return n + lastIndex; }));
          })(model, lastIndex);
          lastIndex = Math.max.apply(Math, indices) +1;
        }

        this.vertices = !!vertices.length && vertices;
        this.normals = !!normals.length && normals;
        this.texCoords = !!texCoords.length && texCoords;
        this.textures = !!textures.length && textures;
        this.colors = !!colors.length && colors;
        this.indices = !!indices.length && indices;
      }
    }
});    
*/
  //Now some primitives, Cube, Sphere
  //Cube
  O3D.Cube = function(config) {
    O3D.Model.call(this, $.extend({
      vertices: [-1, -1,  1,
                 1, -1,  1,
                 1,  1,  1,
                -1,  1,  1,

                -1, -1, -1,
                -1,  1, -1,
                 1,  1, -1,
                 1, -1, -1,

                -1,  1, -1,
                -1,  1,  1,
                 1,  1,  1,
                 1,  1, -1,

                -1, -1, -1,
                 1, -1, -1,
                 1, -1,  1,
                -1, -1,  1,

                 1, -1, -1,
                 1,  1, -1,
                 1,  1,  1,
                 1, -1,  1,

                -1, -1, -1,
                -1, -1,  1,
                -1,  1,  1,
                -1,  1, -1],

      texCoords: [0.0, 0.0,
                  1.0, 0.0,
                  1.0, 1.0,
                  0.0, 1.0,

                  // Back face
                  1.0, 0.0,
                  1.0, 1.0,
                  0.0, 1.0,
                  0.0, 0.0,

                  // Top face
                  0.0, 1.0,
                  0.0, 0.0,
                  1.0, 0.0,
                  1.0, 1.0,

                  // Bottom face
                  1.0, 1.0,
                  0.0, 1.0,
                  0.0, 0.0,
                  1.0, 0.0,

                  // Right face
                  1.0, 0.0,
                  1.0, 1.0,
                  0.0, 1.0,
                  0.0, 0.0,

                  // Left face
                  0.0, 0.0,
                  1.0, 0.0,
                  1.0, 1.0,
                  0.0, 1.0],

      normals: [
        // Front face
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,

        // Back face
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,

        // Top face
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,

        // Bottom face
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,

        // Right face
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,

        // Left face
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0
      ],
      
      indices: [0, 1, 2, 0, 2, 3,
                4, 5, 6, 4, 6, 7,
                8, 9, 10, 8, 10, 11,
                12, 13, 14, 12, 14, 15,
                16, 17, 18, 16, 18, 19,
                20, 21, 22, 20, 22, 23]

    }, config || {}));
  };

  O3D.Cube.prototype = Object.create(O3D.Model.prototype);
  
  O3D.Sphere = function(opt) {
       var nlat = opt.nlat || 10,
           nlong = opt.nlong || 10,
           radius = opt.radius || 1,
           startLat = 0,
           endLat = pi,
           latRange = endLat - startLat,
           startLong = 0,
           endLong = 2 * pi,
           longRange = endLong - startLong,
           numVertices = (nlat + 1) * (nlong + 1),
           vertices = [],
           normals = [],
           texCoords = [],
           indices = [];

      if (typeof radius == 'number') {
        var value = radius;
        radius = function(n1, n2, n3, u, v) {
          return value;
        };
      }
      //Create vertices, normals and texCoords
      for (var y = 0; y <= nlong; y++) {
        for (var x = 0; x <= nlat; x++) {
          var u = x / nlat,
              v = y / nlong,
              theta = longRange * u,
              phi = latRange * v,
              sinTheta = sin(theta),
              cosTheta = cos(theta),
              sinPhi = sin(phi),
              cosPhi = cos(phi),
              ux = cosTheta * sinPhi,
              uy = cosPhi,
              uz = sinTheta * sinPhi,
              r = radius(ux, uy, uz, u, v);

          vertices.push(r * ux, r * uy, r * uz);
          normals.push(ux, uy, uz);
          texCoords.push(u, v);
        }
      }

      //Create indices
      var numVertsAround = nlat + 1;
      for (x = 0; x < nlat; x++) {
        for (y = 0; y < nlong; y++) {
          
          indices.push(y * numVertsAround + x,
                      y * numVertsAround + x + 1,
                      (y + 1) * numVertsAround + x);

          indices.push((y + 1) * numVertsAround + x,
                       y * numVertsAround + x + 1,
                      (y + 1) * numVertsAround + x + 1);
        }
      }

      O3D.Model.call(this, $.extend({
        vertices: vertices,
        indices: indices,
        normals: normals,
        texCoords: texCoords
      }, opt || {}));
  };

  O3D.Sphere.prototype = Object.create(O3D.Model.prototype);

  //Assign to namespace
  PhiloGL.O3D = O3D;
})();

//shaders.js
//Default Shaders

(function() {
  //Add default shaders
  var Shaders = {
    Vertex: {},
    Fragment: {}
  };

  var VertexShaders = Shaders.Vertex,
      FragmentShaders = Shaders.Fragment;

  VertexShaders.Default = [
    
    "attribute vec3 position;",
    "attribute vec3 normal;",
    "attribute vec4 color;",
    "attribute vec2 texCoord1;",
    
    "uniform mat4 modelViewMatrix;",
    "uniform mat4 viewMatrix;",
    "uniform mat4 projectionMatrix;",
    "uniform mat4 normalMatrix;",

    "uniform bool enableLights;",
    "uniform vec3 ambientColor;",
    "uniform vec3 directionalColor;",
    "uniform vec3 lightingDirection;",

    "uniform bool enablePoint1;",
    "uniform vec3 pointLocation1;",
    "uniform vec3 pointColor1;",

    "uniform bool enablePoint2;",
    "uniform vec3 pointLocation2;",
    "uniform vec3 pointColor2;",
    
    "uniform bool enablePoint3;",
    "uniform vec3 pointLocation3;",
    "uniform vec3 pointColor3;",
   
    "varying vec4 vColor;",
    "varying vec2 vTexCoord;",
    "varying vec3 lightWeighting;",
    
    "void main(void) {",
      "vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);",
      
      "if(!enableLights) {",
        "lightWeighting = vec3(1.0, 1.0, 1.0);",
      "} else {",
        "vec3 plightDirection;",
        "vec3 pointWeight1 = vec3(0.0, 0.0, 0.0);",
        "vec3 pointWeight2 = vec3(0.0, 0.0, 0.0);",
        "vec3 pointWeight3 = vec3(0.0, 0.0, 0.0);",

        "vec4 transformedNormal = normalMatrix * vec4(normal, 1.0);",
        
        "float directionalLightWeighting = max(dot(transformedNormal.xyz, lightingDirection), 0.0);",

        "if(enablePoint1) {",
          "plightDirection = normalize((viewMatrix * vec4(pointLocation1, 1.0)).xyz - mvPosition.xyz);",
          "pointWeight1 = max(dot(transformedNormal.xyz, plightDirection), 0.0) * pointColor1;",
        "}",
        
        "if(enablePoint2) {",
          "plightDirection = normalize((viewMatrix * vec4(pointLocation2, 1.0)).xyz - mvPosition.xyz);",
          "pointWeight2 = max(dot(transformedNormal.xyz, plightDirection), 0.0) * pointColor2;",
        "}",
        
        "if(enablePoint3) {",
          "plightDirection = normalize((viewMatrix * vec4(pointLocation3, 1.0)).xyz - mvPosition.xyz);",
          "pointWeight3 = max(dot(transformedNormal.xyz, plightDirection), 0.0) * pointColor3;",
        "}",

        "lightWeighting = ambientColor + (directionalColor * directionalLightWeighting) + pointWeight1 + pointWeight2 + pointWeight3;",
      "}",
      
      "vColor = color;",
      "vTexCoord = texCoord1;",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}"
  
  ].join("\n");


 FragmentShaders.Default = [

    "#ifdef GL_ES",
    "precision highp float;",
    "#endif",
    
    "varying vec4 vColor;",
    "varying vec2 vTexCoord;",
    "varying vec3 lightWeighting;",
    
    "uniform bool hasTexture1;",
    "uniform sampler2D sampler1;",

    "void main(){",
      
      "if(!hasTexture1) {",
        "gl_FragColor = vec4(vColor.rgb * lightWeighting, vColor.a);",
      "} else {",
        "gl_FragColor = vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb * lightWeighting, 1.0);",
      "}",
    
    "}"

  ].join("\n");

  PhiloGL.Shaders = Shaders;
  
})();

//scene.js
//Scene Object management and rendering

(function () {
  //Define some locals
  var Vec3 = PhiloGL.Vec3,
      Mat4 = PhiloGL.Mat4;

  //Scene class
  var Scene = function(program, camera, opt) {
    opt = $.merge({
      lights: {
        enable: false,
        //ambient light
        ambient: {
          r: 0.2,
          g: 0.2,
          b: 0.2
        },
        //directional light
        directional: {
          direction: {
            x: 1,
            y: 1,
            z: 1
          },  
          color: {
            r: 0,
            g: 0,
            b: 0
          }
        },
        //point light
        point: []
      }
    }, opt || {});
    
    this.program = program;
    this.camera = camera;
    this.models = [];
    this.config = opt;
  };

  Scene.prototype = {
    
    add: function() {
      for (var i = 0, models = this.models, l = arguments.length; i < l; i++) {
        var model = arguments[i];
        //Generate unique id for model
        model.id = model.id || Scene.id++;
        models.push(model);
        //Create and load Buffers
        this.defineBuffers(model);
      }
    },

    defineBuffers: function(obj) {
      var program = this.program;
      
      obj.setVertices(program, true);
      obj.setColors(program, true);
      obj.setNormals(program, true);
      //obj.setTextures(program, true);
      obj.setTexCoords(program, true);
      obj.setIndices(program, true);
    },

    beforeRender: function() {
      //Setup Lighting
      var abs = Math.abs,
          program = this.program,
          camera = this.camera,
          cpos = camera.position,
          light = this.config.lights,
          ambient = light.ambient,
          directional = light.directional,
          dcolor = directional.color,
          dir = directional.direction,
          points = light.points && $.splat(light.points) || [];
      
      //Normalize lighting direction vector
      Vec3.$unit(dir);
      Vec3.$scale(dir, -1);
      
      //Set light uniforms. Ambient and directional lights.
      program.setUniform('enableLights', light.enable);
      if (light.enable) {
        program.setUniform('ambientColor', [ambient.r, ambient.g, ambient.b]);
        program.setUniform('directionalColor', [dcolor.r, dcolor.g, dcolor.b]);
        program.setUniform('lightingDirection', [dir.x, dir.y, dir.z]);
      }
      
      //Set point lights
      program.setUniform('enableSpecularHighlights', false);
      for (var i = 0, l = Scene.MAX_POINT_LIGHTS, pl = points.length; i < l; i++) {
        var index = i + 1;
        if (i < pl) {
          var point = points[i],
              position = point.position,
              color = point.color || point.diffuse,
              spec = point.specular;
          program.setUniform('enablePoint' + index, true);
          program.setUniform('pointLocation' + index, [position.x, position.y, position.z]);
          program.setUniform('pointColor' + index, [color.r, color.g, color.b]);
          //Add specular color and enableSpecularHighlights
          if (spec) {
            program.setUniform('enableSpecularHighlights', true);
            program.setUniform('pointSpecularColor' + index, [spec.r, spec.g, spec.b]);
          } 
        } else {
          program.setUniform('enablePoint' + index, false);
        }
      }
      
      //Set Camera view and projection matrix
      program.setUniform('projectionMatrix', camera.projection);
      program.setUniform('viewMatrix', camera.modelView);
    },

    //Renders all objects in the scene.
    render: function() {
      var program = this.program,
          camera = this.camera;
      this.beforeRender();
      this.models.forEach(function(elem) {
        elem.onBeforeRender(program, camera);
        this.renderObject(elem);
        elem.onAfterRender(program, camera);
      }, this);
    },

    renderToTexture: function(name) {
      var program = this.program,
          texture = program.textures[name + '-texture'],
          texMemo = program.textureMemo[name + '-texture'];
      
      this.render();

      gl.bindTexture(texMemo.textureType, texture);
      gl.generateMipmap(texMemo.textureType);
      gl.bindTexture(texMemo.textureType, null);
    },

    renderObject: function(obj) {
      var program = this.program,
          camera = this.camera,
          view = new Mat4;

      obj.setUniforms(program);
      obj.setShininess(program);
      obj.setVertices(program);
      obj.setColors(program);
      obj.setNormals(program);
      obj.setTextures(program);
      obj.setTexCoords(program);
      obj.setIndices(program);

      //Now set modelView and normal matrices
      view.mulMat42(camera.modelView, obj.matrix);
      program.setUniform('modelViewMatrix', view);
      program.setUniform('normalMatrix', view.invert().$transpose());
      
      //Draw
      //TODO(nico): move this into O3D, but, somehow, abstract the gl.draw* methods inside that object.
      if (obj.render) {
        obj.render(gl, program, camera);
      } else {
        if (obj.indices) {
          gl.drawElements((obj.drawType !== undefined)? gl.get(obj.drawType) : gl.TRIANGLES, obj.indices.length, gl.UNSIGNED_SHORT, 0);
        } else {
          gl.drawArrays(gl.get(obj.drawType || 'TRIANGLES'), 0, obj.toFloat32Array('vertices').length / 3);
        }
      }
    }
  
  };

  Scene.id = $.time();
  
  Scene.MAX_TEXTURES = 3;
  Scene.MAX_POINT_LIGHTS = 3;

  PhiloGL.Scene = Scene;

})();

//workers.js
//

(function () {

  function WorkerGroup(fileName, n) {
    var workers = this.workers = [];
    while (n--) {
      workers.push(new Worker(fileName));
    }
  }

  WorkerGroup.prototype = {
    map: function(callback) {
      var workers = this.workers;
      var configs = this.configs = [];

      for (var i = 0, l = workers.length; i < l; i++) {
        configs.push(callback && callback(i));
      }

      return this;
    },

    reduce: function(opt) {
      var fn = opt.reduceFn,
          workers = this.workers,
          configs = this.configs,
          l = workers.length,
          acum = opt.initialValue,
          message = function (e) {
            l--;
            if (acum === undefined) {
              acum = e.data;
            } else {
              acum = fn(acum, e.data);
            }
            if (l == 0) {
              opt.onComplete(acum);
            }
          };
      for (var i = 0, ln = l; i < ln; i++) {
        var w = workers[i];
        w.onmessage = message;
        w.postMessage(configs[i]);
      }

      return this;
    }
  };

  PhiloGL.WorkerGroup = WorkerGroup;

})();

(function() {
  //Timer based animation
  var Fx = function(options) {
      this.opt = $.merge({
        duration: 1000,
        transition: function(x) { return x; },
        onCompute: $.empty,
        onComplete: $.empty
      }, options || {});
  };

  Fx.prototype = {
    timer:null,
    time:null,
    
    start: function(options) {
      this.opt = $.merge(this.opt, options || {});
      this.time = $.time();
      this.animating = true;
    },

    //perform a step in the animation
    step: function() {
      if (!this.animating) return;
      var currentTime = $.time(), time = this.time, opt = this.opt;
      if(currentTime < time + opt.duration) {
        var delta = opt.transition((currentTime - time) / opt.duration);
        opt.onCompute.call(this, delta);
      } else {
        this.animating = false;
        opt.onCompute.call(this, 1);
        opt.onComplete.call(this);
      }
    }
  };
  
  Fx.compute = function(from, to, delta) {
    return from + (to - from) * delta;
  };

  //Easing equations
  Fx.Transition = {
    linear: function(p){
      return p;
    }
  };

  var Trans = Fx.Transition;

  (function(){

    var makeTrans = function(transition, params){
      params = $.splat(params);
      return $.extend(transition, {
        easeIn: function(pos){
          return transition(pos, params);
        },
        easeOut: function(pos){
          return 1 - transition(1 - pos, params);
        },
        easeInOut: function(pos){
          return (pos <= 0.5)? transition(2 * pos, params) / 2 : (2 - transition(
              2 * (1 - pos), params)) / 2;
        }
      });
    };

    var transitions = {

      Pow: function(p, x){
        return Math.pow(p, x[0] || 6);
      },

      Expo: function(p){
        return Math.pow(2, 8 * (p - 1));
      },

      Circ: function(p){
        return 1 - Math.sin(Math.acos(p));
      },

      Sine: function(p){
        return 1 - Math.sin((1 - p) * Math.PI / 2);
      },

      Back: function(p, x){
        x = x[0] || 1.618;
        return Math.pow(p, 2) * ((x + 1) * p - x);
      },

      Bounce: function(p){
        var value;
        for ( var a = 0, b = 1; 1; a += b, b /= 2) {
          if (p >= (7 - 4 * a) / 11) {
            value = b * b - Math.pow((11 - 6 * a - 11 * p) / 4, 2);
            break;
          }
        }
        return value;
      },

      Elastic: function(p, x){
        return Math.pow(2, 10 * --p)
            * Math.cos(20 * p * Math.PI * (x[0] || 1) / 3);
      }

    };

    for (var t in transitions) {
      Trans[t] = makeTrans(transitions[t]);
    }

    ['Quad', 'Cubic', 'Quart', 'Quint'].forEach(function(elem, i){
      Trans[elem] = makeTrans(function(p){
        return Math.pow(p, [
          i + 2
        ]);
      });
    });

  })();

  //animationTime - function branching
  var global = self || window;
  if (global) {
    var found = false;
    ['webkitAnimationTime', 'mozAnimationTime', 'animationTime',
     'webkitAnimationStartTime', 'mozAnimationStartTime', 'animationStartTime'].forEach(function(impl) {
      if (impl in global) {
        Fx.animationTime = function() {
          return global[impl];
        };
        found = true;
      }
    });
    if (!found) {
      Fx.animationTime = $.time;
    }
    //requestAnimationFrame - function branching
    found = false;
    ['webkitRequestAnimationFrame', 'mozRequestAnimationFrame', 'requestAnimationFrame'].forEach(function(impl) {
      if (impl in global) {
        Fx.requestAnimationFrame = function(callback) {
          global[impl](function() {
            callback();
          });
        };
        found = true;
      }
    });
    if (!found) {
      Fx.requestAnimationFrame = function(callback) {
        setTimeout(function() {
          callback();
        }, 1000 / 60);
      };
    }
  }
  

  PhiloGL.Fx = Fx;

})();

})();

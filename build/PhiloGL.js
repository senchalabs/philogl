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
        optProgram = $.splat(opt.program),
        optScene = opt.scene;
    
    //get Context global to all framework
    gl = PhiloGL.WebGL.getContext(canvasId, optContext);

    if (!gl) {
        opt.onError("The WebGL context couldn't been initialized");
        return null;
    }

    //get Program
    var popt = {
      'defaults': 'fromDefaultShaders',
      'ids': 'fromShaderIds',
      'sources': 'fromShaderSources',
      'uris': 'fromShaderURIs'
    };

    var programLength = optProgram.length,
        programCallback = (function() {
          var count = programLength,
              programs = {},
              error = false;
          return {
            onSuccess: function(p, popt) {
              programs[popt.id || (programLength - count)] = p;
              count--;
              if (count == 0 && !error) {
                loadProgramDeps(gl, programLength == 1? p : programs, function(app) {
                  opt.onLoad(app);
                });
              }
            },
            onError: function(p) {
              count--;
              opt.onError(opt.id);
              error = true;
            }
          };
        })();
    
    optProgram.forEach(function(optProgram, i) {
      var pfrom = optProgram.from;
      for (var p in popt) {
        if (pfrom == p) {
          program = PhiloGL.Program[popt[p]]($.extend(programCallback, optProgram));
          break;
        }
      }
      if (program) {
        programCallback.onSuccess(program, optProgram);
      }
    });


    function loadProgramDeps(gl, program, callback) {
      //get Camera
      var canvas = gl.canvas,
          camera = new PhiloGL.Camera(optCamera.fov, 
                                      canvas.width / canvas.height, 
                                      optCamera.near, 
                                      optCamera.far, optCamera);
      camera.update();
      
      //get Scene
      var scene = new PhiloGL.Scene(program, camera, optScene);
      
      //make app instance global to all framework
      app = new PhiloGL.WebGL.Application({
        gl: gl,
        canvas: canvas,
        program: program,
        scene: scene,
        camera: camera
      });

      //Use program
      if (program.$$family == 'program') {
        program.use();
      }
      
      //get Events
      if (optEvents) {
        PhiloGL.Events.create(app, $.extend(optEvents, {
          bind: app
        }));
      }

      //load Textures
      if (optTextures.src.length) {
        new PhiloGL.IO.Textures($.extend(optTextures, {
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
PhiloGL.unpack = function(branch) {
  branch = branch || window || self;
  ['Vec3', 'Mat4', 'Quat', 'Camera', 'Program', 'WebGL', 'O3D', 'Scene', 'Shaders', 'IO', 'Events', 'WorkerGroup', 'Fx'].forEach(function(module) {
      branch[module] = PhiloGL[module];
  });
};

//Version
PhiloGL.version = '1.2.1';

//Holds the 3D context, holds the application
var gl, app;

//Utility functions
function $(d) {
  return document.getElementById(d);
}

$.empty = function() {};

$.time = Date.now || function() {
  return +new Date;
};

$.uid = (function() {
  var t = $.time();
  
  return function() {
    return t++;
  };
})();

$.extend = function(to, from) {
  for (var p in from) {
    to[p] = from[p];
  }
  return to;
};

$.type = (function() {
  var oString = Object.prototype.toString,
      type = function(e) {
        var t = oString.call(e);
        return t.substr(8, t.length - 9).toLowerCase();
      };

  return function(elem) {
    var elemType = type(elem);
    if (elemType != 'object') {
      return elemType;
    }
    if (elem.$$family) return elem.$$family;
    return (elem && elem.nodeName && elem.nodeType == 1) ? 'element' : elemType;
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
      if (gl) {
        gl.get = function(name) {
          return typeof name == 'string'? gl[name] : name;
        };
      }

      return gl;
    } 

  };
   
  function Application(options) {
    //copy program, scene, camera, etc.
    for (var prop in options) {
      this[prop] = options[prop];
    }
    //handle buffers
    this.buffers = {};
    this.bufferMemo = {};
    //handle framebuffers
    this.frameBuffers = {};
    this.frameBufferMemo = {};
    //handle renderbuffers
    this.renderBuffers = {};
    this.renderBufferMemo = {};
    //handle textures
    this.textures = {};
    this.textureMemo = {};
  }

  Application.prototype = {
    $$family: 'application',

    setBuffer: function(program, name, opt) {
      //unbind buffer 
      if (opt === false || opt === null) {
        opt = this.bufferMemo[name];
        //reset buffer
        opt && gl.bindBuffer(opt.bufferType, null);
        //disable vertex attrib array if the buffer maps to an attribute.
        var attributeName = opt && opt.attribute || name,
            loc = program.attributes[attributeName];
        if (loc !== undefined) {
          gl.disableVertexAttribArray(loc);
        }
        return;
      }
      
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
          loc = program.attributes[attributeName],
          isAttribute = loc !== undefined;

      if (!hasBuffer) {
        this.buffers[name] = buffer;
      }
      
      isAttribute && gl.enableVertexAttribArray(loc);
      gl.bindBuffer(bufferType, buffer);
      
      if (hasValue) {
        gl.bufferData(bufferType, value, drawType);
      }
      
      isAttribute && gl.vertexAttribPointer(loc, size, dataType, false, stride, offset);
      
      //set default options so we don't have to next time.
      //set them under the buffer name and attribute name (if an
      //attribute is defined)
      delete opt.value;
      this.bufferMemo[name] = opt;
      if (isAttribute) {
        this.bufferMemo[attributeName] = opt;
      }

      return this;
    },

    setBuffers: function(program, obj) {
      for (var name in obj) {
        this.setBuffer(program, name, obj[name]);
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

    use: function(program) {
      gl.useProgram(program.program);
      //remember last used program.
      this.usedProgram = program;
      return this;
    }
  };

  WebGL.Application = Application;
 
  //Feature test WebGL
  (function() {
    try {
      var canvas = document.createElement('canvas');
      PhiloGL.hasWebGL = function() {
          return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      };
    } catch(e) {
      PhiloGL.hasWebGL = function() {
          return false;
      };
    }
  })();

  PhiloGL.WebGL = WebGL;
  
})();

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


//event.js
//Handle keyboard/mouse/touch events in the Canvas

(function() {
  
  //returns an O3D object or false otherwise.
  function toO3D(n) {
    return n !== true? n : false;
  }
  
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

  var EventsProxy = function(app, opt) {
    var domElem = app.canvas;
    this.scene = app.scene;
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
          scene = this.scene,
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

      var cacheTarget;
      
      $.extend(evt, {
        x: x,
        y: y,
        cache: false,
        //stop event propagation
        stop: function() {
          event.stop(ge);
        },
        //get the target element of the event
        getTarget: function() {
          if (cacheTarget) return cacheTarget;
          return (cacheTarget = !opt.picking || scene.pick(epos.x - pos.x, epos.y - pos.y) || true);
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
          this.callbacks.onClick(e, toO3D(this.pressed));
        }
      }
      if(this.pressed) {
        if(this.moved) {
          this.callbacks.onDragEnd(e, toO3D(this.pressed));
        } else {
          this.callbacks.onDragCancel(e, toO3D(this.pressed));
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
        this.callbacks.onDragMove(e, toO3D(this.pressed));
        return;
      }
      if(this.hovered) {
        var target = toO3D(e.getTarget());
        if(this.hovered != target) {
          this.callbacks.onMouseLeave(e, this.hovered);
          this.hovered = target;
          if(target) {
            this.callbacks.onMouseEnter(e, this.hovered);
          }
        } else {
          this.callbacks.onMouseMove(e, this.hovered);
        }
      } else {
        this.hovered = toO3D(e.getTarget());
        if(this.hovered) {
          this.callbacks.onMouseEnter(e, this.hovered);
        }
      }
    },
    
    mousewheel: function(e) {
      this.callbacks.onMouseWheel(e);
    },
    
    mousedown: function(e) {
      this.pressed = e.getTarget();
      this.callbacks.onDragStart(e, toO3D(this.pressed));
    },
    
    touchstart: function(e) {
      this.touched = e.getTarget();
      this.callbacks.onTouchStart(e, toO3D(this.touched));
    },
    
    touchmove: function(e) {
      if(this.touched) {
        this.touchMoved = true;
        this.callbacks.onTouchMove(e, toO3D(this.touched));
      }
    },
    
    touchend: function(e) {
      if(this.touched) {
        if(this.touchMoved) {
          this.callbacks.onTouchEnd(e, toO3D(this.touched));
        } else {
          this.callbacks.onTouchCancel(e, toO3D(this.touched));
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

  Events.create = function(app, opt) {
    opt = $.merge({
      cachePosition: true,
      cacheSize: true,
      relative: true,
      centerOrigin: true,
      disableContextMenu: true,
      bind: false,
      picking: false,
      
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

    new EventsProxy(app, opt);
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
      var info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw "Error while compiling the shader " + info;
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
  var getUniformSetter = function(program, info, isArray) {
    var name = info.name,
        loc = gl.getUniformLocation(program, name),
        type = info.type;

    if (info.size > 1 && isArray) {
      switch(type) {
        case gl.FLOAT:
          return function(val) { gl.uniform1fv(loc, new Float32Array(val)); };
        case gl.INT: case gl.BOOL:
          return function(val) { gl.uniform1iv(loc, new Uint16Array(val)); };
      }
    }

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
    
    var attributes = {},
        uniforms = {};
  
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
      //if array name then clean the array brackets
      name = name[name.length -1] == ']' ? name.substr(0, name.length -3) : name;
      uniforms[name] = getUniformSetter(program, info, info.name != name);
    }

    this.program = program;
    //handle attributes and uniforms
    this.attributes = attributes;
    this.uniforms = uniforms;
  };

  Program.prototype = {
    
    $$family: 'program',

    setUniform: function(name, val) {
      if (this.uniforms[name])
        this.uniforms[name](val);
      return this;
    },

    setUniforms: function(obj) {
      for (var name in obj) {
        //this.uniforms[name](obj[name]);
        this.setUniform(name, obj[name]);
      }
      return this;
    }
  };

  ['setBuffer', 'setBuffers', 'use'].forEach(function(name) {
    Program.prototype[name] = function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(this);
      app[name].apply(app, args);
      return this;
    };
  });

  ['setFrameBuffer', 'setFrameBuffers', 'setRenderBuffer', 
   'setRenderBuffers', 'setTexture', 'setTextures'].forEach(function(name) {
    Program.prototype[name] = function() {
      app[name].apply(app, arguments);
      return this;
    };
  });

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
      noCache: false,
      onSuccess: $.empty,
      onError: $.empty
    }, opt || {});

    var vertexShaderURI = opt.path + opt.vs,
        fragmentShaderURI = opt.path + opt.fs,
        XHR = PhiloGL.IO.XHR;

    new XHR({
      url: vertexShaderURI,
      noCache: opt.noCache,
      onError: function(arg) {
        opt.onError(arg);
      },
      onSuccess: function(vs) {
        new XHR({
          url: fragmentShaderURI,
          noCache: opt.noCache,
          onError: function(arg) {
            opt.onError(arg);
          },
          onSuccess: function(fs) {
            opt.onSuccess(Program.fromShaderSources(vs, fs), opt);  
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
      noCache: false,
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
      
      if (opt.noCache) {
        opt.url += (opt.url.indexOf('?') >= 0? '&' : '?') + $.uid();
      }

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
      noCache: false,
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
    //append unique id for cache
    if (opt.noCache) {
      data += (data.indexOf('?') >= 0? '&' : '?') + $.uid();
    }
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
      noCache: false,
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
    //uid for image sources
    var noCache = opt.noCache,
        uid = $.uid(),
        getSuffix = function(s) { return (s.indexOf('?') >= 0? '&' : '?') + uid; };
    //Create image array
    var images = opt.src.map(function(src, i) {
      var img = new Image();
      img.index = i;
      img.onload = load;
      img.onerror = error;
      img.src = src + (noCache? getSuffix(src) : '');
      return img;
    });
    return images;
  };

  //Load multiple textures from images
  var Textures = function(opt) {
    opt = $.merge({
      src: [],
      noCache: false,
      onComplete: $.empty
    }, opt || {});

    Images({
      src: opt.src,
      noCache: opt.noCache,
      onComplete: function(images) {
        var textures = {};
        images.forEach(function(img, i) {
          textures[opt.src[i]] = $.merge({
            data: {
              value: img
            }
          }, opt);
        });
        app.setTextures(textures);
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

    this.fov = fov;
    this.near = near;
    this.far = far;
    this.aspect = aspect;
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

//o3d.js
//Scene Objects

(function () {
  //Define some locals
  var Vec3 = PhiloGL.Vec3,
      Mat4 = PhiloGL.Mat4,
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
    opt = opt || {};
    this.id = opt.id || $.uid();
    //picking options
    this.pickable = !!opt.pickable;
    this.pick = opt.pick || function() { return false; };
    if (opt.pickingColors) {
      this.pickingColors = flatten(opt.pickingColors);
    }

    this.vertices = flatten(opt.vertices);
    this.normals = flatten(opt.normals);
    this.textures = opt.textures && $.splat(opt.textures);
    this.colors = flatten(opt.colors);
    this.indices = flatten(opt.indices);
    this.shininess = opt.shininess || 0;
    if (opt.texCoords) {
      this.texCoords = $.type(opt.texCoords) == 'object'? opt.texCoords : flatten(opt.texCoords);
    }

    //extra uniforms
    this.uniforms = opt.uniforms || {};
    //extra attribute descriptors
    this.attributes = opt.attributes || {};
    //override the render method
    this.render = opt.render;
    //whether to render as triangles, lines, points, etc.
    this.drawType = opt.drawType;
    //whether to display the object at all
    this.display = 'display' in opt? opt.display : true;
    //before and after render callbacks
    this.onBeforeRender = opt.onBeforeRender || $.empty;
    this.onAfterRender = opt.onAfterRender || $.empty;
    //set a custom program per o3d
    if (opt.program) {
      this.program = opt.program;
    }
    //model position, rotation, scale and all in all matrix
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

    setAttributes: function(program) {
      var attributes = this.attributes;
      for (var name in attributes) {
        var descriptor = attributes[name],
            bufferId = this.id + '-' + name;
        if (!Object.keys(descriptor).length) {
          program.setBuffer(bufferId, true);
        } else {
          descriptor.attribute = name;
          program.setBuffer(bufferId, descriptor);
          delete descriptor.value;
        }
      }
    },
    
    unsetAttributes: function(program) {
      var attributes = this.attributes;
      for (var name in attributes) {
        var bufferId = this.id + '-' + name;
        program.setBuffer(bufferId, false);
      }
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

    unsetVertices: function(program) {
      program.setBuffer('vertices-' + this.id, false);
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

    unsetNormals: function(program) {
      program.setBuffer('normals-' + this.id, false);
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

    unsetIndices: function(program) {
      program.setBuffer('indices-' + this.id, false);
    },

    setPickingColors: function(program, force) {
      if (!this.pickingColors) return;

      if (force || this.dynamic) {
        program.setBuffer('pickingColors-' + this.id, {
          attribute: 'pickingColor',
          value: this.toFloat32Array('pickingColors'),
          size: 4
        });
      } else {
        program.setBuffer('pickingColors-' + this.id);
      }
    },

    unsetPickingColors: function(program) {
      program.setBuffer('pickingColors-' + this.id, false);
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

    unsetColors: function(program) {
      program.setBuffer('colors-' + this.id, false);
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

    unsetTexCoords: function(program) {
      program.setBuffer('texCoords-' + this.id, false);
    },

    setTextures: function(program, force) {
      this.textures = this.textures? $.splat(this.textures) : [];
      for (var i = 0, texs = this.textures, l = texs.length, mtexs = PhiloGL.Scene.MAX_TEXTURES; i < mtexs; i++) {
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
    $$family: 'model',

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
      
      if (this.pickingColors && this.pickingColors.length < lv) {
        var times = lv / this.pickingColors.length,
            pickingColors = this.pickingColors,
            pickingColorsCopy = pickingColors.slice();
        while (--times) {
          pickingColors.push.apply(pickingColors, pickingColorsCopy);
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
  //Now some primitives, Cube, Sphere, Cone, Cylinder
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
  
  //Primitives constructors inspired by TDL http://code.google.com/p/webglsamples/, 
  //copyright 2011 Google Inc. new BSD License (http://www.opensource.org/licenses/bsd-license.php).

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
      for (var y = 0; y <= nlat; y++) {
        for (var x = 0; x <= nlong; x++) {
          var u = x / nlong,
              v = y / nlat,
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

  //Code based on http://blog.andreaskahler.com/2009/06/creating-icosphere-mesh-in-code.html
  O3D.IcoSphere = function(opt) {
    var iterations = opt.iterations || 0,
        vertices = [],
        normals = [],
        indices = [],
        texCoords = [],
        sqrt = Math.sqrt,
        acos = Math.acos,
        atan2 = Math.atan2,
        pi = Math.PI,
        pi2 = pi * 2;
    
    //Add a callback for when a vertex is created
    opt.onAddVertex = opt.onAddVertex || $.empty;

    // and Icosahedron vertices
    var t = (1 + sqrt(5)) / 2,
        len = sqrt(1 + t * t);

    vertices.push(-1 / len,  t / len,  0,
                   1 / len,  t / len,  0,
                  -1 / len, -t / len,  0,
                   1 / len, -t / len,  0,

                   0, -1 / len,  t / len,
                   0,  1 / len,  t / len,
                   0, -1 / len, -t / len,
                   0,  1 / len, -t / len,

                   t / len,  0, -1 / len,
                   t / len,  0,  1 / len,
                  -t / len,  0, -1 / len,
                  -t / len,  0,  1 / len);

    
      indices.push(0, 11, 5,
                 0, 5, 1,
                 0, 1, 7,
                 0, 7, 10,
                 0, 10, 11,

                 1, 5, 9,
                 5, 11, 4,
                 11, 10, 2,
                 10, 7, 6,
                 7, 1, 8,

                 3, 9, 4,
                 3, 4, 2,
                 3, 2, 6,
                 3, 6, 8,
                 3, 8, 9,

                 4, 9, 5,
                 2, 4, 11,
                 6, 2, 10,
                 8, 6, 7,
                 9, 8, 1);

    var getMiddlePoint = (function() {
      var pointMemo = {};
      
      return function(i1, i2) {
        i1 *= 3;
        i2 *= 3;
        var mini = i1 < i2 ? i1 : i2,
            maxi = i1 > i2 ? i1 : i2,
            key = mini + '|' + maxi;

        if (key in pointMemo) {
          return pointMemo[key];
        }

        var x1 = vertices[i1    ],
            y1 = vertices[i1 + 1],
            z1 = vertices[i1 + 2],
            x2 = vertices[i2    ],
            y2 = vertices[i2 + 1],
            z2 = vertices[i2 + 2],
            xm = (x1 + x2) / 2,
            ym = (y1 + y2) / 2,
            zm = (z1 + z2) / 2,
            len = sqrt(xm * xm + ym * ym + zm * zm);

        xm /= len;
        ym /= len;
        zm /= len;

        vertices.push(xm, ym, zm);

        return (pointMemo[key] = (vertices.length / 3 - 1));
      };
    })();

    for (var i = 0; i < iterations; i++) {
      var indices2 = [];
      for (var j = 0, l = indices.length; j < l; j += 3) {
        var a = getMiddlePoint(indices[j    ], indices[j + 1]),
            b = getMiddlePoint(indices[j + 1], indices[j + 2]),
            c = getMiddlePoint(indices[j + 2], indices[j    ]);

        indices2.push(indices[j], a, c,
                      indices[j + 1], b, a,
                      indices[j + 2], c, b,
                      a, b, c);
      }
      indices = indices2;
    }

    //Calculate texCoords and normals
    for (var i = 0, l = indices.length; i < l; i += 3) {
      var i1 = indices[i    ],
          i2 = indices[i + 1],
          i3 = indices[i + 2],
          in1 = i1 * 3,
          in2 = i2 * 3,
          in3 = i3 * 3,
          iu1 = i1 * 2,
          iu2 = i2 * 2,
          iu3 = i3 * 2,
          x1 = vertices[in1    ],
          y1 = vertices[in1 + 1],
          z1 = vertices[in1 + 2],
          theta1 = acos(z1 / sqrt(x1 * x1 + y1 * y1 + z1 * z1)),
          phi1 = atan2(y1, x1),
          v1 = theta1 / pi,
          u1 = 1 - phi1 / pi2,
          x2 = vertices[in2    ],
          y2 = vertices[in2 + 1],
          z2 = vertices[in2 + 2],
          theta2 = acos(z2 / sqrt(x2 * x2 + y2 * y2 + z2 * z2)),
          phi2 = atan2(y2, x2),
          v2 = theta2 / pi,
          u2 = 1 - phi2 / pi2,
          x3 = vertices[in3    ],
          y3 = vertices[in3 + 1],
          z3 = vertices[in3 + 2],
          theta3 = acos(z3 / sqrt(x3 * x3 + y3 * y3 + z3 * z3)),
          phi3 = atan2(y3, x3),
          v3 = theta3 / pi,
          u3 = 1 - phi3 / pi2,
          vec1 = {
            x: x3 - x2,
            y: y3 - y2,
            z: z3 - z2
          },
          vec2 = {
            x: x1 - x2,
            y: y1 - y2,
            z: z1 - z2
          },
          normal = Vec3.cross(vec1, vec2).$unit();

      normals[in1    ] = normals[in2    ] = normals[in3    ] = normal.x;
      normals[in1 + 1] = normals[in2 + 1] = normals[in3 + 1] = normal.y;
      normals[in1 + 2] = normals[in2 + 2] = normals[in3 + 2] = normal.z;
      
      texCoords[iu1    ] = u1;
      texCoords[iu1 + 1] = v1;
      
      texCoords[iu2    ] = u2;
      texCoords[iu2 + 1] = v2;
      
      texCoords[iu3    ] = u3;
      texCoords[iu3 + 1] = v3;
    }

    O3D.Model.call(this, $.extend({
      vertices: vertices,
      indices: indices,
      normals: normals,
      texCoords: texCoords
    }, opt || {}));
  };

  O3D.IcoSphere.prototype = Object.create(O3D.Model.prototype);
  
  O3D.TruncatedCone = function(config) {
    var bottomRadius = config.bottomRadius || 0,
        topRadius = config.topRadius || 0,
        height = config.height || 1,
        nradial = config.nradial || 10,
        nvertical = config.nvertical || 10,
        topCap = !!config.topCap,
        bottomCap = !!config.bottomCap,
        extra = (topCap? 2 : 0) + (bottomCap? 2 : 0),
        numVertices = (nradial + 1) * (nvertical + 1 + extra),
        vertices = [],
        normals = [],
        texCoords = [],
        indices = [],
        vertsAroundEdge = nradial + 1,
        slant = Math.atan2(bottomRadius - topRadius, height),
        math = Math,
        msin = math.sin,
        mcos = math.cos,
        mpi = math.PI,
        cosSlant = mcos(slant),
        sinSlant = msin(slant),
        start = topCap? -2 : 0,
        end = nvertical + (bottomCap? 2 : 0);

    for (var i = start; i <= end; i++) {
      var v = i / nvertical,
          y = height * v,
          ringRadius;
      
      if (i < 0) {
        y = 0;
        v = 1;
        ringRadius = bottomRadius;
      } else if (i > nvertical) {
        y = height;
        v = 1;
        ringRadius = topRadius;
      } else {
        ringRadius = bottomRadius +
          (topRadius - bottomRadius) * (i / nvertical);
      }
      if (i == -2 || i == nvertical + 2) {
        ringRadius = 0;
        v = 0;
      }
      y -= height / 2;
      for (var j = 0; j < vertsAroundEdge; j++) {
        var sin = msin(j * mpi * 2 / nradial);
        var cos = mcos(j * mpi * 2 / nradial);
        vertices.push(sin * ringRadius, y, cos * ringRadius);
        normals.push(
            (i < 0 || i > nvertical) ? 0 : (sin * cosSlant),
            (i < 0) ? -1 : (i > nvertical ? 1 : sinSlant),
            (i < 0 || i > nvertical) ? 0 : (cos * cosSlant));
        texCoords.push(j / nradial, v);
      }
    }

    for (i = 0; i < nvertical + extra; i++) {
      for (j = 0; j < nradial; j++) {
        indices.push(vertsAroundEdge * (i + 0) + 0 + j,
                     vertsAroundEdge * (i + 0) + 1 + j,
                     vertsAroundEdge * (i + 1) + 1 + j,
                      
                     vertsAroundEdge * (i + 0) + 0 + j,
                     vertsAroundEdge * (i + 1) + 1 + j,
                     vertsAroundEdge * (i + 1) + 0 + j);
      }
    }

    O3D.Model.call(this, $.extend({
      vertices: vertices,
      normals: normals,
      texCoords: texCoords,
      indices: indices
    }, config || {}));
  };
  
  O3D.TruncatedCone.prototype = Object.create(O3D.Model.prototype);
  
  O3D.Cone = function(config) {
    config.topRadius = 0;
    config.topCap = !!config.cap;
    config.bottomCap = !!config.cap;
    config.bottomRadius = config.radius || 3;
    O3D.TruncatedCone.call(this, config);
  };

  O3D.Cone.prototype = Object.create(O3D.TruncatedCone.prototype);

  O3D.Cylinder = function(config) {
    config.bottomRadius = config.radius;
    config.topRadius = config.radius;
    O3D.TruncatedCone.call(this, config);
  };

  O3D.Cylinder.prototype = Object.create(O3D.TruncatedCone.prototype);
  

  O3D.Plane = function(config) {
    var type = config.type,
        coords = type.split(','),
        c1len = config[coords[0] + 'len'], //width
        c2len = config[coords[1] + 'len'], //height
        subdivisions1 = config['n' + coords[0]] || 1, //subdivisionsWidth
        subdivisions2 = config['n' + coords[1]] || 1, //subdivisionsDepth
        offset = config.offset
        numVertices = (subdivisions1 + 1) * (subdivisions2 + 1),
        positions = [],
        normals = [],
        texCoords = [];

    for (var z = 0; z <= subdivisions2; z++) {
      for (var x = 0; x <= subdivisions1; x++) {
        var u = x / subdivisions1,
            v = z / subdivisions2;
        
        texCoords.push(u, v);
        
        switch (type) {
          case 'x,y':
            positions.push(c1len * u - c1len * 0.5,
                           c2len * v - c2len * 0.5,
                           offset);
            normals.push(0, 0, 1);
          break;

          case 'x,z':
            positions.push(c1len * u - c1len * 0.5,
                           offset,
                           c2len * v - c2len * 0.5);
            normals.push(0, 1, 0);
          break;

          case 'y,z':
            positions.push(offset,
                           c1len * u - c1len * 0.5,
                           c2len * v - c2len * 0.5);
            normals.push(1, 0, 0);
          break;
        }
      }
    }

    var numVertsAcross = subdivisions1 + 1,
        indices = [];

    for (z = 0; z < subdivisions2; z++) {
      for (x = 0; x < subdivisions1; x++) {
        // Make triangle 1 of quad.
        indices.push((z + 0) * numVertsAcross + x,
                     (z + 1) * numVertsAcross + x,
                     (z + 0) * numVertsAcross + x + 1);

        // Make triangle 2 of quad.
        indices.push((z + 1) * numVertsAcross + x,
                     (z + 1) * numVertsAcross + x + 1,
                     (z + 0) * numVertsAcross + x + 1);
      }
    }

    O3D.Model.call(this, $.extend({
      vertices: positions,
      normals: normals,
      texCoords: texCoords,
      indices: indices
    }, config));

  };

  O3D.Plane.prototype = Object.create(O3D.Model.prototype);

  //unique id
  O3D.id = $.time();

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
    "#define LIGHT_MAX 40",
    
    "attribute vec3 position;",
    "attribute vec3 normal;",
    "attribute vec4 color;",
    "attribute vec4 pickingColor;",
    "attribute vec2 texCoord1;",
    
    "uniform mat4 modelViewMatrix;",
    "uniform mat4 viewMatrix;",
    "uniform mat4 projectionMatrix;",
    "uniform mat4 normalMatrix;",

    "uniform bool enableLights;",
    "uniform vec3 ambientColor;",
    "uniform vec3 directionalColor;",
    "uniform vec3 lightingDirection;",

    "uniform vec3 pointLocation[LIGHT_MAX];",
    "uniform vec3 pointColor[LIGHT_MAX];",
    "uniform int numberPoints;",
   
    "varying vec4 vColor;",
    "varying vec4 vPickingColor;",
    "varying vec2 vTexCoord;",
    "varying vec3 lightWeighting;",
    
    "void main(void) {",
      "vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);",
      
      "if(!enableLights) {",
        "lightWeighting = vec3(1.0, 1.0, 1.0);",
      "} else {",
        "vec3 plightDirection;",
        "vec3 pointWeight = vec3(0.0, 0.0, 0.0);",
        "vec4 transformedNormal = normalMatrix * vec4(normal, 1.0);",
        "float directionalLightWeighting = max(dot(transformedNormal.xyz, lightingDirection), 0.0);",
        "for (int i = 0; i < LIGHT_MAX; i++) {",
          "if (i < numberPoints) {",
            "plightDirection = normalize((viewMatrix * vec4(pointLocation[i], 1.0)).xyz - mvPosition.xyz);",
            "pointWeight += max(dot(transformedNormal.xyz, plightDirection), 0.0) * pointColor[i];",
          "} else {",
            "break;",
          "}",
        "}",

        "lightWeighting = ambientColor + (directionalColor * directionalLightWeighting) + pointWeight;",
      "}",
      
      "vColor = color;",
      "vPickingColor = pickingColor;",
      "vTexCoord = texCoord1;",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}"
  
  ].join("\n");


 FragmentShaders.Default = [

    "#ifdef GL_ES",
    "precision highp float;",
    "#endif",
    
    "varying vec4 vColor;",
    "varying vec4 vPickingColor;",
    "varying vec2 vTexCoord;",
    "varying vec3 lightWeighting;",
    
    "uniform bool hasTexture1;",
    "uniform sampler2D sampler1;",

    "uniform bool enablePicking;",
    "uniform bool hasPickingColors;",
    "uniform vec3 pickColor;",

    "uniform bool hasFog;",
    "uniform vec3 fogColor;",

    "uniform float fogNear;",
    "uniform float fogFar;",

    "void main(){",
      
      "if(!hasTexture1) {",
        "gl_FragColor = vec4(vColor.rgb * lightWeighting, vColor.a);",
      "} else {",
        "gl_FragColor = vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb * lightWeighting, 1.0);",
      "}",

      "if(enablePicking) {",
        "if(hasPickingColors) {",
          "gl_FragColor = vPickingColor;",
        "} else {",
          "gl_FragColor = vec4(pickColor, 1.0);",
        "}",
      "}",
      
      /* handle fog */
      "if (hasFog) {",
        "float depth = gl_FragCoord.z / gl_FragCoord.w;",
        "float fogFactor = smoothstep(fogNear, fogFar, depth);",
        "gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w), fogFactor);",
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
        }
        //point light
        //points: []
      },
      effects: {
        fog: false
        // { near, far, color }
      }
    }, opt || {});
    
    this.program = opt.program ? program[opt.program] : program;
    this.camera = camera;
    this.models = [];
    this.config = opt;
  };

  Scene.prototype = {
    
    add: function() {
      for (var i = 0, models = this.models, l = arguments.length; i < l; i++) {
        var model = arguments[i];
        //Generate unique id for model
        model.id = model.id || $.uid();
        models.push(model);
        //Create and load Buffers
        this.defineBuffers(model);
      }
    },

    remove: function(model) {
      var models = this.models,
          indexOf = models.indexOf(model);

      if (indexOf > -1) {
        models.splice(indexOf, 1);
      }
    },

    getProgram: function(obj) {
      var program = this.program;
      if (program.$$family != 'program' && obj && obj.program) {
        program = program[obj.program];
        program.use();
        return program;
      }
      return program;
    },

    defineBuffers: function(obj) {
      var program = this.getProgram(obj);
      
      obj.setAttributes(program, true);
      obj.setVertices(program, true);
      obj.setColors(program, true);
      obj.setPickingColors(program, true);
      obj.setNormals(program, true);
      //obj.setTextures(program, true);
      obj.setTexCoords(program, true);
      obj.setIndices(program, true);
    },

    beforeRender: function(program) {
      //Setup lighting and scene effects like fog, etc.
      this.setupLighting(program);
      this.setupEffects(program);
      //Set Camera view and projection matrix
      var camera = this.camera;
      program.setUniform('projectionMatrix', camera.projection);
      program.setUniform('viewMatrix', camera.modelView);
    },

    //Setup the lighting system: ambient, directional, point lights.
    setupLighting: function(program) {
      //Setup Lighting
      var abs = Math.abs,
          camera = this.camera,
          cpos = camera.position,
          light = this.config.lights,
          ambient = light.ambient,
          directional = light.directional,
          dcolor = directional.color,
          dir = directional.direction,
          enable = light.enable,
          points = light.points && $.splat(light.points) || [],
          numberPoints = points.length,
          pointLocations = [],
          pointColors = [],
          enableSpecular = [],
          pointSpecularColors = [];
      
      //Normalize lighting direction vector
      dir = Vec3.unit(dir).$scale(-1);
      
      //Set light uniforms. Ambient and directional lights.
      program.setUniform('enableLights', enable);

      if (!enable) return;

      program.setUniform('ambientColor', [ambient.r, ambient.g, ambient.b]);
      program.setUniform('directionalColor', [dcolor.r, dcolor.g, dcolor.b]);
      program.setUniform('lightingDirection', [dir.x, dir.y, dir.z]);
      
      //Set point lights
      program.setUniform('numberPoints', numberPoints);
      for (var i = 0, l = numberPoints; i < l; i++) {
        var point = points[i],
            position = point.position,
            color = point.color || point.diffuse,
            spec = point.specular;
        
        pointLocations.push(position.x, position.y, position.z);
        pointColors.push(color.r, color.g, color.b);
        
        //Add specular color
        enableSpecular.push(+!!spec);
        if (spec) {
          pointSpecularColors.push(spec.r, spec.g, spec.b);
        } else {
          pointSpecularColors.push(0, 0, 0);
        }
      }
      
      program.setUniforms({
        'pointLocation': pointLocations,
        'pointColor': pointColors
      });
      
      program.setUniforms({
        'enableSpecular': enableSpecular,
        'pointSpecularColor': pointSpecularColors
      });
    },

    //Setup effects like fog, etc.
    setupEffects: function(program) {
      var config = this.config.effects,
          fog = config.fog,
          color = fog.color || { r: 0.5, g: 0.5, b: 0.5 };

      if (fog) {
        program.setUniforms({
          'hasFog': true,
          'fogNear': fog.near,
          'fogFar': fog.far,
          'fogColor': [color.r, color.g, color.b]
        });
      } else {
        program.setUniform('hasFog', false);
      }
    },

    //Renders all objects in the scene.
    render: function(opt) {
      opt = opt || {};
      var camera = this.camera,
          program = this.program,
          renderProgram = opt.renderProgram,
          pType = $.type(program),
          multiplePrograms = !renderProgram && pType == 'object',
          options = $.merge({
            onBeforeRender: $.empty,
            onAfterRender: $.empty
          }, opt || {});

      //If we're just using one program then
      //execute the beforeRender method once.
      !multiplePrograms && this.beforeRender(renderProgram || program);
      
      //Go through each model and render it.
      this.models.forEach(function(elem, i) {
        if (elem.display) {
          var program = renderProgram || this.getProgram(elem);
          //Setup the beforeRender method for each object
          //when there are multiple programs to be used.
          multiplePrograms && this.beforeRender(program);
          elem.onBeforeRender(program, camera);
          options.onBeforeRender(elem, i);
          this.renderObject(elem, program);
          options.onAfterRender(elem, i);
          elem.onAfterRender(program, camera);
        }
      }, this);
    },

    renderToTexture: function(name, opt) {
      opt = opt || {};
      var texture = app.textures[name + '-texture'],
          texMemo = app.textureMemo[name + '-texture'];
      
      this.render(opt);

      gl.bindTexture(texMemo.textureType, texture);
      gl.generateMipmap(texMemo.textureType);
      gl.bindTexture(texMemo.textureType, null);
    },

    renderObject: function(obj, program) {
      var camera = this.camera,
          view = new Mat4;

      obj.setUniforms(program);
      obj.setAttributes(program);
      obj.setShininess(program);
      obj.setVertices(program);
      obj.setColors(program);
      obj.setPickingColors(program);
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
          gl.drawArrays(gl.get(obj.drawType || 'TRIANGLES'), 0, obj.vertices.length / 3);
        }
      }
      
      obj.unsetAttributes(program);
      obj.unsetVertices(program);
      obj.unsetColors(program);
      obj.unsetPickingColors(program);
      obj.unsetNormals(program);
      obj.unsetTexCoords(program);
      obj.unsetIndices(program);
    },
    
    //setup picking framebuffer
    setupPicking: function() {
      //create picking program
      var program = PhiloGL.Program.fromDefaultShaders();
      //create framebuffer
      app.setFrameBuffer('$picking', {
        width: 1,
        height: 1,
        bindToTexture: {
          parameters: [{
            name: 'TEXTURE_MAG_FILTER',
            value: 'LINEAR'
          }, {
            name: 'TEXTURE_MIN_FILTER',
            value: 'LINEAR',
            generateMipmap: false
          }]
        },
        bindToRenderBuffer: true
      });
      app.setFrameBuffer('$picking', false);
      this.pickingProgram = program;
    },
    
    //returns an element at the given position
    pick: function(x, y) {
      if (!this.pickingProgram) {
        this.setupPicking();
      }

      var o3dHash = {},
          o3dList = [],
          program = app.usedProgram,
          pickingProgram = this.pickingProgram,
          camera = this.camera,
          config = this.config,
          memoLightEnable = config.lights.enable,
          memoFog = config.effects.fog,
          width = gl.canvas.width,
          height = gl.canvas.height,
          hash = [],
          pixel = new Uint8Array(1 * 1 * 4),
          index = 0, backgroundColor;

      //setup the scene for picking
      config.lights.enable = false;
      config.effects.fog = false;
      
      //enable picking and render to texture
      pickingProgram.use();
      app.setFrameBuffer('$picking', true);
      pickingProgram.setUniform('enablePicking', true);
      
      //render the scene to a texture
      gl.disable(gl.BLEND);
      gl.viewport(-x, y - height, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //read the background color so we don't step on it
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      backgroundColor = pixel[0] + pixel[1] * 256 + pixel[2] * 256 * 256;

      //render to texture
      this.renderToTexture('$picking', {
        renderProgram: pickingProgram,
        onBeforeRender: function(elem, i) {
          if (i == backgroundColor) {
            index = 1;
          }
          var suc = i + index,
              hasPickingColors = !!elem.pickingColors;

          pickingProgram.setUniform('hasPickingColors', hasPickingColors);

          if (!hasPickingColors) {
            hash[0] = suc % 256;
            hash[1] = ((suc / 256) >> 0) % 256;
            hash[2] = ((suc / (256 * 256)) >> 0) % 256;
            pickingProgram.setUniform('pickColor', [hash[0] / 255, hash[1] / 255, hash[2] / 255]);
            o3dHash[hash.join()] = elem;
          } else {
            o3dList.push(elem);
          }
        }
      });
      
      //grab the color of the pointed pixel in the texture
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      var stringColor = [pixel[0], pixel[1], pixel[2]].join(),
          elem = o3dHash[stringColor],
          pick;

      if (!elem) {
        for (var i = 0, l = o3dList.length; i < l; i++) {
          elem = o3dList[i];
          pick = elem.pick(pixel);
          if (pick !== false) {
            elem.$pickingIndex = pick;
          } else {
            elem = false;
          }
        }
      }

      //restore all values and unbind buffers
      app.setFrameBuffer('$picking', false);
      pickingProgram.setUniform('enablePicking', false);
      config.lights.enable = memoLightEnable;
      config.effects.fog = memoFog;
      
      //If there was another program then set to reuse that program.
      if (program) program.use();
      
      return elem && elem.pickable && elem;
    }
  };
  
  Scene.MAX_TEXTURES = 3;
  Scene.MAX_POINT_LIGHTS = 50;

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

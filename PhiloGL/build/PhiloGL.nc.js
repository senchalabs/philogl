/**
@preserve
Copyright (c) 2011 Sencha Labs - Author: Nicolas Garcia Belmonte (http://philogb.github.com/)

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
              if (count === 0 && !error) {
                loadProgramDeps(gl, programLength == 1? p : programs, function(app) {
                  opt.onLoad(app);
                });
              }
            },
            onError: function(p) {
              count--;
              opt.onError(p);
              error = true;
            }
          };
        })();

    optProgram.forEach(function(optProgram, i) {
      var pfrom = optProgram.from, program;
      for (var p in popt) {
        if (pfrom == p) {
          try {
            program = PhiloGL.Program[popt[p]]($.extend(programCallback, optProgram));
          } catch(e) {
            programCallback.onError(e);
          }
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
  branch = branch || globalContext;
  ['Vec3', 'Mat4', 'Quat', 'Camera', 'Program', 'WebGL', 'O3D',
   'Scene', 'Shaders', 'IO', 'Events', 'WorkerGroup', 'Fx', 'Media'].forEach(function(module) {
      branch[module] = PhiloGL[module];
  });
  branch.gl = gl;
  branch.Utils = $;
};

//Version
PhiloGL.version = '1.5.2';

//Holds the 3D context, holds the application
var gl, app, globalContext = this;

//Utility functions
function $(d) {
  return document.getElementById(d);
}

$.empty = function() {};

$.time = Date.now;

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
        if(opt) {
          gl.bindBuffer(opt.bufferType, null);
        }
        //disable vertex attrib array if the buffer maps to an attribute.
        var attributeName = opt && opt.attribute || name,
            loc = program.attributes[attributeName];
        //disable the attribute array
        if (loc !== undefined) {
          gl.disableVertexAttribArray(loc);
        }
        return;
      }

      //set defaults
      opt = $.extend(this.bufferMemo[name] || {
        bufferType: gl.ARRAY_BUFFER,
        size: 1,
        dataType: gl.FLOAT,
        stride: 0,
        offset: 0,
        drawType: gl.STATIC_DRAW
      }, opt || {});

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

      if (isAttribute) {
        gl.enableVertexAttribArray(loc);
      }

      gl.bindBuffer(bufferType, buffer);

      if (hasValue) {
        gl.bufferData(bufferType, value, drawType);
      }

      if (isAttribute) {
        gl.vertexAttribPointer(loc, size, dataType, false, stride, offset);
      }

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
      opt = $.merge(this.frameBufferMemo[name] || {
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
      }, opt || {});

      var bindToTexture = opt.bindToTexture,
          bindToRenderBuffer = opt.bindToRenderBuffer,
          hasBuffer = name in this.frameBuffers,
          frameBuffer = hasBuffer? this.frameBuffers[name] : gl.createFramebuffer();

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
        var rbBindOpt = $.extend({
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

      opt = $.extend(this.renderBufferMemo[name] || {
        storageType: gl.DEPTH_COMPONENT16,
        width: 0,
        height: 0
      }, opt || {});

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

      if (opt.data && opt.data.type === gl.FLOAT) {
        // Enable floating-point texture.
        if (!gl.getExtension('OES_texture_float')) {
          throw 'OES_texture_float is not supported';
        }
      }

      //get defaults
      opt = $.merge(this.textureMemo[name] || {
        textureType: gl.TEXTURE_2D,
        pixelStore: [{
          name: gl.UNPACK_FLIP_Y_WEBGL,
          value: true
        }, {
          name: gl.UNPACK_ALIGNMENT,
          value: 1
        }],
        parameters: [{
          name: gl.TEXTURE_MAG_FILTER,
          value: gl.NEAREST
        }, {
          name: gl.TEXTURE_MIN_FILTER,
          value: gl.NEAREST
        }, {
          name: gl.TEXTURE_WRAP_S,
          value: gl.CLAMP_TO_EDGE
        }, {
          name: gl.TEXTURE_WRAP_T,
          value: gl.CLAMP_TO_EDGE
        }],
        data: {
          format: gl.RGBA,
          value: false,
          type: gl.UNSIGNED_BYTE,

          width: 0,
          height: 0,
          border: 0
        }

      }, opt || {});

      var textureType = ('textureType' in opt)? opt.textureType = gl.get(opt.textureType) : gl.TEXTURE_2D,
          textureTarget = ('textureTarget' in opt)? opt.textureTarget = gl.get(opt.textureTarget) : textureType,
          isCube = textureType == gl.TEXTURE_CUBE_MAP,
          hasTexture = name in this.textures,
          texture = hasTexture? this.textures[name] : gl.createTexture(),
          pixelStore = opt.pixelStore,
          parameters = opt.parameters,
          data = opt.data,
          value = data.value,
          type = data.type,
          format = data.format,
          hasValue = !!data.value;

      //save texture
      if (!hasTexture) {
        this.textures[name] = texture;
      }
      gl.bindTexture(textureType, texture);
      if (!hasTexture) {
        //set texture properties
        pixelStore.forEach(function(opt) {
          opt.name = typeof opt.name == 'string'? gl.get(opt.name) : opt.name;
          gl.pixelStorei(opt.name, opt.value);
        });
      }

      //load texture
      if (hasValue) {
        //beware that we can be loading multiple textures (i.e. it could be a cubemap)
        if (isCube) {
          for (var i = 0; i < 6; ++i) {
            if ((data.width || data.height) && (!value.width && !value.height)) {
              gl.texImage2D(textureTarget[i], 0, format, data.width, data.height, data.border, format, type, value[i]);
            } else {
              gl.texImage2D(textureTarget[i], 0, format, format, type, value[i]);
            }
          }
        } else {
          if ((data.width || data.height) && (!value.width && !value.height)) {
            gl.texImage2D(textureTarget, 0, format, data.width, data.height, data.border, format, type, value);
          } else {
            gl.texImage2D(textureTarget, 0, format, format, type, value);
          }
        }

      //we're setting a texture to a framebuffer
      } else if (data.width || data.height) {
        gl.texImage2D(textureTarget, 0, format, data.width, data.height, data.border, format, type, null);
      }
      //set texture parameters
      if (!hasTexture) {
        for (i = 0; i < parameters.length ;i++) {
          var opti = parameters[i];
          opti.name = gl.get(opti.name);
          opti.value = gl.get(opti.value);
          gl.texParameteri(textureType, opti.name, opti.value);
          if (opti.generateMipmap) {
            gl.generateMipmap(textureType);
          }
        }
      }
      //remember whether the texture is a cubemap or not
      opt.isCube = isCube;

      //set default options so we don't have to next time.
      if (hasValue) {
        opt.data.value = false;
      }

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
    PhiloGL.hasExtension = function(name) {
      if (!PhiloGL.hasWebGL()) return false;
      var canvas = document.createElement('canvas');
      return (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')).getExtension(name);
    };
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
      slice = Array.prototype.slice,
      typedArray = this.Float32Array,
      //As of version 12 Chrome does not support call/apply on typed array constructors.
      ArrayImpl = (function() {
        if (!typedArray || !typedArray.call) {
          return Array;
        }
        try {
          typedArray.call({}, 10);
        } catch (e) {
          return Array;
        }
        return typedArray;
      })(),
      typed = ArrayImpl != Array;

  //create property descriptor
  function descriptor(index) {
    return {
      get: function() {
        return this[index];
      },
      set: function(val) {
        this[index] = val;
      },
      configurable: false,
      enumerable: false
    };
  }

  //Vec3 Class
  var Vec3 = function(x, y, z) {
    if (typed) {
      typedArray.call(this, 3);

      this[0] = x || 0;
      this[1] = y || 0;
      this[2] = z || 0;
    } else {
      
      this.push(x || 0,
                y || 0,
                z || 0);
    }

    this.typedContainer = new typedArray(3);
  };

  //fast Vec3 create.
  Vec3.create = function() {
    return new typedArray(3);
  };

  //create fancy x, y, z setters and getters.
  Vec3.prototype = Object.create(ArrayImpl.prototype, {
    $$family: {
      value: 'Vec3'
    },
    
    x: descriptor(0),
    y: descriptor(1),
    z: descriptor(2)
  });

  var generics = {
    
    setVec3: function(dest, vec) {
      dest[0] = vec[0];
      dest[1] = vec[1];
      dest[2] = vec[2];
      return dest;
    },

    set: function(dest, x, y, z) {
      dest[0] = x;
      dest[1] = y;
      dest[2] = z;
      return dest;
    },
    
    add: function(dest, vec) {
      return new Vec3(dest[0] + vec[0],
                      dest[1] + vec[1], 
                      dest[2] + vec[2]);
    },
    
    $add: function(dest, vec) {
      dest[0] += vec[0];
      dest[1] += vec[1];
      dest[2] += vec[2];
      return dest;
    },
    
    add2: function(dest, a, b) {
      dest[0] = a[0] + b[0];
      dest[1] = a[1] + b[1];
      dest[2] = a[2] + b[2];
      return dest;
    },
    
    sub: function(dest, vec) {
      return new Vec3(dest[0] - vec[0],
                      dest[1] - vec[1], 
                      dest[2] - vec[2]);
    },
    
    $sub: function(dest, vec) {
      dest[0] -= vec[0];
      dest[1] -= vec[1];
      dest[2] -= vec[2];
      return dest;
    },
    
    sub2: function(dest, a, b) {
      dest[0] = a[0] - b[0];
      dest[1] = a[1] - b[1];
      dest[2] = a[2] - b[2];
      return dest;
    },
    
    scale: function(dest, s) {
      return new Vec3(dest[0] * s,
                      dest[1] * s,
                      dest[2] * s);
    },
    
    $scale: function(dest, s) {
      dest[0] *= s;
      dest[1] *= s;
      dest[2] *= s;
      return dest;
    },

    neg: function(dest) {
      return new Vec3(-dest[0],
                      -dest[1],
                      -dest[2]);
    },

    $neg: function(dest) {
      dest[0] = -dest[0];
      dest[1] = -dest[1];
      dest[2] = -dest[2];
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
      var dx = dest[0],
          dy = dest[1],
          dz = dest[2],
          vx = vec[0],
          vy = vec[1],
          vz = vec[2];
      
      return new Vec3(dy * vz - dz * vy,
                      dz * vx - dx * vz,
                      dx * vy - dy * vx);
    },
    
    $cross: function(dest, vec) {
      var dx = dest[0],
          dy = dest[1],
          dz = dest[2],
          vx = vec[0],
          vy = vec[1],
          vz = vec[2];

      dest[0] = dy * vz - dz * vy;
      dest[1] = dz * vx - dx * vz;
      dest[2] = dx * vy - dy * vx;
      return dest;
    },

    distTo: function(dest, vec) {
      var dx = dest[0] - vec[0],
          dy = dest[1] - vec[1],
          dz = dest[2] - vec[2];
      
      return sqrt(dx * dx + 
                  dy * dy + 
                  dz * dz);
    },

    distToSq: function(dest, vec) {
      var dx = dest[0] - vec[0],
          dy = dest[1] - vec[1],
          dz = dest[2] - vec[2];

      return dx * dx + dy * dy + dz * dz;
    },

    norm: function(dest) {
      var dx = dest[0], dy = dest[1], dz = dest[2];

      return sqrt(dx * dx + dy * dy + dz * dz);
    },

    normSq: function(dest) {
      var dx = dest[0], dy = dest[1], dz = dest[2];

      return dx * dx + dy * dy + dz * dz;
    },

    dot: function(dest, vec) {
      return dest[0] * vec[0] + dest[1] * vec[1] + dest[2] * vec[2];
    },

    clone: function(dest) {
      if (dest.$$family) {
        return new Vec3(dest[0], dest[1], dest[2]);
      } else {
        return Vec3.setVec3(new typedArray(3), dest);
      }
    },

    toFloat32Array: function(dest) {
          var ans = dest.typedContainer;

          if (!ans) return dest;
          
          ans[0] = dest[0];
          ans[1] = dest[1];
          ans[2] = dest[2];

          return ans;
    }
  };
  
  //add generics and instance methods
  var proto = Vec3.prototype;
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
    
    ArrayImpl.call(this, 16);

    this.length = 16;
    
    if (typeof n11 == 'number') {
      
      this.set(n11, n12, n13, n14,
               n21, n22, n23, n24,
               n31, n32, n33, n34,
               n41, n42, n43, n44);
    
    } else {
      this.id();
    }

    this.typedContainer = new typedArray(16);
  };

  Mat4.create = function() {
   return new typedArray(16);
  };

  //create fancy components setters and getters.
  Mat4.prototype = Object.create(ArrayImpl.prototype, {
    
    $$family: {
      value: 'Mat4'
    },
    
    n11: descriptor(0),
    n12: descriptor(4),
    n13: descriptor(8),
    n14: descriptor(12),
    
    n21: descriptor(1),
    n22: descriptor(5),
    n23: descriptor(9),
    n24: descriptor(13),

    n31: descriptor(2),
    n32: descriptor(6),
    n33: descriptor(10),
    n34: descriptor(14),

    n41: descriptor(3),
    n42: descriptor(7),
    n43: descriptor(11),
    n44: descriptor(15)
  
  });

  generics = {
    
    id: function(dest) {
      
      dest[0 ] = 1;
      dest[1 ] = 0;
      dest[2 ] = 0;
      dest[3 ] = 0;
      dest[4 ] = 0;
      dest[5 ] = 1;
      dest[6 ] = 0;
      dest[7 ] = 0;
      dest[8 ] = 0;
      dest[9 ] = 0;
      dest[10] = 1;
      dest[11] = 0;
      dest[12] = 0;
      dest[13] = 0;
      dest[14] = 0;
      dest[15] = 1;
      
      return dest;
    },

    clone: function(dest) {
      if (dest.$$family) {
        return new Mat4(dest[0], dest[4], dest[8], dest[12],
                        dest[1], dest[5], dest[9], dest[13],
                        dest[2], dest[6], dest[10], dest[14],
                        dest[3], dest[7], dest[11], dest[15]);
      } else {
        return new typedArray(dest);
      }
    },

    set: function(dest, n11, n12, n13, n14,
                        n21, n22, n23, n24,
                        n31, n32, n33, n34,
                        n41, n42, n43, n44) {
      
      dest[0 ] = n11;
      dest[4 ] = n12;
      dest[8 ] = n13;
      dest[12] = n14;
      dest[1 ] = n21;
      dest[5 ] = n22;
      dest[9 ] = n23;
      dest[13] = n24;
      dest[2 ] = n31;
      dest[6 ] = n32;
      dest[10] = n33;
      dest[14] = n34;
      dest[3 ] = n41;
      dest[7 ] = n42;
      dest[11] = n43;
      dest[15] = n44;
      
      return dest;
    },

    mulVec3: function(dest, vec) {
      var ans = Vec3.clone(vec);
      return Mat4.$mulVec3(dest, ans);
    },

    $mulVec3: function(dest, vec) {
      var vx = vec[0],
          vy = vec[1],
          vz = vec[2],
          d = 1 / (dest[3] * vx + dest[7] * vy + dest[11] * vz + dest[15]);

      vec[0] = (dest[0] * vx + dest[4] * vy + dest[8 ] * vz + dest[12]) * d;
      vec[1] = (dest[1] * vx + dest[5] * vy + dest[9 ] * vz + dest[13]) * d;
      vec[2] = (dest[2] * vx + dest[6] * vy + dest[10] * vz + dest[14]) * d;

      return vec;
    },

    mulMat42: function(dest, a, b) {
      var a11 = a[0 ], a12 = a[1 ], a13 = a[2 ], a14 = a[3 ],
          a21 = a[4 ], a22 = a[5 ], a23 = a[6 ], a24 = a[7 ],
          a31 = a[8 ], a32 = a[9 ], a33 = a[10], a34 = a[11],
          a41 = a[12], a42 = a[13], a43 = a[14], a44 = a[15],
          b11 = b[0 ], b12 = b[1 ], b13 = b[2 ], b14 = b[3 ],
          b21 = b[4 ], b22 = b[5 ], b23 = b[6 ], b24 = b[7 ],
          b31 = b[8 ], b32 = b[9 ], b33 = b[10], b34 = b[11],
          b41 = b[12], b42 = b[13], b43 = b[14], b44 = b[15];


      dest[0 ] = b11 * a11 + b12 * a21 + b13 * a31 + b14 * a41;
      dest[1 ] = b11 * a12 + b12 * a22 + b13 * a32 + b14 * a42;
      dest[2 ] = b11 * a13 + b12 * a23 + b13 * a33 + b14 * a43;
      dest[3 ] = b11 * a14 + b12 * a24 + b13 * a34 + b14 * a44;

      dest[4 ] = b21 * a11 + b22 * a21 + b23 * a31 + b24 * a41;
      dest[5 ] = b21 * a12 + b22 * a22 + b23 * a32 + b24 * a42;
      dest[6 ] = b21 * a13 + b22 * a23 + b23 * a33 + b24 * a43;
      dest[7 ] = b21 * a14 + b22 * a24 + b23 * a34 + b24 * a44;

      dest[8 ] = b31 * a11 + b32 * a21 + b33 * a31 + b34 * a41;
      dest[9 ] = b31 * a12 + b32 * a22 + b33 * a32 + b34 * a42;
      dest[10] = b31 * a13 + b32 * a23 + b33 * a33 + b34 * a43;
      dest[11] = b31 * a14 + b32 * a24 + b33 * a34 + b34 * a44;

      dest[12] = b41 * a11 + b42 * a21 + b43 * a31 + b44 * a41;
      dest[13] = b41 * a12 + b42 * a22 + b43 * a32 + b44 * a42;
      dest[14] = b41 * a13 + b42 * a23 + b43 * a33 + b44 * a43;
      dest[15] = b41 * a14 + b42 * a24 + b43 * a34 + b44 * a44;
      return dest;
    },
    
    mulMat4: function(a, b) {
      var m = Mat4.clone(a);
      return Mat4.mulMat42(m, a, b);
    },

    $mulMat4: function(a, b) {
      return Mat4.mulMat42(a, a, b);
    },

    add: function(dest, m) {
      var copy = Mat4.clone(dest);
      return Mat4.$add(copy, m);
    },
   
    $add: function(dest, m) {
      dest[0 ] += m[0];
      dest[1 ] += m[1];
      dest[2 ] += m[2];
      dest[3 ] += m[3];
      dest[4 ] += m[4];
      dest[5 ] += m[5];
      dest[6 ] += m[6];
      dest[7 ] += m[7];
      dest[8 ] += m[8];
      dest[9 ] += m[9];
      dest[10] += m[10];
      dest[11] += m[11];
      dest[12] += m[12];
      dest[13] += m[13];
      dest[14] += m[14];
      dest[15] += m[15];
      
      return dest;
    },

    transpose: function(dest) {
      var m = Mat4.clone(dest);
      return Mat4.$transpose(m);
    },

    $transpose: function(dest) {
      var n4 = dest[4], n8 = dest[8], n12 = dest[12],
          n1 = dest[1], n9 = dest[9], n13 = dest[13],
          n2 = dest[2], n6 = dest[6], n14 = dest[14],
          n3 = dest[3], n7 = dest[7], n11 = dest[11];

      dest[1] = n4;
      dest[2] = n8;
      dest[3] = n12;
      dest[4] = n1;
      dest[6] = n9;
      dest[7] = n13;
      dest[8] = n2;
      dest[9] = n6;
      dest[11] = n14;
      dest[12] = n3;
      dest[13] = n7;
      dest[14] = n11;

      return dest;
    },

    rotateAxis: function(dest, theta, vec) {
      var m = Mat4.clone(dest);
      return Mat4.$rotateAxis(m, theta, vec);
    },

    $rotateAxis: function(dest, theta, vec) {
      var s = sin(theta), 
          c = cos(theta), 
          nc = 1 - c,
          vx = vec[0], 
          vy = vec[1], 
          vz = vec[2],
          m11 = vx * vx * nc + c, 
          m12 = vx * vy * nc + vz * s, 
          m13 = vx * vz * nc - vy * s,
          m21 = vy * vx * nc - vz * s, 
          m22 = vy * vy * nc + c, 
          m23 = vy * vz * nc + vx * s,
          m31 = vx * vz * nc + vy * s, 
          m32 = vy * vz * nc - vx * s, 
          m33 = vz * vz * nc + c,
          d11 = dest[0],
          d12 = dest[1],
          d13 = dest[2],
          d14 = dest[3],
          d21 = dest[4],
          d22 = dest[5],
          d23 = dest[6],
          d24 = dest[7],
          d31 = dest[8],
          d32 = dest[9],
          d33 = dest[10],
          d34 = dest[11],
          d41 = dest[12],
          d42 = dest[13],
          d43 = dest[14],
          d44 = dest[15];
      
      dest[0 ] = d11 * m11 + d21 * m12 + d31 * m13;
      dest[1 ] = d12 * m11 + d22 * m12 + d32 * m13;
      dest[2 ] = d13 * m11 + d23 * m12 + d33 * m13;
      dest[3 ] = d14 * m11 + d24 * m12 + d34 * m13;

      dest[4 ] = d11 * m21 + d21 * m22 + d31 * m23;
      dest[5 ] = d12 * m21 + d22 * m22 + d32 * m23;
      dest[6 ] = d13 * m21 + d23 * m22 + d33 * m23;
      dest[7 ] = d14 * m21 + d24 * m22 + d34 * m23;

      dest[8 ] = d11 * m31 + d21 * m32 + d31 * m33;
      dest[9 ] = d12 * m31 + d22 * m32 + d32 * m33;
      dest[10] = d13 * m31 + d23 * m32 + d33 * m33;
      dest[11] = d14 * m31 + d24 * m32 + d34 * m33;

      return dest;
    },

    rotateXYZ: function(dest, rx, ry, rz) {
      var ans = Mat4.clone(dest);
      return Mat4.$rotateXYZ(ans, rx, ry, rz);
    },

    $rotateXYZ: function(dest, rx, ry, rz) {
      var d11 = dest[0 ],
          d12 = dest[1 ],
          d13 = dest[2 ],
          d14 = dest[3 ],
          d21 = dest[4 ],
          d22 = dest[5 ],
          d23 = dest[6 ],
          d24 = dest[7 ],
          d31 = dest[8 ],
          d32 = dest[9 ],
          d33 = dest[10],
          d34 = dest[11],
          crx = cos(rx),
          cry = cos(ry),
          crz = cos(rz),
          srx = sin(rx),
          sry = sin(ry),
          srz = sin(rz),
          m11 =  cry * crz,
          m21 = -crx * srz + srx * sry * crz,
          m31 =  srx * srz + crx * sry * crz,
          m12 =  cry * srz, 
          m22 =  crx * crz + srx * sry * srz, 
          m32 = -srx * crz + crx * sry * srz, 
          m13 = -sry,
          m23 =  srx * cry,
          m33 =  crx * cry;

      dest[0 ] = d11 * m11 + d21 * m12 + d31 * m13;
      dest[1 ] = d12 * m11 + d22 * m12 + d32 * m13;
      dest[2 ] = d13 * m11 + d23 * m12 + d33 * m13;
      dest[3 ] = d14 * m11 + d24 * m12 + d34 * m13;
      
      dest[4 ] = d11 * m21 + d21 * m22 + d31 * m23;
      dest[5 ] = d12 * m21 + d22 * m22 + d32 * m23;
      dest[6 ] = d13 * m21 + d23 * m22 + d33 * m23;
      dest[7 ] = d14 * m21 + d24 * m22 + d34 * m23;
      
      dest[8 ] = d11 * m31 + d21 * m32 + d31 * m33;
      dest[9 ] = d12 * m31 + d22 * m32 + d32 * m33;
      dest[10] = d13 * m31 + d23 * m32 + d33 * m33;
      dest[11] = d14 * m31 + d24 * m32 + d34 * m33;

      return dest;
    },

    translate: function(dest, x, y, z) {
      var m = Mat4.clone(dest);
      return Mat4.$translate(m, x, y, z);
    },

    $translate: function(dest, x, y, z) {
      dest[12] = dest[0 ] * x + dest[4 ] * y + dest[8 ] * z + dest[12];
      dest[13] = dest[1 ] * x + dest[5 ] * y + dest[9 ] * z + dest[13];
      dest[14] = dest[2 ] * x + dest[6 ] * y + dest[10] * z + dest[14];
      dest[15] = dest[3 ] * x + dest[7 ] * y + dest[11] * z + dest[15];
      
      return dest;
    },


    scale: function(dest, x, y, z) {
      var m = Mat4.clone(dest);
      return Mat4.$scale(m, x, y, z);
    },

    $scale: function(dest, x, y, z) {
      dest[0 ] *= x;
      dest[1 ] *= x;
      dest[2 ] *= x;
      dest[3 ] *= x;
      dest[4 ] *= y;
      dest[5 ] *= y;
      dest[6 ] *= y;
      dest[7 ] *= y;
      dest[8 ] *= z;
      dest[9 ] *= z;
      dest[10] *= z;
      dest[11] *= z;
      
      return dest;
    },

    //Method based on PreGL https://github.com/deanm/pregl/ (c) Dean McNamee.
    invert: function(dest) {
      var m = Mat4.clone(dest);
      return  Mat4.$invert(m);
    },

    $invert: function(dest) {
      var x0 = dest[0],  x1 = dest[1],  x2 = dest[2],  x3 = dest[3],
          x4 = dest[4],  x5 = dest[5],  x6 = dest[6],  x7 = dest[7],
          x8 = dest[8],  x9 = dest[9], x10 = dest[10], x11 = dest[11],
          x12 = dest[12], x13 = dest[13], x14 = dest[14], x15 = dest[15];

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

      dest[0 ] = (+ x5*b5 - x6*b4 + x7*b3) * invdet;
      dest[1 ] = (- x1*b5 + x2*b4 - x3*b3) * invdet;
      dest[2 ] = (+ x13*a5 - x14*a4 + x15*a3) * invdet;
      dest[3 ] = (- x9*a5 + x10*a4 - x11*a3) * invdet;
      dest[4 ] = (- x4*b5 + x6*b2 - x7*b1) * invdet;
      dest[5 ] = (+ x0*b5 - x2*b2 + x3*b1) * invdet;
      dest[6 ] = (- x12*a5 + x14*a2 - x15*a1) * invdet;
      dest[7 ] = (+ x8*a5 - x10*a2 + x11*a1) * invdet;
      dest[8 ] = (+ x4*b4 - x5*b2 + x7*b0) * invdet;
      dest[9 ] = (- x0*b4 + x1*b2 - x3*b0) * invdet;
      dest[10] = (+ x12*a4 - x13*a2 + x15*a0) * invdet;
      dest[11] = (- x8*a4 + x9*a2 - x11*a0) * invdet;
      dest[12] = (- x4*b3 + x5*b1 - x6*b0) * invdet;
      dest[13] = (+ x0*b3 - x1*b1 + x2*b0) * invdet;
      dest[14] = (- x12*a3 + x13*a1 - x14*a0) * invdet;
      dest[15] = (+ x8*a3 - x9*a1 + x10*a0) * invdet;

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
      return Mat4.set(dest, x[0], x[1], x[2], -x.dot(eye),
                            y[0], y[1], y[2], -y.dot(eye),
                            z[0], z[1], z[2], -z.dot(eye),
                            0,   0,   0,   1);
    },

    frustum: function(dest, left, right, bottom, top, near, far) {
      var rl = right - left,
          tb = top - bottom,
          fn = far - near;
          
      dest[0] = (near * 2) / rl;
      dest[1] = 0;
      dest[2] = 0;
      dest[3] = 0;
      dest[4] = 0;
      dest[5] = (near * 2) / tb;
      dest[6] = 0;
      dest[7] = 0;
      dest[8] = (right + left) / rl;
      dest[9] = (top + bottom) / tb;
      dest[10] = -(far + near) / fn;
      dest[11] = -1;
      dest[12] = 0;
      dest[13] = 0;
      dest[14] = -(far * near * 2) / fn;
      dest[15] = 0;

      return dest;
    },

    perspective: function(dest, fov, aspect, near, far) {
      var ymax = near * tan(fov * pi / 360),
          ymin = -ymax,
          xmin = ymin * aspect,
          xmax = ymax * aspect;

      return Mat4.frustum(dest, xmin, xmax, ymin, ymax, near, far);
    },

    ortho: function(dest, left, right, bottom, top, near, far) {
      var rl = right - left,
          tb = top - bottom,
          fn = far - near;

      dest[0] = 2 / rl;
      dest[1] = 0;
      dest[2] = 0;
      dest[3] = 0;
      dest[4] = 0;
      dest[5] = 2 / tb;
      dest[6] = 0;
      dest[7] = 0;
      dest[8] = 0;
      dest[9] = 0;
      dest[10] = -2 / fn;
      dest[11] = 0;
      dest[12] = -(left + right) / rl;
      dest[13] = -(top + bottom) / tb;
      dest[14] = -(far + near) / fn;
      dest[15] = 1;

      return dest;
    },

    toFloat32Array: function(dest) {
          var ans = dest.typedContainer;

          if (!ans) return dest;
          
          ans[0] = dest[0];
          ans[1] = dest[1];
          ans[2] = dest[2];
          ans[3] = dest[3];
          ans[4] = dest[4];
          ans[5] = dest[5];
          ans[6] = dest[6];
          ans[7] = dest[7];
          ans[8] = dest[8];
          ans[9] = dest[9];
          ans[10] = dest[10];
          ans[11] = dest[11];
          ans[12] = dest[12];
          ans[13] = dest[13];
          ans[14] = dest[14];
          ans[15] = dest[15];

          return ans;
    }
  };
  
  //add generics and instance methods
  proto = Mat4.prototype;
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
    ArrayImpl.call(this, 4);

    this[0] = x || 0;
    this[1] = y || 0;
    this[2] = z || 0;
    this[3] = w || 0;

    this.typedContainer = new typedArray(4);
  };

  Quat.create = function() {
    return new typedArray(4);
  };

  generics = {

    setQuat: function(dest, q) {
      dest[0] = q[0];
      dest[1] = q[1];
      dest[2] = q[2];
      dest[3] = q[3];

      return dest;
    },

    set: function(dest, x, y, z, w) {
      dest[0] = x || 0;
      dest[1] = y || 0;
      dest[2] = z || 0;
      dest[3] = w || 0;

      return dest;
    },
    
    clone: function(dest) {
      if (dest.$$family) {
        return new Quat(dest[0], dest[1], dest[2], dest[3]);
      } else {
        return Quat.setQuat(new typedArray(4), dest);
      }
    },

    neg: function(dest) {
      return new Quat(-dest[0], -dest[1], -dest[2], -dest[3]);
    },

    $neg: function(dest) {
      dest[0] = -dest[0];
      dest[1] = -dest[1];
      dest[2] = -dest[2];
      dest[3] = -dest[3];
      
      return dest;
    },

    add: function(dest, q) {
      return new Quat(dest[0] + q[0],
                      dest[1] + q[1],
                      dest[2] + q[2],
                      dest[3] + q[3]);
    },

    $add: function(dest, q) {
      dest[0] += q[0];
      dest[1] += q[1];
      dest[2] += q[2];
      dest[3] += q[3];
      
      return dest;
    },

    sub: function(dest, q) {
      return new Quat(dest[0] - q[0],
                      dest[1] - q[1],
                      dest[2] - q[2],
                      dest[3] - q[3]);
    },

    $sub: function(dest, q) {
      dest[0] -= q[0];
      dest[1] -= q[1];
      dest[2] -= q[2];
      dest[3] -= q[3];
      
      return dest;
    },

    scale: function(dest, s) {
      return new Quat(dest[0] * s,
                      dest[1] * s,
                      dest[2] * s,
                      dest[3] * s);
    },

    $scale: function(dest, s) {
      dest[0] *= s;
      dest[1] *= s;
      dest[2] *= s;
      dest[3] *= s;
      
      return dest;
    },

    mulQuat: function(dest, q) {
      var aX = dest[0],
          aY = dest[1],
          aZ = dest[2],
          aW = dest[3],
          bX = q[0],
          bY = q[1],
          bZ = q[2],
          bW = q[3];

      return new Quat(aW * bX + aX * bW + aY * bZ - aZ * bY,
                      aW * bY + aY * bW + aZ * bX - aX * bZ,
                      aW * bZ + aZ * bW + aX * bY - aY * bX,
                      aW * bW - aX * bX - aY * bY - aZ * bZ);
    },

    $mulQuat: function(dest, q) {
      var aX = dest[0],
          aY = dest[1],
          aZ = dest[2],
          aW = dest[3],
          bX = q[0],
          bY = q[1],
          bZ = q[2],
          bW = q[3];

      dest[0] = aW * bX + aX * bW + aY * bZ - aZ * bY;
      dest[1] = aW * bY + aY * bW + aZ * bX - aX * bZ;
      dest[2] = aW * bZ + aZ * bW + aX * bY - aY * bX;
      dest[3] = aW * bW - aX * bX - aY * bY - aZ * bZ;

      return dest;
    },

    divQuat: function(dest, q) {
      var aX = dest[0],
          aY = dest[1],
          aZ = dest[2],
          aW = dest[3],
          bX = q[0],
          bY = q[1],
          bZ = q[2],
          bW = q[3];

      var d = 1 / (bW * bW + bX * bX + bY * bY + bZ * bZ);
      
      return new Quat((aX * bW - aW * bX - aY * bZ + aZ * bY) * d,
                      (aX * bZ - aW * bY + aY * bW - aZ * bX) * d,
                      (aY * bX + aZ * bW - aW * bZ - aX * bY) * d,
                      (aW * bW + aX * bX + aY * bY + aZ * bZ) * d);
    },

    $divQuat: function(dest, q) {
      var aX = dest[0],
          aY = dest[1],
          aZ = dest[2],
          aW = dest[3],
          bX = q[0],
          bY = q[1],
          bZ = q[2],
          bW = q[3];

      var d = 1 / (bW * bW + bX * bX + bY * bY + bZ * bZ);
      
      dest[0] = (aX * bW - aW * bX - aY * bZ + aZ * bY) * d;
      dest[1] = (aX * bZ - aW * bY + aY * bW - aZ * bX) * d;
      dest[2] = (aY * bX + aZ * bW - aW * bZ - aX * bY) * d;
      dest[3] = (aW * bW + aX * bX + aY * bY + aZ * bZ) * d;

      return dest;
    },

    invert: function(dest) {
      var q0 = dest[0],
          q1 = dest[1],
          q2 = dest[2],
          q3 = dest[3];

      var d = 1 / (q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);
      
      return new Quat(-q0 * d, -q1 * d, -q2 * d, q3 * d);
    },

    $invert: function(dest) {
      var q0 = dest[0],
          q1 = dest[1],
          q2 = dest[2],
          q3 = dest[3];

      var d = 1 / (q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);

      dest[0] = -q0 * d;
      dest[1] = -q1 * d;
      dest[2] = -q2 * d;
      dest[3] =  q3 * d;
      
      return dest;
    },

    norm: function(dest) {
      var a = dest[0],
          b = dest[1],
          c = dest[2],
          d = dest[3];

      return sqrt(a * a + b * b + c * c + d * d);
    },

    normSq: function(dest) {
      var a = dest[0],
          b = dest[1],
          c = dest[2],
          d = dest[3];

      return a * a + b * b + c * c + d * d;
    },

    unit: function(dest) {
      return Quat.scale(dest, 1 / Quat.norm(dest));
    },

    $unit: function(dest) {
      return Quat.$scale(dest, 1 / Quat.norm(dest));
    },

    conjugate: function(dest) {
      return new Quat(-dest[0],
                      -dest[1],
                      -dest[2],
                       dest[3]);
    },

    $conjugate: function(dest) {
      dest[0] = -dest[0];
      dest[1] = -dest[1];
      dest[2] = -dest[2];
      
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
    return new Vec3(q[0], q[1], q[2]);
  };

  Quat.fromVec3 = function(v, r) {
    return new Quat(v[0], v[1], v[2], r || 0);
  };

  Quat.fromMat4 = function(m) {
    var u;
    var v;
    var w;

    // Choose u, v, and w such that u is the index of the biggest diagonal entry
    // of m, and u v w is an even permutation of 0 1 and 2.
    if (m[0] > m[5] && m[0] > m[10]) {
      u = 0;
      v = 1;
      w = 2;
    } else if (m[5] > m[0] && m[5] > m[10]) {
      u = 1;
      v = 2;
      w = 0;
    } else {
      u = 2;
      v = 0;
      w = 1;
    }

    var r = sqrt(1 + m[u * 5] - m[v * 5] - m[w * 5]);
    var q = new Quat;
    
    q[u] = 0.5 * r;
    q[v] = 0.5 * (m['n' + v + '' + u] + m['n' + u + '' + v]) / r;
    q[w] = 0.5 * (m['n' + u + '' + w] + m['n' + w + '' + u]) / r;
    q[3] = 0.5 * (m['n' + v + '' + w] - m['n' + w + '' + v]) / r;

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
    var x = vec[0],
        y = vec[1],
        z = vec[2],
        d = 1 / sqrt(x * x + y * y + z * z),
        s = sin(angle / 2),
        c = cos(angle / 2);

    return new Quat(s * x * d,
                    s * y * d,
                    s * z * d,
                    c);
  };
  
  Mat4.fromQuat = function(q) {
    var a = q[3],
        b = q[0],
        c = q[1],
        d = q[2];
    
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
    return n !== true ? n : false;
  }
  
  //Returns an element position
  var getPos = function(elem) {
    var bbox = elem.getBoundingClientRect();
    return {
      x: bbox.left,
      y: bbox.top,
      bbox: bbox
    };
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
        case 'keyup':
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
          return (cacheTarget = !opt.picking || scene.pick(epos.x - pos.x, epos.y - pos.y, opt.lazyPicking) || true);
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
      if (this.pressed && this.moved) {
        this.callbacks.onDragEnd(e);
        this.pressed = this.moved = false;
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
        if(!target || target.hash != this.hash) {
          this.callbacks.onMouseLeave(e, this.hovered);
          this.hovered = target;
          this.hash = target;
          if(target) {
            this.hash = target.hash;
            this.callbacks.onMouseEnter(e, this.hovered);
          }
        } else {
          this.callbacks.onMouseMove(e, this.hovered);
        }
      } else {
        this.hovered = toO3D(e.getTarget());
        this.hash = this.hovered;
        if(this.hovered) {
          this.hash = this.hovered.hash;
          this.callbacks.onMouseEnter(e, this.hovered);
        }
      }
      if (!this.opt.picking) {
        this.callbacks.onMouseMove(e);
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
    opt = $.extend({
      cachePosition: true,
      cacheSize: true,
      relative: true,
      centerOrigin: true,
      disableContextMenu: true,
      bind: false,
      picking: false,
      lazyPicking: false,
      
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
    //assign event handler to app.
    app.events = opt;
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
  
  var getpath = function(path) {
    var last = path.lastIndexOf('/');
    if (last == '/') {
      return './';
    } else {
      return path.substr(0, last + 1);
    }
  };

  // preprocess a source with `#include ""` support
  // `duplist` records all the pending replacements
  var preprocess = function(base, source, callback, callbackError, duplist) {
    duplist = duplist || {};
    var match;
    if ((match = source.match(/#include "(.*?)"/))) {
      var xhr = PhiloGL.IO.XHR,
        url = getpath(base) + match[1];

      if (duplist[url]) {
        callbackError('Recursive include');
      }

      new xhr({
        url: url,
        noCache: true,
        onError: function(code) {
          callbackError('Load included file `' + url + '` failed: Code ' + code);
        },
        onSuccess: function(response) {
          duplist[url] = true;
          return preprocess(url, response, function(replacement) {
            delete duplist[url];
            source = source.replace(/#include ".*?"/, replacement);
            source = source.replace(/\sHAS_EXTENSION\s*\(\s*([A-Za-z_\-0-9]+)\s*\)/g, function (all, ext) {
              return gl.getExtension(ext) ? ' 1 ': ' 0 ';
            });
            return preprocess(url, source, callback, callbackError, duplist);
          }, callbackError, duplist);
        }
      }).send();
      return null;
    } else {
      return callback(source);
    }
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
        type = info.type,
        matrix = false,
        vector = true,
        glFunction, typedArray;

    if (info.size > 1 && isArray) {
      switch(type) {
        case gl.FLOAT:
          glFunction = gl.uniform1fv;
          typedArray = Float32Array;
          vector = false;
          break;
        case gl.INT: case gl.BOOL: case gl.SAMPLER_2D: case gl.SAMPLER_CUBE:
          glFunction = gl.uniform1iv;
          typedArray = Uint16Array;
          vector = false;
          break;
      }
    }
    
    if (vector) {
      switch (type) {
        case gl.FLOAT:
          glFunction = gl.uniform1f;
          break;
        case gl.FLOAT_VEC2:
          glFunction = gl.uniform2fv;
          typedArray = isArray ? Float32Array : new Float32Array(2);
          break;
        case gl.FLOAT_VEC3:
          glFunction = gl.uniform3fv;
          typedArray = isArray ? Float32Array : new Float32Array(3);
          break;
        case gl.FLOAT_VEC4:
          glFunction = gl.uniform4fv;
          typedArray = isArray ? Float32Array : new Float32Array(4);
          break;
        case gl.INT: case gl.BOOL: case gl.SAMPLER_2D: case gl.SAMPLER_CUBE:
          glFunction = gl.uniform1i;
          break;
        case gl.INT_VEC2: case gl.BOOL_VEC2:
          glFunction = gl.uniform2iv;
          typedArray = isArray ? Uint16Array : new Uint16Array(2);
          break;
        case gl.INT_VEC3: case gl.BOOL_VEC3:
          glFunction = gl.uniform3iv;
          typedArray = isArray ? Uint16Array : new Uint16Array(3);
          break;
        case gl.INT_VEC4: case gl.BOOL_VEC4:
          glFunction = gl.uniform4iv;
          typedArray = isArray ? Uint16Array : new Uint16Array(4);
          break;
        case gl.FLOAT_MAT2:
          matrix = true;
          glFunction = gl.uniformMatrix2fv;
          break;
        case gl.FLOAT_MAT3:
          matrix = true;
          glFunction = gl.uniformMatrix3fv;
          break;
        case gl.FLOAT_MAT4:
          matrix = true;
          glFunction = gl.uniformMatrix4fv;
          break;
      }
    }

    //TODO(nico): Safari 5.1 doesn't have Function.prototype.bind.
    //remove this check when they implement it.
    if (glFunction.bind) {
      glFunction = glFunction.bind(gl);
    } else {
      var target = glFunction;
      glFunction = function() { target.apply(gl, arguments); };
    }

    //Set a uniform array
    if (isArray && typedArray) {
      return function(val) {
        glFunction(loc, new typedArray(val));
      };
    
    //Set a matrix uniform
    } else if (matrix) {
      return function(val) {
        glFunction(loc, false, val.toFloat32Array());
      };
    
    //Set a vector/typed array uniform
    } else if (typedArray) {
      return function(val) {
        typedArray.set(val.toFloat32Array ? val.toFloat32Array() : val);
        glFunction(loc, typedArray);
      };
    
    //Set a primitive-valued uniform
    } else {
      return function(val) {
        glFunction(loc, val);
      };
    }

    // FIXME: Unreachable code
    throw "Unknown type: " + type;

  };

  //Program Class: Handles loading of programs and mapping of attributes and uniforms
  var Program = function(vertexShader, fragmentShader) {
    var program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return false;
    
    var attributes = {},
        attributeEnabled = {},
        uniforms = {},
        info, name, index;
  
    //fill attribute locations
    var len = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < len; i++) {
      info = gl.getActiveAttrib(program, i);
      name = info.name;
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
    this.attributeEnabled = attributeEnabled;
    this.uniforms = uniforms;
  };

  Program.prototype = {
    
    $$family: 'program',

    setUniform: function(name, val) {
      if (this.uniforms[name]) {
        this.uniforms[name](val);
      }
      return this;
    },

    setUniforms: function(obj) {
      for (var name in obj) {
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
  function getOptions(args, base) {
    var opt;
    if (args.length == 2) {
      opt = {
        vs: args[0],
        fs: args[1]
      };
    } else {
      opt = args[0] || {};
    }
    return $.merge(base || {}, opt);
  }

  //Create a program from vertex and fragment shader node ids
  Program.fromShaderIds = function() {
    var opt = getOptions(arguments),
      vs = $(opt.vs),
      fs = $(opt.fs);
    return preprocess(opt.path, vs.innerHTML, function(vectexShader) {
      return preprocess(opt.path, fs.innerHTML, function(fragmentShader) {
        opt.onSuccess(new Program(vectexShader, fragmentShader), opt);
      });
    });
  };

  //Create a program from vs and fs sources
  Program.fromShaderSources = function() {
    var opt = getOptions(arguments, {path: './'});
    return preprocess(opt.path, opt.vs, function(vectexShader) {
      return preprocess(opt.path, opt.fs, function(fragmentShader) {
        try {
          var program = new Program(vectexShader, fragmentShader);
          if(opt.onSuccess) {
            opt.onSuccess(program, opt); 
          } else {
            return program;
          }
        } catch(e) {
          if (opt.onError) {
            opt.onError(e, opt);
          } else {
            throw e;
          }
        }
      });
    });
  };

  //Build program from default shaders (requires Shaders)
  Program.fromDefaultShaders = function(opt) {
    opt = opt || {};
    var vs = opt.vs || 'Default',
      fs = opt.fs || 'Default',
      sh = PhiloGL.Shaders;
    opt.vs = sh.Vertex[vs];
    opt.fs = sh.Fragment[fs];
    return PhiloGL.Program.fromShaderSources(opt);
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

    new XHR.Group({
      urls: [vertexShaderURI, fragmentShaderURI],
      noCache: opt.noCache,
      onError: function(arg) {
        opt.onError(arg);
      },
      onComplete: function(ans) {
        try {
          return preprocess(vertexShaderURI, ans[0], function(vectexShader) {
            return preprocess(fragmentShaderURI, ans[1], function(fragmentShader) {
              opt.vs = vectexShader;
              opt.fs = fragmentShader;
              return Program.fromShaderSources(opt);
            }, opt.onError);
          }, opt.onError);
        } catch (e) {
          opt.onError(e, opt);
        }
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
      url: 'http://philogljs.org/',
      method: 'GET',
      async: true,
      noCache: false,
      //body: null,
      sendAsBinary: false,
      responseType: false,
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
        if (req.addEventListener) {
          req.addEventListener(event.toLowerCase(), function(e) {
            that['handle' + event](e);
          }, false);
        } else {
          req['on' + event.toLowerCase()] = function(e) {
            that['handle' + event](e);
          };
        }
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

      if (opt.responseType) {
        req.responseType = opt.responseType;
      }
      
      if (async) {
        req.onreadystatechange = function(e) {
          if (req.readyState == XHR.State.COMPLETED) {
            if (req.status == 200) {
              opt.onSuccess(req.responseType ? req.response : req.responseText);
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
          opt.onSuccess(req.responseType ? req.response : req.responseText);
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

  //Make parallel requests and group the responses.
  XHR.Group = function(opt) {
    opt = $.merge({
      urls: [],
      onError: $.empty,
      onSuccess: $.empty,
      onComplete: $.empty,
      method: 'GET',
      async: true,
      noCache: false,
      //body: null,
      sendAsBinary: false,
      responseType: false
    }, opt || {});

    var urls = $.splat(opt.urls),
        len = urls.length,
        ans = new Array(len),
        reqs = urls.map(function(url, i) {
            return new XHR({
              url: url,
              method: opt.method,
              async: opt.async,
              noCache: opt.noCache,
              sendAsBinary: opt.sendAsBinary,
              responseType: opt.responseType,
              body: opt.body,
              //add callbacks
              onError: handleError(i),
              onSuccess: handleSuccess(i)
            });
        });

    function handleError(i) {
      return function(e) {
        --len;
        opt.onError(e, i);
        
        if (!len) opt.onComplete(ans);
      };
    }

    function handleSuccess(i) {
      return function(response) {
        --len;
        ans[i] = response;
        opt.onSuccess(response, i);

        if (!len) opt.onComplete(ans);
      };
    }

    this.reqs = reqs;
  };

  XHR.Group.prototype = {
    send: function() {
      for (var i = 0, reqs = this.reqs, l = reqs.length; i < l; ++i) {
        reqs[i].send();
      }
    }
  };

  var JSONP = function(opt) {
    opt = $.merge({
      url: 'http://philogljs.org/',
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
          textures[opt.id && opt.id[i] || opt.src && opt.src[i]] = $.merge({
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

    this.type = opt.type ? opt.type : 'perspective';
    this.fov = fov;
    this.near = near;
    this.far = far;
    this.aspect = aspect;
    this.position = pos && new Vec3(pos.x, pos.y, pos.z) || new Vec3();
    this.target = target && new Vec3(target.x, target.y, target.z) || new Vec3();
    this.up = up && new Vec3(up.x, up.y, up.z) || new Vec3(0, 1, 0);
    if (this.type == 'perspective') {
      this.projection = new Mat4().perspective(fov, aspect, near, far);
    } else {
      var ymax = near * Math.tan(fov * Math.PI / 360),
          ymin = -ymax,
          xmin = ymin * aspect,
          xmax = ymax * aspect;

      this.projection = new Mat4().ortho(xmin, xmax, ymin, ymax, near, far);
    }
    this.view = new Mat4();

  };

  Camera.prototype = {
    
    update: function() {
      if (this.type == 'perspective') {
        this.projection = new Mat4().perspective(this.fov, this.aspect, this.near, this.far);
      } else {
        var ymax = this.near * Math.tan(this.fov * Math.PI / 360),
            ymin = -ymax,
            xmin = ymin * this.aspect,
            xmax = ymax * this.aspect;

        this.projection = new Mat4().ortho(xmin, xmax, ymin, ymax, this.near, this.far);
      }
      this.view.lookAt(this.position, this.target, this.up);  
    },

    //Set Camera view and projection matrix
    setStatus: function (program) {
      var camera = this,
          pos = camera.position,
          view = camera.view,
          projection = camera.projection,
          viewProjection = view.mulMat4(projection),
          viewProjectionInverse = viewProjection.invert();

      program.setUniforms({
        cameraPosition: [pos.x, pos.y, pos.z],
        projectionMatrix: projection,
        viewMatrix: view,
        viewProjectionMatrix: viewProjection,
        viewInverseMatrix: view.invert(),
        viewProjectionInverseMatrix: viewProjectionInverse
      }); 
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
      slice = Array.prototype.slice;

  function normalizeColors(arr, len) {
    if (arr && arr.length < len) {
      var a0 = arr[0],
          a1 = arr[1],
          a2 = arr[2],
          a3 = arr[3],
          ans = [a0, a1, a2, a3],
          times = len / arr.length,
          index;

      while (--times) {
        index = times * 4;
        ans[index    ] = a0;
        ans[index + 1] = a1;
        ans[index + 2] = a2;
        ans[index + 3] = a3;
      }

      return new Float32Array(ans);
    } else {
      return arr;
    }
  }

  //Model repository
  var O3D = {
      //map attribute names to property names
      //TODO(nico): textures are treated separately.
      attributeMap: {
        'position': 'vertices',
        'normal': 'normals',
        'pickingColor': 'pickingColors',
        'colors': 'color'
      }
  };

  //Model abstract O3D Class
  O3D.Model = function(opt) {
    opt = opt || {};
    this.id = opt.id || $.uid();
    //picking options
    this.pickable = !!opt.pickable;
    this.pick = opt.pick || function() { return false; };

    this.vertices = opt.vertices;
    this.normals = opt.normals;
    this.textures = opt.textures && $.splat(opt.textures);
    this.colors = opt.colors;
    this.indices = opt.indices;
    this.shininess = opt.shininess || 0;
    this.reflection = opt.reflection || 0;
    this.refraction = opt.refraction || 0;

    if (opt.pickingColors) {
      this.pickingColors = opt.pickingColors;
    }

    if (opt.texCoords) {
      this.texCoords = opt.texCoords;
    }

    //extra uniforms
    this.uniforms = opt.uniforms || {};
    //extra attribute descriptors
    this.attributes = opt.attributes || {};
    //override the render method
    this.render = opt.render;
    //whether to render as triangles, lines, points, etc.
    this.drawType = opt.drawType || 'TRIANGLES';
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

    if (opt.computeCentroids) {
      this.computeCentroids();
    }

    if (opt.computeNormals) {
      this.computeNormals();
    }

  };

  //Buffer setter mixin
  var Setters = {

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

    setVertices: function(program) {
      if (!this.$vertices) return;

      if (this.dynamic) {
        program.setBuffer('position-' + this.id, {
          attribute: 'position',
          value: this.$vertices,
          size: 3
        });
      } else {
        program.setBuffer('position-' + this.id);
      }
    },

    setNormals: function(program) {
      if (!this.$normals) return;

      if (this.dynamic) {
        program.setBuffer('normal-' + this.id, {
          attribute: 'normal',
          value: this.$normals,
          size: 3
        });
      } else {
        program.setBuffer('normal-' + this.id);
      }
    },

    setIndices: function(program) {
      if (!this.$indices) return;

      if (this.dynamic) {
        program.setBuffer('indices-' + this.id, {
          bufferType: gl.ELEMENT_ARRAY_BUFFER,
          drawType: gl.STATIC_DRAW,
          value: this.$indices,
          size: 1
        });
      } else {
        program.setBuffer('indices-' + this.id);
      }
    },

    setPickingColors: function(program) {
      if (!this.$pickingColors) return;

      if (this.dynamic) {
        program.setBuffer('pickingColor-' + this.id, {
          attribute: 'pickingColor',
          value: this.$pickingColors,
          size: 4
        });
      } else {
        program.setBuffer('pickingColor-' + this.id);
      }
    },

    setColors: function(program) {
      if (!this.$colors) return;

      if (this.dynamic) {
        program.setBuffer('color-' + this.id, {
          attribute: 'color',
          value: this.$colors,
          size: 4
        });
      } else {
        program.setBuffer('color-' + this.id);
      }
    },

    setTexCoords: function(program) {
      if (!this.$texCoords) return;

      var id = this.id,
          i, txs, l, tex;

      if (this.dynamic) {
        //If is an object containing textureName -> textureCoordArray
        //Set all textures, samplers and textureCoords.
        if ($.type(this.$texCoords) == 'object') {
          for (i = 0, txs = this.textures, l = txs.length; i < l; i++) {
            tex = txs[i];
            program.setBuffer('texCoord-' + i + '-' + id, {
              attribute: 'texCoord' + (i + 1),
              value: this.$texCoords[tex],
              size: 2
            });
          }
        //An array of textureCoordinates
        } else {
          program.setBuffer('texCoord-' + id, {
            attribute: 'texCoord1',
            value: this.$texCoords,
            size: 2
          });
        }
      } else {
        if ($.type(this.$texCoords) == 'object') {
          for (i = 0, txs = this.textures, l = txs.length; i < l; i++) {
            program.setBuffer('texCoord-' + i + '-' + id);
          }
        } else {
          program.setBuffer('texCoord-' + id);
        }
      }
    },

    setTextures: function(program, force) {
      this.textures = this.textures? $.splat(this.textures) : [];
      var dist = 5;
      for (var i = 0, texs = this.textures, l = texs.length, mtexs = PhiloGL.Scene.MAX_TEXTURES; i < mtexs; i++) {
        if (i < l) {
          var isCube = app.textureMemo[texs[i]].isCube;
          if (isCube) {
            program.setUniform('hasTextureCube' + (i + 1), true);
            program.setTexture(texs[i], gl['TEXTURE' + (i + dist)]);
          } else {
            program.setUniform('hasTexture' + (i + 1), true);
            program.setTexture(texs[i], gl['TEXTURE' + i]);
          }
        } else {
          program.setUniform('hasTextureCube' + (i + 1), false);
          program.setUniform('hasTexture' + (i + 1), false);
        }
        program.setUniform('sampler' + (i + 1), i);
        program.setUniform('samplerCube' + (i + 1), i + dist);
      }
    },

    setState: function(program) {
      this.setUniforms(program);
      this.setAttributes(program);
      this.setVertices(program);
      this.setColors(program);
      this.setPickingColors(program);
      this.setNormals(program);
      this.setTextures(program);
      this.setTexCoords(program);
      this.setIndices(program);
    },

    unsetState: function(program) {
      var attributes = program.attributes;

      //unbind the array and element buffers
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

      for (var name in attributes) {
        gl.disableVertexAttribArray(attributes[name]);
      }

    }
 };

  //ensure known attributes use typed arrays
  O3D.Model.prototype = Object.create(null, {
    hash: {
      get: function() {
        return this.id + ' ' + this.$pickingIndex;
      }
    },
    vertices: {
      set: function(val) {
        if (!val) {
            delete this.$vertices;
            delete this.$verticesLength;
            return;
        }
        var vlen = val.length;
        if (val.BYTES_PER_ELEMENT) {
          this.$vertices = val;
        } else {
          if (this.$verticesLength == vlen) {
            this.$vertices.set(val);
          } else {
            this.$vertices = new Float32Array(val);
          }
        }
        this.$verticesLength = vlen;
      },
      get: function() {
        return this.$vertices;
      }
    },

    normals: {
      set: function(val) {
        if (!val) {
            delete this.$normals;
            delete this.$normalsLength;
            return;
        }
        var vlen = val.length;
        if (val.BYTES_PER_ELEMENT) {
          this.$normals = val;
        } else {
          if (this.$normalsLength == vlen) {
            this.$normals.set(val);
          } else {
            this.$normals = new Float32Array(val);
          }
        }
        this.$normalsLength = vlen;
      },
      get: function() {
        return this.$normals;
      }
    },

    colors: {
      set: function(val) {
        if (!val) {
            delete this.$colors;
            delete this.$colorsLength;
            return;
        }
        var vlen = val.length;
        if (val.BYTES_PER_ELEMENT) {
          this.$colors = val;
        } else {
          if (this.$colorsLength == vlen) {
            this.$colors.set(val);
          } else {
            this.$colors = new Float32Array(val);
          }
        }
        if (this.$vertices && this.$verticesLength / 3 * 4 != vlen) {
          this.$colors = normalizeColors(slice.call(this.$colors), this.$verticesLength / 3 * 4);
        }
        this.$colorsLength = this.$colors.length;
      },
      get: function() {
        return this.$colors;
      }
    },

    pickingColors: {
      set: function(val) {
        if (!val) {
            delete this.$pickingColors;
            delete this.$pickingColorsLength;
            return;
        }
        var vlen = val.length;
        if (val.BYTES_PER_ELEMENT) {
          this.$pickingColors = val;
        } else {
          if (this.$pickingColorsLength == vlen) {
            this.$pickingColors.set(val);
          } else {
            this.$pickingColors = new Float32Array(val);
          }
        }
        if (this.$vertices && this.$verticesLength / 3 * 4 != vlen) {
          this.$pickingColors = normalizeColors(slice.call(this.$pickingColors), this.$verticesLength / 3 * 4);
        }
        this.$pickingColorsLength = this.$pickingColors.length;
      },
      get: function() {
        return this.$pickingColors;
      }
    },

    texCoords: {
      set: function(val) {
        if (!val) {
            delete this.$texCoords;
            delete this.$texCoordsLength;
            return;
        }
        if ($.type(val) == 'object') {
          var ans = {};
          for (var prop in val) {
            var texCoordArray = val[prop];
            ans[prop] = texCoordArray.BYTES_PER_ELEMENT ? texCoordArray : new Float32Array(texCoordArray);
          }
          this.$texCoords = ans;
        } else {
          var vlen = val.length;
          if (val.BYTES_PER_ELEMENT) {
            this.$texCoords = val;
          } else {
            if (this.$texCoordsLength == vlen) {
              this.$texCoords.set(val);
            } else {
              this.$texCoords = new Float32Array(val);
            }
          }
          this.$texCoordsLength = vlen;
        }
      },
      get: function() {
        return this.$texCoords;
      }
    },

    indices: {
      set: function(val) {
        if (!val) {
            delete this.$indices;
            delete this.$indicesLength;
            return;
        }
        var vlen = val.length;
        if (val.BYTES_PER_ELEMENT) {
          this.$indices = val;
        } else {
          if (this.$indicesLength == vlen) {
            this.$indices.set(val);
          } else {
            this.$indices = new Uint16Array(val);
          }
        }
        this.$indicesLength = vlen;
      },
      get: function() {
        return this.$indices;
      }
    }

  });

  $.extend(O3D.Model.prototype, {
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

  });

  //Apply our Setters mixin
  $.extend(O3D.Model.prototype, Setters);

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
           vertices = new Float32Array(numVertices * 3),
           normals = new Float32Array(numVertices * 3),
           texCoords = new Float32Array(numVertices * 2),
           indices = new Uint16Array(nlat * nlong * 6);

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
              r = radius(ux, uy, uz, u, v),
              index = x + y * (nlong + 1),
              i3 = index * 3,
              i2 = index * 2;

          vertices[i3 + 0] = r * ux;
          vertices[i3 + 1] = r * uy;
          vertices[i3 + 2] = r * uz;

          normals[i3 + 0] = ux;
          normals[i3 + 1] = uy;
          normals[i3 + 2] = uz;

          texCoords[i2 + 0] = u;
          texCoords[i2 + 1] = v;
        }
      }

      //Create indices
      var numVertsAround = nlat + 1;
      for (x = 0; x < nlat; x++) {
        for (y = 0; y < nlong; y++) {
          var index = (x * nlong + y) * 6;

          indices[index + 0] = y * numVertsAround + x;
          indices[index + 1] = y * numVertsAround + x + 1;
          indices[index + 2] = (y + 1) * numVertsAround + x;

          indices[index + 3] = (y + 1) * numVertsAround + x;
          indices[index + 4] = y * numVertsAround + x + 1;
          indices[index + 5] = (y + 1) * numVertsAround + x + 1;
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
        indices = [],
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
    var l = indices.length,
        normals = new Float32Array(l * 3),
        texCoords = new Float32Array(l * 2);

    for (var i = 0; i < l; i += 3) {
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
        vertices = new Float32Array(numVertices * 3),
        normals = new Float32Array(numVertices * 3),
        texCoords = new Float32Array(numVertices * 2),
        indices = new Uint16Array(nradial * (nvertical + extra) * 6),
        vertsAroundEdge = nradial + 1,
        math = Math,
        slant = math.atan2(bottomRadius - topRadius, height),
        msin = math.sin,
        mcos = math.cos,
        mpi = math.PI,
        cosSlant = mcos(slant),
        sinSlant = msin(slant),
        start = topCap? -2 : 0,
        end = nvertical + (bottomCap? 2 : 0),
        i3 = 0,
        i2 = 0;

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

        vertices[i3 + 0] = sin * ringRadius;
        vertices[i3 + 1] = y;
        vertices[i3 + 2] = cos * ringRadius;

        normals[i3 + 0] = (i < 0 || i > nvertical) ? 0 : (sin * cosSlant);
        normals[i3 + 1] = (i < 0) ? -1 : (i > nvertical ? 1 : sinSlant);
        normals[i3 + 2] = (i < 0 || i > nvertical) ? 0 : (cos * cosSlant);

        texCoords[i2 + 0] = j / nradial;
        texCoords[i2 + 1] = v;

        i2 += 2;
        i3 += 3;
      }
    }

    for (i = 0; i < nvertical + extra; i++) {
      for (j = 0; j < nradial; j++) {
        var index = (i * nradial + j) * 6;

        indices[index + 0] = vertsAroundEdge * (i + 0) + 0 + j;
        indices[index + 1] = vertsAroundEdge * (i + 0) + 1 + j;
        indices[index + 2] = vertsAroundEdge * (i + 1) + 1 + j;
        indices[index + 3] = vertsAroundEdge * (i + 0) + 0 + j;
        indices[index + 4] = vertsAroundEdge * (i + 1) + 1 + j;
        indices[index + 5] = vertsAroundEdge * (i + 1) + 0 + j;
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
        offset = config.offset,
        flipCull = !!config.flipCull, 
        numVertices = (subdivisions1 + 1) * (subdivisions2 + 1),
        positions = new Float32Array(numVertices * 3),
        normals = new Float32Array(numVertices * 3),
        texCoords = new Float32Array(numVertices * 2),
        i2 = 0, i3 = 0;

    if (flipCull) {
      c1len = - c1len;
    }
    
    for (var z = 0; z <= subdivisions2; z++) {
      for (var x = 0; x <= subdivisions1; x++) {
        var u = x / subdivisions1,
            v = z / subdivisions2;
        if (flipCull) {
          texCoords[i2 + 0] = 1 - u;
        } else {
          texCoords[i2 + 0] = u;
        }
        texCoords[i2 + 1] = v;
        i2 += 2;

        switch (type) {
          case 'x,y':
            positions[i3 + 0] = c1len * u - c1len * 0.5;
            positions[i3 + 1] = c2len * v - c2len * 0.5;
            positions[i3 + 2] = offset;

            normals[i3 + 0] = 0;
            normals[i3 + 1] = 0;
            if (flipCull) {
              normals[i3 + 2] = 1;
            } else {
              normals[i3 + 2] = -1;
            }
          break;

          case 'x,z':
            positions[i3 + 0] = c1len * u - c1len * 0.5;
            positions[i3 + 1] = offset;
            positions[i3 + 2] = c2len * v - c2len * 0.5;

            normals[i3 + 0] = 0;
            if (flipCull) {
              normals[i3 + 1] = 1;
            } else {
              normals[i3 + 1] = -1;
            }
            normals[i3 + 2] = 0;
          break;

          case 'y,z':
            positions[i3 + 0] = offset;
            positions[i3 + 1] = c1len * u - c1len * 0.5;
            positions[i3 + 2] = c2len * v - c2len * 0.5;

            if (flipCull) {
              normals[i3 + 0] = 1;
            } else {
              normals[i3 + 0] = -1;
            }
            normals[i3 + 1] = 0;
            normals[i3 + 2] = 0;
          break;
        }
        i3 += 3;
      }
    }

    var numVertsAcross = subdivisions1 + 1,
        indices = [];

    for (z = 0; z < subdivisions2; z++) {
      for (x = 0; x < subdivisions1; x++) {
        var index = (z * subdivisions1 + x) * 6;
        // Make triangle 1 of quad.
        indices[index + 0] = (z + 0) * numVertsAcross + x;
        indices[index + 1] = (z + 1) * numVertsAcross + x;
        indices[index + 2] = (z + 0) * numVertsAcross + x + 1;

        // Make triangle 2 of quad.
        indices[index + 3] = (z + 1) * numVertsAcross + x;
        indices[index + 4] = (z + 1) * numVertsAcross + x + 1;
        indices[index + 5] = (z + 0) * numVertsAcross + x + 1;
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
    "#define LIGHT_MAX 4",
    //object attributes
    "attribute vec3 position;",
    "attribute vec3 normal;",
    "attribute vec4 color;",
    "attribute vec4 pickingColor;",
    "attribute vec2 texCoord1;",
    //camera and object matrices
    "uniform mat4 viewMatrix;",
    "uniform mat4 viewInverseMatrix;",
    "uniform mat4 projectionMatrix;",
    "uniform mat4 viewProjectionMatrix;",
    //objectMatrix * viewMatrix = worldMatrix
    "uniform mat4 worldMatrix;",
    "uniform mat4 worldInverseMatrix;",
    "uniform mat4 worldInverseTransposeMatrix;",
    "uniform mat4 objectMatrix;",
    "uniform vec3 cameraPosition;",
    //lighting configuration
    "uniform bool enableLights;",
    "uniform vec3 ambientColor;",
    "uniform vec3 directionalColor;",
    "uniform vec3 lightingDirection;",
    //point lights configuration
    "uniform vec3 pointLocation[LIGHT_MAX];",
    "uniform vec3 pointColor[LIGHT_MAX];",
    "uniform int numberPoints;",
    //reflection / refraction configuration
		"uniform bool useReflection;",
    //varyings
		"varying vec3 vReflection;",
    "varying vec4 vColor;",
    "varying vec4 vPickingColor;",
    "varying vec2 vTexCoord;",
    "varying vec4 vNormal;",
    "varying vec3 lightWeighting;",

    "void main(void) {",
      "vec4 mvPosition = worldMatrix * vec4(position, 1.0);",
      "vec4 transformedNormal = worldInverseTransposeMatrix * vec4(normal, 1.0);",
      //lighting code
      "if(!enableLights) {",
        "lightWeighting = vec3(1.0, 1.0, 1.0);",
      "} else {",
        "vec3 plightDirection;",
        "vec3 pointWeight = vec3(0.0, 0.0, 0.0);",
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
      //refraction / reflection code
      "if (useReflection) {",
        "vReflection = (viewInverseMatrix[3] - (worldMatrix * vec4(position, 1.0))).xyz;",
      "} else {",
        "vReflection = vec3(1.0, 1.0, 1.0);",
      "}",
      //pass results to varyings
      "vColor = color;",
      "vPickingColor = pickingColor;",
      "vTexCoord = texCoord1;",
      "vNormal = transformedNormal;",
      "gl_Position = projectionMatrix * worldMatrix * vec4(position, 1.0);",
    "}"

  ].join("\n");


 FragmentShaders.Default = [

    "#ifdef GL_ES",
    "precision highp float;",
    "#endif",
    //varyings
    "varying vec4 vColor;",
    "varying vec4 vPickingColor;",
    "varying vec2 vTexCoord;",
    "varying vec3 lightWeighting;",
    "varying vec3 vReflection;",
    "varying vec4 vNormal;",
    //texture configs
    "uniform bool hasTexture1;",
    "uniform sampler2D sampler1;",
    "uniform bool hasTextureCube1;",
		"uniform samplerCube samplerCube1;",
    //picking configs
    "uniform bool enablePicking;",
    "uniform bool hasPickingColors;",
    "uniform vec3 pickColor;",
		//reflection / refraction configs
		"uniform float reflection;",
		"uniform float refraction;",
    //fog configuration
    "uniform bool hasFog;",
    "uniform vec3 fogColor;",
    "uniform float fogNear;",
    "uniform float fogFar;",

    "void main(){",
      //set color from texture
      "if (!hasTexture1) {",
        "gl_FragColor = vec4(vColor.rgb * lightWeighting, vColor.a);",
      "} else {",
        "gl_FragColor = vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb * lightWeighting, 1.0);",
      "}",
      //has cube texture then apply reflection
     "if (hasTextureCube1) {",
       "vec3 nReflection = normalize(vReflection);",
       "vec3 reflectionValue;",
       "if (refraction > 0.0) {",
        "reflectionValue = refract(nReflection, vNormal.xyz, refraction);",
       "} else {",
        "reflectionValue = -reflect(nReflection, vNormal.xyz);",
       "}",
       //TODO(nico): check whether this is right.
       "vec4 cubeColor = textureCube(samplerCube1, vec3(-reflectionValue.x, -reflectionValue.y, reflectionValue.z));",
       "gl_FragColor = vec4(mix(gl_FragColor.xyz, cubeColor.xyz, reflection), 1.0);",
     "}",
      //set picking
      "if (enablePicking) {",
        "if (hasPickingColors) {",
          "gl_FragColor = vPickingColor;",
        "} else {",
          "gl_FragColor = vec4(pickColor, 1.0);",
        "}",
      "}",
      //handle fog
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

(function() {
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
      var program = this.getProgram(obj),
          prevDynamic = obj.dynamic;

      obj.dynamic = true;
      obj.setState(program);
      obj.dynamic = prevDynamic;
      obj.unsetState(program);
    },

    beforeRender: function(program) {
      //Setup lighting and scene effects like fog, etc.
      this.setupLighting(program);
      this.setupEffects(program);
      if (this.camera) {
        this.camera.setStatus(program);
      }
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
      dir = new Vec3(dir.x, dir.y, dir.z).$unit().$scale(-1);

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
          options = $.extend({
            onBeforeRender: $.empty,
            onAfterRender: $.empty
          }, opt || {});

      //If we're just using one program then
      //execute the beforeRender method once.
      !multiplePrograms && this.beforeRender(renderProgram || program);

      //Go through each model and render it.
      for (var i = 0, models = this.models, l = models.length; i < l; ++i) {
        var elem = models[i];
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
      }
    },

    renderToTexture: function(name, opt) {
      opt = opt || {};
      var texture = app.textures[name + '-texture'],
          texMemo = app.textureMemo[name + '-texture'];

      this.render(opt);

      gl.bindTexture(texMemo.textureType, texture);
      //gl.generateMipmap(texMemo.textureType);
      //gl.bindTexture(texMemo.textureType, null);
    },

    renderObject: function(obj, program) {
      var camera = this.camera,
          view = camera.view,
          projection = camera.projection,
          object = obj.matrix,
          world = view.mulMat4(object),
          worldInverse = world.invert(),
          worldInverseTranspose = worldInverse.transpose();

      obj.setState(program);

      //Now set view and normal matrices
      program.setUniforms({
        objectMatrix: object,
        worldMatrix: world,
        worldInverseMatrix: worldInverse,
        worldInverseTransposeMatrix: worldInverseTranspose
//        worldViewProjection:  view.mulMat4(object).$mulMat4(view.mulMat4(projection))
      });

      //Draw
      //TODO(nico): move this into O3D, but, somehow, abstract the gl.draw* methods inside that object.
      if (obj.render) {
        obj.render(gl, program, camera);
      } else {
        if (obj.$indicesLength) {
          gl.drawElements((obj.drawType !== undefined) ? gl.get(obj.drawType) : gl.TRIANGLES, obj.$indicesLength, gl.UNSIGNED_SHORT, 0);
        } else {
          gl.drawArrays((obj.drawType !== undefined) ? gl.get(obj.drawType) : gl.TRIANGLES, 0, obj.$verticesLength / 3);
        }
      }

      obj.unsetState(program);
    },

    //setup picking framebuffer
    setupPicking: function() {
      //create picking program
      var program = PhiloGL.Program.fromDefaultShaders(),
          floor = Math.floor;
      //create framebuffer
      app.setFrameBuffer('$picking', {
        width: 5,
        height: 1,
        bindToTexture: {
          parameters: [{
            name: 'TEXTURE_ MAG_FILTER',
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
    pick: function(x, y, lazy) {
      //setup the picking program if this is
      //the first time we enter the method.
      if (!this.pickingProgram) {
        this.setupPicking();
      }

      var o3dHash = {},
          o3dList = [],
          program = app.usedProgram,
          pickingProgram = this.pickingProgram,
          camera = this.camera,
          oldtarget = camera.target,
          oldaspect = camera.aspect,
          config = this.config,
          memoLightEnable = config.lights.enable,
          memoFog = config.effects.fog,
          width = gl.canvas.width,
          height = gl.canvas.height,
          floor = Math.floor,
          pickingRes = Scene.PICKING_RES,
          resWidth = 5,
          resHeight = 1,
          ndcx = x * 2 / width - 1,
          ndcy = 1 - y * 2 / height,
          target = this.unproject([ndcx, ndcy,  1.0], camera),
          hash = [],
          pixel = new Uint8Array(1 * 1 * 4),
          index = 0,
          backgroundColor, capture, pindex;

      this.camera.target = target;
      this.camera.update ();
      //setup the scene for picking
      config.lights.enable = false;
      config.effects.fog = false;

      //enable picking and render to texture
      app.setFrameBuffer('$picking', true);
      pickingProgram.use();
      pickingProgram.setUniform('enablePicking', true);

      //render the scene to a texture
      gl.disable(gl.BLEND);
      gl.viewport(0, 0, resWidth, resHeight);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //read the background color so we don't step on it
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      backgroundColor = pixel[0] + pixel[1] * 256 + pixel[2] * 256 * 256;

      //render picking scene
      this.renderPickingScene({
        background: backgroundColor,
        o3dHash: o3dHash,
        o3dList: o3dList,
        hash: hash
      });

      // the target point is in the center of the screen,
      // so it should be the center point.
      gl.readPixels(2, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

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
      app.setTexture('$picking-texture', false);
      pickingProgram.setUniform('enablePicking', false);
      config.lights.enable = memoLightEnable;
      config.effects.fog = memoFog;

      //restore previous program
      if (program) program.use();
      //restore the viewport size to original size
      gl.viewport(0, 0, width, height);
      //restore camera properties
      camera.target = oldtarget;
      camera.aspect = oldaspect;
      camera.update();

      //store model hash and pixel array
      this.o3dHash = o3dHash;
      this.o3dList = o3dList;
      this.pixel = pixel;
      this.capture = capture;

      return elem && elem.pickable && elem;
    },

    unproject: function(pt, camera) {
      return camera.view.invert().mulMat4(camera.projection.invert()).mulVec3(pt);
    },

    renderPickingScene: function(opt) {
      //if set through the config, render a custom scene.
      if (this.config.renderPickingScene) {
        this.config.renderPickingScene.call(this, opt);
        return;
      }

      var pickingProgram = this.pickingProgram,
          o3dHash = opt.o3dHash,
          o3dList = opt.o3dList,
          background = opt.background,
          hash = opt.hash,
          index = 0;

      //render to texture
      this.renderToTexture('$picking', {
        renderProgram: pickingProgram,
        onBeforeRender: function(elem, i) {
          if (i == background) {
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
    },

    resetPicking: $.empty
  };

  Scene.MAX_TEXTURES = 10;
  Scene.MAX_POINT_LIGHTS = 4;
  Scene.PICKING_RES = 4;

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
        delay: 0,
        duration: 1000,
        transition: function(x) { return x; },
        onCompute: $.empty,
        onComplete: $.empty
      }, options || {});
  };

  var Queue = Fx.Queue = [];

  Fx.prototype = {
    time:null,
    
    start: function(options) {
      this.opt = $.merge(this.opt, options || {});
      this.time = $.time();
      this.animating = true;
      Queue.push(this);
    },

    //perform a step in the animation
    step: function() {
      //if not animating, then return
      if (!this.animating) return;
      var currentTime = $.time(), 
          time = this.time,
          opt = this.opt,
          delay = opt.delay,
          duration = opt.duration,
          delta = 0;
      //hold animation for the delay
      if (currentTime < time + delay) {
        opt.onCompute.call(this, delta);
        return;
      }
      //if in our time window, then execute animation
      if (currentTime < time + delay + duration) {
        delta = opt.transition((currentTime - time - delay) / duration);
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
        return Math.pow(2, 10 * --p) * Math.cos(20 * p * Math.PI * (x[0] || 1) / 3);
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
  var global = self || window,
      checkFxQueue = function() {
        var newQueue = [];
        if (Queue.length) {
          for (var i = 0, l = Queue.length, fx; i < l; i++) {
            fx = Queue[i];
            fx.step();
            if (fx.animating) {
              newQueue.push(fx);
            }
          }
          Fx.Queue = Queue = newQueue;
        }
      };
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
            checkFxQueue();
            callback();
          });
        };
        found = true;
      }
    });
    if (!found) {
      Fx.requestAnimationFrame = function(callback) {
        setTimeout(function() {
          checkFxQueue();
          callback();
        }, 1000 / 60);
      };
    }
  }
  

  PhiloGL.Fx = Fx;

})();

//media.js
//media has utility functions for image, video and audio manipulation (and
//maybe others like device, etc).
(function() {
  var Media = {};

  var Image = function() {};
  //post process an image by setting it to a texture with a specified fragment
  //and vertex shader.
  Image.postProcess = (function() {
    var plane = new PhiloGL.O3D.Plane({
      type: 'x,y',
      xlen: 1,
      ylen: 1,
      offset: 0
    }), camera = new PhiloGL.Camera(45, 1, 0.1, 500, {
      position: { x: 0, y: 0, z: 1.205 }
    }), scene = new PhiloGL.Scene({}, camera);

    return function(opt) {
      var program = app.program.$$family ? app.program : app.program[opt.program],
          textures = opt.fromTexture ? $.splat(opt.fromTexture) : [],
          framebuffer = opt.toFrameBuffer,
          screen = !!opt.toScreen,
          width = opt.width || app.canvas.width,
          height = opt.height || app.canvas.height;

      camera.aspect = opt.aspectRatio ? opt.aspectRatio : Math.max(height / width, width / height);
      camera.update();

      scene.program = program;

      plane.textures = textures;
      plane.program = program;

      if(!scene.models.length) {
          scene.add(plane);
      }

      if (framebuffer) {
        //create framebuffer
        if (!(framebuffer in app.frameBufferMemo)) {
          app.setFrameBuffer(framebuffer, {
            width: width,
            height: height,
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
            bindToRenderBuffer: false
          });
        }
        program.use();
        app.setFrameBuffer(framebuffer, true);
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        program.setUniforms(opt.uniforms || {});
        scene.renderToTexture(framebuffer);
        app.setFrameBuffer(framebuffer, false);
      }

      if (screen) {
        program.use();
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        program.setUniforms(opt.uniforms || {});
        scene.render();
      }

      return this;
    };
  })();

  Media.Image = Image;
  PhiloGL.Media = Media;
})();

})();

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
        gl.getExtension('OES_texture_float');
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

      var textureType = ('textureType' in opt)? gl.get(opt.textureType) : gl.TEXTURE_2D,
          textureTarget = ('textureTarget' in opt)? gl.get(opt.textureTarget) : textureType,
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
          opt.name = typeof opt.name == 'string'? gl[opt.name] : opt.name;
          gl.pixelStorei(opt.name, opt.value);
        });
      }
      
      //load texture
      if (hasValue) {
        //beware that we can be loading multiple textures (i.e. it could be a cubemap)
        if (isCube) {
          for (var i = 0; i < 6; ++i) {
//            gl.texSubImage2D(textureTarget + i, 0, 0, 0, format, gl.UNSIGNED_BYTE, value[i]);
            gl.texImage2D(textureTarget[i], 0, format, format, type, value[i]);
          }
        } else {
          gl.texImage2D(textureTarget, 0, format, format, type, value);
        }
      //we're setting a texture to a framebuffer
      } else if (data.width || data.height) {
        gl.texImage2D(textureTarget, 0, format, data.width, data.height, data.border, format, type, null); 
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
  })();

  PhiloGL.WebGL = WebGL;
  
})();

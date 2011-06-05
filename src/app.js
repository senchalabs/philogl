//app.js
//creates a singleton application that stores buffer state and has access to scenes, programs, cameras, etc.
(function() {
  function WebGLApplication(options) {
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

  WebGLApplication.prototype = {
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

  PhiloGL.WebGLApplication = WebGLApplication;
})();

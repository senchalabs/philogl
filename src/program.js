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
      useCache: true,
      onSuccess: $.empty,
      onError: $.empty
    }, opt || {});

    var vertexShaderURI = opt.path + opt.vs,
        fragmentShaderURI = opt.path + opt.fs,
        XHR = PhiloGL.IO.XHR;

    new XHR({
      url: vertexShaderURI,
      useCache: opt.useCache,
      onError: function(arg) {
        opt.onError(arg);
      },
      onSuccess: function(vs) {        
        new XHR({
          url: fragmentShaderURI,
          useCache: opt.useCache,
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

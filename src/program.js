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

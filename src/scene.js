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
    
    this.program = program;
    this.camera = camera;
    this.models = [];
    this.config = opt;

    this.setupPicking();
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
      this.setupLighting();
      this.setupEffects();
      //Set Camera view and projection matrix
      var camera = this.camera,
          program = this.program;
      program.setUniform('projectionMatrix', camera.projection);
      program.setUniform('viewMatrix', camera.modelView);
    },

    //Setup the lighting system: ambient, directional, point lights.
    setupLighting: function() {
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
          enable = light.enable,
          points = light.points && $.splat(light.points) || [];
      
      //Normalize lighting direction vector
      var newDir = Vec3.clone(dir);
      Vec3.$unit(newDir);
      Vec3.$scale(newDir, -1);
      dir = newDir;
      
      //Set light uniforms. Ambient and directional lights.
      program.setUniform('enableLights', enable);
      if (light.enable) {
        program.setUniform('ambientColor', [ambient.r, ambient.g, ambient.b]);
        program.setUniform('directionalColor', [dcolor.r, dcolor.g, dcolor.b]);
        program.setUniform('lightingDirection', [dir.x, dir.y, dir.z]);
      }
      
      //Set point lights
      program.setUniform('enableSpecularHighlights', false);
      for (var i = 0, l = Scene.MAX_POINT_LIGHTS, pl = points.length; i < l; i++) {
        var index = i + 1;
        if (enable && i < pl) {
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
    },

    //Setup effects like fog, etc.
    setupEffects: function() {
      var program = this.program,
          config = this.config.effects,
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
      var program = this.program,
          camera = this.camera,
          options = $.merge({
            onBeforeRender: $.empty,
            onAfterRender: $.empty
          }, opt || {});

      this.beforeRender();
      this.models.forEach(function(elem, i) {
        elem.onBeforeRender(program, camera);
        options.onBeforeRender(elem, i);
        this.renderObject(elem);
        options.onAfterRender(elem, i);
        elem.onAfterRender(program, camera);
      }, this);
    },

    renderToTexture: function(name, opt) {
      var program = this.program,
          texture = program.textures[name + '-texture'],
          texMemo = program.textureMemo[name + '-texture'];
      
      this.render(opt);

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
    },
    
    //setup picking framebuffer
    setupPicking: function() {
      var canvas = gl.canvas,
          program = this.program;
      //create framebuffer
      program.setFrameBuffer('$picking', {
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
      program.setFrameBuffer('$picking', false);
    },
    
    //returns an element at the given position
    pick: function(x, y) {
      var o3dHash = {},
          program = this.program,
          camera = this.camera,
          config = this.config,
          memoLightEnable = config.lights.enable,
          memoFog = config.effects.fog,
          width = gl.canvas.width,
          height = gl.canvas.height,
          hash = [],
          delay = 200,
          now = $.time(),
          last = this.last || 0;

      //setup the scene for picking
      config.lights.enable = false;
      config.effects.fog = false;
      
      //enable picking and render to texture
      program.setUniform('enablePicking', true);
      program.setFrameBuffer('$picking', true);
      
      //render the scene to a texture
      gl.disable(gl.BLEND);
      gl.viewport(-x, y - height, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      this.renderToTexture('$picking', {
        onBeforeRender: function(elem, i) {
          var suc = i + 1;
          hash[0] = suc % 256;
          hash[1] = ((suc / 256) >> 0) % 256;
          hash[2] = ((suc / (256 * 256)) >> 0) % 256;
          program.setUniform('pickColor', [hash[0] / 255, hash[1] / 255, hash[2] / 255]);
          o3dHash[String(hash)] = elem;
        }
      });
      this.last = $.time();
      
      //grab the color of the pointed pixel in the texture
      var pixels = new Uint8Array(1 * 1 * 4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      var elem = o3dHash[String([pixels[0], pixels[1], pixels[2]])];

      //restore all values
      program.setFrameBuffer('$picking', false);
      program.setUniform('enablePicking', false);
      config.lights.enable = memoLightEnable;
      config.effects.fog = memoFog;
      
      return elem;
    }
  };

  Scene.id = $.time();
  
  Scene.MAX_TEXTURES = 3;
  Scene.MAX_POINT_LIGHTS = 3;

  PhiloGL.Scene = Scene;

})();

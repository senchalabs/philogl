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

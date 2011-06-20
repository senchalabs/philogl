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

      if (obj.dirty) {
        // Calling obj.set* while dirty resets the buffers so we are clean
        obj.dirty = false;
      }

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

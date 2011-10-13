//scene.js
//Scene Object management and rendering

(function () {
  //Define some locals
  var Vec3 = PhiloGL.Vec3,
      Mat4 = PhiloGL.Mat4,
      //don't ask why, it just works
      generateMipmap = !!(navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox/));

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
      //Set Camera view and projection matrix
      var camera = this.camera,
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
      gl.generateMipmap(texMemo.textureType);
      gl.bindTexture(texMemo.textureType, null);
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
          pickingRes = Scene.PICKING_RES,
          floor = Math.floor;
      //create framebuffer
      app.setFrameBuffer('$picking', {
        width: floor(app.canvas.width / pickingRes),
        height: floor(app.canvas.height / pickingRes),
        bindToTexture: {
          parameters: [{
            name: 'TEXTURE_MAG_FILTER',
            value: 'LINEAR'
          }, {
            name: 'TEXTURE_MIN_FILTER',
            value: 'LINEAR',
            generateMipmap: generateMipmap
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

      //if lazy picking and we have a previous
      //image capture, then use lazy pick
      if (lazy && this.capture) {
        return this.lazyPick(x, y);
      }

      //normal picking
      var o3dHash = {},
          o3dList = [],
          program = app.usedProgram,
          pickingProgram = this.pickingProgram,
          pickingRes = Scene.PICKING_RES,
          camera = this.camera,
          config = this.config,
          memoLightEnable = config.lights.enable,
          memoFog = config.effects.fog,
          width = gl.canvas.width,
          height = gl.canvas.height,
          floor = Math.floor,
          resWidth = floor(width / pickingRes),
          resHeight = floor(height / pickingRes),
          hash = [],
          pixel = new Uint8Array(1 * 1 * 4),
          index = 0, 
          backgroundColor, capture, pindex;

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
     
      if (lazy) {
        //grab the color of the pointed pixel in the texture
        capture = new Uint8Array(4 * resWidth * resHeight);
        gl.readPixels(0, 0, resWidth, resHeight, gl.RGBA, gl.UNSIGNED_BYTE, capture);
        pindex = floor((x + (height - y) * resWidth) / pickingRes) * 4;
        pixel = [capture[pindex], capture[pindex + 1], capture[pindex + 2], capture[pindex + 3]];
      } else {
        gl.readPixels(floor(x / pickingRes), floor((height - y) / pickingRes), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      } 

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
      
      //If there was another program then set to reuse that program.
      if (program) program.use();

      //store model hash and pixel array
      this.o3dHash = o3dHash;
      this.o3dList = o3dList;
      this.pixel = pixel;
      this.capture = capture;

      return elem && elem.pickable && elem;
    },

    lazyPick: function(x, y) {
      var canvas = app.canvas,
          width = canvas.width,
          height = canvas.height,
          pickingRes = Scene.PICKING_RES,
          floor = Math.floor,
          resWidth = width / pickingRes >> 0,
          resHeight = height / pickingRes >> 0,
          index = floor((x + (height - y) * resWidth) / pickingRes) * 4,
          capture = this.capture,
          pixel = [capture[index], capture[index + 1], capture[index + 2], capture[index + 3]],
          stringColor = [pixel[0], pixel[1], pixel[2]].join(),
          o3dHash = this.o3dHash,
          o3dList = this.o3dList,
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

      return elem && elem.pickable && elem;
    },

    resetPicking: function() {
      this.capture = false;
    }
  };
  
  Scene.MAX_TEXTURES = 10;
  Scene.MAX_POINT_LIGHTS = 50;
  Scene.PICKING_RES = 4;

  PhiloGL.Scene = Scene;

})();

(function() {
  //Unpack PhiloGL modules
  PhiloGL.unpack();

  window.init = function() {
    var pos;

    //Create App
    PhiloGL('canvas', {
      program: [{
        id: 'hoc',
        path: 'shaders/',
        from: 'uris',
        vs: 'hoc.vs.glsl',
        fs: 'hoc.fs.glsl',
        noCache: true
      }, {
        id: 'bloom',
        path: 'shaders/',
        from: 'uris',
        vs: 'bloom.vs.glsl',
        fs: 'bloom.fs.glsl',
        noCache: true
      }],
      camera: {
        position: {
          fov: 45,
          near: 1,
          far: 500,
          x: 0, y: 0, z: 249
        }
      },
      events: {
        onMouseMove: function(e) {
          var camera = this.camera,
              pos = camera.position;
          pos.x = e.x * 0.2;
          camera.update();
        },
        onMouseWheel: function(e) {
          e.stop();
          var camera = this.camera;
          camera.position.z -= e.wheel * 2;
          camera.update();
        }
      },
      onError: function() {
        alert("There was an error while creating the WebGL application");
      },
      onLoad:function application(app) {
        var gl = app.gl,
            canvas = gl.canvas,
            width = canvas.width,
            height = canvas.height,
            scene = app.scene,
            camera = app.camera,
            program = app.program,
            update = false,
            index = 0, 
            offset = 0,
            model, vertices, components, intensity;

        //load data
        new IO.XHR.Group({
          urls: ['vertices', 'components', 'intensity'].map(function(n) { return 'data/' + n + '.dat'; }),
          responseType: 'arraybuffer',
          onProgress: function() {
            console.log('progress');
          },
          onComplete: function(data) {
            vertices = new Float32Array(data[0]);
            components = new Uint16Array(data[1]);
            intensity = new Float32Array(data[2]);
            offset = components[0];
            model = new O3D.Model({
              drawType: 'POINTS',
              program: 'hoc',
              vertices: vertices.subarray(0, (offset -1) * 3),
              attributes: {
                intensity: {
                  value: intensity.subarray(0, (offset -1)),
                  size: 1
                }
              }
            });
            initRender();
          },

          onError: function(e) {
            console.log('error', e, arguments);
          }
        }).send();
        
        //init rendering
        function initRender() {
          gl.viewport(0, 0, canvas.width, canvas.height);
          //Add balls
          scene.add(model);
          //define framebuffer
          app.setFrameBuffer('face1', {
            width: canvas.width,
            height: canvas.height,
            bindToTexture: {
              parameters: [{
                name: 'TEXTURE_MAG_FILTER',
                value: 'LINEAR'
              }, {
                name: 'TEXTURE_MIN_FILTER',
                value: 'LINEAR_MIPMAP_NEAREST',
                generateMipmap: false
              }]
            },
            bindToRenderBuffer: true
          });
          //run loop
          render();
          //Render the scene and perform a new loop
          function render() {
            if (update) {
              ++index;
              updateModel(index);
            }
            //render to a texture
            app.setFrameBuffer('face1', true);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            scene.renderToTexture('face1');
            app.setFrameBuffer('face1', false);

            Media.Image.postProcess({
              fromTexture: ['face1-texture'],
              toFrameBuffer: 'face2',
              program: 'bloom',
              uniforms: {
                horizontal: true,
                width: width/2,
                height: height/2
              }
            }).postProcess({
              fromTexture: ['face2-texture'],
              toScreen: true,
              program: 'bloom',
              uniforms: {
                horizontal: false,
                width: width/2,
                height: height/2
              }
            });

            model.dynamic = false;
            Fx.requestAnimationFrame(render); 
          }

          function updateModel(index) {
            if ((index % 2) == 0) {
              var i = index / 2;
              if (i < components.length) {
                model.vertices = vertices.subarray(offset * 3, (offset + components[i] -1) * 3);
                model.attributes.intensity.value = intensity.subarray(offset, offset + components[i] -1);
                offset += components[i];
                model.dynamic = true;
              }
            }
          }
        }

      }
    });
  };
})();


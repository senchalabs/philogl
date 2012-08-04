PhiloGL.unpack();
window.addEventListener('DOMContentLoaded', webGLStart, false);

function webGLStart() {
  var width = 1024 * window.devicePixelRatio,
      height = 550 * window.devicePixelRatio,
      cameraControl,
      i, ln;

  function resize() {
    var canvas = document.getElementById('smoke'),
        style = window.getComputedStyle(canvas);
    height = parseFloat(style.getPropertyValue('height')) * window.devicePixelRatio;
    canvas.height = height;
    width = parseFloat(style.getPropertyValue('width')) * window.devicePixelRatio;
    canvas.width = width;
    this.app && this.app.update();
  }

  window.addEventListener('resize', resize);
  resize();
  
  PhiloGL('smoke', {
    events: {

      onMouseWheel: function(e) {
        cameraControl.onMouseWheel(e);
      },

      onDragStart: function(e) {
        cameraControl.onDragStart(e);
      },
      onDragMove: function(e) {
        cameraControl.onDragMove(e);
      }
    },

    program: [
      {
        id: 'rand_source',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/rand_source.fs.glsl',
        noCache: true
      },
      {
        id: 'curl',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/curl.fs.glsl',
        noCache: true
      },
      {
        id: 'div',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/div.fs.glsl',
        noCache: true
      },
      {
        id: 'init',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/init.fs.glsl',
        noCache: true
      },
      {
        id: 'back',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/back.fs.glsl',
        noCache: true
      },
      {
        id: 'move',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/move.fs.glsl',
        noCache: true
      },
      {
        id: 'plain',
        from: 'uris',
        vs: 'shaders/obj.vs.glsl',
        fs: 'shaders/obj.fs.glsl',
        noCache: true
      },
      {
        id: 'particles',
        from: 'uris',
        vs: 'shaders/particles.vs.glsl',
        fs: 'shaders/particles.fs.glsl',
        noCache: true
      }
    ],

    camera: {
      position: {
        x: 1,
        y: 4,
        z: 1.5
      },
      target: {
        x: 0,
        y: 0,
        z: 0.5
      },
      up: {
        x: 0,
        y: 0,
        z: 1
      }
    },

    scene: {
      lights: {
        enable: false
      }
    },

    textures: {
      src: ['smoke.png'],
      id: ['smoke']
    },

    onError: function(e) {
      alert(e);
    },

    onLoad: function(app) {

      var RESOLUTION = 32, mult = 1; // times 64K particles
      PhiloGL.unpack();
      var velocityField = new SwapTexture(app, {width: RESOLUTION, height: RESOLUTION * RESOLUTION});
      var particleBuffers = [];
      for (i = 0; i < mult; i++) {
        particleBuffers.push(new SwapTexture(app, {width: 256, height: 256}));
      }

      var camera = app.camera;
      cameraControl = new CameraControl(app.camera);

      
      velocityField.process({
        program: 'rand_source',
        uniforms: {
          'RESOLUTIONX': RESOLUTION,
          'RESOLUTIONY': RESOLUTION,
          'RESOLUTIONZ': RESOLUTION
        }
      });

      velocityField.process({
        program: 'curl',
        uniforms: {
          'RESOLUTIONX': RESOLUTION,
          'RESOLUTIONY': RESOLUTION,
          'RESOLUTIONZ': RESOLUTION
        }
      });
      
      for (i = 0; i < mult; i++) {
        particleBuffers[i].process({
          program: 'init',
          uniforms: {
            'RESOLUTIONX': RESOLUTION,
            'RESOLUTIONY': RESOLUTION,
            'RESOLUTIONZ': RESOLUTION,
            time: +new Date() % 1000 / 1000 + i / 10
          }
        });
      }
      var number = 256 * 256,
          idx = new Float32Array(number);
      for (i = 0; i < number; i++)idx[i] = i;

      var plane = new O3D.Plane({
        type: 'x,y',
        xlen: 2,
        ylen: 2,
        nx: 2,
        ny: 2,
        offset: 0,
        program: 'plain'
      });
      app.scene.add(plane);

      var particleModels = [];
      for (i = 0; i < mult; i++) {
        particleModels.push(new O3D.Model({
          program: 'particles',
          textures: [velocityField.from[0] + '-texture', particleBuffers[i].from[0] + '-texture', 'smoke'],
          uniforms: {
            'RESOLUTIONX': RESOLUTION,
            'RESOLUTIONY': RESOLUTION,
            'RESOLUTIONZ': RESOLUTION,
            devicePixelRatio: window.devicePixelRatio
          },
          onBeforeRender: function(program, camera) {
            program.setBuffer('indices', {
              value: idx
            });
          },

          render: function() {
            gl.depthMask(0);
            gl.drawArrays(gl.POINTS, 0, number);
            gl.depthMask(1);
          }
        }));
        app.scene.add(particleModels[i]);
      }

      var lastDate = +new Date();

      function updateParticles() {
        var now = +new Date(),
            dt = now - lastDate;
        lastDate = now;
        
        for (i = 0; i < mult; i++)
          particleBuffers[i].process({
            program: 'move',
            textures: [velocityField.from[0] + '-texture'],
            uniforms: {
              'RESOLUTIONX': RESOLUTION,
              'RESOLUTIONY': RESOLUTION,
              'RESOLUTIONZ': RESOLUTION,
              time: +new Date() % 1000 / 1000,
              dt: dt / 1000
            }
          });

      }

      function draw() {
        updateParticles();


        gl.clearColor(1, 1, 1, 1);
        gl.clearDepth(2);
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        app.scene.render();
        gl.depthMask(1);
        setTimeout(function() {
          draw();
        }, 15);
      }
      
      draw();
    }
  });
}

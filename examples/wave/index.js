PhiloGL.unpack();
window.addEventListener('DOMContentLoaded', webGLStart, false);

// FIXME: Need to cleanup this code...

function webGLStart() {
  var
    elevation = 0,
    start = +new Date(),
    RESOLUTIONX = 256.,
    RESOLUTIONY = 256.,
    SIZEX = 1,
    SIZEY = 1,
    backgroundSphere,
    waterSurface,
    width, height,
    matStart = new Mat4(),
    dragStart,
    lastDrop = 0,
    dt = 1,
    drops = 5,
    IOR = 1.3330; // Water

  var src = 'flip', dst = 'flop', N = 10;

  matStart.id();
  var skyHDR = [];

  skyHDR = IO.Images({
    src: ['StepSky/Normal.png', 'StepSky/Reduce1.png', 'StepSky/Reduce2.png', 'StepSky/Reduce3.png', 'rocks.jpg'],
    onComplete: initApp
  });

  function resize() {
    var canvas = document.getElementById('wave'),
      style = window.getComputedStyle(canvas);
    height = parseFloat(style.getPropertyValue('height'));
    canvas.height = height;
    width = parseFloat(style.getPropertyValue('width'));
    canvas.width = width;
  }

  window.addEventListener('resize', resize);
  resize();

  function calculatePosition(camera, e) {
    var x = e.x / width, y = e.y / height,
      proj = camera.projection,
      view = camera.view,
      projView = proj.mulMat4(view),
      invView = projView.invert(),
      camPos = camera.position,
      vec = invView.mulVec3(new Vec3(e.x / width * 2., e.y / height * 2., 100));
    var k = camPos.z / (camPos.z - vec.z);
    return [camPos.x + (vec.x - camPos.x) * k, camPos.y + (vec.y - camPos.y) * k];
  }

  function drop(position, elevation) {
    Media.Image.postProcess({
      width: RESOLUTIONX,
      height: RESOLUTIONY,
      fromTexture: src + '-texture',
      toFrameBuffer: dst,
      program: 'drop',
      uniforms: {
        RESOLUTIONX: RESOLUTIONX,
        RESOLUTIONY: RESOLUTIONY,
        cursor: [position[0] / SIZEX, position[1] / SIZEY],
        elevation: elevation
      }
    });
    var temp = dst;
    dst = src;
    src = temp;
  }

  function initApp() {
    PhiloGL('wave', {
      program: [
        {
          id: 'calc',
          from: 'uris',
          vs: 'shaders/plain.vs.glsl',
          fs: 'shaders/calc.fs.glsl',
          noCache: true
        },
        {
          id: 'back',
          from: 'uris',
          vs: 'shaders/back.vs.glsl',
          fs: 'shaders/back.fs.glsl',
          noCache: true
        },
        {
          id: 'drop',
          from: 'uris',
          vs: 'shaders/plain.vs.glsl',
          fs: 'shaders/drop.fs.glsl',
          noCache: true
        },
        {
          id: 'wave',
          from: 'uris',
          vs: 'shaders/wave.vs.glsl',
          fs: 'shaders/wave.fs.glsl',
          noCache: true
        },
        {
          id: 'shore',
          from: 'uris',
          vs: 'shaders/shore.vs.glsl',
          fs: 'shaders/shore.fs.glsl',
          noCache: true
        }
      ],
      camera: {
        position: {
          x: 0.16908077347793982,
          y: -0.4663435831751707,
          z: 0.06273240367979076
        },
        up: {
          x: 0,
          y: 0,
          z: 1
        }
      },
      scene: {
        lights: {
          enable: true,
          ambient: {
            r: 0.4,
            g: 0.4,
            b: 0.4
          },
          points: {
            diffuse: {
              r: 0.8,
              g: 0.8,
              b: 0.8
            },
            specular: {
              r: 0.9,
              g: 0.9,
              b: 0.9
            },
            position: {
              x: 2,
              y: 2,
              z: -4
            }
          }
        }
      },
      events: {
        cachePosition: false,
        onClick: function (e) {
          var position = calculatePosition(this.camera, e);
          if (Math.abs(position[0]) > 0.5 * SIZEX || Math.abs(position[1]) > 0.5 * SIZEY) {
            return;
          }
          elevation = .1;
          e.event.preventDefault();
          drop(position, -elevation);
          e.event.preventDefault();
          e.event.stopPropagation();
        },

        onMouseMove: function (e) {
          var position = calculatePosition(this.camera, e);
          if (Math.abs(position[0]) > 0.5 * SIZEX || Math.abs(position[1]) > 0.5 * SIZEY) {
            return;
          }
          elevation = .05;
          e.event.preventDefault();
          drop(position, -elevation);
          e.event.preventDefault();
          e.event.stopPropagation();
        },

        onMouseWheel: function (e) {
          var position = this.camera.position,
            R = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z),
            theta = Math.atan2(position.y, position.x),
            alpha = Math.atan2(position.z, Math.sqrt(position.x * position.x + position.y * position.y));
          R = Math.max(0.5, Math.min(14, R - e.wheel * 0.1));
          position.x = Math.cos(theta) * Math.cos(alpha) * R;
          position.y = Math.sin(theta) * Math.cos(alpha) * R;
          position.z = Math.sin(alpha) * R;
          this.camera.update();
          waterSurface.uniforms.eye = position;
          waterSurface.uniforms.n2 = IOR;
          backgroundSphere.uniforms.eye = position;
          e.event.preventDefault();
          e.event.stopPropagation();
        },

        onDragStart: function (e) {
          dragStart = [e.x, e.y];
        },

        onDragMove: function (e) {
          var dx = e.x - dragStart[0],
            dy = e.y - dragStart[1];
          dragStart = [e.x, e.y];
          var position = this.camera.position,
            R = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z),
            theta = Math.atan2(position.y, position.x),
            alpha = Math.atan2(position.z, Math.sqrt(position.x * position.x + position.y * position.y));
          alpha = Math.min(90 / 180 * Math.PI, Math.max(-90 / 180 * Math.PI, alpha - dy / 200));
          theta -= dx / 200;
          position.x = Math.cos(theta) * Math.cos(alpha) * R;
          position.y = Math.sin(theta) * Math.cos(alpha) * R;
          position.z = Math.sin(alpha) * R;
          this.camera.update();
          waterSurface.uniforms.eye = position;
          waterSurface.uniforms.n2 = IOR;
          backgroundSphere.uniforms.eye = position;
        }
      },

      onError: function (e) {
        alert(e);
      },

      onLoad: function (app) {
        function clearBuffer(name) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, app.frameBuffers[name]);
          gl.viewport(0, 0, RESOLUTIONX, RESOLUTIONY);
          gl.clearColor(0, 0, 0, 1);
          gl.clearDepth(1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        var gl = app.gl,
          scene = app.scene,
          camera = app.camera,
          program = app.program.wave;


        var speedControl = document.getElementById('speed');
        speedControl.addEventListener('change', function () {
          dt = +speedControl.value;
        }, false);

        var dropsControl = document.getElementById('drops');
        dropsControl.addEventListener('change', function () {
          drops = +dropsControl.value;
        }, false);

        var iorControl = document.getElementById('ior');
        iorControl.addEventListener('change', function () {
          IOR = Math.pow(1.3330, +iorControl.value);
          waterSurface.uniforms.n2 = IOR;
        }, false);


        var frameBuffer = {
          width: RESOLUTIONX,
          height: RESOLUTIONY,
          bindToTexture: {
            pixelStore: [],
            parameters: [
              {
                name: gl.TEXTURE_MAG_FILTER,
                value: gl.LINEAR
              },
              {
                name: gl.TEXTURE_MIN_FILTER,
                value: gl.LINEAR,
                generateMipmap: false
              },
              {
                name: gl.TEXTURE_WRAP_S,
                value: gl.CLAMP_TO_EDGE
              },
              {
                name: gl.TEXTURE_WRAP_T,
                value: gl.CLAMP_TO_EDGE
              }
            ],
            data: {
              width: RESOLUTIONX,
              height: RESOLUTIONY,
              type: gl.FLOAT
            }
          }
        };


        app.setFrameBuffer(src, frameBuffer);
        app.setFrameBuffer(dst, frameBuffer);

        var loadedTextures = ['SKY0', 'SKY1', 'SKY2', 'SKY3', 'rocks'];
        for (var i = 0; i < loadedTextures.length; i++) {
          app.setTexture(loadedTextures[i], {
            textureType: gl.TEXTURE_2D,
            parameters: [
              {
                name: gl.TEXTURE_MAG_FILTER,
                value: gl.LINEAR_MIPMAP_LINEAR
              },
              {
                name: gl.TEXTURE_MIN_FILTER,
                value: gl.LINEAR_MIPMAP_LINEAR,
                generateMipmap: true
              }
            ],
            pixelStore: [
              {
                name: gl.UNPACK_FLIP_Y_WEBGL,
                value: false
              }
            ],
            data: {
              value: skyHDR[i],
              width: 2048,
              height: 1024
            }
          });
        }


        clearBuffer('flip');
        clearBuffer('flop');

        gl.enable(gl.DEPTH_TEST);
//        gl.enable(gl.CULL_FACE);
//        gl.cullFace(gl.FRONT);
        gl.depthFunc(gl.LEQUAL);

        function animate() {

          var uniforms = {
            dt: dt / N,
            RESOLUTIONX: RESOLUTIONX,
            RESOLUTIONY: RESOLUTIONY,
            elevation: elevation
          };

          for (var i = 0; i < N; i++) {
            Media.Image.postProcess(
              {
                width: RESOLUTIONX,
                height: RESOLUTIONY,
                fromTexture: src + '-texture',
                toFrameBuffer: dst,
                program: 'calc',
                uniforms: uniforms
              });
            var temp = dst;
            dst = src;
            src = temp;
          }

          var temp = dst;
          dst = src;
          src = temp;
          elevation /= 1.1;
          var time = (+new Date() - start) / 1000;
          if (false) {
            Media.Image.postProcess({
              width: RESOLUTIONX,
              height: RESOLUTIONY,
              fromTexture: src + '-texture',
              toScreen: true,
              program: 'calc',
              uniforms: uniforms
            });
          } else {
            program.use();
            gl.clearColor(0, 0, 0, 1);
            gl.clearDepth(1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.viewport(0, 0, width, height);
            waterSurface.textures = [src + '-texture', 'SKY0', 'SKY1', 'SKY2', 'SKY3'];
            scene.render();
          }
          if (dt > 0 && drops > 0) {
            while (time > lastDrop + 1 / drops / dt) {
              drop([(Math.random() - 0.5) * SIZEX, (Math.random() - 0.5) * SIZEY], 0.3);
              lastDrop += 1 / drops / dt;
            }
          }
          setTimeout(animate, 25);
        }

        //Create earth
        var shore = new O3D.Plane({
          type: 'x,y',
          xlen: 1,
          ylen: 1,
          nx: 1,
          ny: 1,
          program: 'shore',
          textures: ['rocks'],
          uniforms: {
            shininess: 3,
            eye: camera.position,
            n1: 1,
            n2: IOR
          }
        });
        shore.rotation.x = 12 / 180 * Math.PI;
        shore.position.z = -0.1;
        shore.update();
        var
          u = new Vec3(0.5, 0, 0),
          v = new Vec3(0, 0.5, 0),
          c = new Vec3(0, 0, 0);
        u = shore.matrix.mulVec3(u);
        v = shore.matrix.mulVec3(v);
        c = shore.matrix.mulVec3(c);
        u = u.sub(c);
        v = v.sub(c);

        waterSurface = new O3D.Plane({
          type: 'x,y',
          xlen: SIZEX,
          ylen: SIZEY,
          nx: 128,
          ny: 128,
          offset: 0,
          program: 'wave',
          textures: [src + '-texture', 'SKY0', 'SKY1', 'SKY2', 'SKY3', 'rocks'],
          uniforms: {
            shininess: 3,
            eye: camera.position,
            n1: 1,
            n2: IOR,
            plainU: u,
            plainV: v,
            plainC: c
          }
        });
        backgroundSphere = new O3D.Sphere({
          nlat: 5,
          nlong: 5,
          radius: 1500,
          program: 'back',
          textures: ['SKY0', 'SKY1', 'SKY2', 'SKY3'],
          uniform: {
            eye: camera.position
          }
        });
        scene.add(backgroundSphere);
        scene.add(waterSurface);
        scene.add(shore);
        camera.fov = 37.8; // 35mm
        camera.far = 1e40;
        camera.update();
        setTimeout(animate, 25);
      }
    });
  }
}
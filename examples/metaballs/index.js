(function() {
  //Unpack Octant modules
  Octant.unpack();

  //paralelization index
  var n = 1,
  //number of workers
      nWorkers = Math.pow(8, n), 
  //ratio to divide the grid
      den = n + 1,
  //number of particles
      nBalls = 4,
  //initialize balls
      balls = new Balls(nBalls, Grid),
  //initialize workers
      workerGroup = new WorkerGroup('WorkerMarchingCube.js', nWorkers),
  //cubemap images
      images;

  var model;
  
  var len = 2, offset = 1.0000;
  var plane1 = new O3D.Plane({
      type: 'x,y',
      xlen: len,
      ylen: len,
      offset: offset,
      program: 'cubemap',
      textures: ['cubemap']
    }),
    plane2 = new O3D.Plane({
      type: 'x,z',
      xlen: len,
      zlen: len,
      offset: -offset,
      program: 'cubemap',
      textures: ['cubemap']
    }),
    plane3 = new O3D.Plane({
      type: 'x,z',
      xlen: len,
      zlen: len,
      offset: offset,
      program: 'cubemap',
      textures: ['cubemap']
    }),
    plane4 = new O3D.Plane({
      type: 'y,z',
      ylen: len,
      zlen: len,
      offset: -offset,
      program: 'cubemap',
      textures: ['cubemap']
    }),
    plane5 = new O3D.Plane({
      type: 'y,z',
      ylen: len,
      zlen: len,
      offset: offset,
      program: 'cubemap',
      textures: ['cubemap']
    });

  function application(app) {
      var gl = app.gl,
          canvas = gl.canvas,
          scene = app.scene,
          camera = app.camera;
      
      gl.viewport(0, 0, canvas.width, canvas.height);

      //cubemap for sphere
      app.setTexture('cube', {
        textureType: gl.TEXTURE_CUBE_MAP,
        textureTarget: [gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z],
        pixelStore: [{
          name: gl.UNPACK_FLIP_Y_WEBGL,
          value: false
        }],
        data: {
          value: images
        }
      });
      //cubemap for cube
      app.setTexture('cubemap', {
        textureType: gl.TEXTURE_CUBE_MAP,
        textureTarget: [gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z],
        pixelStore: [{
          name: gl.UNPACK_FLIP_Y_WEBGL,
          value: true
        }],
        data: {
          value: images
        }
      });

      //Basic gl setup
      gl.clearDepth(1.0);
      gl.clearColor(0.5, 0.5, 0.5, 1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      //Add balls
      scene.add(plane1, plane2, plane3, plane4, plane5);
      //run loop
      mapReduce();
      //Render the scene and perform a new loop
      function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        scene.render();
        balls.update();
        Fx.requestAnimationFrame(mapReduce); 
      }
      
      //paralelize marching cubes.
      function mapReduce() {
        var x = Grid.x,
            xfrom = x.from,
            xto = x.to,
            xstep = x.step,
            nx = ((xto - xfrom) / den),
            y = Grid.y,
            yfrom = y.from,
            yto = y.to,
            ystep = y.step,
            ny = ((yto - yfrom) / den),
            z = Grid.z,
            zfrom = z.from,
            zto = z.to,
            zstep = z.step,
            nz = ((zto - zfrom) / den);

        workerGroup.map(function(nb) {
          var idx = nb % den,
              idy = ((nb / den) >> 0) % den,
              idz = ((nb / den / den) >> 0) % den;
          var o = {
            grid: {
              x: {
                from: xfrom + idx * nx,
                to: xfrom + idx * nx + nx,
                step: xstep
              },
              y: {
                from: yfrom + idy * ny,
                to: yfrom + idy * ny + ny,
                step: ystep
              },
              z: {
                from: zfrom + idz * nz,
                to: zfrom + idz * nz + nz,
                step: zstep
              }
            },
            isolevel: 10,
            balls: balls.ballsArray
          };
          return o;
        });
        var indexAcum = 0, initialValue = {
          vertices: [],
          normals: []
        };

        workerGroup.reduce({
          reduceFn: function (x, y) {
            x.vertices.push.apply(x.vertices, y.vertices);
            x.normals.push.apply(x.normals, y.normals);
            return x;
          },
          initialValue: initialValue,
          onComplete: updateModel
        });
      }

      function updateModel(data) {
        debugger;
        if (!model) {
          model = new O3D.Model({
            vertices: data.vertices,
            normals: data.normals,
            dynamic: true,
            textures: ['cube'],
            program: 'default',
            reflection: 0.8,
            refraction: 0
          });
          model.position.set(0, 0, -0.6);
          model.update();
          scene.add(model);
        } else {
          model.vertices = data.vertices;
          model.normals = data.normals;
          model.dynamic = true;
        }
        render();
      }
    }
    

  window.init = function() {
    images = IO.Images({
      src: ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map(function(n) { return 'interstellar/' + n + '.jpg'; }),
      onComplete: initApp,
      noCache: true
    })
    
    var pos;

    function initApp() {
      //Create App
      Octant('canvas', {
        program: [{
          id: 'default',
          from: 'defaults'
        }, {
          id: 'cubemap',
          from: 'uris',
          vs: 'box2.vs.glsl',
          fs: 'box2.fs.glsl',
          noCache: true
        }],
        camera: {
          fov: 80,
          position: {
            x: 0, y: 0, z: -1.35
          },
          target: {
            x: 0, y: 0, z: 1
          }
        },
        scene: {
          lights: {
            enable: true,
            ambient: {
              r: 0.6,
              g: 0.6,
              b: 0.6
            },
            points: {
              diffuse: { 
                r: 0.7, 
                g: 0.7, 
                b: 0.7 
              },
              specular: { 
                r: 0.8, 
                g: 0.8, 
                b: 0 
              },
              position: { 
                x: -1, 
                y: -1, 
                z: -1 
              }
            }
          }
        },
        events: {
          onMouseMove: function(e) {
            var camera = this.camera,
                pos = camera.position;
            pos.x = e.x * 0.00002;
            //camera.update();
          },
          onMouseWheel: function(e) {
            // e.stop();
            // var camera = this.camera;
            // camera.position.z -= e.wheel;
            // camera.update();
          }
        },
        onError: function() {
          alert("There was an error while creating the WebGL application");
        },
        onLoad: application
    });
  }
  };
})();

PhiloGL.unpack();

var $ = function(d) { return document.getElementById(d); };
    

window.addEventListener('DOMContentLoaded', init, false);

function init() {
  //Create application
  PhiloGL('map', {
    program: [{
      id: 'elevation',
      from: 'uris',
      path: './shaders/',
      vs: 'elevation.vs.glsl',
      fs: 'elevation.fs.glsl',
      noCache: true
    }, {
      id: 'stations',
      from: 'uris',
      path: './shaders/',
      vs: 'stations.vs.glsl',
      fs: 'stations.fs.glsl',
      noCache: true
    }, {
      id: 'glow',
      from: 'uris',
      path: './shaders/',
      vs: 'glow.vs.glsl',
      fs: 'glow.fs.glsl',
      noCache: true
    }, {
      id: 'points',
      from: 'uris',
      path: './shaders/',
      vs: 'points.vs.glsl',
      fs: 'points.fs.glsl',
      noCache: true
    }, {
      id: 'lines',
      from: 'uris',
      path: './shaders/',
      vs: 'lines.vs.glsl',
      fs: 'lines.fs.glsl',
      noCache: true
    }],
    // scene: {
    //   lights: {
    //     enable: true,
    //     ambient: {
    //       r: 0.4,
    //       g: 0.4,
    //       b: 0.4
    //     },
    //     points: {
    //       diffuse: { 
    //         r: 0.7, 
    //         g: 0.7, 
    //         b: 0.7 
    //       },
    //       specular: { 
    //         r: 0.8, 
    //         g: 0.8, 
    //         b: 0 
    //       },
    //       position: { 
    //         x: 250, 
    //         y: 250, 
    //         z: 250 
    //       }
    //     }
    //   }
    // },
    camera: {
      position: {
        x: 0, y: 0, z: 0.65
      }
    },
    textures: {
      src: ['img/elevation_3764_2048_post.jpg',
            'img/elevation_3764_2048_gs.jpg'],
      parameters: [{
        name: 'TEXTURE_MAG_FILTER',
        value: 'LINEAR'
      }, {
        name: 'TEXTURE_MIN_FILTER',
        value: 'LINEAR_MIPMAP_NEAREST',
        generateMipmap: true
      }]
    },
    events: {
      onDragStart: function(e) {
        this.pos = {
          x: e.x,
          y: e.y
        };
      },
      onDragEnd: function() {
        this.theta = this.scene.models[0].rotation.x;
      },
      onDragMove: function(e) {
        var z = this.camera.position.z,
            sign = Math.abs(z) / z,
            pos = this.pos;

        this.scene.models.forEach(function(m) {
          m.rotation.x += (pos.y - e.y) / 100;
          m.update();
        });

        pos.x = e.x;
        pos.y = e.y;
      },
      onMouseWheel: function(e) {
        e.stop();
        var camera = this.camera;
        camera.position.z -= e.wheel;
        camera.update();
      }
    },
    onError: function() {
      console.log('error', arguments);
    },
    onLoad: function(app) {
      //Unpack app properties
      var hour = 0,
          hourData = null,
          gl = app.gl,
          program = app.program,
          scene = app.scene,
          canvas = app.canvas,
          camera = app.camera,
          surface = new O3D.Plane({
            type: 'x,y',
            xlen: 1,
            ylen: 0.5,
            nx: 100,
            ny: 50,
            offset: 0,
            textures: ['img/elevation_3764_2048_post.jpg', 
                       'img/elevation_3764_2048_gs.jpg'],
            program: 'elevation'
          });

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      //Basic gl setup
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clearDepth(1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.viewport(0, 0, +canvas.width, +canvas.height);

      //Add object to the scene
      scene.add(surface);

      getStations(function(stations, wind) {
        scene.add(stations, wind);
        getWeatherData(function(hourlyData) {
          hourData = hourlyData;
          draw();
        });
      });

      //Draw the scene
      function draw() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //render model
        scene.render();
        Fx.requestAnimationFrame(draw);
      }

      function getStations(callback) {
        new IO.XHR({
          url: 'data/stations.json',
          onError: function() {
            console.log('there was an error while making the XHR request');
          },
          onSuccess: function(text) {
            var array = JSON.parse(text),
                l = array.length,
                vertices = new Float32Array(l * 3),
                lines    = new Float32Array(l * 6),
                center   = new Float32Array(l * 6),
                delta = 0.2;

            for (var i = 0; i < l; ++i) {
              var i3 = i * 3,
                  i4 = i * 4,
                  i6 = i * 6,
                  elem = array[i],
                  lat = elem.lat,
                  long = elem.long;
              
              vertices[i3    ] = long;
              vertices[i3 + 1] = lat;
              vertices[i3 + 2] = 0;
              
              center[i6    ] = long;
              center[i6 + 1] = lat;
              center[i6 + 2] = 0;
              
              center[i6 + 3] = long;
              center[i6 + 4] = lat;
              center[i6 + 5] = 0;
              
              lines[i6    ] = long - delta;
              lines[i6 + 1] = lat - delta;
              lines[i6 + 2] = 0;
              
              lines[i6 + 3] = long + delta;
              lines[i6 + 4] = lat + delta;
              lines[i6 + 5] = 0;
            }

            var stations = new O3D.Model({
              vertices: vertices,
              program: 'stations',
              drawType: 'POINTS'
            });

            app.gl.lineWidth(2);
            
            var wind = new O3D.Model({
              vertices: lines,
              program: 'lines',
              drawType: 'LINES',
              attributes: {
                center: {
                  value: center,
                  size: 3
                }
              }
            });

            callback(stations, wind);

          }
        }).send();
      }

      function getWeatherData(callback) {
        new IO.XHR({
          url: 'data/weather.bin',
          responseType: 'arraybuffer',
          onError: function() {
            console.log('there was an error while making the XHR request');
          },
          onProgress: function() {
            console.log('progress', arguments);
          },
          onSuccess: function(buffer) {
            var data = new Uint16Array(buffer),
                hours = 72,
                components = 3,
                l = data.length / (hours * components),
                hourlyData = Array(hours);

            for (var i = 0; i < hours; ++i) {
              hourlyData[i] = createHourlyData(data, i, l, hours, components);
            }

            callback(hourlyData);
          }
        }).send();

        function createHourlyData(data, i, l, hours, components) {
          var len = data.length,
              ans = new Float32Array(l * components);
          
          for (var j = i, count = 0; j < len; j += (hours * components)) {
            //three components
            ans[count++] = data[j    ];
            ans[count++] = data[j + 1];
            ans[count++] = data[j + 2];
          }

          return ans;
        }
      }


      // var generateShadowTexture = (function() {
      //   var backCamera = new Camera(45, 1, 0.1, 500),
      //       backScene = new Scene(app.program.points, camera);
      //   //create glow and image framebuffer
      //   app.setFrameBuffer('points', {
      //     width: 1024,
      //     height: 512,
      //     bindToTexture: {
      //       parameters: [{
      //         name: 'TEXTURE_MAG_FILTER',
      //         value: 'LINEAR'
      //       }, {
      //         name: 'TEXTURE_MIN_FILTER',
      //         value: 'LINEAR_MIPMAP_NEAREST',
      //         generateMipmap: false
      //       }]
      //     },
      //     bindToRenderBuffer: true
      //   });

      //   return function(model) {
      //     //add point mesh
      //     backScene.add(model);

      //     //render points to texture
      //     app.setFrameBuffer('points', true);
      //     gl.viewport(0, 0, 1024, 512);
      //     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //     // backScene.render();
      //     backScene.renderToTexture('points');
      //     app.setFrameBuffer('points', false);

      //     //add bloom effect
      //     Media.Image.postProcess({
      //       fromTexture: ['points-texture'],
      //       toScreen: true,
      //       aspectRatio: 1,
      //       // toFrameBuffer: ['points-glow'],
      //       program: 'glow',
      //       width: 1024,
      //       height: 512
      //     });
      //   };
      // })();
    }
  });







      /*Used to generate a shadow map.
      getStations(function(model) {
        generateShadowMap(model);
      });

      function getStations(callback) {
        new IO.XHR({
          url: 'data/stations.json',
          onError: function() {
            console.log('there was an error while making the XHR request');
          },
          onSuccess: function(text) {
            var array = JSON.parse(text),
                l = array.length,
                vertices = new Float32Array(l * 3);

            for (var i = 0; i < l; ++i) {
              var i3 = i * 3,
                  elem = array[i];
              
              vertices[i3    ] = elem.long;
              vertices[i3 + 1] = elem.lat;
              vertices[i3 + 2] = elem.elv;
            }

            callback(new O3D.Model({
              vertices: vertices,
              program: 'points',
              drawType: 'POINTS'
            }));

          }
        }).send();
      }


      function generateShadowMap(model) {
        var map = document.getElementById('map'),
            ctx = map.getContext('2d'),
            width = map.width,
            height = map.height;

        var vertices = model.vertices,
            len = vertices.length,
            offset = (4096 - 3764) / 2 * (1024 / 4096),
            fromy = 25,
            toy = 50,
            fromx = 65,
            tox = 125,
            fromyt = 0,
            toyt = 512,
            fromxt = 0 + offset,
            toxt = 1024 - offset;
        

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        for (var i = 0; i < len; i+=3) {
          var x = vertices[i    ],
              y = vertices[i + 1];
          
          x = width - ((x - fromx) / (tox - fromx) * (toxt - fromxt) + fromxt);
          y = height - ((y - fromy) / (toy - fromy) * (toyt - fromyt) + fromyt);

          ctx.save();
          var rg = ctx.createRadialGradient(x, y, 0, x, y, 30);
          rg.addColorStop(0, 'rgba(255, 255, 255, 1)');
          rg.addColorStop(0.2, 'rgba(255, 255, 255, .05)');
          rg.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = rg;
          ctx.arc(x, y, 30, 0, Math.PI * 2, true);
          ctx.fill();
          ctx.restore();
        }
      }
      */
}

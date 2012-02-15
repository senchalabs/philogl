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
      id: 'markers',
      from: 'uris',
      path: './shaders/',
      vs: 'markers.vs.glsl',
      fs: 'markers.fs.glsl',
      noCache: true
    }/*, {
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
    }*/],
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
        camera.position.z -= e.wheel / 2;
        camera.update();
      }
    },
    onError: function() {
      console.log('error', arguments);
    },
    onLoad: function(app) {
      //Unpack app properties
      var hour = 0,
          data = { hour: null, stations: null },
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
                       'img/elevation_3764_2048_post.jpg'],
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

      //get data and create models.
      getWeatherData(function(hourlyData) {
        hourData = hourlyData;
        getStations(function(stations, wind) {
          scene.add(new MapMarkers());
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
            data.stations = JSON.parse(text);
            callback();
          }
        }).send();
      }

      function MapMarkers() {
        var stations = data.stations,
            weather = data.hour[hour],
            l = stations.length;
            
        O3D.Plane.call(this, {
          type: 'x,y',
          xlen: 1,
          ylen: 1,
          offset: 0,
          program: 'markers',
          textures: ['img/elevation_3764_2048_post.jpg'],

          render: function(gl, program, camera) {
            //enable blend
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);
            gl.disable(gl.DEPTH_TEST);
            
            for (var i = 0, 
                     TRIANGLES = gl.TRIANGLES, 
                     indicesLength = this.$indicesLength, 
                     UNSIGNED_SHORT = gl.UNSIGNED_SHORT; i < l; i++) {

              var station = stations[i];
              
              program.setUniforms({
                lat: station.lat,
                lon: station.long,
                data: weather[i]
              });

              gl.drawElements(TRIANGLES, indicesLength, UNSIGNED_SHORT, 0);
            }

            //disable blend
            gl.disable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
          }
        });
      }

      MapMarkers.prototype = Object.create(O3D.Plane.prototype);


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
            var bufferData = new Uint16Array(buffer),
                hours = 72,
                components = 3,
                l = bufferData.length / (hours * components),
                hourlyData = Array(hours);

            for (var i = 0; i < hours; ++i) {
              hourlyData[i] = createHourlyData(bufferData, i, l, hours, components);
            }

            data.hour = hourlyData;
            callback();
          }
        }).send();

        function createHourlyData(bufferData, i, l, hours, components) {
          var len = bufferData.length,
              array = Array(l);
 
          for (var j = i, count = 0; j < len; j += (hours * components)) {
            array[count++] = new Float32Array([bufferData[j    ], 
                                               bufferData[j + 1],
                                               bufferData[j + 2]]);
          }

          return array;
        }
      }
    }
  });
}

(function() {
  //Unpack Octant modules
  Octant.unpack();
  
  //Utility fn to getElementById
  function $id(d) {
    return document.getElementById(d);
  }
  
  var model = new O3D.Sphere({
    reflection: 0.6,
    shininess: 10,
    nlat: 10,
    nlong: 10,
    radius: 1,
    colors: [0.5, 0.5, 0.5, 1],
    textures: ['cube']
  });

  window.init = function() {
    var images = IO.Images({
      src: ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map(function(n) { return n + '.jpg'; }),
      onComplete: initApp
    }), pos;

    function initApp() {
      //Create App
      Octant('canvas', {
        camera: {
          position: {
            x: 0, y: 0, z: 5
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
                x: 5, 
                y: 5, 
                z: 5 
              }
            }
          }
        },
        events: {
          onDragStart: function(e) {
            pos = {
              x: e.x,
              y: e.y
            };
          },
          onDragMove: function(e) {
            var z = this.camera.position.z,
            sign = Math.abs(z) / z;

            model.rotation.y += -(pos.x - e.x) / 100;
            model.rotation.x += sign * (pos.y - e.y) / 100;
            model.update();
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
          alert("There was an error while creating the WebGL application");
        },
        onLoad: function(app) {
          var gl = app.gl,
              canvas = gl.canvas,
              scene = app.scene;
          
          app.setTexture('cube', {
            textureType: gl.TEXTURE_CUBE_MAP,
            textureTarget: [gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                            gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
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
          //Basic gl setup
          gl.clearDepth(1.0);
          gl.clearColor(0, 0, 0, 1.0);
          gl.enable(gl.DEPTH_TEST);
          gl.depthFunc(gl.LEQUAL);
          //Add balls
          scene.add(model);
          //run loop
          render();
          //Render the scene and perform a new loop
          function render() {
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            scene.render();
            Fx.requestAnimationFrame(render); 
          }
        }
      });
    }
  };
})();

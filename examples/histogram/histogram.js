(function() {
  //Unpack Octant modules
  Octant.unpack();
  
  //Utility fn to getElementById
  function $id(d) {
    return document.getElementById(d);
  }

  //color histogram elements, models
  var dim = 8, histogram, photos, video, 
      worker = new WorkerGroup('histogram-models.js', 1),
      histogramModel = new O3D.Model({
        shininess: 20,
        render: function(gl) {
           gl.drawElements(gl.TRIANGLES, histogram.indices.length, gl.UNSIGNED_SHORT, 0);
        },
        onBeforeRender: function(program, camera) {
          ['sphereVertices', 'sphereNormals', 'colors', 'rgb', 'hsl', 'hsv'].forEach(function(bufferName) {
            program.setBuffer(bufferName);
          });
          program.setBuffer('indices');
        }
      });
  
  //returns a color array from an image
  var createColorArray = (function() {
    var pastie, width, height, ctx, round = Math.round,
        dim2 = dim * dim, dim3 = dim2 * dim, nVertices = (dim +1) * (dim +1),
        histogram, photos;

    return function(elem) {
      pastie = pastie || $id('pastie');
      ctx = ctx || pastie.getContext('2d');
      width = width || pastie.width;
      height = height || pastie.height;

      ctx.drawImage(elem, 0, 0, width, height);
      var ans = Array(dim3), 
          expando = Array(dim3 * (dim + 1) * (dim +1));
          pixels = ctx.getImageData(0, 0, width, height).data,
          dim2 = dim * dim;

      for (var i = 0, l = pixels.length; i < l; i += 4) {
        var r = round(pixels[i   ] / 255 * dim),
            g = round(pixels[i +1] / 255 * dim),
            b = round(pixels[i +2] / 255 * dim),
            index = r + g * dim + b * dim2;
        
        ans[index] = (ans[index] || 0) + 1;
      }

      //expand the array to fit the number of vertices
      for (i = 0, l = dim3; i < l; i++) {
        var n = nVertices, index = i * n;
        while (n--) {
          expando[index + n] = (ans[i] || 0) / (width * height);
        }
      }

      return expando;
    };

  })();

  window.init = function() {
    //create the models
    worker.map(function() { return {}; }).reduce({
      onComplete: function(ans) {
        histogram = ans;
        initApp();
      }
    });

    function initApp() {
      var theta = Math.PI / 4;
      //Create App
      Octant('histogram-canvas', {
        program: {
          from: 'uris',
          path: './',
          vs: 'histogram.vs.glsl',
          fs: 'histogram.fs.glsl',
          noCache: true
        },
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
            points: [
            {
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
                x: 3, 
                y: 3, 
                z: 3 
              }
            },
            {
              diffuse: { 
                r: 0.7, 
                g: 0.7, 
                b: 0.7 
              },
              specular: { 
                r: 0.8, 
                g: 0.8, 
                b: 0.8 
              },
              position: { 
                x: 3, 
                y: -3, 
                z: -3 
              }
            },
            {
              diffuse: { 
                r: 0.7, 
                g: 0.7, 
                b: 0.7 
              },
              specular: { 
                r: 0.8, 
                g: 0.8, 
                b: 0.8 
              },
              position: { 
                x: 3, 
                y: 3, 
                z: -3 
              }
            }]
          }
        },
        events: {
          onDragStart: function(e) {
            this.pos = {
              x: e.x,
              y: e.y
            };
            this.dragging = true;
          },
          onDragCancel: function() {
            this.dragging = false;
          },
          onDragEnd: function() {
            this.dragging = false;
            theta = histogramModel.rotation.y;
          },
          onDragMove: function(e) {
            var z = this.camera.position.z,
                sign = Math.abs(z) / z,
                pos = this.pos;

            histogramModel.rotation.y += -(pos.x - e.x) / 100;
            //histogramModel.rotation.x += sign * (pos.y - e.y) / 100;
            histogramModel.update();
            pos.x = e.x;
            pos.y = e.y;
          },
          onMouseWheel: function(e) {
            e.stop();
            var camera = this.camera;
            camera.position.z += -e.wheel;
            camera.update();
          }
        },
        onError: function() {
          alert("There was an error while creating the WebGL application");
        },
        onLoad: function(app) {
          var gl = app.gl,
              canvas = gl.canvas,
              scene = app.scene,
              program = app.program,
              movie = $id('movie'),
              grayscale = $id('grayscale'),
              lis = document.querySelectorAll('ul.schemes li'),
              radios = document.querySelectorAll('ul.schemes li input'),
              grains = document.querySelectorAll('input[name=grain]'),
              size = $id('size'),
              color = 0.3,
              played = true,
              currentIndex = 0,
              sizeValue = 0.01;

          //Add event listeners
          for (var i = 0, l = lis.length; i < l; i++) {
            (function(li, index) { 
              li.addEventListener('click', function () {
                radios[index].checked = true;
                fx.start({
                  from: currentIndex,
                  to: index 
                });
              }, false);
            })(lis[i], i);
          }
          
          for (var i = 0, l = grains.length; i < l; i++) {
            (function(li, index) { 
              li.addEventListener('change', function() {
                if (li.checked) {
                  fxSize.start({
                    from: sizeValue,
                    to: +li.value
                  });
                }
              }, false);
            })(grains[i], i);
          }
          
          grayscale.addEventListener('change', function() {
            color = +grayscale.value;
          }, false);
         
          //Basic gl setup
          gl.clearDepth(1.0);
          gl.enable(gl.DEPTH_TEST);
          gl.depthFunc(gl.LEQUAL);
          gl.viewport(0, 0, canvas.width, canvas.height);
          
          //Add element(s) to the scene
          scene.add(histogramModel);

          //Send data to buffers
          program.setBuffers({
            'colors': {
              value: new Float32Array(histogram.colors),
              size: 3
            },
            'rgb': {
              value: new Float32Array(histogram.rgb),
              size: 3
            },
            'hsl': {
              value: new Float32Array(histogram.hsl),
              size: 3
            },
            'hsv': {
              value: new Float32Array(histogram.hsv),
              size: 3
            },
           'sphereVertices': {
              value: new Float32Array(histogram.sphereVertices),
              size: 3
            },
            'sphereNormals': {
              value: new Float32Array(histogram.sphereNormals),
              size: 3
            },
            'indices': {
              bufferType: gl.ELEMENT_ARRAY_BUFFER,
              drawType: gl.STATIC_DRAW,
              value: new Uint16Array(histogram.indices),
              size: 1
            }
          });

          //Set initial rotation
          histogramModel.rotation.set(-Math.PI / 4, theta, 0.3);
          histogramModel.update();

          //Create animation object for transitioning color schemes.
          var fx = new Fx({
            transition: Fx.Transition.Quart.easeInOut,
            duration: 1500,
            onCompute: function(delta) {
              var from = fx.opt.from,
                  to = fx.opt.to;
              program.setUniforms({
                'from': from,
                'to': to,
                'delta': delta
              });
            },
            onComplete: function() { 
              var to = fx.opt.to;
              program.setUniforms({
                'from': to,
                'to': to,
                'delta': 0
              });
              currentIndex = to;
            }
          });

          var fxSize = new Fx({
            transition: Fx.Transition.Quart.easeInOut,
            duration: 1000,
            onCompute: function(delta) {
              var from = fxSize.opt.from,
                  to = fxSize.opt.to;
              
              sizeValue = Fx.compute(from, to, delta);
            },
            onComplete: function() { 
              sizeValue = fxSize.opt.to;
            }
          });

          loop();
          
          function loop() { 
            //update animation options
            fx.step();
            fxSize.step();
            program.setUniform('size', sizeValue);
            if (played) {
              if (movie.paused || movie.ended) {
                program.setBuffer('histogram');
              } else {
                program.setBuffer('histogram', {
                  value: new Float32Array(createColorArray(movie)),
                  size: 1
                });
              }
            }
            
            if (!app.dragging) {
              theta += 0.007;
              histogramModel.rotation.set(-Math.PI / 4, theta, 0.3);
              histogramModel.update();
            }
            
            gl.clearColor(color, color, color, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            scene.render();
            Fx.requestAnimationFrame(loop);
          }
        }
      });
    }
  };
})();

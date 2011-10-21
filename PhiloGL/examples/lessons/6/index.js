function webGLStart() {
  var xRot = 0, xSpeed = 0,
      yRot = 0, ySpeed = 0,
      z = -5.0,
      filter = 0,
      filters = ['nearest', 'linear', 'mipmap'];

  //Create object
  var cube = new PhiloGL.O3D.Model({
    vertices: [-1, -1,  1,
                1, -1,  1,
                1,  1,  1,
               -1,  1,  1,

               -1, -1, -1,
               -1,  1, -1,
                1,  1, -1,
                1, -1, -1,

               -1,  1, -1,
               -1,  1,  1,
                1,  1,  1,
                1,  1, -1,

               -1, -1, -1,
                1, -1, -1,
                1, -1,  1,
               -1, -1,  1,

                1, -1, -1,
                1,  1, -1,
                1,  1,  1,
                1, -1,  1,

               -1, -1, -1,
               -1, -1,  1,
               -1,  1,  1,
               -1,  1, -1],

    texCoords: [
            // Front face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            // Back face
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,

            // Top face
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,

            // Bottom face
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,

            // Right face
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,

            // Left face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
    ],

    indices: [0, 1, 2, 0, 2, 3,
              4, 5, 6, 4, 6, 7,
              8, 9, 10, 8, 10, 11,
              12, 13, 14, 12, 14, 15,
              16, 17, 18, 16, 18, 19,
              20, 21, 22, 20, 22, 23]
  });

  PhiloGL('lesson06-canvas', {
    program: {
      from: 'ids',
      vs: 'shader-vs',
      fs: 'shader-fs'
    },
    events: {
      onKeyDown: function(e) {
        switch(e.key) {
          case 'f':
            filter = (filter + 1) % 3;
            break;
          case 'up':
            xSpeed -= 0.02;
            break;
          case 'down':
            xSpeed += 0.02;
            break;
          case 'left':
            ySpeed -= 0.02;
            break;
          case 'right':
            ySpeed += 0.02;
            break;
          //handle page up/down
          default:
            if (e.code == 33) {
              z -= 0.05;
            } else if (e.code == 34) {
              z += 0.05;
            }
        }
      }
    },
    onError: function() {
      alert("An error ocurred while loading the application");
    },
    onLoad: function(app) {
      var gl = app.gl,
          canvas = app.canvas,
          program = app.program,
          camera = app.camera,
          view = new PhiloGL.Mat4,
          rCube = 0;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clearDepth(1);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      
      camera.view.id();

      //set buffers with cube data
      program.setBuffers({
        'aVertexPosition': {
          value: cube.vertices,
          size: 3
        },
        'aTextureCoord': {
          value: cube.texCoords,
          size: 2
        },
        'indices': {
          value: cube.indices,
          bufferType: gl.ELEMENT_ARRAY_BUFFER,
          size: 1
        }
      });
      
      //load textures from image
      var img = new Image();
      img.onload = function() {
        program.setTextures({
          'nearest': {
            data: {
              value: img
            }
          },

          'linear': {
            data: {
              value: img
            },
            parameters: [{
              name: gl.TEXTURE_MAG_FILTER,
              value: gl.LINEAR
            }, {
              name: gl.TEXTURE_MIN_FILTER,
              value: gl.LINEAR
            }]
          },

          'mipmap': {
            data: {
              value: img
            },
            parameters: [{
              name: gl.TEXTURE_MAG_FILTER,
              value: gl.LINEAR
            }, {
              name: gl.TEXTURE_MIN_FILTER,
              value: gl.LINEAR_MIPMAP_NEAREST,
              generateMipmap: true
            }]
          }
        });
        
        function animate() {
          xRot += xSpeed;
          yRot += ySpeed;
        }

        function tick() {
          drawScene();
          animate();
          PhiloGL.Fx.requestAnimationFrame(tick);
        }

        function drawScene() {
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          //draw Cube
          cube.position.set(0, 0, z);
          cube.rotation.set(xRot, yRot, 0);
          //update element matrix
          cube.update();
          //get new view matrix out of element and camera matrices
          view.mulMat42(camera.view, cube.matrix);
          //set attributes, indices and textures
          program.setBuffer('aVertexPosition')
                .setBuffer('aTextureCoord')
                .setBuffer('indices')
                .setTexture(filters[filter]);
          //set uniforms
          program.setUniform('uMVMatrix', view)
                .setUniform('uPMatrix', camera.projection)
                .setUniform('uSampler', 0);
          //draw triangles
          gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
        }
        tick();
      };
      //load image
      img.src = 'crate.gif';
    }  
  });
}


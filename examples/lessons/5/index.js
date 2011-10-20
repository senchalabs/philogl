function webGLStart() {
  //Create object
  var cube = new PhiloGL.O3D.Model({
    texture: 'nehe.gif',

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

  PhiloGL('lesson05-canvas', {
    program: {
      from: 'ids',
      vs: 'shader-vs',
      fs: 'shader-fs'
    },
    textures: {
      src: ['nehe.gif']
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
      
      function drawScene() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //draw Cube
        rCube += 0.01;
        cube.position.set(0, 0, -8);
        cube.rotation.set(rCube, rCube, rCube);
        //update element matrix
        cube.update();
        //get new view matrix out of element and camera matrices
        view.mulMat42(camera.view, cube.matrix);
        //set attributes, indices and textures
        program.setBuffer('aVertexPosition')
               .setBuffer('aTextureCoord')
               .setBuffer('indices')
               .setTexture('nehe.gif');
        //set uniforms
        program.setUniform('uMVMatrix', view)
               .setUniform('uPMatrix', camera.projection)
               .setUniform('uSampler', 0);
        //draw triangles
        gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
        //request new frame
        PhiloGL.Fx.requestAnimationFrame(drawScene);
      }
      
      drawScene();
    
    }
   
  });
}






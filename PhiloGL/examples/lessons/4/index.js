function webGLStart() {
  //Load models
  var pyramid = new PhiloGL.O3D.Model({
    vertices: [ 0,  1,  0,
               -1, -1,  1,
                1, -1,  1,
                0,  1,  0,
                1, -1,  1,
                1, -1, -1,
                0,  1,  0,
                1, -1, -1,
               -1, -1, -1,
                0,  1,  0,
               -1, -1, -1,
               -1, -1,  1],
    
    colors: [1, 0, 0, 1,
             0, 1, 0, 1,
             0, 0, 1, 1,
             1, 0, 0, 1,
             0, 0, 1, 1,
             0, 1, 0, 1,
             1, 0, 0, 1,
             0, 1, 0, 1,
             0, 0, 1, 1,
             1, 0, 0, 1,
             0, 0, 1, 1,
             0, 1, 0, 1]
  });

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

    colors: [1, 0, 0, 1, 
             1, 0, 0, 1,
             1, 0, 0, 1,
             1, 0, 0, 1,
             1, 1, 0, 1, 
             1, 1, 0, 1, 
             1, 1, 0, 1, 
             1, 1, 0, 1, 
             0, 1, 0, 1, 
             0, 1, 0, 1, 
             0, 1, 0, 1, 
             0, 1, 0, 1, 
             1, 0.5, 0.5, 1, 
             1, 0.5, 0.5, 1, 
             1, 0.5, 0.5, 1, 
             1, 0.5, 0.5, 1, 
             1, 0, 1, 1, 
             1, 0, 1, 1, 
             1, 0, 1, 1, 
             1, 0, 1, 1, 
             0, 0, 1, 1,
             0, 0, 1, 1,
             0, 0, 1, 1,
             0, 0, 1, 1],

    indices: [0, 1, 2, 0, 2, 3,
              4, 5, 6, 4, 6, 7,
              8, 9, 10, 8, 10, 11,
              12, 13, 14, 12, 14, 15,
              16, 17, 18, 16, 18, 19,
              20, 21, 22, 20, 22, 23]
  });

  PhiloGL('lesson04-canvas', {
    program: {
      from: 'ids',
      vs: 'shader-vs',
      fs: 'shader-fs'
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
          rPyramid = 0, rCube = 0;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clearDepth(1);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      
      camera.view.id();
  
      function setupElement(elem) {
        //update element matrix
        elem.update();
        //get new view matrix out of element and camera matrices
        view.mulMat42(camera.view, elem.matrix);
        //set buffers with element data
        program.setBuffers({
          'aVertexPosition': {
            value: elem.vertices,
            size: 3
          },
          'aVertexColor': {
            value: elem.colors,
            size: 4
          }
        });
        //set uniforms
        program.setUniform('uMVMatrix', view);
        program.setUniform('uPMatrix', camera.projection);
      }

      function animate() {
        rPyramid += 0.01;
        rCube += 0.01;
      }

      function tick() {
        drawScene();
        animate();
        PhiloGL.Fx.requestAnimationFrame(tick);
      }

      function drawScene() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        //Draw Pyramid
        pyramid.position.set(-1.5, 0, -8);
        pyramid.rotation.set(0, rPyramid, 0);
        setupElement(pyramid);
        gl.drawArrays(gl.TRIANGLES, 0, pyramid.vertices.length / 3);
        
        //Draw Cube
        cube.position.set(1.5, 0, -8);
        cube.rotation.set(rCube, rCube, rCube);
        setupElement(cube);
        program.setBuffer('indices', {
          value: cube.indices,
          bufferType: gl.ELEMENT_ARRAY_BUFFER,
          size: 1
        });
        gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
      }
      
      tick();
    } 
  });
  
}




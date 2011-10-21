function webGLStart() {
  //Load models
  var triangle = new PhiloGL.O3D.Model({
    vertices: [ 0,  1, 0,
               -1, -1, 0,
                1, -1, 0],

    colors: [1, 0, 0, 1,
             0, 1, 0, 1,
             0, 0, 1, 1]
  });

  var square = new PhiloGL.O3D.Model({
    vertices: [ 1,  1, 0,
               -1,  1, 0,
                1, -1, 0,
               -1, -1, 0],

    colors: [0.5, 0.5, 1, 1,
             0.5, 0.5, 1, 1,
             0.5, 0.5, 1, 1,
             0.5, 0.5, 1, 1]
  });

  //Create App
  PhiloGL('lesson03-canvas', {
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
          rTri = 0, rSquare = 0;

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
        rTri += 0.01;
        rSquare += 0.1;
      }

      function tick() {
        drawScene();
        animate();
        PhiloGL.Fx.requestAnimationFrame(tick);
      }

      function drawScene() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        //Draw triangle
        triangle.position.set(-1.5, 0, -7);
        triangle.rotation.set(0, rTri, 0);
        setupElement(triangle);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        
        //Draw Square
        square.position.set(1.5, 0, -7);
        square.rotation.set(rSquare, 0, 0);
        setupElement(square);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      
      tick();
    }
  });
  
}



function webGLStart() {
  PhiloGL('lesson02-canvas', {
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
          camera = app.camera;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clearDepth(1);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
    
      program.setBuffers({
        'triangle': {
          attribute: 'aVertexPosition',
          value: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]),
          size: 3
        },

        'triangleColors': {
          attribute: 'aVertexColor',
          value: new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1]),
          size: 4
        },
        
        'square': {
          attribute: 'aVertexPosition',
          value: new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0]),
          size: 3
        },

        'squareColors': {
          attribute: 'aVertexColor',
          value: new Float32Array([0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1]),
          size: 4
        }
      });
      
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      camera.view.id();
      //Draw Triangle
      camera.view.$translate(-1.5, 0, -7);
      program.setUniform('uMVMatrix', camera.view);
      program.setUniform('uPMatrix', camera.projection);
      program.setBuffer('triangle');
      program.setBuffer('triangleColors');
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      
      //Draw Square
      camera.view.$translate(3, 0, 0);
      program.setUniform('uMVMatrix', camera.view);
      program.setUniform('uPMatrix', camera.projection);
      program.setBuffer('square');
      program.setBuffer('squareColors');
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  });
}




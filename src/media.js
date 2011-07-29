//media.js
//media has utility functions for image, video and audio manipulation (and
//maybe others like device, etc).
(function() {
  var Media = {};

  var Image = function() {};
  //post process an image by setting it to a texture with a specified fragment
  //and vertex shader.
  Image.postProcess = function(opt) {
    var program = app.program[opt.program],
        textures = Array.isArray(opt.fromTexture) ? opt.fromTexture : [opt.fromTexture],
        framebuffer = opt.toFrameBuffer,
        screen = !!opt.toScreen,
        width = opt.width || app.canvas.width,
        height = opt.height || app.canvas.height,
        plane = new PhiloGL.O3D.Plane({
          type: 'x,y',
          xlen: 1,
          ylen: 1,
          offset: 0,
          textures: textures,
          program: opt.program
        }),
        camera = new PhiloGL.Camera(45, 1, 0.1, 100, {
          position: { x: 0, y: 0, z: 1 }
        }),
        scene = new PhiloGL.Scene(program, camera);

    camera.update();

    if (framebuffer) {
      //create framebuffer
      if (!(framebuffer in app.frameBufferMemo)) {
        app.setFrameBuffer(framebuffer, {
          width: width,
          height: height,
          bindToTexture: {
            parameters: [{
              name: 'TEXTURE_MAG_FILTER',
              value: 'LINEAR'
            }, {
              name: 'TEXTURE_MIN_FILTER',
              value: 'LINEAR',
              generateMipmap: false
            }]
          },
          bindToRenderBuffer: true
        });
      }
      program.use();
      app.setFrameBuffer(framebuffer, true);
      gl.viewport(0, 0, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      scene.add(plane);
      program.setUniforms(opt.uniforms || {});
      scene.renderToTexture(framebuffer);
      app.setFrameBuffer(framebuffer, false);
    } else if (screen) {
      program.use();
      gl.viewport(0, 0, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      scene.add(plane);
      program.setUniforms(opt.uniforms || {});
      scene.render();
    }

    return this;
  };

  Media.Image = Image;
  PhiloGL.Media = Media;
})();

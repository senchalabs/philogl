PhiloGL.unpack();

var $ = function(d) { return document.getElementById(d); };

var groups = ['p1', 'p2', 'pm', 'pg' /*other groups here*/],
    currentGroup = 0;


function load() {

  if (!PhiloGL.hasWebGL()) {
    alert("Your browser does not support WebGL");
    return;
  }

  PhiloGL('surface', {
    program: [{
      id: 'surface',
      uris: './',
      vs: 'surface.vs.glsl',
      fs: 'surface.fs.glsl',
      noCache: true
    }],
    onError: function(e) {
      console.log(e);
    },
    onLoad: function(app) {
      draw();

      function draw() {
        // advance
        Media.Image.postProcess({
          width: viewX,
          height: viewY,
          toScreen: true,
          aspectRatio: 1,
          program: 'surface',
          uniforms: {
            group: currentGroup,
            offset: offset,
            rotation: 0,
            scale: 1
          }
        });

        Fx.requestAnimationFrame(draw);
      }
    }
  });
}



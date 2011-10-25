PhiloGL.unpack();
var time;
var t;
var mouseX = 0.5;
var mouseY = 0.5;
var viewX = 600;
var viewY = 600;
var c;

function load() {
  if (!PhiloGL.hasWebGL()) {
    alert("Your browser does not support WebGL");
    return;
  }

  PhiloGL('c', {
    program: [{
      id: 'quasip',
      from: 'ids',
      vs: 'shader-vs',
      fs: 'shader-fs'
    }],
    onError: function(e) {
      console.log(e);
    },
    onLoad: function(app) {
      time = Date.now();
      
      draw();

      function draw() {
        t = ((Date.now() - time) / 600) % (Math.PI * 2);

        // advance
        Media.Image.postProcess({
          width: viewX,
          height: viewY,
          toScreen: true,
          program: 'quasip',
          uniforms: {
            t: t
          }
        });

        Fx.requestAnimationFrame(draw);
      }
    }
  });
}


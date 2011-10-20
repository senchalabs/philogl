PhiloGL.unpack();

var browserSize;
var halted = false;
var it = 1;
var time;
var mouseX = 0.5;
var mouseY = 0.5;
var animation;
var timer;
var sizeX = 512;
var sizeY = 512;
var viewX = 900;
var viewY = 550;
var c;

function load() {
  if (!PhiloGL.hasWebGL()) {
    alert("Your browser does not support WebGL");
    return;
  }

  PhiloGL('c', {
    program: [{
      id: 'advance',
      from: 'ids',
      vs: 'shader-vs',
      fs: 'shader-fs-advance'
    }, {
      id: 'composite',
      from: 'ids',
      vs: 'shader-vs',
      fs: 'shader-fs-composite'
    }],
    events: {
      centerOrigin: false,
      onMouseMove: function(e) {
        mouseX = e.x / viewX;
        mouseY = 1 - e.y / viewY;
      },
      onClick: function(e) {
        halted = !halted;
      }
    },
    onError: function() {
      alert('There was an error, sorry :S');
    },
    onLoad: function(app) {
      //Set framebuffers
      var fboOpt = {
        width: sizeX,
        height: sizeY,
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
        bindToRenderBuffer: false
      };

      app.setFrameBuffer('main', fboOpt)
         .setFrameBuffer('main2', fboOpt);
		
      timer = setInterval(fr, 500);
      time = Date.now();
      animation = "animate";
      anim();
      
      function draw() {
        // advance
        if (it > 0) {
          Media.Image.postProcess({
            width: sizeX,
            height: sizeY,
            fromTexture: 'main-texture',
            toFrameBuffer: 'main2',
            program: 'advance',
            uniforms: getUniforms()
          }).postProcess({
            width: viewX,
            height: viewY,
            fromTexture: 'main2-texture',
            toScreen: true,
            program: 'composite',
            uniforms: getUniforms()
          });
        } else {
          Media.Image.postProcess({
            width: sizeX,
            height: sizeY,
            fromTexture: 'main2-texture',
            toFrameBuffer: 'main',
            program: 'advance',
            uniforms: getUniforms()
          }).postProcess({
            width: viewX,
            height: viewY,
            fromTexture: 'main-texture',
            toScreen: true,
            program: 'composite',
            uniforms: getUniforms()
          });
        }
        it = -it;
      }
      
      function getUniforms() {
        return {
          'time': time,
          'mouse': [mouseX, mouseY]
        };
      }

      function anim() {
        if (!halted) {
          draw();
        }
        switch (animation) {
        case "animate":
          setTimeout(function() { Fx.requestAnimationFrame(anim); }, 1);
          break;
        case "reset":
          load();
          break;
        }
      }
      
      function fr() {
        var ti = Date.now();
        time = ti;
      }
    }
  });
}



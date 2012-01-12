PhiloGL.unpack();

var $ = function(d) { return document.getElementById(d); };

var groups = ['p1', 'p2', 'pm', 'pg', 'cm', 'pmm', 'pmg', 'pgg' /*other groups here*/],
    currentGroup = groups[7],
    currentGroupIndex = groups.indexOf(currentGroup),
    offset = 20,
    width = 128,
    height = 128;

function load() {

  if (!PhiloGL.hasWebGL()) {
    alert("Your browser does not support WebGL");
    return;
  }

  PhiloGL('surface', {
    program: [{
      id: 'surface',
      from: 'uris',
      vs: 'surface.vs.glsl',
      fs: 'surface.fs.glsl',
      noCache: true
    }],
    onError: function(e) {
      console.log(e, e.message);
    },
    onLoad: function(app) {
      var glCanvas = app.canvas,
          drawCanvas = $('canvas'),
          ctx = drawCanvas.getContext('2d');

      makeClipping(ctx);
      renderToCanvas(ctx);

      draw();

      function draw() {
        glCanvas.width = window.innerWidth;
        glCanvas.height = window.innerHeight;

        app.setTexture('pattern', {
          data: {
            value: drawCanvas
          }
        });
  
          // advance
        Media.Image.postProcess({
          width: glCanvas.width,
          height: glCanvas.height,
          toScreen: true,
          aspectRatio: 1,
          program: 'surface',
          fromTexture: 'pattern',
          uniforms: {
            group: currentGroupIndex,
            offset: offset,
            rotation: 0,
            scaling: [2, 2],
            resolution: [glCanvas.width, glCanvas.height],
            radialFactor: 0.1
          }
        });

        Fx.requestAnimationFrame(draw);
      }
    }
  });
}

function renderToCanvas(ctx) {
  var l = 128,
      step = 20;

  for (var i = 0; i < l; i += step) {
    for (var j = 0; j < l; j += step) {
      ctx.save();
      ctx.translate(i, j);
      ctx.rotate(i  + j);
      ctx.fillStyle = 'rgb(' + [(i / l * 255) >> 0, (j / l * 255) >> 0, (i / l * 255) >> 0].join(',') + ')';
      if ((i / step) % 2) {
        ctx.fillRect(0, 0, 20, 20);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2, false);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

function makeClipping(ctx) {

  switch (currentGroup) {
    case 'p1':
    case 'p2':
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width - offset, height);
      ctx.lineTo(0, height);
      ctx.lineTo(offset, 0);
      ctx.clip();
      break;

    case 'pm':
    case 'pg':
    case 'pmm':
    case 'pmg':
      ctx.beginPath();
      ctx.moveTo(0, offset);
      ctx.lineTo(width, offset);
      ctx.lineTo(width, height - offset);
      ctx.lineTo(0, height - offset);
      ctx.lineTo(0, offset);
      ctx.clip();
      break;

    case 'cm':
    case 'pgg':
      ctx.beginPath();
      ctx.moveTo(0, offset);
      ctx.lineTo(width / 2, height - offset);
      ctx.lineTo(width, offset);
      ctx.lineTo(0, offset);
      ctx.clip();
      break;
  }
}



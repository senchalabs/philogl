PhiloGL.unpack();

var groups = ['p1', 'p2', 'pm', 'pg', 'cm', 'pmm', 'pmg', 'pgg', 'cmm', 'p4', 'p4m', 'p4g', 'p3', 'p3m1', 'p31m', 'p6', 'p6m'],
    width = 128,
    height = 128,
    cos = Math.cos,
    sin = Math.sin,
    PI = Math.PI,
    descriptions;

var options = {
  currentGroupIndex: 0,
  scale: 1,
  rotate: 0,
  radialFactor: 0.1,
  offset: 20,
  hyperbole: 0
};

function load() {

  if (!PhiloGL.hasWebGL()) {
    alert("Your browser does not support WebGL");
    return;
  }

  initControls(options);

  PhiloGL('surface', {
    program: [{
      id: 'surface',
      from: 'uris',
      vs: 'surface.vs.glsl',
      fs: 'surface.fs.glsl',
      noCache: true
    }],
    events: {
      onMouseWheel: function(e) {
        e.stop();
        options.scale += e.wheel / (10 * (window.opera ? 50 : 1));
        if (options.scale < 1) {
          options.scale = 1;
        }
        if (options.scale > 10) {
          options.scale = 10;
        }
      }
    },
    onError: function(e) {
      console.log(e, e.message);
    },
    onLoad: function(app) {
      var gl = app.gl,
          glCanvas = app.canvas,
          drawCanvas = $('canvas'),
          ctx = drawCanvas.getContext('2d');
      
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.enable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      
      draw();

      function draw() {
        ctx.save();
        makeClipping(ctx, drawCanvas);
        renderToCanvas(ctx, drawCanvas);
        ctx.restore();
        
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
            group: options.currentGroupIndex,
            offset: options.offset,
            rotation: options.rotate,
            scaling: [options.scale, options.scale],
            resolution: [glCanvas.width, glCanvas.height],
            radialFactor: options.radialFactor,
            hyperbolic: options.hyperbole
          }
        });

        Fx.requestAnimationFrame(draw);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        // app.setTexture('pattern', false);
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

// function renderToCanvas(ctx) {
//   ctx.fillRect(0, 0, width, height);
// }

function makeClipping(ctx, canvas) {
  canvas.width = canvas.width;

  switch (groups[options.currentGroupIndex]) {
    case 'p1':
    case 'p2':
      ctx.beginPath();
      ctx.moveTo(options.offset, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width - options.offset, height);
      ctx.lineTo(0, height);
      ctx.lineTo(options.offset, 0);
      ctx.clip();
      break;

    case 'pm':
    case 'pg':
    case 'pmm':
    case 'pmg':
      ctx.beginPath();
      ctx.moveTo(0, options.offset);
      ctx.lineTo(width, options.offset);
      ctx.lineTo(width, height - options.offset);
      ctx.lineTo(0, height - options.offset);
      ctx.lineTo(0, options.offset);
      ctx.clip();
      break;

    case 'cm':
    case 'pgg':
      ctx.beginPath();
      ctx.moveTo(0, options.offset);
      ctx.lineTo(width / 2, height - options.offset);
      ctx.lineTo(width, options.offset);
      ctx.lineTo(0, options.offset);
      ctx.clip();
      break;

    case 'cmm':
      ctx.beginPath();
      ctx.moveTo(0, options.offset);
      ctx.lineTo(width, options.offset);
      ctx.lineTo(width, height - options.offset);
      ctx.lineTo(0, options.offset);
      ctx.clip();
      break;

    //square based.
    case 'p4':
      break;

    //square based.
    case 'p4m':
      ctx.beginPath();
      ctx.moveTo(width, 0);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.lineTo(width, 0);
      ctx.clip();
      break;
    
    //square based.
    case 'p4g':
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width, height);
      ctx.lineTo(0, 0);
      ctx.clip();
      break;
      
    //equilateral triangle based.
    case 'p3':
      var h = height * 2 / 3,
          w = cos(PI / 6) * h,
          offsetWidth = width - w,
          offsetWidthDiv2 = offsetWidth / 2;

      ctx.beginPath();
      ctx.moveTo(offsetWidthDiv2, 0);
      ctx.lineTo(offsetWidthDiv2, h);
      ctx.lineTo(offsetWidthDiv2 + w, h + sin(PI / 6) * h );
      ctx.lineTo(offsetWidthDiv2 + w, height / 3 );
      ctx.lineTo(offsetWidthDiv2, 0);
      ctx.clip();
      break;

    case 'p3m1':
      var len = cos(PI / 6) * height,
          offset = (width - len) / 2;

      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset, height);
      ctx.lineTo(offset + len, height / 2);
      ctx.lineTo(offset, 0);
      ctx.clip();
      break;

    case 'p31m': case 'p6':
      var h = (sin(PI / 3) * width) / 3,
          offset = (height - h) / 2;

      ctx.beginPath();
      ctx.moveTo(0, offset + h);
      ctx.lineTo(width, offset + h);
      ctx.lineTo(width / 2, offset);
      ctx.lineTo(0, offset + h);
      ctx.clip();
      break;
    
    case 'p6m':
      var h = (sin(PI / 3) * width) / 3 * 2,
          offset = (height - h) / 2;

      ctx.beginPath();
      ctx.moveTo(0, offset + h);
      ctx.lineTo(width, offset + h);
      ctx.lineTo(width, offset);
      ctx.lineTo(0, offset + h);
      ctx.clip();
      break;
  }
}



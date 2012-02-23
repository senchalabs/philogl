function webGLStart() {
  var numSites = 1, sites = [0, 0, 1], siteColors = [0.5, 0.5, 0.7],
      width = 800, height = 600, R = 200, vs = [], weight = [1], fullscreen = false,
      dragStart = [], matStart = null, mat = new PhiloGL.Mat4(), imat = mat.clone(), weighted = false;
  mat.id();
  imat.id();
  function toggleFullscreen() {
    document.body.classList.toggle('fullscreen');
    resize();
  }

  window.toggleFullscreen = toggleFullscreen;
  function resize() {
    var canvas = document.getElementById('voronoi'),
        style = window.getComputedStyle(canvas);
    height = parseFloat(style.getPropertyValue('height'));
    canvas.height = height;
    width = parseFloat(style.getPropertyValue('width'));
    canvas.width = width;
  }

  window.addEventListener('resize', resize);
  resize();

  function calcXYZ(e) {
    console.log(e.x, e.y);
    var x = e.x / R,
        y = e.y / R,
        z = 1.0 - x * x - y * y;

    if (z < 0) {
      while (z < 0) {
        x *= Math.exp(z);
        y *= Math.exp(z);
        z = 1.0 - x * x - y * y;
      }
      z = -Math.sqrt(z);
    } else {
      z = Math.sqrt(z);
    }
    var v3 = new PhiloGL.Vec3(x, y, z, 1);
    imat.$mulVec3(v3);
    return v3;
  }

  PhiloGL('voronoi', {
    program:{
      from:'uris',
      vs:'sph-shader.vs.glsl',
      fs:'sph-shader.fs.glsl'
    },
    onError:function (e) {
      alert(e);
    },
    events:{
      onDragStart:function (e) {
        matStart = mat.clone();
        dragStart = [e.x, e.y];
      },
      onMouseWheel:function (e) {
        var id = new PhiloGL.Mat4();
        id.id();
        id.$rotateAxis((e.event.wheelDeltaX) / 5 / R, [0, 1, 0])
            .$rotateAxis((e.event.wheelDeltaY) / 5 / R, [1, 0, 0]);
        mat = id.mulMat4(mat);
        imat = mat.invert();
        var v3 = calcXYZ(e);
        sites[0] = v3[0];
        sites[1] = v3[1];
        sites[2] = v3[2];
        e.event.preventDefault();
        e.event.stopPropagation();
      },
      onDragMove:function (e) {
        var id = new PhiloGL.Mat4();
        id.id();
        id.$rotateAxis((e.x - dragStart[0]) / R, [0, 1, 0])
            .$rotateAxis((e.y - dragStart[1]) / R, [-1, 0, 0]);
        mat = id.mulMat4(matStart);
        imat = mat.invert();
        var v3 = calcXYZ(e);
        sites[0] = v3[0];
        sites[1] = v3[1];
        sites[2] = v3[2];
      },
      onDragEnd:function (e) {
        var id = new PhiloGL.Mat4();
        id.id();
        id.$rotateAxis((e.x - dragStart[0]) / R, [0, 1, 0])
            .$rotateAxis((e.y - dragStart[1]) / R, [-1, 0, 0]);
        mat = id.mulMat4(matStart);
        imat = mat.invert();
        var v3 = calcXYZ(e);
        sites[0] = v3[0];
        sites[1] = v3[1];
        sites[2] = v3[2];
      },
      onMouseMove:function (e) {
        var v3 = calcXYZ(e);
        sites[0] = v3[0];
        sites[1] = v3[1];
        sites[2] = v3[2];
      },
      onClick:function (e) {
        var v3 = calcXYZ(e);
        sites.push(v3[0], v3[1], v3[2]);
        siteColors.push(Math.random(), Math.random(), Math.random());
        weight.push(Math.random() * 2 + 1);
        numSites++;
      }
    },
    onLoad:function (app) {
      var gl = app.gl,
          canvas = app.canvas,
          program = app.program,
          camera = app.camera;

      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      program.setBuffers({
        'square':{
          attribute:'aVertexPosition',
          value:new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]),
          size:2
        }
      });

      function update() {
        draw();
        PhiloGL.Fx.requestAnimationFrame(update);
      }

      function draw() {
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        program.setUniform('numberSites', numSites);
        program.setUniform('sites', sites);
        program.setUniform('ws', weight);
        program.setUniform('siteColors', siteColors);
        program.setUniform('p', 2);
        program.setUniform('modelMat', mat);
        program.setUniform('weighted', weighted);
        program.setUniform('width', width);
        program.setUniform('height', height);
        program.setBuffer('square');
        program.setBuffer('squareColors');
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      update();
    }
  });
}

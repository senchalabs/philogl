PhiloGL.unpack();

var $ = function(d) { return document.getElementById(d); };
    

window.addEventListener('DOMContentLoaded', init, false);

function init() {
  var models = {},
      data   = {},
      tooltip = $('tooltip');

  //Create application
  PhiloGL('map', {
    program: [{
      id: 'elevation',
      from: 'uris',
      path: './shaders/',
      vs: 'elevation.vs.glsl',
      fs: 'elevation.fs.glsl',
      noCache: true
    }, {
      id: 'markers',
      from: 'uris',
      path: './shaders/',
      vs: 'markers.vs.glsl',
      fs: 'markers.fs.glsl',
      noCache: true
    }],
    camera: {
      position: {
        x: 0, y: 0, z: 0.65
      }
    },
    scene: {
      renderPickingScene: function(opt) {
        var o3dList = opt.o3dList,
            stations = models.markers,
            map = models.map;

        o3dList.push(stations);
        stations.uniforms.picking = true;
        map.uniforms.picking = true;
        //render to texture
        this.renderToTexture('$picking');
        //reset picking
        stations.uniforms.picking = false;
        map.uniforms.picking = false;
      }
    },
    textures: {
      src: ['img/elevation_3764_2048_post.jpg',
            'img/elevation_3764_2048_gs.jpg'],
      parameters: [{
        name: 'TEXTURE_MAG_FILTER',
        value: 'LINEAR'
      }, {
        name: 'TEXTURE_MIN_FILTER',
        value: 'LINEAR_MIPMAP_NEAREST',
        generateMipmap: true
      }]
    },
    events: {
      picking: true,
      centerOrigin: false,
      onClick: function(e, model) {
        if (!model) {
          models.markers.selected = -1;
          return;
        }
        model.selected = model.selected == model.$pickingIndex ? -1 : model.$pickingIndex;
      },
      onMouseEnter: function(e, model) {
        if (model) {
          clearTimeout(this.timer);
          var style = tooltip.style,
              record = data.stations[model.$pickingIndex],
              textName = record.name[0] + record.name.slice(1).toLowerCase() + ', ' + record.abbr,
              bbox = this.canvas.getBoundingClientRect();

          style.top = (e.y + 10 + bbox.top) + 'px';
          style.left = (e.x + 5 + bbox.left) + 'px';
          this.tooltip.className = 'tooltip show';
          this.tooltip.innerHTML = textName;
          
          this.timer = setTimeout(function(me) {
            me.tooltip.className = 'tooltip hide';
          }, 1500, this);
        }
      },
      onMouseLeave: function(e, model) {
        this.timer = setTimeout(function(me) {
          me.tooltip.className = 'tooltip hide';
        }, 500, this);
      },
      onDragStart: function(e) {
        this.pos = {
          x: e.x,
          y: e.y
        };
      },
      onDragMove: function(e) {
        var z = this.camera.position.z,
            sign = Math.abs(z) / z,
            pos = this.pos;

        this.scene.models.forEach(function(m) {
          m.rotation.x += (pos.y - e.y) / 100;
          m.update();
        });

        pos.x = e.x;
        pos.y = e.y;
      },
      onMouseWheel: function(e) {
        e.stop();
        var camera = this.camera;
        camera.position.z -= e.wheel / 2;
        camera.update();
      }
    },
    onError: function() {
      console.log('error', arguments);
    },
    onLoad: function(app) {
      //Unpack app properties
      var hour = 0,
          gl = app.gl,
          program = app.program,
          scene = app.scene,
          canvas = app.canvas,
          camera = app.camera;
      app.tooltip = $('tooltip');

      //gather data and create O3D models
      getModels(function(dataAns, modelsAns) {
        data = dataAns;
        models = modelsAns;

        //add listeners and behavior to controls.
        setupControls({
          onSliderChange: function(value) {
            data.currentHour = value || 0;
          }
        });

        //Basic gl setup
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.viewport(0, 0, +canvas.width, +canvas.height);

        scene.add(models.map, models.markers);

        draw();

        //Draw the scene
        function draw() {
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          //render model
          scene.render();
          Fx.requestAnimationFrame(draw);
        }

      });
    }
  });
}

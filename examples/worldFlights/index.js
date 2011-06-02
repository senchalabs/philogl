//Unpack modules
PhiloGL.unpack();

//Get handles when document is ready
document.onreadystatechange = function() {
  if (document.readyState == 'complete') {
    logPanel = $('log-panel');
    logMessage = $('log-message');
    airlineList = $('airline-list');
    flightCanvas = $('flight-canvas');

    airlineManager.setupCanvas(flightCanvas);
  }
};

var Types = {
  SHADOW: 0,
  EARTH: 1
};

//some locals
var $ = function(id) { return document.getElementById(id); },
    $$ = function(selector) { return document.querySelectorAll(selector); },
    citiesWorker = new Worker('cities.js'),
    data = { citiesRoutes: {}, airlinesRoutes: {} },
    models = {},
    logPanel, logMessage, airlineList, flightCanvas, pos;

//Create earth
models.earth = new O3D.Sphere({
  nlat: 50,
  nlong: 50,
  radius: 1,
  shininess: 32,
  textures: ['img/earth1.jpg', 'img/clouds.jpg'],
  program: 'earth'
});

//Create cities layer model and create PhiloGL app.
citiesWorker.onmessage = function(e) {
  var modelInfo = e.data;
  data.citiesIndex = modelInfo.citiesIndex;
  models.cities = new O3D.Model(modelInfo);
  createApp();
};

//Request cities data
new IO.XHR({
  url: 'data/cities.json',
  onSuccess: function(json) {
    data.cities = JSON.parse(json);
    citiesWorker.postMessage(data.cities);
  },
  onError: function() {
    logMessage.innerHTML = 'There was an error while fetching cities data.';
  }
}).send();

//Request airline data
new IO.XHR({
  url: 'data/airlines.json',
  onSuccess: function(json) {
    var airlines = data.airlines = JSON.parse(json),
        html = [];
    //assuming the data will be available after the document is ready...
    for (var i = 0, l = airlines.length; i < l; i++) {
      var airlineName = airlines[i][0];
      html.push('<label><input type=\'checkbox\' id=\'checkbox-' + airlineName + '\' /> ' + airlineName + '</label>');
    }
    //append all elements
    airlineList.innerHTML = '<li>' + html.join('</li><li>') + '</li>';
    //when an airline is selected show all paths for that airline
    airlineList.addEventListener('change', function(e) {
      var target = e.target,
          airlineName = target.id.split('-')[1];
      
      function callback() {
        if (target.checked) {
          airlineManager.add(airlineName);
        } else {
          airlineManager.remove(airlineName);
        }
      }

      if (data.airlinesRoutes[airlineName]) {
        callback();
      } else {
        new IO.XHR({
          url: 'data/airline_' + airlineName.replace(' ', '_') + '.json',
          onSuccess: function(json) {
            data.airlinesRoutes[airlineName] = JSON.parse(json);
            callback();
          },
          onError: function() {
            logMessage.innerHTML = 'There was an error while fetching data for airline: ' + airlineName;
          }
        }).send();
      }
    }, false);
  },
  onError: function() {
    logMessage.innerHTML = 'There was an error while fetching airlines data.';
  }
}).send();

//Takes care of adding and removing routes
//for the selected airlines
var airlineManager = {
  width: 1024,
  height: 1024,
  airlines: {},
  canvasUpdated: false,
  lineStyles: {},

  setupCanvas: function(canvas) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = canvas.getContext('2d');
    
    //set canvas styles
    var ctx = this.ctx,
        styles = this.lineStyles;
    for (var name in styles) {
      ctx[name] = styles[name];
    }
  },

  add: function(airline) {
    var routes = data.airlineRoutes[airline],
        airlines = this.airlines,
        width = this.width,
        height = this.height,
        lines = [];
    
    if (airlines[airline]) {
      airlines[airline].active = true;
      lines = airlines[airline].lines;
    } else {
      //create lines from routes
      for (var i = 0, l = routes.length; i < l; i++) {
        var route = routes[i],
            city1 = data.cities[route[0] + '^' + route[1]],
            lat1 = (city1[2] + 90) / 180 * width,
            lon1 = (city1[3] + 90) / 180 * height,
            city2 = data.cities[route[2] + '^' + route[3]],
            lat2 = (city2[2] + 90) / 180 * width,
            lon2 = (city2[3] + 90) / 180 * height;

        lines.push(lat1, lon1, lat2, lon2);
      }
      //add cache
      airlines[airline] = {
        active: true,
        lines: lines
      };
    }
    //draw
    for (i = 0, l = lines.length; i < l; i++) {
      var line = lines[i];
      ctx.moveTo(line[0], line[1]);
      ctx.lineTo(line[2], line[3]);
    }
    this.canvasUpdated = true;
  },
  
  remove: function(airline) {
    var airlines = this.airlines,
        ctx = this.ctx,
        width = this.width,
        height = this.height;

    airlines[airline].active = false;
    ctx.clearRect(0, 0, width, height);
    for (var name in airlines) {
      var airline = airlines[name];
      if (airline.active) {
        var lines = airline.lines;
        for (var i = 0, l = lines.length; i < l; i++) {
          var line = lines[i];
          ctx.moveTo(line[0], line[1]);
          ctx.lineTo(line[2], line[3]);
        }
      }
    }
    this.canvasUpdated = true;
  }
};


function createApp() {
  //Create application
  PhiloGL('map-canvas', {
    program: [{
      id: 'cities',
      from: 'defaults'
    },{
      id: 'earth',
      from: 'uris',
      path: './',
      vs: 'earth.vs.glsl',
      fs: 'earth.fs.glsl',
      noCache: true
    }, {
      id: 'plane',
      from: 'uris',
      path: './',
      vs: 'plane.vs.glsl',
      fs: 'plane.fs.glsl',
      noCache: true
    }],
    camera: {
      position: {
        x: 0, y: 0, z: -5.5
      }
    },
    scene: {
      lights: {
        enable: true,
        ambient: {
          r: 0.4,
          g: 0.4,
          b: 0.4
        },
        points: {
          diffuse: { 
            r: 0.7, 
            g: 0.7, 
            b: 0.7 
          },
          specular: { 
            r: 0.5, 
            g: 0.5, 
            b: 0.8 
          },
          position: { 
            x: 3, 
            y: 3, 
            z: -5 
          }
        }
      }
    },
    events: {
      onDragStart: function(e) {
        pos = {
          x: e.x,
          y: e.y
        };
      },
      onDragMove: function(e) {
        var z = this.camera.position.z,
            sign = Math.abs(z) / z;

        models.earth.rotation.y += -(pos.x - e.x) / 100;
        models.earth.rotation.x += sign * (pos.y - e.y) / 100;
        models.earth.update();

        pos.x = e.x;
        pos.y = e.y;
      },
      onMouseEnter: function(e, model) {
        console.log(arguments);
      },
      onMouseLeave: function(e, model) {
        console.log(arguments);
      },
      onClick: function(e, model) {
        console.log(arguments);
      },
      onMouseWheel: function(e) {
        e.stop();
        var camera = this.camera,
            position = camera.position;
        position.z += e.wheel;
        if (position.z > -6) {
          position.z = -6;
        }
        if (position.z < -13) {
          position.z = -13;
        }
        camera.update();
      }
    },
    textures: {
      src: ['img/earth1.jpg', 'img/clouds.jpg'],
      parameters: [{
        name: 'TEXTURE_MAG_FILTER',
        value: 'LINEAR'
      }, {
        name: 'TEXTURE_MIN_FILTER',
        value: 'LINEAR_MIPMAP_NEAREST',
        generateMipmap: true
      }]
    },
    onError: function() {
      alert("There was an error creating the app.");
    },
    onLoad: function(app) {
      //Unpack app properties
      var gl = app.gl,
          scene = app.scene,
          camera = app.camera,
          canvas = app.canvas,
          width = canvas.width,
          height = canvas.height,
          program = app.program,
          shadowScene = new Scene(program.earth, camera),
          clearOpt = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT,
          theta = 0;
                  
      //Create plane
      models.plane = new O3D.PlaneXZ({
        width: width / 100,
        nwidth: 5,
        height: -2.6,
        depth: height / 100,
        ndepth: 5,
        textures: 'shadow-texture',
        program: 'plane'
      });

      //Create animation object for transitioning temp maps.
      var fx = new Fx({
        transition: Fx.Transition.Cubic.easeInOut,
        duration: 4000,
        onCompute: function(delta) {
          camera.position.z = Fx.compute(this.opt.from, this.opt.to, delta);
          camera.update();
        }
      });

      fx.start({
        from: -2,
        to: -8
      });
     
      gl.viewport(0, 0, width, height);
      gl.clearColor(1, 1, 1, 1);
      gl.clearDepth(1);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
        
      //create framebuffer
      app.setFrameBuffer('shadow', {
        width: width,
        height: height,
        bindToTexture: {
          parameters: [{
            name: 'TEXTURE_MAG_FILTER',
            value: 'LINEAR'
          }, {
            name: 'TEXTURE_MIN_FILTER',
            value: 'LINEAR_MIPMAP_NEAREST',
            generateMipmap: false
          }]
        },
        bindToRenderBuffer: true
      });    

      //Add objects to the scenes
      scene.add(models.earth, 
                models.cities,
                models.plane);

      shadowScene.add(models.earth);
      
      draw();

      function draw() {
        fx.step();
        drawShadow();
        drawEarth();
      }

      function drawShadow() {
        program.earth.use();
        app.setFrameBuffer('shadow', true);
        gl.clear(clearOpt);
        program.earth.setUniform('renderType', Types.SHADOW);
        shadowScene.renderToTexture('shadow');
        app.setFrameBuffer('shadow', false);
      }

      //Draw the scene
      function drawEarth() {
        gl.clear(clearOpt);
        //Update position
        if (!app.dragging && theta == 0) {
          models.earth.rotation.set(Math.PI, 0,  0);
          models.earth.update();
        } 
        theta += 0.0001;
        //render objects
        gl.clear(clearOpt);
        scene.render({
          onBeforeRender: function(elem) {
            var p = program[elem.program];
            if (elem.program == 'earth') {
              p.setUniform('renderType', Types.EARTH);
              p.setUniform('cloudOffset', theta);
              p.setUniform('alphaAngle', 0);
            } else if (elem.program == 'plane') {
              p.setUniform('width', width);
              p.setUniform('height', height);
            }
          }
        });
        //Request Animation Frame
        Fx.requestAnimationFrame(draw);
      }
    }
  });
}



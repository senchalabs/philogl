//Unpack modules
PhiloGL.unpack();

//Get handles when document is ready
document.onreadystatechange = function() {
  if (document.readyState == 'complete') {
    logPanel = $('log-panel');
    logMessage = $('log-message');
    airlineList = $('airline-list');
    $('map-canvas').height = window.innerHeight - 45;
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
    logPanel, logMessage, airlineList, pos;

//Create earth
models.earth = new O3D.Sphere({
  nlat: 50,
  nlong: 50,
  radius: 1,
  shininess: 32,
  textures: ['img/earth-specular.gif'],// 'img/clouds.jpg'],
  program: 'earth'
});

//Create airline routes model
models.airlines = new O3D.Model({
  program: 'layer',
  uniforms: {
    colorUfm: [0.5, 0.5, 0.8, 1]
  },
  render: function(gl, program, camera) {
    if (this.indices && this.indices.length) {
      gl.lineWidth(2);
      gl.drawElements(gl.LINES, this.indices.length, gl.UNSIGNED_SHORT, 0);
      this.dynamic = false;
    }
  }
});

//Create cities layer model and create PhiloGL app.
citiesWorker.onmessage = function(e) {
  var modelInfo = e.data;
  data.citiesIndex = modelInfo.citiesIndex;
  models.cities = new O3D.Model(Object.create(modelInfo, {
    //Add a custom picking method
    pick: {
      value: function(pixel) {
        //calcula the element index in the array by hashing the color values
        if (pixel[0] == 0 && (pixel[1] != 0 || pixel[2] != 0)) {
          var index = pixel[2] + pixel[1] * 256;
          return index;
        }
        return false;
      }
    },

    render: {
      value: function(gl, program, camera) {
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
      }
    }
  }));

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
  airlineNames: [],

  add: function(airline) {
    var airlineNames = this.airlineNames,
        routes = data.airlinesRoutes[airline],
        airlines = models.airlines,
        vertices = airlines.vertices || [],
        indices = airlines.indices || [],
        offset = vertices.length / 3,
        samplings = 50;

    for (var i = 0, l = routes.length; i < l; i++) {
      var ans = this.createRoute(routes[i], i * samplings + offset);
      vertices.push.apply(vertices, ans.vertices);
      indices.push.apply(indices, ans.indices);
    }
    
    airlines.vertices = vertices;
    airlines.indices = indices;
    airlines.dynamic = true;
    airlineNames.push(airline);
  },
  
  remove: function(airline) {
    var airlines = models.airlines,
        routes = data.airlinesRoutes[airline],
        nroutes = routes.length,
        vertices = airlines.vertices,
        indices = airlines.indices,
        airlineNames = this.airlineNames,
        index = airlineNames.indexOf(airline),
        samplings = 50;

    airlineNames.splice(index, 1);
    airlines.vertices.splice(index * samplings * 3, nroutes * samplings * 3);
    airlines.indices.splice(index * (samplings - 1) * 2, nroutes * (samplings - 1) * 2);

    for (var i = index, l = indices.length; i < l; i++) {
      indices[i] -= (samplings * nroutes);
    }
    airlines.dynamic = true;
  },

  createRoute: function(route, offset) {
    var pi = Math.PI,
        pi2 = pi * 2,
        sin = Math.sin,
        cos = Math.cos,
        city1 = data.cities[route[1] + '^' + route[0]],
        city2 = data.cities[route[3] + '^' + route[2]],
        city = [city1[2], city1[3], city2[2], city2[3]],
        theta1 = pi2 - (+city[1] + 180) / 360 * pi2,
        phi1 = pi - (+city[0] + 90) / 180 * pi,
        sinTheta1 = sin(theta1),
        cosTheta1 = cos(theta1),
        sinPhi1 = sin(phi1),
        cosPhi1 = cos(phi1),
        p1 = new Vec3(cosTheta1 * sinPhi1, cosPhi1, sinTheta1 * sinPhi1),
        theta2 = pi2 - (+city[3] + 180) / 360 * pi2,
        phi2 = pi - (+city[2] + 90) / 180 * pi,
        sinTheta2 = sin(theta2),
        cosTheta2 = cos(theta2),
        sinPhi2 = sin(phi2),
        cosPhi2 = cos(phi2),
        p2 = new Vec3(cosTheta2 * sinPhi2, cosPhi2, sinTheta2 * sinPhi2),
        p3 = p2.add(p1).$scale(0.5).$unit().$scale(1.3),
        pArray = [],
        pIndices = [],
        t = 0,
        count = 0,
        samplings = 50,
        deltat = 1 / samplings,
        pt, offset;

    while(samplings--) {
      pt = p1.scale((1 - t) * (1 - t)).$add(p3.scale(2 * (1 - t) * t)).$add(p2.scale(t * t));
      pArray.push(pt.x, pt.y, pt.z);
      if (t != 0) {
        pIndices.push(count, count + 1);
        count++;
      }
      t += deltat;
    }

    return {
      vertices: pArray,
      indices: pIndices.map(function(i) { return i + offset; })
    };
  }
};


function createApp() {
  //Create application
  PhiloGL('map-canvas', {
    program: [{
      id: 'layer',
      from: 'uris',
      path: 'shaders/',
      vs: 'layer.vs.glsl',
      fs: 'layer.fs.glsl',
      noCache: true
    },{
      id: 'earth',
      from: 'uris',
      path: 'shaders/',
      vs: 'earth.vs.glsl',
      fs: 'earth.fs.glsl',
      noCache: true
    }, {
      id: 'plane',
      from: 'uris',
      path: 'shaders/',
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
      picking: true,
      onDragStart: function(e) {
        pos = {
          x: e.x,
          y: e.y,
          acumy: 0
        };
      },
      onDragMove: function(e) {
        var z = this.camera.position.z,
            sign = Math.abs(z) / z,
            earth = models.earth,
            cities = models.cities,
            airlines = models.airlines;

        earth.rotation.y += -(pos.x - e.x) / 100;
        cities.rotation.y += -(pos.x - e.x) / 100;
        airlines.rotation.y += -(pos.x - e.x) / 100;
        earth.update();
        cities.update();
        airlines.update();
        
        pos.x = e.x;
        pos.y = e.y;
      },
      onMouseEnter: function(e, model) {
        if (model) {
          console.log(data.citiesIndex[model.$pickingIndex]);
        }
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
        console.log(position.z);
        if (false && position.z > -6) {
          position.z = -6;
        }
        if (false && position.z < -13) {
          position.z = -13;
        }
        camera.update();
      }
    },
    textures: {
      src: ['img/earth-specular.gif', 'img/clouds.jpg'],
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
       
      gl.clearColor(1, 1, 1, 1);
      gl.clearDepth(1);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      
      //Create plane
      models.plane = new O3D.PlaneXZ({
        width: width / 100,
        nwidth: 5,
        height: -1.8,
        depth: height / 100,
        ndepth: 5,
        textures: 'shadow-texture',
        program: 'plane'
      });

      models.plane.position.set(0, 0, 2);
      models.plane.update();

      //Create animation object for transitioning temp maps.
      var fx = new Fx({
        transition: Fx.Transition.Quart.easeInOut,
        duration: 1500,
        onCompute: function(delta) {
          camera.position.z = Fx.compute(this.opt.from, this.opt.to, delta);
          camera.update();
        }
      });

      fx.start({
        from: -10,
        to: -5.4
      });
     
      //create framebuffer
      app.setFrameBuffer('shadow', {
        width: 1024,
        height: 1024,
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
                models.airlines,
                models.plane);

      shadowScene.add(models.earth);
      
      draw();

      function draw() {
        gl.viewport(0, 0, width, height);
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
          models.cities.rotation.set(0, 0, 0);
          models.cities.update();
          
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



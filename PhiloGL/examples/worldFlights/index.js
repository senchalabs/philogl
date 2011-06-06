//Unpack modules
PhiloGL.unpack();

//Get handles when document is ready
document.onreadystatechange = function() {
  if (document.readyState == 'complete' && PhiloGL.hasWebGL()) {
    logPanel = $('log-panel');
    logMessage = $('log-message');
    airlineList = $('airline-list');
    tooltip = $('tooltip');

    //Add search handler
    $('search').addEventListener('keyup', (function() {
      var timer = null,
          parentNode = airlineList.parentNode,
          lis = airlineList.getElementsByTagName('li'),
          previousText = '';

      function search(value) {
        parentNode.removeChild(airlineList);
        for (var i = 0, l = lis.length; i < l; i++) {
          var li = lis[i],
              text = li.textContent || li.innerText;
          li.style.display = text.trim().toLowerCase().indexOf(value) > -1 ? '' : 'none';
        }
        parentNode.appendChild(airlineList);
      }

      return function(e) {
        timer = clearTimeout(timer);
        var trimmed = this.value.trim();
        if (trimmed != previousText) {
          timer = setTimeout(function() { 
            search(trimmed.toLowerCase()); 
            previousText = trimmed;
          }, 300);
        }
      };

    })(), true);
    
    //load dataset
    loadData();
  }
};

//some locals
var $ = function(id) { return document.getElementById(id); },
    $$ = function(selector) { return document.querySelectorAll(selector); },
    citiesWorker = new Worker('cities.js'),
    data = { citiesRoutes: {}, airlinesRoutes: {} },
    models = {},
    logPanel, logMessage, airlineList, pos, tooltip, mapCanvas;

//Log singleton
var Log = {
  elem: null,
  timer: null,
  
  getElem: function() {
    if (!this.elem) {
      return (this.elem = [$('log-message'), $('loading-text')]);
    }
    return this.elem;
  },
  
  write: function(text, hide) {
    if (this.timer) {
      this.timer = clearTimeout(this.timer);
    }
    
    var elem = this.getElem(),
        style = elem[0].parentNode.style;

    elem[0].innerHTML = text;
    elem[1].innerHTML = text;
    style.display = '';

    if (hide) {
      this.timer = setTimeout(function() {
        style.display = 'none';
      }, 2000);
    }
  }
};

//Create earth
models.earth = new O3D.Sphere({
  nlat: 50,
  nlong: 50,
  radius: 1,
  shininess: 10,
  textures: ['img/earth3-specular.gif'],
  program: 'earth'
});
models.earth.rotation.set(Math.PI - 0.3, 0,  0);
models.earth.update();

//Create airline routes model
models.airlines = new O3D.Model({
  program: 'layer',
  uniforms: {
    colorUfm: [0.3, 0.3, 0.6, 1]
  },
  render: function(gl, program, camera) {
    if (this.indices && this.indices.length) {
      gl.lineWidth(1);
      gl.drawElements(gl.LINES, this.indices.length, gl.UNSIGNED_SHORT, 0);
      this.dynamic = false;
    }
  }
});
models.airlines.rotation.set(-0.3, 0, 0);
models.airlines.update();

//Create cities layer model and create PhiloGL app.
citiesWorker.onmessage = function(e) {
  var modelInfo = e.data;

  if (typeof modelInfo == 'number') {
      Log.write('Building models ' + modelInfo + '%');
  } else {
    data.citiesIndex = modelInfo.citiesIndex;
    models.cities = new O3D.Model(Object.create(modelInfo, {
      //Add a custom picking method
      pick: {
        value: function(pixel) {
          //calculates the element index in the array by hashing the color values
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
    models.cities.rotation.set(-0.3, 0, 0);
    models.cities.update();

    Log.write('Loading assets...');
    createApp();
  }
};

function loadData() {
  Log.write('Loading data...');
  //Request cities data
  new IO.XHR({
    url: 'data/cities.json',
    onSuccess: function(json) {
      data.cities = JSON.parse(json);
      citiesWorker.postMessage(data.cities);
      Log.write('Building models...');
    },
    onProgress: function(e) {
      Log.write('Loading airports data, ' + (e.total ? (Math.round(e.loaded / e.total * 100) + '%') : 'please wait...'));
    },
    onError: function() {
      Log.write('There was an error while fetching cities data.', true);
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
        var airlineId = airlines[i][0],
            airlineName = airlines[i][1];
        html.push('<label for=\'checkbox-' + airlineId + '\'><input type=\'checkbox\' id=\'checkbox-' + airlineId + '\' /> ' + airlineName + '</label>');
      }
      //append all elements
      airlineList.innerHTML = '<li>' + html.join('</li><li>') + '</li>';
      //when an airline is selected show all paths for that airline
      airlineList.addEventListener('change', function(e) {
        var target = e.target,
            airlineId = target.id.split('-')[1];
        
        function callback() {
          if (target.checked) {
            airlineManager.add(airlineId);
          } else {
            airlineManager.remove(airlineId);
          }
        }

        if (data.airlinesRoutes[airlineId]) {
          callback();
        } else {
          Log.write('Fetching data for airline...');
          new IO.XHR({
            url: 'data/airlines/' + airlineId.replace(' ', '_') + '.json',
            onSuccess: function(json) {
              data.airlinesRoutes[airlineId] = JSON.parse(json);
              callback();
              Log.write('Done.', true);
            },
            onProgress: function(e) {
              Log.write('Fetching data for airline ' + (e.total ? (Math.round(e.loaded / e.total * 100) + '%') : '...'));
            },
            onError: function() {
              Log.write('There was an error while fetching data for airline: ' + airlineId, true);
            }
          }).send();
        }
      }, false);
    },
    onError: function() {
      Log.write('There was an error while fetching airlines data.', true);
    }
  }).send();
}

//Takes care of adding and removing routes
//for the selected airlines
var airlineManager = {
  airlineIds: [],

  add: function(airline) {
    var airlineIds = this.airlineIds,
        routes = data.airlinesRoutes[airline],
        airlines = models.airlines,
        vertices = airlines.vertices || [],
        indices = airlines.indices || [],
        offset = vertices.length / 3,
        samplings = 10;

    for (var i = 0, l = routes.length; i < l; i++) {
      var ans = this.createRoute(routes[i], i * samplings + offset);
      vertices.push.apply(vertices, ans.vertices);
      indices.push.apply(indices, ans.indices);
    }
    
    airlines.vertices = vertices;
    airlines.indices = indices;
    airlines.dynamic = true;
    airlineIds.push(airline);
  },
  
  remove: function(airline) {
    var airlines = models.airlines,
        routes = data.airlinesRoutes[airline],
        nroutes = routes.length,
        vertices = airlines.vertices,
        indices = airlines.indices,
        airlineIds = this.airlineIds,
        index = airlineIds.indexOf(airline),
        samplings = 10;

    for (var i = 0, nacum = 0; i < index; i++) {
      nacum += data.airlinesRoutes[airlineIds[i]].length;
    }

    airlineIds.splice(index, 1);
    vertices.splice(samplings * 3 * nacum, nroutes * samplings * 3);
    indices.splice((samplings - 1) * 2 * nacum, nroutes * (samplings - 1) * 2);

    for (var i = (samplings - 1) * 2 * nacum, l = indices.length; i < l; i++) {
      indices[i] -= (samplings * nroutes);
    }
    airlines.dynamic = true;
  },

  //creates a quadratic bezier curve as a route
  createRoute: function(route, offset) {
    var pi = Math.PI,
        pi2 = pi * 2,
        sin = Math.sin,
        cos = Math.cos,
        city1 = data.cities[route[2] + '^' + route[1]],
        city2 = data.cities[route[4] + '^' + route[3]],
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
        p3 = p2.add(p1).$scale(0.5).$unit().$scale(1.5),
        pArray = [],
        pIndices = [],
        t = 0,
        count = 0,
        samplings = 10,
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
      //to render cities and routes
      id: 'layer',
      from: 'uris',
      path: 'shaders/',
      vs: 'layer.vs.glsl',
      fs: 'layer.fs.glsl',
      noCache: true
    },{
      //to render the globe
      id: 'earth',
      from: 'uris',
      path: 'shaders/',
      vs: 'earth.vs.glsl',
      fs: 'earth.fs.glsl',
      noCache: true
    }, {
      //for glow post-processing
      id: 'glow',
      from: 'uris',
      path: 'shaders/',
      vs: 'glow.vs.glsl',
      fs: 'glow.fs.glsl',
      noCache: true
    }],
    camera: {
      position: {
        x: 0, y: 0, z: -4
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
            b: 0.5 
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
      centerOrigin: false,
      onDragStart: function(e) {
        pos = pos || {};
        pos.x = e.x;
        pos.y = e.y;
        pos.ycache = pos.ycache || 0;
      },
      onDragMove: function(e) {
        var z = this.camera.position.z,
            sign = Math.abs(z) / z,
            earth = models.earth,
            erot = earth.rotation,
            cities = models.cities,
            crot = cities.rotation,
            airlines = models.airlines,
            arot = airlines.rotation,
            cos = Math.cos,
            sin = Math.sin;

        erot.y += -(pos.x - e.x) / 100;
        crot.y += -(pos.x - e.x) / 100;
        arot.y += -(pos.x - e.x) / 100;
        
        earth.update();
        cities.update();
        airlines.update();
        
        earth.matrix.$rotateAxis(pos.ycache + (pos.y - e.y) / 300, { 
          x: cos(erot.y), 
          y: 0, 
          z: - sin(erot.y) 
        });
        cities.matrix.$rotateAxis(pos.ycache + (pos.y - e.y) / 300, { 
          x: cos(crot.y), 
          y: 0, 
          z: sin(crot.y) 
        });
        airlines.matrix.$rotateAxis(pos.ycache + (pos.y - e.y) / 300, { 
          x: cos(arot.y), 
          y: 0, 
          z: sin(arot.y) 
        });
        
        pos.x = e.x;
      },
      onDragEnd: function(e) {
        pos.ycache += (pos.y - e.y) / 300;
      }
    },
    textures: {
      src: ['img/earth3-specular.gif'],
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
      Log.write("There was an error creating the app.", true);
    },
    onLoad: function(app) {
      Log.write('Done.', true);

      //Unpack app properties
      var gl = app.gl,
          scene = app.scene,
          camera = app.camera,
          canvas = app.canvas,
          width = canvas.width,
          height = canvas.height,
          program = app.program,
          renderCamera = new Camera(camera.fov, 
                                    camera.aspect, 
                                    camera.near, 
                                    camera.far, {
            position: { x: 0, y: 0, z: -4.125 }
          }),
          renderScene = new Scene(program, renderCamera),
          glowScene = new Scene(program, camera, scene.config),
          clearOpt = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT;

      renderCamera.update();
      app.renderCamera = renderCamera;
       
      gl.clearColor(0.1, 0.1, 0.1, 1);
      gl.clearDepth(1);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      
      models.frontPlane = new O3D.Plane({
        type: 'x,y',
        xlen: width / 100,
        ylen: height / 100,
        nx: 5,
        ny: 5,
        offset: 0,
        textures: ['glow-texture', 'render-texture'],
        program: 'glow'
      });

      //create shadow, glow and image framebuffers
      var framebufferOptions = {
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
      };

      app.setFrameBuffers({
        glow: framebufferOptions,
        render:framebufferOptions
      });

      //picking scene
      scene.add(models.earth,
                models.cities,
                models.airlines);

      //rendered on-screen scene
      renderScene.add(models.frontPlane);

      //post processing glow scene
      glowScene.add(models.earth,
                    models.cities,
                    models.airlines);
     
      draw();
     
     //Remove central log panel 
      var loadingText = $('loading-text');
      loadingText.parentNode.removeChild(loadingText);
      //Select first airline
      $$('#airline-list li input')[0].click();
      $('list-wrapper').style.display = '';

      function draw() {
        gl.clearColor(0.1, 0.1, 0.1, 1);
        gl.viewport(0, 0, 1024, 1024);
        drawTextures();
        
        gl.viewport(0, 0, width, height);
        drawEarth();
      }

      function drawTextures() {
        var earthProg = program.earth;
        //render to a texture to be blurred
        app.setFrameBuffer('glow', true);
        gl.clear(clearOpt);
        earthProg.use();
        earthProg.setUniform('renderType',  0);
        glowScene.renderToTexture('glow');
        app.setFrameBuffer('glow', false);
        
        //render the actual picture with the planet and all
        app.setFrameBuffer('render', true);
        gl.clear(clearOpt);
        earthProg.use();
        earthProg.setUniform('renderType', -1);
        scene.renderToTexture('render');
        app.setFrameBuffer('render', false);
      }

      //Draw to screen
      function drawEarth() {
        gl.clear(clearOpt);
        renderScene.render();
        Fx.requestAnimationFrame(draw);
      }
    }
  });
}



function webGLStart() {
  var $id = function(d) { return document.getElementById(d); };
  
  //Create moon
  var earth = new PhiloGL.O3D.Sphere({
    nlat: 30,
    nlong: 30,
    radius: 2,
    uniforms: {
      shininess: 32
    },
    textures: ['earth.jpg', 'earth-specular.gif'],
    colors: [1, 1, 1, 1]
  });
  
  //Create application
  PhiloGL('lesson15-canvas', {
    program: {
      from: 'uris',
      path: '../../../shaders/',
      vs: 'spec-map.vs.glsl',
      fs: 'spec-map.fs.glsl'
    },
    camera: {
      position: {
        x: 0, y: 0, z: -6
      }
    },
    textures: {
      src: ['earth.jpg', 'earth-specular.gif'],
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
          canvas = app.canvas,
          //enable specular, color map
          specularMap = $id('specular-map'),
          colorMap = $id('color-map'),
          //get light config from forms
          lighting = $id('lighting'),
          ambient = {
            r: $id('ambientR'),
            g: $id('ambientG'),
            b: $id('ambientB')
          },
          point = {
            x: $id('lightPositionX'),
            y: $id('lightPositionY'),
            z: $id('lightPositionZ'),
          
            sr: $id('specularR'),
            sg: $id('specularG'),
            sb: $id('specularB'),
            
            dr: $id('diffuseR'),
            dg: $id('diffuseG'),
            db: $id('diffuseB')
          },
          //object rotation
          theta = 0;

      //onBeforeRender
      earth.onBeforeRender = function(program, camera) {
        program.setUniform('enableSpecularMap', specularMap.checked);
        program.setUniform('enableColorMap', colorMap.checked);
      };
      
      //Basic gl setup
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clearDepth(1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.viewport(0, 0, +canvas.width, +canvas.height);
      //Add objects to the scene
      scene.add(earth);
      //Animate
      draw();

      //Draw the scene
      function draw() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //Setup lighting
        var lights = scene.config.lights;
        lights.enable = lighting.checked;
        lights.ambient = {
          r: +ambient.r.value,
          g: +ambient.g.value,
          b: +ambient.b.value
        };
        lights.points = {
          diffuse: {
            r: +point.dr.value,
            g: +point.dg.value,
            b: +point.db.value
          },
          specular: {
            r: +point.sr.value,
            g: +point.sg.value,
            b: +point.sb.value
          },
          position: {
            x: +point.x.value,
            y: +point.y.value,
            z: +point.z.value
          }
        };
        
        //Update position
        theta += 0.01;
        earth.rotation.set(Math.PI, theta,  0.1);
        earth.update();
        
        //render objects
        scene.render();

        //request new frame
        PhiloGL.Fx.requestAnimationFrame(draw);
      }
    }
  });
}



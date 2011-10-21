function webGLStart() {
  var pos, $id = function(d) { return document.getElementById(d); };
  
  //Create moon
  var moon = new PhiloGL.O3D.Sphere({
    nlat: 30,
    nlong: 30,
    radius: 2,
    textures: 'moon.gif'
  });
  //Create box
  var box = new PhiloGL.O3D.Cube({
    textures: 'crate.gif'
  });
  box.scale.set(2, 2, 2);

  //Create application
  PhiloGL('lesson12-canvas', {
    camera: {
      position: {
        x: 0, y: 0, z: 30
      }
    },
    scene: {
      lights: {
        directional: {
          color: {
            r: 0, g: 0, b: 0
          },
          direction: {
            x: 0, y: 0, z: 0
          }
        }
      }
    },
    textures: {
      src: ['moon.gif', 'crate.gif'],
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
      onMouseWheel: function(e, info) {
        info.stop();
        var camera = this.camera;

        camera.position.z += info.wheel;
        camera.update();
      }
    },
    onError: function() {
      alert("There was an error creating the app.");
    },
    onLoad: function(app) {
      //Unpack app properties
      var gl = app.gl,
          program = app.program,
          scene = app.scene,
          canvas = app.canvas,
          camera = app.camera,
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
          
            r: $id('pointR'),
            g: $id('pointG'),
            b: $id('pointB')
          },
          //objects position
          rho = 6,
          theta = 0;
      
      //Basic gl setup
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clearDepth(1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.viewport(0, 0, +canvas.width, +canvas.height);
      //Add objects to the scene
      scene.add(moon, box);
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
          color: {
            r: +point.r.value,
            g: +point.g.value,
            b: +point.b.value
          },
          position: {
            x: +point.x.value,
            y: +point.y.value,
            z: +point.z.value
          }
        };
        //Update position
        theta += 0.01;
        
        moon.position = {
          x: rho * Math.cos(theta),
          y: 0,
          z: rho * Math.sin(theta)
        };
        moon.update();
        
        box.position = {
          x: rho * Math.cos(Math.PI + theta),
          y: 0,
          z: rho * Math.sin(Math.PI + theta)
        };
        box.update();
        
        //render objects 
        scene.render();

        //request frame
        PhiloGL.Fx.requestAnimationFrame(draw);
      }
    }
  });
}

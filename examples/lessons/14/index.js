function webGLStart() {
  var $id = function(d) { return document.getElementById(d); };
  
  //Get Model
  new PhiloGL.IO.XHR({
    url: 'Teapot.json',
    onSuccess: function(text) {
      var json = JSON.parse(text);
      json.colors = [1, 1, 1, 1];
      json.textures = 'arroway.de_metal+structure+06_d100_flat.jpg';
      var teapot = new PhiloGL.O3D.Model(json);
      animateObject(teapot);
    }
  }).send();

  function animateObject(teapot) {
    //Create application
    PhiloGL('lesson14-canvas', {
      program: {
        from: 'uris',
        path: '../../../shaders/',
        vs: 'frag-lighting.vs.glsl',
        fs: 'frag-lighting.fs.glsl',
        noCache: true
      },
      camera: {
        position: {
          x: 0, y: 0, z: -50
        }
      },
      textures: {
        src: ['arroway.de_metal+structure+06_d100_flat.jpg', 'earth.jpg'],
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
            //shininess
            shininess = $id('shininess'),
            //specular
            specular = $id('specular'),
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
            texture = $id('texture'),
            //object rotation
            theta = 0;

        //Basic gl setup
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.viewport(0, 0, +canvas.width, +canvas.height);
        //Add objects to the scene
        scene.add(teapot);
        
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
          //Set/Unset specular highlights
          if (!specular.checked) {
            delete lights.points.specular;
          }
          //Set shininess
          teapot.uniforms.shininess = +shininess.value;
          //Set texture
          if (texture.value == 'none') {
            delete teapot.textures;
          } else if (texture.value == 'galvanized') {
            teapot.textures = ['arroway.de_metal+structure+06_d100_flat.jpg'];
          } else {
            teapot.textures = ['earth.jpg'];
          }
         
          //Update position
          theta += 0.01;
          teapot.rotation.set(theta / 100, theta, 0);
          teapot.update();
          
          //render objects
          scene.render();

          //request new frame
          PhiloGL.Fx.requestAnimationFrame(draw);
        }
      }
    });
    
  }
}



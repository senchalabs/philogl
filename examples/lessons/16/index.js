function webGLStart() {
  var $id = function(d) { return document.getElementById(d); };

  //unpack modules
  PhiloGL.unpack();
  
  //create all models
  var models = {};
  //Create moon
  models.moon = new O3D.Sphere({
    nlat: 30,
    nlong: 30,
    radius: 2,
    textures: 'moon.gif',
    uniforms: {
      shininess: 5,
      'enableSpecularHighlights': false,
      'materialAmbientColor': [1, 1, 1],
      'materialDiffuseColor': [1, 1, 1],
      'materialSpecularColor': [0, 0, 0],
      'materialEmissiveColor': [0, 0, 0]
    }
  });
  //Create box
  models.box = new O3D.Cube({
    textures: 'crate.gif',
    uniforms: {
      shininess: 5,
      'enableSpecularHighlights': false,
      'materialAmbientColor': [1, 1, 1],
      'materialDiffuseColor': [1, 1, 1],
      'materialSpecularColor': [0, 0, 0],
      'materialEmissiveColor': [0, 0, 0]
    }
  });
  models.box.scale.set(2, 2, 2);
  
  //Load macbook
  models.macbookscreen = new O3D.Model({
    normals: [
      0, -0.965926, 0.258819,
      0, -0.965926, 0.258819,
      0, -0.965926, 0.258819,
      0, -0.965926, 0.258819
    ],
    vertices: [
      0.580687, 0.659, 0.813106,
      -0.580687, 0.659, 0.813107,
      0.580687, 0.472, 0.113121,
      -0.580687, 0.472, 0.113121
    ],
    texCoords: [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ],
    textures: 'monitor-texture',
    drawType: 'TRIANGLE_STRIP',
    uniforms: {
      shininess: 0.2,
      'enableSpecularHighlights': false,
      'materialAmbientColor': [0, 0, 0],
      'materialDiffuseColor': [0, 0, 0],
      'materialSpecularColor': [0.5, 0.5, 0.5],
      'materialEmissiveColor': [1.5, 1.5, 1.5]
    }
  });

  new IO.XHR({
    url: 'macbook.json',
    onError: function() {
      alert('Unable to load macbook model');
    },
    onSuccess: function(jsonString) {
      var json = JSON.parse(jsonString);
      json.shininess = 5;
      json.uniforms = {
        'enableSpecularHighlights': true,
        'materialAmbientColor': [1, 1, 1],
        'materialDiffuseColor': [1, 1, 1],
        'materialSpecularColor': [1.5, 1.5, 1.5],
        'materialEmissiveColor': [0, 0, 0]
      };
      models.macbook = new O3D.Model(json);
      createApp(models);
    }
  }).send();

  function createApp(models) {
    //Create application
    PhiloGL('lesson16-canvas', {
      camera: {
        position: {
          x: 0, y: 0, z: -3
        }
      },
      program: {
        from: 'uris',
        path: '../../../shaders/',
        vs: 'render-tex.vs.glsl',
        fs: 'render-tex.fs.glsl'
      },
      scene: {
        lights: {
          enable: true,
          points: {
            position: {
              x: 1, y: 2, z: -1
            },
            diffuse: {
              r: 0.8, g: 0.8, b: 0.8
            },
            specular: {
              r: 0.8, g: 0.8, b: 0.8
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
      onError: function() {
        alert("There was an error creating the app.");
      },
      onLoad: function(app) {
        var screenWidth = 512, 
            screenHeight = 512,
            screenRatio = 1.66,
            gl = app.gl,
            program = app.program,
            outerCamera = app.camera,
            innerCamera = new Camera(45, screenRatio, 0.1, 100, {
              position: {
                x: 0, y: 0, z: -17
              }
            }),
            outerScene = app.scene,
            innerScene = new Scene(program, innerCamera, {
              lights: {
                enable: true,
                points: {
                  position: {
                    x: -1, y: 2, z: -1
                  },
                  diffuse: {
                    r: 0.8, g: 0.8, b: 0.8
                  },
                  specular: {
                    r: 0.8, g: 0.8, b: 0.8
                  }
                }
              }
            }),
            canvas = app.canvas,
            rho = 4,
            theta = 0,
            laptopTheta = 0,
            //models
            macbook = models.macbook,
            macbookscreen = models.macbookscreen,
            box = models.box,
            moon = models.moon;

        //create framebuffer
        program.setFrameBuffer('monitor', {
          width: screenWidth,
          height: screenHeight,
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
        
        //Basic gl setup
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        //Add objects to different scenes
        outerScene.add(macbook, macbookscreen);
        innerScene.add(moon, box);
        
        outerCamera.update();
        innerCamera.update();
      
        outerCamera.view.$translate(0, -0.5, 0);
        
        function drawInnerScene() {
          program.setFrameBuffer('monitor', true);
          
          gl.viewport(0, 0, screenWidth, screenHeight);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          
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
          
          innerScene.renderToTexture('monitor');
          
          program.setFrameBuffer('monitor', false);
        }
              
        function drawOuterScene() {
          gl.viewport(0, 0, screenWidth, screenHeight);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          
          laptopTheta += 0.005;
          
          macbook.rotation.set(-Math.PI /2, laptopTheta, 0);
          macbook.update();

          macbookscreen.rotation.set(-Math.PI /2, laptopTheta, 0);
          macbookscreen.update();

          outerScene.render();
        }

        function draw() {
          drawInnerScene();
          drawOuterScene();
          PhiloGL.Fx.requestAnimationFrame(draw);
        }
        
        //Animate
        draw();
      }
    });
  }
}



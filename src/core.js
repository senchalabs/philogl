//core.js
//Provides general utility methods, module unpacking methods and the PhiloGL app creation method.

//Global
this.PhiloGL = null;

//Creates a single application object asynchronously
//with a gl context, a camera, a program, a scene, and an event system.
(function () {
  PhiloGL = function(canvasId, opt) {
    opt = $.merge({
      context: {
        /* 
         debug: true 
        */
      },
      camera: {
        fov: 45,
        near: 0.1,
        far: 500
      },
      program: {
        from: 'defaults', //(defaults|ids|sources|uris)
        vs: 'Default',
        fs: 'Default'
      },
      scene: {
        /*
         All the scene.js options:
         lights: { ... }
        */
      },
      textures: {
        src: []
      },
      events: {
        /*
         All the events.js options:
         onClick: fn,
         onTouchStart: fn...
        */
      },
      onLoad: $.empty,
      onError: $.empty

    }, opt || {});
    
    var optContext = opt.context,
        optCamera = opt.camera,
        optEvents = opt.events,
        optTextures = opt.textures,
        optProgram = opt.program,
        pfrom = optProgram.from,
        optScene = opt.scene;
    
    //get Context
    gl = PhiloGL.WebGL.getContext(canvasId, optContext);

    if (!gl) {
        opt.onError();
        return null;
    }

    //get Program
    var popt = {
      'defaults': 'fromDefaultShaders',
      'ids': 'fromShaderIds',
      'sources': 'fromShaderSources',
      'uris': 'fromShaderURIs'
    };

    for (var p in popt) {
      if (pfrom == p) {
        program = PhiloGL.Program[popt[p]]($.extend({
          onSuccess: function(p) {
            loadProgramDeps(gl, p, function(app) {
              opt.onLoad(app); 
            });
          },
          onError: function(e) {
            opt.onError(e);
          }
        }, optProgram));
        break;
      }
    }

    if (program) {
      loadProgramDeps(gl, program, function(app) {
        opt.onLoad(app);
      });
    }

    function loadProgramDeps(gl, program, callback) {
      //Use program
      program.use();
      
      //get Camera
      var canvas = gl.canvas,
          camera = new PhiloGL.Camera(optCamera.fov, 
                                      canvas.width / canvas.height, 
                                      optCamera.near, 
                                      optCamera.far, optCamera);
      camera.update();
      
      //get Scene
      var scene = new PhiloGL.Scene(program, camera, optScene);
      
      //make app object
      var app = {
        '$$family': 'app',
        gl: gl,
        canvas: canvas,
        program: program,
        scene: scene,
        camera: camera
      };

      //get Events
      if (optEvents) {
        PhiloGL.Events.create(app, $.extend(optEvents, {
          bind: app
        }));
      }

      //load Textures
      if (optTextures.src.length) {
        new PhiloGL.IO.Textures(program, $.extend(optTextures, {
          onComplete: function() {
            callback(app);
          }
        }));
      } else {
        callback(app);
      }
    }
  };

})();


//Unpacks the submodules to the global space.
PhiloGL.unpack = function(global) {
  ['Vec3', 'Mat4', 'Camera', 'Program', 'WebGL', 'O3D', 'Scene', 'Shaders', 'IO', 'Events', 'WorkerGroup', 'Fx'].forEach(function(module) {
      window[module] = PhiloGL[module];
  });
};

//Version
PhiloGL.version = '1.1.0';

//Holds the 3D context
var gl;


//Utility functions
function $(d) {
  return document.getElementById(d);
}

$.empty = function() {};

$.time = Date.now || function() {
  return +new Date;
};

$.uid = (function() {
  var t = $.time();
  
  return function() {
    return t++;
  };
})();

$.extend = function(to, from) {
  for (var p in from) {
    to[p] = from[p];
  }
  return to;
};

$.type = (function() {
  var oString = Object.prototype.toString,
      type = function(e) {
        var t = oString.call(e);
        return t.substr(8, t.length - 9).toLowerCase();
      };

  return function(elem) {
    var elemType = type(elem);
    if (elemType != 'object') {
      return elemType;
    }
    if (elem.$$family) return elem.$$family;
    return (elem && elem.nodeName && elem.nodeType == 1) ? 'element' : elemType;
  };
})();

(function() {
  function detach(elem) {
    var type = $.type(elem), ans;
    if (type == 'object') {
      ans = {};
      for (var p in elem) {
        ans[p] = detach(elem[p]);
      }
      return ans;
    } else if (type == 'array') {
      ans = [];
      for (var i = 0, l = elem.length; i < l; i++) {
        ans[i] = detach(elem[i]);
      }
      return ans;
    } else {
      return elem;
    }
  }

  $.merge = function() {
    var mix = {};
    for (var i = 0, l = arguments.length; i < l; i++){
        var object = arguments[i];
        if ($.type(object) != 'object') continue;
        for (var key in object){
            var op = object[key], mp = mix[key];
            if (mp && $.type(op) == 'object' && $.type(mp) == 'object') {
              mix[key] = $.merge(mp, op);
            } else{
              mix[key] = detach(op);
            }
        }
    }
    return mix;
  };
})();

$.splat = (function() {
  var isArray = Array.isArray;
  return function(a) {
    return isArray(a) && a || [a];
  };
})();


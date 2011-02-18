//webgl.js
//Checks if WebGL is enabled and creates a context for using WebGL.

(function () {

  var WebGL = {
    
    getContext: function(canvas, opt) {
      var canvas = typeof canvas == 'string'? $(canvas) : canvas, ctx;
      ctx = canvas.getContext('experimental-webgl', opt);
      if (!ctx) {
        ctx = canvas.getContext('webgl', opt);
      }
      //Set as debug handler
      if (ctx && opt && opt.debug) {
        gl = {};
        for (var m in ctx) {
          var f = ctx[m];
          if (typeof f == 'function') {
            gl[m] = (function(k, v) {
              return function() {
                console.log(k, Array.prototype.join.call(arguments), Array.prototype.slice.call(arguments));
                try {
                  var ans = v.apply(ctx, arguments);
                } catch (e) {
                  throw k + " " + e;                  
                }
                var errorStack = [], error;
                while((error = ctx.getError()) !== ctx.NO_ERROR) {
                  errorStack.push(error);
                }
                if (errorStack.length) {
                  throw errorStack.join();
                }
                return ans;
              };
            })(m, f);
          } else {
            gl[m] = f;
          }
        }
      } else {
        gl = ctx;
      }

      //add a get by name param
      gl.get = function(name) {
        return typeof name == 'string'? gl[name] : name;
      };

      return gl;
    } 

  };

  //Feature test WebGL
  (function() {
    try {
      var canvas = document.createElement('canvas');
      PhiloGL.hasWebGL = function() {
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      };
    } catch(e) {
      PhiloGL.hasWebGL = function() {
          return false;
      };
    }
  })();

  PhiloGL.WebGL = WebGL;
  
})();

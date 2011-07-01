//io.js
//Provides loading of assets with XHR and JSONP methods.

(function () {
  var IO = {};

  var XHR = function(opt) {
    opt = $.merge({
      url: 'http://sencha.com/',
      method: 'GET',
      async: true,
      noCache: false,
      //body: null,
      sendAsBinary: false,
      onProgress: $.empty,
      onSuccess: $.empty,
      onError: $.empty,
      onAbort: $.empty,
      onComplete: $.empty
    }, opt || {});

    this.opt = opt;
    this.initXHR();
  };

  XHR.State = {};
  ['UNINITIALIZED', 'LOADING', 'LOADED', 'INTERACTIVE', 'COMPLETED'].forEach(function(stateName, i) {
    XHR.State[stateName] = i;
  });

  XHR.prototype = {
    initXHR: function() {
      var req = this.req = new XMLHttpRequest(),
          that = this;

      ['Progress', 'Error', 'Abort', 'Load'].forEach(function(event) {
        req.addEventListener(event.toLowerCase(), function(e) {
          that['handle' + event](e);
        }, false);
      });
    },
    
    send: function(body) {
      var req = this.req,
          opt = this.opt,
          async = opt.async;
      
      if (opt.noCache) {
        opt.url += (opt.url.indexOf('?') >= 0? '&' : '?') + $.uid();
      }

      req.open(opt.method, opt.url, async);
      
      if (async) {
        req.onreadystatechange = function(e) {
          if (req.readyState == XHR.State.COMPLETED) {
            if (req.status == 200) {
              opt.onSuccess(req.responseText);
            } else {
              opt.onError(req.status);
            }
          }
        };
      }
      
      if (opt.sendAsBinary) {
        req.sendAsBinary(body || opt.body || null);
      } else {
        req.send(body || opt.body || null);
      }

      if (!async) {
        if (req.status == 200) {
          opt.onSuccess(req.responseText);
        } else {
          opt.onError(req.status);
        }
      }
    },

    setRequestHeader: function(header, value) {
      this.req.setRequestHeader(header, value);
      return this;
    },

    handleProgress: function(e) {
      if (e.lengthComputable) {
        this.opt.onProgress(e, Math.round(e.loaded / e.total * 100));
      } else {
        this.opt.onProgress(e, -1);
      }
    },

    handleError: function(e) {
      this.opt.onError(e);
    },

    handleAbort: function() {
      this.opt.onAbort(e);
    },

    handleLoad: function(e) {
       this.opt.onComplete(e);
    }
  };

  //Make parallel requests and group the responses.
  XHR.Group = function(opt) {
    opt = $merge({
      urls: [],
      onError: $.empty,
      onSuccess: $.empty,
      onComplete: $.empty,
      method: 'GET',
      async: true,
      noCache: false,
      //body: null,
      sendAsBinary: false
    }, opt || {});

    var urls = $.splat(opt.urls),
        len = urls.length,
        ans = Array(len),
        reqs = urls.map(function(url, i) {
            return new XHR({
              url: url,
              method: opt.method,
              async: opt.async,
              noCache: opt.noCache,
              sendAsBinary: opt.sendAsBinary,
              body: opt.body,
              //add callbacks
              onError: handleError(i),
              onSuccess: handleSuccess(i)
            });
        });

    function handleError(i) {
      return function(e) {
        len--;
        opt.onError(e, i);
        
        if (!len) opt.onComplete(ans);
      };
    }

    function handleSuccess(i) {
      return function(response) {
        len--;
        ans[i] = response;
        opt.onSuccess(response, i);

        if (!len) opt.onComplete(ans);
      };
    }

    this.reqs = reqs;
  };

  XHR.Group.prototype = {
    send: function() {
      this.reqs.forEach(function(req) {
        req.send();
      });
    }
  };

  var JSONP = function(opt) {
    opt = $.merge({
      url: 'http://sencha.com/',
      data: {},
      noCache: false,
      onComplete: $.empty,
      callbackKey: 'callback'
    }, opt || {});
    
    var index = JSONP.counter++;
    //create query string
    var data = [];
    for(var prop in opt.data) {
      data.push(prop + '=' + opt.data[prop]);
    }
    data = data.join('&');
    //append unique id for cache
    if (opt.noCache) {
      data += (data.indexOf('?') >= 0? '&' : '?') + $.uid();
    }
    //create source url
    var src = opt.url + 
      (opt.url.indexOf('?') > -1 ? '&' : '?') +
      opt.callbackKey + '=PhiloGL.IO.JSONP.requests.request_' + index +
      (data.length > 0 ? '&' + data : '');
    //create script
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    //create callback
    JSONP.requests['request_' + index] = function(json) {
      opt.onComplete(json);
      //remove script
      if(script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if(script.clearAttributes) {
        script.clearAttributes();
      } 
    };
    //inject script
    document.getElementsByTagName('head')[0].appendChild(script);
  };

  JSONP.counter = 0;
  JSONP.requests = {};

  //Load multiple Image assets async
  var Images = function(opt) {
    opt = $.merge({
      src: [],
      noCache: false,
      onProgress: $.empty,
      onComplete: $.empty
    }, opt || {});

    var count = 0, l = opt.src.length;
    //Image onload handler
    var load = function() {
      opt.onProgress(Math.round(++count / l * 100));
      if (count == l) {
        opt.onComplete(images);
      }
    };
    //Image error handler
    var error = function() {
      if (++count == l) {
        opt.onComplete(images);
      }
    };
    //uid for image sources
    var noCache = opt.noCache,
        uid = $.uid(),
        getSuffix = function(s) { return (s.indexOf('?') >= 0? '&' : '?') + uid; };
    //Create image array
    var images = opt.src.map(function(src, i) {
      var img = new Image();
      img.index = i;
      img.onload = load;
      img.onerror = error;
      img.src = src + (noCache? getSuffix(src) : '');
      return img;
    });
    return images;
  };

  //Load multiple textures from images
  var Textures = function(opt) {
    opt = $.merge({
      src: [],
      noCache: false,
      onComplete: $.empty
    }, opt || {});

    Images({
      src: opt.src,
      noCache: opt.noCache,
      onComplete: function(images) {
        var textures = {};
        images.forEach(function(img, i) {
          textures[opt.src[i]] = $.merge({
            data: {
              value: img
            }
          }, opt);
        });
        app.setTextures(textures);
        opt.onComplete();
      }
    });
  };
  
  IO.XHR = XHR;
  IO.JSONP = JSONP;
  IO.Images = Images;
  IO.Textures = Textures;
  PhiloGL.IO = IO;

})();

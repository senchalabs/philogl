//event.js
//Handle keyboard/mouse/touch events in the Canvas

(function() {
  
  //returns an O3D object or false otherwise.
  function toO3D(n) {
    return n !== true ? n : false;
  }
  
  //Returns an element position
  var getPos = function(elem) {
    var offset = getOffsets(elem);
    var scroll = getScrolls(elem);
    return {
      x: offset.x - scroll.x,
      y: offset.y - scroll.y
    };

    function getOffsets(elem) {
      var position = {
        x: 0,
        y: 0
      };
      while (elem && !isBody(elem)) {
        position.x += elem.offsetLeft;
        position.y += elem.offsetTop;
        elem = elem.offsetParent;
      }
      return position;
    }

    function getScrolls(elem) {
      var position = {
        x: 0,
        y: 0
      };
      while (elem && !isBody(elem)) {
        position.x += elem.scrollLeft;
        position.y += elem.scrollTop;
        elem = elem.parentNode;
      }
      return position;
    }

    function isBody(element) {
      return (/^(?:body|html)$/i).test(element.tagName);
    }
  };

  //event object wrapper
  var event = {
    get: function(e, win) {
      win = win || window;
      return e || win.event;
    },
    getWheel: function(e) {
      return e.wheelDelta? e.wheelDelta / 120 : -(e.detail || 0) / 3;
    },
    getKey: function(e) {
      var code = e.which || e.keyCode;
      var key = keyOf(code);
      //onkeydown
      var fKey = code - 111;
      if (fKey > 0 && fKey < 13) key = 'f' + fKey;
      key = key || String.fromCharCode(code).toLowerCase();
      
      return {
        code: code,
        key: key,
        shift: e.shiftKey,
        control: e.ctrlKey,
        alt: e.altKey,
        meta: e.metaKey
      };
    },
    isRightClick: function(e) {
      return (e.which == 3 || e.button == 2);
    },
    getPos: function(e, win) {
      // get mouse position
      win = win || window;
      e = e || win.event;
      var doc = win.document;
      doc = doc.documentElement || doc.body;
      //TODO(nico): make touch event handling better
      if(e.touches && e.touches.length) {
        e = e.touches[0];
      }
      var page = {
        x: e.pageX || (e.clientX + doc.scrollLeft),
        y: e.pageY || (e.clientY + doc.scrollTop)
      };
      return page;
    },
    stop: function(e) {
      if (e.stopPropagation) e.stopPropagation();
      e.cancelBubble = true;
      if (e.preventDefault) e.preventDefault();
      else e.returnValue = false;
    }
  };

  var EventsProxy = function(app, opt) {
    var domElem = app.canvas;
    this.scene = app.scene;
    this.domElem = domElem;
    this.pos = getPos(domElem);
    this.opt = this.callbacks = opt;

    this.size = {
      width: domElem.width || domElem.offsetWidth,
      height: domElem.height || domElem.offsetHeight
    };

    this.attachEvents();
  };
  
  EventsProxy.prototype = {
    hovered: false,
    pressed: false,
    touched: false,

    touchMoved: false,
    moved: false,
    
    attachEvents: function() {
      var domElem = this.domElem,
          opt = this.opt,
          that = this;
      
      if (opt.disableContextMenu) {
        domElem.oncontextmenu = function() { return false; };
      }
      
      ['mouseup', 'mousedown', 'mousemove', 'mouseover', 'mouseout', 
       'touchstart', 'touchmove', 'touchend'].forEach(function(action) {
        domElem.addEventListener(action, function(e, win) {
          that[action](that.eventInfo(action, e, win));
        }, false);
      });
      
       ['keydown', 'keyup'].forEach(function(action) {
        document.addEventListener(action, function(e, win) {
          that[action](that.eventInfo(action, e, win));
        }, false);
      });

      //"well, this is embarrassing..."
      var type = '';
      if (!document.getBoxObjectFor && window.mozInnerScreenX == null) {
        type = 'mousewheel';
      } else {
        type = 'DOMMouseScroll';
      }
      domElem.addEventListener(type, function(e, win) {
        that['mousewheel'](that.eventInfo('mousewheel', e, win));
      }, false);
    },
    
    eventInfo: function(type, e, win) {
      var domElem = this.domElem,
          scene = this.scene,
          opt = this.opt,
          size = this.getSize(),
          relative = opt.relative,
          centerOrigin = opt.centerOrigin,
          pos = opt.cachePosition && this.pos || getPos(domElem),
          ge = event.get(e, win),
          epos = event.getPos(e, win),
          evt = {};

      //get Position
      var x = epos.x, y = epos.y;
      if (relative) {
        x -= pos.x; y-= pos.y;
        if (centerOrigin) {
          x -= size.width / 2;
          y -= size.height / 2;
          y *= -1; //y axis now points to the top of the screen
        }
      }

      switch (type) {
        case 'mousewheel':
          evt.wheel = event.getWheel(ge);
          break;
        case 'keydown':
          $.extend(evt, event.getKey(ge));
          break;
        case 'mouseup':
          evt.isRightClick = event.isRightClick(ge);
          break;
      }

      var cacheTarget;
      
      $.extend(evt, {
        x: x,
        y: y,
        cache: false,
        //stop event propagation
        stop: function() {
          event.stop(ge);
        },
        //get the target element of the event
        getTarget: function() {
          if (cacheTarget) return cacheTarget;
          return (cacheTarget = !opt.picking || scene.pick(epos.x - pos.x, epos.y - pos.y) || true);
        }
      });
      //wrap native event
      evt.event = ge;
      
      return evt;
    },

    getSize: function() {
      if (this.cacheSize) {
        return this.size;
      }
      var domElem = this.domElem;
      return {
        width: domElem.width || domElem.offsetWidth,
        height: domElem.height || domElem.offsetHeight
      };
    },
    
    mouseup: function(e) {
      if(!this.moved) {
        if(e.isRightClick) {
          this.callbacks.onRightClick(e, this.hovered);
        } else {
          this.callbacks.onClick(e, toO3D(this.pressed));
        }
      }
      if(this.pressed) {
        if(this.moved) {
          this.callbacks.onDragEnd(e, toO3D(this.pressed));
        } else {
          this.callbacks.onDragCancel(e, toO3D(this.pressed));
        }
        this.pressed = this.moved = false;
      }
    },

    mouseout: function(e) {
      //mouseout canvas
      var rt = e.relatedTarget,
          domElem = this.domElem;
      while(rt && rt.parentNode) {
        if(domElem == rt.parentNode) return;
        rt = rt.parentNode;
      }
      if(this.hovered) {
        this.callbacks.onMouseLeave(e, this.hovered);
        this.hovered = false;
      }
    },
    
    mouseover: function(e) {},
    
    mousemove: function(e) {
      if(this.pressed) {
        this.moved = true;
        this.callbacks.onDragMove(e, toO3D(this.pressed));
        return;
      }
      if(this.hovered) {
        var target = toO3D(e.getTarget());
        if(!target || target.id != this.hovered.id) {
          this.callbacks.onMouseLeave(e, this.hovered);
          this.hovered = target;
          if(target) {
            this.callbacks.onMouseEnter(e, this.hovered);
          }
        } else {
          this.callbacks.onMouseMove(e, this.hovered);
        }
      } else {
        this.hovered = toO3D(e.getTarget());
        if(this.hovered) {
          this.callbacks.onMouseEnter(e, this.hovered);
        }
      }
      if (!this.opt.picking) {
        this.callbacks.onMouseMove(e);
      }
    },
    
    mousewheel: function(e) {
      this.callbacks.onMouseWheel(e);
    },
    
    mousedown: function(e) {
      this.pressed = e.getTarget();
      this.callbacks.onDragStart(e, toO3D(this.pressed));
    },
    
    touchstart: function(e) {
      this.touched = e.getTarget();
      this.callbacks.onTouchStart(e, toO3D(this.touched));
    },
    
    touchmove: function(e) {
      if(this.touched) {
        this.touchMoved = true;
        this.callbacks.onTouchMove(e, toO3D(this.touched));
      }
    },
    
    touchend: function(e) {
      if(this.touched) {
        if(this.touchMoved) {
          this.callbacks.onTouchEnd(e, toO3D(this.touched));
        } else {
          this.callbacks.onTouchCancel(e, toO3D(this.touched));
        }
        this.touched = this.touchMoved = false;
      }
    },

    keydown: function(e) {
      this.callbacks.onKeyDown(e);
    },

    keyup: function(e) {
      this.callbacks.onKeyUp(e);
    }
  };
    
  var Events = {};

  Events.create = function(app, opt) {
    opt = $.merge({
      cachePosition: true,
      cacheSize: true,
      relative: true,
      centerOrigin: true,
      disableContextMenu: true,
      bind: false,
      picking: false,
      
      onClick: $.empty,
      onRightClick: $.empty,
      onDragStart: $.empty,
      onDragMove: $.empty,
      onDragEnd: $.empty,
      onDragCancel: $.empty,
      onTouchStart: $.empty,
      onTouchMove: $.empty,
      onTouchEnd: $.empty,
      onTouchCancel: $.empty,
      onMouseMove: $.empty,
      onMouseEnter: $.empty,
      onMouseLeave: $.empty,
      onMouseWheel: $.empty,
      onKeyDown: $.empty,
      onKeyUp: $.empty
      
    }, opt || {});

    var bind = opt.bind;

    if (bind) {
      for (var name in opt) {
        if (name.match(/^on[a-zA-Z0-9]+$/)) {
          (function (name, fn) {
            opt[name] = function() {
              return fn.apply(bind, Array.prototype.slice.call(arguments));
            };
          })(name, opt[name]);
        }
      }
    }

    new EventsProxy(app, opt);
  };

  Events.Keys = {
  	'enter': 13,
  	'up': 38,
  	'down': 40,
  	'left': 37,
  	'right': 39,
  	'esc': 27,
  	'space': 32,
  	'backspace': 8,
  	'tab': 9,
  	'delete': 46
  };

  function keyOf(code) {
    var keyMap = Events.Keys;
    for (var name in keyMap) {
      if (keyMap[name] == code) {
        return name;
      }
    }
  }

  PhiloGL.Events = Events;
    
})();

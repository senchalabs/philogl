//Log
//Singleton that logs information
//Log singleton
var Log = {
  elem: null,
  timer: null,
  
  getElem: function() {
    if (!this.elem) {
      return (this.elem = $('log-message'));
    }
    return this.elem;
  },
  
  write: function(text, hide) {
    if (this.timer) {
      this.timer = clearTimeout(this.timer);
    }
    
    var elem = this.getElem(),
        style = elem.parentNode.style;

    elem.innerHTML = text;
    style.display = '';

    if (hide) {
      this.timer = setTimeout(function() {
        style.display = 'none';
      }, 2000);
    }
  }
};

//RightMenu
var RightMenu = function(airlineList, airlineMgr) {
  this.airlineList = airlineList;
  this.airlineMgr = airlineMgr;
  this.selectedAirlines = $('selected-airlines');
  
  airlineList.addEventListener('mousemove', this.onMouseMove.bind(this), false);
  airlineList.addEventListener('mouseout', this.onMouseOut.bind(this), false);
  airlineList.addEventListener('change', this.onChange.bind(this), false);

  this.selectedAirlines.addEventListener('click', this.onClick.bind(this), false);
};

RightMenu.prototype = {
  load: function(html) {
    this.airlineList.innerHTML = html;
  },

  onMouseMove: function(e) {
    var target = e.target,
        nodeName = target.nodeName;

    if (nodeName == 'INPUT') {
      target = target.parentNode;
    }

    if (nodeName == 'LABEL') {
      target = target.parentNode;
    }

    if (target.nodeName == 'LI') {
      var elem = target,
          prev = elem,
          next = elem.nextSibling,
          x = e.pageX,
          y = e.pageY,
          tol = 30,
          box, elemY, style, lerp;

      while (prev || next) {
        if (prev) {
          style = prev.style;
          box = prev.getBoundingClientRect();
          elemY = (box.top + box.bottom) / 2;
          lerp = (1 + Math.min(Math.abs(y - elemY), tol) / tol * -1);
          prev = prev.previousSibling;
          style.fontSize = (1 + (1.6 - 1) * lerp) + 'em';
        }
        if (next) {
          style = next.style;
          box = next.getBoundingClientRect();
          elemY = (box.top + box.bottom) / 2;
          lerp = (1 + Math.min(Math.abs(y - elemY), tol) / tol  * -1);
          next = next.nextSibling;
          style.fontSize = (1 + (1.6 - 1) * lerp) + 'em';
        }
      }
    }  
  },

  onMouseOut: function(e) {
    var nodeName = e.relatedTarget && e.relatedTarget.nodeName;
    if (nodeName && 'INPUT|LI|LABEL'.indexOf(nodeName) == -1) {
      Array.prototype.slice.call(airlineList.getElementsByTagName('li')).forEach(function(elem) {
        elem.style.fontSize = '1em';
      });
    }
  },

  onChange: function(e) {
    var checkbox = e.target,
        label = checkbox.parentNode,
        airlineId = checkbox.id.split('-')[1],
        name = label.textContent,
        airlineMgr = this.airlineMgr,
        color = airlineMgr.getColor(airlineId) || airlineMgr.getAvailableColor();

    if (checkbox.checked) {
      this.selectedAirlines.innerHTML += '<li id=\'' + airlineId + '-selected\'>' +
        '<input type=\'checkbox\' checked id=\'' + airlineId + '-checkbox-selected\' />' + 
        '<div class=\'square\' style=\'background-color:rgb(' + color + ');\' ></div>' + 
        name + '</li>';
    } else {
      var node = $(airlineId + '-selected');
      node.parentNode.removeChild(node);
    }
  },

  onClick: function(e) {
    var target = e.target, node;
    if (target.nodeName == 'INPUT') {
      var airlineId = target.parentNode.id.split('-')[0];
      var checkbox = $('checkbox-' + airlineId);
      checkbox.checked = false;
      airlineMgr.remove(airlineId);
      target = target.parentNode;
      node = target.nextSibling || target.previousSibling;
      target.parentNode.removeChild(target);
      if (node && node.id) {
        centerAirline(node.id.split('-')[0]);
      }
    } else {
      if (target.nodeName == 'DIV') {
        target = target.parentNode;
      }
      centerAirline(target.id.split('-')[0]);
    }
  }
};

//AirlineManager
//Takes care of adding and removing routes
//for the selected airlines
var AirlineManager = function(data, models) {
  var airlineIdColor = {};
  
  var availableColors = {
    '171, 217, 233': 0,
    '253, 174, 97': 0,
    '244, 109, 67': 0
  };

  var getAvailableColor = function() {
    var min = Infinity,
        res = false;
    for (var color in availableColors) {
      var count = availableColors[color];
      if (count < min) {
        min = count;
        res = color;
      }
    }
    return res;
  };

  return {
    
    airlineIds: [],

    getColor: function(airlineId) {
        return airlineIdColor[airlineId];
    },

    getAvailableColor: getAvailableColor,

    add: function(airline) {
      var airlineIds = this.airlineIds,
          color = getAvailableColor(),
          routes = data.airlinesRoutes[airline],
          airlines = models.airlines,
          slice = Array.prototype.slice,
          vertices = slice.call(airlines.vertices || []),
          colors = slice.call(airlines.colors || []),
          indices = slice.call(airlines.indices || []),
          offset = vertices.length / 3,
          samplings = 10;


      for (var i = 0, l = routes.length; i < l; i++) {
        var ans = this.createRoute(routes[i], i * samplings + offset, color);
        vertices.push.apply(vertices, ans.vertices);
        colors.push.apply(colors, ans.colors);
        indices.push.apply(indices, ans.indices);
      }
      
      airlines.vertices = vertices;
      airlines.colors = colors;
      airlines.indices = indices;
      airlines.dynamic = true;
      airlineIds.push(airline);

      //set color for airline Id
      availableColors[color]++;
      airlineIdColor[airline] = color;
    },
    
    remove: function(airline) {
      var airlines = models.airlines,
          color = airlineIdColor[airline],
          routes = data.airlinesRoutes[airline],
          nroutes = routes.length,
          slice = Array.prototype.slice,
          vertices = slice.call(airlines.vertices),
          colors = slice.call(airlines.colors),
          indices = slice.call(airlines.indices),
          airlineIds = this.airlineIds,
          index = airlineIds.indexOf(airline),
          samplings = 10;

      for (var i = 0, nacum = 0; i < index; i++) {
        nacum += data.airlinesRoutes[airlineIds[i]].length;
      }

      airlineIds.splice(index, 1);
      vertices.splice(samplings * 3 * nacum, nroutes * samplings * 3);
      colors.splice(samplings * 4 * nacum, nroutes * samplings * 4);
      indices.splice((samplings - 1) * 2 * nacum, nroutes * (samplings - 1) * 2);

      for (var i = (samplings - 1) * 2 * nacum, l = indices.length; i < l; i++) {
        indices[i] -= (samplings * nroutes);
      }
      airlines.vertices = vertices;
      airlines.colors = colors;
      airlines.indices = indices;
      airlines.dynamic = true;

      //unset color for airline Id.
      availableColors[color]--;
      delete airlineIdColor[airline];
    },

    //creates a quadratic bezier curve as a route
    createRoute: function(route, offset, color) {
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
          pColor = [],
          pIndices = [],
          t = 0,
          count = 0,
          samplings = 10,
          deltat = 1 / samplings,
          pt;

      //transform color to webgl format.
      color = color.split(',');
      for (var i = 0; i < 3; i++) {
        color[i] /= (255 * 1.7);
      }
      color[3] = 1;
      
      while(samplings--) {
        //quadratic bezier curve
        pt = p1.scale((1 - t) * (1 - t)).$add(p3.scale(2 * (1 - t) * t)).$add(p2.scale(t * t));
        pArray.push(pt.x, pt.y, pt.z);
        pColor.push.apply(pColor, color);
        if (t != 0) {
          pIndices.push(count, count + 1);
          count++;
        }
        t += deltat;
      }

      return {
        vertices: pArray,
        colors: pColor,
        indices: pIndices.map(function(i) { return i + offset; }),
        p1: p1,
        p2: p2
      };
    }
  };

};

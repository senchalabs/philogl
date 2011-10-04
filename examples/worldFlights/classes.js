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

//AirlineManager
//Takes care of adding and removing routes
//for the selected airlines
var AirlineManager = function(data, models) {

  return {
    
    airlineIds: [],

    add: function(airline) {
      var airlineIds = this.airlineIds,
          routes = data.airlinesRoutes[airline],
          airlines = models.airlines,
          slice = Array.prototype.slice,
          vertices = slice.call(airlines.vertices || []),
          indices = slice.call(airlines.indices || []),
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
          slice = Array.prototype.slice,
          vertices = slice.call(airlines.vertices),
          indices = slice.call(airlines.indices),
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
      airlines.vertices = vertices;
      airlines.indices = indices;
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
        //quadratic bezier curve
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
        indices: pIndices.map(function(i) { return i + offset; }),
        p1: p1,
        p2: p2
      };
    }
  };

};

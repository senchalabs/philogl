importScripts('../../build/PhiloGL.js');

PhiloGL.unpack(self);

onmessage = function(e) {
  var cities = e.data,
      citiesLayer = createCitiesLayer(cities);

  postMessage(citiesLayer);
};

function createCitiesLayer(cities) {
  var pi = Math.PI,
      pi2 = pi * 2,
      sin = Math.sin,
      cos = Math.cos,
      index = 0,
      cityIndex = {},
      vertices = [],
      normals = [],
      colors = [],
      pickingColors = [],
      indices = [],
      vertexCount = 0;

  for (var prop in cities) {
    var city = cities[prop],
        //lat
        theta = (+city[2] + 90) / 180 * pi,
        //long
        phi = (+city[3] + 90) / 180 * pi2,
        sinTheta = sin(theta),
        cosTheta = cos(theta),
        sinPhi = sin(phi),
        cosPhi = cos(phi),
        ux = cosTheta * sinPhi,
        uy = cosPhi,
        uz = sinTheta * sinPhi,
        coords = [ux, uy, uz],
        r = 0,
        g = ((index / 256) >> 0) % 256,
        b = index % 256,
        sphere = new O3D.Sphere({
          nlat: 5,
          nlong: 5,
          radius: 1 / 10,
          pickingColors: [r, g, b, 1],
          colors: [0.9, 0.1, 0.1, 1]
        }),
        tvertices = sphere.vertices.map(function(v, i) { return coords[i % 3] + v; });

    vertices.push.apply(vertices, tvertices);
    normals.push.apply(normals, sphere.normals);
    colors.push.apply(colors, sphere.colors);
    pickingColors.push.apply(pickingColors, sphere.pickingColors);
    indices.push.apply(indices, sphere.indices.map(function(index) { return index + vertexCount; }));
    cityIndex[prop] = index++;

    vertexCount += tvertices.length;
  }

  return {
    pickable: true,
    vertices: vertices,
    normals: normals,
    indices: indices,
    colors: colors,
    pickingColors: pickingColors,
    cityIndex: cityIndex,
    program: 'cities'
  };
}

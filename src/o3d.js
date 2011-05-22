//o3d.js
//Scene Objects

(function () {
  //Define some locals
  var Vec3 = PhiloGL.Vec3,
      Mat4 = PhiloGL.Mat4,
      cos = Math.cos,
      sin = Math.sin,
      pi = Math.PI,
      max = Math.max,
      flatten = function(arr) {
        if (arr && arr.length && $.type(arr[0]) == 'array') 
          return [].concat.apply([], arr);
        return arr;
      };
  
  //Model repository
  var O3D = {};

  //Model abstract O3D Class
  O3D.Model = function(opt) {
    this.$$family = 'model';

    this.pickable = !!opt.pickable;
    this.vertices = flatten(opt.vertices);
    this.faces = flatten(opt.faces);
    this.normals = flatten(opt.normals);
    this.textures = opt.textures && $.splat(opt.textures);
    this.centroids = flatten(opt.centroids);
    this.colors = flatten(opt.colors);
    this.indices = flatten(opt.indices);
    this.shininess = opt.shininess || 0;
    this.uniforms = opt.uniforms || {};
    this.render = opt.render;
    this.drawType = opt.drawType;
    this.display = 'display' in opt? opt.display : true;
    if (opt.texCoords) {
      this.texCoords = $.type(opt.texCoords) == 'object'? opt.texCoords : flatten(opt.texCoords);
    }
    this.onBeforeRender = opt.onBeforeRender || $.empty;
    this.onAfterRender = opt.onAfterRender || $.empty;
    if (opt.program) {
      this.program = opt.program;
    }

    this.position = new Vec3;
    this.rotation = new Vec3;
    this.scale = new Vec3(1, 1, 1);
    this.matrix = new Mat4;
    
    //Set a color per vertex if this is not the case
    this.normalizeColors();

    if (opt.computeCentroids) {
      this.computeCentroids();
    }
    if (opt.computeNormals) {
      this.computeNormals();
    }
  
  };

  //Shader setter mixin
  var setters = {
    
    setUniforms: function(program) {
      program.setUniforms(this.uniforms);
    },
    
    setShininess: function(program) {
      program.setUniform('shininess', this.shininess || 0);
    },
    
    setVertices: function(program, force) {
      if (!this.vertices) return;

      if (force || this.dynamic) {
        program.setBuffer('vertices-' + this.id, {
          attribute: 'position',
          value: this.toFloat32Array('vertices'),
          size: 3
        });
      } else {
        program.setBuffer('vertices-' + this.id);
      }
    },

    unsetVertices: function(program) {
      program.setBuffer('vertices-' + this.id, false);
    },
    
    setNormals: function(program, force) {
      if (!this.normals) return;

      if (force || this.dynamic) {
        program.setBuffer('normals-' + this.id, {
          attribute: 'normal',
          value: this.toFloat32Array('normals'),
          size: 3
        });
      } else {
        program.setBuffer('normals-' + this.id);
      }
    },

    unsetNormals: function(program) {
      program.setBuffer('normals-' + this.id, false);
    },

    setIndices: function(program, force) {
      if (!this.indices) return;

      if (force || this.dynamic) {
        program.setBuffer('indices-' + this.id, {
          bufferType: gl.ELEMENT_ARRAY_BUFFER,
          drawType: gl.STATIC_DRAW,
          value: this.toUint16Array('indices'),
          size: 1
        });
      } else {
        program.setBuffer('indices-' + this.id);
      }
    },

    unsetIndices: function(program) {
      program.setBuffer('indices-' + this.id, false);
    },

    setColors: function(program, force) {
      if (!this.colors) return;

      if (force || this.dynamic) {
        program.setBuffer('colors-' + this.id, {
          attribute: 'color',
          value: this.toFloat32Array('colors'),
          size: 4
        });
      } else {
        program.setBuffer('colors-' + this.id);
      }
    },

    unsetColors: function(program) {
      program.setBuffer('colors-' + this.id, false);
    },

    setTexCoords: function(program, force) {
      if (!this.texCoords) return; 

      var id = this.id;

      if (force || this.dynamic) {
        //If is an object containing textureName -> textureCoordArray
        //Set all textures, samplers and textureCoords.
        if ($.type(this.texCoords) == 'object') {
          this.textures.forEach(function(tex, i) {
            program.setBuffer('texCoords-' + i + '-' + id, {
              attribute: 'texCoord' + (i + 1),
              value: new Float32Array(this.texCoords[tex]),
              size: 2
            });
          });
        //An array of textureCoordinates
        } else {
          program.setBuffer('texCoords-' + id, {
            attribute: 'texCoord1',
            value: this.toFloat32Array('texCoords'),
            size: 2
          });
        }
      } else {
        if ($.type(this.texCoords) == 'object') {
          this.textures.forEach(function(tex, i) {
            program.setBuffer('texCoords-' + i + '-' + id);
          });
        } else {
          program.setBuffer('texCoords-' + id);
        }
      }
    },

    unsetTexCoords: function(program) {
      program.setBuffer('texCoords-' + this.id, false);
    },

    setTextures: function(program, force) {
      this.textures = this.textures? $.splat(this.textures) : [];
      for (var i = 0, texs = this.textures, l = texs.length, mtexs = PhiloGL.Scene.MAX_TEXTURES; i < mtexs; i++) {
        if (i < l) {
          program.setUniform('hasTexture' + (i + 1), true);
          program.setUniform('sampler' + (i + 1), i);
          program.setTexture(texs[i], gl['TEXTURE' + i]);
        } else {
          program.setUniform('hasTexture' + (i + 1), false);
        }
      }
    }
 };


  O3D.Model.prototype = {
    
    update: function() {
      var matrix = this.matrix,
          pos = this.position,
          rot = this.rotation,
          scale = this.scale;

      matrix.id();
      matrix.$translate(pos.x, pos.y, pos.z);
      matrix.$rotateXYZ(rot.x, rot.y, rot.z);
      matrix.$scale(scale.x, scale.y, scale.z);
    },

    toFloat32Array: function(name) {
      return new Float32Array(this[name]);
    },

    toUint16Array: function(name) {
      return new Uint16Array(this[name]);
    },
    
    normalizeColors: function() {
      if (!this.vertices) return;

      var lv = this.vertices.length * 4 / 3;
      if (this.colors && this.colors.length < lv) {
        var times = lv / this.colors.length,
            colors = this.colors,
            colorsCopy = colors.slice();
        while (--times) {
          colors.push.apply(colors, colorsCopy);
        }
      }
    },
 
    computeCentroids: function() {
      var faces = this.faces,
          vertices = this.vertices,
          centroids = [];

      faces.forEach(function(face) {
        var centroid = [0, 0, 0],
            acum = 0;
        
        face.forEach(function(idx) {
          var vertex = vertices[idx];
          
          centroid[0] += vertex[0];
          centroid[1] += vertex[1];
          centroid[2] += vertex[2];
          acum++;
        
        });

        centroid[0] /= acum;
        centroid[1] /= acum;
        centroid[2] /= acum;

        centroids.push(centroid);
      
      });

      this.centroids = centroids;
    },

    computeNormals: function() {
      var faces = this.faces,
          vertices = this.vertices,
          normals = [];

      faces.forEach(function(face) {
        var v1 = vertices[face[0]],
            v2 = vertices[face[1]],
            v3 = vertices[face[2]],
            dir1 = {
              x: v3[0] - v2[0],
              y: v3[1] - v2[1],
              z: v3[1] - v2[2]
            },
            dir2 = {
              x: v1[0] - v2[0],
              y: v1[1] - v2[1],
              z: v1[2] - v2[2]
            };

        Vec3.$cross(dir2, dir1);
        
        if (Vec3.norm(dir2) > 1e-6) {
          Vec3.unit(dir2);
        }
        
        normals.push([dir2.x, dir2.y, dir2.z]);
      
      });

      this.normals = normals;
    }

  };
  
  //Apply our setters mixin
  $.extend(O3D.Model.prototype, setters);
/*
  //O3D.Group will group O3D elements into one group
  O3D.Group = function(opt) {
    O3D.Model.call(this, opt);
    this.models = [];
  };

  O3D.Group.prototype = Object.create(O3D.Model.prototype, {
    //Add model(s)
    add: {
      value: function() {
        this.models.push.apply(this.models, Array.prototype.slice.call(arguments));
      }
    },
    updateProperties: {
      value: function(propertyNames) {
        var vertices = [],
            normals = [],
            colors = [],
            texCoords = [],
            textures = [],
            indices = [],
            lastIndex = 0,

            doVertices = 'vertices' in propertyNames,
            doNormals = 'normals' in propertyNames,
            doColors = 'colors' in propertyNames,
            doTexCoords = 'texCoords' in propertyNames,
            doTextures = 'textures' in propertyNames,
            doIndices = 'indices' in propertyNames,

            view = new PhiloGL.Mat4;

        for (var i = 0, models = this.models, l = models.length; i < l; i++) {
          var model = models[i];
          //transform vertices and transform normals
          vertices.push.apply(vertices, model.vertices || []);
          normals.push.apply(normals, model.normals || []);

          texCoords.push.apply(texCoords, model.texCoords || []);
          textures.push.apply(textures, model.textures || []);
          colors.push.apply(colors, model.colors || []);
          //Update indices
          (function(model, lastIndex) {
            indices.push.apply(indices, (model.indices || []).map(function(n) { return n + lastIndex; }));
          })(model, lastIndex);
          lastIndex = Math.max.apply(Math, indices) +1;
        }

        this.vertices = !!vertices.length && vertices;
        this.normals = !!normals.length && normals;
        this.texCoords = !!texCoords.length && texCoords;
        this.textures = !!textures.length && textures;
        this.colors = !!colors.length && colors;
        this.indices = !!indices.length && indices;
      }
    }
});    
*/
  //Now some primitives, Cube, Sphere, Cone, Cylinder
  //Cube
  O3D.Cube = function(config) {
    O3D.Model.call(this, $.extend({
      vertices: [-1, -1,  1,
                 1, -1,  1,
                 1,  1,  1,
                -1,  1,  1,

                -1, -1, -1,
                -1,  1, -1,
                 1,  1, -1,
                 1, -1, -1,

                -1,  1, -1,
                -1,  1,  1,
                 1,  1,  1,
                 1,  1, -1,

                -1, -1, -1,
                 1, -1, -1,
                 1, -1,  1,
                -1, -1,  1,

                 1, -1, -1,
                 1,  1, -1,
                 1,  1,  1,
                 1, -1,  1,

                -1, -1, -1,
                -1, -1,  1,
                -1,  1,  1,
                -1,  1, -1],

      texCoords: [0.0, 0.0,
                  1.0, 0.0,
                  1.0, 1.0,
                  0.0, 1.0,

                  // Back face
                  1.0, 0.0,
                  1.0, 1.0,
                  0.0, 1.0,
                  0.0, 0.0,

                  // Top face
                  0.0, 1.0,
                  0.0, 0.0,
                  1.0, 0.0,
                  1.0, 1.0,

                  // Bottom face
                  1.0, 1.0,
                  0.0, 1.0,
                  0.0, 0.0,
                  1.0, 0.0,

                  // Right face
                  1.0, 0.0,
                  1.0, 1.0,
                  0.0, 1.0,
                  0.0, 0.0,

                  // Left face
                  0.0, 0.0,
                  1.0, 0.0,
                  1.0, 1.0,
                  0.0, 1.0],

      normals: [
        // Front face
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,

        // Back face
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,

        // Top face
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,

        // Bottom face
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,

        // Right face
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,

        // Left face
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0
      ],
      
      indices: [0, 1, 2, 0, 2, 3,
                4, 5, 6, 4, 6, 7,
                8, 9, 10, 8, 10, 11,
                12, 13, 14, 12, 14, 15,
                16, 17, 18, 16, 18, 19,
                20, 21, 22, 20, 22, 23]

    }, config || {}));
  };

  O3D.Cube.prototype = Object.create(O3D.Model.prototype);
  
  //Primitives constructors inspired by TDL http://code.google.com/p/webglsamples/, 
  //copyright 2011 Google Inc. new BSD License (http://www.opensource.org/licenses/bsd-license.php).

  O3D.Sphere = function(opt) {
       var nlat = opt.nlat || 10,
           nlong = opt.nlong || 10,
           radius = opt.radius || 1,
           startLat = 0,
           endLat = pi,
           latRange = endLat - startLat,
           startLong = 0,
           endLong = 2 * pi,
           longRange = endLong - startLong,
           numVertices = (nlat + 1) * (nlong + 1),
           vertices = [],
           normals = [],
           texCoords = [],
           indices = [];

      //Add a callback for when a vertex is created
      opt.onAddVertex = opt.onAddVertex || $.empty;

      //radius to be a function instead of fixed number
      if (typeof radius == 'number') {
        var value = radius;
        radius = function(n1, n2, n3, u, v) {
          return value;
        };
      }

      //Create vertices, normals and texCoords
      for (var x = 0; x <= nlong; x++) {
        for (var y = 1; y <= nlat; y++) {
          var u = x / nlong,
              v = y / nlat,
              theta = longRange * u,
              phi = latRange * v,
              sinTheta = sin(theta),
              cosTheta = cos(theta),
              sinPhi = sin(phi),
              cosPhi = cos(phi),
              ux = cosTheta * sinPhi,
              uy = cosPhi,
              uz = sinTheta * sinPhi,
              r = radius(ux, uy, uz, u, v),
              vx = r * ux,
              vy = r * uy,
              vz = r * uz;

          vertices.push(vx, vy, vz);
          normals.push(ux, uy, uz);
          texCoords.push(v, u);
          
          //callback
          opt.onAddVertex({
            rho: r,
            theta: theta,
            phi: phi,
            lat: x,
            lon: y,
            x: vx,
            y: vy,
            z: vz,
            nx: ux,
            ny: uy,
            nz: uz,
            u: u,
            v: v
          });
        }
      }
      //Create indices
      var numVertsAround = nlat + 1;
      for (x = 0; x < nlong; x++) {
        for (y = 0; y < nlat; y++) {
          
          indices.push(x * numVertsAround + y,
                      x * numVertsAround + y + 1,
                      (x + 1) * numVertsAround + y);

          indices.push((x + 1) * numVertsAround + y,
                       x * numVertsAround + y + 1,
                       (x + 1) * numVertsAround + y + 1);
        }
      }
      
      O3D.Model.call(this, $.extend({
        vertices: vertices,
        indices: indices,
        normals: normals,
        texCoords: texCoords
      }, opt || {}));
  };

  O3D.Sphere.prototype = Object.create(O3D.Model.prototype);
  
  O3D.TruncatedCone = function(config) {
    var bottomRadius = config.bottomRadius || 0,
        topRadius = config.topRadius || 0,
        height = config.height || 1,
        nradial = config.nradial || 10,
        nvertical = config.nvertical || 10,
        topCap = !!config.topCap,
        bottomCap = !!config.bottomCap,
        extra = (topCap? 2 : 0) + (bottomCap? 2 : 0),
        numVertices = (nradial + 1) * (nvertical + 1 + extra),
        vertices = [],
        normals = [],
        texCoords = [],
        indices = [],
        vertsAroundEdge = nradial + 1,
        slant = Math.atan2(bottomRadius - topRadius, height),
        math = Math,
        msin = math.sin,
        mcos = math.cos,
        mpi = math.PI,
        cosSlant = mcos(slant),
        sinSlant = msin(slant),
        start = topCap? -2 : 0,
        end = nvertical + (bottomCap? 2 : 0);

    for (var i = start; i <= end; i++) {
      var v = i / nvertical,
          y = height * v,
          ringRadius;
      
      if (i < 0) {
        y = 0;
        v = 1;
        ringRadius = bottomRadius;
      } else if (i > nvertical) {
        y = height;
        v = 1;
        ringRadius = topRadius;
      } else {
        ringRadius = bottomRadius +
          (topRadius - bottomRadius) * (i / nvertical);
      }
      if (i == -2 || i == nvertical + 2) {
        ringRadius = 0;
        v = 0;
      }
      y -= height / 2;
      for (var j = 0; j < vertsAroundEdge; j++) {
        var sin = msin(j * mpi * 2 / nradial);
        var cos = mcos(j * mpi * 2 / nradial);
        vertices.push(sin * ringRadius, y, cos * ringRadius);
        normals.push(
            (i < 0 || i > nvertical) ? 0 : (sin * cosSlant),
            (i < 0) ? -1 : (i > nvertical ? 1 : sinSlant),
            (i < 0 || i > nvertical) ? 0 : (cos * cosSlant));
        texCoords.push(j / nradial, v);
      }
    }

    for (i = 0; i < nvertical + extra; i++) {
      for (j = 0; j < nradial; j++) {
        indices.push(vertsAroundEdge * (i + 0) + 0 + j,
                     vertsAroundEdge * (i + 0) + 1 + j,
                     vertsAroundEdge * (i + 1) + 1 + j,
                      
                     vertsAroundEdge * (i + 0) + 0 + j,
                     vertsAroundEdge * (i + 1) + 1 + j,
                     vertsAroundEdge * (i + 1) + 0 + j);
      }
    }

    O3D.Model.call(this, $.extend({
      vertices: vertices,
      normals: normals,
      texCoords: texCoords,
      indices: indices
    }, config || {}));
  };
  
  O3D.TruncatedCone.prototype = Object.create(O3D.Model.prototype);
  
  O3D.Cone = function(config) {
    config.topRadius = 0;
    config.topCap = !!config.cap;
    config.bottomCap = !!config.cap;
    config.bottomRadius = config.radius || 3;
    O3D.TruncatedCone.call(this, config);
  };

  O3D.Cone.prototype = Object.create(O3D.TruncatedCone.prototype);

  O3D.Cylinder = function(config) {
    config.bottomRadius = config.radius;
    config.topRadius = config.radius;
    O3D.TruncatedCone.call(this, config);
  };

  O3D.Cylinder.prototype = Object.create(O3D.TruncatedCone.prototype);
  

  O3D.PlaneXZ = function(config) {
    var width = config.width,
        height = config.height || 0,
        subdivisionsWidth = config.nwidth || 1,
        depth = config.depth,
        subdivisionsDepth = config.ndepth || 1,
        numVertices = (subdivisionsWidth + 1) * (subdivisionsDepth + 1),
        positions = [],
        normals = [],
        texCoords = [];

  for (var z = 0; z <= subdivisionsDepth; z++) {
    for (var x = 0; x <= subdivisionsWidth; x++) {
      var u = x / subdivisionsWidth,
          v = z / subdivisionsDepth;
      
      positions.push(width * u - width * 0.5,
                     height,
                     depth * v - depth * 0.5);
      normals.push(0, 1, 0);
      texCoords.push(u, v);
    }
  }

  var numVertsAcross = subdivisionsWidth + 1,
      indices = [];

  for (z = 0; z < subdivisionsDepth; z++) {
    for (x = 0; x < subdivisionsWidth; x++) {
      // Make triangle 1 of quad.
      indices.push((z + 0) * numVertsAcross + x,
                   (z + 1) * numVertsAcross + x,
                   (z + 0) * numVertsAcross + x + 1);

      // Make triangle 2 of quad.
      indices.push((z + 1) * numVertsAcross + x,
                   (z + 1) * numVertsAcross + x + 1,
                   (z + 0) * numVertsAcross + x + 1);
    }
  }

  O3D.Model.call(this, $.extend({
    vertices: positions,
    normals: normals,
    texCoords: texCoords,
    indices: indices
  }, config));

};

O3D.PlaneXZ.prototype = Object.create(O3D.Model.prototype);

  //Assign to namespace
  PhiloGL.O3D = O3D;
})();

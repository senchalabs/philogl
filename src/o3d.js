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
      slice = Array.prototype.slice;
  
  function normalizeColors(arr, len) {
    if (arr && arr.length < len) {
      var a0 = arr[0],
          a1 = arr[1],
          a2 = arr[2],
          a3 = arr[3],
          ans = [a0, a1, a2, a3],
          times = len / arr.length,
          index;
      
      while (--times) {
        index = times * 4;
        ans[index    ] = a0;
        ans[index + 1] = a1;
        ans[index + 2] = a2;
        ans[index + 3] = a3;
      }

      return new Float32Array(ans);
    } else {
      return arr;
    }
  }
  
  //Model repository
  var O3D = {};

  //Model abstract O3D Class
  O3D.Model = function(opt) {
    opt = opt || {};
    this.id = opt.id || $.uid();
    //picking options
    this.pickable = !!opt.pickable;
    this.pick = opt.pick || function() { return false; };
    if (opt.pickingColors) {
      this.pickingColors = opt.pickingColors;
    }

    this.vertices = opt.vertices;
    this.normals = opt.normals;
    this.textures = opt.textures && $.splat(opt.textures);
    this.colors = opt.colors;
    this.indices = opt.indices;
    this.shininess = opt.shininess || 0;
    this.reflection = opt.reflection || 0;
    this.refraction = opt.refraction || 0;

    if (opt.texCoords) {
      this.texCoords = opt.texCoords;
    }

    //extra uniforms
    this.uniforms = opt.uniforms || {};
    //extra attribute descriptors
    this.attributes = opt.attributes || {};
    //override the render method
    this.render = opt.render;
    //whether to render as triangles, lines, points, etc.
    this.drawType = opt.drawType || 'TRIANGLES';
    //whether to display the object at all
    this.display = 'display' in opt? opt.display : true;
    //before and after render callbacks
    this.onBeforeRender = opt.onBeforeRender || $.empty;
    this.onAfterRender = opt.onAfterRender || $.empty;
    //set a custom program per o3d
    if (opt.program) {
      this.program = opt.program;
    }
    //model position, rotation, scale and all in all matrix
    this.position = new Vec3;
    this.rotation = new Vec3;
    this.scale = new Vec3(1, 1, 1);
    this.matrix = new Mat4;

    if (opt.computeCentroids) {
      this.computeCentroids();
    }

    if (opt.computeNormals) {
      this.computeNormals();
    }
  
  };

  //Buffer setter mixin
  var Setters = {
    
    setUniforms: function(program) {
      program.setUniforms(this.uniforms);
    },

    setAttributes: function(program) {
      var attributes = this.attributes;
      for (var name in attributes) {
        var descriptor = attributes[name],
            bufferId = this.id + '-' + name;
        if (!Object.keys(descriptor).length) {
          program.setBuffer(bufferId, true);
        } else {
          descriptor.attribute = name;
          program.setBuffer(bufferId, descriptor);
          delete descriptor.value;
        }
      }
    },
    
    unsetAttributes: function(program) {
      var attributes = this.attributes;
      for (var name in attributes) {
        var bufferId = this.id + '-' + name;
        program.setBuffer(bufferId, false);
      }
    },

    setShininess: function(program) {
      program.setUniform('shininess', this.shininess || 0);
    },
    
    setReflection: function(program) {
      if (this.reflection || this.refraction) {
        program.setUniforms({
          useReflection: true,
          refraction: this.refraction,
          reflection: this.reflection
        });
      } else {
        program.setUniform('useReflection', false);
      }
    },
    
    setVertices: function(program, force) {
      if (!this.vertices) return;

      if (force || this.dynamic) {
        program.setBuffer('vertices-' + this.id, {
          attribute: 'position',
          value: this.vertices,
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
          value: this.normals,
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
          value: this.indices,
          size: 1
        });
      } else {
        program.setBuffer('indices-' + this.id);
      }
    },

    unsetIndices: function(program) {
      program.setBuffer('indices-' + this.id, false);
    },

    setPickingColors: function(program, force) {
      if (!this.pickingColors) return;

      if (force || this.dynamic) {
        program.setBuffer('pickingColors-' + this.id, {
          attribute: 'pickingColor',
          value: this.pickingColors,
          size: 4
        });
      } else {
        program.setBuffer('pickingColors-' + this.id);
      }
    },

    unsetPickingColors: function(program) {
      program.setBuffer('pickingColors-' + this.id, false);
    },
    
    setColors: function(program, force) {
      if (!this.colors) return;

      if (force || this.dynamic) {
        program.setBuffer('colors-' + this.id, {
          attribute: 'color',
          value: this.colors,
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
              value: this.texCoords[tex],
              size: 2
            });
          });
        //An array of textureCoordinates
        } else {
          program.setBuffer('texCoords-' + id, {
            attribute: 'texCoord1',
            value: this.texCoords,
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
      var dist = 5;
      for (var i = 0, texs = this.textures, l = texs.length, mtexs = PhiloGL.Scene.MAX_TEXTURES; i < mtexs; i++) {
        if (i < l) {
          var isCube = app.textureMemo[texs[i]].isCube;
          if (isCube) {
            program.setUniform('hasTextureCube' + (i + 1), true);
            program.setTexture(texs[i], gl['TEXTURE' + (i + dist)]);
          } else {
            program.setUniform('hasTexture' + (i + 1), true);
            program.setTexture(texs[i], gl['TEXTURE' + i]);
          }
        } else {
          program.setUniform('hasTextureCube' + (i + 1), false);
          program.setUniform('hasTexture' + (i + 1), false);
        }
        program.setUniform('sampler' + (i + 1), i);
        program.setUniform('samplerCube' + (i + 1), i + dist);
      }
    }
 };
  
  //ensure known attributes use typed arrays
  O3D.Model.prototype = Object.create(null, {
    vertices: {
      set: function(val) {
        if (!val) {
            delete this.$vertices;
            delete this.$verticesLength;
            return;
        } 
        var vlen = val.length;
        if (val.BYTES_PER_ELEMENT) {
          this.$vertices = val;
        } else {
          if (this.$verticesLength == vlen) {
            this.$vertices.set(val);
          } else {
            this.$vertices = new Float32Array(val);
          }
        }
        this.$verticesLength = vlen;
      },
      get: function() {
        return this.$vertices;
      }
    },
    
    normals: {
      set: function(val) {
        if (!val) {
            delete this.$normals;
            delete this.$normalsLength;
            return;
        } 
        var vlen = val.length;
        if (val.BYTES_PER_ELEMENT) {
          this.$normals = val;
        } else {
          if (this.$normalsLength == vlen) {
            this.$normals.set(val);
          } else {
            this.$normals = new Float32Array(val);
          }
        }
        this.$normalsLength = vlen;
      },
      get: function() {
        return this.$normals;
      }
    },
    
    colors: {
      set: function(val) {
        if (!val) {
            delete this.$colors;
            delete this.$colorsLength;
            return;
        } 
        var vlen = val.length;
        if (val.BYTES_PER_ELEMENT) {
          this.$colors = val;
        } else {
          if (this.$colorsLength == vlen) {
            this.$colors.set(val);
          } else {
            this.$colors = new Float32Array(val);
          }
        }
        if (this.$vertices && this.$verticesLength / 3 * 4 != vlen) {
          this.$colors = normalizeColors(slice.call(this.$colors), this.$verticesLength / 3 * 4);
        }
        this.$colorsLength = this.$colors.length;
      },
      get: function() {
        return this.$colors;
      }
    },
    
    pickingColors: {
      set: function(val) {
        if (!val) {
            delete this.$pickingColors;
            delete this.$pickingColorsLength;
            return;
        } 
        var vlen = val.length;
        if (val.BYTES_PER_ELEMENT) {
          this.$pickingColors = val;
        } else {
          if (this.$pickingColorsLength == vlen) {
            this.$pickingColors.set(val);
          } else {
            this.$pickingColors = new Float32Array(val);
          }
        }
        if (this.$vertices && this.$verticesLength / 3 * 4 != vlen) {
          this.$pickingColors = normalizeColors(slice.call(this.$pickingColors), this.$verticesLength / 3 * 4);
        }
        this.$pickingColorsLength = this.$pickingColors.length;
      },
      get: function() {
        return this.$pickingColors;
      }
    },
    
    texCoords: {
      set: function(val) {
        if (!val) {
            delete this.$texCoords;
            delete this.$texCoordsLength;
            return;
        } 
        if ($.type(val) == 'object') {
          var ans = {};
          for (var prop in val) {
            var texCoordArray = val[prop];
            ans[prop] = texCoordArray.BYTES_PER_ELEMENT ? texCoordArray : new Float32Array(texCoordArray);
          }
          this.$texCoords = ans;
        } else {
          var vlen = val.length;
          if (val.BYTES_PER_ELEMENT) {
            this.$texCoords = val;
          } else {
            if (this.$texCoordsLength == vlen) {
              this.$texCoords.set(val);
            } else {
              this.$texCoords = new Float32Array(val);
            }
          }
          this.$texCoordsLength = vlen;
        }
      },
      get: function() {
        return this.$texCoords;
      }
    },

    indices: {
      set: function(val) {
        if (!val) {
            delete this.$indices;
            delete this.$indicesLength;
            return;
        } 
        var vlen = val.length;
        if (val.BYTES_PER_ELEMENT) {
          this.$indices = val;
        } else {
          if (this.$indicesLength == vlen) {
            this.$indices.set(val);
          } else {
            this.$indices = new Uint16Array(val);
          }
        }
        this.$indicesLength = vlen;
      },
      get: function() {
        return this.$indices;
      }
    }
    
  });

  $.extend(O3D.Model.prototype, {
    $$family: 'model',

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

  });
  
  //Apply our Setters mixin
  $.extend(O3D.Model.prototype, Setters);

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
           vertices = new Float32Array(numVertices * 3),
           normals = new Float32Array(numVertices * 3),
           texCoords = new Float32Array(numVertices * 2),
           indices = new Uint16Array(nlat * nlong * 6);

      if (typeof radius == 'number') {
        var value = radius;
        radius = function(n1, n2, n3, u, v) {
          return value;
        };
      }
      //Create vertices, normals and texCoords
      for (var y = 0; y <= nlat; y++) {
        for (var x = 0; x <= nlong; x++) {
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
              index = x + y * (nlong + 1),
              i3 = index * 3,
              i2 = index * 2;

          vertices[i3 + 0] = r * ux;
          vertices[i3 + 1] = r * uy;
          vertices[i3 + 2] = r * uz;

          normals[i3 + 0] = ux;
          normals[i3 + 1] = uy;
          normals[i3 + 2] = uz;

          texCoords[i2 + 0] = u;
          texCoords[i2 + 1] = v;
        }
      }

      //Create indices
      var numVertsAround = nlat + 1;
      for (x = 0; x < nlat; x++) {
        for (y = 0; y < nlong; y++) {
          var index = (x * nlong + y) * 6;
          
          indices[index + 0] = y * numVertsAround + x;
          indices[index + 1] = y * numVertsAround + x + 1;
          indices[index + 2] = (y + 1) * numVertsAround + x;
          
          indices[index + 3] = (y + 1) * numVertsAround + x;
          indices[index + 4] = y * numVertsAround + x + 1;
          indices[index + 5] = (y + 1) * numVertsAround + x + 1;
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

  //Code based on http://blog.andreaskahler.com/2009/06/creating-icosphere-mesh-in-code.html
  O3D.IcoSphere = function(opt) {
    var iterations = opt.iterations || 0,
        vertices = [],
        indices = [],
        sqrt = Math.sqrt,
        acos = Math.acos,
        atan2 = Math.atan2,
        pi = Math.PI,
        pi2 = pi * 2;
    
    //Add a callback for when a vertex is created
    opt.onAddVertex = opt.onAddVertex || $.empty;

    // and Icosahedron vertices
    var t = (1 + sqrt(5)) / 2,
        len = sqrt(1 + t * t);

    vertices.push(-1 / len,  t / len,  0,
                   1 / len,  t / len,  0,
                  -1 / len, -t / len,  0,
                   1 / len, -t / len,  0,

                   0, -1 / len,  t / len,
                   0,  1 / len,  t / len,
                   0, -1 / len, -t / len,
                   0,  1 / len, -t / len,

                   t / len,  0, -1 / len,
                   t / len,  0,  1 / len,
                  -t / len,  0, -1 / len,
                  -t / len,  0,  1 / len);

    
      indices.push(0, 11, 5,
                 0, 5, 1,
                 0, 1, 7,
                 0, 7, 10,
                 0, 10, 11,

                 1, 5, 9,
                 5, 11, 4,
                 11, 10, 2,
                 10, 7, 6,
                 7, 1, 8,

                 3, 9, 4,
                 3, 4, 2,
                 3, 2, 6,
                 3, 6, 8,
                 3, 8, 9,

                 4, 9, 5,
                 2, 4, 11,
                 6, 2, 10,
                 8, 6, 7,
                 9, 8, 1);

    var getMiddlePoint = (function() {
      var pointMemo = {};
      
      return function(i1, i2) {
        i1 *= 3;
        i2 *= 3;
        var mini = i1 < i2 ? i1 : i2,
            maxi = i1 > i2 ? i1 : i2,
            key = mini + '|' + maxi;

        if (key in pointMemo) {
          return pointMemo[key];
        }

        var x1 = vertices[i1    ],
            y1 = vertices[i1 + 1],
            z1 = vertices[i1 + 2],
            x2 = vertices[i2    ],
            y2 = vertices[i2 + 1],
            z2 = vertices[i2 + 2],
            xm = (x1 + x2) / 2,
            ym = (y1 + y2) / 2,
            zm = (z1 + z2) / 2,
            len = sqrt(xm * xm + ym * ym + zm * zm);

        xm /= len;
        ym /= len;
        zm /= len;

        vertices.push(xm, ym, zm);

        return (pointMemo[key] = (vertices.length / 3 - 1));
      };
    })();

    for (var i = 0; i < iterations; i++) {
      var indices2 = [];
      for (var j = 0, l = indices.length; j < l; j += 3) {
        var a = getMiddlePoint(indices[j    ], indices[j + 1]),
            b = getMiddlePoint(indices[j + 1], indices[j + 2]),
            c = getMiddlePoint(indices[j + 2], indices[j    ]);

        indices2.push(indices[j], a, c,
                      indices[j + 1], b, a,
                      indices[j + 2], c, b,
                      a, b, c);
      }
      indices = indices2;
    }

    //Calculate texCoords and normals
    var l = indices.length,
        normals = new Float32Array(l * 3),
        texCoords = new Float32Array(l * 2);

    for (var i = 0; i < l; i += 3) {
      var i1 = indices[i    ],
          i2 = indices[i + 1],
          i3 = indices[i + 2],
          in1 = i1 * 3,
          in2 = i2 * 3,
          in3 = i3 * 3,
          iu1 = i1 * 2,
          iu2 = i2 * 2,
          iu3 = i3 * 2,
          x1 = vertices[in1    ],
          y1 = vertices[in1 + 1],
          z1 = vertices[in1 + 2],
          theta1 = acos(z1 / sqrt(x1 * x1 + y1 * y1 + z1 * z1)),
          phi1 = atan2(y1, x1),
          v1 = theta1 / pi,
          u1 = 1 - phi1 / pi2,
          x2 = vertices[in2    ],
          y2 = vertices[in2 + 1],
          z2 = vertices[in2 + 2],
          theta2 = acos(z2 / sqrt(x2 * x2 + y2 * y2 + z2 * z2)),
          phi2 = atan2(y2, x2),
          v2 = theta2 / pi,
          u2 = 1 - phi2 / pi2,
          x3 = vertices[in3    ],
          y3 = vertices[in3 + 1],
          z3 = vertices[in3 + 2],
          theta3 = acos(z3 / sqrt(x3 * x3 + y3 * y3 + z3 * z3)),
          phi3 = atan2(y3, x3),
          v3 = theta3 / pi,
          u3 = 1 - phi3 / pi2,
          vec1 = {
            x: x3 - x2,
            y: y3 - y2,
            z: z3 - z2
          },
          vec2 = {
            x: x1 - x2,
            y: y1 - y2,
            z: z1 - z2
          },
          normal = Vec3.cross(vec1, vec2).$unit();

      normals[in1    ] = normals[in2    ] = normals[in3    ] = normal.x;
      normals[in1 + 1] = normals[in2 + 1] = normals[in3 + 1] = normal.y;
      normals[in1 + 2] = normals[in2 + 2] = normals[in3 + 2] = normal.z;
      
      texCoords[iu1    ] = u1;
      texCoords[iu1 + 1] = v1;
      
      texCoords[iu2    ] = u2;
      texCoords[iu2 + 1] = v2;
      
      texCoords[iu3    ] = u3;
      texCoords[iu3 + 1] = v3;
    }

    O3D.Model.call(this, $.extend({
      vertices: vertices,
      indices: indices,
      normals: normals,
      texCoords: texCoords
    }, opt || {}));
  };

  O3D.IcoSphere.prototype = Object.create(O3D.Model.prototype);
  
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
        vertices = new Float32Array(numVertices * 3),
        normals = new Float32Array(numVertices * 3),
        texCoords = new Float32Array(numVertices * 2),
        indices = new Uint16Array(nradial * (nvertical + extra) * 6),
        vertsAroundEdge = nradial + 1,
        math = Math,
        slant = math.atan2(bottomRadius - topRadius, height),
        msin = math.sin,
        mcos = math.cos,
        mpi = math.PI,
        cosSlant = mcos(slant),
        sinSlant = msin(slant),
        start = topCap? -2 : 0,
        end = nvertical + (bottomCap? 2 : 0),
        i3 = 0,
        i2 = 0;

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
        
        vertices[i3 + 0] = sin * ringRadius;
        vertices[i3 + 1] = y;
        vertices[i3 + 2] = cos * ringRadius;
        
        normals[i3 + 0] = (i < 0 || i > nvertical) ? 0 : (sin * cosSlant);
        normals[i3 + 1] = (i < 0) ? -1 : (i > nvertical ? 1 : sinSlant);
        normals[i3 + 2] = (i < 0 || i > nvertical) ? 0 : (cos * cosSlant);

        texCoords[i2 + 0] = j / nradial;
        texCoords[i2 + 1] = v;

        i2 += 2;
        i3 += 3;
      }
    }

    for (i = 0; i < nvertical + extra; i++) {
      for (j = 0; j < nradial; j++) {
        var index = (i * nradial + j) * 6;
        
        indices[index + 0] = vertsAroundEdge * (i + 0) + 0 + j;
        indices[index + 1] = vertsAroundEdge * (i + 0) + 1 + j;
        indices[index + 2] = vertsAroundEdge * (i + 1) + 1 + j;
        indices[index + 3] = vertsAroundEdge * (i + 0) + 0 + j;
        indices[index + 4] = vertsAroundEdge * (i + 1) + 1 + j;
        indices[index + 5] = vertsAroundEdge * (i + 1) + 0 + j;
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
  

  O3D.Plane = function(config) {
    var type = config.type,
        coords = type.split(','),
        c1len = config[coords[0] + 'len'], //width
        c2len = config[coords[1] + 'len'], //height
        subdivisions1 = config['n' + coords[0]] || 1, //subdivisionsWidth
        subdivisions2 = config['n' + coords[1]] || 1, //subdivisionsDepth
        offset = config.offset
        numVertices = (subdivisions1 + 1) * (subdivisions2 + 1),
        positions = new Float32Array(numVertices * 3),
        normals = new Float32Array(numVertices * 3),
        texCoords = new Float32Array(numVertices * 2),
        i2 = 0, i3 = 0;

    for (var z = 0; z <= subdivisions2; z++) {
      for (var x = 0; x <= subdivisions1; x++) {
        var u = x / subdivisions1,
            v = z / subdivisions2;
        
        texCoords[i2 + 0] = u;
        texCoords[i2 + 1] = v;
        i2 += 2;
        
        switch (type) {
          case 'x,y':
            positions[i3 + 0] = c1len * u - c1len * 0.5;
            positions[i3 + 1] = c2len * v - c2len * 0.5;
            positions[i3 + 2] = offset;

            normals[i3 + 0] = 0;
            normals[i3 + 1] = 0;
            normals[i3 + 2] = 1;
          break;

          case 'x,z':
            positions[i3 + 0] = c1len * u - c1len * 0.5;
            positions[i3 + 1] = offset;
            positions[i3 + 2] = c2len * v - c2len * 0.5;

            normals[i3 + 0] = 0;
            normals[i3 + 1] = 1;
            normals[i3 + 2] = 0;
          break;

          case 'y,z':
            positions[i3 + 0] = offset;
            positions[i3 + 1] = c1len * u - c1len * 0.5;
            positions[i3 + 2] = c2len * v - c2len * 0.5;

            normals[i3 + 0] = 1;
            normals[i3 + 1] = 0;
            normals[i3 + 2] = 0;
          break;
        }
        i3 += 3;
      }
    }

    var numVertsAcross = subdivisions1 + 1,
        indices = [];

    for (z = 0; z < subdivisions2; z++) {
      for (x = 0; x < subdivisions1; x++) {
        var index = (z * subdivisions1 + x) * 6;
        // Make triangle 1 of quad.
        indices[index + 0] = (z + 0) * numVertsAcross + x;
        indices[index + 1] = (z + 1) * numVertsAcross + x;
        indices[index + 2] = (z + 0) * numVertsAcross + x + 1;

        // Make triangle 2 of quad.
        indices[index + 3] = (z + 1) * numVertsAcross + x;
        indices[index + 4] = (z + 1) * numVertsAcross + x + 1;
        indices[index + 5] = (z + 0) * numVertsAcross + x + 1;
      }
    }

    O3D.Model.call(this, $.extend({
      vertices: positions,
      normals: normals,
      texCoords: texCoords,
      indices: indices
    }, config));

  };

  O3D.Plane.prototype = Object.create(O3D.Model.prototype);

  //unique id
  O3D.id = $.time();

  //Assign to namespace
  PhiloGL.O3D = O3D;

})();

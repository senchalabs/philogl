//Unpack modules
PhiloGL.unpack();

var Types = {
  SHADOW: 0,
  EARTH: 1
};

//Pairing Heap
function PHeap(elem, subheaps) {
  if (elem && subheaps) {
    this.elem = elem;
    this.subheaps = subheaps;
  } else {
    this.elem = false;
  }
}

(function() {

  function merge(h1, h2) {
    if (!h1 || !h1.elem) {
      return h2;
    } else if (!h2 || !h2.elem) {
      return h1;
    } else if (h1.elem.weight > h2.elem.weight) {
      h1.subheaps.unshift(h2);
      return new PHeap(h1.elem, h1.subheaps);
    } else {
      h2.subheaps.unshift(h1);
      return new PHeap(h2.elem, h2.subheaps);
    }
  }

    
  PHeap.prototype = {
    find: function() {
      if (!this.elem) {
        return null;
      }
      return this.elem;
    },

    insert: function(elem) {
      return merge(this, new PHeap(elem, []));
    },

    erase: function() {
      if (!this.elem) {
        return null;
      } else {
        return this.mergePairs(this.subheaps);
      }
    },

    mergePairs: function(subheaps) {
      var len = subheaps.length;
      if (len == 0) {
        return null;
      } else if (len == 1) {
        return subheaps[0];
      } else {
        return merge(merge(subheaps[0], subheaps[1]), this.mergePairs(subheaps.slice(2)));
      }
    }
  };

})();

//Graph class
function Graph() {
  this.nodes = [];
}

Graph.prototype = {
  addNode: function(index, node) {
    if (!this.nodes[index]) {
      this.nodes[index] = node;
      node.edges = {};
    }
    return this;
  },

  pushNode: function(node) {
    this.nodes.push(node);
    node.edges = {};
  },

  addEdge: function(index1, index2, edge) {
    if (!this.nodes[index1] || !this.nodes[index2]) {
      return this;
    }
    this.nodes[index1].edges[index2] = edge;
    this.nodes[index2].edges[index1] = edge;
    return this;
  },

  getNode: function(index) {
    return this.nodes[index];
  },

  getEdge: function(index1, index2) {
    if (this.nodes[index1]) {
      return this.nodes[index1].edges[index2];
    }
  },

  eachNode: function(fn) {
    this.nodes.forEach(fn);
  }
};

//Globe + Graph + DualGraph for map projection algo.
function Myriad(opt) {
  
  //Make graphs
  var graph = new Graph,
      dual = new Graph;

  O3D.IcoSphere.call(this, Object.create(opt, {
    iterations: {
      value: 4 
    }
  }));

  var vertices = this.vertices,
      normals = this.normals,
      texCoords = this.texCoords,
      acos = Math.acos,
      atan = Math.atan2,
      abs = Math.abs,
      pi = Math.PI,
      sqrt = Math.sqrt;

  for (var i = 0, l = vertices.length / 3; i < l; i++) {
    var i2 = i * 2,
        i3 = i * 3,
        vx = vertices[i3    ],
        vy = vertices[i3 + 1],
        vz = vertices[i3 + 2],
        nx = normals[i3    ],
        ny = normals[i3 + 1],
        nz = normals[i3 + 2],
        u  = texCoords[i2    ],
        v  = texCoords[i2 + 1];
    
    graph.addNode(i, {
      rho: 1,
      phi: Math.atan(vz / sqrt(vx * vx + vy * vy)),
      lambda: atan(vy, vx),
      x: vx,
      y: vy,
      z: vz,
      nx: nx,
      ny: ny,
      nz: nz,
      u: u,
      v: v
    });
  }

  for (var indices = this.indices, l = indices.length, i = 0; i < l; i += 3) {
    var index1 = indices[i],
        index2 = indices[i + 1],
        index3 = indices[i + 2];
    //Add graph edges
    graph.addEdge(index1, index2, {
      n1: i,
      n2: i + 1,
      weight: 0
    });
    
    graph.addEdge(index1, index3, {
      n1: i,
      n2: i + 2,
      weight: 0
    });
    
    graph.addEdge(index2, index3, {
      n1: i + 2,
      n2: i + 1,
      weight: 0
    });
    
    //Add dual graph node
    dual.pushNode({
      indices: [index1, index2, index3],
      nodes: [Object.create(graph.getNode(index1)),
              Object.create(graph.getNode(index2)),
              Object.create(graph.getNode(index3))]
    });
  }

  //Add dual graph edges
  var nodes = dual.nodes;
  for (var i = 0, ln = nodes.length; i < ln; i++) {
    var nodesi = nodes[i].nodes,
        indicesi = nodes[i].indices;

    for (var j = i + 1; j < ln; j++) {
      var nodesj = nodes[j].nodes,
          indicesj = nodes[j].indices,
          i0 = indicesj.indexOf(indicesi[0]) > -1,
          i1 = indicesj.indexOf(indicesi[1]) > -1,
          i2 = indicesj.indexOf(indicesi[2]) > -1;

      if (i0 && i1 || i1 && i2 || i0 && i2) {
        dual.addEdge(i, j, {
          n1: i,
          n2: j,
          weight: 0
        });
      }
    }
  }

  //Assign graph
  this.graph = graph;
  this.dual = dual;

  //Add real vertices, normals and texCoords
  var vertices = [],
      normals = [],
      texCoords = [];
  
  dual.eachNode(function(n, i) {
    n.nodes.forEach(function(n) {
      vertices.push(n.x, n.y, n.z);
      normals.push(n.nx, n.ny, n.nz);
      texCoords.push(n.u, n.v);
    });
  });

  this.vertices = vertices;
  this.normals = normals;
  this.texCoords = texCoords;
  this.vlen = vertices.length / 3;
};

Myriad.prototype = Object.create(O3D.Sphere.prototype, {
  maximalSpanningTree: {
    value: function(graph, index) {
      var len = graph.nodes.length,
          tree = new Graph,
          node = graph.getNode(index || 0),
          heap = new PHeap;

      tree.addNode(index || 0, Object.create(node));

      for (var i = 0; i < len; i++) {
        //Add all edges to the priority queue
        var edges = node.edges;
        for (var k in edges) {
          heap = heap.insert(edges[k]);
        }
        //Take the highest weight edge
        var edge = heap.find();
        while (edge && tree.nodes[edge.n1] && tree.nodes[edge.n2]) {
          heap = heap.erase();
          edge = heap && heap.find();
        }
        if (!edge) {
          console.log('problemo');
          break;
        }
        //Add the edge nodes
        if (!tree.nodes[edge.n1]) {
          tree.addNode(edge.n1, Object.create(graph.getNode(edge.n1)));
          node = graph.getNode(edge.n1);
        } else if (!tree.nodes[edge.n2]) {
          tree.addNode(edge.n2, Object.create(graph.getNode(edge.n2)));
          node = graph.getNode(edge.n2);
        }
        //Add the edge
        tree.addEdge(edge.n1, edge.n2, edge);
      }
      return tree;
    }
  },

  unfoldTree: {
    value: function(tree, index) {
      var faceFrom = tree.getNode(index || 0),
          faceFromNodes = faceFrom.nodes,
          mark = !faceFrom.mark,
          edges = faceFrom.edges,
          stack = [faceFrom],
          diff1 = {
            x: faceFromNodes[2].x - faceFromNodes[1].x,
            y: faceFromNodes[2].y - faceFromNodes[1].y,
            z: faceFromNodes[2].z - faceFromNodes[1].z
          },
          diff2 = {
            x: faceFromNodes[0].x - faceFromNodes[1].x,
            y: faceFromNodes[0].y - faceFromNodes[1].y,
            z: faceFromNodes[0].z - faceFromNodes[1].z
          },
          normal = Vec3.cross(diff1, diff2).$unit();


      //set end values for the nodes in the selected face
      faceFromNodes.forEach(function(n) {
        n.xf = n.x;
        n.yf = n.y;
        n.zf = n.z;
        n.nxf = normal.x;
        n.nyf = normal.y;
        n.nzf = normal.z;
      });

      //for each face...
      while (stack.length) {
        faceFrom = stack.pop();
        faceFromNodes = faceFrom.nodes;
        faceFrom.mark = mark;
        edges = faceFrom.edges;
        
        //go through each adjacent face
        for (var k in edges) {
          var faceTo = tree.getNode(+k),
              faceToNodes = faceTo.nodes,
              faceToIndices = faceTo.indices,
              faceFromIndices = faceFrom.indices,
              shared = [], 
              notSharedFrom, notSharedTo;
          
          //We already went through this node
          if (faceTo.mark == mark)
            continue;

          //Add it to the stack
          stack.push(faceTo);

          //update shared nodes of the adjacent face with the end position and normal values
          //and identify shared nodes between faces
          notSharedTo = false;
          faceToIndices.forEach(function(index, i) {
            var indexOf = faceFromIndices.indexOf(index);
            if (indexOf >  -1) {
              var refNode = faceFromNodes[indexOf];
                  node = faceTo.nodes[i];
              
              node.xf = refNode.xf;
              node.yf = refNode.yf;
              node.zf = refNode.zf;

              node.nxf = refNode.nxf;
              node.nyf = refNode.nyf;
              node.nzf = refNode.nzf;

              shared.push(node);
            } else {
              notSharedTo = faceTo.nodes[i];
            }
          });

          notSharedFrom = false;
          faceFromIndices.forEach(function(index, i) {
            if (faceToIndices.indexOf(index) == -1) {
              notSharedFrom = faceFromNodes[i];
            }
          });

          var diff1 = {
              x: shared[0].xf - notSharedFrom.xf,
              y: shared[0].yf - notSharedFrom.yf,
              z: shared[0].zf - notSharedFrom.zf
            },
            diff2 = {
              x: shared[1].xf - notSharedFrom.xf,
              y: shared[1].yf - notSharedFrom.yf,
              z: shared[1].zf - notSharedFrom.zf
            },
            from = {
              x: notSharedFrom.xf,
              y: notSharedFrom.yf,
              z: notSharedFrom.zf
            },
            res = Vec3.add(from, diff1).$add(diff2);

          notSharedTo.xf = res.x;
          notSharedTo.yf = res.y;
          notSharedTo.zf = res.z;
        }
      }
    }
  },

  projectGraticules: {
    value: function() {
      var graph = this.dual,
          nodes = graph.nodes,
          wPhi = 0.1,
          phi0 = 0,
          wLambda = Math.PI,
          lambda0 = 0,
          sqrt = Math.sqrt,
          pi2 = Math.PI * 2,
          abs = Math.abs,
          fn = function(phi, phi0, wPhi, lambda, lambda0, wLambda) {
            return - (wPhi * (abs(phi - phi0) % pi2) + wLambda * abs(lambda - lambda0));
          };

      for (var i = 0, l = nodes.length; i < l; i++) {
        var node = nodes[i],
            nodeIndices = node.indices,
            edges = node.edges;
        
        for (var e in edges) {
          var nodeTo = graph.getNode(e),
              nodeToIndices = nodeTo.indices,
              edge1 = edges[e],
              edge2 = nodeTo.edges[nodes.indexOf(node)],
              shared = [];

          nodeToIndices.forEach(function(index, i) {
            var indexOf = nodeIndices.indexOf(index);
            if (indexOf >  -1) {
              shared.push(node.nodes[indexOf]);
            }
          });

          var n1 = shared[0],
              n2 = shared[1],
              phi = (n1.phi + n2.phi) / 2,
              lambda = (n1.lambda + n2.lambda) / 2;

          edge1.weight = edge2.weight = fn(phi,   phi0,   wPhi,
                                           lambda, lambda0, wLambda);
        }
      }

      var spanningTree = this.spanningTree = this.maximalSpanningTree(graph, 0);

      this.unfoldTree(spanningTree);

      //Add real vertices, normals and texCoords
      var vertices = [],
          normals = [];
      
      spanningTree.eachNode(function(n) {
        n.nodes.forEach(function(n) {
          vertices.push(n.xf, n.yf, n.zf);
          normals.push(n.nxf, n.nyf, n.nzf);
        });
      });

      this.graticules = {
        vertices: vertices,
        normals: normals
      };
    }
  },

  setProjection: {
    value: function(name) {
      var projection = this.projections[name];
      program.setBuffer('endPosition', {
        value: new Float32Array(projection.vertices)
      });
      program.setBuffer('endNormal', {
        value: new Float32Array(projection.normals)
      });
    }
  }

});

function Solids() {}

Solids.prototype = Object.create(null, {
  
  createTetra: {
    value: function(iterations) {
      if (this.tetra) return this.tetra;
      
      var graph = new Graph,
          vertices = [],
          indices = [],
          sq2 = Math.SQRT2,
          sqrt = Math.sqrt;

      vertices.push(0          , 0            , 1      ,
                    2 * sq2 / 3, 0            , - 1 / 3,
                    - sq2 / 3  , sqrt(6) / 3  , - 1 / 3,
                    - sq2 / 3  , - sqrt(6) / 3, - 1 / 3);
      
      indices.push(0, 1, 2,
                   0, 2, 3,
                   0, 3, 1,
                   1, 3, 2);

      //Add first nodes to graph
      for (var i = 0, l = vertices.length / 3; i < l; i++) {
        var i3 = i * 3;
        graph.addNode(i, {
          x: vertices[i3    ],
          y: vertices[i3 + 1],
          z: vertices[i3 + 2],
          weight: 1
        });
      }

      return (this.tetra = this.processModel(graph, vertices, indices, iterations));
    }
  },

  createHexa: {
    value: function(iterations) {
      if (this.hexa) return this.hexa;
      
      var graph = new Graph,
          vertices = [],
          indices = [],
          sqrt = Math.sqrt,
          sq3 = sqrt(3);

      vertices.push(-1 / sq3, -1 / sq3, -1 / sq3,
                     1 / sq3, -1 / sq3, -1 / sq3,
                    -1 / sq3,  1 / sq3, -1 / sq3,
                    -1 / sq3, -1 / sq3,  1 / sq3,
                     1 / sq3, -1 / sq3,  1 / sq3,
                     1 / sq3,  1 / sq3,  1 / sq3,
                    -1 / sq3,  1 / sq3,  1 / sq3);
      
      indices.push(0, 3, 2,
                   0, 4, 7,
                   6, 2, 3,
                   0, 2, 1,
                   0, 7, 3,
                   6, 3, 7,
                   0, 1, 5,
                   6, 5, 1,
                   6, 7, 4,
                   0, 5, 4,
                   6, 1, 2,
                   6, 4, 5);

      //Add first nodes to graph
      for (var i = 0, l = vertices.length / 3; i < l; i++) {
        var i3 = i * 3;
        graph.addNode(i, {
          x: vertices[i3    ],
          y: vertices[i3 + 1],
          z: vertices[i3 + 2],
          weight: 1
        });
      }

      return (this.hexa = this.processModel(graph, vertices, indices, iterations));
    }
  },

  createOcta: {
    value: function(iterations) {
      if (this.octa) return this.octa;
      
      var graph = new Graph,
          vertices = [],
          indices = [],
          sqrt = Math.sqrt,
          sq3 = sqrt(3);

      vertices.push( 1,  0,  0,
                    -1,  0,  0,
                     0,  1,  0,
                     0, -1,  0,
                     0,  0,  1,
                     0,  0, -1);
      
      indices.push(4, 0, 2,
                   5, 1, 2,
                   5, 2, 0,
                   4, 2, 1,
                   4, 1, 3,
                   5, 3, 1,
                   4, 3, 0,
                   5, 0, 3);

      //Add first nodes to graph
      for (var i = 0, l = vertices.length / 3; i < l; i++) {
        var i3 = i * 3;
        graph.addNode(i, {
          x: vertices[i3    ],
          y: vertices[i3 + 1],
          z: vertices[i3 + 2],
          weight: 1
        });
      }

      return (this.octa = this.processModel(graph, vertices, indices, iterations));
    }
  },

  createDode: {
    value: function(iterations) {
      if (this.dode) return this.dode;
      
      var graph = new Graph,
          vertices = [],
          indices = [],
          sqrt = Math.sqrt,
          sq3 = sqrt(3),
          a = 1 / sq3,
          b = sqrt((3 - sqrt(5)) / 6),
          c = sqrt((3 + sqrt(5)) / 6);

      vertices.push( a,  a,  a,
                     a,  a, -a,
                     a, -a,  a,
                     a, -a, -a,
                    -a,  a,  a,
                    -a,  a, -a,
                    -a, -a,  a,
                    -a, -a, -a,
                     b,  c,  0,
                    -b,  c,  0,
                     b, -c,  0,
                    -b, -c,  0,
                     c,  0,  b,
                     c,  0, -b,
                    -c,  0,  b,
                    -c,  0, -b,
                     0,  b,  c,
                     0, -b,  c,
                     0,  b, -c,
                     0, -b, -c);
      
      indices.push( 0,  8,  9,
                    0, 16, 17,
                   12,  2, 10,
                    9,  5, 15,
                    3, 19, 18,
                    7, 11,  6,
                    0,  9,  4,
                    0, 17,  2,
                   12, 10,  3,
                    9, 15, 14,
                    3, 18,  1,
                    7,  6, 14,
                    0,  4, 16,
                    0,  2, 12,
                   12,  3, 13,
                    9, 14,  4,
                    3,  1, 13,
                    7, 14, 15,
                    0, 12, 13,
                    8,  1, 18,
                   16,  4, 14,
                    6, 11, 10,
                    7, 15,  5,
                    7, 19,  3,
                    0, 13, 11,
                    8, 18,  5,
                   16, 14,  6,
                    6, 10,  2,
                    7,  5, 18,
                    7,  3, 10,
                    0,  1,  8,
                    8,  5,  9,
                   16,  6, 17,
                    6,  2, 17,
                    7, 18, 19,
                    7, 10, 11);

      //Add first nodes to graph
      for (var i = 0, l = vertices.length / 3; i < l; i++) {
        var i3 = i * 3;
        graph.addNode(i, {
          x: vertices[i3    ],
          y: vertices[i3 + 1],
          z: vertices[i3 + 2],
          weight: 1
        });
      }

      return (this.dode = this.processModel(graph, vertices, indices, iterations));
    }
  },
  
  createIco: {
    value: function(iterations) {
      if (this.ico) return this.ico;
      
      var graph = new Graph,
          vertices = [],
          indices = [],
          sqrt = Math.sqrt,
          t = (1 + sqrt(5)) / 2,
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

      //Add first nodes to graph
      for (var i = 0, l = vertices.length / 3; i < l; i++) {
        var i3 = i * 3;
        graph.addNode(i, {
          x: vertices[i3    ],
          y: vertices[i3 + 1],
          z: vertices[i3 + 2],
          weight: 1
        });
      }

      return (this.ico = this.processModel(graph, vertices, indices, iterations));
    }
  },


  processModel: {
    value: function(graph, vertices, indices, iterations) {
      var ans = this.subdivide({
        graph: graph,
        vertices: vertices,
        indices: indices,
        iterations: iterations
      });

      ans.tree = this.maximalSpanningTree(ans.dual);

      //make unfolded model
      this.unfoldTree(ans.tree);

      //Add real vertices, normals and texCoords
      var vertices = [],
          endVertices = [],
          normals = [],
          endNormals = [],
          texCoords = [],
          endTexCoords = [];
      
      dual.eachNode(function(face, i) {
        face.nodes.forEach(function(n) {
          vertices.push(n.x, n.y, n.z);
          endVertices.push(n.xf, n.yf, n.zf);
          
          texCoords.push(n.u, n.v);
          endTexCoords.push(n.u, n.v);
          
          normals.push(face.normal.x, 
                       face.normal.y, 
                       face.normal.z);
          endNormals.push(face.endNormal.x, 
                          face.endNormal.y, 
                          face.endNormal.z);
        });
      });
      
      ans.model = new O3D.Model({
        vertices: vertices,
        normals: normals,
        texCoords: texCoords,
        attributes: {
          endPosition: {
            value: endVertices
          },
          endNormal: {
            value: endNormals
          }
        }
      });

      return ans;
    }
  },
  
  subdivide: {
    value: function(options) {
      var graph = options.graph,
          vertices = options.vertices,
          indices = options.indices,
          iterations = options.iterations,
          dual = new Graph;
      
      var getMiddlePoint = (function() {
        var pointMemo = {};
        
        return function(i1, i2, itern) {
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
          
          graph.pushNode({
            x: xm,
            y: ym,
            z: zm,
            weight: itern
          });

          return (pointMemo[key] = (vertices.length / 3 - 1));
        };
      })();

      for (var i = 0; i < iterations; i++) {
        var indices2 = [],
            itern = i + 2;
        for (var j = 0, l = indices.length; j < l; j += 3) {
          var a = getMiddlePoint(indices[j    ], indices[j + 1], itern),
              b = getMiddlePoint(indices[j + 1], indices[j + 2], itern),
              c = getMiddlePoint(indices[j + 2], indices[j    ], itern);

          indices2.push(indices[j], a, c,
                        indices[j + 1], b, a,
                        indices[j + 2], c, b,
                        a, b, c);
        }
        indices = indices2;
      }

      //Calculate texCoords and normals
      for (var i = 0, l = indices.length; i < l; i += 3) {
        var i1 = indices[i    ],
            i2 = indices[i + 1],
            i3 = indices[i + 2],
            node1 = graph.getNode(i1),
            node2 = graph.getNode(i2),
            node3 = graph.getNode(i3),
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
        
        graph.addEdge(i1, i2, {
          n1: i1,
          n2: i2,
          weight: (node1.weight + node2.weight) / 2
        });
        
        graph.addEdge(i2, i3, {
          n1: i2,
          n2: i3,
          weight: (node2.weight + node3.weight) / 2
        });
        
        graph.addEdge(i3, i1, {
          n1: i3,
          n2: i1,
          weight: (node3.weight + node1.weight) / 2
        });

        node1.u = u1;
        node1.v = v1;
        
        node2.u = u2;
        node2.v = v2;
        
        node3.u = u3;
        node3.v = v3;

        //Add dual graph node
        dual.pushNode({
          indices: [i1, i2, i3],
          normal: normal,
          nodes: [Object.create(graph.getNode(node1)),
                  Object.create(graph.getNode(node2)),
                  Object.create(graph.getNode(node3))]
        });
      }
      
      //Add dual graph edges
      var nodes = dual.nodes;
      for (var i = 0, ln = nodes.length; i < ln; i++) {
        var nodesi = nodes[i].nodes,
            indicesi = nodes[i].indices;

        for (var j = i + 1; j < ln; j++) {
          var nodesj = nodes[j].nodes,
              indicesj = nodes[j].indices,
              i0 = indicesj.indexOf(indicesi[0]) > -1,
              i1 = indicesj.indexOf(indicesi[1]) > -1,
              i2 = indicesj.indexOf(indicesi[2]) > -1;

          if (i0 && i1 || i1 && i2 || i0 && i2) {
            
            var edge = false;
            if (i0 && i1) {
              edge = graph.getEdge(i0, i1);
            } else if (i1 && i2) {
              edge = graph.getEdge(i1, i2);
            } else {
              edge = graph.getEdge(i0, i2);
            }

            dual.addEdge(i, j, {
              n1: i,
              n2: j,
              weight: edge.weight
            });
          }
        }
      }

      return {
        graph: graph,
        dual: dual
      };
    }
  },

  maximalSpanningTree: {
    value: function(graph) {
      var len = graph.nodes.length,
          tree = new Graph,
          node = graph.getNode(0),
          heap = new PHeap;

      tree.addNode(0, Object.create(node));

      for (var i = 0; i < len; i++) {
        //Add all edges to the priority queue
        var edges = node.edges;
        for (var k in edges) {
          heap = heap.insert(edges[k]);
        }
        //Take the highest weight edge
        var edge = heap.find();
        while (edge && tree.nodes[edge.n1] && tree.nodes[edge.n2]) {
          heap = heap.erase();
          edge = heap && heap.find();
        }
        if (!edge) {
          console.log('Log: This shouldn\'t happen');
          break;
        }
        //Add the edge nodes
        if (!tree.nodes[edge.n1]) {
          tree.addNode(edge.n1, Object.create(graph.getNode(edge.n1)));
          node = graph.getNode(edge.n1);
        } else if (!tree.nodes[edge.n2]) {
          tree.addNode(edge.n2, Object.create(graph.getNode(edge.n2)));
          node = graph.getNode(edge.n2);
        }
        //Add the edge
        tree.addEdge(edge.n1, edge.n2, edge);
      }
      return tree;
    }
  },

  unfoldTree: {
    value: function(tree, index) {
      var faceFrom = tree.getNode(index || 0),
          faceFromNodes = faceFrom.nodes,
          mark = !faceFrom.mark,
          edges = faceFrom.edges,
          stack = [faceFrom],
          diff1 = {
            x: faceFromNodes[2].x - faceFromNodes[1].x,
            y: faceFromNodes[2].y - faceFromNodes[1].y,
            z: faceFromNodes[2].z - faceFromNodes[1].z
          },
          diff2 = {
            x: faceFromNodes[0].x - faceFromNodes[1].x,
            y: faceFromNodes[0].y - faceFromNodes[1].y,
            z: faceFromNodes[0].z - faceFromNodes[1].z
          },
          normal = faceFrom.normal;

      //set end values for the nodes in the selected face
      faceFrom.endNormal = normal;
      faceFromNodes.forEach(function(n) {
        n.xf = n.x;
        n.yf = n.y;
        n.zf = n.z;
      });

      //for each face...
      while (stack.length) {
        faceFrom = stack.pop();
        faceFromNodes = faceFrom.nodes;
        faceFrom.mark = mark;
        edges = faceFrom.edges;
        
        //go through each adjacent face
        for (var k in edges) {
          var faceTo = tree.getNode(+k),
              faceToNodes = faceTo.nodes,
              faceToIndices = faceTo.indices,
              faceFromIndices = faceFrom.indices,
              shared = [], 
              notSharedFrom, notSharedTo;
          
          //We already went through this node
          if (faceTo.mark == mark)
            continue;

          //Add it to the stack
          stack.push(faceTo);

          //set end normal
          faceTo.endNormal = faceFrom.endNormal;

          //update shared nodes of the adjacent face with the end position and normal values
          //and identify shared nodes between faces
          notSharedTo = false;
          faceToIndices.forEach(function(index, i) {
            var indexOf = faceFromIndices.indexOf(index);
            if (indexOf >  -1) {
              var refNode = faceFromNodes[indexOf];
                  node = faceTo.nodes[i];
              
              node.xf = refNode.xf;
              node.yf = refNode.yf;
              node.zf = refNode.zf;

              shared.push(node);
            } else {
              notSharedTo = faceTo.nodes[i];
            }
          });

          notSharedFrom = false;
          faceFromIndices.forEach(function(index, i) {
            if (faceToIndices.indexOf(index) == -1) {
              notSharedFrom = faceFromNodes[i];
            }
          });

          var diff1 = {
              x: shared[0].xf - notSharedFrom.xf,
              y: shared[0].yf - notSharedFrom.yf,
              z: shared[0].zf - notSharedFrom.zf
            },
            diff2 = {
              x: shared[1].xf - notSharedFrom.xf,
              y: shared[1].yf - notSharedFrom.yf,
              z: shared[1].zf - notSharedFrom.zf
            },
            from = {
              x: notSharedFrom.xf,
              y: notSharedFrom.yf,
              z: notSharedFrom.zf
            },
            res = Vec3.add(from, diff1).$add(diff2);

          notSharedTo.xf = res.x;
          notSharedTo.yf = res.y;
          notSharedTo.zf = res.z;
        }
      }
    }
  }
});

//Create earth
var earth = new Myriad({
  nlat: 4,
  nlong: 4,
  radius: 2,
  shininess: 10,
  textures: ['img/earth1.jpg', 'img/clouds.jpg'],
  program: 'earth',
  render: function(gl, program, camera) {
    //set to attribute
    program.setBuffer('endPosition', true);
    program.setBuffer('endNormal', true);
    gl.drawArrays(gl.TRIANGLES, 0, earth.vlen);
    program.setBuffer('endPosition', false);
    program.setBuffer('endNormal', false);
  }
});

console.log(earth);
earth.projectGraticules();
earth.vertices = earth.graticules.vertices;
earth.normals = earth.graticules.normals;
earth.vlen = earth.graticules.vertices.length / 3;


function init() {
  
  //Shortcut for getElementById
  var $id = function(d) { return document.getElementById(d); };
  
  //Get controls
  /*
  var year = $id('year'),
      mapImg = $id('current-map'),
      squares = document.querySelectorAll('#controls .square'),
      lis = document.querySelectorAll('#controls ul li'),
      loading = $id('loading');
  */

  //Create application
  PhiloGL('map-canvas', {
    program: [{
      id: 'earth',
      from: 'uris',
      path: './',
      vs: 'earth.vs.glsl',
      fs: 'earth.fs.glsl',
      noCache: true
    }, {
      id: 'plane',
      from: 'uris',
      path: './',
      vs: 'plane.vs.glsl',
      fs: 'plane.fs.glsl',
      noCache: true
    }],
    camera: {
      position: {
        x: 0, y: 0, z: -5.5
      }
    },
    scene: {
      lights: {
        enable: true,
        ambient: {
          r: 0.4,
          g: 0.4,
          b: 0.4
        },
        points: {
          diffuse: { 
            r: 0.7, 
            g: 0.7, 
            b: 0.7 
          },
          specular: { 
            r: 0.5, 
            g: 0.5, 
            b: 0.8 
          },
          position: { 
            x: 3, 
            y: 3, 
            z: -5 
          }
        }
      }
    },
    events: {
      onDragStart: function(e) {
        this.pos = {
          x: e.x,
          y: e.y
        };
        this.dragging = true;
      },
      onDragCancel: function() {
        this.dragging = false;
      },
      onDragEnd: function() {
        this.dragging = false;
        theta = this.scene.models[0].rotation.y;
      },
      onDragMove: function(e) {
        var z = this.camera.position.z,
            sign = Math.abs(z) / z,
            pos = this.pos;

        this.scene.models.forEach(function(m) {
          m.rotation.y += -(pos.x - e.x) / 100;
          m.update();
        });

        pos.x = e.x;
        pos.y = e.y;
      },
      onMouseWheel: function(e) {
        e.stop();
        var camera = this.camera,
            position = camera.position;
        position.z += e.wheel;
        if (false && position.z > -6) {
          position.z = -6;
        }
        if (false && position.z < -13) {
          position.z = -13;
        }
        camera.update();
      }
    },
    textures: {
      src: ['img/earth1.jpg', 'img/clouds.jpg'],
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
      //Unpack app properties
      var gl = app.gl,
          scene = app.scene,
          camera = app.camera,
          canvas = app.canvas,
          width = canvas.width,
          height = canvas.height,
          program = app.program,
          shadowScene = new Scene(program.earth, camera),
          clearOpt = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT,
          theta = 0;
        
      //Create plane
      var plane = new O3D.PlaneXZ({
        width: width / 80,
        nwidth: 5,
        height: -4,
        depth: height / 80,
        ndepth: 5,
        textures: 'shadow-texture',
        program: 'plane'
      });

      //Create animation object for transitioning temp maps.
      var fx = new Fx({
        transition: Fx.Transition.Cubic.easeInOut,
        duration: 4000,
        onCompute: function(delta) {
          camera.position.z = Fx.compute(this.opt.from, this.opt.to, delta);
          camera.update();
        },
        onComplete: function() {
        }
      });

      fx.start({
        from: -5,
        to: -13
      });

      program.earth.setBuffer('endPosition', {
        value: new Float32Array(earth.vertices)
      });
      program.earth.setBuffer('endNormal', {
        value: new Float32Array(earth.normals)
      });
     
      gl.viewport(0, 0, width, height);
      gl.clearColor(1, 1, 1, 1);
      gl.clearDepth(1);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
        
      //create framebuffer
      program.earth.setFrameBuffer('shadow', {
        width: width,
        height: height,
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

      //Add objects to the scenes
      scene.add(earth, plane);
      shadowScene.add(earth);
      
      draw();

      function draw() {
        fx.step();
        drawShadow();
        drawEarth();
      }

      function drawShadow() {
        program.earth.use();
        program.earth.setFrameBuffer('shadow', true);
        gl.clear(clearOpt);
        program.earth.setUniform('renderType', Types.SHADOW);
        shadowScene.renderToTexture('shadow');
        program.earth.setFrameBuffer('shadow', false);
        //transfer earth program renderbuffer to plane program.
        program.earth.setState(program.plane); 
      }

      //Draw the scene
      function drawEarth() {
        gl.clear(clearOpt);
        //Update position
        if (!app.dragging && theta == 0) {
          earth.rotation.set(Math.PI / 2, 0,  0);
          earth.update();
        } 
        theta += 0.00007;
        //render objects
        gl.clear(clearOpt);
        scene.render({
          onBeforeRender: function(elem) {
            var p = program[elem.program];
            if (elem.program == 'earth') {
              p.setUniform('renderType', Types.EARTH);
              p.setUniform('cloudOffset', theta);
              p.setUniform('alphaAngle', 0);
            } else if (elem.program == 'plane') {
              p.setUniform('width', width);
              p.setUniform('height', height);
            }
          }
        });
        //Request Animation Frame
        Fx.requestAnimationFrame(draw);
      }
    }
  });
}



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

  O3D.Sphere.call(this, Object.create(opt, {
    //Add nodes to the graph
    onAddVertex: {
      value: function(node) {
        graph.pushNode(node);
      }
    }
  }));

  //TODO(nico) clean this up afterwards.
  //create array with duplicates
  var duplicates = [],
      nodes = graph.nodes,
      getIndex = function(index) {
        for (var i = 0, l = duplicates.length; i < l; i++) {
          if (duplicates[i].indexOf(index) > -1) return i;
        }
        return index;
      };

  for (var i = 0, l = nodes.length; i < l; i++) {
    var ni = nodes[i];
    duplicates[i] = [];
    for (var j = i + 1; j < l; j++) {
      var nj = nodes[j];
      if (ni.x == nj.x && ni.y == nj.y && ni.z == nj.z) {
        duplicates[i].push(j);
      }
    }
  }

  for (var indices = this.indices, l = indices.length, i = 0; i < l; i += 3) {
    var index1 = getIndex(indices[i]),
        index2 = getIndex(indices[i + 1]),
        index3 = getIndex(indices[i + 2]);
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
  var nodes = dual.nodes,
      cmp = function(a, b) {
        return a.x == b.x
            && a.y == b.y
            && a.z == b.z;
      };
  for (var i = 0, ln = nodes.length; i < ln; i++) {
    var nodesi = nodes[i].nodes,
        indicesi = nodes[i].indices,
        nodes1 = nodesi[0],
        nodes2 = nodesi[1],
        nodes3 = nodesi[2];

    for (var j = i + 1; j < ln; j++) {
      var nodesj = nodes[j].nodes,
          indicesj = nodes[j].indices,
          i0 = indicesj.indexOf(indicesi[0]) > -1,
          i1 = indicesj.indexOf(indicesi[1]) > -1,
          i2 = indicesj.indexOf(indicesi[2]) > -1,
          filter = nodesj.filter(function(n) { 
            return cmp(n, nodes1) 
                || cmp(n, nodes2) 
                || cmp(n, nodes3); 
          });

      if (filter.length == 2) {
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
        //Take the lowest weight edge
        var edge = heap.find();
        while (edge && tree.nodes[edge.n1] && tree.nodes[edge.n2]) {
          heap = heap.erase();
          edge = heap && heap.find();
        }
        if (!edge) {
          continue;
        }
        //Add the edge nodes
        if (!tree.nodes[edge.n1]) {
          tree.addNode(edge.n1, Object.create(graph.getNode(edge.n1)));
          node = graph.getNode(edge.n1);
        }
        if (!tree.nodes[edge.n2]) {
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
      var nodeFrom = tree.getNode(index || 0),
          mark = !nodeFrom.mark,
          edges = nodeFrom.edges,
          stack = [nodeFrom];

      //set end values for the nodes in the selected face
      nodeFrom.nodes.forEach(function(n) {
        n.xf = n.x;
        n.yf = n.y;
        n.zf = n.z;
        n.nxf = n.nx;
        n.nyf = n.ny;
        n.nzf = n.nz;
      });
      
      //for each face...
      while (stack.length) {
        nodeFrom = stack.pop();
        nodeFrom.mark = mark;
        edges = nodeFrom.edges;
        
        //go through each adjacent face
        for (var k in edges) {
          var nodeTo = tree.getNode(k),
              nodeToIndices = nodeTo.indices,
              nodeFromIndices = nodeFrom.indices,
              shared = [], 
              notShared;
          
          //We already went through this node
          if (nodeTo.mark == mark)
            continue;

          //Add it to the stack
          stack.push(nodeTo);

          //update shared nodes of the adjacent face with the end position and normal values
          //and identify shared nodes between faces
          notShared = false;
          nodeToIndices.forEach(function(index, i) {
            var indexOf = nodeFromIndices.indexOf(index);
            if (indexOf >  -1) {
              var refNode = nodeFrom.nodes[indexOf];
                  node = nodeTo.nodes[i];
              
              node.xf = refNode.xf;
              node.yf = refNode.yf;
              node.zf = refNode.zf;

              node.nxf = refNode.nxf;
              node.nyf = refNode.nyf;
              node.nzf = refNode.nzf;

              shared.push(node);
            } else {
              notShared = nodeTo.nodes[i];
            }
          });
          //Apply an axis angle rotation to the 
          //non-shared node to get the end positions
          //of it. The angle is determined by the angle 
          //of the normals of the two faces, and the axis of
          //rotation is the cross product of the normals of the
          //two faces
          var shn1 = { 
              x: shared[0].nxf, 
              y: shared[0].nyf, 
              z: shared[0].nzf 
            },
            nsh = {
              x: notShared.x,
              y: notShared.y,
              z: notShared.z
            },
            nshn = {
              x: notShared.nx,
              y: notShared.ny,
              z: notShared.nz
            },
            axis = Vec3.cross(shn1, nshn),
            dot = Vec3.dot(shn1, nshn),
            angle = Math.acos(dot / (Vec3.norm(shn1) * Vec3.norm(nshn))),
            rot = new Mat4().$rotateAxis(-angle, axis);

            rot.$mulVec3(nsh);
            console.log(axis.x, axis.y, axis.z);
            //assign new position coordinates
            notShared.xf = nsh.x;
            notShared.yf = nsh.y;
            notShared.zf = nsh.z;
            //assign new normals
            notShared.nxf = shn1.x;
            notShared.nyf = shn1.y;
            notShared.nzf = shn1.z;
        }
      }
    }
  },

  projectGraticules: {
    value: function() {
      var graph = this.dual,
          root = graph.getNode(0),
          nodes = graph.nodes,
          mark = !root.mark,
          wTheta = 0.3,
          theta0 = 0
          wPhi = 1,
          phi0 = 0,
          sqrt = Math.sqrt,
          pi2 = Math.PI * 2,
          fn = function(theta, theta0, wTheta, phi, phi0, wPhi) {
            return wTheta * sqrt((theta - theta0) * (theta - theta0)) + wPhi * (sqrt(((phi - phi0) % pi2) * ((phi - phi0) % pi2)));
          };

      var stack = [root];
      while (stack.length) {
        var node = stack.pop(),
            nodeIndices = node.indices,
            edges = node.edges;
        
        node.mark = mark;
        
        for (var e in edges) {
          var nodeTo = graph.getNode(e),
              nodeToIndices = nodeTo.indices,
              edge1 = edges[e],
              edge2 = nodeTo.edges[nodes.indexOf(node)],
              shared = [];

          if (nodeTo.mark == mark) continue;

          stack.push(nodeTo);

          nodeToIndices.forEach(function(index, i) {
            var indexOf = nodeIndices.indexOf(index);
            if (indexOf >  -1) {
              shared.push(node.nodes[indexOf]);
            }
          });

          var n1 = shared[0],
              n2 = shared[1] || n1,
              phi = (n1.phi + n2.phi) / 2,
              theta = (n1.theta + n2.theta) / 2;

          edge1.weight = edge2.weight = fn(theta, theta0, wTheta, 
                                           phi,   phi0,   wTheta);
        }
      }

      var spanningTree = this.maximalSpanningTree(graph);

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

      //TODO(nico):
      //traverse the dual graph and through each edge find out the two shared nodes
      //calculate the average of phi and theta for those and then apply the formula and add
      //the weight on each edge.
      //calculate the spanning tree, calculate the unfolding of the tree, and get the positions
      //as new vertices and normals.
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
    gl.drawArrays(gl.LINES, 0, earth.vlen);
    program.setBuffer('endPosition', false);
    program.setBuffer('endNormal', false);
  }
});

console.log(earth);
earth.projectGraticules();
earth.vertices = earth.graticules.vertices;
earth.normals = earth.graticules.normals;


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
        height: -3,
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
          earth.rotation.set(Math.PI / 2, 0,  0.1);
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



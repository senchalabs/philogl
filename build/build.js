var fs = require('fs');

var path = '../src/';

var files = [
  'core.js',
  'webgl.js',
  'math.js',
  'event.js',
  'program.js',
  'io.js',
  'camera.js',
  'o3d.js',
  'shaders.js',
  'scene.js',
  'workers.js',
  'fx.js',
  'media.js'
];

function build() {
  var license = fs.readFileSync('../LICENSE'), body;
  
  body = files.map(function(name) {
    return fs.readFileSync(path + name);
  });

  console.log('/**\n@preserve' + license + '*/\n' + '(function() { \n' + body.join('\n') + '\n})();');
}

build();

path = '../src/'

files = [
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
]

def build():
  body = []
  license = open('../LICENSE', 'r').read()
  for file in files:
    body.append(open(path + file, 'r').read())
  print  '/**\n@preserve' + license + '*/\n' + '(function() { \n' + '\n'.join(body) + '\n})();'

if __name__ == '__main__':
  build()

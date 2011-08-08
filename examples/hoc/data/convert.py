import struct

def main():
  with open('vertices.dat', 'w') as vertices:
    with open('components.dat', 'w') as components:
      with open('intensity.dat', 'w') as intensity:
        
        for i in range(1):
          with open(str(i + 1) + '.csv', 'r') as fin:
            comps = 0
            for line in fin:
              [x, y, z, i] = line.split(',')
              dat = struct.pack('f', -float(x) + 100)
              vertices.write(dat)
              dat = struct.pack('f', -float(y) + 150)
              vertices.write(dat)
              dat = struct.pack('f', float(z))
              vertices.write(dat)
              dat = struct.pack('f', int(i))
              intensity.write(dat)
              comps += 1
          dat = struct.pack('H', comps)
          components.write(dat);

if __name__ == '__main__':
  main()

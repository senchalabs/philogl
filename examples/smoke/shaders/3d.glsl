vec4 get(float x, float y, float z) {
  if (x < 0. || x >= RESOLUTIONX || y < 0. || y >= RESOLUTIONY || z < 0. || z >= RESOLUTIONZ) {
    return vec4(0);
  }
  return texture2D(sampler1, vec2(floor(x) / RESOLUTIONX, (floor(y) / RESOLUTIONZ + floor(z)) / RESOLUTIONY));
}

vec4 getAA(float x, float y, float z) {
  x -= 0.5;
  y -= 0.5;
  z -= 0.5;
  return 
  mix(mix(
    mix(get(x,y,z), get(x + 1.,y,z), fract(x)),
    mix(get(x,y+1.,z), get(x + 1.,y+1.,z), fract(x)),
    fract(y)
  ),
  mix(
      mix(get(x,y,z+1.), get(x + 1.,y,z+1.), fract(x)),
      mix(get(x,y+1.,z+1.), get(x + 1.,y+1.,z+1.), fract(x)),
      fract(y)
    ),
  fract(z));
}

vec4 dx(float x, float y, float z) {
  x *= RESOLUTIONX;
  y *= RESOLUTIONY;
  z *= RESOLUTIONZ;
  return (getAA(x + 1., y, z) - getAA(x, y, z)) * RESOLUTIONX;
}

vec4 dy(float x, float y, float z) {
  x *= RESOLUTIONX;
  y *= RESOLUTIONY;
  z *= RESOLUTIONZ;
  return (getAA(x, y + 1., z) - getAA(x, y, z)) * RESOLUTIONY;
}

vec4 dz(float x, float y, float z) {
  x *= RESOLUTIONX;
  y *= RESOLUTIONY;
  z *= RESOLUTIONZ;
  return (getAA(x, y, z + 1.) - getAA(x, y, z)) * RESOLUTIONZ;
}

float x = vTexCoord.x;
float y = fract(vTexCoord.y * RESOLUTIONY);
float z = floor(vTexCoord.y * RESOLUTIONZ) / RESOLUTIONZ;

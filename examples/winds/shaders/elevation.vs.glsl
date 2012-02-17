attribute vec3 position;
attribute vec2 texCoord1;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;
uniform sampler2D sampler1;

varying vec2 vTexCoord;

float getHue(vec4 sampling) {
  float r = sampling.r;
  float g = sampling.g;
  float b = sampling.b;
  float maxComp = max( max(r, g), b);
  float minComp = min( min(r, g), b);
  float c = maxComp - minComp;
  float hue;
  if (c <= 0.01) {
      hue = -1.;
  } else {
    if (maxComp == r) {
      hue = mod((g - b) / c, 6.);
    } else if (maxComp == g) {
      hue = (b - r) / c + 2.;
    } else {
      hue = (r - g) / c + 4.;
    }
    hue *= 60.; //hue [0, 360)
  }
  return hue;
}
  
void main(void) {
  vec4 pos = vec4(position, 1.);
  vec4 sampling = texture2D(sampler1, texCoord1);
  float hue = getHue(sampling);

  if (hue == -1.) {
      pos.z = -.01;
  } else {
    float z;
    if (texCoord1.s <= 0.5 && texCoord1.s >= 0.25) {
      z = mod((360. - hue - 5.), 360.);
    } else {
      z = mod((360. - hue + 2.), 360.);
    }
    if (z < 0.) {
      z += 360.;
    }
    pos.z = exp(z / 3600.) -1.01;
  }

  pos.z = 0.;

  gl_Position = projectionMatrix * worldMatrix * pos;
  vTexCoord = texCoord1;
}

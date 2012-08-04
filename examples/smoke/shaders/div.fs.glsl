#ifdef GL_ES
precision highp float;
#endif

uniform float RESOLUTIONX;
uniform float RESOLUTIONY;
uniform float RESOLUTIONZ;
uniform sampler2D sampler1;
varying vec2 vTexCoord;

#include "3d.glsl"

void main() {
  vec4 Dx = dx(x,y,z);
  vec4 Dy = dy(x,y,z);
  vec4 Dz = dz(x,y,z);
  gl_FragColor = vec4(Dx.x, Dy.y, Dz.z,1);
}
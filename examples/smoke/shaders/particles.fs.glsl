#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler1, sampler2, sampler3;
varying vec3 position, color;
varying float idx;
varying vec2 vTexCoord;

#include "rng.glsl"

void main() {
  gl_FragColor = texture2D(sampler3, gl_PointCoord);
  gl_FragColor.xyz = color;
  gl_FragColor.a *= 0.1 * max(0., 0.5 - length(gl_PointCoord - 0.5));
  gl_FragColor.a *= 1./(0.5 + distance(position, vec3(0,0,1)));
}
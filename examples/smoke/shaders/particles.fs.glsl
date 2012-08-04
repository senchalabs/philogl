#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler1, sampler2, sampler3;
varying vec3 position, color;
varying float idx;
varying vec2 vTexCoord;

#include "rng.glsl"

void main() {
  gl_FragColor = vec4(1,1,1,0.02);
  gl_FragColor = texture2D(sampler3, gl_PointCoord);
  gl_FragColor.xyz = color;
  gl_FragColor.a *= 0.1;
}
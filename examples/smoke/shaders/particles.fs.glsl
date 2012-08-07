#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler1, sampler2, sampler3;
varying vec3 position;
varying vec4 color;
varying float idx;
varying vec2 vTexCoord;

#include "rng.glsl"

void main() {
  gl_FragColor = color;
//  gl_FragColor.a = sqrt(sqrt(gl_FragColor.a));
  gl_FragColor.a *= 0.1 * max(0., 0.5 - length(gl_PointCoord - 0.5));
  gl_FragColor.a *= 4. / (0.5 + distance(position, vec3(0,0,1)));
}
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler1, sampler2;
uniform float time, dt;
varying vec2 vTexCoord;

#include "3d.glsl"
#include "rng.glsl"

void main() {
  vec3 position = texture2D(sampler2, vTexCoord).xyz;
  float life = texture2D(sampler2, vTexCoord).w;
  vec3 v = getAA(sampler1, position);
  v += (noise(vec3(vTexCoord, 0.132) + position) -0.5) * 0.01;
  position += v * dt * 4.5 * life;
  position = clamp(position, 0., 1.);
  gl_FragColor = vec4(position, life); // vec4(position.xyz, life);
}
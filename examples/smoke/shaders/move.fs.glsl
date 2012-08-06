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
  vec3 v = getAA(sampler1, position);
  v += (noise(position + time + 3.) - 0.5) * 0.005;
  position += v * dt * 1.;
  if (distance(position, vec3(0.5)) > 0.5) {
    position = (position - 0.5)/ distance(position, vec3(0.5)) /10. + 0.5;
  }
//  position.x = mod(position.x, 1.);
//  position.y = mod(position.y, 1.);
//  position.z = mod(position.z, 1.);
//  position.x = clamp(position.x, 0., 1.);
//  position.y = clamp(position.y, 0., 1.);
//  position.z = clamp(position.z, 0., 1.);
  gl_FragColor = vec4(position, 1);
}
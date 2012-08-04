#ifdef GL_ES
precision highp float;
#endif

uniform float RESOLUTIONX;
uniform float RESOLUTIONY;
uniform float RESOLUTIONZ;
uniform sampler2D sampler1, sampler2;
uniform float time, dt;
varying vec2 vTexCoord;

#include "3d.glsl"
#include "rng.glsl"

void main() {
  vec3 pos = texture2D(sampler2, vTexCoord).xyz;
  vec3 v = normalize(getAA(pos.x * RESOLUTIONX, pos.y * RESOLUTIONY, pos.z * RESOLUTIONZ).xyz);
  v += (noise(pos + time + 3.)-0.5) * 0.05;
  pos += v * dt * 0.5;
  pos.x = clamp(pos.x, 0., 1.);
  pos.y = clamp(pos.y, 0., 1.);
  pos.z = clamp(pos.z, 0., 1.);
  gl_FragColor = vec4(pos, 1);
}
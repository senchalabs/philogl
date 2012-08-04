#ifdef GL_ES
precision highp float;
#endif


uniform float RESOLUTIONX;
uniform float RESOLUTIONY;
uniform float time;
uniform sampler2D sampler1;
varying vec2 vTexCoord;

#include "rng.glsl"

void main() {
  gl_FragColor = vec4(
    noise(vec3(vTexCoord.xy + 30., 1.)),
  1);
}
#ifdef GL_ES
precision highp float;
#endif
#define PI 3.14159265359
uniform sampler2D sampler1, sampler2, sampler3, sampler4;
// uniform samplerCube samplerCube1;
uniform vec3 cameraPosition;
varying vec4 vPosition;

#include "env.glsl"

void main(void) {
  vec3 direction = vPosition.xyz - cameraPosition; 
  gl_FragColor = envSampling(direction, sampler1, sampler2, sampler3, sampler4);
}
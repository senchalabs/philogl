#ifdef GL_ES
precision highp float;
#endif

uniform float RESOLUTIONX;
uniform float RESOLUTIONY;
uniform float RESOLUTIONZ;
uniform sampler2D sampler1;
uniform float seed;
uniform float time;
varying vec2 vTexCoord;
#define PI 3.14159265359

#include "3d.glsl"
#include "rng.glsl"
void main() {
//  gl_FragColor = vec4(noise(vec3(x-0.5,y-0.5,z-0.5)) - 0.5, 1) ;
  gl_FragColor = vec4 (0,0,0.5,0); //vec4(0,0,(dot(vec2(x,y),vec2(0.5)) - 0.2) * 100000.0,1);
}
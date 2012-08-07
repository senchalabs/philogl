attribute float indices;

varying vec4 vPosition;
varying float depth;
varying vec3 position;
varying float idx;

uniform sampler2D sampler1, sampler2, sampler3;

uniform float multiple, near, far;
uniform mat4 objectMatrix, viewMatrix, worldMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewProjectionMatrix;
varying vec2 vTexCoord;
varying vec4 color;

uniform float devicePixelRatio;
#include "3d.glsl"

void main(void) {
  idx = indices;
  vec4 samp = texture2D(sampler2, vec2(mod(indices, 256.0) / 256.0, floor(indices / 256.0) /256.0));
  position = samp.xyz;
  float life = samp.w;
  color = vec4(3.2, 1.1, 0.9, 1);// mix(vec3(0,0,.01),vec3(3,3,1.8), smoothstep(0.1, 0.2, life));
  color.xyz *= smoothstep(0., 0.9, life);
  position.x = position.x * 2. - 1.;
  position.y = position.y * 2. - 1.;
  position.z = position.z * 2. - 1.;
  vPosition = vec4(position, 1);
  gl_Position = projectionMatrix * worldMatrix * vPosition;
  float alpha = 1. - pow((1. - life), .5);
  gl_PointSize = devicePixelRatio * 20. / (gl_Position.z + 1.) / (alpha * 0.2 + 0.8); 
  depth = (gl_Position.z  - 2.)/ 5.;
  if (depth < near || far <= depth) {
    gl_PointSize = 0.;
    color = vec4(0.);
  }
  color.a *= alpha;
  vTexCoord = vec2(0);
}

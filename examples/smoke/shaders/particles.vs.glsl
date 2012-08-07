attribute float indices;

varying vec4 vPosition;
varying float depth;
varying vec3 position;
varying float idx;

uniform sampler2D sampler1, sampler2, sampler3;

uniform float multiple;
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
  color = vec4((getAA(sampler1, position) * .1 +0.9) * (1. - (1. - samp.w) * (1. - samp.w)) + 0.1, samp.w);
  position.x = position.x * 2. - 1.;
  position.y = position.y * 2. - 1.;
  position.z = position.z * 2. - 1.;
  vPosition = vec4(position, 1);
  gl_Position = projectionMatrix * worldMatrix * vPosition;
  gl_PointSize = devicePixelRatio * 20. / (gl_Position.z + 1.); 
  depth = gl_Position.z; 
  vTexCoord = vec2(0);
}

attribute vec3 position;
attribute vec3 normal;
varying vec4 vPosition;
varying vec4 vNormal;
attribute vec2 texCoord1;

uniform sampler2D sampler1;
uniform mat4 objectMatrix, viewMatrix, worldMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewProjectionMatrix;

varying vec2 vTexCoord;

float h(vec2 point) {
  if(point.x < 0. || point.y < 0. || point.x > 1. || point.y > 1.) {
    return 0.;
  }
  float h0 = (texture2D(sampler1, point).r);
  return h0;
}

void main(void) {
  const float MULTIPLIER = 10.;
  vTexCoord = texCoord1;
  vec4 samp = texture2D(sampler1, vTexCoord);
  vPosition = vec4(position.xyz + normal * h(vTexCoord) * MULTIPLIER, 1);
  vNormal = vec4(normalize(vec3(-samp.ba * MULTIPLIER, 1)), 1);
  gl_Position = projectionMatrix * worldMatrix * vPosition;
}

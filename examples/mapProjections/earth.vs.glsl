attribute vec3 position;
attribute vec3 endPosition;
attribute vec3 normal;
attribute vec3 endNormal;
attribute vec2 texCoord1;
attribute vec2 texCoord2;
attribute vec2 texCoord3;
attribute vec4 color;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

varying vec2 vTexCoord1;
varying vec2 vTexCoord2;
varying vec2 vTexCoord3;
varying vec4 vEndTransformedNormal;
varying vec4 vTransformedNormal;
varying vec4 vEndPosition;
varying vec4 vPosition;
varying vec4 vColor;


void main(void) {
  vPosition = modelViewMatrix * vec4(position, 1.0);
  vEndPosition = modelViewMatrix * vec4(endPosition, 1.0);
  vTransformedNormal = normalMatrix * vec4(normal, 1.0);
  vEndTransformedNormal = normalMatrix * vec4(endNormal, 1.0);
  vTexCoord1 = texCoord1;
  vTexCoord2 = texCoord2;
  vTexCoord3 = texCoord3;
  vColor = color;
  gl_Position = projectionMatrix * vPosition;
}

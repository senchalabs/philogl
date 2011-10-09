attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord1;
attribute vec2 texCoord2;
attribute vec2 texCoord3;
attribute vec4 color;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;
uniform mat4 worldInverseTransposeMatrix;

uniform bool hasTexture2;
uniform sampler2D sampler2;

varying vec2 vTexCoord1;
varying vec2 vTexCoord2;
varying vec2 vTexCoord3;
varying vec4 vTransformedNormal;
varying vec4 vPosition;
varying vec4 vColor;
varying float vAlpha;

void main(void) {
  vAlpha = texture2D(sampler2, vec2(texCoord1.s, texCoord1.t)).r;
  vPosition = worldMatrix * vec4(position *  (1.0 + 0.01 * vAlpha * vAlpha), 1.0);
  vTransformedNormal = worldInverseTransposeMatrix * vec4(normal, 1.0);
  vTexCoord1 = texCoord1;
  vTexCoord2 = texCoord2;
  vTexCoord3 = texCoord3;
  vColor = color;
  gl_Position = projectionMatrix * vPosition;
}

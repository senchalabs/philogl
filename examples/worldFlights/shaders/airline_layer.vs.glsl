#define LIGHT_MAX 40

attribute vec3 position;
attribute vec4 color;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;

varying vec4 vColor;

void main(void) {
  vColor = color;
  gl_Position = projectionMatrix * worldMatrix * vec4(position, 1.0);
}


uniform bool animate;
uniform float delta;

attribute vec3 position;
attribute vec3 from;
attribute vec3 to;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;

void main(void) {
  vec3 pos;
  if (animate) {
    pos = from + (position - from) * delta;
  } else {
    pos = position;
  }
  gl_Position = projectionMatrix * worldMatrix * vec4(pos, 1.0);
}


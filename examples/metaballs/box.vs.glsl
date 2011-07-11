attribute vec4 position;
varying vec4 v_position;

void main() {
  v_position = position;
  gl_Position = position;
}


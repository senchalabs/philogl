#define SITE_MAX 40
attribute vec2 aVertexPosition;

void main(void) {
  gl_Position = vec4(aVertexPosition, 0.0, 1.0);
}
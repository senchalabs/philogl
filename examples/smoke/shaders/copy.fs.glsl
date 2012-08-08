#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler1;
varying vec2 vTexCoord;

void main() {
  gl_FragColor = clamp(texture2D(sampler1, vTexCoord),0.,1.);
}
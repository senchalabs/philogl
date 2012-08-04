#ifdef GL_ES
precision highp float;
#endif

uniform float RESOLUTIONX;
uniform float RESOLUTIONY;
uniform float RESOLUTIONZ;

uniform sampler2D sampler1;
varying vec2 vTexCoord;

void main(void) {
  gl_FragColor = texture2D(sampler1, vec2(vTexCoord.x,vTexCoord.y));
}
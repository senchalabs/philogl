#ifdef GL_ES
precision highp float;
#endif
uniform float RESOLUTIONX;
uniform float RESOLUTIONY;
uniform sampler2D sampler1;
uniform float elevation;
varying vec2 vTexCoord;
uniform vec2 cursor;


void main(void) {
  vec2 position = vTexCoord;
  float dist = distance(
    vec2(position.x * RESOLUTIONX, position.y * RESOLUTIONY), 
    vec2((cursor.x + 0.5) * RESOLUTIONX, (cursor.y + 0.5) * RESOLUTIONY)) * 0.6;
  gl_FragColor = texture2D(sampler1, position) + vec4(elevation * exp(- dist * dist) * 0.01, 0, 0, 0);
}
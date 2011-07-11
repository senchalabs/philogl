#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;
varying vec4 vPosition;

uniform vec4 point1;
uniform vec4 point2;
uniform float radius;

uniform float width;
uniform float height;

uniform sampler2D sampler1;

void main(void) {
  float dx;
  float dy;
  vec2 coord = vec2(vTexCoord1.s * width / height - 0.5, vTexCoord1.t);
  vec2 p1 = point1.xy;
  vec2 p2 = point1.zw;
  vec2 p3 = point2.xy;
  vec2 p4 = point2.zw;
  vec4 c1 = texture2D(sampler1, p1);
  vec4 c2 = texture2D(sampler1, p2);
  vec4 c3 = texture2D(sampler1, p3);
  vec4 c4 = texture2D(sampler1, p4);
  
  if (distance(coord, p1) < radius) {
    gl_FragColor = c1;
  /*} else if (distance(coord, p2) < radius) {
    gl_FragColor = c2;
  } else if (distance(coord, p3) < radius) {
    gl_FragColor = c3;
  } else if (distance(coord, p4) < radius) {
    gl_FragColor = c4;
  */} else {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  }
  
}



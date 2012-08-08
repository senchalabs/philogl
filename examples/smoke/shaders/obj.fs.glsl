#ifdef GL_ES
precision highp float;
#endif
uniform sampler2D sampler1;
uniform vec3 lightPosition;
varying vec4 vPosition;
varying vec2 vTexCoord;
varying vec4 vNormal;

void main(void) {
  float light = 0.5 * abs(dot(normalize(lightPosition - vPosition.xyz), vNormal.xyz));
  vec4 tex = vec4(texture2D(sampler1, vTexCoord).x);
  gl_FragColor = vec4(tex.xyz * light + 0.3, 1);
}

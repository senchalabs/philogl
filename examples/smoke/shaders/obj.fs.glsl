#ifdef GL_ES
precision highp float;
#endif
uniform sampler2D sampler1;
uniform vec3 cameraPosition;
varying vec4 vPosition;
varying vec2 vTexCoord;
varying vec4 vNormal;

void main(void) {
  float light = 0.2 + 0.5 * dot(normalize(cameraPosition - vPosition.xyz),normalize(vNormal.xyz));
  vec4 tex = texture2D(sampler1, vPosition.xy);
  gl_FragColor = vec4(tex.xyz * light, 1);
}

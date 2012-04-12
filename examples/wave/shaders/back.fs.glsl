#ifdef GL_ES
precision highp float;
#endif
#define PI 3.14159265359
uniform sampler2D sampler1, sampler2, sampler3, sampler4;
// uniform samplerCube samplerCube1;
uniform vec3 eye;
varying vec4 vPosition;
void main(void) {
  vec3 direction = vPosition.xyz - eye;
  // textureCube(samplerCube1, normalize(vec3(direction.x, direction.z, direction.y))).xyz * 0.7;
  vec2 tex = vec2(atan(direction.y, direction.x) / 2. / PI - 0.3, -atan(direction.z, length(direction.xy)) / 2. / PI  + 0.5);
  vec3 
      color0 = texture2D(sampler1, tex).xyz,
      color1 = texture2D(sampler2, tex).xyz,
      color2 = texture2D(sampler3, tex).xyz,
      color3 = texture2D(sampler4, tex).xyz; 
  gl_FragColor = vec4((color0 + color1 + color2 + color3), 1);// ;vec4(exp(color *) - 1., 1);
}
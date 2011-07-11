#ifdef GL_ES
precision highp float;
#endif

uniform samplerCube samplerCube1;
uniform mat4 viewProjectionInverseMatrix;
varying vec4 v_position;

void main() {
  vec4 t = viewProjectionInverseMatrix * v_position;
  t = vec4(-t.x, t.yzw);
  gl_FragColor = textureCube(samplerCube1, normalize(t.xyz / t.w));
  //gl_FragColor = textureCube(samplerCube1, normalize(v_position.xyz));
}

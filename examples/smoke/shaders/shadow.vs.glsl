attribute float indices;

uniform sampler2D sampler1;
uniform float devicePixelRatio;
uniform vec3 cameraPosition;
uniform mat4 objectMatrix, viewMatrix, worldMatrix, projectionMatrix, viewProjectionMatrix, viewProjectionInverseMatrix;

void main(void) {
  vec4 samp = texture2D(sampler1, vec2(mod(indices, 256.0) / 256.0, floor(indices / 256.0) /256.0));
  vec3 position = samp.xyz * 2. - 1.;
  gl_Position = projectionMatrix * worldMatrix * vec4(position, 1);
  gl_Position.xy = vec2(mod(indices, 256.0) / 256.0, floor(indices / 256.0) /256.0);
  gl_PointSize = devicePixelRatio * 40. / (gl_Position.z + 1.);
}
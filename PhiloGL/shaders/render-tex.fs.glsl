#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;
varying vec2 vTexCoord2;
varying vec2 vTexCoord3;
varying vec4 vColor;
varying vec4 vTransformedNormal;
varying vec4 vPosition;

uniform float shininess;
uniform bool enableSpecularHighlights;

uniform vec3 ambientColor;
uniform vec3 directionalColor;
uniform vec3 lightingDirection;

uniform bool enablePoint1;
uniform vec3 pointLocation1;
uniform vec3 pointColor1;
uniform vec3 pointSpecularColor1;

uniform vec3 materialAmbientColor;
uniform vec3 materialDiffuseColor;
uniform vec3 materialSpecularColor;
uniform vec3 materialEmissiveColor;

uniform bool hasTexture1;
uniform sampler2D sampler1;

uniform mat4 viewMatrix;

void main(void) {
  vec3 ambientLightWeighting = ambientColor;

  vec3 lightDirection = normalize(pointLocation1 - vPosition.xyz);
  vec3 normal = normalize(vTransformedNormal.xyz);

  vec3 specularLightWeighting = vec3(0.0, 0.0, 0.0);
  if (enableSpecularHighlights) {
    vec3 eyeDirection = normalize(-vPosition.xyz);
    vec3 reflectionDirection = reflect(-lightDirection, normal);

    float specularLightBrightness = pow(max(dot(reflectionDirection, eyeDirection), 0.0), shininess);
    specularLightWeighting = pointSpecularColor1 * specularLightBrightness;
  }

  float diffuseLightBrightness = max(dot(normal, lightDirection), 0.0);
  vec3 diffuseLightWeighting = pointColor1 * diffuseLightBrightness;

  vec3 matAmbientColor = materialAmbientColor;
  vec3 matDiffuseColor = materialDiffuseColor;
  vec3 matSpecularColor = materialSpecularColor;
  vec3 matEmissiveColor = materialEmissiveColor;
  float alpha = 1.0;
  if (hasTexture1) {
    vec4 textureColor = texture2D(sampler1, vec2(vTexCoord1.s, vTexCoord1.t));
    matAmbientColor = matAmbientColor * textureColor.rgb;
    matDiffuseColor = matDiffuseColor * textureColor.rgb;
    matEmissiveColor = matEmissiveColor * textureColor.rgb;
    alpha = textureColor.a;
  }
  gl_FragColor = vec4(
    matAmbientColor * ambientLightWeighting
    + matDiffuseColor * diffuseLightWeighting
    + matSpecularColor * specularLightWeighting
    + matEmissiveColor,
    alpha
  );
}




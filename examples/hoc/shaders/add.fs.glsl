#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord1;
varying vec4 vPosition;

uniform sampler2D sampler1;
uniform sampler2D sampler2;
uniform sampler2D sampler3;
uniform sampler2D sampler4;
uniform sampler2D sampler5;

void main(void) {
  vec4 fragmentColor = vec4(0.0, 0.0, 0.0, 1.0);
  fragmentColor += texture2D(sampler1, vTexCoord1 / 1.0);
  fragmentColor += texture2D(sampler2, vTexCoord1 / 1.0);
  fragmentColor += texture2D(sampler3, vTexCoord1 / 1.0);
  fragmentColor += texture2D(sampler4, vTexCoord1 / 1.0);
  fragmentColor += texture2D(sampler5, vTexCoord1 / 1.0);
  
  gl_FragColor = clamp(fragmentColor, 0.0, 1.0);
}



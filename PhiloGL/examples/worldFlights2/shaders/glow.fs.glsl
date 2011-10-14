#ifdef GL_ES
precision highp float;
#endif

#define BLUR_LIMIT 4 
#define BLUR_LIMIT_SQ 64.0

varying vec2 vTexCoord1;
varying vec2 vTexCoord2;
varying vec2 vTexCoord3;
varying vec4 vColor;
varying vec4 vPosition;

uniform bool hasTexture1;
uniform sampler2D sampler1;

uniform bool hasTexture2;
uniform sampler2D sampler2;

void main(void) {
  vec4 fragmentColor = vec4(0.0, 0.0, 0.0, 0.0);
  float dx;
  float dy;

  if (hasTexture1 && hasTexture2) {
    //Add glow
    for (int i = - BLUR_LIMIT; i < BLUR_LIMIT; i++) {
      dx = float(i) / 512.0;
      for (int j = - BLUR_LIMIT; j < BLUR_LIMIT; j++) {
        dy = float(j) / 512.0;
        fragmentColor += texture2D(sampler1, vec2(vTexCoord1.s + dx, vTexCoord1.t + dy)) / BLUR_LIMIT_SQ;
      }
    }
    //Add real image
    fragmentColor += texture2D(sampler2, vec2(vTexCoord1.s, vTexCoord1.t));
  }
  gl_FragColor = vec4(fragmentColor.rgb, 1.0);
}


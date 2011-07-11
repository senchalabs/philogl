#ifdef GL_ES
precision highp float;
#endif

#define BLUR_LIMIT 4 
#define BLUR_LIMIT_2 8.0

varying vec2 vTexCoord1;
varying vec4 vPosition;

uniform bool horizontal;
uniform float width;
uniform float height;

uniform sampler2D sampler1;

void main(void) {
  vec4 fragmentColor = vec4(0.0, 0.0, 0.0, 0.0);
  float dx;
  float dy;
  
  if (horizontal) {
    for (int i = - BLUR_LIMIT; i < BLUR_LIMIT; i++) {
      dx = float(i) / width;
      fragmentColor += texture2D(sampler1, vec2((1.0 - vTexCoord1.s) + dx, vTexCoord1.t)) / BLUR_LIMIT_2;
    }
  } else {
    for (int j = - BLUR_LIMIT; j < BLUR_LIMIT; j++) {
      dy = float(j) / height;
      fragmentColor += texture2D(sampler1, vec2((1.0 - vTexCoord1.s), vTexCoord1.t + dy)) / BLUR_LIMIT_2;
    }
  }
  fragmentColor += texture2D(sampler1, vec2((1.0 - vTexCoord1.s), vTexCoord1.t));
  gl_FragColor = vec4(fragmentColor.rgb, 1.0);
}


#ifdef GL_ES
precision highp float;
#endif

#define NUM_SAMPLES 4.0

varying vec2 vTexCoord1;
varying vec4 vPosition;

uniform vec2 dir;
uniform int pass;

uniform float width;
uniform float height;

uniform sampler2D sampler1;

void main(void) {
  vec4 fragmentColor = vec4(0.0, 0.0, 0.0, 0.0);
  
  vec2 pxSize = vec2(2.0/width, 2.0/height);
  float attenuation = 0.95;

  vec2 sampleCoord = vec2(0.0, 0.0);

  float b = pow(NUM_SAMPLES, float(pass));

  for (float s = 0.0; s < NUM_SAMPLES; s+=1.0) {
    float weight = pow(attenuation, b * s);
    sampleCoord = vTexCoord1 + (dir * b * vec2(s, s) * pxSize);
    fragmentColor += clamp(weight, 0.0, 1.0) * texture2D(sampler1, sampleCoord);
  }
  
  gl_FragColor = clamp(fragmentColor, 0.0, 1.0);
}


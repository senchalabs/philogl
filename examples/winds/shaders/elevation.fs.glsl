#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler2;
uniform sampler2D sampler3;
varying vec2 vTexCoord;

void main(void) {
  /* float x = texture2D(sampler3, vTexCoord).x;*/
  /* float shadow = clamp(x, 0.6, 1.);*/
  /* vec3 shadow_vec = vec3 (shadow, shadow, clamp(1.3 * shadow, 0.0, 1.));*/
  /* gl_FragColor = vec4(texture2D(sampler2, vTexCoord).xyz * shadow_vec, 1);*/
  vec4 color = texture2D(sampler2, vTexCoord);
  float avg = (color.r + color.g + color.b) / 3.;
  gl_FragColor = vec4(clamp((color.r + avg) / 2., 0., 1.), 
                      clamp((color.g + avg) / 2., 0., 1.), 
                      clamp((color.b + avg) / 2., 0., 1.), 1.0) * 0.5;
}


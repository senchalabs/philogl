#ifdef GL_ES
precision highp float;
#endif

uniform vec3 data;

void main(void) {
  /* float angle = data.x * PI2;*/
  /* float windSpeed = data.y * delta / 5.;*/
  /* float temp = data.z;*/
  
  gl_FragColor = vec4(.2, 1, .2, 1);
}


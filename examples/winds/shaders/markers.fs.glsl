#ifdef GL_ES
precision highp float;
#endif

#define PI 3.1415926535

varying vec2 vTexCoord;
varying vec3 vColor;

void main(void) {
  /* float angle = data.x * PI / 2.;*/
  /* float windSpeed = data.y * .2 / 5.;*/
  /* float temp = data.z;*/

  float dist = distance(vTexCoord, vec2(.5, .5));
  if (dist <= .5) {
    gl_FragColor = vec4(vColor, dist * dist + .2);
  } else {
    gl_FragColor = vec4(0, 0, 0, 0);
  }
}


#ifdef GL_ES
precision highp float;
#endif

#define PI 3.1415926535

uniform sampler2D sampler1;
uniform float t;
uniform float ratio;

varying vec2 pixel;

void main(void) {
  float step = PI / ratio;
  float s;
  float c;
  float ans;

  vec2 defpixel = (pixel - vec2( 0.5 ) ) * 170.;

  for (float idx = 0.; idx < 100.; idx++) {
    if ( idx < ratio ) {
      float value = idx * step;
      s = sin( value );
      c = cos( value );
      ans += ( cos( c * defpixel.x + s * defpixel.y + t ) + 1. ) / 2.;
    }
  }

  float v = mod(ans, 1.);
  float k = ans - v;
  
  ans = ( mod( abs( k ), 2. ) ) <= 0.0001 ? v : 1. - v;

  vec4 color = vec4( ans );
  color.w = 1.;

  gl_FragColor = color;
}

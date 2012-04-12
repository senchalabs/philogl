#ifdef GL_ES
precision highp float;
#endif

#define sqrt2 1.4142135623730951
#define PI   3.1415926535897932
#define PI_2 1.5707963267948966
uniform float RESOLUTIONX;
uniform float RESOLUTIONY;
#define sq 0.36
#define one_pixel_x (1. / RESOLUTIONX)
#define one_pixel_y (1. / RESOLUTIONY)
uniform sampler2D sampler1;
uniform float elevation;
uniform vec2 cursor;
uniform float dt, time;
varying vec2 vTexCoord;

float height(vec2 pos, vec2 offset) {
  pos += offset;
  if (pos.x < 0. || pos.y < 0. || pos.x > 1. || pos.y > 1.) {
    return 0.;
  }
  return texture2D(sampler1, pos).x;
}

float vol(vec2 pos) {
  return texture2D(sampler1, pos).y;
}

void main(void) {

  float sticky = 0.00;
  float k = 5.;
  float regression = 0.0;
  float fade = 0.97;
  
  vec2 position = vTexCoord;
  float h = height(position, vec2(0)), // 
    v0 = vol(position) * pow(fade, dt), f = 0., a;
  float hl = height(position, vec2(-one_pixel_x, 0)) - h;
  float hr = height(position, vec2(one_pixel_x, 0)) - h;
  float ht = height(position, vec2(0, -one_pixel_y)) - h;
  float hb = height(position, vec2(0, one_pixel_y)) - h;
  
  float hlt = (height(position, vec2(-one_pixel_x, -one_pixel_y))  - h) * sq;
  float hrt = (height(position, vec2(one_pixel_x, -one_pixel_y)) - h) * sq;
  float hlb = (height(position, vec2(-one_pixel_x, one_pixel_y)) - h) * sq;
  float hrb = (height(position, vec2(one_pixel_x, one_pixel_y)) - h) * sq;
  
  float dh = (hl + hr + ht + hb + hlt + hrt + hlb + hrb) / 4. / (1. + sq) - h * regression;
  
  // f += h * .1;
  a = dh * k;
  h += (v0 + a * dt / (1. - sticky)) * dt;
  gl_FragColor = vec4(h, v0 + a * dt, (hr - hl) * .5 * RESOLUTIONX, (ht - hb) * .5 * RESOLUTIONY);
}
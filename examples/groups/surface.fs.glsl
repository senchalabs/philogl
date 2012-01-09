#ifdef GL_ES
precision highp float;
#endif

#define PATTERN_DIM 128.0

#define GROUP_P1 0
#define GROUP_P2 1
#define GROUP_PM 2
#define GROUP_PG 3
#define GROUP_CM 4

uniform int group;
uniform float offset;
uniform float rotation;
uniform vec2 scaling;

uniform sampler2D sampler1;

void main(void) {
  vec2 pos = gl_FragCoord.xy;

  float xt =  pos.x * cos(rotation) * scaling.x + pos.y * sin(rotation) * scaling.y;
  float yt = -pos.x * sin(rotation) * scaling.x + pos.y * cos(rotation) * scaling.y;

  if (group == GROUP_P1) {
    
    float oyt = yt;
    yt = mod(yt, PATTERN_DIM) / PATTERN_DIM;
    float widthDim = PATTERN_DIM - offset;
    float from  = offset / PATTERN_DIM * yt;
    float to = 1. - offset * (1. - yt) / PATTERN_DIM;
    xt = mod(xt - offset * (oyt / PATTERN_DIM), widthDim) / widthDim * (to - from) + from;

  } else if (group == GROUP_P2) {
    
    float widthDim = PATTERN_DIM - offset;
    float oyt = yt;
    if (mod(yt / PATTERN_DIM, 2.0) < 1.0) {
      yt = mod(yt, PATTERN_DIM) / PATTERN_DIM;
      float from  = offset / PATTERN_DIM * yt;
      float to = 1. - offset * (1. - yt) / PATTERN_DIM;
      xt = mod(xt - offset * (oyt / PATTERN_DIM), widthDim) / widthDim * (to - from) + from;

    } else {
      yt = 1. - mod(yt, PATTERN_DIM) / PATTERN_DIM;
      float from  = 1. - offset / PATTERN_DIM * (1. - yt);
      float to = offset * yt / PATTERN_DIM;
      xt = mod(xt - offset * (oyt / PATTERN_DIM), widthDim) / widthDim * (to - from) + from;

    }

  } else if (group == GROUP_PM) {
    
    float heightDim = PATTERN_DIM - 2. * offset;
    float from = offset / PATTERN_DIM;
    float to = 1. - offset / PATTERN_DIM;
    xt = mod(xt, PATTERN_DIM) / PATTERN_DIM;

    if (mod(yt / heightDim, 2.0) < 1.0) {
      yt = mod(yt, heightDim) / heightDim * (to - from) + from;

    } else {
      yt = (1. - mod(yt, heightDim) / heightDim) * (to - from) + from;
    }

  } else if (group == GROUP_PG) {
    
    if (mod(xt / PATTERN_DIM, 2.0) < 1.0) {
      yt = mod(yt, PATTERN_DIM) / PATTERN_DIM;
    } else {
      yt = 1.0 - mod(yt, PATTERN_DIM) / PATTERN_DIM;
    }

    xt = mod(xt, PATTERN_DIM) / PATTERN_DIM;

  } else {
    
    xt = mod(xt, PATTERN_DIM) / PATTERN_DIM;
    yt = mod(yt, PATTERN_DIM) / PATTERN_DIM;

  }
  
  vec4 color = texture2D(sampler1, vec2(xt, yt));

  gl_FragColor = color;
}

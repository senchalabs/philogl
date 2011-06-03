#ifdef GL_ES
precision highp float;
#endif

varying vec4 vColor;
varying vec2 vTexCoord;
varying vec3 lightWeighting;

void main(){
  gl_FragColor = vec4(vColor.rgb * lightWeighting, vColor.a);
}


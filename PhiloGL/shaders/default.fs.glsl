#ifdef GL_ES
precision highp float;
#endif

varying vec4 vColor;
varying vec2 vTexCoord;
varying vec3 lightWeighting;

uniform bool hasTexture;
uniform sampler2D sampler;

void main(){
  
  if(!hasTexture) {
    gl_FragColor = vec4(vColor.rgb * lightWeighting, vColor.a);
  } else {
    gl_FragColor = vec4(texture2D(sampler, vec2(vTexCoord.s, vTexCoord.t)).rgb * lightWeighting, 1.0);
  }

}


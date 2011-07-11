#ifdef GL_ES
precision highp float;
#endif
//varyings
varying vec3 vReflection;
varying vec4 vNormal;
//texture configs
uniform bool hasTextureCube1;
uniform samplerCube samplerCube1;

void main(){
  //has cube texture then apply reflection
 if (hasTextureCube1) {
   vec3 nReflection = normalize(vec3(vReflection.x, -vReflection.y, vReflection.z));
   vec3 reflectionValue = -reflect(nReflection, vNormal.xyz);
   gl_FragColor = textureCube(samplerCube1, reflectionValue);
 }
}



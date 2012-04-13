#ifdef GL_ES
precision highp float;
#endif

uniform float RESOLUTIONX;
uniform float RESOLUTIONY;

#define LIGHT_MAX 40
#define PI 3.1415926535
varying vec2 vTexCoord;
varying vec4 vColor;
varying vec4 vPosition;
varying vec4 vNormal;
uniform vec3 eye;
uniform mat4 viewMatrix;
uniform mat4 viewInverseMatrix;
uniform sampler2D sampler1;
uniform sampler2D sampler2, sampler3, sampler4, sampler5, sampler6;
// uniform samplerCube samplerCube2;
uniform mat4 objectMatrix, worldMatrix;
uniform mat4 projectionMatrix;
uniform mat4 worldInverseMatrix;
uniform float n1, n2;
uniform float renderType;
uniform vec3 plainU;
uniform vec3 plainV;
uniform vec3 plainC;
vec3 hitPlane(vec3 dir, vec3 center, vec3 r1, vec3 r2, vec3 rc) {
  // rc + x r1 + y r2 = center + z dir
  // (r1, r2, -dir) . (x, y, z) = center - rc
  // center -= rc;
  // float det = dir.x * (r1.y * r2.z - r1.z * r2.y) +
  //             dir.y * (r1.z * r2.x - r1.x * r2.z) +
  //             dir.z * (r1.x * r2.y - r1.y * r2.x);
  // center *= 1.0 / det;
  // return vec3(
  //   center.x * (dir.y * r2.z - dir.z * r2.y) + center.y * (dir.z * r2.x - dir.y * r2.z) + center.z * (dir.y * r2.y - dir.y * r2.x),
  //   center.x * (dir.z * r1.y - dir.y * r1.z) + center.y * (dir.y * r1.z - dir.z * r1.x) + center.z * (dir.y * r1.x - dir.y * r1.y),
  //   center.z * (-r1.y * r2.x - r1.x * r2.y) + center.y * (r1.x * r2.z - r1.z * r2.x) + center.x * (r1.z * r2.y - r1.y * r2.z)
  // );
  center -= rc;
  vec4
      row0 = vec4(r1.x, r2.x, -dir.x, center.x),
      row1 = vec4(r1.y, r2.y, -dir.y, center.y),
      row2 = vec4(r1.z, r2.z, -dir.z, center.z);
  float maximum = row0.x;
  if (abs(row1.x) > abs(maximum)) {
    maximum = row1.x;
    vec4 temp = row0;
    row0 = row1;
    row1 = temp;
  }
  if (abs(row2.x) > abs(maximum)) {
    maximum = row2.x;
    vec4 temp = row0;
    row0 = row2;
    row2 = temp;
  }
  row0 *= 1.0 / maximum;
  row1 -= row0 * row1.x;
  row2 -= row0 * row2.x;
  maximum = row1.y;
  if (abs(row2.y) > abs(maximum)){
    maximum = row2.y;
    vec4 temp = row0;
    row0 = row2;
    row2 = temp;
  }
  row1 *= 1.0 / maximum;
  row0.yzw -= row1.yzw * row0.y;
  row2.yzw -= row1.yzw * row2.y;
  row2.zw /= row2.z;
  row0.zw -= row2.zw * row0.z;
  row1.zw -= row2.zw * row1.z;
  return vec3(row0.w, row1.w, row2.w);
}

vec4 sample(vec3 direction) {
  vec3 from = vPosition.xyz;
  vec3 hit = hitPlane(direction, from, plainU, plainV, plainC);
  if (abs(hit.x) <= 1.0 && abs(hit.y) <= 1.0 && hit.z >= 0.0) {
    vec2 samp = vec2((hit.x + 1.0) * 0.5, (hit.y + 1.0) * 0.5); 
    return texture2D(sampler6, vec2(samp.x, samp.y * 2.));
  }
  vec2 tex = vec2(atan(direction.y, direction.x) / 2. / PI - 0.3, -atan(direction.z, length(direction.xy)) / 2. / PI  + 0.5);
  vec3 color0 = texture2D(sampler1, tex).xyz,
       color1 = texture2D(sampler2, tex).xyz,
       color2 = texture2D(sampler3, tex).xyz,
       color3 = texture2D(sampler4, tex).xyz; 
  return vec4((color0 + color1 + color2 + color3), 1);
}

vec4 shot(vec3 position) {
  float n = n1 / n2;
  vec4 samp = texture2D(sampler1, vTexCoord);
  vec3 eyeDirection = normalize(position.xyz - eye);
  vec3 normal = normalize(vec3(-samp.ba * 10., 1));
  vec3 reflectVec = reflect(eyeDirection, normal);
  vec4 reflectColor = sample(reflectVec);
  vec3 refractVec;
  vec4 refractColor = vec4(0);
  vec4 reflectFilter = vec4(1);
  vec4 refractFilter = vec4(0.8, 0.9, 1., 1);
  float reflectionFactor = 0.;
  
  // http://en.wikipedia.org/wiki/Fresnel_equations
  if (dot(eyeDirection, normal) > 0.) {
    normal = -normal;
    n = 1. / n;
    reflectFilter = vec4(0.6, 0.8, 1., 1);
    refractFilter = vec4(0.8, 0.9, 1., 1);
  }
  
  refractVec = refract(eyeDirection, normal, n);
  refractColor = sample(refractVec);
    
  float cosSi = dot(-eyeDirection, normal);
  float refl = clamp(sqrt(1. - cosSi * cosSi) * n, -1., 1.);
  float cosSt = sqrt(1. - refl * refl);
  float sist = cosSi / cosSt;
  float Rs = 1. - 2. / (n * sist + 1.);
  float Rp = 1. - 2. / (n / sist + 1.);
  Rs *= Rs;
  Rp *= Rp;
  reflectionFactor = (Rs + Rp) * 0.5;
  return mix(reflectColor * reflectFilter, refractColor * refractFilter, 1. - reflectionFactor);
}

void main(void) {
  float px = .005;
  gl_FragColor = shot(vPosition.xyz);
}

//shaders.js
//Default Shaders

(function() {
  //Add default shaders
  var Shaders = {
    Vertex: {},
    Fragment: {}
  };

  var VertexShaders = Shaders.Vertex,
      FragmentShaders = Shaders.Fragment;

  VertexShaders.Default = [
    
    "attribute vec3 position;",
    "attribute vec3 normal;",
    "attribute vec4 color;",
    "attribute vec2 texCoord1;",
    
    "uniform mat4 modelViewMatrix;",
    "uniform mat4 viewMatrix;",
    "uniform mat4 projectionMatrix;",
    "uniform mat4 normalMatrix;",

    "uniform bool enableLights;",
    "uniform vec3 ambientColor;",
    "uniform vec3 directionalColor;",
    "uniform vec3 lightingDirection;",

    "uniform bool enablePoint1;",
    "uniform vec3 pointLocation1;",
    "uniform vec3 pointColor1;",

    "uniform bool enablePoint2;",
    "uniform vec3 pointLocation2;",
    "uniform vec3 pointColor2;",
    
    "uniform bool enablePoint3;",
    "uniform vec3 pointLocation3;",
    "uniform vec3 pointColor3;",
   
    "varying vec4 vColor;",
    "varying vec2 vTexCoord;",
    "varying vec3 lightWeighting;",
    
    "void main(void) {",
      "vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);",
      
      "if(!enableLights) {",
        "lightWeighting = vec3(1.0, 1.0, 1.0);",
      "} else {",
        "vec3 plightDirection;",
        "vec3 pointWeight1 = vec3(0.0, 0.0, 0.0);",
        "vec3 pointWeight2 = vec3(0.0, 0.0, 0.0);",
        "vec3 pointWeight3 = vec3(0.0, 0.0, 0.0);",

        "vec4 transformedNormal = normalMatrix * vec4(normal, 1.0);",
        
        "float directionalLightWeighting = max(dot(transformedNormal.xyz, lightingDirection), 0.0);",

        "if(enablePoint1) {",
          "plightDirection = normalize((viewMatrix * vec4(pointLocation1, 1.0)).xyz - mvPosition.xyz);",
          "pointWeight1 = max(dot(transformedNormal.xyz, plightDirection), 0.0) * pointColor1;",
        "}",
        
        "if(enablePoint2) {",
          "plightDirection = normalize((viewMatrix * vec4(pointLocation2, 1.0)).xyz - mvPosition.xyz);",
          "pointWeight2 = max(dot(transformedNormal.xyz, plightDirection), 0.0) * pointColor2;",
        "}",
        
        "if(enablePoint3) {",
          "plightDirection = normalize((viewMatrix * vec4(pointLocation3, 1.0)).xyz - mvPosition.xyz);",
          "pointWeight3 = max(dot(transformedNormal.xyz, plightDirection), 0.0) * pointColor3;",
        "}",

        "lightWeighting = ambientColor + (directionalColor * directionalLightWeighting) + pointWeight1 + pointWeight2 + pointWeight3;",
      "}",
      
      "vColor = color;",
      "vTexCoord = texCoord1;",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}"
  
  ].join("\n");


 FragmentShaders.Default = [

    "#ifdef GL_ES",
    "precision highp float;",
    "#endif",
    
    "varying vec4 vColor;",
    "varying vec2 vTexCoord;",
    "varying vec3 lightWeighting;",
    
    "uniform bool hasTexture1;",
    "uniform sampler2D sampler1;",

    "void main(){",
      
      "if(!hasTexture1) {",
        "gl_FragColor = vec4(vColor.rgb * lightWeighting, vColor.a);",
      "} else {",
        "gl_FragColor = vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb * lightWeighting, 1.0);",
      "}",
    
    "}"

  ].join("\n");

  PhiloGL.Shaders = Shaders;
  
})();

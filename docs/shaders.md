--- 
layout: docs 
title: Shaders 
categories: [Documentation]
---

Object: Shaders {#Shaders}
===============================

An object that contains default shaders that could be used with the [Scene](scene.html) class. Only one vertex shader and one fragment 
shader are shipped in this object. This is so because we encourage having shaders in separate files and access them in 
an asynchronous way by using `Program.fromShaderURIs` and other methods available in the Framework. You can set shader strings 
into `Shaders.Vertex` and `Shaders.Fragment`. We provide a default vertex and fragment shader in `Shaders.Vertex.Default` and 
`Shaders.Fragment.Default`. These shaders can also be conveniently used with `Program.fromDefaultShaders(vertexShaderName, fragmentShaderName)`.


Shaders Object: Vertex {#Shaders:Vertex}
--------------------------------------

Append in this object vertex shaders to be used with a [Scene](scene.html). We provide `Shaders.Vertex.Default` which is the 
default shader used in the library. You can find more scene compatible shaders [here](https://github.com/senchalabs/philogl/tree/master/shaders). 
In order to get familiar with the attributes and uniforms used by the [Scene](scene.html) we provide the default vertex shader code:

        #define LIGHT_MAX 50

        attribute vec3 position;
        attribute vec3 normal;
        attribute vec4 color;
        attribute vec2 texCoord1;

        uniform mat4 modelViewMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 normalMatrix;

        uniform bool enableLights;
        uniform vec3 ambientColor;
        uniform vec3 directionalColor;
        uniform vec3 lightingDirection;

        uniform vec3 pointLocation[LIGHT_MAX];
        uniform vec3 pointColor[LIGHT_MAX];
        uniform int numberPoints;

        varying vec4 vColor;
        varying vec2 vTexCoord;
        varying vec3 lightWeighting;

        void main(void) {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          if(!enableLights) {
            lightWeighting = vec3(1.0, 1.0, 1.0);
          } else {
            vec3 plightDirection;
            vec3 pointWeight = vec3(0.0, 0.0, 0.0);
            vec4 transformedNormal = normalMatrix * vec4(normal, 1.0);
            float directionalLightWeighting = max(dot(transformedNormal.xyz, lightingDirection), 0.0);
            for (int i = 0; i < LIGHT_MAX; i++) {
              if (i < numberPoints) {
                plightDirection = normalize((viewMatrix * vec4(pointLocation[i], 1.0)).xyz - mvPosition.xyz);
                pointWeight += max(dot(transformedNormal.xyz, plightDirection), 0.0) * pointColor[i];
              } else {
                break;
              }
            }

            lightWeighting = ambientColor + (directionalColor * directionalLightWeighting) + pointWeight;
          }
          
          vColor = color;
          vTexCoord = texCoord1;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }

### Syntax:

	PhiloGL.Shaders.Vertex.MyName = shaderCode;

### Examples:

See the example on how to extend the fragment shader object below.


Shaders Object: Fragment {#Shaders:Fragment}
-----------------------------------------

Append in this object fragment shaders to be used with a [Scene](scene.html). We provide `Shaders.Fragment.Default` which is the 
default shader used in the library. You can find more scene compatible shaders [here](https://github.com/senchalabs/philogl/tree/master/shaders). 
In order to get familiar with the attributes and uniforms used by the [Scene](scene.html) we provide the default fragment shader code:

        #ifdef GL_ES
        precision highp float;
        #endif

        varying vec4 vColor;
        varying vec2 vTexCoord;
        varying vec3 lightWeighting;

        uniform bool hasTexture1;
        uniform sampler2D sampler1;

        uniform bool enablePicking;
        uniform vec3 pickColor;

        uniform bool hasFog;
        uniform vec3 fogColor;

        uniform float fogNear;
        uniform float fogFar;

        void main(){
          
          if(!hasTexture1) {
            gl_FragColor = vec4(vColor.rgb * lightWeighting, vColor.a);
          } else {
            gl_FragColor = vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb * lightWeighting, 1.0);
          }

          if(enablePicking) {
            gl_FragColor = vec4(pickColor, 1.0);
          }
          
          /* handle fog */
          if (hasFog) {
            float depth = gl_FragCoord.z / gl_FragCoord.w;
            float fogFactor = smoothstep(fogNear, fogFar, depth);
            gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w), fogFactor);
          }  

        }


### Syntax:

	PhiloGL.Shaders.Fragment.MyName = shaderCode;

### Examples:

Extending the Fragment Shader object to use a blending uniform. You can see the entire example in [lesson 8](http://senchalabs.github.com/philogl/PhiloGL/examples/lessons/8/).

{% highlight js %}
//Add Blend Fragment Shader
PhiloGL.Shaders.Fragment.Blend = [

    "#ifdef GL_ES",
    "precision highp float;",
    "#endif",
    
    "varying vec4 vColor;",
    "varying vec2 vTexCoord;",
    "varying vec3 lightWeighting;",
    
    "uniform bool hasTexture1;",
    "uniform sampler2D sampler1;",
    "uniform float alpha;",

    "void main(){",
      
      "if (hasTexture1) {",
      
        "gl_FragColor = vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb * lightWeighting, alpha);",

      "}",
    
    "}"

].join("\n");
{% endhighlight %}



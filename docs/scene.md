--- 
layout: docs 
title: Scene 
categories: [Documentation]
---

Class: Scene {#Scene}
===============================

The Scene class abstracts the use of low level code for lighting and other effects and creates a high level structure that 
plays well with objects created with [O3D](o3d.html) and the default shaders in [Shaders](shaders.html) to enable rendering of multiple 
models in the scene with different options. The Scene role is to connect the properties set in the [O3D](o3d.html) models to the 
attributes defined in the shaders so that the buffer creation and updating is transparent to the user. 
The good thing about the design though is that the Scene provides many callback functions that can be executed at different 
stages of the rendering process for the user to update or bypass setting of the attributes and uniforms. This also enables you 
to create your own shader files that are compatible with the [Scene](scene.html) class. Some examples of [Scene](scene.html) compatible shader 
files can be found [here](https://github.com/senchalabs/philogl/tree/master/shaders). Also, for more information about the 
default shaders take a look at the [Shaders](shaders.html) class. The [O3D](o3d.html) options describe how to override or set callbacks when rendering 
objects with a default scene.


Scene Method: constructor {#Scene:constructor}
------------------------------------------------

Creates a new [Scene](scene.html) instance.

### Syntax:

	var scene = new PhiloGL.Scene(program, camera, options);

### Arguments:

1. program - (*object*) A Program instance. For more information check the [Program](program.html) class.
2. camera - (*object*) A Camera instance. For more information check the [Camera](camera.html) class.
3. options - (*object*) An object with the following properties:

### Options:

* lights - (*object*, optional) An object for managing lights. The options for lighting are:
  * enable - (*boolean*) Set this to `true` to enable lighting.
  * ambient - (*object*, optional) A r, g, b object with values in [0, 1] to select ambient lighting.
  * directional - (*object*, optional) An object with properties:
    * direction - (*object*) An object with x, y, z coordinates to display the light direction.
    * color - (*object*) A r, g, b object with values in [0, 1] to select the color.
  * points - (*mixed*, optional) An array of up to 3 point lights configuration objects containing as properties:
    * position - (*object*) A x, y, z object with the point light position.
    * color|diffuse - (*object*) A r, g, b object with values in [0, 1] that sets the (diffuse) color for the point light.
    * specular - (*object*, optional) A r, g, b object with values in [0, 1] that sets the specular light color.

### Examples:

Create a new Scene instance. Taken from [lesson 16](http://senchalabs.github.com/philogl/PhiloGL/examples/lessons/16/).

{% highlight js %}
var innerScene = new PhiloGL.Scene(program, innerCamera, {
  lights: {
    enable: true,
    points: {
      position: {
        x: -1, y: 2, z: -1
      },
      diffuse: {
        r: 0.8, g: 0.8, b: 0.8
      },
      specular: {
        r: 0.8, g: 0.8, b: 0.8
      }
    }
  }
});
{% endhighlight %}


Scene Method: add {#Scene:add}
--------------------------------

Add an [O3D](o3d.html) object to the Scene.

### Syntax:

    scene.add(o[, ...]);

### Arguments:

A variable argument list of [O3D](o3d.html) instances.

### Examples:

Add a moon and a box models to the scene. Taken from [lesson 12](http://senchalabs.github.com/philogl/PhiloGL/examples/lessons/12/).

{% highlight js %}
//Add objects to the scene
scene.add(moon, box);
{% endhighlight %}


Scene Method: render {#Scene:render}
--------------------------------------

Renders all the objects added to the scene.

### Syntax:

    scene.render();


Scene Method: renderToTexture {#Scene:renderToTexture}
-------------------------------------------------------

Performs `scene.render()` but binds a texture afterwards to store the rendered image in the texture itself and not the main 
buffer.

### Syntax:

    scene.renderToTexture(name);

### Arguments:

1. name - (*string*) The name/id of the texture to bind the rendering to.

### Examples:

Bind a framebuffer, render the scene to a texture, and unbind the framebuffer. This is the procedure done 
to render the inner scene in the laptop example on [lesson 16](http://senchalabs.github.com/philogl/PhiloGL/examples/lessons/16/http://senchalabs.github.com/philogl/PhiloGL/examples/lessons/16/).

{% highlight js %}
function drawInnerScene() {
  program.setFrameBuffer('monitor', true);
  
  gl.viewport(0, 0, screenWidth, screenHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  theta += 0.01;
  
  moon.position = {
    x: rho * Math.cos(theta),
    y: 0,
    z: rho * Math.sin(theta)
  };
  moon.update();
  
  box.position = {
    x: rho * Math.cos(Math.PI + theta),
    y: 0,
    z: rho * Math.sin(Math.PI + theta)
  };
  box.update();
  
  innerScene.renderToTexture('monitor');
  
  program.setFrameBuffer('monitor', false);
}
{% endhighlight %}


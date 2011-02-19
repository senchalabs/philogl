--- 
layout: docs 
title: O3D 
categories: [Documentation]
---

Module: O3D {#O3D}
===========================

O3D provides Model management and 3D primitives. Here you'll find methods for creating 
3D models and primitives that are compatible with the [Scene](scene.html) class.


O3D Class: O3D.Model {#O3D:Model}
----------------------------------

The class Model enables you to create 3D models which are compatible with the 
[Scene](scene.html) class. All primitives (Sphere, etc) inherit from Model too.


### Properties:

A Model instance has a number of public properties that can be accessed/modified:

* position - (*object*) A `Vec3` indicating the position of the Model.
* rotation - (*object*) A `Vec3` indicating the rotation of the Model.
* scale - (*object*) A `Vec3` indicating the scaling of the Model.
* matrix - (*object*) A `Mat4` containing information about position, rotation and scale. 
This matrix gets updated each time the method `update` is called on a Model instance.


O3D.Model Method: constructor {#O3D:Model:constructor}
-------------------------------------------------------

The main constructor function for the Model class. Use this to create a new Model.

### Syntax:

	var model = new PhiloGL.O3D.Model(options);

### Arguments:

1. options - (*object*) An object containing the following options:

### Options:

* dynamic - (*boolean*, optional) If true then the vertices and normals will always be updated in the Buffer Objects before rendering. Default's false.
* vertices - (*array*, optional) An array of floats that describe the vertices of the model.
* normals - (*array*, optional) An array of floats that describe the normals of the model.
* textures - (*array*, optional) An array of strings of texture ids.
* colors - (*array*, optional) An array of colors in RGBA. If just one color is specified that color will be used for all faces.
* indices - (*array*, optional) An array of numbers describing the vertex indices for each face.
* shininess - (*number*, optional) A number between [0.1, 200] describing how shiny an object is.
* uniforms - (*object*, optional) An object with uniform names and values to be set before rendering the model.
* render - (*function*, optional) A function to be called for rendering the object instead of the default [Scene](scene.html) rendering methods.
* drawType - (*string*, optional) A string describing the drawType. Some options are `TRIANGLES`, `TRIANGLE_STRIP`, `POINTS`, `LINES`. Default's `TRIANGLES`.
* texCoords - (*mixed*, optional) Can be an array of floats indicating the texture coordinates for the texture to be used or an object that has texture ids as keys and 
array of floats as values (to handle multiple textures).
* onBeforeRender - (*function*, optional) Called before rendering an object. The first two formal parameters are the program and the camera respectively.
* onAfterRender - (*function*, optional) Called after rendering an object. The first two formal parameters are the program and the camera respectively.


### Examples:

Create a pyramid model (used in lesson 4 of learning WebGL examples).

{% highlight js %}
var pyramid = new PhiloGL.O3D.Model({
    vertices: [[ 0,  1,  0],
               [-1, -1,  1],
               [ 1, -1,  1],
               [ 0,  1,  0],
               [ 1, -1,  1],
               [ 1, -1, -1],
               [ 0,  1,  0],
               [ 1, -1, -1],
               [-1, -1, -1],
               [ 0,  1,  0],
               [-1, -1, -1],
               [-1, -1,  1]],
    
    colors: [[1, 0, 0, 1],
             [0, 1, 0, 1],
             [0, 0, 1, 1],
             [1, 0, 0, 1],
             [0, 0, 1, 1],
             [0, 1, 0, 1],
             [1, 0, 0, 1],
             [0, 1, 0, 1],
             [0, 0, 1, 1],
             [1, 0, 0, 1],
             [0, 0, 1, 1],
             [0, 1, 0, 1]]
  });
{% endhighlight %}


O3D.Model Method: update {#O3D:Model:update}
---------------------------------------------

Update the model matrix. Useful to update changes to the `position`, `rotation` or `scale` properties.

### Syntax:

	model.update();

### Examples:

Change the position of the pyramid model and update its matrix.

{% highlight js %}
  pyramid.position = {
    x: 10,
    y: 10,
    z: 20
  };
  
  pyramid.update();
{% endhighlight %}

O3D.Model Method: toFloat32Array {#O3D:Model:toFloat32Array}
-------------------------------------------------------------

Returns a `Float32Array` version of the named property.

### Syntax:

	model.toFloat32Array(name);

### Arguments:

1. name - (*string*) The name of the property to be converted into a `Float32Array`. Can be `vertices`, `normals`, `colors`, etc.

### Examples:

Make the pyramid model return a `Float32Array` of the vertices array.

{% highlight js %}
  pyramid.toFloat32Array('vertices'); //returns the Float32Array of the vertices array.
{% endhighlight %}


O3D.Model Method: toUint16Array {#O3D:Model:toUint16Array}
-------------------------------------------------------------

Returns a `Uint16Array` version of the named property.

### Syntax:

	model.toUint16Array(name);

### Arguments:

1. name - (*string*) The name of the property to be converted into a `Uint16Array`. Can be `indices`, etc.

### Examples:

Make the pyramid model return a `Uint16Array` of the indices array.

{% highlight js %}
  pyramid.toUint16Array('indices'); //returns the Uint16Array of the indices array.
{% endhighlight %}


O3D Class: O3D.Cube {#O3D:Cube}
----------------------------------

Creates a Cube model. Inherits instance methods from O3D.Model.

### Extends

O3D.Model


O3D.Cube Method: constructor {#O3D:Cube:constructor}
-------------------------------------------------------

The main constructor function for the Cube class. Use this to create a new Cube. Accepts the same properties and 
options as O3D.Model constructor but has preset for `vertices`, `normals` and `indices`.

### Syntax:

	var model = new PhiloGL.O3D.Cube(options);

### Arguments:

1. options - (*object*) The same options as in O3D.Model constructor but has preset for `vertices`, `normals` and `indices`.

### Examples:

Create a white cube.

{% highlight js %}
var whiteCube = new PhiloGL.O3D.Cube({
      colors: [1, 1, 1, 1]
    });
{% endhighlight %}


O3D Class: O3D.Sphere {#O3D:Sphere}
------------------------------------

Creates a Sphere model.

### Extends

O3D.Model


O3D.Sphere Method: constructor {#O3D:Sphere:constructor}
---------------------------------------------------------

The main constructor function for the Sphere class. Use this to create a new Sphere. 

### Syntax:

	var model = new PhiloGL.O3D.Sphere(options);

### Arguments:

1. options - (*object*) An object containing as poperties:

### Options:

* nlat - (*number*, optional) The number of vertices for latitude. Default's 10.
* nlong - (*number*, optional) The number of vertices for longitude. Default's 10.
* radius - (*number*, optional) The radius of the sphere. Default's 1.

### Examples:

Create a white Sphere of radius 2.

{% highlight js %}
var whiteSphere = new PhiloGL.O3D.Sphere({
  radius: 2,
  colors: [1, 1, 1, 1]
});
{% endhighlight %}



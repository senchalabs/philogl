--- 
layout: docs 
title: Math
categories: [Documentation]
---

Script: Math {#Math}
===========================

The Math script provides `Vec3` and `Mat4` classes to manage three dimensional vectors and four by four matrices respectively. 

### Generics:

One very interesting thing to point about the Math script is that all `Vec3` and `Mat4` methods are generics. This means that all 
instance methods of `Vec3` and `Mat4` can also be accessed as static methods in which the first parameter of the static method is the receiver. 
The receiver does not *have to be* an instance of the class but can instead be a `Vec3`-like or `Mat4`-like object. 
This means that a simple object (i.e `{}`) can be used as the receiver for these methods. 

Although the *syntax* section for each method will include the generic and non-generic one, the arguments for each method will be described as with the instance 
method syntax.

### Chainable Methods:

All methods that do not return something in particular in the math package are chainable.

### Conventions:

Say you want to add two `Vec3` vectors, `v1` and `v2`. Then there are three ways of performing this operation:

1. `v1.add(v2)` Returns a new class with the result of adding `v1` and `v2`. This operation does not modify `v1` or `v2`.
2. `v1.$add(v2)` Returns the result of adding `v1` to `v2`, but it alters `v1` updating it with the result.
3. `vResult.add2(v1, v2)` Stores the result of adding `v1` to `v2` in `vResult`, another `Vec3` instance.

These are the conventions we will be using for method naming. Methods altering the receiver will have a dollar sign (i.e. `$`), as opposed to 
methods creating a new instance with the result. Methods requiring a receiver *and* the instances involved in the operation as formal parameters 
will be suffixed with the number `2`.


Class: Vec3 {#Vec3}
===========================

A class to handle three dimensional vectors.


Vec3 Method: constructor {#Vec3:constructor}
----------------------------------------------------

Creates a new `Vec3` instance.

### Syntax:

	var v = new PhiloGL.Vec3(x, y, z);

### Arguments:

1. x - (*number*, optional) The x component. If not provided is 0.
2. y - (*number*, optional) The y component. If not provided is 0.
3. z - (*number*, optional) The z component. If not provided is 0.

### Examples:

Create a (0, 0, 0) vector.

{% highlight js %}
  var v = new PhiloGL.Vec3();
{% endhighlight %}

Create a (1, 2, 3) vector.

{% highlight js %}
  var v = new PhiloGL.Vec3(1, 2, 3);
{% endhighlight %}


Vec3 Method: setVec3 {#Vec3:setVec3}
------------------------------------

Set `x`, `y`, `z` coordinates of one `Vec3` into another `Vec3`.

### Syntax:

	v1.setVec3(v2);

    PhiloGL.Vec3.setVec3(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and assign one vectors components to the other one.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3),
      v2 = new PhiloGL.Vec3(4, 5, 6);

  v1.setVec3(v2); //v1 now contains (x=4, y=5, z=6)
{% endhighlight %}

Set an object's `x`, `y`, `z` components to another object.

{% highlight js %}
  var v1 = {},
      v2 = {
        x: 4,
        y: 5,
        z: 6
      };

  PhiloGL.Vec3.setVec3(v1, v2); //v1 now has (x=4, y=5, z=6)
{% endhighlight %}


Vec3 Method: set {#Vec3:set}
-------------------------------

Set `x`, `y`, `z` coordinates.

### Syntax:

	v1.set(x, y, z);

    PhiloGL.Vec3.set(v1, x, y, z);

### Arguments:

1. x - (*number*) The x coordinate.
2. y - (*number*) The y coordinate.
3. z - (*number*) The z coordinate.

### Examples:

Create two vectors and assign one vectors components to the other one.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3),
      v2 = new PhiloGL.Vec3(4, 5, 6);

  v1.set(v2.x, v2.y, v2.z); //v1 now contains (x=4, y=5, z=6)
{% endhighlight %}

Set an object's `x`, `y`, `z` components to another object.

{% highlight js %}
  var v1 = {},
      v2 = {
        x: 4,
        y: 5,
        z: 6
      };

  PhiloGL.Vec3.set(v1, v2.x, v2.y, v2.z); //v1 now has (x=4, y=5, z=6)
{% endhighlight %}

Vec3 Method: add {#Vec3:add}
-----------------------------

Adds the `x`, `y`, `z` components of two `Vec3` objects. Creates a new `Vec3` instance and does not modify the original objects.

### Syntax:

	v1.add(v2);

    PhiloGL.Vec3.add(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and add them.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3),
      v2 = new PhiloGL.Vec3(4, 5, 6);

  v1.add(v2); //v1 and v2 are still the same but a new Vec3(5, 7, 9) was created.
{% endhighlight %}

Create two `x`, `y`, `z` objects and add them.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      },
      v2 = {
        x: 4,
        y: 5,
        z: 6
      };

  PhiloGL.Vec3.add(v1, v2); //v1 and v2 are still the same but a new Vec3(5, 7, 9) was created.
{% endhighlight %}


Vec3 Method: $add {#Vec3:$add}
------------------------------------

Adds the `x`, `y`, `z` components of two `Vec3` objects. Modifies the original object.

### Syntax:

	v1.$add(v2);

    PhiloGL.Vec3.$add(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and add them.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3),
      v2 = new PhiloGL.Vec3(4, 5, 6);

  v1.$add(v2); //v1 is now Vec3(5, 7, 9).
{% endhighlight %}

Create two `x`, `y`, `z` objects and add them.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      },
      v2 = {
        x: 4,
        y: 5,
        z: 6
      };

  PhiloGL.Vec3.$add(v1, v2); //v1 is now { x: 5, y: 7, z: 9 }.
{% endhighlight %}

Vec3 Method: add2 {#Vec3:add2}
------------------------------------

Adds the `x`, `y`, `z` components of two `Vec3` objects and stores the result in the receiver.

### Syntax:

	v1.add2(v2, v3);

    PhiloGL.Vec3.add2(v1, v2, v3);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.
2. v3 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and add them.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(),
      v2 = new PhiloGL.Vec3(1, 2, 3),
      v3 = new PhiloGL.Vec3(4, 5, 6);

  v1.add2(v2, v3); //v1 is now Vec3(5, 7, 9), v2 and v3 are unchanged.
{% endhighlight %}

Create two `x`, `y`, `z` objects and add them.

{% highlight js %}
  var v1 = {},
      v2 = {
        x: 1,
        y: 2,
        z: 3
      },
      v3 = {
        x: 4,
        y: 5,
        z: 6
      };

  PhiloGL.Vec3.add2(v1, v2, v3); //v2 and v3 are still the same but v1 is { x: 5, y: 7, z: 9 }.
{% endhighlight %}


Vec3 Method: sub {#Vec3:sub}
------------------------------------

Substracts the `x`, `y`, `z` components of two `Vec3` objects. Creates a new `Vec3` instance and does not modify the original objects.

### Syntax:

	v1.sub(v2);

    PhiloGL.Vec3.sub(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and substract them.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3),
      v2 = new PhiloGL.Vec3(4, 5, 6);

  v1.sub(v2); //v1 and v2 are still the same but a new Vec3(-3, -3, -3) was created.
{% endhighlight %}

Create two `x`, `y`, `z` objects and substract them.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      },
      v2 = {
        x: 4,
        y: 5,
        z: 6
      };

  PhiloGL.Vec3.sub(v1, v2); //v1 and v2 are still the same but a new Vec3(-3, -3, -3) was created.
{% endhighlight %}


Vec3 Method: $sub {#Vec3:$sub}
------------------------------------

Substracts the `x`, `y`, `z` components of two `Vec3` objects. Modifies the original object.

### Syntax:

	v1.$sub(v2);

    PhiloGL.Vec3.$sub(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and substract them.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3),
      v2 = new PhiloGL.Vec3(4, 5, 6);

  v1.$sub(v2); //v1 is now Vec3(-3, -3, -3).
{% endhighlight %}

Create two `x`, `y`, `z` objects and add them.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      },
      v2 = {
        x: 4,
        y: 5,
        z: 6
      };

  PhiloGL.Vec3.$sub(v1, v2); //v1 is now { x: -3, y: -3, z: -3 }.
{% endhighlight %}

Vec3 Method: sub2 {#Vec3:sub2}
------------------------------------

Substracts the `x`, `y`, `z` components of two `Vec3` objects and stores the result in the receiver.

### Syntax:

	v1.sub2(v2, v3);

    PhiloGL.Vec3.sub2(v1, v2, v3);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.
2. v3 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and substract them.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(),
      v2 = new PhiloGL.Vec3(1, 2, 3),
      v3 = new PhiloGL.Vec3(4, 5, 6);

  v1.sub2(v2, v3); //v1 is now Vec3(-3, -3, -3), v2 and v3 are unchanged.
{% endhighlight %}

Create two `x`, `y`, `z` objects and substract them.

{% highlight js %}
  var v1 = {},
      v2 = {
        x: 1,
        y: 2,
        z: 3
      },
      v3 = {
        x: 4,
        y: 5,
        z: 6
      };

  PhiloGL.Vec3.sub2(v1, v2, v3); //v2 and v3 are still the same but v1 is { x: -3, y: -3, z: -3 }.
{% endhighlight %}


Vec3 Method: scale {#Vec3:scale}
------------------------------------

Scales the Vec3 vector by a real number. Creates a new Vec3 with the scaled components.

### Syntax:

	v1.scale(s);

    PhiloGL.Vec3.scale(v1, s);

### Arguments:

1. s - (*number*) A real number to scale the Vec3.

### Examples:

Create a vector and scale it by 2.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3);

  v1.scale(2); //v1 is unchanged but a new Vec3(2, 4, 6) is created.
{% endhighlight %}

Create an `x`, `y`, `z` object and scale it by 2.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      };

  PhiloGL.Vec3.scale(v1, 2); //v1 is still the same but a new Vec3(2, 4, 6) was created.
{% endhighlight %}


Vec3 Method: $scale {#Vec3:$scale}
------------------------------------

Scales the Vec3 vector by a real number. Changes the original object.

### Syntax:

	v1.$scale(s);

    PhiloGL.Vec3.$scale(v1, s);

### Arguments:

1. s - (*number*) A real number to scale the Vec3.

### Examples:

Create a vector and scale it by 2.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3);

  v1.$scale(2); //v1 is now Vec3(2, 4, 6).
{% endhighlight %}

Create an `x`, `y`, `z` object and scale it by 2.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      };

  PhiloGL.Vec3.$scale(v1, 2); //v1 is now { x: 2, y: 4, z: 6 }.
{% endhighlight %}


Vec3 Method: neg {#Vec3:neg}
------------------------------------

Negates a `Vec3`. Returns a new instance.

### Syntax:

	v1.neg();

    PhiloGL.Vec3.neg(v1);

### Examples:

Create a vector and negate it.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3);

  v1.neg(); //v1 is unchanged but a new Vec3(-1, -2, -3) is created.
{% endhighlight %}

Create an `x`, `y`, `z` object and negate it.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      };

  PhiloGL.Vec3.neg(v1); //v1 is still the same but a new Vec3(-1, -2, -3).
{% endhighlight %}


Vec3 Method: $neg {#Vec3:$neg}
------------------------------------

Negates a `Vec3`. Changes the original object.

### Syntax:

	v1.$neg();

    PhiloGL.Vec3.$neg(v1);

### Examples:

Create a vector and negate it.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3);

  v1.$neg(); //v1 is now Vec3(-1, -2, -3).
{% endhighlight %}

Create an `x`, `y`, `z` object and negate it.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      };

  PhiloGL.Vec3.neg(v1); //v1 is now { x: -1, y: -2, z: -3).
{% endhighlight %}


Vec3 Method: unit {#Vec3:unit}
------------------------------------

Creates a unit vector from the coordinates of `Vec3`.

### Syntax:

	v1.unit();

    PhiloGL.Vec3.unit(v1);

### Examples:

Create a vector and make a unit vector from it.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3);

  v1.unit(); //v1 is unchanged but a new unit vector Vec3 is created.
{% endhighlight %}

Create an `x`, `y`, `z` object and make a unit vector from it.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      };

  PhiloGL.Vec3.unit(v1); //v1 is still the same but a new Vec3 that is a unit vector is created.
{% endhighlight %}


Vec3 Method: $unit {#Vec3:$unit}
------------------------------------

Creates a unit vector from the `Vec3` coordinates. Changes the original object.

### Syntax:

	v1.$unit();

    PhiloGL.Vec3.$unit(v1);

### Examples:

Create a vector and make a unit vector from it.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3);

  v1.$unit(); //v1 is now a unit vector.
{% endhighlight %}

Create an `x`, `y`, `z` object make a unit vector from it.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      };

  PhiloGL.Vec3.$unit(v1); //v1 is now a unit vector object.
{% endhighlight %}


Vec3 Method: cross {#Vec3:cross}
------------------------------------

Makes a cross product of two `Vec3` instances. Creates a new `Vec3` and does not modify the original objects. 
You can find more information about the cross product [here](http://en.wikipedia.org/wiki/Cross_product).

### Syntax:

	v1.cross(v2);

    PhiloGL.Vec3.cross(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and make a cross product.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3),
      v2 = new PhiloGL.Vec3(4, 5, 6);

  v1.cross(v2); //v1 and v2 are still the same but a new Vec3 was created with the result.
{% endhighlight %}

Create two `x`, `y`, `z` objects and make a cross product.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      },
      v2 = {
        x: 4,
        y: 5,
        z: 6
      };

  //v1 and v2 are still the same but a new Vec3 with the result was created.
  var ans = PhiloGL.Vec3.cross(v1, v2);
{% endhighlight %}


Vec3 Method: $cross {#Vec3:$cross}
------------------------------------

Makes a cross product of two `Vec3` instances. Modifies the original object. 
You can find more information about the cross product [here](http://en.wikipedia.org/wiki/Cross_product).

### Syntax:

	v1.$cross(v2);

    PhiloGL.Vec3.$cross(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and make a cross product.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3),
      v2 = new PhiloGL.Vec3(4, 5, 6);

  v1.$cross(v2); //v1 contains now the result.
{% endhighlight %}

Create two `x`, `y`, `z` objects and make a cross product.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      },
      v2 = {
        x: 4,
        y: 5,
        z: 6
      };

  //v1 contains now the result.
  var ans = PhiloGL.Vec3.$cross(v1, v2);
{% endhighlight %}


Vec3 Method: distTo {#Vec3:distTo}
------------------------------------

Calculates the distance between two `Vec3`.

### Syntax:

	v1.distTo(v2);

    PhiloGL.Vec3.distTo(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and calculate the distance.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3),
      v2 = new PhiloGL.Vec3(4, 5, 6);

  v1.distTo(v2); //a real value with the distance is returned.
{% endhighlight %}

Create two `x`, `y`, `z` objects and calculate their distance.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      },
      v2 = {
        x: 4,
        y: 5,
        z: 6
      };

  //a real number with the distance is returned.
  var ans = PhiloGL.Vec3.distTo(v1, v2);
{% endhighlight %}


Vec3 Method: distToSq {#Vec3:distToSq}
------------------------------------

Calculates the squared distance between two `Vec3`.

### Syntax:

	v1.distToSq(v2);

    PhiloGL.Vec3.distToSq(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and calculate the squared distance.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3),
      v2 = new PhiloGL.Vec3(4, 5, 6);

  v1.distToSq(v2); //a real value with the squared distance is returned.
{% endhighlight %}

Create two `x`, `y`, `z` objects and calculate their squared distance.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      },
      v2 = {
        x: 4,
        y: 5,
        z: 6
      };

  //a real number with the squared distance is returned.
  var ans = PhiloGL.Vec3.distToSq(v1, v2);
{% endhighlight %}


Vec3 Method: norm {#Vec3:norm}
------------------------------------

Calculates the norm of `Vec3`.

### Syntax:

	v1.norm();

    PhiloGL.Vec3.norm(v1);

### Examples:

Create a vector and calculate its norm.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3);

  vi.norm(); //returns the real valued norm.
{% endhighlight %}

Create an `x`, `y`, `z` object and calculate its norm.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      };

  //A real number with the norm is returned.
  var ans = PhiloGL.Vec3.norm(v1);
{% endhighlight %}


Vec3 Method: normSq {#Vec3:normSq}
------------------------------------

Calculates the squared norm of `Vec3`.

### Syntax:

	v1.normSq();

    PhiloGL.Vec3.normSq(v1);

### Examples:

Create a vector and calculate its squared norm.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3);

  vi.normSq(); //returns the real valued norm.
{% endhighlight %}

Create an `x`, `y`, `z` object and calculate its squared norm.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      };

  //A real number with the squared norm is returned.
  var ans = PhiloGL.Vec3.normSq(v1);
{% endhighlight %}


Vec3 Method: dot {#Vec3:dot}
------------------------------------

Calculates the dot product between two `Vec3`. You can find more information about the 
dot product [here](http://en.wikipedia.org/wiki/Dot_product).

### Syntax:

	v1.dot(v2);

    PhiloGL.Vec3.dot(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and calculate the dot product.

{% highlight js %}
  var v1 = new PhiloGL.Vec3(1, 2, 3),
      v2 = new PhiloGL.Vec3(4, 5, 6);

  v1.dot(v2); //a real value with the dot product is returned.
{% endhighlight %}

Create two `x`, `y`, `z` objects and calculate the dot product.

{% highlight js %}
  var v1 = {
        x: 1,
        y: 2,
        z: 3
      },
      v2 = {
        x: 4,
        y: 5,
        z: 6
      };

  //a real number with the dot product is returned.
  var ans = PhiloGL.Vec3.dot(v1, v2);
{% endhighlight %}


Vec3 Method: clone {#Vec3:clone}
------------------------------------

Clones a vector.

### Syntax:

	v1.clone();

    PhiloGL.Vec3.clone(v1);


Class: Mat4 {#Mat4}
===========================

A class to handle four by four matrices.


Mat4 Method: constructor {#Mat4:constructor}
----------------------------------------------

Creates a new `Mat4` instance. If no arguments are set then an Identity matrix is created.

### Syntax:

	var m = new PhiloGL.Mat4();
	
    var m = new PhiloGL.Mat4(n11, n12, n13, n14,
                             n21, n22, n23, n24,
                             n31, n32, n33, n34,
                             n41, n42, n43, n44);

### Arguments:

1. n - (*number*) The matrix component.

### Examples:

Create an identity matrix.

{% highlight js %}
  var m = new PhiloGL.Mat4();
{% endhighlight %}

Create a null matrix.

{% highlight js %}
  var m = 0 PhiloGL.Mat4( 0, 0, 0, 0,
                          0, 0, 0, 0,
                          0, 0, 0, 0,
                          0, 0, 0, 0 );
{% endhighlight %}


Mat4 Method: id {#Mat4:id}
---------------------------

Modifies the matrix to be an Identity matrix.

### Syntax:

	m.id();

    PhiloGL.Mat4.id(m);

### Examples:

Create an identity matrix from some random matrix.

{% highlight js %}
  var m = new PhiloGL.Mat4( 1, 2, 3, 4,
                            1, 2, 3, 4,
                            1, 2, 3, 4,
                            1, 2, 3, 4);

  m.id(); //m is now the Identity matrix.
{% endhighlight %}

Create an identity matrix object.

{% highlight js %}
  var m = {};

  PhiloGL.Mat4.id(m); //m object components are the Identity matrix ones.
{% endhighlight %}


Mat4 Method: set {#Mat4:set}
-------------------------------

Set all matrix coordinates.

### Syntax:

	m.set(n11, n12, n13, n14,
          n21, n22, n23, n24,
          n31, n32, n33, n34,
          n41, n42, n43, n44);

    PhiloGL.Mat4.set(m, n11, n12, n13, n14,
                        n21, n22, n23, n24,
                        n31, n32, n33, n34,
                        n41, n42, n43, n44);

### Arguments:

1. n - (*number*) The n matrix coordinates.

### Examples:

Create a matrix and set some values to it.

{% highlight js %}
  var m = new PhiloGL.Mat4();

  m.set(1, 2, 3, 4,
        1, 2, 3, 4,
        1, 2, 3, 4,
        1, 2, 3, 4);
{% endhighlight %}

Set an empty object matrix coordinates onto some values.

{% highlight js %}
  var m = {};

  PhiloGL.Mat4.set(m, 1, 2, 3, 4,
                      1, 2, 3, 4,
                      1, 2, 3, 4,
                      1, 2, 3, 4);

{% endhighlight %}


Mat4 Method: mulVec3 {#Mat4:mulVec3}
-------------------------------------

Multiplies a `Mat4` by a `Vec3`. Returns a new `Vec3` without modifying the passed in object.

### Syntax:

	m.mulVec3(v);
    
    PhiloGL.Mat4.mulVec3(m, v);

### Arguments:

1. v - (*object*) A `Vec3` instance.

### Examples:

Create a matrix and a vector and multiply them.

{% highlight js %}
  var m = new PhiloGL.Mat4(),
      v = new PhiloGL.Vec3(1, 1, 1);

  m.mulVec3(v);
{% endhighlight %}

Create a matrix object and a vector object and multiply them.

{% highlight js %}
  var m = {},
      v = {};

  PhiloGL.Mat4.id(m);
  PhiloGL.Vec3.set(v, 1, 1, 1);

  PhiloGL.Mat4.mulVec3(m, v);
{% endhighlight %}


Mat4 Method: $mulVec3 {#Mat4:$mulVec3}
-------------------------------------

Multiplies a `Mat4` by a `Vec3`. Modifies the receiver.

### Syntax:

	m.$mulVec3(v);
    
    PhiloGL.Mat4.$mulVec3(m, v);

### Arguments:

1. v - (*object*) A `Vec3` instance.

### Examples:

Create a matrix and a vector and multiply them.

{% highlight js %}
  var m = new PhiloGL.Mat4(),
      v = new PhiloGL.Vec3(1, 1, 1);

  m.$mulVec3(v);
{% endhighlight %}

Create a matrix object and a vector object and multiply them.

{% highlight js %}
  var m = {},
      v = {};

  PhiloGL.Mat4.id(m);
  PhiloGL.Vec3.set(v, 1, 1, 1);

  PhiloGL.Mat4.$mulVec3(m, v);
{% endhighlight %}


Mat4 Method: mulMat4 {#Mat4:mulMat4}
-------------------------------------

Multiplies two `Mat4`. Creates a new `Mat4` with the result and does not modify the original instances.

### Syntax:

	m.mulMat4(m1);
    
    PhiloGL.Mat4.mulMat4(m, m1);

### Arguments:

1. m1 - (*object*) A `Mat4` instance.

### Examples:

Create two matrices and multiply them.

{% highlight js %}
  var m = new PhiloGL.Mat4(),
      m1 = new PhiloGL.Mat4();

  m.mulMat4(m1); //the result is a new Identity matrix
{% endhighlight %}

Create a two matrices objects and multiply them.

{% highlight js %}
  var m = {},
      m1 = {};

  PhiloGL.Mat4.id(m);
  PhiloGL.Mat4.id(m1);
  PhiloGL.Mat4.mulMat4(m, m1);
{% endhighlight %}


Mat4 Method: $mulMat4 {#Mat4:$mulMat4}
-------------------------------------

Multiplies two `Mat4`, storing the result in the receiver.

### Syntax:

	m.$mulMat4(m1);
    
    PhiloGL.Mat4.$mulMat4(m, m1);

### Arguments:

1. m1 - (*object*) A `Mat4` instance.

### Examples:

Create two matrices and multiply them.

{% highlight js %}
  var m = new PhiloGL.Mat4(),
      m1 = new PhiloGL.Mat4();

  m.$mulMat4(m1); //the result is stored in m.
{% endhighlight %}

Create a two matrices objects and multiply them.

{% highlight js %}
  var m = {},
      m1 = {};

  PhiloGL.Mat4.id(m);
  PhiloGL.Mat4.id(m1);
  PhiloGL.Mat4.$mulMat4(m, m1);
{% endhighlight %}


Mat4 Method: mulMat42 {#Mat4:mulMat42}
-------------------------------------

Multiplies two `Mat4`, storing the result in the receiver.

### Syntax:

	m.mulMat42(m1, m2);
    
    PhiloGL.Mat4.mulMat42(m, m1, m2);

### Arguments:

1. m1 - (*object*) A `Mat4` instance.
2. m2 - (*object*) A `Mat4` instance.

### Examples:

Create two matrices and multiply them.

{% highlight js %}
  var m = new PhiloGL.Mat4(),
      m1 = new PhiloGL.Mat4(),
      m2 = new PhiloGL.Mat4();

  m.mulMat42(m1, m2); //the result is stored in m.
{% endhighlight %}

Create a two matrices objects and multiply them.

{% highlight js %}
  var m = {},
      m1 = {},
      m2 = {};

  PhiloGL.Mat4.id(m1);
  PhiloGL.Mat4.id(m2);
  PhiloGL.Mat4.mulMat42(m, m1, m2);
{% endhighlight %}


Mat4 Method: add {#Mat4:add}
-------------------------------------

Adds two `Mat4`. Creates a new `Mat4` with the result and does not modify the original instances.

### Syntax:

	m.add(m1);
    
    PhiloGL.Mat4.add(m, m1);

### Arguments:

1. m1 - (*object*) A `Mat4` instance.

### Examples:

Create two matrices and add them.

{% highlight js %}
  var m = new PhiloGL.Mat4(),
      m1 = new PhiloGL.Mat4();

  m.add(m1); //the result is a new matrix
{% endhighlight %}

Create a two matrices objects and add them.

{% highlight js %}
  var m = {},
      m1 = {};

  PhiloGL.Mat4.id(m);
  PhiloGL.Mat4.id(m1);
  PhiloGL.Mat4.add(m, m1);
{% endhighlight %}


Mat4 Method: $add {#Mat4:$add}
-------------------------------------

Adds two `Mat4`, storing the result in the receiver.

### Syntax:

	m.$add(m1);
    
    PhiloGL.Mat4.$add(m, m1);

### Arguments:

1. m1 - (*object*) A `Mat4` instance.

### Examples:

Create two matrices and add them.

{% highlight js %}
  var m = new PhiloGL.Mat4(),
      m1 = new PhiloGL.Mat4();

  m.$add(m1); //the result is stored in m.
{% endhighlight %}

Create a two matrices objects and add them.

{% highlight js %}
  var m = {},
      m1 = {};

  PhiloGL.Mat4.id(m);
  PhiloGL.Mat4.id(m1);
  PhiloGL.Mat4.$add(m, m1);
{% endhighlight %}


Mat4 Method: transpose {#Mat4:transpose}
-------------------------------------

Transposes a `Mat4` matrix. More info about this operation can be found [here](http://en.wikipedia.org/wiki/Matrix_transpose). 
Creates a new `Mat4` with the result.

### Syntax:

	m.transpose();
    
    PhiloGL.Mat4.transpose(m);

### Examples:

Create a `Mat4` matrix and transpose it.

{% highlight js %}
  var m = new PhiloGL.Mat4();

  m.transpose(); //the result is a new Identity matrix
{% endhighlight %}

Mat4 Method: $transpose {#Mat4:$transpose}
-------------------------------------

Transposes a `Mat4` matrix. More info about this operation can be found [here](http://en.wikipedia.org/wiki/Matrix_transpose). 
Modifies the current matrix.

### Syntax:

	m.$transpose();
    
    PhiloGL.Mat4.$transpose(m);

### Examples:

Create a `Mat4` matrix and transpose it.

{% highlight js %}
  var m = new PhiloGL.Mat4();

  m.$transpose(); //the result is stored in m
{% endhighlight %}


Mat4 Method: rotateAxis {#Mat4:rotateAxis}
-------------------------------------------

Applies a rotation of `theta` by `vec` to a `Mat4` matrix returning the result in a new matrix.

### Syntax:

	m.rotateAxis(theta, vec);
    
    PhiloGL.Mat4.rotateAxis(m, theta, vec);

### Arguments:

1. theta - (*number*) An angle in radians.
2. vec - (*object*) A `Vec3` (or x, y, z object).

### Examples:

Create a rotation by `theta` and `v`.

{% highlight js %}
  var m = new PhiloGL.Mat4(),
      v = new PhiloGL.Vec3(1, 1, 1);
  
  m.rotateAxis(Math.PI, v); //the result is a new matrix
{% endhighlight %}

Another way of doing the same thing without creating a `Vec3`.

{% highlight js %}
  var m = new PhiloGL.Mat4(),
      v = { x: 1, y: 1, z: 1 };
  
  m.rotateAxis(Math.PI, v); //the result is a new matrix
{% endhighlight %}


Mat4 Method: $rotateAxis {#Mat4:$rotateAxis}
-------------------------------------------

Applies a rotation of angle `theta` by vector `vec` to a `Mat4` altering the current matrix.

### Syntax:

	m.$rotateAxis(theta, vec);
    
    PhiloGL.Mat4.$rotateAxis(m, theta, vec);

### Arguments:

1. theta - (*number*) An angle in radians.
2. vec - (*object*) A `Vec3` (or x, y, z object).

### Examples:

Create a rotation by `theta` and `v`.

{% highlight js %}
  var m = new PhiloGL.Mat4(),
      v = new PhiloGL.Vec3(1, 1, 1);
  
  m.$rotateAxis(Math.PI, v); //the result is in m
{% endhighlight %}

Another way of doing the same thing without creating a `Vec3`.

{% highlight js %}
  var m = new PhiloGL.Mat4(),
      v = { x: 1, y: 1, z: 1 };
  
  m.$rotateAxis(Math.PI, v); //the result is in m
{% endhighlight %}


Mat4 Method: rotateXYZ {#Mat4:rotateXYZ}
-------------------------------------------

Applies a rotation of angle `rx` in the x-axis, `ry` in the y-axis and `rz` in the z-axis. 
Creates a new `Mat4` with the result.

### Syntax:

	m.rotateXYZ(rx, ry, rz);
    
    PhiloGL.Mat4.rotateXYZ(m, rx, ry, rz);

### Arguments:

1. rx - (*number*) An angle in radians.
2. ry - (*number*) An angle in radians.
3. rz - (*number*) An angle in radians.

### Examples:

Create a rotation on the x-axis.

{% highlight js %}
  var m = new PhiloGL.Mat4();

  m.rotateXYZ(Math.PI, 0, 0); //the result is a new matrix
{% endhighlight %}

Another way of doing it with generics:

{% highlight js %}
  var m = {};
  
  PhiloGL.Mat4.id(m);
  PhiloGL.Mat4.rotateXYZ(m, Math.PI, 0, 0); //creates a new Mat4 with the result.
{% endhighlight %}


Mat4 Method: $rotateXYZ {#Mat4:$rotateXYZ}
-------------------------------------------

Applies a rotation of angle `rx` in the x-axis, `ry` in the y-axis and `rz` in the z-axis. 
Alters the matrix.

### Syntax:

	m.$rotateXYZ(rx, ry, rz);
    
    PhiloGL.Mat4.$rotateXYZ(m, rx, ry, rz);

### Arguments:

1. rx - (*number*) An angle in radians.
2. ry - (*number*) An angle in radians.
3. rz - (*number*) An angle in radians.

### Examples:

Create a rotation on the x-axis.

{% highlight js %}
  var m = new PhiloGL.Mat4();

  m.$rotateXYZ(Math.PI, 0, 0); //alters m
{% endhighlight %}

Another way of doing it with generics:

{% highlight js %}
  var m = {};
  
  PhiloGL.Mat4.id(m);
  PhiloGL.Mat4.$rotateXYZ(m, Math.PI, 0, 0); //alters m
{% endhighlight %}


Mat4 Method: translate {#Mat4:translate}
-------------------------------------------

Applies a translation to `Mat4` in the directions `x`, `y` and `z`. 
Stores the result in a new `Mat4` instance.

### Syntax:

	m.translate(x, y, z);
    
    PhiloGL.Mat4.translate(m, x, y, z);

### Arguments:

1. x - (*number*) The amount to be translated in the x direction.
2. y - (*number*) The amount to be translated in the y direction.
3. z - (*number*) The amount to be translated in the z direction..

### Examples:

Create a translation on the x-axis.

{% highlight js %}
  var m = new PhiloGL.Mat4();

  m.translate(10, 0, 0); //the result is a new matrix
{% endhighlight %}

Another way of doing it with generics:

{% highlight js %}
  var m = {};
  
  PhiloGL.Mat4.id(m);
  PhiloGL.Mat4.translate(m, 10, 0, 0); //creates a new Mat4 with the result.
{% endhighlight %}


Mat4 Method: $translate {#Mat4:$translate}
-------------------------------------------

Applies a translation to `Mat4` in the directions `x`, `y` and `z`. 
Alters the original matrix.

### Syntax:

	m.$translate(x, y, z);
    
    PhiloGL.Mat4.$translate(m, x, y, z);

### Arguments:

1. x - (*number*) The amount to be translated in the x direction.
2. y - (*number*) The amount to be translated in the y direction.
3. z - (*number*) The amount to be translated in the z direction..

### Examples:

Create a translation on the x-axis.

{% highlight js %}
  var m = new PhiloGL.Mat4();

  m.$translate(10, 0, 0); //the result is in m
{% endhighlight %}

Another way of doing it with generics:

{% highlight js %}
  var m = {};
  
  PhiloGL.Mat4.id(m);
  PhiloGL.Mat4.$translate(m, 10, 0, 0); //the result is in m
{% endhighlight %}

Mat4 Method: scale {#Mat4:scale}
-------------------------------------------

Applies scaling to `Mat4` in the directions `x`, `y` and `z`. 
Stores the result in a new `Mat4` instance.

### Syntax:

	m.scale(x, y, z);
    
    PhiloGL.Mat4.scale(m, x, y, z);

### Arguments:

1. x - (*number*) The amount to be scaled in the x direction.
2. y - (*number*) The amount to be scaled in the y direction.
3. z - (*number*) The amount to be scaled in the z direction..

### Examples:

Create a scaling on the x-axis.

{% highlight js %}
  var m = new PhiloGL.Mat4();

  m.scale(10, 0, 0); //the result is a new matrix
{% endhighlight %}

Another way of doing it with generics:

{% highlight js %}
  var m = {};
  
  PhiloGL.Mat4.id(m);
  PhiloGL.Mat4.scale(m, 10, 0, 0); //creates a new Mat4 with the result.
{% endhighlight %}


Mat4 Method: $scale {#Mat4:$scale}
-------------------------------------------

Applies scaling to `Mat4` in the directions `x`, `y` and `z`. 
Alters the original matrix.

### Syntax:

	m.$scale(x, y, z);
    
    PhiloGL.Mat4.$scale(m, x, y, z);

### Arguments:

1. x - (*number*) The amount to be scaled in the x direction.
2. y - (*number*) The amount to be scaled in the y direction.
3. z - (*number*) The amount to be scaled in the z direction..

### Examples:

Create a scaling on the x-axis.

{% highlight js %}
  var m = new PhiloGL.Mat4();

  m.$scale(10, 0, 0); //the result is in m
{% endhighlight %}

Another way of doing it with generics:

{% highlight js %}
  var m = {};
  
  PhiloGL.Mat4.id(m);
  PhiloGL.Mat4.$scale(m, 10, 0, 0); //the result is in m
{% endhighlight %}


Mat4 Method: invert {#Mat4:invert}
-------------------------------------

Inverts a `Mat4` matrix. The matrix has to be invertible. 
Creates a new `Mat4` with the result.

### Syntax:

	m.invert();
    
    PhiloGL.Mat4.invert(m);

### Examples:

Create a `Mat4` matrix and invert it.

{% highlight js %}
  var m = new PhiloGL.Mat4();

  m.invert(); //the result is a new matrix
{% endhighlight %}

Mat4 Method: $invert {#Mat4:$invert}
-------------------------------------

Inverts a `Mat4` matrix. The matrix has to be invertible.
Modifies the current matrix.

### Syntax:

	m.$invert();
    
    PhiloGL.Mat4.$invert(m);

### Examples:

Create a `Mat4` matrix and invert it.

{% highlight js %}
  var m = new PhiloGL.Mat4();

  m.$invert(); //the result is stored in m
{% endhighlight %}


Mat4 Method: lookAt {#Mat4:lookAt}
-----------------------------------

Performs a `lookAt` operation on a matrix. Modifies the current matrix. 
Ths method is useful when setting a camera matrix class. 
For more information about the `lookAt` operation look [here](http://www.euclideanspace.com/maths/algebra/vectors/lookat/index.htm).

### Syntax:

	m.lookAt(eye, center, up);
    
    PhiloGL.Mat4.lookAt(m, eye, center, up);

### Arguments:

1. eye - (*object*) The eye position as a `Vec3` (or x,y,z object).
2. center - (*number*) The center position as a `Vec3` (or x,y,z object).
3. up - (*number*) The up vector of the "camera" as a `Vec3` (or x,y,z object).

### Examples:

Create a lookAt matrix. The eye is looking at the origin.

{% highlight js %}
  var m = new PhiloGL.Mat4(),
      eye = { x: 1, y: 0, z: 1 },
      center = { x: 0, y: 0, z: 0},
      up = { x: 0, y: 1, z: 0};

  m.lookAt(eye, center, up); //the original matrix is modified.
{% endhighlight %}

Another way of doing it with generics:

{% highlight js %}
  var m = {},
      eye = { x: 1, y: 0, z: 1 },
      center = { x: 0, y: 0, z: 0},
      up = { x: 0, y: 1, z: 0};

  PhiloGL.Mat4.lookAt(m, eye, center, up); //the original object is modified.
{% endhighlight %}


Mat4 Method: frustum {#Mat4:frustum}
-------------------------------------

Performs a `frustum` operation on a matrix. Modifies the current matrix. 
This method is useful when setting a camera projection matrix class. 
For more information about the `frustum` geometry look [here](http://en.wikipedia.org/wiki/Frustum).

### Syntax:

	  m.frustum(left, right, bottom, top, near, far);
    
    PhiloGL.Mat4.frustum(m, left, right, bottom, top, near, far);

### Arguments:

1. left - (*number*) The left part of the frustum.
2. right - (*number*) The right part of the frustum.
3. bottom - (*number*) The bottom part of the frustum.
4. top - (*number*) The top part of the frustum.
5. near - (*number*) The nearest part of the frustum.
6. far - (*number*) The furthest part of the frustum.


Mat4 Method: ortho {#Mat4:ortho}
-------------------------------------

Creates an orthographic projection. Modifies the current matrix. 
For more information about the `orthographic projection` geometry look [here](http://en.wikipedia.org/wiki/Orthographic_projection).

### Syntax:

	  m.ortho(left, right, bottom, top, near, far);
    
    PhiloGL.Mat4.ortho(m, left, right, bottom, top, near, far);

### Arguments:

1. left - (*number*) The left part of the orthographic projection.
2. right - (*number*) The right part of the orthographic projection.
3. bottom - (*number*) The bottom part of the orthographic projection.
4. top - (*number*) The top part of the orthographic projection.
5. near - (*number*) The nearest part of the orthographic projection.
6. far - (*number*) The furthest part of the orthographic projection.


Mat4 Method: perspective {#Mat4:perspective}
---------------------------------------------

Creates a perspective matrix. This operation is based on creating a frustum matrix. Modifies the current matrix. 
This method is useful when setting a camera projection matrix class. 

### Syntax:

	m.perspective(fov, aspect, near, far);
    
    PhiloGL.Mat4.perspective(m, fov, aspect, near, far);

### Arguments:

1. fov - (*number*) The field of view. An angle in degrees.
2. aspect - (*number*) The aspect ratio. Generally `canvas.width / canvas.height`.
3. near - (*number*) The nearest part to be captured by the camera.
4. far - (*number*) The furthest part to be captured by the camera.


Mat4 Method: toFloat32Array {#Mat4:toFloat32Array}
---------------------------------------------------

Converts the matrix in a [Float32Array](https://developer.mozilla.org/en/JavaScript_typed_arrays/Float32Array). Useful when setting matrix uniforms.

### Syntax:

	m.toFloat32Array();
    
    PhiloGL.Mat4.toFloat32Array(m);


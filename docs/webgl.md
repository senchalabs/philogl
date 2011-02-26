--- 
layout: docs 
title: WebGL
categories: [Documentation]
---

Module: WebGL {#WebGL}
===============================

Provides the `getContext` method which is a wrapper around the method that returns the native context for a 3D canvas. Also 
has the code to add `PhiloGL.hasWebGL` that returns a *boolean* whether the current browser supports WebGL or not.

WebGL Function: getContext {#WebGL:getContext}
------------------------------------------------

Returns a WebGL context. Tries to get the context via `experimental-webgl` or just plain `webgl` if the first one fails. 

### Syntax:

	var gl = PhiloGL.WebGL.getContext(canvas[, options]);

### Arguments:

1. canvas - (*mixed*) Can be a string with the canvas id or the canvas element itself.
2. options - (*object*) An object with the following properties:

### Options:

* debug - (*boolean*) If true, all gl calls will be `console.log`-ged and errors thrown to the console.



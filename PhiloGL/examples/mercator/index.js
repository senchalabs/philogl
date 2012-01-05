PhiloGL.unpack();

var halted = false;
var it = 1;
var sizeX = 1024;
var sizeY = 1024;
var viewX = 900;
var viewY = 550;
var mouseX = 450;
var mouseY = 275;

function calculateAspectRatio() {
	aspectX = Math.max(1, viewX / viewY);
	aspectY = Math.max(1, viewY / viewX);
	aspectXinv = Math.min(1, viewY / viewX);
	aspectYinv = Math.min(1, viewX / viewY);
}

calculateAspectRatio();

var $ = function(d) {
	return document.getElementById(d);
};

function load() {
	if (!PhiloGL.hasWebGL()) {
		alert("Your browser does not support WebGL");
		return;
	}
	$('fullscreen')
			.addEventListener(
					'click',
					function(e) {
						var width = window.innerWidth, height = window.innerHeight, canvas = $('c'), style = canvas.style;

						canvas.width = viewX = width;
						canvas.height = viewY = height;
						calculateAspectRatio();

						style.position = 'absolute';
						style.top = '0px';
						style.left = '0px';

						document.body.appendChild(canvas);

						var anchor = document.createElement('a'), astyle = anchor.style;
						astyle.position = 'absolute';
						astyle.top = astyle.left = '0px';
						astyle.color = '#fff';
						astyle.display = 'block';
						// astyle.backgroundColor = 'black';
						anchor.innerHTML = 'Click here to leave fullscreen';
						anchor.href = '#';
						document.body.appendChild(anchor);

						anchor.addEventListener('click', function() {
							canvas.width = viewX = 900;
							canvas.height = viewY = 550;
							canvas.style.position = 'static';
							$('container').appendChild(canvas);
							anchor.parentNode.removeChild(anchor);
						}, false);

					});
	mouseX = 0;
	mouseY = 0;

	PhiloGL(
			'c',
			{
				program : [ {
					id : 'advance',
					from : 'ids',
					vs : 'shader-vs',
					fs : 'shader-fs-advance'
				}, {
					id : 'composite',
					from : 'ids',
					vs : 'shader-vs',
					fs : 'shader-fs-composite'
				}, {
					id : 'copy',
					from : 'ids',
					vs : 'shader-vs',
					fs : 'shader-fs-copy'
				}, {
					id : 'blur-h',
					from : 'ids',
					vs : 'shader-vs',
					fs : 'shader-fs-blur-horizontal'
				}, {
					id : 'blur-v',
					from : 'ids',
					vs : 'shader-vs',
					fs : 'shader-fs-blur-vertical'
				} ],
				textures : {
					src : [ 'earthHQ.jpg', 'milkywayHQ.jpg', 'breakfastHQ.jpg' ],
					parameters : [ {
						name : 'TEXTURE_MAG_FILTER',
						value : 'LINEAR'
					}, {
						name : 'TEXTURE_MIN_FILTER',
						value : 'LINEAR_MIPMAP_NEAREST',
						generateMipmap : true
					} ]
				},
				events : {
					centerOrigin : false,
					onMouseMove : function(e) {
						mouseX = e.x / viewX;
						mouseY = 1 - e.y / viewY;
					},
				// onClick : function(e) {
				// halted = !halted;
				// }
				},
				onError : function(e) {
					alert(e);
				},
				onLoad : function(app) {

					// Set framebuffers
					function fbosetting(scale) { // general settings
						return {
							width : sizeX / scale,
							height : sizeY / scale,
							bindToTexture : {
								parameters : [ {
									name : 'TEXTURE_MAG_FILTER',
									value : 'LINEAR'
								}, {
									name : 'TEXTURE_MIN_FILTER',
									value : 'LINEAR',
									generateMipmap : false
								} ]
							},
							bindToRenderBuffer : false
						};
					}

					panoSettingsLQ = {
						width : 1024,
						height : 512,
						bindToTexture : {
							parameters : [ {
								name : 'TEXTURE_MAG_FILTER',
								value : 'LINEAR'
							}, {
								name : 'TEXTURE_MIN_FILTER',
								value : 'LINEAR',
								generateMipmap : false
							} ]
						},
						bindToRenderBuffer : false
					};

					panoSettingsHQ = {
						width : 2048,
						height : 1024,
						bindToTexture : {
							parameters : [ {
								name : 'TEXTURE_MAG_FILTER',
								value : 'LINEAR'
							}, {
								name : 'TEXTURE_MIN_FILTER',
								value : 'LINEAR',
								generateMipmap : false
							} ]
						},
						bindToRenderBuffer : false
					};

					var fbo1 = fbosetting(1); // fbos for multi-resolution
					var fbo2 = fbosetting(2);
					var fbo3 = fbosetting(4);
					var fbo4 = fbosetting(8);
					var fbo5 = fbosetting(16);

					var fboPanoHQ = panoSettingsHQ; // FBOs for sphere maps
					var fboPanoLQ = panoSettingsLQ;

					app.setFrameBuffer('main', fbo1).setFrameBuffer('main2', fbo1)
							.setFrameBuffer('blur1', fbo1).setFrameBuffer('temp1', fbo1)
							.setFrameBuffer('blur2', fbo2).setFrameBuffer('temp2', fbo2)
							.setFrameBuffer('blur3', fbo3).setFrameBuffer('temp3', fbo3)
							.setFrameBuffer('blur4', fbo4).setFrameBuffer('temp4', fbo4)
							.setFrameBuffer('blur5', fbo5).setFrameBuffer('temp5', fbo5)
							.setFrameBuffer('earthHQ', fboPanoHQ).setFrameBuffer(
									'milkywayHQ', fboPanoHQ).setFrameBuffer('breakfastHQ',
									fboPanoHQ);

					Media.Image.postProcess({
						width : 2048,
						height : 1024,
						fromTexture : 'earthHQ.jpg',
						toFrameBuffer : 'earthHQ',
						program : 'copy',
						aspectRatio : 1, // stretch to canvas size
					}).postProcess({
						width : 2048,
						height : 1024,
						fromTexture : 'milkywayHQ.jpg',
						toFrameBuffer : 'milkywayHQ',
						program : 'copy',
						aspectRatio : 1, // stretch to canvas size
					}).postProcess({
						width : 2048,
						height : 1024,
						fromTexture : 'breakfastHQ.jpg',
						toFrameBuffer : 'breakfastHQ',
						program : 'copy',
						aspectRatio : 1, // stretch to canvas size
					});

					anim();

					function draw() {
						if (it > 0) {
							advance('main', 'main2');
							calculateBlurTextures('main2');
							composite('main2');
						} else {
							advance('main2', 'main');
							calculateBlurTextures('main');
							composite('main');
						}
						it = -it;
					}

					function advance(source, target) {
						Media.Image.postProcess({
							width : sizeX,
							height : sizeY,
							fromTexture : getTextures(source),
							toFrameBuffer : target,
							program : 'advance',
							uniforms : getUniforms(1)
						});
					}

					function composite(source) {
						Media.Image.postProcess({
							width : viewX,
							height : viewY,
							fromTexture : getTextures(source),
							toScreen : true,
							aspectRatio : 1, // stretch to canvas size
							program : 'composite',
							uniforms : getUniforms(1)
						});
					}

					function getTextures(source) {
						return [ source + '-texture', 'blur1-texture', 'blur2-texture',
								'blur3-texture', 'blur4-texture', 'blur5-texture',
								'earthHQ-texture', 'milkywayHQ-texture', 'breakfastHQ-texture' ];
					}

					function calculateBlurTextures(source) {
						calculateBlurTexture(source, 'blur1', 'temp1', 1);
						calculateBlurTexture('blur1', 'blur2', 'temp2', 2);
						calculateBlurTexture('blur2', 'blur3', 'temp3', 4);
						calculateBlurTexture('blur3', 'blur4', 'temp4', 8);
						calculateBlurTexture('blur4', 'blur5', 'temp5', 16);
					}

					function calculateBlurTexture(source, target, helper, scale) {
						Media.Image.postProcess({
							width : sizeX / scale,
							height : sizeY / scale,
							fromTexture : source + '-texture',
							toFrameBuffer : target,
							program : 'copy',
							uniforms : getUniforms(scale)
						}).postProcess({
							width : sizeX / scale,
							height : sizeY / scale,
							fromTexture : target + '-texture',
							toFrameBuffer : helper,
							program : 'blur-h',
							uniforms : getUniforms(scale)
						}).postProcess({
							width : sizeX / scale,
							height : sizeY / scale,
							fromTexture : helper + '-texture',
							toFrameBuffer : target,
							program : 'blur-v',
							uniforms : getUniforms(scale)
						});
					}

					// shader input variables for teh sphere mapping
					var w1 = 0, w2 = 0, w3 = 0, w1cos = 1, w1sin = 0, w2cos = 1, w2sin = 0, w3cos = 1, w3sin = 0; // Euler
					var sphereSize = 0.75; // size relative to the canvas (sort of a zoom)
					var sphereDist = 20; // to determine the camera apex
					var maskRadius = Math.asin(1 / sphereDist); // precalc for the camera

					// apex mask
					var invZoom = 1 / 10;

					var time = 0;
					var start = Fx.animationTime();

					function getUniforms(factor) {
						return {
							'time' : time,
							'mouse' : [ mouseX, mouseY ],
							'aspect' : [ aspectX, aspectY, aspectXinv, aspectYinv ],
							'pixelSize' : [ factor / sizeX, factor / sizeY ],
							'w1' : [ w1cos, w1sin, w1 ],
							'w2' : [ w2cos, w2sin, w2 ],
							'w3' : [ w3cos, w3sin, w3 ],
							'z' : sphereSize,
							'd' : sphereDist,
							'mask_apex' : maskRadius,
							'zoom' : invZoom
						};
					}
					function anim() {
						if (!halted) {
							perFrame();
							draw();
						}
						Fx.requestAnimationFrame(anim);
					}

					var frame = 0;
					function perFrame() {
						frame++;
						time = (Fx.animationTime() - start) / 1000;

						w1 = mouseY * Math.PI - Math.PI / 2;
						w2 = 2 * mouseX * Math.PI + frame/450;
						w3 = 0;

						w1cos = Math.cos(w1);
						w1sin = Math.sin(w1);
						w2cos = Math.cos(w2);
						w2sin = Math.sin(w2);
						w3cos = Math.cos(w3);
						w3sin = Math.sin(w3);
					}
					;
				}
			});
}

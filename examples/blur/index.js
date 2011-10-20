PhiloGL.unpack();

var browserSize;
var halted = false;
var it = 1;
var time;
var mouseX = 0.5;
var mouseY = 0.5;
var animation;
var timer;
var sizeX = 512;
var sizeY = 512;
var viewX = 900;
var viewY = 550;
var c;

var blur_level = 0;

function load() {
	if (!PhiloGL.hasWebGL()) {
		alert("Your browser does not support WebGL");
		return;
	}

	PhiloGL('c', {
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
		events : {
			centerOrigin : false,
			onMouseMove : function(e) {
				mouseX = e.x / viewX;
				mouseY = 1 - e.y / viewY;
			},
			onClick : function(e) {
				halted = !halted;
			}
		},
		onError : function() {
			alert('There was an error, sorry :S');
		},
		onLoad : function(app) {
			// Set framebuffers
			var fbo_full = {
				width : sizeX,
				height : sizeY,
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
			var fbo_half = {
				width : sizeX / 2,
				height : sizeY / 2,
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
			var fbo_quarter = {
				width : sizeX / 4,
				height : sizeY / 4,
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

			app.setFrameBuffer('main', fbo_full).setFrameBuffer('main2', fbo_full)
					.setFrameBuffer('blur1', fbo_full).setFrameBuffer('temp1', fbo_full)
					.setFrameBuffer('blur2', fbo_half).setFrameBuffer('temp2', fbo_half)
					.setFrameBuffer('blur3', fbo_quarter).setFrameBuffer('temp3',
							fbo_quarter);

			timer = setInterval(fr, 500);
			time = Date.now();
			animation = "animate";
			anim();

			function draw() {
				// advance
				if (it > 0) {
					Media.Image.postProcess({
						width : sizeX,
						height : sizeY,
						fromTexture : 'main-texture',
						toFrameBuffer : 'main2',
						program : 'advance',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX,
						height : sizeY,
						fromTexture : 'main2-texture',
						toFrameBuffer : 'temp1',
						program : 'blur-h',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX,
						height : sizeY,
						fromTexture : 'temp1-texture',
						toFrameBuffer : 'blur1',
						program : 'blur-v',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX / 2,
						height : sizeY / 2,
						fromTexture : 'blur1-texture',
						toFrameBuffer : 'blur2',
						program : 'copy',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX / 2,
						height : sizeY / 2,
						fromTexture : 'blur2-texture',
						toFrameBuffer : 'temp2',
						program : 'blur-h',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX / 2,
						height : sizeY / 2,
						fromTexture : 'temp2-texture',
						toFrameBuffer : 'blur2',
						program : 'blur-v',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX / 4,
						height : sizeY / 4,
						fromTexture : 'blur2-texture',
						toFrameBuffer : 'blur3',
						program : 'copy',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX / 4,
						height : sizeY / 4,
						fromTexture : 'blur3-texture',
						toFrameBuffer : 'temp3',
						program : 'blur-h',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX / 4,
						height : sizeY / 4,
						fromTexture : 'temp3-texture',
						toFrameBuffer : 'blur3',
						program : 'blur-v',
						uniforms : getUniforms()
					}).postProcess({
						width : viewX,
						height : viewY,
						// fromTexture : 'main2-texture',
						// fromTexture : 'blur1-texture',
						fromTexture : 'blur2-texture',
						toScreen : true,
						program : 'composite',
						uniforms : getUniforms()
					});
				} else {
					Media.Image.postProcess({
						width : sizeX,
						height : sizeY,
						fromTexture : 'main2-texture',
						toFrameBuffer : 'main',
						program : 'advance',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX,
						height : sizeY,
						fromTexture : 'main-texture',
						toFrameBuffer : 'temp1',
						program : 'blur-h',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX,
						height : sizeY,
						fromTexture : 'temp1-texture',
						toFrameBuffer : 'blur1',
						program : 'blur-v',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX / 2,
						height : sizeY / 2,
						fromTexture : 'blur1-texture',
						toFrameBuffer : 'blur2',
						program : 'copy',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX / 2,
						height : sizeY / 2,
						fromTexture : 'blur2-texture',
						toFrameBuffer : 'temp2',
						program : 'blur-h',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX / 2,
						height : sizeY / 2,
						fromTexture : 'temp2-texture',
						toFrameBuffer : 'blur2',
						program : 'blur-v',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX / 4,
						height : sizeY / 4,
						fromTexture : 'blur2-texture',
						toFrameBuffer : 'blur3',
						program : 'copy',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX / 4,
						height : sizeY / 4,
						fromTexture : 'blur3-texture',
						toFrameBuffer : 'temp3',
						program : 'blur-h',
						uniforms : getUniforms()
					}).postProcess({
						width : sizeX / 4,
						height : sizeY / 4,
						fromTexture : 'temp3-texture',
						toFrameBuffer : 'blur3',
						program : 'blur-v',
						uniforms : getUniforms()
					}).postProcess({
						width : viewX,
						height : viewY,
						// fromTexture : 'main-texture',
						// fromTexture : 'blur1-texture',
						fromTexture : 'blur2-texture',
						toScreen : true,
						program : 'composite',
						uniforms : getUniforms()
					});
				}
				it = -it;
			}

			function getUniforms() {
				return {
					'time' : time,
					'mouse' : [ mouseX, mouseY ],
					'pixelSize' : [ 1 / sizeX, 1 / sizeY ]
				};
			}

			function anim() {
				if (!halted) {
					draw();
				}
				switch (animation) {
				case "animate":
					setTimeout(function() {
						Fx.requestAnimationFrame(anim);
					}, 1);
					break;
				case "reset":
					load();
					break;
				}
			}

			function fr() {
				var ti = Date.now();
				time = ti;
			}
		}
	});
}

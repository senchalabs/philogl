function DropShadow(app, plane, light) {
  var camera = new PhiloGL.Camera(45, 1, 0.1, 500, { position: light });
  var scene = new PhiloGL.Scene({}, camera);
  
  this.id = PhiloGL.Utils.uid();
  this.scene = scene;
  this.lightCamera = camera;
  this.shadowBuffer = app.setBuffer(this.id + '-shadow');
}

DropShadow.prototype = {
  add: function(o3d) {

  }
};
//camera.js
//Provides a Camera with ModelView and Projection matrices

(function () {
  //Define some locals
  var Vec3 = Octant.Vec3,
      Mat4 = Octant.Mat4;

  //Camera class
  var Camera = function(fov, aspect, near, far, opt) {
    opt = opt || {};

    var pos = opt.position,
        target = opt.target,
        up = opt.up;

    this.type = opt.type ? opt.type : 'perspective';
    this.fov = fov;
    this.near = near;
    this.far = far;
    this.aspect = aspect;
    this.position = pos && new Vec3(pos.x, pos.y, pos.z) || new Vec3();
    this.target = target && new Vec3(target.x, target.y, target.z) || new Vec3();
    this.up = up && new Vec3(up.x, up.y, up.z) || new Vec3(0, 1, 0);
    if (this.type == 'perspective') {
      this.projection = new Mat4().perspective(fov, aspect, near, far);
    } else {
      var ymax = near * Math.tan(fov * Math.PI / 360),
          ymin = -ymax,
          xmin = ymin * aspect,
          xmax = ymax * aspect;

      this.projection = new Mat4().ortho(xmin, xmax, ymin, ymax, near, far);
    }
    this.view = new Mat4();

  };

  Camera.prototype = {
    
    update: function() {
      if (this.type == 'perspective') {
        this.projection = new Mat4().perspective(this.fov, this.aspect, this.near, this.far);
      } else {
        var ymax = this.near * Math.tan(this.fov * Math.PI / 360),
            ymin = -ymax,
            xmin = ymin * this.aspect,
            xmax = ymax * this.aspect;

        this.projection = new Mat4().ortho(xmin, xmax, ymin, ymax, this.near, this.far);
      }
      this.view.lookAt(this.position, this.target, this.up);  
    }
  
  };

  Octant.Camera = Camera;

})();

function initControls(options) {
  var currentGroup = $('current-group'),
      scale = $('scale'),
      rotate = $('rotate'),
      aura = $('aura'),
      offset = $('offset');

  currentGroup.addEventListener('change', function() {
    options.currentGroupIndex = this.selectedIndex;
    //TODO need to change the description content for the selected group.
  }, false);

  scale.addEventListener('change', function() {
    options.scale = +this.value;
  }, false);

  rotate.addEventListener('change', function() {
    options.rotate = +this.value * Math.PI / 180;
  }, false);

  aura.addEventListener('change', function() {
    options.radialFactor = +this.value;
  }, false);
  
  offset.addEventListener('change', function() {
    options.offset = +this.value;
  }, false);
}

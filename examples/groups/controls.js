function initControls(options) {
  var currentGroup = $('current-group'),
      scale = $('scale'),
      rotate = $('rotate'),
      aura = $('aura'),
      offset = $('offset'),
      hyperbole = $('hyperbole'),
      descriptions = $$('#group-descriptions > div'),
      descriptionContainer = $1('.options-body.details');

  currentGroup.addEventListener('change', function() {
    options.currentGroupIndex = this.selectedIndex;
    var node = descriptionContainer.firstChild;
    if (node) {
      node.parentNode.removeChild(node);
    }
    descriptionContainer.appendChild(descriptions[this.selectedIndex].cloneNode(true));
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
  
  hyperbole.addEventListener('change', function() {
    options.hyperbole = +this.value;
  }, false);
}

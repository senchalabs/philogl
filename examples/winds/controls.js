var $ = function(d) { document.getElementById(d); };

function setupControls(callback) {
  var slider = $('slider');

  slider.addEventListener('change', function() {
    callback.onSliderChange(+slider.value, slider);
  }, false);
}

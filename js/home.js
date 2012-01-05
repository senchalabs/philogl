PhiloGL.unpack();

function init() {
  var imageUrls = ['worldflights2', 'metaballs', 'histogram', 'fractal', 'explorer', 'tanomalies', 'quaternion', 'mercator'].map(function(i) { return 'img/marquee/' + i + '.png'; }),
      descriptions = ['World Airline Routes',
                      'Reflective Metaballs', 
                      'Real-time 3D Color Histogram Analysis',
                      'Animating Fractals',
                      '3D Surface Explorer',
                      'World Temperature Anomalies from 1880 to 2010',
                      'Quaternion Fractal Raymarching',
                      'GPU based spherical projection mapping'];

  var images = new IO.Images({
    src: imageUrls,
    onComplete: function() {
      var imageSwitcher = document.getElementById('image-switcher'),
          image = imageSwitcher.getElementsByTagName('img')[0],
          caption = imageSwitcher.querySelectorAll('.tag')[0],
          transitionCallback = function() {
            if (imageSwitcher.className == 'hidden') {
                image.src = imageUrls[i];
                caption.innerHTML = descriptions[i];
                i = (i + 1) % imageUrls.length;
                imageSwitcher.className = '';
            } else {
                setTimeout(function() {
                  imageSwitcher.className = 'hidden';
                }, 4000);
            }
          },
          i = 1;
      ['transitionend', 'oTransitionEnd', 'webkitTransitionEnd'].forEach(function(e) {
        imageSwitcher.addEventListener(e, transitionCallback, false);
      });
      transitionCallback();
    }
  });
}

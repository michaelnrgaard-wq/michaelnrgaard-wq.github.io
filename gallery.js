(function () {
  var images = window.galleryImages || [];
  if (!images.length) return;

  var current = 0;
  var mainImg  = document.getElementById('gallery-main');
  var counter  = document.getElementById('gallery-counter');
  var captionEl = document.getElementById('gallery-caption');
  var thumbsEl = document.getElementById('gallery-thumbs');
  var thumbs   = [];

  function show(index) {
    current = ((index % images.length) + images.length) % images.length;

    mainImg.style.opacity = '0';
    var loader = new Image();
    loader.onload = function () {
      mainImg.src = images[current].src;
      mainImg.alt = images[current].caption || '';
      mainImg.style.opacity = '1';
    };
    loader.onerror = function () {
      mainImg.src = '';
      mainImg.style.opacity = '1';
    };
    loader.src = images[current].src;

    if (captionEl) captionEl.textContent = images[current].caption || '';
    if (counter)   counter.textContent   = (current + 1) + ' / ' + images.length;

    thumbs.forEach(function (t, i) {
      t.classList.toggle('active', i === current);
      if (i === current) t.scrollIntoView({ inline: 'nearest', behavior: 'smooth' });
    });
  }

  // Build thumbnail strip (if container exists)
  if (thumbsEl) {
    images.forEach(function (imgData, i) {
      var t = document.createElement('img');
      t.src     = imgData.src;
      t.alt     = imgData.caption || '';
      t.loading = 'lazy';
      t.addEventListener('click', function () { show(i); });
      thumbsEl.appendChild(t);
      thumbs.push(t);
    });
  }

  document.getElementById('prev').addEventListener('click', function () { show(current - 1); });
  document.getElementById('next').addEventListener('click', function () { show(current + 1); });

  // Klik på venstre/højre halvdel af billedområdet → forrige/næste
  var stage = document.querySelector('.gallery-stage');
  if (stage) {
    stage.addEventListener('click', function (e) {
      if (e.target.closest('.gallery-arrow')) return;
      var rect = stage.getBoundingClientRect();
      var x = e.clientX - rect.left;
      if (x < rect.width / 2) show(current - 1);
      else show(current + 1);
    });

    // Skift markøren til en venstre- eller højre-pil afhængigt af side
    var lastSide = null;
    stage.addEventListener('mousemove', function (e) {
      var rect = stage.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var side = x < rect.width / 2 ? 'prev' : 'next';
      if (side !== lastSide) {
        lastSide = side;
        stage.classList.toggle('cursor-prev', side === 'prev');
        stage.classList.toggle('cursor-next', side === 'next');
      }
    });

    stage.addEventListener('mouseleave', function () {
      stage.classList.remove('cursor-prev', 'cursor-next');
      lastSide = null;
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  // Touch/swipe on mobile
  var touchStartX = 0;
  mainImg.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  mainImg.addEventListener('touchend', function (e) {
    var dx = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) show(dx > 0 ? current + 1 : current - 1);
  }, { passive: true });

  mainImg.style.transition = 'opacity 0.2s ease';
  show(0);
})();

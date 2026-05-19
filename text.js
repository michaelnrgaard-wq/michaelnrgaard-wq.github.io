(function () {
  var articles = window.articles || [];
  if (!articles.length) return;

  var current = 0;
  var titleEl = document.getElementById('article-title');
  var metaEl  = document.getElementById('article-meta');
  var bodyEl  = document.getElementById('article-body');
  var counter = document.getElementById('text-counter');
  var stage   = document.getElementById('text-stage');

  function show(index) {
    current = ((index % articles.length) + articles.length) % articles.length;
    var a = articles[current];

    titleEl.textContent = a.title || '';
    metaEl.textContent  = a.meta  || '';
    metaEl.style.display = a.meta ? 'block' : 'none';
    bodyEl.innerHTML    = a.body  || '';

    if (counter) counter.textContent = (current + 1) + ' / ' + articles.length;
    if (stage)   stage.scrollTop = 0;

    initInlineGalleries();
  }

  function initInlineGalleries() {
    var galleries = document.querySelectorAll('.inline-gallery');
    galleries.forEach(function (g) {
      var data = g.getAttribute('data-images');
      if (!data) return;
      var images;
      try { images = JSON.parse(data); } catch (e) { return; }
      if (!images.length) return;

      var stage = g.querySelector('.ig-stage');
      var img = g.querySelector('.ig-image');
      var counter = g.querySelector('.ig-counter');
      var idx = 0;

      function show(i) {
        idx = ((i % images.length) + images.length) % images.length;
        img.style.opacity = '0';
        var loader = new Image();
        loader.onload = function () {
          img.src = images[idx];
          img.style.opacity = '1';
        };
        loader.src = images[idx];
        if (counter) counter.textContent = (idx + 1) + ' / ' + images.length;
      }

      stage.addEventListener('click', function (e) {
        var rect = stage.getBoundingClientRect();
        var x = e.clientX - rect.left;
        if (x < rect.width / 2) show(idx - 1);
        else show(idx + 1);
      });

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

      show(0);
    });
  }

  document.getElementById('prev').addEventListener('click', function () { show(current - 1); });
  document.getElementById('next').addEventListener('click', function () { show(current + 1); });

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft')  show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  show(0);
})();

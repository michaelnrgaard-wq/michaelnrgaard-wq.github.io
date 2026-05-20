(function () {
  var articles  = window.articles || [];
  if (!articles.length) return;

  var current   = 0;
  var titleEl   = document.getElementById('article-title');
  var metaEl    = document.getElementById('article-meta');
  var bodyEl    = document.getElementById('article-body');
  var counter   = document.getElementById('text-counter');
  var stage     = document.getElementById('text-stage');
  var indexEl   = document.getElementById('article-index');
  var articleEl = document.getElementById('article-view');
  var prevBtn   = document.getElementById('prev');
  var nextBtn   = document.getElementById('next');
  var backLink  = document.getElementById('back-link');
  var footer    = document.querySelector('.text-footer');

  // ── Byg artikeloversigt ───────────────────────────────────────────────────
  articles.forEach(function (a, i) {
    var item = document.createElement('div');
    item.className = 'article-index-item';
    item.innerHTML =
      '<img class="article-index-thumb" src="' + (a.thumb || '') + '" alt="">' +
      '<div class="article-index-text">' +
        '<div class="article-index-title">' + a.title + '</div>' +
        (a.meta ? '<div class="article-index-meta">' + a.meta + '</div>' : '') +
      '</div>' +
      '<span class="article-index-arrow">→</span>';
    item.addEventListener('click', function () { showArticle(i); });
    indexEl.appendChild(item);
  });

  // ── Vis oversigt ─────────────────────────────────────────────────────────
  function showIndex() {
    indexEl.style.display    = 'block';
    articleEl.style.display  = 'none';
    prevBtn.style.display    = 'none';
    nextBtn.style.display    = 'none';
    if (counter) counter.textContent = '';
    if (stage)   stage.scrollTop = 0;
  }

  // ── Vis artikel ──────────────────────────────────────────────────────────
  function showArticle(index) {
    current = ((index % articles.length) + articles.length) % articles.length;
    var a = articles[current];

    titleEl.textContent      = a.title || '';
    metaEl.textContent       = a.meta  || '';
    metaEl.style.display     = a.meta ? 'block' : 'none';
    bodyEl.innerHTML         = a.body  || '';

    if (counter) counter.textContent = (current + 1) + ' / ' + articles.length;
    if (stage)   stage.scrollTop = 0;

    indexEl.style.display    = 'none';
    articleEl.style.display  = 'block';
    prevBtn.style.display    = '';
    nextBtn.style.display    = '';

    initInlineGalleries();
  }

  // ── Inline-gallerier ─────────────────────────────────────────────────────
  function initInlineGalleries() {
    var galleries = document.querySelectorAll('.inline-gallery');
    galleries.forEach(function (g) {
      var data = g.getAttribute('data-images');
      if (!data) return;
      var images;
      try { images = JSON.parse(data); } catch (e) { return; }
      if (!images.length) return;

      var igStage   = g.querySelector('.ig-stage');
      var img       = g.querySelector('.ig-image');
      var igCounter = g.querySelector('.ig-counter');
      var idx       = 0;

      function showImg(i) {
        idx = ((i % images.length) + images.length) % images.length;
        img.style.opacity = '0';
        var loader = new Image();
        loader.onload = function () {
          img.src = images[idx];
          img.style.opacity = '1';
        };
        loader.src = images[idx];
        if (igCounter) igCounter.textContent = (idx + 1) + ' / ' + images.length;
      }

      igStage.addEventListener('click', function (e) {
        var rect = igStage.getBoundingClientRect();
        var x = e.clientX - rect.left;
        if (x < rect.width / 2) showImg(idx - 1);
        else showImg(idx + 1);
      });

      var lastSide = null;
      igStage.addEventListener('mousemove', function (e) {
        var rect = igStage.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var side = x < rect.width / 2 ? 'prev' : 'next';
        if (side !== lastSide) {
          lastSide = side;
          igStage.classList.toggle('cursor-prev', side === 'prev');
          igStage.classList.toggle('cursor-next', side === 'next');
        }
      });

      igStage.addEventListener('mouseleave', function () {
        igStage.classList.remove('cursor-prev', 'cursor-next');
        lastSide = null;
      });

      showImg(0);
    });
  }

  // ── Knapper og tastatur ──────────────────────────────────────────────────
  backLink.addEventListener('click', showIndex);

  prevBtn.addEventListener('click', function () { showArticle(current - 1); });
  nextBtn.addEventListener('click', function () { showArticle(current + 1); });

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (articleEl.style.display === 'none') return;
    if (e.key === 'ArrowLeft')  showArticle(current - 1);
    if (e.key === 'ArrowRight') showArticle(current + 1);
  });

  // ── Start med oversigt ───────────────────────────────────────────────────
  showIndex();
})();

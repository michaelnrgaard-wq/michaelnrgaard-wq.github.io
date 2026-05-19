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

(function () {
  var btn = document.querySelector('.menu-toggle');
  var sidebar = document.querySelector('.sidebar');
  if (!btn || !sidebar) return;
  btn.addEventListener('click', function () {
    sidebar.classList.toggle('menu-open');
  });
})();

(function () {
  var toggle = document.getElementById('navToggle');
  var drawer = document.getElementById('drawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var popup = document.getElementById('popup');
  var close = document.getElementById('popupClose');
  if (popup && close) {
    try {
      if (!sessionStorage.getItem('blPopupShown')) {
        setTimeout(function () { popup.classList.add('open'); }, 1200);
      }
    } catch (e) {}
    function dismiss() {
      popup.classList.remove('open');
      try { sessionStorage.setItem('blPopupShown', 'true'); } catch (e) {}
    }
    close.addEventListener('click', dismiss);
    popup.addEventListener('click', function (e) { if (e.target === popup) dismiss(); });
  }
})();

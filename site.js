(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav drawer (unchanged behaviour) ---------- */
  var toggle = document.getElementById('navToggle');
  var drawer = document.getElementById('drawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- mailing-list popup (unchanged behaviour) ---------- */
  var popup = document.getElementById('popup');
  var close = document.getElementById('popupClose');
  if (popup && close) {
    try {
      if (!sessionStorage.getItem('blPopupShown')) {
        setTimeout(function () { popup.classList.add('open'); }, 1400);
      }
    } catch (e) {}
    var dismiss = function () {
      popup.classList.remove('open');
      try { sessionStorage.setItem('blPopupShown', 'true'); } catch (e) {}
    };
    close.addEventListener('click', dismiss);
    popup.addEventListener('click', function (e) { if (e.target === popup) dismiss(); });
  }

  /* ---------- wordmark: letter-by-letter load, then a trailing rainbow ghost ----------
     The ghost is a blurred clone that bobs 0.18s behind the crisp text, so the
     colour smears out behind the logo and catches up. Cloning (rather than a
     second hand-written copy) guarantees the two layers share exact metrics. */
  function animateWordmark(el) {
    if (!el || el.dataset.blDone) return;
    el.dataset.blDone = '1';

    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    var i = 0;
    words.forEach(function (word, w) {
      if (w) {
        var gap = document.createElement('span');
        gap.style.cssText = 'display:inline-block;width:.28em';
        el.appendChild(gap);
      }
      var holder = document.createElement('span');
      holder.style.cssText = 'display:inline-block;white-space:nowrap';
      word.split('').forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'ltr';
        s.textContent = ch;
        s.style.animationDelay = (0.04 + i * 0.06).toFixed(2) + 's';
        i++;
        holder.appendChild(s);
      });
      el.appendChild(holder);
    });

    var wrap = document.createElement('div');
    wrap.className = 'wm-wrap';
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);

    if (reduce) return;
    var ghost = el.cloneNode(true);
    ghost.setAttribute('aria-hidden', 'true');
    ghost.removeAttribute('id');
    ghost.classList.add('wm-trail');
    wrap.insertBefore(ghost, el);
  }
  animateWordmark(document.querySelector('.wordmark'));
  animateWordmark(document.querySelector('.banner h1'));

  /* ---------- sunset glow behind interior page banners ---------- */
  var banner = document.querySelector('.banner');
  if (banner && !banner.querySelector('.banner__sun')) {
    var sun = document.createElement('div');
    sun.className = 'banner__sun';
    banner.insertBefore(sun, banner.firstChild);
  }

  /* ---------- hero glows ---------- */
  var hero = document.querySelector('.hero');
  if (hero && !hero.querySelector('.hero__glow')) {
    ['a', 'b'].forEach(function (k) {
      var g = document.createElement('div');
      g.className = 'hero__glow hero__glow--' + k;
      hero.insertBefore(g, hero.firstChild);
    });
  }

  /* ---------- scroll progress bar + back to top ---------- */
  var navwrap = document.querySelector('.navwrap');
  var bar = null;
  if (navwrap) {
    var p = document.createElement('div');
    p.className = 'progress';
    p.innerHTML = '<i></i>';
    var nav = navwrap.querySelector('.nav');
    navwrap.insertBefore(p, nav ? nav.nextSibling : null);
    bar = p.firstChild;
  }

  var top = document.createElement('button');
  top.type = 'button';
  top.className = 'totop';
  top.setAttribute('aria-label', 'Back to top');
  top.innerHTML = '&uarr;';
  top.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
  document.body.appendChild(top);

  var navEl = document.querySelector('.nav');
  var photo = document.querySelector('.hero__photo');
  var desktop = window.matchMedia('(min-width: 701px)');

  function onScroll() {
    var y = window.scrollY || 0;
    if (navEl) navEl.classList.toggle('is-stuck', y > 40);
    if (bar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
    }
    top.classList.toggle('on', y > 600);
    if (photo && desktop.matches && !reduce) {
      photo.style.transform = 'translate3d(0,' + (y * 0.18).toFixed(1) + 'px,0)';
    } else if (photo) {
      photo.style.transform = '';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  desktop.addEventListener('change', onScroll);
  onScroll();

  /* ---------- scroll reveals ---------- */
  var targets = [].slice.call(document.querySelectorAll(
    'h2.display, .empty, .sec--listen .split > *, .strip a, .cards .card, .bio > *, ' +
    '.masonry img, .signup h2, .sec--deep .wrap > *, .split > *'
  ));
  if (targets.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el, n) {
      el.classList.add('reveal');
      el.style.transitionDelay = ((n % 4) * 0.05).toFixed(2) + 's';
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) el.classList.add('in');
      else io.observe(el);
    });
  }

  /* ---------- gallery lightbox ---------- */
  var masonry = document.querySelector('.masonry');
  if (masonry) {
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = '<img alt="Bush League live">';
    document.body.appendChild(box);
    var full = box.firstChild;
    masonry.addEventListener('click', function (e) {
      var img = e.target.closest('img');
      if (!img) return;
      full.src = img.getAttribute('src');
      box.classList.add('open');
    });
    var shut = function () { box.classList.remove('open'); full.removeAttribute('src'); };
    box.addEventListener('click', shut);
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
  }
})();

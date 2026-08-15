/* =============================================================================
   BUSH LEAGUE — site.js
   Nav, wordmark echo trail, image loading, scroll UI, popup, lightbox.
   ========================================================================== */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 200); };

  /* ---------------------------------------------------------------------------
     1. IMAGE LOADING

     Photos used to be hidden by the .reveal class (opacity:0) until an
     IntersectionObserver fired, on top of loading="lazy". That stacked two
     delays: the file wasn't requested until you scrolled near it, and then it
     still waited on an observer callback to become visible.

     Now: images fade in the instant the browser has them, and once the page has
     finished its critical work we quietly upgrade the remaining lazy images so
     they're already in cache by the time you scroll.
     --------------------------------------------------------------------------- */

  function markLoaded(img) {
    img.classList.add('is-loaded');
  }

  function watchImages(root) {
    var imgs = (root || document).querySelectorAll('img[data-fade]');
    [].forEach.call(imgs, function (img) {
      if (img.complete && img.naturalWidth) {
        markLoaded(img);
        return;
      }
      img.addEventListener('load', function () { markLoaded(img); }, { once: true });
      img.addEventListener('error', function () { markLoaded(img); }, { once: true });
    });
  }

  watchImages();

  // Once everything above the fold is settled, prefetch the rest of the grid.
  window.addEventListener('load', function () {
    idle(function () {
      var rest = document.querySelectorAll('.masonry img[loading="lazy"], .strip img[loading="lazy"]');
      [].forEach.call(rest, function (img) { img.loading = 'eager'; });
    });
  });

  /* ---------------------------------------------------------------------------
     2. NAV DRAWER
     --------------------------------------------------------------------------- */

  var toggle = document.getElementById('navToggle');
  var drawer = document.getElementById('drawer');

  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Tapping a link or scrolling away closes the drawer.
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        drawer.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------------------------------------------------------------------
     3. WORDMARK — letter drop-in + multicolour echo stack

     The crisp text animates in letter by letter. Behind it sit four cloned
     layers, each nudged further down-right, each cycling through the brand
     palette on its own delay — so the echo reads as a colour trail dragging
     behind the letterform rather than a flat drop shadow.
     --------------------------------------------------------------------------- */

  var ECHO_LAYERS = 4;

  function splitLetters(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    var n = 0;

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
        s.style.animationDelay = (0.04 + n * 0.06).toFixed(2) + 's';
        n++;
        holder.appendChild(s);
      });

      el.appendChild(holder);
    });
  }

  function animateWordmark(el) {
    if (!el || el.dataset.blDone) return;
    el.dataset.blDone = '1';

    splitLetters(el);

    var wrap = document.createElement('div');
    wrap.className = 'wm-wrap';
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);

    if (reduce) return;

    for (var i = ECHO_LAYERS; i >= 1; i--) {
      var ghost = el.cloneNode(true);
      ghost.setAttribute('aria-hidden', 'true');
      ghost.removeAttribute('id');
      ghost.removeAttribute('data-bl-done');
      ghost.className = (ghost.className + ' wm-echo').trim();
      ghost.style.setProperty('--i', i);
      ghost.style.setProperty('--o', (0.9 - (i - 1) * 0.16).toFixed(2));
      wrap.insertBefore(ghost, el);
    }
  }

  animateWordmark(document.querySelector('.wordmark'));
  animateWordmark(document.querySelector('.banner h1'));

  /* ---------------------------------------------------------------------------
     4. AMBIENT DECOR — hero glows
     --------------------------------------------------------------------------- */

  var hero = document.querySelector('.hero');
  if (hero && !hero.querySelector('.hero__glow')) {
    ['a', 'b'].forEach(function (k) {
      var g = document.createElement('div');
      g.className = 'hero__glow hero__glow--' + k;
      hero.insertBefore(g, hero.firstChild);
    });
  }

  /* ---------------------------------------------------------------------------
     5. SCROLL UI — progress bar, back-to-top, parallax
     --------------------------------------------------------------------------- */

  var navwrap = document.querySelector('.navwrap');
  var bar = null;

  if (navwrap) {
    var p = document.createElement('div');
    p.className = 'progress';
    p.innerHTML = '<i></i>';
    var navEl0 = navwrap.querySelector('.nav');
    navwrap.insertBefore(p, navEl0 ? navEl0.nextSibling : null);
    bar = p.firstChild;
  }

  var toTop = document.createElement('button');
  toTop.type = 'button';
  toTop.className = 'totop';
  toTop.setAttribute('aria-label', 'Back to top');
  toTop.innerHTML = '&uarr;';
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
  document.body.appendChild(toTop);

  var navEl = document.querySelector('.nav');
  var photo = document.querySelector('.hero__photo');
  var desktop = window.matchMedia('(min-width: 701px)');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || 0;

    if (navEl) navEl.classList.toggle('is-stuck', y > 40);

    if (bar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
    }

    toTop.classList.toggle('on', y > 600);

    if (photo && desktop.matches && !reduce) {
      photo.style.transform = 'translate3d(0,' + (y * 0.18).toFixed(1) + 'px,0)';
    } else if (photo) {
      photo.style.transform = '';
    }

    maybeShowPopup(y);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  desktop.addEventListener('change', onScroll);

  /* ---------------------------------------------------------------------------
     6. MAILING-LIST POPUP

     Fires once you've actually engaged with the page — roughly one screen of
     scrolling — or after 20s of reading, whichever comes first. Once per session.
     --------------------------------------------------------------------------- */

  var popup = document.getElementById('popup');
  var closeBtn = document.getElementById('popupClose');
  var popupDone = false;

  function seen() {
    try { return !!sessionStorage.getItem('blPopupShown'); } catch (e) { return false; }
  }

  function showPopup() {
    if (popupDone || !popup || seen()) return;
    popupDone = true;
    popup.classList.add('open');
    try { sessionStorage.setItem('blPopupShown', 'true'); } catch (e) {}
  }

  function maybeShowPopup(y) {
    if (y > window.innerHeight * 0.85) showPopup();
  }

  if (popup && closeBtn) {
    if (!seen()) setTimeout(showPopup, 20000);

    var dismiss = function () {
      popup.classList.remove('open');
      try { sessionStorage.setItem('blPopupShown', 'true'); } catch (e) {}
    };

    closeBtn.addEventListener('click', dismiss);
    popup.addEventListener('click', function (e) { if (e.target === popup) dismiss(); });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && popup.classList.contains('open')) dismiss();
    });
  }

  onScroll();

  /* ---------------------------------------------------------------------------
     7. SCROLL REVEALS

     Text and cards only. Images are deliberately excluded — hiding a photo
     behind an observer is what made the gallery feel slow.
     --------------------------------------------------------------------------- */

  var targets = [].slice.call(document.querySelectorAll(
    'h2.display, .empty, .sec--listen .split > *, .sec-head, .strip, ' +
    '.cards .card, .bio > *, .signup h2, .sec--deep .wrap > *, .split > *'
  ));

  if (targets.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    targets.forEach(function (el, n) {
      el.classList.add('reveal');
      el.style.transitionDelay = ((n % 4) * 0.05).toFixed(2) + 's';
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) el.classList.add('in');
      else io.observe(el);
    });
  }

  /* ---------------------------------------------------------------------------
     8. GALLERY LIGHTBOX
     --------------------------------------------------------------------------- */

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

    var shut = function () {
      box.classList.remove('open');
      full.removeAttribute('src');
    };

    box.addEventListener('click', shut);
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
  }
})();

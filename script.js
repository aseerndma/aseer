(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile menu ---------- */
  var nav = document.getElementById('nav');
  var toggle = nav.querySelector('.nav-toggle');
  var links = document.getElementById('nav-links');

  function setMenu(open) {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  }
  toggle.addEventListener('click', function () {
    setMenu(!links.classList.contains('open'));
  });
  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* ---------- Scroll: nav state + background art fade/parallax ---------- */
  var art = document.getElementById('bg-art');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var p = Math.min(y / window.innerHeight, 1);
    nav.classList.toggle('scrolled', y > 40);
    // Art is strongest behind the hero, then settles into a faint backdrop.
    art.style.opacity = (0.5 - p * 0.32).toFixed(3);
    if (!reduceMotion) {
      art.style.transform = 'translate3d(0,' + (-p * 40).toFixed(1) + 'px,0) scale(' + (1 + p * 0.06).toFixed(3) + ')';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  // The hero is the first thing seen, so it always plays its entrance on load.
  document.querySelectorAll('.hero .reveal').forEach(function (el) { el.classList.add('in'); });
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          revealer.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { revealer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Active nav link ---------- */
  var navLinks = Array.prototype.slice.call(links.querySelectorAll('a[href^="#"]'));
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = '#' + en.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    // Watch every section, so ones without a nav link (hero, languages) clear the highlight.
    document.querySelectorAll('main section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Copy email ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var label = btn.querySelector('.copy-label');
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        label.textContent = 'Copied';
        setTimeout(function () { label.textContent = 'Copy'; }, 1600);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else {
        fallbackCopy(text);
        done();
      }
    });
  });

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  /* ---------- Falling ash ---------- */
  var canvas = document.getElementById('ash');
  if (!canvas || reduceMotion) return;

  var ctx = canvas.getContext('2d');
  var w = 0, h = 0;
  var flakes = [];

  function makeFlake(anywhere) {
    var depth = Math.random();
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -10,
      r: 0.4 + depth * 1.7,
      vy: 0.15 + depth * 0.5,
      sway: 0.3 + Math.random() * 1.1,
      phase: Math.random() * Math.PI * 2,
      freq: 0.004 + Math.random() * 0.01,
      a: 0.1 + depth * 0.45
    };
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#d9d0c1';
    var target = Math.round(Math.min(130, (w * h) / 12000));
    while (flakes.length < target) flakes.push(makeFlake(true));
    flakes.length = target;
  }

  var t = 0;
  var last = performance.now();

  function frame(now) {
    var dt = Math.min((now - last) / 16.67, 3);
    last = now;
    t += dt;
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.y += f.vy * dt;
      f.x += (Math.sin(t * f.freq + f.phase) * f.sway * 0.3 + 0.08) * dt;
      if (f.y > h + 10) flakes[i] = f = makeFlake(false);
      if (f.x > w + 10) f.x = -10;
      else if (f.x < -10) f.x = w + 10;
      ctx.globalAlpha = f.a;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();

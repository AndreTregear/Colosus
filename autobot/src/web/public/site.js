/* ═══════════════════════════════════════════════════
   YAYA — Landing Page Scripts
   Vanilla JS · No dependencies · 3G-friendly
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── WhatsApp number from data attribute ──
  var WA_NUMBER = document.body.dataset.waNumber || '18503002167';

  // ── Scroll Animations (IntersectionObserver) ──
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
    observer.observe(el);
  });

  // ── Navbar scroll effect ──
  var nav = document.getElementById('siteNav');

  window.addEventListener('scroll', function () {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });

  // ── Mobile nav toggle ──
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Floating WhatsApp button ──
  var waFloat = document.getElementById('waFloat');
  if (waFloat) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        waFloat.classList.add('visible');
      } else {
        waFloat.classList.remove('visible');
      }
    }, { passive: true });
  }

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (href === '#') return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        var offset = nav ? nav.offsetHeight : 0;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // ── Active nav link highlight ──
  var sections = document.querySelectorAll('section[id]');
  var navAnchors = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', function () {
    var current = '';
    sections.forEach(function (section) {
      var top = section.offsetTop - 100;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });
    navAnchors.forEach(function (link) {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }, { passive: true });

  // ── Demo chat typing animation ──
  var demoMessages = document.querySelectorAll('.demo-msg');
  if (demoMessages.length) {
    var demoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var msgs = entry.target.querySelectorAll('.demo-msg');
          msgs.forEach(function (msg, i) {
            msg.style.opacity = '0';
            msg.style.transform = 'translateY(12px)';
            setTimeout(function () {
              msg.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
              msg.style.opacity = '1';
              msg.style.transform = 'translateY(0)';
            }, 300 * i);
          });
          demoObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    var demoChat = document.querySelector('.demo-chat');
    if (demoChat) demoObserver.observe(demoChat);
  }

})();

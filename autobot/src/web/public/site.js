/* ═══════════════════════════════════════════════════
   YAYA — Marketing Site Scripts
   ═══════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ── WhatsApp number — single source of truth from data attribute ──
  const WA_NUMBER = document.body.dataset.waNumber || '18503002167';

  // ── Scroll animations (IntersectionObserver) ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

  // ── Navbar scroll effect ──
  const nav = document.getElementById('siteNav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }, { passive: true });

  // ── Mobile nav toggle ──
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Floating WhatsApp button visibility ──
  const waFloat = document.getElementById('waFloat');
  if (waFloat) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        waFloat.classList.add('visible');
      } else {
        waFloat.classList.remove('visible');
      }
    }, { passive: true });
  }

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Active nav link highlight ──
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 80;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });

    navAnchors.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }, { passive: true });

  // ── Lead Capture Form ──
  const form = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const formSubmitBtn = document.getElementById('formSubmit');
  const formLoadTime = Date.now();

  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      const lead = {
        name: document.getElementById('contact-name').value.trim(),
        phone: document.getElementById('contact-phone').value.trim(),
        business: document.getElementById('contact-business').value.trim(),
        message: document.getElementById('contact-message').value.trim(),
        _ts: formLoadTime,
      };

      // Disable button while submitting
      formSubmitBtn.disabled = true;
      formSubmitBtn.textContent = 'Sending...';

      let serverOk = false;
      try {
        // Save to server
        const res = await fetch('/api/website/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        });
        serverOk = res.ok;
      } catch (_) {
        // Network error — will fall back to local storage
      }

      // Also store locally as backup
      saveLead({ ...lead, timestamp: new Date().toISOString(), source: 'website' });

      if (serverOk) {
        // Show success
        formSubmitBtn.style.display = 'none';
        formSuccess.style.display = 'flex';
      } else {
        // Show error but don't block — lead is saved locally
        formSubmitBtn.disabled = false;
        formSubmitBtn.textContent = 'Try Again';
        formSuccess.style.display = 'flex';
        formSuccess.querySelector('strong').textContent = 'Saved locally!';
        formSuccess.querySelector('p').textContent = "We'll sync your info when the connection is back.";
      }

      // Reset form fields
      form.reset();

      // After 3 seconds, redirect to WhatsApp
      setTimeout(() => {
        const waText = encodeURIComponent(
          `Hey Yaya! I'm ${lead.name}` +
          (lead.business ? ` from ${lead.business}` : '') +
          `. ${lead.message || "I'm interested in automating my business on WhatsApp."}`
        );
        window.open(`https://wa.me/${WA_NUMBER}?text=${waText}`, '_blank');
      }, 3000);
    });
  }

  // ── Lead Storage ──
  function saveLead(lead) {
    try {
      const leads = JSON.parse(localStorage.getItem('yaya_leads') || '[]');
      leads.push(lead);
      localStorage.setItem('yaya_leads', JSON.stringify(leads));
    } catch (e) {
      // Silently fail if localStorage unavailable
    }
  }

  // ── Counter animation for hero stats ──
  function animateCounters() {
    const statValues = document.querySelectorAll('.hero-stat-value');
    statValues.forEach(el => {
      const text = el.textContent;
      // Only animate numeric values
      if (/^\d+/.test(text)) {
        const target = parseInt(text);
        const suffix = text.replace(/\d+/, '');
        let current = 0;
        const increment = Math.ceil(target / 40);
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = current + suffix;
        }, 30);
      }
    });
  }

  // Trigger counter animation when hero is visible
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        heroObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) heroObserver.observe(heroStats);

})();

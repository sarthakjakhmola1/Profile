/* ============================================================
   PREMIUM SCROLL ANIMATION SYSTEM
   Aman Agrahari Portfolio — Finance Theme
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initHeroAnimation();
  initNav();
  initReveal();
  initActiveNav();
  initContactForm();
  initLightbox();
  initHeroCanvas();
  initCardTilt();
  initSmoothCounters();
});

/* ===== HERO CANVAS — Abstract Financial Lines ===== */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, lines = [], mouse = { x: 0, y: 0 }, scrollY = 0;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    w = canvas.width = rect.width;
    h = canvas.height = rect.height;
  }

  function createLines() {
    lines = [];
    const count = Math.min(Math.floor(w / 35), 45);
    for (let i = 0; i < count; i++) {
      lines.push({
        x: (w / count) * i + Math.random() * 20,
        points: generateWave(),
        speed: 0.2 + Math.random() * 0.4,
        opacity: 0.08 + Math.random() * 0.15,
        hue: 240 + Math.random() * 40, // indigo-purple range
        phase: Math.random() * Math.PI * 2,
        amplitude: 15 + Math.random() * 30,
      });
    }
  }

  function generateWave() {
    const pts = [];
    const segments = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i <= segments; i++) {
      pts.push({ y: (h / segments) * i, offset: Math.random() * 20 - 10 });
    }
    return pts;
  }

  let time = 0;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    const scrollFactor = scrollY * 0.3;

    lines.forEach(line => {
      ctx.beginPath();
      ctx.strokeStyle = `hsla(${line.hue}, 70%, 65%, ${line.opacity})`;
      ctx.lineWidth = 1;

      line.points.forEach((pt, j) => {
        const wave = Math.sin(time * line.speed + line.phase + j * 0.5) * line.amplitude;
        const x = line.x + pt.offset + wave;
        const y = pt.y + scrollFactor * (j * 0.02);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    // Floating dots at intersections
    for (let i = 0; i < lines.length; i += 3) {
      const line = lines[i];
      const ptIdx = Math.floor(line.points.length / 2);
      const pt = line.points[ptIdx];
      if (!pt) continue;
      const wave = Math.sin(time * line.speed + line.phase + ptIdx * 0.5) * line.amplitude;
      const x = line.x + pt.offset + wave;
      const y = pt.y + scrollFactor * (ptIdx * 0.02);
      const pulse = 1.5 + Math.sin(time * 2 + i) * 1;

      ctx.beginPath();
      ctx.arc(x, y, pulse, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${line.hue}, 80%, 70%, ${line.opacity * 1.5})`;
      ctx.fill();
    }

    time += 0.012;
    requestAnimationFrame(draw);
  }

  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  window.addEventListener('resize', () => { resize(); createLines(); });
  resize();
  createLines();
  draw();
}

/* ===== HERO NAME SCROLL ANIMATION (scroll-linked) ===== */
function initHeroAnimation() {
  const nameFloat   = document.getElementById('name-float');
  const heroSocials = document.getElementById('hero-socials');
  const navLogo     = document.getElementById('nav-logo');
  if (!nameFloat) return;

  // Disable ALL CSS transitions on nameFloat — JS drives everything
  nameFloat.style.transition = 'none';

  if (navLogo) {
    navLogo.style.transition    = 'none';
    navLogo.style.opacity       = '0';
    navLogo.style.pointerEvents = 'none';
  }

  // ANIM_RANGE: how many px of scroll = full animation (name fully at corner)
  const ANIM_RANGE = 260;

  // Precomputed anchor states (recomputed on resize)
  let S = {}, E = {}; // Start and End

  function computeAnchors() {
    // --- START state: name at viewport center ---
    // Clear any inline overrides so CSS computed values apply
    ['font-size','top','left','transform','letter-spacing','opacity'].forEach(p =>
      nameFloat.style.removeProperty(p)
    );
    const csStart      = getComputedStyle(nameFloat);
    S.fontSize         = parseFloat(csStart.fontSize);
    S.letterSpacing    = parseFloat(csStart.letterSpacing) || -2;
    S.w                = nameFloat.offsetWidth;
    S.h                = nameFloat.offsetHeight;
    // For a position:fixed element, viewport-center coords:
    S.top  = (window.innerHeight - S.h) / 2;
    S.left = (window.innerWidth  - S.w) / 2;

    // --- END state: nav-logo position ---
    if (navLogo) {
      // Reveal temporarily to get real rect & font
      navLogo.style.visibility = 'hidden';
      navLogo.style.opacity    = '1';
      const navRect   = navLogo.getBoundingClientRect();
      const csNav     = getComputedStyle(navLogo);
      E.fontSize      = parseFloat(csNav.fontSize);
      E.letterSpacing = parseFloat(csNav.letterSpacing) || -0.5;
      navLogo.style.visibility = '';
      navLogo.style.opacity    = '0';

      // Apply end font-size to measure how big the name will be at that size
      nameFloat.style.fontSize = E.fontSize + 'px';
      E.w   = nameFloat.offsetWidth;
      E.h   = nameFloat.offsetHeight;
      E.top  = navRect.top  + (navRect.height - E.h) / 2;
      E.left = navRect.left;
      nameFloat.style.removeProperty('font-size');
    } else {
      E.fontSize = 20; E.letterSpacing = -0.5;
      E.top = 20; E.left = 24; E.w = 140; E.h = 24;
    }
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  // Ease-in-out so it feels natural even on slow scrolls
  function ease(t) { return t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t; }

  let rafPending = false;

  function update() {
    rafPending = false;
    const scrollY = window.scrollY;
    const raw = Math.max(0, Math.min(scrollY / ANIM_RANGE, 1)); // 0 → 1 linear
    const t   = ease(raw);                                        // eased

    // ── Position & typography ──────────────────────────────────────────
    nameFloat.style.fontSize      = lerp(S.fontSize,      E.fontSize,      t) + 'px';
    nameFloat.style.letterSpacing = lerp(S.letterSpacing, E.letterSpacing, t) + 'px';
    nameFloat.style.top           = lerp(S.top,           E.top,           t) + 'px';
    nameFloat.style.left          = lerp(S.left,          E.left,          t) + 'px';
    nameFloat.style.transform     = 'none'; // override CSS default

    // ── Social icons: fade out in first 40% of scroll range ───────────
    if (heroSocials) {
      const socialAlpha = Math.max(0, 1 - raw * 2.5);
      heroSocials.style.opacity       = socialAlpha;
      heroSocials.style.pointerEvents = socialAlpha < 0.05 ? 'none' : '';
    }

    // ── At fully cornered: swap to real nav-logo ───────────────────────
    const cornered = t >= 0.99;
    nameFloat.style.opacity = cornered ? '0' : '1';
    if (navLogo) {
      navLogo.style.opacity       = cornered ? '1' : '0';
      navLogo.style.pointerEvents = cornered ? ''   : 'none';
    }
  }

  // Kick off
  computeAnchors();
  update(); // set correct initial position immediately

  window.addEventListener('scroll', () => {
    if (!rafPending) { rafPending = true; requestAnimationFrame(update); }
  }, { passive: true });

  window.addEventListener('resize', () => {
    computeAnchors();
    update();
  }, { passive: true });
}


/* ===== NAVBAR ===== */
function initNav() {
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const overlay = document.querySelector('.nav-overlay');
  const links = document.querySelectorAll('.nav-links a');

  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);

    // Auto-hide on scroll down, show on scroll up
    if (y > 300) {
      nav.style.transform = y > lastScroll ? 'translateY(-100%)' : 'translateY(0)';
    } else {
      nav.style.transform = 'translateY(0)';
    }
    lastScroll = y;
  }, { passive: true });

  nav.style.transition = 'transform 0.35s ease, background 0.3s ease, border-color 0.3s ease';

  function toggle() {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
    overlay.classList.toggle('show');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  }

  hamburger.addEventListener('click', toggle);
  overlay.addEventListener('click', toggle);
  links.forEach(l => l.addEventListener('click', () => {
    if (navLinks.classList.contains('open')) toggle();
  }));
}

/* ===== SCROLL REVEAL (Enhanced) ===== */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

  els.forEach(el => obs.observe(el));
}

/* ===== ACTIVE NAV with smooth indicator ===== */
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a[href^="#"]');

  function update() {
    const y = window.scrollY + 120;
    let activeId = '';
    sections.forEach(s => {
      if (y >= s.offsetTop && y < s.offsetTop + s.offsetHeight) {
        activeId = s.id;
      }
    });
    navItems.forEach(a => {
      const isActive = a.getAttribute('href') === `#${activeId}`;
      a.classList.toggle('active', isActive);
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ===== PARALLAX Effect for sections ===== */
function initParallax() {
  const hero = document.querySelector('.hero');
  const heroImg = document.querySelector('.hero-image img');
  if (!hero || !heroImg) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        // Parallax hero image — moves slower than scroll
        if (y < window.innerHeight) {
          heroImg.style.transform = `translateY(${y * 0.12}px) scale(${1 + y * 0.0002})`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ===== CARD TILT on hover ===== */
function initCardTilt() {
  const cards = document.querySelectorAll('.skill-card, .project-card, .achievement-card, .goal-card');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -3;
      const rotateY = ((x - centerX) / centerX) * 3;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s ease';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
}

/* ===== SMOOTH COUNTERS for about stats ===== */
function initSmoothCounters() {
  const statVals = document.querySelectorAll('.stat-val');
  if (!statVals.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        // Support data-raw for pre-formatted numbers like 1,200+
        const rawAttr = el.getAttribute('data-raw');
        const suffixAttr = el.getAttribute('data-suffix') || '';
        const num = rawAttr ? parseInt(rawAttr) : parseInt(el.textContent.replace(/,/g, ''));
        const suffix = rawAttr ? suffixAttr : el.textContent.replace(/[\d,]/g, '');
        if (!isNaN(num) && num > 0) {
          animateCounter(el, 0, num, 1200, suffix);
        }
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statVals.forEach(s => obs.observe(s));
}

function animateCounter(el, start, end, duration, suffix) {
  if (suffix === undefined) suffix = el.textContent.replace(/[\d,]/g, '');
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(start + (end - start) * eased);
    // Format with thousands separator if >= 1000
    const formatted = current >= 1000 ? (current / 1000).toFixed(1) + 'K' : current;
    el.textContent = formatted + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/* ===== LIGHTBOX ===== */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lbFrame = document.getElementById('lightbox-img');
  const lbClose = document.getElementById('lightbox-close');
  if (!lightbox) return;

  document.querySelectorAll('[data-cert]').forEach(card => {
    card.addEventListener('click', () => {
      const src = card.getAttribute('data-cert');
      lbFrame.src = src;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  function close() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    // Stop PDF from loading in background
    lbFrame.src = '';
  }

  lbClose.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) close();
  });
}

/* ===== CONTACT FORM ===== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#f-name').value.trim();
    const email = form.querySelector('#f-email').value.trim();
    const msg = form.querySelector('#f-msg').value.trim();

    if (!name || !email || !msg) {
      showMsg('Please fill all required fields.', 'error');
      return;
    }

    const mailto = `mailto:sarthakjakhmola51@gmail.com?subject=Portfolio Contact from ${encodeURIComponent(name)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${msg}`)}`;
    window.location.href = mailto;
    showMsg('Opening your email client...', 'success');
    form.reset();
  });
}

function showMsg(text, type) {
  const old = document.querySelector('.form-msg');
  if (old) old.remove();

  const el = document.createElement('div');
  el.className = 'form-msg';
  el.textContent = text;
  el.style.cssText = `
    margin-top: 14px; padding: 10px 16px; border-radius: 10px;
    font-size: 0.85rem; font-weight: 600; animation: fadeUp 0.3s ease;
    ${type === 'success'
      ? 'background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.2);'
      : 'background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.2);'}
  `;
  document.getElementById('contact-form').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ===== SMOOTH SCROLL ===== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

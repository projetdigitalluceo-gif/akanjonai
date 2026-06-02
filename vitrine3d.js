/* ==========================================================================
   Akanjon'Ai — Vitrine 3D · Techwear
   Scroll reveals · aurora parallax · 3D tilt · filters · swatches · mobile menu
   ========================================================================== */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---- Reveal on scroll ---- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.reveal, .reveal-mask').forEach(el => io.observe(el));

/* ---- Aurora parallax on mouse (skip on touch / reduced motion) ---- */
if (canHover && !reduceMotion) {
  const orbs = document.querySelectorAll('.aurora .orb');
  let mx = 0, my = 0, cx = 0, cy = 0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth - 0.5);
    my = (e.clientY / window.innerHeight - 0.5);
  }, { passive: true });
  function animOrbs() {
    cx += (mx - cx) * 0.06;
    cy += (my - cy) * 0.06;
    orbs.forEach(o => {
      const d = parseFloat(o.dataset.depth || 0.5);
      o.style.transform = `translate(${cx * 60 * d}px, ${cy * 60 * d}px)`;
    });
    requestAnimationFrame(animOrbs);
  }
  animOrbs();
}

/* ---- 3D tilt (hero card + .tilt cards), pointer devices only ---- */
if (canHover && !reduceMotion) {
  const heroCard = document.getElementById('heroCard');
  if (heroCard) {
    const wrap = heroCard.parentElement;
    wrap.addEventListener('mousemove', e => {
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      heroCard.style.transform = `rotateY(${px * 16}deg) rotateX(${-py * 16}deg)`;
      heroCard.style.setProperty('--mx', (px + 0.5) * 100 + '%');
      heroCard.style.setProperty('--my', (py + 0.5) * 100 + '%');
    }, { passive: true });
    wrap.addEventListener('mouseleave', () => { heroCard.style.transform = ''; });
  }

  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateY(-4px)`;
      card.style.setProperty('--mx', (px + 0.5) * 100 + '%');
      card.style.setProperty('--my', (py + 0.5) * 100 + '%');
    }, { passive: true });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ---- Product filters with FLIP "magic move" animation ---- */
const chips = document.querySelectorAll('.chip');
const cards = [...document.querySelectorAll('#grid .card')];

function applyFilter(f) {
  // FIRST — record positions of currently visible cards
  const firstRects = new Map();
  cards.forEach(c => { if (c.style.display !== 'none') firstRects.set(c, c.getBoundingClientRect()); });

  // Toggle visibility for the new filter
  cards.forEach(card => {
    const show = f === 'all' || (card.dataset.cats || '').includes(f);
    card.style.display = show ? '' : 'none';
  });

  if (reduceMotion || typeof cards[0].animate !== 'function') return;

  // LAST — measure new positions, then INVERT + PLAY
  cards.forEach(card => {
    if (card.style.display === 'none') return;
    const last = card.getBoundingClientRect();
    const first = firstRects.get(card);
    if (first) {
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (dx || dy) {
        card.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
          { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        );
      }
    } else {
      // newly revealed card — fade + scale + slight lift
      card.animate(
        [{ opacity: 0, transform: 'scale(0.9) translateY(12px)' }, { opacity: 1, transform: 'none' }],
        { duration: 460, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    }
  });
}

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
    chip.classList.add('active');
    chip.setAttribute('aria-pressed', 'true');
    applyFilter(chip.dataset.f);
  });
});

/* ---- Swatches ---- */
document.querySelectorAll('.swatches').forEach(group => {
  group.addEventListener('click', e => {
    const sw = e.target.closest('.swatch');
    if (!sw) return;
    e.preventDefault();
    group.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
  });
});

/* ---- Mobile menu ---- */
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
if (navToggle && navMenu) {
  const setMenu = (open) => {
    navMenu.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  };
  navToggle.addEventListener('click', () => {
    setMenu(!navMenu.classList.contains('open'));
  });
  // close when a link is tapped
  navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  // close on Escape
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  // close when tapping outside the nav
  document.addEventListener('click', e => {
    if (navMenu.classList.contains('open') && !e.target.closest('.nav')) setMenu(false);
  });
}

/* ---- Dark / light theme toggle ---- */
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
    themeToggle.setAttribute('aria-label', theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair');
    if (themeMeta) themeMeta.setAttribute('content', theme === 'light' ? '#f4f1ea' : '#08080b');
  };
  // sync with the theme already set (no-flash script in <head>)
  applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('akanjonai-theme', next); } catch (e) {}
    applyTheme(next);
  });
}

/* ---- Scroll progress bar ---- */
const progressBar = document.getElementById('scrollProgress');
if (progressBar) {
  let ticking = false;
  const updateProgress = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const p = max > 0 ? Math.min(doc.scrollTop / max, 1) : 0;
    progressBar.style.transform = `scaleX(${p})`;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  updateProgress();
}

/* ---- Scrollspy: highlight the nav link of the section in view ---- */
(() => {
  const links = [...document.querySelectorAll('.nav-menu a[href^="#"]')];
  if (!links.length) return;
  const map = new Map();
  links.forEach(a => {
    const id = a.getAttribute('href').slice(1);
    if (id) map.set(id, a);
  });
  const sections = [...map.keys()].map(id => document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(a => a.classList.remove('active'));
        const a = map.get(e.target.id);
        if (a) a.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach(s => spy.observe(s));
})();

/* ---- Hero "decode" text scramble + animated stat counters ---- */
if (!reduceMotion) {
  // Scramble the gradient word in the hero headline
  const scrambleEl = document.querySelector('.hero h1 .grad');
  if (scrambleEl) {
    const finalText = scrambleEl.textContent;
    const glyphs = '!<>-_\\/[]{}=+*^?#01ABCDEF';
    const duration = 850;
    let startTs = null;
    const run = (ts) => {
      if (startTs === null) startTs = ts;
      const revealed = Math.floor(((ts - startTs) / duration) * finalText.length);
      let out = '';
      for (let i = 0; i < finalText.length; i++) {
        if (finalText[i] === ' ') { out += ' '; continue; }
        out += i < revealed ? finalText[i] : glyphs[(Math.random() * glyphs.length) | 0];
      }
      scrambleEl.textContent = out;
      if (ts - startTs < duration) requestAnimationFrame(run);
      else scrambleEl.textContent = finalText;
    };
    setTimeout(() => requestAnimationFrame(run), 350);
    // Safety: guarantee the final word lands even if rAF is throttled/paused
    setTimeout(() => { scrambleEl.textContent = finalText; }, 350 + duration + 700);
  }

  // Count up the numeric hero stats when they scroll into view
  const countUp = (el) => {
    const raw = el.textContent.trim();
    const m = raw.match(/^(\d+)(\D*)$/); // e.g. "02", "11", "100%" — skips "XS–XXL"
    if (!m) return;
    const target = parseInt(m[1], 10);
    const suffix = m[2] || '';
    const pad = m[1].length;
    const duration = 1200;
    let startTs = null;
    const step = (ts) => {
      if (startTs === null) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased)).padStart(pad, '0') + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = m[1] + suffix;
    };
    requestAnimationFrame(step);
  };
  const statsWrap = document.querySelector('.hero-stats');
  if (statsWrap) {
    const statObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          statsWrap.querySelectorAll('.stat .v').forEach(countUp);
          obs.disconnect();
        }
      });
    }, { threshold: 0.4 });
    statObserver.observe(statsWrap);
  }
}

/* ---- Magnetic CTAs (pointer devices, motion allowed) ---- */
if (canHover && !reduceMotion) {
  const magnetize = (el, strength) => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * strength;
      const y = (e.clientY - r.top - r.height / 2) * strength;
      el.style.transform = `translate(${x}px, ${y}px)`;
    }, { passive: true });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  };
  document.querySelectorAll('.btn.primary, .btn-fb, .nav-cta').forEach(el => magnetize(el, 0.28));
}

/* ---- Preloader: lift the curtain once the page is ready ---- */
const preloader = document.getElementById('preloader');
if (preloader) {
  let hidden = false;
  const hide = () => {
    if (hidden) return;
    hidden = true;
    preloader.classList.add('done');
    setTimeout(() => preloader.remove(), 900);
  };
  if (document.readyState === 'complete') hide();
  else window.addEventListener('load', hide, { once: true });
  setTimeout(hide, 2200); // safety net if 'load' never fires
}

/* ---- Custom cursor: trailing ring + dot, reacts to interactive targets ---- */
if (canHover && !reduceMotion) {
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (dot && ring) {
    document.body.classList.add('has-cursor');
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    }, { passive: true });
    const ringLoop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(ringLoop);
    };
    ringLoop();
    document.querySelectorAll('a, button, .swatch, .chip, .tilt, .theme-toggle').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
    });
    document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = ''; ring.style.opacity = ''; });
  }
}

/* ---- Easter egg: Konami code (or 5 taps on the footer logo) → AI rain ---- */
(() => {
  let eggActive = false;

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'egg-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 3400);
  }

  function launchEgg() {
    if (eggActive) return;
    eggActive = true;
    toast("✦ Mode Akanjon'Ai débloqué");

    if (reduceMotion) { eggActive = false; return; }

    const cv = document.createElement('canvas');
    cv.className = 'egg-canvas';
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    let W, H;
    const resize = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const glyphs = "AKANJONAI01✦</>{}=+*アイウ#?".split('');
    const colors = ['#ff8559', '#7b6bff', '#19e39c'];
    const fontSize = 18;
    const columns = Math.ceil(W / fontSize);
    const drops = Array.from({ length: columns }, () => Math.random() * -40);
    const start = performance.now();
    const DURATION = 5200;

    const draw = (now) => {
      // translucent trail (classic matrix fade)
      ctx.fillStyle = 'rgba(8, 8, 11, 0.13)';
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      for (let i = 0; i < columns; i++) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillText(glyphs[(Math.random() * glyphs.length) | 0], i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > H && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.7;
      }
      const elapsed = now - start;
      if (elapsed < DURATION) {
        requestAnimationFrame(draw);
      } else {
        cv.classList.add('fade');
        window.removeEventListener('resize', resize);
        setTimeout(() => { cv.remove(); eggActive = false; }, 700);
      }
    };
    requestAnimationFrame(draw);
  }

  // Konami sequence
  const seq = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let pos = 0;
  window.addEventListener('keydown', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
    if (k === seq[pos]) {
      pos++;
      if (pos === seq.length) { pos = 0; launchEgg(); }
    } else {
      pos = (k === seq[0]) ? 1 : 0;
    }
  });

  // Mobile-friendly: 5 quick taps on the footer logo
  const footLogo = document.querySelector('.foot-logo img');
  if (footLogo) {
    let taps = 0, last = 0;
    footLogo.style.cursor = 'pointer';
    footLogo.addEventListener('click', () => {
      const t = performance.now();
      taps = (t - last < 600) ? taps + 1 : 1;
      last = t;
      if (taps >= 5) { taps = 0; launchEgg(); }
    });
  }
})();

/* ---- Hero neural constellation: interactive particle network ---- */
(() => {
  const canvas = document.getElementById('heroNet');
  if (!canvas) return;
  const hero = canvas.closest('.hero');
  const ctx = canvas.getContext('2d');
  if (!hero || !ctx) return;

  let W = 0, H = 0, dpr = 1, nodes = [], raf = null, visible = true;
  const mouse = { x: -9999, y: -9999, active: false };
  const LINK = 132, MLINK = 178;

  const palette = () => {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    return {
      line: light ? '40, 32, 22' : '245, 243, 239',
      node: light ? 'rgba(40, 32, 22, 0.5)' : 'rgba(245, 243, 239, 0.7)',
      accent: '255, 133, 89'
    };
  };

  function resize() {
    const r = hero.getBoundingClientRect();
    W = r.width; H = Math.max(r.height, 1);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(64, Math.max(26, (W * H) / 17000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32,
      r: Math.random() * 1.5 + 1.1
    }));
  }

  function update() {
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      if (mouse.active) {
        const dx = mouse.x - n.x, dy = mouse.y - n.y, d2 = dx * dx + dy * dy;
        if (d2 < MLINK * MLINK && d2 > 1) { n.vx += dx * 0.0008; n.vy += dy * 0.0008; }
      }
      n.vx *= 0.994; n.vy *= 0.994;
      const sp = Math.hypot(n.vx, n.vy);
      if (sp > 0.7) { n.vx = n.vx / sp * 0.7; n.vy = n.vy / sp * 0.7; }
      else if (sp < 0.04) { n.vx += (Math.random() - 0.5) * 0.06; n.vy += (Math.random() - 0.5) * 0.06; }
    }
  }

  function render() {
    const c = palette();
    ctx.clearRect(0, 0, W, H);
    // node-to-node links
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y, dist = Math.hypot(dx, dy);
        if (dist < LINK) {
          ctx.strokeStyle = `rgba(${c.line}, ${(1 - dist / LINK) * 0.45})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    // cursor links (accent)
    if (mouse.active) {
      for (const n of nodes) {
        const dist = Math.hypot(mouse.x - n.x, mouse.y - n.y);
        if (dist < MLINK) {
          ctx.strokeStyle = `rgba(${c.accent}, ${(1 - dist / MLINK) * 0.85})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(n.x, n.y); ctx.stroke();
        }
      }
    }
    // nodes
    for (const n of nodes) {
      const near = mouse.active && Math.hypot(mouse.x - n.x, mouse.y - n.y) < MLINK;
      if (near) { ctx.fillStyle = `rgba(${c.accent}, 0.95)`; ctx.shadowColor = `rgba(${c.accent}, 0.8)`; ctx.shadowBlur = 8; }
      else { ctx.fillStyle = c.node; ctx.shadowBlur = 0; }
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function loop() {
    if (!visible || reduceMotion) { raf = null; return; }
    update(); render();
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf && visible && !reduceMotion) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  window.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    mouse.active = (x >= 0 && y >= 0 && x <= r.width && y <= r.height);
    if (mouse.active) { mouse.x = x; mouse.y = y; }
  }, { passive: true });

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { resize(); if (reduceMotion) render(); }, 150);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    visible ? start() : stop();
  });

  resize();
  if (reduceMotion) {
    render(); // static constellation
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { visible = e.isIntersecting && !document.hidden; visible ? start() : stop(); });
    }, { threshold: 0 });
    io.observe(hero);
    start();
  }
})();

/* ---- Lookbook lightbox ---- */
(() => {
  const items = [...document.querySelectorAll('.lb-item')];
  const lb = document.getElementById('lightbox');
  if (!items.length || !lb) return;
  const img = document.getElementById('lbImg');
  const counter = document.getElementById('lbCounter');
  const srcs = items.map(b => b.querySelector('img').getAttribute('src'));
  const alts = items.map(b => b.querySelector('img').getAttribute('alt') || '');
  let idx = 0;
  const show = (i) => {
    idx = (i + srcs.length) % srcs.length;
    img.src = srcs[idx];
    img.alt = alts[idx];
    if (counter) counter.textContent = (idx + 1) + ' / ' + srcs.length;
  };
  const open = (i) => {
    show(i);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  items.forEach((b, i) => b.addEventListener('click', () => open(i)));
  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', (e) => { e.stopPropagation(); show(idx - 1); });
  document.getElementById('lbNext').addEventListener('click', (e) => { e.stopPropagation(); show(idx + 1); });
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });
})();

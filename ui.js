/* ═══════════════════════════════════════════════════════════
   AlphaMatrix — GSAP Animation Layer (ui.js)
   All visual polish, particles, and micro-interactions live here.
   Runs AFTER script.js has bootstrapped the game.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Wait for DOM + GSAP to be ready ─────────────────────── */
  window.addEventListener('DOMContentLoaded', () => {

    /* ═══════════════════════════════════════════════════
       1. PARTICLE BACKGROUND
       ═══════════════════════════════════════════════════ */

    const canvas  = document.getElementById('particle-canvas');
    const ctx     = canvas.getContext('2d');
    let particles = [];
    let raf;

    function resizeCanvas() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    /* Particle factory */
    function createParticle() {
      return {
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.5 + 0.4,
        vx:    (Math.random() - 0.5) * 0.3,
        vy:    (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.6 + 0.1,
        hue:   Math.random() > 0.5 ? 260 : 190,  // violet or cyan
      };
    }

    /* Seed particles */
    for (let i = 0; i < 120; i++) particles.push(createParticle());

    /* Connect nearby particles with lines */
    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.12;
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${particles[i].hue}, 80%, 65%, ${alpha})`;
            ctx.lineWidth   = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        /* Wrap around edges */
        if (p.x < -10) p.x = canvas.width  + 10;
        if (p.x > canvas.width  + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        /* Draw particle */
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.alpha})`;
        ctx.fill();
      });

      drawConnections();
      raf = requestAnimationFrame(animateParticles);
    }
    animateParticles();

    /* ═══════════════════════════════════════════════════
       2. ENTRANCE ANIMATION (page load)
       ═══════════════════════════════════════════════════ */

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    /* Main wrapper fade-in */
    tl.to('#app-wrapper', {
      opacity: 1,
      duration: 0.5,
    })
    /* Nav slides down */
    .from('#top-nav', {
      y: -40,
      opacity: 0,
      duration: 0.55,
    }, '-=0.2')
    /* Status bar */
    .from('#status-bar', {
      y: -20,
      opacity: 0,
      duration: 0.4,
    }, '-=0.35')
    /* Board shell scales up */
    .from('#board-shell', {
      scale: 0.88,
      opacity: 0,
      duration: 0.6,
      ease: 'back.out(1.4)',
    }, '-=0.3')
    /* Controls stagger */
    .from('.ctrl-btn', {
      y: 20,
      opacity: 0,
      stagger: 0.06,
      duration: 0.4,
    }, '-=0.35')
    /* Numpad stagger */
    .from('.num-btn', {
      scale: 0,
      opacity: 0,
      stagger: 0.04,
      duration: 0.35,
      ease: 'back.out(2)',
    }, '-=0.3')
    /* Bottom buttons */
    .from('.bottom-row > *', {
      y: 15,
      opacity: 0,
      stagger: 0.07,
      duration: 0.35,
    }, '-=0.25');

    /* ═══════════════════════════════════════════════════
       3. DIFFICULTY PILL ANIMATION
       ═══════════════════════════════════════════════════ */

    const diffPills = document.querySelectorAll('.diff-pill');

    diffPills.forEach(pill => {
      pill.addEventListener('click', function () {
        /* Animate out old active */
        const current = document.querySelector('.diff-pill.active');
        if (current && current !== pill) {
          gsap.to(current, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
        }
        diffPills.forEach(p => p.classList.remove('active'));
        this.classList.add('active');

        /* Pop the new pill */
        gsap.fromTo(pill,
          { scale: 0.85 },
          { scale: 1, duration: 0.4, ease: 'back.out(2)' }
        );
      });
    });

    /* ═══════════════════════════════════════════════════
       4. BUTTON MICRO-INTERACTIONS
       ═══════════════════════════════════════════════════ */

    /* Primary & ghost buttons */
    document.querySelectorAll('.primary-btn, .ghost-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () =>
        gsap.to(btn, { scale: 1.03, duration: 0.2, ease: 'power1.out' })
      );
      btn.addEventListener('mouseleave', () =>
        gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power1.out' })
      );
      btn.addEventListener('mousedown', () =>
        gsap.to(btn, { scale: 0.95, duration: 0.1 })
      );
      btn.addEventListener('mouseup', () =>
        gsap.to(btn, { scale: 1, duration: 0.2, ease: 'back.out(2)' })
      );
    });

    /* Control buttons */
    document.querySelectorAll('.ctrl-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const wrap = this.querySelector('.ctrl-icon-wrap');
        gsap.fromTo(wrap,
          { scale: 0.85, rotate: -5 },
          { scale: 1, rotate: 0, duration: 0.35, ease: 'back.out(2.5)' }
        );
      });
    });

    /* Number buttons — bounce press */
    document.querySelectorAll('.num-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        gsap.fromTo(this,
          { scale: 0.82 },
          { scale: 1, duration: 0.4, ease: 'back.out(3)' }
        );

        /* Ripple glow effect */
        createButtonGlow(this);
      });
    });

    function createButtonGlow(el) {
      const glow = document.createElement('span');
      glow.style.cssText = `
        position:absolute; inset:0; border-radius:inherit;
        background:radial-gradient(circle, rgba(124,58,237,0.5), transparent 70%);
        pointer-events:none; z-index:0;
      `;
      el.style.position = 'relative';
      el.appendChild(glow);
      gsap.fromTo(glow,
        { opacity: 0.8, scale: 0.5 },
        { opacity: 0, scale: 1.5, duration: 0.5, onComplete: () => glow.remove() }
      );
    }

    /* Icon pill (theme toggle) */
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        gsap.fromTo(themeBtn,
          { rotate: 0 },
          { rotate: 360, duration: 0.55, ease: 'power2.inOut' }
        );
      });
    }

    /* ═══════════════════════════════════════════════════
       5. BOARD GLOW RING — INTERACTIVE COLOUR SHIFT
       ═══════════════════════════════════════════════════ */

    /* Board glow ring shifts hue based on selected cell column */
    const boardRing = document.querySelector('.board-glow-ring');

    /* Listen for custom events from game (dispatched by script override) */
    document.addEventListener('cellSelected', (e) => {
      const col = e.detail.col;
      const hue = 260 + col * 10;   /* violet → cyan sweep */
      gsap.to(boardRing, {
        background: `linear-gradient(135deg, hsl(${hue},70%,60%), hsl(${hue + 70},80%,60%))`,
        duration: 0.4,
        ease: 'power1.out'
      });
    });

    /* ═══════════════════════════════════════════════════
       6. MODAL ANIMATIONS
       ═══════════════════════════════════════════════════ */

    /* Override showModal to animate */
    window._showModalAnimated = function (modalEl) {
      modalEl.classList.remove('hidden');
      const card = modalEl.querySelector('.modal-card, .loading-card');

      gsap.fromTo(modalEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      if (card) {
        gsap.fromTo(card,
          { y: 40, scale: 0.9, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }
        );
      }
    };

    window._hideModalAnimated = function (modalEl, callback) {
      const card = modalEl.querySelector('.modal-card, .loading-card');
      const tl   = gsap.timeline({ onComplete: () => {
        modalEl.classList.add('hidden');
        if (callback) callback();
      }});

      if (card) {
        tl.to(card,    { y: -20, scale: 0.92, opacity: 0, duration: 0.25, ease: 'power2.in' });
      }
      tl.to(modalEl, { opacity: 0, duration: 0.2 }, card ? '-=0.15' : 0);
    };

    /* ═══════════════════════════════════════════════════
       7. NOTES MODE TOGGLE ANIMATION
       ═══════════════════════════════════════════════════ */

    const notesBtn   = document.getElementById('btn-notes');
    const notesBadge = document.getElementById('notes-badge');

    if (notesBtn) {
      notesBtn.addEventListener('click', () => {
        /* Badge flip animation */
        gsap.fromTo(notesBadge,
          { scaleY: 1 },
          { scaleY: 0, duration: 0.12, onComplete: () => {
            gsap.to(notesBadge, { scaleY: 1, duration: 0.15 });
          }}
        );
        /* Container colour pulse */
        gsap.fromTo(notesBtn.querySelector('.ctrl-icon-wrap'),
          { boxShadow: '0 0 0px rgba(124,58,237,0)' },
          { boxShadow: '0 0 20px rgba(124,58,237,0.6)', duration: 0.3, yoyo: true, repeat: 1 }
        );
        /* Toggle active class for styling (mirrors script.js active flag) */
        setTimeout(() => {
          notesBtn.classList.toggle('notes-active', notesBtn.classList.contains('active'));
        }, 0);
      });
    }

    /* ═══════════════════════════════════════════════════
       8. PAUSE OVERLAY ANIMATION
       Watch the pause overlay's class via MutationObserver so we
       don't conflict with script.js's own click handler for state.
       ═══════════════════════════════════════════════════ */

    const pauseOverlay = document.getElementById('pause-overlay');
    const overlayInner = pauseOverlay ? pauseOverlay.querySelector('.overlay-inner') : null;

    /* Intercept the native hidden class toggle to drive GSAP animation */
    const pauseObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        const isNowHidden = pauseOverlay.classList.contains('hidden');
        if (!isNowHidden) {
          /* Showing — animate in */
          gsap.fromTo(pauseOverlay,
            { opacity: 0 },
            { opacity: 1, duration: 0.35, ease: 'power2.out' }
          );
          if (overlayInner) {
            gsap.fromTo(overlayInner,
              { y: 20, scale: 0.92 },
              { y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.5)' }
            );
          }
        }
        /* When hiding, script.js removes 'hidden' then we'd need reverse —
           but script.js calls classList.add('hidden') directly,
           so we do a quick fade before it disappears on next paint */
      });
    });
    if (pauseOverlay) {
      pauseObserver.observe(pauseOverlay, { attributes: true, attributeFilter: ['class'] });
    }

    /* ═══════════════════════════════════════════════════
       9. CELL NUMBER POP-IN
       ═══════════════════════════════════════════════════ */

    /* Called from outside by patchRenderBoard() below */
    window._animateCellPopIn = function (cellEl) {
      gsap.fromTo(cellEl,
        { scale: 0.55, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2.5)' }
      );
    };

    /* ═══════════════════════════════════════════════════
       10. TIMER TICK ANIMATION
       ═══════════════════════════════════════════════════ */

    const timerEl = document.getElementById('timer-display');
    let lastSecond = -1;

    setInterval(() => {
      if (!timerEl) return;
      const text = timerEl.textContent;
      const secs = parseInt(text.split(':')[1] || '0');
      if (secs !== lastSecond) {
        lastSecond = secs;
        gsap.fromTo(timerEl,
          { scale: 1.08, color: 'hsl(190, 80%, 70%)' },
          { scale: 1, color: '', duration: 0.25, ease: 'power1.out' }
        );
      }
    }, 500);

    /* ═══════════════════════════════════════════════════
       11. WINNING BURST (board flash) + VICTORY SCREEN GSAP
       ═══════════════════════════════════════════════════ */

    window._animateVictory = function () {
      /* Board golden flash */
      const boardGlass = document.getElementById('board-glass');
      if (boardGlass) {
        gsap.fromTo(boardGlass,
          { boxShadow: 'var(--shadow-lg)' },
          {
            boxShadow: '0 0 60px rgba(251,191,36,0.8), 0 0 120px rgba(251,191,36,0.4)',
            duration: 0.5,
            yoyo: true,
            repeat: 3,
            ease: 'power2.inOut'
          }
        );
      }
    };

    /* Full GSAP entrance sequence for the victory overlay */
    window._animateVictoryScreen = function () {
      const backdrop  = document.getElementById('victory-modal');
      const glow      = backdrop.querySelector('.vic-glow');
      const ribbon    = backdrop.querySelector('.vic-ribbon');
      const trophy    = backdrop.querySelector('.vic-trophy');
      const burst     = backdrop.querySelector('.vic-burst');
      const headline  = backdrop.querySelector('.vic-headline');
      const tagline   = backdrop.querySelector('.vic-tagline');
      const stats     = backdrop.querySelectorAll('.vic-stat');
      const dividers  = backdrop.querySelectorAll('.vic-stat-divider');
      const buttons   = backdrop.querySelectorAll('.vic-btn');
      const body      = backdrop.querySelector('.vic-body');
      const timeEl    = document.getElementById('victory-time');
      const mistakesEl= document.getElementById('victory-mistakes');

      /* Kill any running tweens */
      gsap.killTweensOf([backdrop, glow, burst, trophy, headline, tagline, ...stats, ...buttons, body]);

      /* ── Set initial hidden states ── */
      gsap.set(backdrop,  { opacity: 0 });
      gsap.set(glow,      { opacity: 0, scale: 0.7 });
      gsap.set(ribbon,    { scaleX: 0, transformOrigin: 'left center' });
      gsap.set(trophy,    { scale: 0, opacity: 0, rotation: -25 });
      gsap.set(burst,     { scale: 0, opacity: 0, transformOrigin: 'center center' });
      gsap.set(headline,  { scale: 0.4, opacity: 0, filter: 'blur(8px)' });
      gsap.set(tagline,   { y: 18, opacity: 0 });
      gsap.set(stats,     { y: 28, opacity: 0 });
      gsap.set(dividers,  { scaleY: 0, transformOrigin: 'top center' });
      gsap.set(buttons,   { y: 24, opacity: 0, scale: 0.9 });

      /* ── Master timeline ── */
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      /* 1 – Backdrop fades in */
      tl.to(backdrop, { opacity: 1, duration: 0.4, ease: 'power2.out' })

      /* 2 – Ambient glow expands */
      .to(glow, { opacity: 1, scale: 1, duration: 0.9, ease: 'power2.out' }, '-=0.2')

      /* 3 – Ribbon sweeps across */
      .to(ribbon, { scaleX: 1, duration: 0.5, ease: 'power3.inOut' }, '-=0.6')

      /* 4 – Trophy bounces in with spin */
      .to(trophy, {
        scale: 1, opacity: 1, rotation: 0,
        duration: 0.7, ease: 'back.out(2)'
      }, '-=0.2')

      /* 5 – Glow burst expands behind headline */
      .to(burst, {
        scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.4)'
      }, '-=0.1')

      /* 6 – "YOU WIN" scales up — simultaneous with burst */
      .to(headline, {
        scale: 1, opacity: 1,
        filter: 'blur(0px)',
        duration: 0.75, ease: 'back.out(1.6)'
      }, '<0.05')

      /* 7 – Screen shake (body element, tasteful) */
      .to(body, {
        x: -6, duration: 0.045, ease: 'none',
        onComplete() {
          gsap.to(body, { x: 6, duration: 0.045, ease: 'none',
            onComplete() {
              gsap.to(body, { x: -4, duration: 0.04, ease: 'none',
                onComplete() {
                  gsap.to(body, { x: 4, duration: 0.04, ease: 'none',
                    onComplete() { gsap.to(body, { x: 0, duration: 0.03 }); }
                  });
                }
              });
            }
          });
        }
      }, '-=0.4')

      /* 8 – Tagline fades in */
      .to(tagline, { y: 0, opacity: 1, duration: 0.45 }, '-=0.15')

      /* 9 – Stats slide up staggered */
      .to(stats, {
        y: 0, opacity: 1,
        duration: 0.5, stagger: 0.09,
        ease: 'power2.out'
      }, '-=0.1')
      .to(dividers, { scaleY: 1, duration: 0.4, stagger: 0.1 }, '<0.1')

      /* 10 – Buttons bounce up */
      .to(buttons, {
        y: 0, opacity: 1, scale: 1,
        duration: 0.5, stagger: 0.09,
        ease: 'back.out(1.8)'
      }, '-=0.3');

      /* ── Stat counter animation (after stats are visible) ── */
      tl.add(() => {

        /* Time counter */
        const targetSec = parseInt(timeEl.dataset.target || '0', 10);
        if (targetSec > 0) {
          const counter = { v: 0 };
          gsap.to(counter, {
            v: targetSec,
            duration: Math.min(targetSec * 0.025, 1.8),
            ease: 'power2.out',
            onUpdate() {
              const t = Math.round(counter.v);
              const m = String(Math.floor(t / 60)).padStart(2, '0');
              const s = String(t % 60).padStart(2, '0');
              timeEl.textContent = `${m}:${s}`;
            }
          });
        }

        /* Mistakes counter */
        const targetMistakes = parseInt(mistakesEl.dataset.target || '0', 10);
        if (targetMistakes > 0) {
          const mCounter = { v: 0 };
          gsap.to(mCounter, {
            v: targetMistakes,
            duration: 0.8,
            ease: 'power2.out',
            onUpdate() {
              mistakesEl.textContent = Math.round(mCounter.v);
            }
          });
        }

      }, '-=0.25');

      /* ── Infinite loops after entrance ── */
      tl.add(() => {

        /* Headline neon glow pulse */
        gsap.to(headline, {
          filter: 'blur(0px) drop-shadow(0 0 30px rgba(124,58,237,.95)) drop-shadow(0 0 65px rgba(6,182,212,.65))',
          duration: 1.5, yoyo: true, repeat: -1, ease: 'sine.inOut'
        });

        /* Burst breathe */
        gsap.to(burst, {
          scale: 1.15, opacity: 0.75, duration: 2.5, yoyo: true, repeat: -1, ease: 'sine.inOut'
        });

        /* Ambient glow breathe */
        gsap.to(glow, {
          scale: 1.08, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut'
        });

        /* Trophy float */
        gsap.to(trophy, {
          y: -6, duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut'
        });
      });
    };

    /* ═══════════════════════════════════════════════════
       12. SCROLL LOCK on MODALS
       ═══════════════════════════════════════════════════ */

    const observer = new MutationObserver(() => {
      const anyOpen = !document.querySelector('.modal-backdrop:not(.hidden)');
      document.body.style.overflow = anyOpen ? '' : 'hidden';
    });

    document.querySelectorAll('.modal-backdrop').forEach(m =>
      observer.observe(m, { attributes: true, attributeFilter: ['class'] })
    );

    /* ═══════════════════════════════════════════════════
       13. AMBIENT ORB MOUSE PARALLAX (desktop only)
       ═══════════════════════════════════════════════════ */

    if (window.matchMedia('(hover: hover)').matches) {
      document.addEventListener('mousemove', (e) => {
        const cx = (e.clientX / window.innerWidth  - 0.5) * 2;
        const cy = (e.clientY / window.innerHeight - 0.5) * 2;

        gsap.to('.orb-1', { x: cx * 20, y: cy * 20, duration: 2, ease: 'power1.out' });
        gsap.to('.orb-2', { x: cx * -15, y: cy * -15, duration: 2.5, ease: 'power1.out' });
        gsap.to('.orb-3', { x: cx * 10, y: cy * 10, duration: 3, ease: 'power1.out' });
      });
    }

    /* ═══════════════════════════════════════════════════
       14. NUMPAD HOVER GLOW SCAN
       ═══════════════════════════════════════════════════ */

    const numBtns = document.querySelectorAll('.num-btn');
    numBtns.forEach((btn, idx) => {
      btn.addEventListener('mouseenter', () => {
        gsap.to(btn, {
          borderColor: 'rgba(124,58,237,0.7)',
          duration: 0.2
        });
        /* Subtle ripple on neighbors */
        const prev = numBtns[idx - 1];
        const next = numBtns[idx + 1];
        [prev, next].forEach(neighbor => {
          if (neighbor) {
            gsap.fromTo(neighbor,
              { boxShadow: '0 0 0px transparent' },
              { boxShadow: '0 0 8px rgba(6,182,212,0.2)', duration: 0.2, yoyo: true, repeat: 1 }
            );
          }
        });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { borderColor: 'var(--glass-border)', duration: 0.3 });
      });
    });

    /* ═══════════════════════════════════════════════════
       DONE
       ═══════════════════════════════════════════════════ */
    console.log('%cAlphaMatrix UI Animations Ready 🎮', 'color:#7c3aed;font-weight:bold;font-size:14px;');

  }); // end DOMContentLoaded

})();

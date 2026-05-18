(() => {
  const canvas = document.getElementById('liquid-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── offscreen: local ink strokes accumulate here ── */
  const acc    = document.createElement('canvas');
  const accCtx = acc.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    acc.width     = window.innerWidth;
    acc.height    = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── palette: #FFC5FC (pink) → #89CAFF (blue) ── */
  function col(t, a) {
    t = Math.max(0, Math.min(1, t));
    return `rgba(${~~(255+(137-255)*t)},${~~(197+(202-197)*t)},${~~(252+(255-252)*t)},${a})`;
  }

  function getO() {
    const el = document.getElementById('oRing');
    if (!el) return null;
    const rc = el.getBoundingClientRect();
    return { cx: rc.left + rc.width*.5, cy: rc.top + rc.height*.5, r: rc.width*.5 };
  }

  const blobs = [];
  let hue     = 0;
  let fill    = 0;    // 0 → 1: drives full-screen background
  let coinHue = 0;
  const coinFill = document.getElementById('coin-liquid-fill');

  function spawn(x, y, vel) {
    hue     = (hue     + 0.06) % 1;
    coinHue = (coinHue + 0.05) % 1;
    fill    = Math.min(1, fill + 0.008);   // fills screen in ~120 rubs

    const jx = x + (Math.random()-.5) * 20;
    const jy = y + (Math.random()-.5) * 20;
    const r  = 70 + vel * 2.0;

    blobs.push({ x: jx, y: jy, r: r*.25, maxR: r, hue });

    /* immediate small splash committed to acc */
    const g = accCtx.createRadialGradient(jx, jy, 0, jx, jy, r*.4);
    g.addColorStop(0, col(hue, .55));
    g.addColorStop(1, col((hue+.2)%1, 0));
    accCtx.fillStyle = g;
    accCtx.beginPath();
    accCtx.arc(jx, jy, r*.4, 0, Math.PI*2);
    accCtx.fill();
  }

  let lx = -9999, ly = -9999;

  window.addEventListener('mousemove', e => {
    const o = getO();
    if (!o) return;
    if (Math.hypot(e.clientX - o.cx, e.clientY - o.cy) > o.r * 1.35) return;
    const moved = Math.hypot(e.clientX - lx, e.clientY - ly);
    if (moved < 10) return;
    spawn(e.clientX, e.clientY, Math.min(moved, 60));
    lx = e.clientX; ly = e.clientY;
  });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* ── Layer 1: full-screen linear gradient, grows uniformly with fill ──
       Entire background fills simultaneously (not just near O).
       At fill=1 alpha=0.93 → white background completely gone. */
    if (fill > 0) {
      const W = canvas.width, H = canvas.height;
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0,   col(0,    fill * 0.93));  // #FFC5FC
      bg.addColorStop(0.5, col(0.4,  fill * 0.88));  // mid
      bg.addColorStop(1,   col(1,    fill * 0.93));  // #89CAFF
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
    }

    /* ── Layer 2: local accumulated ink strokes ── */
    ctx.drawImage(acc, 0, 0);

    /* ── Layer 3: actively growing blobs (cursor feedback) ── */
    for (let i = blobs.length-1; i >= 0; i--) {
      const b = blobs[i];
      b.r = Math.min(b.r + 3.5, b.maxR);

      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0,   col(b.hue,         .82));
      g.addColorStop(.45, col((b.hue+.15)%1, .42));
      g.addColorStop(1,   col((b.hue+.30)%1,  0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.fill();

      if (b.r >= b.maxR) {
        const g2 = accCtx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.maxR);
        g2.addColorStop(0,   col(b.hue,         .55));
        g2.addColorStop(.5,  col((b.hue+.15)%1, .28));
        g2.addColorStop(1,   col((b.hue+.30)%1,  0));
        accCtx.fillStyle = g2;
        accCtx.beginPath();
        accCtx.arc(b.x, b.y, b.maxR, 0, Math.PI*2);
        accCtx.fill();
        blobs.splice(i, 1);
      }
    }

    /* ── Shift coin interior gradient colour on rub ── */
    if (coinFill) {
      coinFill.style.background =
        `linear-gradient(135deg, ${col(coinHue,1)} 0%, ${col((coinHue+.5)%1,1)} 100%)`;
    }

    requestAnimationFrame(draw);
  }

  draw();
})();

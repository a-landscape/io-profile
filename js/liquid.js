(() => {
  const canvas = document.getElementById('liquid-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── offscreen canvas: ink accumulates here permanently ── */
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

  /* ── palette: #FFC5FC → #89CAFF ── */
  function col(t, a) {
    t = Math.max(0, Math.min(1, t));
    return `rgba(${~~(255+(137-255)*t)},${~~(197+(202-197)*t)},${~~(252+(255-252)*t)},${a})`;
  }

  function getO() {
    const el = document.getElementById('oRing');
    if (!el) return null;
    const rc = el.getBoundingClientRect();
    return { cx: rc.left + rc.width * .5, cy: rc.top + rc.height * .5, r: rc.width * .5 };
  }

  const blobs = [];
  let hue  = 0;
  let fill = 0;  // 0 → 1: how much the screen is filled (very slow)

  /* coin inner overlay — always visible, just update color on rub */
  const coinFill = document.getElementById('coin-liquid-fill');
  let coinHue = 0;

  function spawn(x, y, vel) {
    hue  = (hue + 0.07) % 1;
    /* fill grows much slower — need sustained rubbing to fill screen */
    fill = Math.min(1, fill + 0.0018);

    /* organic jitter */
    const jx = x + (Math.random() - .5) * 20;
    const jy = y + (Math.random() - .5) * 20;
    const r  = 60 + vel * 1.8;

    blobs.push({ x: jx, y: jy, r: r * .22, maxR: r, hue });

    /* immediate small splash committed to acc */
    const g = accCtx.createRadialGradient(jx, jy, 0, jx, jy, r * .45);
    g.addColorStop(0, col(hue, .55));
    g.addColorStop(1, col((hue + .2) % 1, 0));
    accCtx.fillStyle = g;
    accCtx.beginPath();
    accCtx.arc(jx, jy, r * .45, 0, Math.PI * 2);
    accCtx.fill();

    /* shift coin inner colour toward current hue */
    coinHue = (coinHue + 0.05) % 1;
  }

  /* ── mouse: only trigger inside / near the O ring ── */
  let lx = -9999, ly = -9999;

  window.addEventListener('mousemove', e => {
    const o = getO();
    if (!o) return;
    if (Math.hypot(e.clientX - o.cx, e.clientY - o.cy) > o.r * 1.35) return;

    const moved = Math.hypot(e.clientX - lx, e.clientY - ly);
    if (moved < 10) return;

    spawn(e.clientX, e.clientY, Math.min(moved, 60));
    lx = e.clientX;
    ly = e.clientY;
  });

  /* ── render loop ── */
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Layer 1 — radial bg fill, only appears after significant rubbing (fill > 0.25) */
    if (fill > 0.25) {
      const o  = getO();
      const cx = o ? o.cx : canvas.width  * .5;
      const cy = o ? o.cy : canvas.height * .5;
      const maxD = Math.hypot(
        Math.max(cx, canvas.width  - cx),
        Math.max(cy, canvas.height - cy)
      );
      /* normalize so alpha starts from 0 at fill=0.25 and reaches max at fill=1 */
      const t = (fill - 0.25) / 0.75;

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxD);
      g.addColorStop(0,   col(hue,              t * .82));
      g.addColorStop(.45, col((hue + .35) % 1,  t * .65));
      g.addColorStop(1,   col((hue + .65) % 1,  t * .50));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    /* Layer 2 — persistent accumulated ink */
    ctx.drawImage(acc, 0, 0);

    /* Layer 3 — actively growing blobs */
    for (let i = blobs.length - 1; i >= 0; i--) {
      const b = blobs[i];
      b.r = Math.min(b.r + 3.2, b.maxR);

      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0,   col(b.hue,              .78));
      g.addColorStop(.42, col((b.hue + .15) % 1,  .40));
      g.addColorStop(1,   col((b.hue + .30) % 1,  0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();

      /* fully grown → commit to acc, remove from active pool */
      if (b.r >= b.maxR) {
        const g2 = accCtx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.maxR);
        g2.addColorStop(0,   col(b.hue,              .55));
        g2.addColorStop(.5,  col((b.hue + .15) % 1,  .28));
        g2.addColorStop(1,   col((b.hue + .30) % 1,  0));
        accCtx.fillStyle = g2;
        accCtx.beginPath();
        accCtx.arc(b.x, b.y, b.maxR, 0, Math.PI * 2);
        accCtx.fill();
        blobs.splice(i, 1);
      }
    }

    /* shift coin inner gradient colour as user rubs */
    if (coinFill) {
      coinFill.style.background =
        `linear-gradient(135deg, ${col(coinHue, 1)} 0%, ${col((coinHue + .5) % 1, 1)} 100%)`;
    }

    requestAnimationFrame(draw);
  }

  draw();
})();

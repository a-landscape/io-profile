(() => {
  const canvas = document.getElementById('liquid-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── offscreen: ink accumulates here permanently ── */
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
    return { cx: rc.left + rc.width*.5, cy: rc.top + rc.height*.5, r: rc.width*.5 };
  }

  const quickBlobs  = [];   // immediate cursor feedback
  const spreadBlobs = [];   // slow-growing large blobs, max 4 at a time
  const MAX_SPREAD  = 4;

  let hue     = 0;
  let coinHue = 0;
  const coinFill = document.getElementById('coin-liquid-fill');

  /* ── spawn: called when cursor moves near O ── */
  function spawn(x, y, vel) {
    hue     = (hue     + 0.07) % 1;
    coinHue = (coinHue + 0.05) % 1;

    const jx = x + (Math.random()-.5)*22;
    const jy = y + (Math.random()-.5)*22;
    const r  = 65 + vel * 1.8;

    /* quick blob */
    quickBlobs.push({ x:jx, y:jy, r:r*.22, maxR:r, hue });

    /* tiny immediate splash to acc */
    const g = accCtx.createRadialGradient(jx, jy, 0, jx, jy, r*.4);
    g.addColorStop(0, col(hue, .50));
    g.addColorStop(1, col((hue+.2)%1, 0));
    accCtx.fillStyle = g;
    accCtx.beginPath();
    accCtx.arc(jx, jy, r*.4, 0, Math.PI*2);
    accCtx.fill();

    /* spread blob — grows from O centre to screen edge */
    if (spreadBlobs.length < MAX_SPREAD) {
      const o    = getO();
      const sx   = o ? o.cx : x;
      const sy   = o ? o.cy : y;
      const maxD = Math.hypot(
        Math.max(sx, canvas.width  - sx),
        Math.max(sy, canvas.height - sy)
      ) * 1.05;
      spreadBlobs.push({
        x:    sx,
        y:    sy,
        r:    o ? o.r * .4 : 30,   // start near O size
        maxR: maxD,
        speed: 0.9 + Math.random() * 0.5,
        hue:   (hue + Math.random()*.35) % 1,
        alpha: 0.005,               // very low per-frame alpha, accumulates
      });
    }
  }

  /* ── mouse tracking ── */
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

  /* ── render ── */
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* spread blobs: paint full radial area to acc each frame, very low alpha */
    for (let i = spreadBlobs.length-1; i >= 0; i--) {
      const b = spreadBlobs[i];
      b.r = Math.min(b.r + b.speed, b.maxR);

      const g = accCtx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0,    col(b.hue,          b.alpha));
      g.addColorStop(0.55, col((b.hue+.3)%1,   b.alpha * .65));
      g.addColorStop(1,    col((b.hue+.6)%1,   0));
      accCtx.fillStyle = g;
      accCtx.beginPath();
      accCtx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      accCtx.fill();

      if (b.r >= b.maxR) spreadBlobs.splice(i, 1);
    }

    /* draw accumulated ink as base layer */
    ctx.drawImage(acc, 0, 0);

    /* quick blobs on top — immediate stroke feedback */
    for (let i = quickBlobs.length-1; i >= 0; i--) {
      const b = quickBlobs[i];
      b.r = Math.min(b.r + 3.2, b.maxR);

      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0,    col(b.hue,          .80));
      g.addColorStop(.42,  col((b.hue+.15)%1,  .42));
      g.addColorStop(1,    col((b.hue+.30)%1,  0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.fill();

      if (b.r >= b.maxR) {
        const g2 = accCtx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.maxR);
        g2.addColorStop(0,   col(b.hue,          .55));
        g2.addColorStop(.5,  col((b.hue+.15)%1,  .28));
        g2.addColorStop(1,   col((b.hue+.30)%1,  0));
        accCtx.fillStyle = g2;
        accCtx.beginPath();
        accCtx.arc(b.x, b.y, b.maxR, 0, Math.PI*2);
        accCtx.fill();
        quickBlobs.splice(i, 1);
      }
    }

    /* shift coin inner gradient colour */
    if (coinFill) {
      coinFill.style.background =
        `linear-gradient(135deg, ${col(coinHue,1)} 0%, ${col((coinHue+.5)%1,1)} 100%)`;
    }

    requestAnimationFrame(draw);
  }

  draw();
})();

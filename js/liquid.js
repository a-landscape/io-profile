(() => {
  const canvas = document.getElementById('liquid-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── offscreen: committed ink stays here ── */
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

  function getO() {
    const el = document.getElementById('oRing');
    if (!el) return null;
    const rc = el.getBoundingClientRect();
    return { cx: rc.left + rc.width*.5, cy: rc.top + rc.height*.5, r: rc.width*.5 };
  }

  /* ── blob pool ── */
  const blobs    = [];  // growing blobs (cursor-driven)
  const MAX_GROW = 5;   // max concurrent spreading blobs

  let hue     = 0;
  let coinHue = 0;
  const coinFill = document.getElementById('coin-liquid-fill');

  function spawn(x, y, vel) {
    hue     = (hue     + 0.06) % 1;
    coinHue = (coinHue + 0.05) % 1;

    /* immediate small splash at cursor → acc */
    const sr = 45 + vel * 0.8;
    const sg = accCtx.createRadialGradient(x, y, 0, x, y, sr);
    sg.addColorStop(0, `rgba(255,228,254,0.62)`);
    sg.addColorStop(1, `rgba(218,238,255,0)`);
    accCtx.fillStyle = sg;
    accCtx.beginPath();
    accCtx.arc(x, y, sr, 0, Math.PI * 2);
    accCtx.fill();

    /* large spreading blob from cursor position */
    if (blobs.length < MAX_GROW) {
      const diag = Math.hypot(canvas.width, canvas.height);
      blobs.push({
        x, y,
        r:     sr * 0.9,
        maxR:  diag * (0.60 + Math.random() * 0.18),  // 60–78% of diagonal
        speed: 2.2 + Math.random() * 1.0,
        hue,
      });
    }
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

    /* Layer 1: accumulated committed ink */
    ctx.drawImage(acc, 0, 0);

    /* Layer 2: growing blobs (cursor-driven, spread from rub point) */
    for (let i = blobs.length - 1; i >= 0; i--) {
      const b = blobs[i];
      b.r = Math.min(b.r + b.speed, b.maxR);

      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0,    `rgba(255,228,254,0.78)`);
      g.addColorStop(0.38, `rgba(242,234,255,0.55)`);
      g.addColorStop(0.72, `rgba(228,238,255,0.32)`);
      g.addColorStop(1,    `rgba(218,238,255,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();

      /* once fully grown: commit to acc at softer alpha, remove */
      if (b.r >= b.maxR) {
        const g2 = accCtx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.maxR);
        g2.addColorStop(0,    `rgba(255,228,254,0.58)`);
        g2.addColorStop(0.45, `rgba(240,234,255,0.38)`);
        g2.addColorStop(0.80, `rgba(222,238,255,0.20)`);
        g2.addColorStop(1,    `rgba(218,238,255,0)`);
        accCtx.fillStyle = g2;
        accCtx.beginPath();
        accCtx.arc(b.x, b.y, b.maxR, 0, Math.PI * 2);
        accCtx.fill();
        blobs.splice(i, 1);
      }
    }

    /* coin inner colour shift */
    if (coinFill) {
      const t = coinHue;
      const r = ~~(255 + (137-255)*t), g = ~~(197 + (202-197)*t), bv = ~~(252 + (255-252)*t);
      coinFill.style.background =
        `linear-gradient(135deg,rgba(${r},${g},${bv},1) 0%,rgba(${~~(255+(137-255)*((t+.5)%1))},${~~(197+(202-197)*((t+.5)%1))},${~~(252+(255-252)*((t+.5)%1))},1) 100%)`;
    }

    requestAnimationFrame(draw);
  }

  draw();
})();

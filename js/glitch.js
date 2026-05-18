(() => {
  const canvas = document.getElementById('glitch-bg');
  const ctx    = canvas.getContext('2d');

  // bg.png を読み込む
  const img = new Image();
  img.src   = 'material/bg.png';

  /* ============================================
     Canvas リサイズ
  ============================================ */
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ============================================
     カバーフィット寸法を計算
  ============================================ */
  function getCover(dx = 0, dy = 0) {
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth  * scale;
    const h = img.naturalHeight * scale;
    const x = (canvas.width  - w) / 2 + dx;
    const y = (canvas.height - h) / 2 + dy;
    return { x, y, w, h };
  }

  /* ============================================
     通常描画（opacity 指定）
  ============================================ */
  function drawNormal(alpha, dx = 0) {
    const { x, y, w, h } = getCover(dx);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.drawImage(img, x, y, w, h);
    ctx.globalAlpha = 1;
  }

  /* ============================================
     水平スライスずれ描画（グリッジ）
  ============================================ */
  let slices = [];

  function generateSlices() {
    slices = [];
    let py = 0;
    while (py < canvas.height) {
      const sh = 6 + Math.random() * 70;
      // 60% の確率でずれを発生させる
      const sx = Math.random() < 0.6
        ? (Math.random() - 0.5) * 90
        : 0;
      slices.push({ y: py, h: sh, x: sx });
      py += sh;
    }
  }

  function drawSliced(alpha) {
    const { x: bx, y: by, w, h } = getCover();

    for (const sl of slices) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, sl.y, canvas.width, sl.h);
      ctx.clip();

      // ずれた画像
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.drawImage(img, bx + sl.x, by, w, h);

      // ずれが大きいスライスにだけクロマティックっぽい色ノイズを乗せる
      if (Math.abs(sl.x) > 20) {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = sl.x > 0 ? '#FF3399' : '#00BFFF';
        ctx.fillRect(0, sl.y, canvas.width, sl.h);
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // フレームごとにランダムで再生成（ジッター感）
    if (Math.random() < 0.55) generateSlices();
  }

  /* ============================================
     状態機械
     IDLE → DISPLACE (左右ずれ) or BLINK (点滅)
  ============================================ */
  const STATE = { IDLE: 0, DISPLACE: 1, BLINK: 2 };
  let state         = STATE.IDLE;
  let stateTimer    = 0;
  let stateDuration = 1500 + Math.random() * 3000;

  // IDLE 時のゆらぎ opacity
  let idleOpacity = 0.92;
  let idleTarget  = 0.92;
  let idleTick    = 0;

  // BLINK 時の周期
  let blinkPhase = 0;

  /* ============================================
     スパークル（十字キラキラ）
  ============================================ */
  const sparkles   = [];
  const MAX_SPARKS = 16;
  const SPARK_COLS = [
    [255, 51,  153],  // neon pink
    [255, 51,  153],  // neon pink
    [0,   191, 255],  // electric blue
    [0,   191, 255],  // electric blue
    [255, 215, 0  ],  // gold
    [255, 215, 0  ],  // gold
    [255, 255, 255],  // white
  ];

  function spawnSparkle(now) {
    const c = SPARK_COLS[Math.floor(Math.random() * SPARK_COLS.length)];
    sparkles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 2 + Math.random() * 5,
      c,
      born: now,
      life: 600 + Math.random() * 1000,
    });
  }

  function drawSparkles(now) {
    if (sparkles.length < MAX_SPARKS && Math.random() < 0.12) spawnSparkle(now);

    for (let i = sparkles.length - 1; i >= 0; i--) {
      const sp = sparkles[i];
      const t  = (now - sp.born) / sp.life;
      if (t >= 1) { sparkles.splice(i, 1); continue; }

      let a = t < 0.2  ? t / 0.2
            : t < 0.65 ? 1
            : (1 - t) / 0.35;

      const r = sp.r * Math.min(1, t / 0.15);
      ctx.globalAlpha = a * 0.88;
      ctx.fillStyle   = `rgb(${sp.c[0]},${sp.c[1]},${sp.c[2]})`;
      ctx.fillRect(sp.x - r * 0.22, sp.y - r,        r * 0.44, r * 2  );
      ctx.fillRect(sp.x - r,        sp.y - r * 0.22,  r * 2,    r * 0.44);
      ctx.globalAlpha = 1;
    }
  }

  /* ============================================
     メインループ
  ============================================ */
  let lastTime = 0;

  function loop(now) {
    if (!lastTime) lastTime = now;
    const dt = Math.min(now - lastTime, 80);
    lastTime = now;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stateTimer += dt;

    if (state === STATE.IDLE) {
      // ゆったりした opacity ゆらぎ
      idleTick += dt;
      if (idleTick > 100 + Math.random() * 200) {
        idleTarget = 0.80 + Math.random() * 0.18;
        idleTick   = 0;
      }
      idleOpacity += (idleTarget - idleOpacity) * 0.07;
      drawNormal(idleOpacity);

      if (stateTimer >= stateDuration) {
        state         = STATE.BLINK;
        stateTimer    = 0;
        stateDuration = 100 + Math.random() * 280;
        blinkPhase    = 0;
      }

    } else if (state === STATE.BLINK) {
      // 点滅：sin波で素早く明暗
      blinkPhase += dt * 0.025;
      const bAlpha = 0.35 + (Math.sin(blinkPhase) * 0.5 + 0.5) * 0.6;
      drawNormal(bAlpha);

      if (stateTimer >= stateDuration) {
        state         = STATE.IDLE;
        stateTimer    = 0;
        stateDuration = 1500 + Math.random() * 3500;
        idleOpacity   = 0.92;
        idleTarget    = 0.92;
      }
    }

    drawSparkles(now);
    requestAnimationFrame(loop);
  }

  // 画像読み込み後にループ開始
  img.onload  = () => requestAnimationFrame(loop);
  img.onerror = () => console.warn('[glitch] bg.png が見つかりません');

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) lastTime = 0;
  });

  /* ============================================
     アイコングリッジ（ランダム発火）
  ============================================ */
  const avatar    = document.querySelector('.avatar');
  let avatarNext  = 4000 + Math.random() * 8000;
  let avatarLast  = performance.now();

  function tickAvatar(now) {
    avatarNext -= now - avatarLast;
    avatarLast  = now;
    if (avatarNext <= 0 && avatar) {
      avatar.classList.add('glitching');
      setTimeout(() => avatar.classList.remove('glitching'), 290);
      avatarNext = 5000 + Math.random() * 10000;
    }
    requestAnimationFrame(tickAvatar);
  }
  requestAnimationFrame(tickAvatar);

})();

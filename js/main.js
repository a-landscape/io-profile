'use strict';

/* ============================================================
   VISUALIZER — monotone diagonal gradient equalizer
   Color: light gray ↔ slightly darker gray
   Movement: bright wave sweeps from top-right → bottom-left
============================================================ */
(function initVisualizer() {
  const canvas = document.getElementById('visualizerCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let bars = [];

  function buildBars(count) {
    bars = Array.from({ length: count }, (_, i) => {
      const x = i / count;
      return {
        /* natural spectrum envelope: loud in low-mids, quiet at extremes */
        envelope: Math.pow(Math.sin(x * Math.PI), 0.55) * 0.78 + 0.22,
        f1: 0.35 + Math.random() * 1.3,
        f2: 0.12 + Math.random() * 0.65,
        f3: 0.70 + Math.random() * 1.8,
        p1: Math.random() * Math.PI * 2,
        p2: Math.random() * Math.PI * 2,
        p3: Math.random() * Math.PI * 2,
        sp: Math.random() * Math.PI * 2,   /* shimmer phase */
      };
    });
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w   = canvas.offsetWidth;
    const h   = canvas.offsetHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildBars(Math.max(30, Math.floor(w / 10)));
  }

  window.addEventListener('resize', resize);
  resize();

  let t = 0;

  function draw() {
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);

    const count = bars.length;
    const barW  = W / count;
    const gap   = Math.max(1, barW * 0.14);
    const maxH  = H * 0.32;

    /* global breathing swell */
    const swell = 0.11 * Math.sin(t * 0.48) + 0.89;

    /* gradient sweep right → left, nearly white */
    const GRAD_SPEED = 0.008;
    const gradPhase  = (t * GRAD_SPEED) % 1;
    const barGrad = ctx.createLinearGradient(W * (1 - gradPhase), 0, -W * gradPhase, 0);
    barGrad.addColorStop(0, 'rgba(155,155,155,0.10)');
    barGrad.addColorStop(1, 'rgba(135,135,135,0.10)');

    bars.forEach((bar, i) => {

      /* ── bar height from three oscillators ── */
      const raw =
        0.40 * Math.sin(t * bar.f1 + bar.p1) +
        0.28 * Math.sin(t * bar.f2 + bar.p2) +
        0.16 * Math.sin(t * bar.f3 + bar.p3);
      const norm = (raw + 0.84) / 1.68;
      const barH = Math.max(2, norm * bar.envelope * swell * maxH);

      const bx   = i * barW + gap * 0.5;
      const bw   = barW - gap;
      const bbot = barH;

      /* ── draw bar top → down, no rounding ── */
      ctx.fillStyle = barGrad;
      ctx.fillRect(bx, 0, bw, bbot);

      /* ── sparkle at the bottom tip of tall bars ── */
      const heightRatio = barH / maxH;
      if (heightRatio > 0.72 && barH > 5) {
        const alpha  = (heightRatio - 0.72) * 3.5 * 0.45;
        const sparkH = Math.min(3, barH * 0.06);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(bx, bbot - sparkH, bw, sparkH);
      }
    });

    t += 0.018;
    requestAnimationFrame(draw);
  }

  draw();
})();

/* ============================================================
   TRACK DATA
============================================================ */
const TRACKS = [
  { id: '01', title: 'MONTAGEM RITMADA',    genre: 'BRAZILIAN PHONK', src: 'material/MONTAGEM_RITMADA.mp3', jacket: 'MONTAGEM_RITMADA.jpg' },
  { id: '02', title: 'NO BATIDÃO',         genre: 'BRAZILIAN PHONK', src: 'material/NO_BATID.mp3',        jacket: 'NO_BAT.jpg'          },
  { id: '03', title: 'PASSO BEM',          genre: 'BRAZILIAN PHONK', src: 'material/PASSO_BEM.m4a',       jacket: 'PASSO_BEM.jpg'       },
  { id: '04', title: 'VAI VAI TRAIR',      genre: 'BRAZILIAN PHONK', src: 'material/VAI_VAI_TRAIR.mp3',   jacket: 'vai.jpg'             },
  { id: '05', title: 'NOMI XD BLAH!',      genre: 'BRAZILIAN PHONK', src: 'material/Nomi_XD_BLAH!.mp3',  jacket: 'Nomi_XD.jpg'         },
  { id: '06', title: 'AL NACER!',          genre: 'BRAZILIAN PHONK', src: 'material/AL_NACER!.mp3',       jacket: 'AL_NACER!.jpg'       },
  { id: '07', title: 'MONTAGEM BAILÃO',    genre: 'BRAZILIAN PHONK', src: 'material/MONTAGEM_BAILÃO.mp3', jacket: 'MONTAGEM_BAILÃO.jpg' },
  { id: '08', title: 'LUZ ROJA',           genre: 'BRAZILIAN PHONK', src: 'material/LUZ_ROJA.mp3',        jacket: 'LUZ_ROJA.jpg'        },
  { id: '09', title: 'MONTAGEM TOMADA',    genre: 'BRAZILIAN PHONK', src: 'material/MONTAGEM_TO.m4a',     jacket: 'MONTAGEM_TO.jpg'     },
  { id: '10', title: 'LUNA BALA',          genre: 'BRAZILIAN PHONK', src: 'material/LUNA_BALA.mp3',       jacket: 'LUNA-BALA.jpg'       },
  { id: '11', title: 'MONTAGEM XONADA',    genre: 'BRAZILIAN PHONK', src: 'material/MONTAGEM_XONADA.mp3', jacket: 'MONTAGEM_XONADA.jpg' },
  { id: '12', title: 'PXLWYSE',            genre: 'BRAZILIAN PHONK', src: 'material/PXLWYSE.m4a',         jacket: 'PXLWYSE.jpg'         },
  { id: '13', title: 'MONTAGEM RUGADA',   genre: 'BRAZILIAN PHONK', src: 'material/MONTAGEM_RUGADA.mp3', jacket: 'MONTAGEM_RUGADA.jpg' },
  { id: '14', title: 'MUTILATOR',         genre: 'BRAZILIAN PHONK', src: 'material/mutilator.mp3',       jacket: 'mutilator.jpg'       },
];

const ICON_PLAY  = `<svg viewBox="0 0 24 24"><polygon points="6,3 20,12 6,21"/></svg>`;
const ICON_PAUSE = `<svg viewBox="0 0 24 24"><rect x="5" y="4" width="4" height="16"/><rect x="15" y="4" width="4" height="16"/></svg>`;

function fmt(sec) {
  if (!isFinite(sec)) return '0:00';
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
}

/* ============================================================
   AUDIO — lazy blob-URL (hides original file path)
============================================================ */
const audioPool = new Map();

function getAudio(idx) {
  if (audioPool.has(idx)) return audioPool.get(idx);
  const audio = new Audio(TRACKS[idx].src);
  audioPool.set(idx, audio);
  return audio;
}

/* ============================================================
   BUILD CARDS
============================================================ */
const grid = document.getElementById('tracksGrid');

TRACKS.forEach((track, idx) => {
  const card = document.createElement('article');
  card.className = 'track-card';
  card.innerHTML = `
    <img src="material/${track.jacket}" alt="jacket" class="track-jacket" draggable="false" oncontextmenu="return false" />
    <div class="track-number">Favorite ${track.id}</div>
    <div class="track-genre">${track.genre}</div>
    <div class="track-title">${track.title}</div>
    <div class="track-player">
      <div class="player-controls">
        <span class="play-indicator">${ICON_PLAY}</span>
        <span class="time-display"><span class="cur">0:00</span> / <span class="dur">—</span></span>
      </div>
      <div class="progress-bar-wrap"><div class="progress-bar-fill"></div></div>
    </div>`;

  grid.appendChild(card);

  card.addEventListener('contextmenu', e => e.preventDefault());

  card.querySelector('.progress-bar-wrap').addEventListener('click', e => {
    e.stopPropagation();
    const audio = getAudio(idx);
    if (!audio.duration) return;
    const bar = e.currentTarget;
    audio.currentTime = ((e.clientX - bar.getBoundingClientRect().left) / bar.offsetWidth) * audio.duration;
  });

  card.addEventListener('click', () => toggleCard(idx));
});

/* ============================================================
   PLAYBACK
============================================================ */
let activeIdx  = -1;
let playAllMode = false;

const playAllBtn   = document.getElementById('playAllBtn');
const playAllLabel = playAllBtn.querySelector('.play-all-label');

playAllBtn.addEventListener('click', () => {
  if (playAllMode) {
    stopPlayAll();
  } else {
    startPlayAll();
  }
});

function startPlayAll() {
  playAllMode = true;
  playAllBtn.innerHTML = `<span class="play-all-label">Stop</span>`;
  playAllBtn.classList.add('active');
  playFromIdx(0);
}

function stopPlayAll() {
  playAllMode = false;
  playAllBtn.innerHTML = `<span class="play-all-label">Play All</span>`;
  playAllBtn.classList.remove('active');
  if (activeIdx !== -1) {
    const prev = audioPool.get(activeIdx);
    if (prev && !prev.paused) { prev.pause(); resetCard(activeIdx); }
  }
}

function playFromIdx(idx) {
  if (!playAllMode) return;

  // stop current
  if (activeIdx !== -1 && activeIdx !== idx) {
    const prev = audioPool.get(activeIdx);
    if (prev && !prev.paused) { prev.pause(); resetCard(activeIdx); }
  }

  const card  = grid.children[idx];
  const audio = getAudio(idx);

  if (!audio._bound) {
    audio._bound = true;
    audio.addEventListener('loadedmetadata', () => {
      card.querySelector('.dur').textContent = fmt(audio.duration);
    });
    audio.addEventListener('timeupdate', () => {
      card.querySelector('.cur').textContent = fmt(audio.currentTime);
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      card.querySelector('.progress-bar-fill').style.width = pct + '%';
    });
  }

  // override ended to advance to next track
  audio._onEndedPlayAll = () => {
    resetCard(idx);
    const next = (idx + 1) % TRACKS.length;
    playFromIdx(next);
  };
  audio.removeEventListener('ended', audio._onEndedPlayAll);
  audio.addEventListener('ended', audio._onEndedPlayAll);

  audio.currentTime = 0;
  audio.play().then(() => {
    card.querySelector('.play-indicator').innerHTML = ICON_PAUSE;
    card.classList.add('playing');
    activeIdx = idx;
  }).catch(e => {
    console.error('Play failed:', TRACKS[idx].src, e);
    resetCard(idx);
  });
}

function toggleCard(idx) {
  const card  = grid.children[idx];
  const audio = getAudio(idx);

  if (!audio._bound) {
    audio._bound = true;
    audio.addEventListener('loadedmetadata', () => {
      card.querySelector('.dur').textContent = fmt(audio.duration);
    });
    audio.addEventListener('timeupdate', () => {
      card.querySelector('.cur').textContent = fmt(audio.currentTime);
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      card.querySelector('.progress-bar-fill').style.width = pct + '%';
    });
    audio.addEventListener('ended', () => {
      if (!playAllMode) resetCard(idx);
    });
  }

  if (activeIdx !== -1 && activeIdx !== idx) {
    const prev = audioPool.get(activeIdx);
    if (prev && !prev.paused) { prev.pause(); resetCard(activeIdx); }
  }

  // カードをクリックしたらPlay Allモード解除
  if (playAllMode) stopPlayAll();

  if (!audio.paused) {
    audio.pause(); resetCard(idx);
  } else {
    audio.play().then(() => {
      card.querySelector('.play-indicator').innerHTML = ICON_PAUSE;
      card.classList.add('playing');
      activeIdx = idx;
    }).catch(e => {
      console.error('Play failed:', TRACKS[idx].src, e);
      resetCard(idx);
    });
  }
}

function resetCard(idx) {
  const card = grid.children[idx];
  card.querySelector('.play-indicator').innerHTML = ICON_PLAY;
  card.classList.remove('playing');
  if (activeIdx === idx) activeIdx = -1;
}


// Procedural "Liquid Glass" style wallpapers, rendered once to a JPEG data URL.
// Painted small then upscaled, which gives a free, perfectly smooth blur.

const THEMES = {
  nightsky: {
    base: ['#050818', '#0d0b2b', '#1a0b33'],
    blobs: [
      [0.22, 0.3, 0.55, '#2a52ff', 0.85],
      [0.78, 0.62, 0.5, '#7b2cff', 0.8],
      [0.55, 0.12, 0.32, '#22c8ff', 0.55],
      [0.9, 0.95, 0.35, '#ff3d9a', 0.45],
      [0.08, 0.9, 0.4, '#0b2a8a', 0.7],
    ],
    ribbons: [
      ['#58a6ff', '#b45cff', 0.55],
      ['#30e0ff', '#3a5bff', 0.35],
    ],
  },
  starwhite: {
    base: ['#e9eef8', '#f4efe9', '#efe6f4'],
    blobs: [
      [0.2, 0.25, 0.55, '#bcd3ff', 0.9],
      [0.8, 0.6, 0.5, '#ffd9c2', 0.85],
      [0.5, 0.95, 0.45, '#e2c9ff', 0.8],
      [0.85, 0.1, 0.3, '#c9f0ff', 0.7],
    ],
    ribbons: [
      ['#ffffff', '#c8d8ff', 0.7],
      ['#ffe8d6', '#ffffff', 0.5],
    ],
  },
  sunset: {
    base: ['#1b0d24', '#3d0f2e', '#5a1a1a'],
    blobs: [
      [0.2, 0.3, 0.55, '#ff6a3d', 0.8],
      [0.8, 0.55, 0.5, '#ff2e7a', 0.75],
      [0.5, 0.95, 0.45, '#ffb13d', 0.6],
      [0.85, 0.1, 0.3, '#7a2cff', 0.6],
    ],
    ribbons: [
      ['#ffd27a', '#ff4f7a', 0.5],
      ['#ff8a3d', '#ffcf6b', 0.3],
    ],
  },
};

export function makeWallpaper(name = 'nightsky', size = 1600) {
  const t = THEMES[name] || THEMES.nightsky;
  const S = 160;
  const small = document.createElement('canvas');
  small.width = small.height = S;
  const c = small.getContext('2d');

  const g = c.createLinearGradient(0, 0, S * 0.3, S);
  t.base.forEach((col, i) => g.addColorStop(i / (t.base.length - 1), col));
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);

  c.globalCompositeOperation = name === 'starwhite' ? 'source-over' : 'screen';
  for (const [x, y, r, col, a] of t.blobs) {
    const rgd = c.createRadialGradient(x * S, y * S, 0, x * S, y * S, r * S);
    rgd.addColorStop(0, hexA(col, a));
    rgd.addColorStop(1, hexA(col, 0));
    c.fillStyle = rgd;
    c.fillRect(0, 0, S, S);
  }

  // Two flowing ribbons — the "folded glass" sweep.
  t.ribbons.forEach(([c1, c2, a], i) => {
    const lgd = c.createLinearGradient(0, S * 0.2, S, S * 0.8);
    lgd.addColorStop(0, hexA(c1, 0));
    lgd.addColorStop(0.45, hexA(c1, a));
    lgd.addColorStop(0.7, hexA(c2, a));
    lgd.addColorStop(1, hexA(c2, 0));
    c.strokeStyle = lgd;
    c.lineWidth = S * (0.14 - i * 0.05);
    c.lineCap = 'round';
    c.beginPath();
    const o = i * 0.22;
    c.moveTo(-S * 0.1, S * (0.75 - o));
    c.bezierCurveTo(S * 0.3, S * (0.2 - o), S * 0.6, S * (1.05 - o), S * 1.1, S * (0.35 - o * 0.5));
    c.stroke();
  });

  boxBlur(c, S, 3, 3);

  const big = document.createElement('canvas');
  big.width = big.height = size;
  const bc = big.getContext('2d');
  bc.imageSmoothingEnabled = true;
  bc.imageSmoothingQuality = 'high';
  // Two-pass upscale for extra smoothness.
  const mid = document.createElement('canvas');
  mid.width = mid.height = S * 4;
  const mc = mid.getContext('2d');
  mc.imageSmoothingQuality = 'high';
  mc.drawImage(small, 0, 0, S * 4, S * 4);
  bc.drawImage(mid, 0, 0, size, size);

  // Fine grain to kill banding on OLED-like gradients.
  const img = bc.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 6;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  bc.putImageData(img, 0, 0);
  return big.toDataURL('image/jpeg', 0.9);
}

// Pseudo "photos" for the Photos app / widget when the user hasn't imported real ones.
export function makePhoto(seed, w = 600, h = 800) {
  const r = mulberry(seed);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d');
  const palettes = [
    ['#0f2a5c', '#3e7bd6', '#f6c27a', '#f08a4b'],
    ['#1b3b2f', '#4f8a5b', '#cfe3a8', '#f2f0d8'],
    ['#2a1340', '#8a3ca8', '#f27aa6', '#ffd1a8'],
    ['#06283d', '#1363df', '#47b5ff', '#dff6ff'],
    ['#3d2c1e', '#a0522d', '#e8b07a', '#fff1d6'],
    ['#101820', '#2c3e50', '#7f8c8d', '#ecf0f1'],
  ];
  const p = palettes[Math.floor(r() * palettes.length)];
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, p[0]);
  sky.addColorStop(0.55, p[1]);
  sky.addColorStop(0.8, p[2]);
  sky.addColorStop(1, p[3]);
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);
  // sun / moon
  const sx = w * (0.2 + r() * 0.6);
  const sy = h * (0.25 + r() * 0.25);
  const sun = c.createRadialGradient(sx, sy, 0, sx, sy, w * 0.25);
  sun.addColorStop(0, 'rgba(255,240,210,.95)');
  sun.addColorStop(0.15, 'rgba(255,220,170,.6)');
  sun.addColorStop(1, 'rgba(255,200,150,0)');
  c.fillStyle = sun;
  c.fillRect(0, 0, w, h);
  // layered hills
  for (let L = 0; L < 3; L++) {
    c.fillStyle = `rgba(${10 + L * 12},${14 + L * 10},${24 + L * 8},${0.55 + L * 0.18})`;
    c.beginPath();
    const base = h * (0.6 + L * 0.12);
    c.moveTo(0, h);
    c.lineTo(0, base);
    const n = 5;
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * w;
      const y = base - r() * h * 0.12;
      c.quadraticCurveTo(x - w / n / 2, y - r() * h * 0.06, x, y);
    }
    c.lineTo(w, h);
    c.fill();
  }
  return cv.toDataURL('image/jpeg', 0.85);
}

function mulberry(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Separable box blur, a few passes ≈ gaussian. Works everywhere (no ctx.filter needed).
function boxBlur(ctx, S, r, passes) {
  const img = ctx.getImageData(0, 0, S, S);
  const d = img.data;
  const tmp = new Float32Array(d.length);
  for (let p = 0; p < passes; p++) {
    for (const horiz of [true, false]) {
      for (let a = 0; a < S; a++) {
        for (let ch = 0; ch < 4; ch++) {
          let acc = 0;
          const at = (b) => {
            b = Math.max(0, Math.min(S - 1, b));
            return d[(horiz ? a * S + b : b * S + a) * 4 + ch];
          };
          for (let b = -r; b <= r; b++) acc += at(b);
          for (let b = 0; b < S; b++) {
            tmp[(horiz ? a * S + b : b * S + a) * 4 + ch] = acc / (2 * r + 1);
            acc += at(b + r + 1) - at(b - r);
          }
        }
      }
      for (let i = 0; i < d.length; i++) d[i] = tmp[i];
    }
  }
  ctx.putImageData(img, 0, 0);
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Small DOM / animation / storage helpers shared by every module.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// h('div.card.big', {onclick, style:{...}}, child, 'text', [more])
export function h(spec, attrs, ...children) {
  if (attrs == null || typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs)) {
    if (attrs != null) children.unshift(attrs);
    attrs = {};
  }
  const [tag, ...classes] = spec.split('.');
  const node = document.createElement(tag || 'div');
  if (classes.length) node.className = classes.join(' ');
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'class') node.className += (node.className ? ' ' : '') + v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  appendAll(node, children);
  return node;
}

function appendAll(node, children) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) appendAll(node, c);
    else node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const ease = {
  linear: (t) => t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  // critically-damped-ish spring with a hint of overshoot, like UIKit's default
  spring: (t) => 1 - Math.exp(-7.5 * t) * Math.cos(t * 4.2) * (1 - t * 0.15),
};

// rAF tween. Returns a cancel function.
export function tween({ from = 0, to = 1, duration = 400, easing = ease.inOut, onUpdate, onDone }) {
  const start = performance.now();
  let raf = 0;
  let cancelled = false;
  const step = (now) => {
    if (cancelled) return;
    const t = clamp((now - start) / duration, 0, 1);
    onUpdate(lerp(from, to, easing(t)), t);
    if (t < 1) raf = requestAnimationFrame(step);
    else onDone && onDone();
  };
  raf = requestAnimationFrame(step);
  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
  };
}

export const store = {
  get(key, def) {
    try {
      const v = localStorage.getItem('duo.' + key);
      return v == null ? def : JSON.parse(v);
    } catch {
      return def;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem('duo.' + key, JSON.stringify(val));
    } catch {}
  },
};

// Tiny IndexedDB wrapper for blobs (photos, custom wallpaper).
let dbp;
function db() {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      try {
        const r = indexedDB.open('duo', 1);
        r.onupgradeneeded = () => {
          r.result.createObjectStore('kv');
          r.result.createObjectStore('photos', { keyPath: 'id' });
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) {
        rej(e);
      }
    });
  }
  return dbp;
}
async function tx(storeName, mode, fn) {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction(storeName, mode);
    const req = fn(t.objectStore(storeName));
    t.oncomplete = () => res(req && req.result);
    t.onerror = () => rej(t.error);
  });
}
export const idb = {
  get: (k) => tx('kv', 'readonly', (s) => s.get(k)).catch(() => undefined),
  set: (k, v) => tx('kv', 'readwrite', (s) => s.put(v, k)).catch(() => {}),
  del: (k) => tx('kv', 'readwrite', (s) => s.delete(k)).catch(() => {}),
  addPhoto: (p) => tx('photos', 'readwrite', (s) => s.put(p)).catch(() => {}),
  delPhoto: (id) => tx('photos', 'readwrite', (s) => s.delete(id)).catch(() => {}),
  photos: () => tx('photos', 'readonly', (s) => s.getAll()).catch(() => []),
};

export function fmtTime(d = new Date(), h24 = false) {
  let hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (h24) return String(hh).padStart(2, '0') + ':' + mm;
  hh = hh % 12 || 12;
  return hh + ':' + mm;
}

export function fmtDate(d = new Date(), opts = { weekday: 'long', month: 'long', day: 'numeric' }) {
  for (const loc of [navigator.language, undefined, 'en-US']) {
    try {
      return new Intl.DateTimeFormat(loc, opts).format(d);
    } catch {}
  }
  return d.toDateString();
}

// Deterministic PRNG so fake data (weather, photos) is stable per day.
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

let uidN = 0;
export const uid = (p = 'u') => p + (++uidN).toString(36);

// Soft click like the iOS keyboard / toggles. Only plays after a user gesture unlocked audio.
let actx;
export function tick(vol = 0.15) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const len = Math.floor(actx.sampleRate * 0.012);
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
    const src = actx.createBufferSource();
    const g = actx.createGain();
    g.gain.value = vol;
    src.buffer = buf;
    src.connect(g).connect(actx.destination);
    src.start();
  } catch {}
}

export function tone(freqs, ms = 160, vol = 0.12) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const g = actx.createGain();
    g.gain.value = vol;
    g.connect(actx.destination);
    const t = actx.currentTime;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    for (const f of [].concat(freqs)) {
      const o = actx.createOscillator();
      o.frequency.value = f;
      o.connect(g);
      o.start(t);
      o.stop(t + ms / 1000);
    }
  } catch {}
}

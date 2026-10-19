import { h, idb, tone, tick } from '../util.js';
import { G } from '../icons.js';

export async function getStream(facing = 'environment') {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera');
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1440 } },
  });
}

export function stopStream(s) {
  s?.getTracks().forEach((t) => t.stop());
}

const FLASH = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 2 5 13.5h6L10 22l9-12h-6.2Z"/></svg>`;
const LIVE = `<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3.2" stroke-width="2"/><circle cx="12" cy="12" r="6.5" stroke-width="1.6"/><circle cx="12" cy="12" r="9.8" stroke-width="1.4" stroke-dasharray="1.5 2"/></g></svg>`;
const CHEV = `<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const FLIP = `<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 2.5v4.2h-4.2M6 21.5v-4.2h4.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const MODES = ['TIME-LAPSE', 'SLO-MO', 'CINEMATIC', 'VIDEO', 'PHOTO', 'PORTRAIT', 'PANO'];
const ZOOMS = [
  ['.5', 1],
  ['1×', 1.38],
  ['2', 2.76],
];

export default {
  theme: 'dark',
  hideStatus: true,
  mount(root, api) {
    const video = h('video', { playsinline: true, muted: true, autoplay: true });
    video.muted = true;
    const flashOverlay = h('div.cam-flash');
    const focus = h('div.cam-focus');
    const msg = h('div.cam-msg');
    const vf = h('div.cam-vf', video, h('div.cam-grid', { style: { display: 'none' } }), focus, msg, flashOverlay);
    let facing = 'environment';
    let stream = null;
    let zoom = 1;
    let mode = 4;
    let rec = null;
    let flashOn = false;

    const flashBtn = h('div.cam-ic', { html: FLASH });
    flashBtn.addEventListener('click', () => {
      flashOn = !flashOn;
      flashBtn.classList.toggle('on', flashOn);
    });
    const live = h('div.cam-ic.on', { html: LIVE });
    live.addEventListener('click', () => live.classList.toggle('on'));
    const recPill = h('div.cam-pill', { style: { display: 'none', background: '#ff3b30' } }, '00:00:00');
    const top = h('div.cam-topbar', h('div.cam-top', flashBtn, h('div.cam-ic', { html: CHEV }), recPill, live));

    const zoomEl = h(
      'div.cam-zoom',
      ZOOMS.map(([label], i) => {
        const z = h('span' + (i === 1 ? '.on' : ''), label);
        z.addEventListener('click', (e) => {
          e.stopPropagation();
          setZoom(i);
        });
        return z;
      })
    );
    const zoomWrap = h('div.cam-zoomwrap', zoomEl);

    const modesEl = h(
      'div.cam-modes',
      MODES.map((m, i) => {
        const s = h('span' + (i === mode ? '.on' : ''), m);
        s.addEventListener('click', (e) => {
          e.stopPropagation();
          setMode(i);
        });
        return s;
      })
    );
    const thumb = h('div.cam-thumb');
    thumb.addEventListener('click', () => api.open('photos'));
    const shutter = h('div.cam-shutter', h('i'));
    shutter.addEventListener('click', () => (mode === 3 ? toggleRec() : capture()));
    const flip = h('div.cam-flip', { html: FLIP });
    flip.addEventListener('click', async () => {
      facing = facing === 'environment' ? 'user' : 'environment';
      vf.animate([{ transform: 'rotateY(0)' }, { transform: 'rotateY(90deg)', filter: 'blur(10px)' }, { transform: 'rotateY(0)' }], { duration: 500 });
      await start();
    });
    const bottom = h('div.cam-bottom', modesEl, h('div.cam-row', thumb, shutter, flip));
    const cam = h('div.cam', vf, top, zoomWrap, bottom);
    root.append(cam);

    vf.addEventListener('click', (e) => {
      const r = vf.getBoundingClientRect();
      const k = r.width / vf.offsetWidth || 1;
      focus.style.left = (e.clientX - r.left) / k + 'px';
      focus.style.top = (e.clientY - r.top) / k + 'px';
      focus.classList.remove('on');
      void focus.offsetWidth;
      focus.classList.add('on');
    });

    function setZoom(i) {
      zoom = i;
      [...zoomEl.children].forEach((c, j) => c.classList.toggle('on', j === i));
      applyTransform();
      tick(0.12);
    }
    function applyTransform() {
      const s = ZOOMS[zoom][1];
      video.style.transform = `${facing === 'user' ? 'scaleX(-1) ' : ''}scale(${s})`;
    }
    function setMode(i) {
      mode = i;
      [...modesEl.children].forEach((c, j) => c.classList.toggle('on', j === i));
      shutter.classList.toggle('video', i === 3);
      layout();
    }

    function layout() {
      const land = root.clientWidth > root.clientHeight;
      cam.classList.toggle('l', land);
      cam.classList.toggle('p', !land);
      // Center the selected mode label under/next to the shutter like iOS.
      const sel = modesEl.children[mode];
      if (!sel) return;
      if (land) {
        modesEl.style.transform = `translateY(calc(-50% + ${-(sel.offsetTop + sel.offsetHeight / 2 - modesEl.offsetHeight / 2)}px))`;
      } else {
        const off = sel.offsetLeft + sel.offsetWidth / 2 - modesEl.offsetWidth / 2;
        modesEl.style.transform = `translateX(${-off}px)`;
      }
      zoomWrap.style.top = land ? '' : root.clientHeight - 236 + 'px';
    }

    async function start() {
      stopStream(stream);
      stream = null;
      msg.textContent = '';
      try {
        stream = await getStream(facing);
        if (!active) return stopStream(stream);
        video.srcObject = stream;
        await video.play().catch(() => {});
        applyTransform();
      } catch (e) {
        msg.textContent = '';
      }
    }

    function shutterSound() {
      tick(0.5);
      setTimeout(() => tick(0.35), 70);
    }

    async function capture() {
      shutterSound();
      flashOverlay.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], { duration: 260 });
      shutter.animate([{ transform: 'scale(1)' }, { transform: 'scale(.92)' }, { transform: 'scale(1)' }], { duration: 200 });
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const c = document.createElement('canvas');
      const land = cam.classList.contains('l');
      // Output 4:3 like the real camera (portrait on the outer display).
      const outW = land ? 1600 : 1200;
      const outH = land ? 1200 : 1600;
      c.width = outW;
      c.height = outH;
      const ctx = c.getContext('2d');
      if (vw && vh) {
        const s = ZOOMS[zoom][1];
        const scale = Math.max(outW / vw, outH / vh) * s;
        const dw = vw * scale;
        const dh = vh * scale;
        if (facing === 'user') {
          ctx.translate(outW, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, (outW - dw) / 2, (outH - dh) / 2, dw, dh);
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, outH);
        g.addColorStop(0, '#111');
        g.addColorStop(1, '#333');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, outW, outH);
      }
      const src = c.toDataURL('image/jpeg', 0.88);
      const p = { id: Date.now(), src };
      api.os.photos = [p, ...(api.os.photos || [])];
      thumb.style.backgroundImage = `url(${src})`;
      thumb.animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.2,1.3,.4,1)' });
      idb.addPhoto(p);
      api.os.windows.get('photos')?.inst?.refresh?.();
    }

    function toggleRec() {
      if (rec) {
        clearInterval(rec.t);
        rec = null;
        recPill.style.display = 'none';
        shutter.querySelector('i').style.cssText = '';
        tone(1046, 120, 0.08);
        return;
      }
      tone(880, 120, 0.08);
      const t0 = Date.now();
      rec = { t: setInterval(() => {
        const s = Math.floor((Date.now() - t0) / 1000);
        recPill.textContent = `00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      }, 250) };
      recPill.style.display = '';
      Object.assign(shutter.querySelector('i').style, { width: '30px', height: '30px', borderRadius: '7px' });
    }

    let active = false;
    const latest = api.os.photos?.[0];
    if (latest) thumb.style.backgroundImage = `url(${latest.src})`;
    requestAnimationFrame(layout);
    return {
      show() {
        active = true;
        requestAnimationFrame(layout);
        start();
      },
      hide() {
        active = false;
        stopStream(stream);
        stream = null;
        if (rec) toggleRec();
      },
      resize() {
        requestAnimationFrame(layout);
      },
      destroy() {
        active = false;
        stopStream(stream);
      },
    };
  },
};

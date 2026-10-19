// Boot: sizes the device to true iPhone Duo dimensions on the iPad, wires the fold,
// hidden prank controls, fullscreen and offline support.
import { h, $, clamp, store, idb, sleep } from './util.js';
import { OS } from './os.js';
import { Folder, GEO } from './fold.js';
import { makeWallpaper, makePhoto } from './wallpaper.js';

function guessCity() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const c = tz.split('/').pop().replace(/_/g, ' ');
    return c && c !== 'UTC' ? c : 'Cupertino';
  } catch {
    return 'Cupertino';
  }
}
function guess24h() {
  try {
    const hc = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hourCycle;
    return hc === 'h23' || hc === 'h24';
  } catch {
    return false;
  }
}
function guessCarrier() {
  const l = navigator.language || '';
  if (/GB/i.test(l)) return 'EE';
  if (/US/i.test(l)) return 'Verizon';
  if (/AU/i.test(l)) return 'Telstra';
  return 'Vodafone';
}

const DEFAULTS = {
  size: 'true',
  color: 'nightsky',
  wallpaper: 'duo',
  carrier: guessCarrier(),
  owner: 'Your Name',
  deviceName: 'iPhone',
  city: guessCity(),
  h24: guess24h(),
  aod: true,
  lockNotifs: true,
  autoFullscreen: true,
  callName: 'Mum',
  msgName: 'Alex',
  msgText: 'wait… is that the new iPhone Duo?? 😳',
};

class Main {
  constructor() {
    this.cfg = { ...DEFAULTS, ...store.get('cfg', {}) };
    this.stage = $('#stage');
    this.device = h('div');
    this.device.id = 'device';
    this.screen = h('div');
    this.screen.id = 'screen';
    this.screen.className = 'screen';
    this.device.append(this.screen);
    this.stage.append(this.device);
    this.os = new OS(this.screen, this.cfg);
    this.folder = new Folder(this);
    this.folded = store.get('folded', false);
    this.applyWallpaper();
    this.loadPhotos();
    this.layout();
    addEventListener('resize', () => this.layout());
    addEventListener('orientationchange', () => setTimeout(() => this.layout(), 50));
    this.initGestures();
    this.initKeys();
    this.initSystem();
    this.stage.dataset.color = this.cfg.color;
    if (!store.get('seenIntro', false)) setTimeout(() => this.showIntro(), 400);
  }

  save() {
    store.set('cfg', this.cfg);
  }

  async applyWallpaper() {
    let url;
    if (this.cfg.wallpaper === 'custom') url = await idb.get('wallpaper');
    if (!url) url = makeWallpaper(this.cfg.wallpaper === 'custom' ? 'duo' : this.cfg.wallpaper);
    this.os.setWallpaper(url);
  }

  async loadPhotos() {
    const list = await idb.photos();
    this.os.photos = (list || []).sort((a, b) => b.id - a.id);
    this.os.photoForWidget = () => this.os.photos[0]?.src || (this._gen ||= makePhoto(7));
    this.os.onMinute.forEach((f) => f());
  }

  /* ------------------------------------------------------------ layout */

  layout() {
    if (this.folder.busy) {
      this.pendingLayout = true;
      return;
    }
    this.vw = innerWidth;
    this.vh = innerHeight;
    this.portrait = this.vh > this.vw * 1.05;
    const iw = this.portrait ? GEO.Hi : GEO.Wi;
    const ih = this.portrait ? GEO.Wi : GEO.Hi;
    let k = Math.min(this.vw / iw, this.vh / ih);
    if (this.cfg.size === 'true') k = Math.min(k, 1);
    this.k = k;
    this.setFolded(this.folded, true);
  }

  setFolded(folded, silent) {
    this.folded = folded;
    store.set('folded', folded);
    if (folded) this.os.setGeometry({ W: GEO.Wo, H: GEO.Ho, R: GEO.Ro, mode: 'outer', portrait: false });
    else
      this.os.setGeometry({
        W: this.portrait ? GEO.Hi : GEO.Wi,
        H: this.portrait ? GEO.Wi : GEO.Hi,
        R: GEO.Ri,
        mode: 'inner',
        portrait: this.portrait,
      });
    this.place();
    if (!silent && this.pendingLayout) {
      this.pendingLayout = false;
      this.layout();
    }
  }

  place() {
    const W = this.os.W;
    const H = this.os.H;
    Object.assign(this.device.style, { width: W + 'px', height: H + 'px' });
    this.device.style.transform = `translate(${(this.vw - W * this.k) / 2}px, ${(this.vh - H * this.k) / 2}px) scale(${this.k})`;
  }

  async toggleFold() {
    if (this.folder.busy) return;
    await this.folder.toggle();
    if (this.pendingLayout) {
      this.pendingLayout = false;
      this.layout();
    }
  }

  /* ---------------------------------------------------------- gestures */

  initGestures() {
    // Two-finger swipe = fold / unfold, tracking the fingers.
    const avg = (ts, key) => (ts[0][key] + ts[1][key]) / 2;
    let tf = null;
    addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 2 && !this.folder.busy) {
          tf = { x0: avg(e.touches, 'clientX'), y0: avg(e.touches, 'clientY'), active: false, samples: [] };
        } else if (e.touches.length > 2) tf = null;
      },
      { capture: true, passive: false }
    );
    addEventListener(
      'touchmove',
      (e) => {
        if (!tf || e.touches.length !== 2) return;
        const x = avg(e.touches, 'clientX');
        const y = avg(e.touches, 'clientY');
        const vertical = this.portrait;
        const d = vertical ? y - tf.y0 : x - tf.x0;
        const o = vertical ? x - tf.x0 : y - tf.y0;
        if (!tf.active) {
          if (Math.abs(d) > 14 && Math.abs(d) > Math.abs(o) * 1.2) {
            // The left (top, in portrait) half is the cover: sweep it toward the hinge to close.
            const wantClose = !this.folded && d > 0;
            const wantOpen = this.folded && d < 0;
            if ((wantClose || wantOpen) && this.folder.begin(wantClose ? 'close' : 'open')) {
              tf.active = true;
              tf.dir = wantClose ? 'close' : 'open';
              tf.x0 = x;
              tf.y0 = y;
              this.os.lockGestures = true;
            } else tf = null;
          }
          return;
        }
        e.preventDefault();
        const span = GEO.Wi * 0.5 * this.k;
        const dd = (vertical ? y - tf.y0 : x - tf.x0) / span;
        const p = tf.dir === 'close' ? clamp(dd, 0, 1) : clamp(1 + dd, 0, 1);
        tf.samples.push({ t: e.timeStamp, p });
        if (tf.samples.length > 6) tf.samples.shift();
        this.folder.set(p);
      },
      { capture: true, passive: false }
    );
    const tEnd = (e) => {
      if (!tf || e.touches.length >= 2) return;
      const was = tf;
      tf = null;
      if (!was.active) return;
      this.suppressClicksUntil = performance.now() + 450;
      const s = was.samples;
      const v = s.length > 1 ? (s[s.length - 1].p - s[0].p) / Math.max(1, s[s.length - 1].t - s[0].t) : 0;
      const p = this.folder.p;
      const close = v > 0.0015 || (Math.abs(v) <= 0.0015 && p > 0.45);
      this.folder.run(close ? 1 : 0).then(() => {
        this.os.lockGestures = false;
        if (this.pendingLayout) {
          this.pendingLayout = false;
          this.layout();
        }
      });
    };
    addEventListener('touchend', tEnd, { capture: true });
    addEventListener('touchcancel', tEnd, { capture: true });
    addEventListener(
      'click',
      (e) => {
        if (performance.now() < (this.suppressClicksUntil || 0)) {
          e.stopPropagation();
          e.preventDefault();
        }
      },
      true
    );

    // Taps on the black "bezel" around the screen: 2 taps = fold, 3 taps = sleep/wake, hold = setup.
    let taps = 0;
    let tapTimer;
    let holdTimer;
    let down = null;
    this.stage.addEventListener('pointerdown', (e) => {
      if (e.target !== this.stage) return;
      down = { x: e.clientX, y: e.clientY };
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        down = null;
        taps = 0;
        this.openPanel();
      }, 900);
    });
    this.stage.addEventListener('pointermove', (e) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) {
        clearTimeout(holdTimer);
        down = null;
      }
    });
    this.stage.addEventListener('pointerup', (e) => {
      clearTimeout(holdTimer);
      if (!down || e.target !== this.stage) return;
      down = null;
      taps++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => {
        if (taps === 2) this.toggleFold();
        else if (taps >= 3) this.os.asleep ? this.os.wake() : this.os.sleep();
        taps = 0;
      }, 300);
    });
    // Stop iOS pinch-zoom and double-tap zoom.
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('dblclick', (e) => e.preventDefault());
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  initKeys() {
    addEventListener('keydown', (e) => {
      if (e.target.closest?.('.duo-panel')) return;
      const k = e.key.toLowerCase();
      if (k === 'f') this.toggleFold();
      else if (k === 'l') this.os.asleep ? this.os.wake() : this.os.sleep();
      else if (k === 'u') this.os.unlock();
      else if (k === 'p') this.openPanel();
      else if (k === 'm') this.fakeMessage();
      else if (k === 'a') this.os.island.airpods();
      else if (k === 'c') this.os.island.call(this.cfg.callName);
      else if (k === 'h') this.os.goHome();
    });
  }

  initSystem() {
    // Re-lock when the iPad itself was locked / app switched: just like a real phone.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.os.lock();
        this.wakeLock();
      }
    });
    this.wakeLock();
    // Fullscreen hides the iPad status bar in Safari.
    const fs = () => {
      if (!this.cfg.autoFullscreen) return;
      const d = document.documentElement;
      if (document.fullscreenElement || document.webkitFullscreenElement) return;
      try {
        (d.requestFullscreen || d.webkitRequestFullscreen)?.call(d)?.catch?.(() => {});
      } catch {}
    };
    addEventListener('pointerup', fs, true);
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  isStandalone() {
    return navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  }

  async wakeLock() {
    try {
      this._wl = await navigator.wakeLock?.request('screen');
    } catch {}
  }

  fakeMessage(delay = 0) {
    setTimeout(() => {
      this.os.banner({ app: 'messages', title: this.cfg.msgName, body: this.cfg.msgText });
      this.os.pendingMessage = { from: this.cfg.msgName, text: this.cfg.msgText };
    }, delay);
  }

  /* ------------------------------------------------- hidden setup panel */

  showIntro() {
    const box = h(
      'div.duo-panel.intro',
      h('h2', 'iPhone Duo — quick guide'),
      h('p', 'This note shows once. Everything below works on your iPad mini:'),
      h(
        'ul',
        h('li', h('b', 'Fold / unfold: '), 'swipe two fingers left‑to‑right to close the cover, right‑to‑left to open it. Or double‑tap the black border.'),
        h('li', h('b', 'Sleep / Always‑On: '), 'triple‑tap the black border. Tap the screen to wake.'),
        h('li', h('b', 'Hidden setup: '), 'press and hold the black border for 1 second.'),
        h('li', h('b', 'Home / App Switcher: '), 'swipe up from the bottom edge (pause for the switcher).'),
        h('li', h('b', 'Control Centre: '), 'swipe down from the top‑right corner.'),
        h('li', h('b', 'Split View: '), 'tap the ••• at the top of an app on the inner display.')
      ),
      h('p.small', 'Tip: add to Home Screen from Safari’s Share menu, and turn on Guided Access to block iPad gestures.')
    );
    const ok = h('button.primary', 'Got it');
    ok.addEventListener('click', () => {
      store.set('seenIntro', true);
      wrap.remove();
    });
    box.append(ok);
    const wrap = h('div.panel-wrap', box);
    document.body.append(wrap);
  }

  openPanel() {
    if ($('.panel-wrap')) return;
    const c = this.cfg;
    const field = (label, key, type = 'text') => {
      const input = h('input', { type, value: c[key] });
      input.addEventListener('change', () => {
        c[key] = input.value;
        this.save();
        this.os.tickClock(true);
        this.os.syncCC();
      });
      return h('label', h('span', label), input);
    };
    const toggle = (label, key, after) => {
      const input = h('input', { type: 'checkbox' });
      input.checked = !!c[key];
      input.addEventListener('change', () => {
        c[key] = input.checked;
        this.save();
        after && after();
      });
      return h('label.row', h('span', label), input);
    };
    const select = (label, key, opts, after) => {
      const s = h('select', opts.map(([v, t]) => h('option', { value: v }, t)));
      s.value = c[key];
      s.addEventListener('change', () => {
        c[key] = s.value;
        this.save();
        after && after(s.value);
      });
      return h('label', h('span', label), s);
    };
    const btn = (label, fn, cls = '') => {
      const b = h('button' + cls, label);
      b.addEventListener('click', () => fn());
      return b;
    };
    const wallFile = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    wallFile.addEventListener('change', async () => {
      const f = wallFile.files[0];
      if (!f) return;
      const url = await fileToDataURL(f, 2000);
      await idb.set('wallpaper', url);
      c.wallpaper = 'custom';
      this.save();
      this.applyWallpaper();
      close();
    });
    const photoFile = h('input', { type: 'file', accept: 'image/*', multiple: true, style: { display: 'none' } });
    photoFile.addEventListener('change', async () => {
      let i = 0;
      for (const f of photoFile.files) {
        const src = await fileToDataURL(f, 1800);
        await idb.addPhoto({ id: Date.now() + i++, src });
      }
      await this.loadPhotos();
      this.os.windows.get('photos')?.inst?.refresh?.();
      close();
    });
    const later = (fn) => () => {
      close();
      setTimeout(fn, 5000);
    };
    const box = h(
      'div.duo-panel',
      h('h2', 'Hidden setup'),
      h('p.small', 'Only you can open this (hold the black border). Actions marked “in 5 s” give you time to hand the phone over.'),
      h(
        'div.btns',
        btn(this.folded ? 'Unfold' : 'Fold', () => {
          close();
          this.toggleFold();
        }, '.primary'),
        btn('Sleep (Always‑On)', () => {
          close();
          this.os.sleep();
        }),
        btn('Lock', () => {
          close();
          this.os.lock();
        }),
        btn('Fullscreen', () => {
          const d = document.documentElement;
          (d.requestFullscreen || d.webkitRequestFullscreen)?.call(d);
          close();
        })
      ),
      h('h3', 'Surprise them'),
      h(
        'div.btns',
        btn('Message in 5 s', later(() => this.fakeMessage())),
        btn('Call in 5 s', later(() => this.os.island.call(c.callName))),
        btn('AirPods in 5 s', later(() => this.os.island.airpods()))
      ),
      field('Message from', 'msgName'),
      field('Message text', 'msgText'),
      field('Caller name', 'callName'),
      h('h3', 'Device'),
      select('Display size', 'size', [
        ['true', 'True iPhone Duo size (iPad mini)'],
        ['fill', 'Fill the iPad screen'],
      ], () => this.layout()),
      select('Finish', 'color', [
        ['nightsky', 'Night Sky'],
        ['starwhite', 'Star White'],
      ], (v) => (this.stage.dataset.color = v)),
      select('Wallpaper', 'wallpaper', [
        ['duo', 'iPhone Duo (default)'],
        ['nightsky', 'Night Sky'],
        ['sunset', 'Sunset'],
        ['starwhite', 'Star White'],
        ['custom', 'My photo…'],
      ], (v) => (v === 'custom' ? wallFile.click() : this.applyWallpaper())),
      wallFile,
      field('Your name (Apple Account)', 'owner'),
      field('Device name (About)', 'deviceName'),
      field('Carrier', 'carrier'),
      field('Weather city', 'city'),
      toggle('24‑hour time', 'h24', () => this.os.tickClock(true)),
      toggle('Always‑On display when asleep', 'aod'),
      toggle('Sample Lock Screen notifications', 'lockNotifs', () => {
        this.os.notifs = null;
        this.os.renderLockNotifs();
      }),
      toggle('Auto fullscreen on first tap (Safari)', 'autoFullscreen'),
      h('h3', 'Photos app'),
      h('div.btns', btn('Import photos…', () => photoFile.click()), btn('Clear imported', async () => {
        for (const p of this.os.photos || []) await idb.delPhoto(p.id);
        await this.loadPhotos();
        this.os.windows.get('photos')?.inst?.refresh?.();
      })),
      photoFile,
      h('h3', 'Gestures'),
      h('p.small', 'Two‑finger swipe left→right folds, right→left unfolds · double‑tap border = fold · triple‑tap border = sleep · keyboard: F fold, L sleep, M message, C call, A AirPods.'),
      btn('Close', () => close(), '.primary.wide')
    );
    const wrap = h('div.panel-wrap', box);
    wrap.addEventListener('click', (e) => e.target === wrap && close());
    const close = () => wrap.remove();
    document.body.append(wrap);
  }
}

function fileToDataURL(file, max) {
  return new Promise((res) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => res(null);
    img.src = url;
  });
}

window.duo = new Main();

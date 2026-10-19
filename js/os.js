// The "iOS 27" shell that lives inside one display (inner or outer).
import { h, $$, clamp, fmtTime, fmtDate, sleep, tick, tone } from './util.js';
import { iconSVG, G } from './icons.js';
import { APPS, HOME_PAGES, DOCK, TODAY } from './apps/registry.js';
import { widget } from './widgets.js';
import { Keyboard, FakeField } from './keyboard.js';
import { batteryLevel } from './data.js';

const OPEN_EASE = 'cubic-bezier(0.18, 0.9, 0.22, 1)';
const CLOSE_EASE = 'cubic-bezier(0.25, 0.85, 0.3, 1)';

export class OS {
  constructor(screen, cfg) {
    this.el = screen;
    this.cfg = cfg;
    this.windows = new Map();
    this.layout = null; // null = Home Screen
    this.recents = [];
    this.focusId = null;
    this.locked = true;
    this.asleep = false;
    this.onMinute = [];
    this.cc = { airplane: false, cell: true, wifi: true, bt: true, focus: false, rot: false, flash: false, bright: 0.85, vol: 0.6, mirror: false };
    this.W = 1005;
    this.H = 718;
    this.build();
    this.tickClock(true);
    setInterval(() => this.tickClock(), 1000);
  }

  /* ---------------------------------------------------------------- build */

  build() {
    const s = this.el;
    s.replaceChildren();
    this.wall = h('div.wallpaper');
    this.home = h('div.home');
    this.appsLayer = h('div.apps');
    this.lockEl = h('div.lock');
    // iPhone Duo status bar: the time stacked over one circular indicator, in the right-hand rail.
    this.status = h('div.status', h('div.st-time'), h('div.st-ring'));
    this.islandEl = h('div.island', h('div.island-cam'), h('div.island-compact'), h('div.island-expanded'));
    this.ccEl = h('div.cc');
    this.bannerEl = h('div.banners');
    this.switcherEl = h('div.switcher');
    this.homeInd = h('div.home-ind');
    this.keyboard = new Keyboard(this);
    this.crease = h('div.crease');
    this.dim = h('div.dim');
    this.sleepEl = h('div.sleep');
    this.edgeBottom = h('div.edge.edge-bottom');
    this.edgeTop = h('div.edge.edge-top');
    this.menuEl = h('div.mt-menu-layer');
    s.append(
      this.wall,
      this.home,
      this.appsLayer,
      this.switcherEl,
      this.keyboard.el,
      this.lockEl,
      this.ccEl,
      this.menuEl,
      this.bannerEl,
      this.status,
      this.islandEl,
      this.homeInd,
      this.edgeBottom,
      this.edgeTop,
      this.crease,
      this.dim,
      this.sleepEl
    );
    s.classList.add('locked');
    this.buildHome();
    this.buildLock();
    this.buildCC();
    this.island = new Island(this);
    this.initEdges();
    this.sleepEl.addEventListener('click', () => this.wake());
    this.setBrightness(this.cc.bright);
  }

  setWallpaper(url) {
    this.wall.style.backgroundImage = `url(${url})`;
  }

  setGeometry({ W, H, R, mode, portrait }) {
    this.W = W;
    this.H = H;
    this.mode = mode;
    this.portrait = !!portrait;
    this.R = R;
    const s = this.el;
    s.style.setProperty('--W', W + 'px');
    s.style.setProperty('--H', H + 'px');
    s.style.setProperty('--R', typeof R === 'number' ? R + 'px' : R);
    s.classList.toggle('inner', mode === 'inner');
    s.classList.toggle('outer', mode === 'outer');
    s.classList.toggle('portrait', !!portrait);
    s.classList.toggle('wide', mode === 'inner' && !portrait);
    const key = mode + (portrait ? 'p' : 'l');
    if (key !== this.homeKey) {
      this.homeKey = key;
      this.buildHome();
    }
    requestAnimationFrame(() => this.scrollToSpread(this.spread ?? 1, false));
    this.applyLayout(false);
    if (this.switcherOpen) this.closeSwitcher(false);
    for (const w of this.windows.values()) w.inst?.resize?.();
  }

  /* --------------------------------------------------------------- clock */

  tickClock(force) {
    const now = new Date();
    const key = now.getHours() * 60 + now.getMinutes();
    if (!force && key === this.lastMinute) return;
    this.lastMinute = key;
    const t = fmtTime(now, this.cfg.h24);
    this.status.querySelector('.st-time').textContent = t;
    this.lockClock.textContent = t;
    this.lockDate.textContent = [fmtDate(now, { weekday: 'short' }), fmtDate(now, { month: 'short' }), now.getDate()].join(' ');
    this.updateBattery();
    for (const fn of this.onMinute) {
      try {
        fn();
      } catch (e) {
        console.warn(e);
      }
    }
  }

  // Ring = battery, dots along the gap = cellular bars, glyph in the middle = Wi‑Fi.
  updateBattery() {
    const lvl = batteryLevel();
    const S = this.cc;
    const r = 19.5;
    const pt = (a) => [22 + r * Math.cos((a * Math.PI) / 180), 22 + r * Math.sin((a * Math.PI) / 180)];
    const [x1, y1] = pt(125);
    const [x2, y2] = pt(55);
    const arc = `M${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 1 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
    const bars = S.airplane ? 0 : S.cell ? 4 : 1;
    const dots = [65, 77.5, 90, 102.5, 115]
      .map((a, i) => {
        const [x, y] = pt(a);
        return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="1.55" fill="currentColor" opacity="${i < bars ? 1 : 0.35}"/>`;
      })
      .join('');
    const mid = S.airplane
      ? `<g transform="translate(13 12) scale(.75)">${G.plane.replace(/<\/?svg[^>]*>/g, '')}</g>`
      : S.wifi
      ? `<g transform="translate(12.5 14.2) scale(.79)">${G.wifi.replace(/<\/?svg[^>]*>/g, '')}</g>`
      : `<text x="22" y="26" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" font-family="-apple-system,system-ui,sans-serif">5G</text>`;
    this.status.querySelector('.st-ring').innerHTML = `<svg viewBox="0 0 44 44"><path d="${arc}" fill="none" stroke="currentColor" stroke-opacity=".32" stroke-width="2.6" stroke-linecap="round"/><path d="${arc}" pathLength="100" fill="none" stroke="${lvl <= 0.2 ? '#FF453A' : 'currentColor'}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="${(lvl * 100).toFixed(1)} 200"/>${dots}${mid}</svg>`;
  }

  /* ---------------------------------------------------------------- home */

  buildHome() {
    // Rebuilt per display: the open phone shows two pages side by side, the outer display one.
    this.home.replaceChildren();
    if (this.widgetTicks) this.onMinute = this.onMinute.filter((f) => !this.widgetTicks.includes(f));
    const before = this.onMinute.length;
    const wide = this.mode === 'inner' && !this.portrait;
    const [P1, P2] = HOME_PAGES;
    const grid = (items) => {
      const g = h('div.grid');
      items.forEach((it) => g.append(typeof it === 'string' ? this.appIcon(it) : this.widgetCell(it)));
      return g;
    };
    const today = (list) => h('div.today-col.scroll', list.map((w) => widget(w, this)));
    const panel = (cls, child) => h('div.panel' + cls, child);
    const strip = h('div.strip');
    if (wide) {
      const half = Math.ceil(P2.length / 2);
      strip.append(
        panel('.snap', today(TODAY.slice(0, 3))),
        panel('.right', today(TODAY.slice(3))),
        panel('.snap.xl-page', widget({ w: 'photos', s: 'XL' }, this)),
        panel('.right', grid(P1)),
        panel('.snap', grid(P2.slice(0, half))),
        panel('.right', grid(P2.slice(half)))
      );
      this.spreadStarts = [0, 2, 4];
    } else {
      strip.append(panel('.snap.right', today(TODAY)), panel('.snap.right', grid(P1)), panel('.snap.right', grid(P2)));
      this.spreadStarts = [0, 1, 2];
    }
    this.widgetTicks = this.onMinute.slice(before);
    this.strip = strip;
    const dock = h('div.dock', DOCK.map((id) => this.appIcon(id, true)));
    this.dots = h('div.page-dots', h('i.on'), h('i'));
    const search = h('div.home-search', { html: G.search });
    search.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openSpotlight();
    });
    this.pressable(search);
    const done = h('div.jiggle-done', 'Done');
    done.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setJiggle(false);
    });
    this.home.append(strip, dock, this.dots, search, done);

    strip.addEventListener(
      'scroll',
      () => {
        const x = strip.scrollLeft;
        let best = 0;
        this.spreadStarts.forEach((idx, i) => {
          if (Math.abs(strip.children[idx].offsetLeft - x) < Math.abs(strip.children[this.spreadStarts[best]].offsetLeft - x)) best = i;
        });
        this.spread = best;
        this.dots.style.opacity = best === 0 ? '0' : '';
        $$('i', this.dots).forEach((d, i) => d.classList.toggle('on', i === best - 1));
      },
      { passive: true }
    );
    // Long-press empty space or an icon -> jiggle mode.
    let lp;
    this.home.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.home-search,.jiggle-done')) return;
      clearTimeout(lp);
      const x0 = e.clientX;
      const y0 = e.clientY;
      lp = setTimeout(() => {
        this.setJiggle(true);
        this.suppressClick = true;
      }, 650);
      const cancel = (ev) => {
        if (ev.type === 'pointermove' && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
        clearTimeout(lp);
        this.home.removeEventListener('pointermove', cancel);
      };
      this.home.addEventListener('pointermove', cancel);
      this.home.addEventListener('pointerup', cancel, { once: true });
      this.home.addEventListener('pointercancel', cancel, { once: true });
    });
    this.home.addEventListener('click', (e) => {
      if (this.jiggling && !e.target.closest('.app,.widget')) this.setJiggle(false);
    });
  }

  scrollToSpread(i, smooth) {
    if (!this.strip) return;
    const idx = this.spreadStarts[Math.min(i, this.spreadStarts.length - 1)];
    const left = this.strip.children[idx].offsetLeft;
    if (smooth) this.strip.scrollTo({ left, behavior: 'smooth' });
    else this.strip.scrollLeft = left;
    this.spread = i;
  }

  widgetCell(def) {
    const names = { weather: 'Weather', calendar: 'Calendar', photos: 'Photos', batteries: 'Batteries', music: 'Music', fitness: 'Fitness', reminders: 'Reminders' };
    return h('div.wcell.w-' + def.s, widget(def, this), h('div.wlabel', names[def.w] || ''));
  }

  setJiggle(on) {
    this.jiggling = on;
    this.home.classList.toggle('jiggle', on);
    if (on) tick(0.2);
  }

  appIcon(id, inDock) {
    const a = APPS[id];
    const el = h(
      'div.app',
      { dataset: { app: id } },
      h('div.icon', { html: iconSVG(id) }, h('div.icon-del', '–')),
      inDock ? null : h('div.label', a.name)
    );
    this.pressable(el);
    el.addEventListener('click', () => {
      if (this.jiggling) return;
      this.openApp(id, el.querySelector('.icon'));
    });
    return el;
  }

  pressable(el) {
    el.addEventListener('pointerdown', () => el.classList.add('pressed'));
    const up = () => el.classList.remove('pressed');
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  }

  findIcon(id) {
    const all = $$(`.app[data-app="${id}"] .icon`, this.home);
    const dock = all.find((i) => i.closest('.dock'));
    if (dock) return dock;
    for (const icon of all) {
      const r = this.rel(icon);
      if (r.x > -2 && r.x + r.w < this.W + 2) return icon;
    }
    return null;
  }

  // Rect of an element in unscaled screen coordinates.
  rel(node) {
    const sr = this.el.getBoundingClientRect();
    const k = sr.width / this.W || 1;
    const r = node.getBoundingClientRect();
    return { x: (r.left - sr.left) / k, y: (r.top - sr.top) / k, w: r.width / k, h: r.height / k };
  }

  pt(e) {
    const sr = this.el.getBoundingClientRect();
    const k = sr.width / this.W || 1;
    return { x: (e.clientX - sr.left) / k, y: (e.clientY - sr.top) / k };
  }

  // Measure an icon as it will be once the Home Screen is fully visible (no zoom transform).
  homeIconRect(id) {
    const hadOpen = this.el.classList.contains('app-open');
    const prev = this.home.style.cssText;
    this.home.style.transition = 'none';
    this.home.style.transform = 'none';
    const icon = this.findIcon(id);
    const r = icon ? this.rel(icon) : null;
    this.home.style.cssText = prev;
    void this.home.offsetWidth;
    if (hadOpen) this.el.classList.add('app-open');
    return r;
  }

  /* ---------------------------------------------------------------- lock */

  buildLock() {
    this.lockPad = h('div.lock-pad', { html: G.lock });
    this.lockDate = h('div.lock-date');
    this.lockClock = h('div.lock-clock');
    this.lockNotifs = h('div.lock-notifs');
    const flash = h('div.lock-btn', { html: G.flashlight });
    const cam = h('div.lock-btn', { html: G.camera });
    flash.addEventListener('click', (e) => {
      e.stopPropagation();
      flash.classList.toggle('on');
      this.cc.flash = flash.classList.contains('on');
      tick(0.25);
    });
    cam.addEventListener('click', async (e) => {
      e.stopPropagation();
      tick(0.25);
      await this.unlock();
      this.openApp('camera');
    });
    this.lockCtrls = h('div.lock-ctrls', flash, cam);
    this.lockHint = h('div.lock-hint', 'Swipe up to open');
    this.lockInner = h('div.lock-inner', this.lockPad, this.lockDate, this.lockClock, this.lockNotifs);
    this.lockEl.append(this.lockInner, this.lockCtrls, this.lockHint);
    this.renderLockNotifs();

    let g = null;
    this.lockEl.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.lock-btn')) return;
      g = { y0: this.pt(e).y, id: e.pointerId, t: e.timeStamp, last: this.pt(e).y, lt: e.timeStamp, v: 0 };
      this.lockEl.setPointerCapture(e.pointerId);
    });
    this.lockEl.addEventListener('pointermove', (e) => {
      if (!g || e.pointerId !== g.id) return;
      const y = this.pt(e).y;
      const dt = Math.max(1, e.timeStamp - g.lt);
      g.v = (y - g.last) / dt;
      g.last = y;
      g.lt = e.timeStamp;
      const up = Math.max(0, g.y0 - y);
      if (up > 4 && !g.moved) {
        g.moved = true;
        this.lockPad.innerHTML = G.unlock;
        this.el.classList.add('lock-drag');
      }
      if (this.coverMode) {
        this.lockEl.style.transform = `translateY(${-up}px)`;
        return;
      }
      const p = clamp(up / (this.H * 0.6), 0, 1);
      this.lockInner.style.transform = `translateY(${-up * 0.9}px)`;
      this.lockInner.style.opacity = String(1 - p * 1.2);
      this.lockCtrls.style.opacity = this.lockHint.style.opacity = String(1 - p * 2);
      this.home.style.opacity = String(p);
      this.home.style.transform = `scale(${1.15 - 0.15 * p})`;
      if (this.layout) {
        this.appsLayer.style.opacity = String(p);
        this.appsLayer.style.visibility = 'visible';
      }
    });
    const end = (e) => {
      if (!g || e.pointerId !== g.id) return;
      const up = g.y0 - g.last;
      const fling = g.v < -0.35;
      const was = g;
      g = null;
      this.el.classList.remove('lock-drag');
      if (!was.moved) {
        // Tap on lock screen just "wakes" — real iPhones show the Touch ID prompt.
        this.lockPad.classList.remove('nudge');
        void this.lockPad.offsetWidth;
        this.lockPad.classList.add('nudge');
        return;
      }
      if (this.coverMode) {
        if (up > 80 || fling) this.closeCover();
        else this.lockEl.style.transform = '';
        return;
      }
      if (up > this.H * 0.18 || fling) this.unlock();
      else this.resetLockDrag(true);
    };
    this.lockEl.addEventListener('pointerup', end);
    this.lockEl.addEventListener('pointercancel', end);
  }

  renderLockNotifs() {
    const list = this.cfg.lockNotifs !== false ? this.notifs || defaultNotifs() : [];
    this.notifs = list;
    this.lockNotifs.replaceChildren(
      ...list.slice(0, 3).map((n, i) =>
        h(
          'div.notif' + (i > 0 ? '.stacked' : ''),
          { style: { '--i': i } },
          h('div.n-icon', { html: iconSVG(n.app) }),
          h('div.n-body', h('div.n-top', h('b', n.title), h('span', n.time || 'now')), h('div.n-text', n.body))
        )
      )
    );
  }

  resetLockDrag(animate) {
    for (const n of [this.lockInner, this.lockCtrls, this.lockHint, this.home, this.appsLayer]) {
      if (animate) n.style.transition = 'transform .45s cubic-bezier(.2,.9,.3,1), opacity .35s';
      n.style.transform = n.style.opacity = n.style.visibility = '';
      if (animate) setTimeout(() => (n.style.transition = ''), 460);
    }
    this.lockPad.innerHTML = this.locked ? G.lock : G.unlock;
  }

  lock() {
    if (this.coverMode) this.closeCover(true);
    this.keyboard.close();
    this.closeCC();
    this.closeMenu();
    if (this.switcherOpen) this.closeSwitcher(false);
    this.locked = true;
    this.lockPad.innerHTML = G.lock;
    this.el.classList.add('locked');
    this.resetLockDrag(false);
    for (const w of this.visibleWins()) w.inst?.hide?.();
    this.updateStatusTheme();
  }

  async unlock() {
    if (!this.locked) return;
    this.locked = false;
    this.lockPad.innerHTML = G.unlock;
    tick(0.18);
    // Let current inline drag values be the transition start, then clear them.
    for (const n of [this.lockInner, this.lockCtrls, this.lockHint, this.home, this.appsLayer]) {
      n.style.transition = 'transform .5s cubic-bezier(.2,.9,.25,1), opacity .4s';
    }
    void this.el.offsetWidth;
    this.el.classList.remove('locked');
    this.el.classList.add('unlocking');
    for (const n of [this.lockInner, this.lockCtrls, this.lockHint, this.home, this.appsLayer]) {
      n.style.transform = n.style.opacity = n.style.visibility = '';
    }
    for (const w of this.visibleWins()) w.inst?.show?.();
    this.updateStatusTheme();
    await sleep(520);
    this.el.classList.remove('unlocking');
    for (const n of [this.lockInner, this.lockCtrls, this.lockHint, this.home, this.appsLayer]) n.style.transition = '';
  }

  sleep() {
    this.lock();
    this.island.collapse();
    this.bannerEl.replaceChildren();
    this.asleep = true;
    this.el.classList.add('asleep');
    this.el.classList.toggle('aod', this.cfg.aod !== false);
  }

  wake() {
    if (!this.asleep) return;
    this.asleep = false;
    this.el.classList.remove('asleep', 'aod');
    this.el.classList.add('waking');
    setTimeout(() => this.el.classList.remove('waking'), 600);
  }

  // Notification Centre: the Lock Screen pulled down over whatever is open.
  openCover() {
    if (this.locked) return;
    this.coverMode = true;
    this.keyboard.close();
    this.el.classList.add('cover');
    this.lockPad.innerHTML = G.unlock;
    this.lockEl.style.transform = '';
    this.updateStatusTheme();
  }
  closeCover(instant) {
    this.coverMode = false;
    this.lockEl.style.transition = instant ? 'none' : '';
    this.el.classList.remove('cover');
    this.lockEl.style.transform = '';
    this.updateStatusTheme();
    if (instant) requestAnimationFrame(() => (this.lockEl.style.transition = ''));
  }

  /* ------------------------------------------------------------- windows */

  api(w) {
    const os = this;
    return {
      os,
      cfg: this.cfg,
      win: w.el,
      root: w.content,
      island: this.island,
      keyboard: this.keyboard,
      field: (opts) => new FakeField(os, opts),
      open: (id) => os.openApp(id),
      home: () => os.goHome(),
      notify: (n) => os.banner(n),
      isInner: () => os.mode === 'inner',
      // Toolbar buttons and tab bars live in a vertical rail on the window's outer edge.
      rail: {
        top: (nodes) => w.railTop.replaceChildren(...[].concat(nodes || []).filter(Boolean)),
        bottom: (nodes) => w.railBot.replaceChildren(...[].concat(nodes || []).filter(Boolean)),
      },
      setTheme: (t) => {
        w.el.dataset.theme = t;
        os.updateStatusTheme();
      },
    };
  }

  createWindow(id) {
    const a = APPS[id];
    const content = h('div.win-content');
    const railTop = h('div.rail-top');
    const railBot = h('div.rail-bot');
    const el = h('div.win', { dataset: { app: id, theme: a.module.theme || 'dark' } }, content, h('div.win-rail', railTop, railBot));
    if (a.module.fullBleed || a.module.hideStatus) el.dataset.bleed = '1';
    const dots = h('div.mt-dots', h('i'), h('i'), h('i'));
    dots.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openMenu(id, dots);
    });
    el.append(dots);
    el.addEventListener('pointerdown', () => {
      if (this.focusId !== id) {
        this.focusId = id;
        this.updateStatusTheme();
      }
    });
    this.appsLayer.append(el);
    const w = { id, el, content, app: a, railTop, railBot };
    this.windows.set(id, w);
    try {
      w.inst = a.module.mount(content, this.api(w)) || {};
    } catch (err) {
      console.error(err);
      w.inst = {};
    }
    return w;
  }

  destroyWindow(id) {
    const w = this.windows.get(id);
    if (!w) return;
    w.inst?.hide?.();
    w.inst?.destroy?.();
    w.el.remove();
    this.windows.delete(id);
    this.recents = this.recents.filter((x) => x !== id);
    if (this.layout) {
      const ids = this.layoutIds();
      if (ids.includes(id)) {
        const rest = ids.filter((x) => x !== id);
        this.layout = rest.length ? { mode: 'full', a: rest[0] } : null;
        this.applyLayout(false);
      }
    }
  }

  layoutIds() {
    if (!this.layout) return [];
    return this.layout.mode === 'split' ? [this.layout.a, this.layout.b].filter(Boolean) : [this.layout.a];
  }

  // Which windows are on screen, honouring that the outer display only shows one.
  shownIds() {
    const ids = this.layoutIds();
    if (this.layout?.mode === 'split' && (this.mode !== 'inner' || this.el.classList.contains('portrait'))) {
      return [ids.includes(this.focusId) ? this.focusId : ids[0]];
    }
    return ids;
  }

  visibleWins() {
    return this.shownIds()
      .map((id) => this.windows.get(id))
      .filter(Boolean);
  }

  winRect(id) {
    const W = this.W;
    const H = this.H;
    const ids = this.shownIds();
    if (ids.length === 2) {
      const half = W / 2;
      return id === this.layout.a ? { x: 0, y: 0, w: half - 4, h: H, side: 'l' } : { x: half + 4, y: 0, w: half - 4, h: H, side: 'r' };
    }
    return { x: 0, y: 0, w: W, h: H };
  }

  winClip(rect) {
    const R = this.R ?? 40;
    const r = (k) => (typeof R === 'number' ? R : parseFloat(R.split(' ')[k] ?? R)) + 'px';
    if (rect.side === 'l') return `inset(0px round ${r(0)} 22px 22px ${r(3)})`;
    if (rect.side === 'r') return `inset(0px round 22px ${r(1)} ${r(2)} 22px)`;
    return `inset(0px round ${typeof R === 'number' ? R + 'px' : R})`;
  }

  applyLayout(fireShow = true) {
    const shown = new Set(this.shownIds());
    for (const [id, w] of this.windows) {
      const vis = shown.has(id);
      const wasVis = w.el.style.display === 'block';
      if (vis) {
        const r = this.winRect(id);
        Object.assign(w.el.style, { display: 'block', left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', clipPath: this.winClip(r) });
        w.el.classList.toggle('split', !!r.side);
        w.el.classList.toggle('rail-left', r.side === 'l');
        if (!wasVis && fireShow && !this.locked) w.inst?.show?.();
        w.inst?.resize?.();
      } else {
        w.el.style.display = 'none';
        if (wasVis) w.inst?.hide?.();
      }
    }
    this.el.classList.toggle('app-open', shown.size > 0);
    this.el.classList.toggle('split-view', shown.size === 2);
    this.renderDivider();
    this.updateStatusTheme();
  }

  updateStatusTheme() {
    let left = 'dark';
    let right = 'dark';
    if (!this.locked && !this.coverMode && this.layout && !this.switcherOpen) {
      const ids = this.shownIds();
      const t = (id) => this.windows.get(id)?.el.dataset.theme || 'dark';
      left = t(ids[0]);
      right = t(ids[ids.length - 1]);
    }
    const hide = !this.locked && !this.coverMode && !this.switcherOpen && this.shownIds().some((id) => APPS[id].module.hideStatus);
    this.status.classList.toggle('hidden', hide);
    this.status.classList.toggle('l-light', left === 'light');
    this.status.classList.toggle('r-light', right === 'light');
    this.homeInd.classList.toggle('light', !this.locked && this.layout && right === 'light' && !this.switcherOpen);
  }

  zoomFrame(rect, src, srcRadius) {
    const a = src.w / src.h;
    const cw = Math.min(rect.w, rect.h * a);
    const ch = cw / a;
    const sc = src.w / cw;
    const iv = (rect.h - ch) / 2;
    const ih = (rect.w - cw) / 2;
    const dx = src.x + src.w / 2 - (rect.x + rect.w / 2);
    const dy = src.y + src.h / 2 - (rect.y + rect.h / 2);
    return {
      transform: `translate(${dx}px, ${dy}px) scale(${sc})`,
      clipPath: `inset(${iv}px ${ih}px round ${srcRadius / sc}px)`,
    };
  }

  async openApp(id, fromEl) {
    if (this.locked || !APPS[id]) return;
    if (this.coverMode) this.closeCover();
    if (this.switcherOpen) this.closeSwitcher(false);
    this.closeCC();
    this.keyboard.close();
    if (this.jiggling) return;
    if (this.pickingFor) return this.finishSplit(id);
    if (this.layoutIds().includes(id) && this.shownIds().includes(id)) return;
    let w = this.windows.get(id);
    if (!w) w = this.createWindow(id);
    this.recents = [id, ...this.recents.filter((x) => x !== id)];
    this.focusId = id;
    const fromHome = !this.layout;
    this.layout = { mode: 'full', a: id };
    // Remember Split View pairs: reopening one half brings back its partner.
    const pair = this.pairs?.find((p) => p.includes(id));
    if (pair && this.windows.has(pair[0]) && this.windows.has(pair[1]) && this.mode === 'inner') {
      this.layout = { mode: 'split', a: pair[0], b: pair[1] };
    }
    for (const other of this.windows.values()) if (!this.layoutIds().includes(other.id)) other.el.getAnimations().forEach((an) => an.cancel());
    this.applyLayout(true);
    const rect = this.winRect(id);
    let src = fromEl && fromEl.isConnected ? this.rel(fromEl) : null;
    if (!src || src.w < 4) src = { x: rect.x + rect.w / 2 - 32, y: rect.y + rect.h / 2 - 32, w: 64, h: 64 };
    const radius = fromEl?.classList.contains('widget') ? 24 : src.w * 0.225;
    const from = this.zoomFrame(rect, src, radius);
    const to = { transform: 'translate(0px, 0px) scale(1)', clipPath: this.winClip(rect) };
    const ghost = h('div.win-ghost', { html: fromEl?.classList.contains('icon') || !fromEl ? iconSVG(id) : '' });
    if (fromEl?.classList.contains('widget')) ghost.style.background = 'rgba(40,40,44,1)';
    const m = Math.min(rect.w, rect.h);
    Object.assign(ghost.style, { width: m + 'px', height: m + 'px', left: (rect.w - m) / 2 + 'px', top: (rect.h - m) / 2 + 'px' });
    w.el.append(ghost);
    this.animating = true;
    const anim = w.el.animate([from, to], { duration: 520, easing: OPEN_EASE });
    ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-out', fill: 'forwards' });
    if (fromHome) this.home.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.12)', opacity: 0 }], { duration: 420, easing: OPEN_EASE });
    await anim.finished.catch(() => {});
    ghost.remove();
    this.animating = false;
  }

  async goHome(fromDrag) {
    if (!this.layout) return;
    this.keyboard.close();
    this.closeMenu();
    if (this.pickingFor) this.cancelSplitPick();
    const wins = this.visibleWins();
    const ids = wins.map((w) => w.id);
    const rects = Object.fromEntries(ids.map((id) => [id, this.homeIconRect(id)]));
    const startStates = Object.fromEntries(wins.map((w) => [w.id, fromDrag?.[w.id] || { transform: 'translate(0px,0px) scale(1)', clipPath: this.winClip(this.winRect(w.id)) }]));
    const shownRects = Object.fromEntries(ids.map((id) => [id, this.winRect(id)]));
    this.layout = null;
    this.el.classList.remove('app-open', 'split-view');
    this.renderDivider();
    this.updateStatusTheme();
    const homeFrom = fromDrag ? { transform: this.home.style.transform || 'scale(1.12)', opacity: this.home.style.opacity || 0 } : { transform: 'scale(1.12)', opacity: 0 };
    this.home.style.transform = this.home.style.opacity = '';
    this.home.animate([homeFrom, { transform: 'scale(1)', opacity: 1 }], { duration: 480, easing: CLOSE_EASE });
    await Promise.all(
      wins.map(async (w) => {
        const rect = shownRects[w.id];
        let src = rects[w.id];
        if (!src) src = { x: this.W / 2 - 30, y: this.H / 2 - 30, w: 60, h: 60 };
        const to = this.zoomFrame(rect, src, src.w * 0.225);
        const ghost = h('div.win-ghost', { html: iconSVG(w.id) });
        const m = Math.min(rect.w, rect.h);
        Object.assign(ghost.style, { width: m + 'px', height: m + 'px', left: (rect.w - m) / 2 + 'px', top: (rect.h - m) / 2 + 'px', opacity: 0 });
        w.el.append(ghost);
        w.el.style.transform = '';
        const an = w.el.animate([startStates[w.id], { ...to, opacity: 1, offset: 0.85 }, { ...to, opacity: 0 }], { duration: 460, easing: CLOSE_EASE });
        ghost.animate([{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1 }], { duration: 400, fill: 'forwards' });
        await an.finished.catch(() => {});
        ghost.remove();
      })
    );
    for (const w of wins) {
      if (this.layoutIds().includes(w.id)) continue;
      w.el.style.display = 'none';
      w.el.style.transform = '';
      w.inst?.hide?.();
    }
  }

  /* ------------------------------------------------------- split view */

  openMenu(id, anchor) {
    this.closeMenu();
    const inner = this.mode === 'inner' && !this.el.classList.contains('portrait');
    const r = this.rel(anchor);
    const item = (label, glyph, fn, on) => {
      const el = h('div.mt-item' + (on ? '.on' : ''), { html: glyph }, h('span', label));
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeMenu();
        fn();
      });
      return el;
    };
    const full = `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
    const split = `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><rect x="12" y="5" width="9" height="14" rx="2" fill="currentColor"/></svg>`;
    const close = `<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
    const isSplit = this.layout?.mode === 'split';
    const menu = h(
      'div.mt-menu',
      { style: { left: r.x + r.w / 2 + 'px', top: r.y + r.h + 6 + 'px' } },
      h(
        'div.mt-row',
        item('Full Screen', full, () => this.makeFull(id), !isSplit),
        inner ? item('Split View', split, () => this.startSplit(id), isSplit) : null,
        isSplit ? item('Close', close, () => this.makeFull(this.layout.a === id ? this.layout.b : this.layout.a)) : null
      )
    );
    this.menuEl.replaceChildren(menu);
    this.menuEl.classList.add('open');
    this.menuEl.onclick = () => this.closeMenu();
  }
  closeMenu() {
    this.menuEl.classList.remove('open');
    this.menuEl.replaceChildren();
  }

  makeFull(id) {
    if (!id) return;
    this.layout = { mode: 'full', a: id };
    this.focusId = id;
    this.applyLayout();
    this.windows.get(id)?.el.animate([{ transform: 'scale(.96)', opacity: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 380, easing: OPEN_EASE });
  }

  startSplit(id) {
    this.layout = { mode: 'split', a: id, b: null };
    this.pickingFor = id;
    this.applyLayout();
    const w = this.windows.get(id);
    w.el.animate([{ width: this.W + 'px', clipPath: this.winClip({}) }, { width: this.W / 2 - 4 + 'px', clipPath: this.winClip({ side: 'l' }) }], { duration: 450, easing: OPEN_EASE });
    // Right half shows a glass app picker (the Home Screen, condensed).
    const ids = [...DOCK, ...HOME_PAGES.flat().filter((x) => typeof x === 'string')].filter((x, i, arr) => x !== id && arr.indexOf(x) === i);
    const picker = h(
      'div.split-picker',
      h('div.sp-title', 'Choose an app for Split View'),
      h(
        'div.sp-grid.scroll',
        ids.map((aid) => {
          const el = h('div.app', h('div.icon', { html: iconSVG(aid) }), h('div.label', APPS[aid].name));
          this.pressable(el);
          el.addEventListener('click', () => this.finishSplit(aid, el.querySelector('.icon')));
          return el;
        })
      )
    );
    this.picker?.remove();
    this.picker = picker;
    this.appsLayer.append(picker);
    picker.animate([{ opacity: 0, transform: 'translateX(40px)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: OPEN_EASE });
  }

  cancelSplitPick() {
    this.pickingFor = null;
    this.picker?.remove();
    this.picker = null;
    if (this.layout?.mode === 'split' && !this.layout.b) this.makeFull(this.layout.a);
  }

  async finishSplit(id, fromEl) {
    const left = this.pickingFor;
    this.pickingFor = null;
    const pr = this.picker;
    this.picker = null;
    pr?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).finished.then(() => pr.remove());
    if (id === left) return this.makeFull(id);
    let w = this.windows.get(id) || this.createWindow(id);
    this.recents = [id, ...this.recents.filter((x) => x !== id)];
    this.layout = { mode: 'split', a: left, b: id };
    this.focusId = id;
    this.pairs = [[left, id], ...(this.pairs || []).filter((p) => !p.includes(left) && !p.includes(id))].slice(0, 4);
    this.applyLayout();
    const rect = this.winRect(id);
    const src = fromEl ? this.rel(fromEl) : { x: rect.x + rect.w / 2 - 30, y: rect.h / 2 - 30, w: 60, h: 60 };
    w.el.animate([this.zoomFrame(rect, src, src.w * 0.225), { transform: 'none', clipPath: this.winClip(rect) }], { duration: 500, easing: OPEN_EASE });
  }

  renderDivider() {
    this.divider?.remove();
    this.divider = null;
    if (this.shownIds().length !== 2 && !this.pickingFor) return;
    const d = h('div.split-divider', h('i'));
    this.divider = d;
    this.appsLayer.append(d);
    let g;
    d.addEventListener('pointerdown', (e) => {
      g = { x0: this.pt(e).x };
      d.setPointerCapture(e.pointerId);
    });
    d.addEventListener('pointermove', (e) => {
      if (!g) return;
      const x = this.pt(e).x;
      d.style.transform = `translateX(${x - this.W / 2}px)`;
      g.x = x;
    });
    d.addEventListener('pointerup', () => {
      if (!g) return;
      const x = g.x ?? this.W / 2;
      g = null;
      d.style.transform = '';
      if (!this.layout?.b) return;
      if (x < this.W * 0.22) this.makeFull(this.layout.b);
      else if (x > this.W * 0.78) this.makeFull(this.layout.a);
    });
  }

  /* --------------------------------------------------- edge gestures */

  initEdges() {
    const bottom = this.edgeBottom;
    let g = null;
    bottom.addEventListener('pointerdown', (e) => {
      if (this.locked || this.animating) return;
      bottom.setPointerCapture(e.pointerId);
      const p = this.pt(e);
      g = { x0: p.x, y0: p.y, samples: [{ t: e.timeStamp, x: p.x, y: p.y }], active: false };
    });
    bottom.addEventListener('pointermove', (e) => {
      if (!g) return;
      const p = this.pt(e);
      g.samples.push({ t: e.timeStamp, x: p.x, y: p.y });
      if (g.samples.length > 8) g.samples.shift();
      const dx = p.x - g.x0;
      const up = g.y0 - p.y;
      if (!g.active && up > 6) {
        g.active = true;
        this.homeDragStart();
      }
      if (g.active) this.homeDragMove(dx, up);
    });
    const end = (e) => {
      if (!g) return;
      const was = g;
      g = null;
      if (!was.active) {
        // tap on home indicator: nothing, like iOS
        return;
      }
      const s = was.samples;
      const b = s[s.length - 1];
      // Velocity over the last ~100 ms, measured up to the moment the finger lifted.
      const recent = s.filter((x) => e.timeStamp - x.t < 100);
      const a = recent[0] || b;
      const paused = e.timeStamp - b.t > 90 || recent.length < 2;
      const v = paused ? 0 : (b.y - a.y) / Math.max(1, e.timeStamp - a.t);
      this.homeDragEnd(was.y0 - b.y, b.x - was.x0, v, paused);
    };
    bottom.addEventListener('pointerup', end);
    bottom.addEventListener('pointercancel', end);

    const top = this.edgeTop;
    let t = null;
    top.addEventListener('pointerdown', (e) => {
      top.setPointerCapture(e.pointerId);
      t = { ...this.pt(e), done: false };
    });
    top.addEventListener('pointermove', (e) => {
      if (!t || t.done) return;
      const p = this.pt(e);
      if (p.y - t.y > 24) {
        t.done = true;
        if (t.x > this.W * 0.55) this.openCC();
        else if (!this.locked) this.openCover();
      }
    });
    top.addEventListener('pointerup', () => (t = null));
    top.addEventListener('pointercancel', () => (t = null));
  }

  homeDragStart() {
    this.keyboard.close();
    this.closeMenu();
    if (this.switcherOpen) return;
    this.dragWins = this.layout ? this.visibleWins() : [];
    for (const w of this.dragWins) w.el.getAnimations().forEach((a) => a.cancel());
    this.home.getAnimations().forEach((a) => a.cancel());
    this.el.classList.add('home-dragging');
  }

  homeDragMove(dx, up) {
    if (this.switcherOpen || !this.dragWins?.length) return;
    const p = clamp(up / (this.H * 0.85), 0, 1);
    const s = 1 - 0.62 * Math.pow(p, 0.85);
    this.dragState = {};
    for (const w of this.dragWins) {
      const r = this.winRect(w.id);
      const ty = -up * 0.5;
      const tf = `translate(${dx * 0.7}px, ${ty}px) scale(${s})`;
      const cp = `inset(0px round ${Math.min(60, 40 + p * 60) / Math.max(s, 0.4)}px)`;
      w.el.style.transform = tf;
      w.el.style.clipPath = cp;
      this.dragState[w.id] = { transform: tf, clipPath: cp };
      void r;
    }
    this.home.style.transition = 'none';
    this.home.style.opacity = String(clamp(p * 1.6, 0, 1));
    this.home.style.transform = `scale(${1.12 - 0.12 * p})`;
  }

  homeDragEnd(up, dx, v, paused) {
    this.el.classList.remove('home-dragging');
    this.home.style.transition = '';
    if (this.switcherOpen) {
      if (up > 40) this.closeSwitcher(true);
      return;
    }
    const wins = this.dragWins || [];
    this.dragWins = null;
    if (!wins.length) {
      // On the Home Screen, a pause opens the App Switcher.
      if (up > 60 && this.recents.length) this.openSwitcher();
      else if (this.strip && this.spread !== 1) this.scrollToSpread(1, true);
      return;
    }
    if (paused && up > this.H * 0.16 && v > -0.6) {
      for (const w of wins) w.el.style.transform = w.el.style.clipPath = '';
      this.home.style.opacity = this.home.style.transform = '';
      this.openSwitcher(true);
      return;
    }
    if (up > 70 || v < -0.5) {
      const st = this.dragState;
      for (const w of wins) {
        w.el.style.transform = '';
        w.el.style.clipPath = this.winClip(this.winRect(w.id));
      }
      this.goHome(st);
      return;
    }
    for (const w of wins) {
      const from = { transform: w.el.style.transform, clipPath: w.el.style.clipPath };
      w.el.style.transform = '';
      w.el.style.clipPath = this.winClip(this.winRect(w.id));
      w.el.animate([from, { transform: 'none', clipPath: w.el.style.clipPath }], { duration: 380, easing: OPEN_EASE });
    }
    const hf = { opacity: this.home.style.opacity, transform: this.home.style.transform };
    this.home.style.opacity = this.home.style.transform = '';
    this.home.animate([hf, { opacity: 0, transform: 'scale(1.12)' }], { duration: 300 });
  }

  /* ------------------------------------------------------ app switcher */

  openSwitcher(fromApp) {
    const ids = this.recents.filter((id) => this.windows.has(id));
    if (!ids.length) return;
    this.switcherOpen = true;
    this.keyboard.close();
    const inner = this.mode === 'inner' && !this.el.classList.contains('portrait');
    const k = inner ? 0.5 : 0.66;
    const cw = this.W * k;
    const chh = this.H * k;
    const order = [...ids].reverse(); // oldest left, newest right
    const cards = order.map((id) => {
      const w = this.windows.get(id);
      const snap = w.content.cloneNode(true);
      copyMedia(w.content, snap);
      const holder = h('div.sw-snap', { dataset: { theme: w.el.dataset.theme } }, snap);
      Object.assign(holder.style, { width: this.W + 'px', height: this.H + 'px', transform: `scale(${k})` });
      const card = h(
        'div.sw-card',
        { style: { width: cw + 'px', height: chh + 'px' } },
        h('div.sw-label', h('div.icon', { html: iconSVG(id) }), h('span', APPS[id].name)),
        h('div.sw-frame', holder)
      );
      let g = null;
      card.addEventListener('pointerdown', (e) => {
        g = { y0: e.clientY, x0: e.clientX, dy: 0 };
      });
      card.addEventListener('pointermove', (e) => {
        if (!g) return;
        const dy = Math.min(0, e.clientY - g.y0);
        if (Math.abs(e.clientX - g.x0) > Math.abs(dy) && !g.v) return;
        if (dy < -8) g.v = true;
        if (g.v) {
          g.dy = dy;
          card.style.transform = `translateY(${dy}px)`;
          card.style.opacity = String(1 + dy / 500);
        }
      });
      const end = () => {
        if (!g) return;
        const was = g;
        g = null;
        if (was.v && was.dy < -90) {
          card.animate([{ transform: card.style.transform, opacity: card.style.opacity }, { transform: `translateY(${-this.H}px)`, opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).finished.then(() => {
            card.remove();
            this.destroyWindow(id);
            if (!this.switcherEl.querySelector('.sw-card')) this.closeSwitcher(true);
          });
          this.suppressSw = true;
        } else if (was.v) {
          card.animate([{ transform: card.style.transform }, { transform: 'none' }], { duration: 250, easing: OPEN_EASE });
          card.style.transform = card.style.opacity = '';
          this.suppressSw = true;
        }
      };
      card.addEventListener('pointerup', end);
      card.addEventListener('pointercancel', end);
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.suppressSw) return (this.suppressSw = false);
        this.switchTo(id, card.querySelector('.sw-frame'));
      });
      return card;
    });
    const row = h('div.sw-row', h('div.sw-pad'), cards, h('div.sw-pad'));
    this.switcherEl.replaceChildren(row);
    this.switcherEl.onclick = () => this.closeSwitcher(true);
    this.el.classList.add('switching');
    for (const w of this.windows.values()) w.el.style.display = 'none';
    this.appsLayer.style.visibility = 'hidden';
    this.updateStatusTheme();
    requestAnimationFrame(() => {
      restoreScroll(this.switcherEl);
      const last = cards[cards.length - 1];
      const target = fromApp && cards.length > 1 ? last : cards[Math.max(0, cards.length - 2)] || last;
      row.scrollLeft = target.offsetLeft - (this.W - cw) / 2;
      cards.forEach((c, i) => c.animate([{ transform: 'scale(1.25)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, delay: Math.max(0, (cards.length - i) * 25), easing: OPEN_EASE, fill: 'backwards' }));
    });
  }

  closeSwitcher(toHome) {
    this.switcherOpen = false;
    this.el.classList.remove('switching');
    this.switcherEl.replaceChildren();
    this.appsLayer.style.visibility = '';
    if (toHome) {
      if (this.layout) {
        for (const w of this.visibleWins()) w.inst?.hide?.();
      }
      this.layout = null;
      this.applyLayout(false);
      this.home.animate([{ transform: 'scale(1.08)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 380, easing: OPEN_EASE });
    } else this.applyLayout(false);
  }

  switchTo(id, frameEl) {
    const src = this.rel(frameEl);
    this.switcherOpen = false;
    this.el.classList.remove('switching');
    this.appsLayer.style.visibility = '';
    const prevShown = new Set(this.shownIds());
    this.layout = { mode: 'full', a: id };
    const pair = this.pairs?.find((p) => p.includes(id));
    if (pair && this.windows.has(pair[0]) && this.windows.has(pair[1]) && this.mode === 'inner') this.layout = { mode: 'split', a: pair[0], b: pair[1] };
    this.focusId = id;
    this.recents = [id, ...this.recents.filter((x) => x !== id)];
    for (const w of this.windows.values()) if (prevShown.has(w.id)) w.el.style.display = 'none';
    this.applyLayout(true);
    this.switcherEl.replaceChildren();
    const w = this.windows.get(id);
    const rect = this.winRect(id);
    w.el.animate([this.zoomFrame(rect, src, 30), { transform: 'none', clipPath: this.winClip(rect) }], { duration: 420, easing: OPEN_EASE });
  }

  /* --------------------------------------------------- control centre */

  buildCC() {
    const S = this.cc;
    const tog = (key, glyph, cls = '', after) => {
      const el = h(`div.cc-tog${cls}`, { html: glyph });
      const sync = () => el.classList.toggle('on', !!S[key]);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        S[key] = !S[key];
        if (key === 'airplane' && S.airplane) {
          S.cell = false;
          S.wifi = false;
        }
        tick(0.2);
        this.syncCC();
        after && after();
      });
      el._sync = sync;
      return el;
    };
    this.ccToggles = [];
    const conn = h('div.cc-mod.cc-conn');
    const t1 = tog('airplane', G.plane, '.orange');
    const t2 = tog('cell', G.antenna, '.green');
    const t3 = tog('wifi', G.wifi, '.blue');
    const t4 = tog('bt', G.bt, '.blue');
    conn.append(t1, t2, t3, t4);
    this.ccToggles.push(t1, t2, t3, t4);

    this.ccMedia = h('div.cc-mod.cc-media');
    const focus = h('div.cc-mod.cc-focus', h('div.cc-focus-ic', { html: G.moon }), h('span', 'Focus'));
    focus.addEventListener('click', (e) => {
      e.stopPropagation();
      S.focus = !S.focus;
      tick(0.2);
      this.syncCC();
    });
    this.ccFocus = focus;
    const mirror = tog('mirror', G.mirror, '.mod1');
    const rot = tog('rot', G.rotlock, '.mod1.red');
    this.ccToggles.push(mirror, rot);
    const slider = (key, glyph, onSet) => {
      const fill = h('div.cc-fill');
      const el = h('div.cc-mod.cc-slider', fill, h('div.cc-sl-ic', { html: glyph }));
      const set = (v) => {
        S[key] = clamp(v, 0, 1);
        fill.style.height = S[key] * 100 + '%';
        onSet && onSet(S[key]);
      };
      el._set = set;
      let g;
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        el.setPointerCapture(e.pointerId);
        g = { y: this.pt(e).y, v: S[key], h: this.rel(el).h };
        el.classList.add('active');
      });
      el.addEventListener('pointermove', (e) => {
        if (!g) return;
        set(g.v + (g.y - this.pt(e).y) / g.h);
      });
      const up = () => {
        g = null;
        el.classList.remove('active');
      };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('click', (e) => e.stopPropagation());
      set(S[key]);
      return el;
    };
    const bright = slider('bright', G.sun, (v) => this.setBrightness(v));
    const vol = slider('vol', G.speaker);
    const flash = tog('flash', G.flashlight, '.mod1.white');
    this.ccToggles.push(flash);
    const app = (id, glyph) => {
      const el = h('div.cc-tog.mod1', { html: glyph });
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeCC();
        if (this.locked) this.unlock().then(() => this.openApp(id));
        else this.openApp(id);
      });
      return el;
    };
    const grid = h(
      'div.cc-grid',
      conn,
      this.ccMedia,
      focus,
      mirror,
      rot,
      bright,
      vol,
      flash,
      app('clock', G.timer),
      app('calculator', G.calc),
      app('camera', G.camera)
    );
    const top = h('div.cc-top', h('span.cc-carrier'), h('span.cc-plus', { html: G.plus }));
    this.ccEl.append(top, grid);
    this.ccEl.addEventListener('click', () => this.closeCC());
    let g;
    this.ccEl.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.cc-slider')) return;
      g = { y: this.pt(e).y };
    });
    this.ccEl.addEventListener('pointerup', (e) => {
      if (g && g.y - this.pt(e).y > 60) {
        this.suppressCCClick = true;
        this.closeCC();
      }
      g = null;
    });
    this.syncCC();
  }

  syncCC() {
    const S = this.cc;
    this.ccToggles.forEach((t) => t._sync());
    this.ccFocus.classList.toggle('on', S.focus);
    this.ccFocus.querySelector('span').textContent = S.focus ? 'Do Not Disturb' : 'Focus';
    this.status.classList.toggle('no-wifi', !S.wifi);
    this.status.classList.toggle('no-cell', !S.cell);
    this.status.classList.toggle('airplane', S.airplane);
    this.el.querySelector('.cc-carrier').textContent = S.airplane ? 'Airplane Mode' : this.cfg.carrier + (S.wifi ? '  ·  Wi‑Fi' : ' 5G');
    this.renderCCMedia();
    this.updateBattery();
  }

  renderCCMedia() {
    const m = this.nowPlaying;
    this.ccMedia.replaceChildren(
      h('div.ccm-art', { style: m ? { background: `linear-gradient(135deg, ${m.c[0]}, ${m.c[1]})` } : {} }, m ? null : h('span', '♫')),
      h('div.ccm-t', m ? m.title : 'Not Playing'),
      h('div.ccm-a', m ? m.artist : ''),
      h('div.ccm-ctl', h('span', { html: G.prev }), h('span.pp', { html: m?.playing ? G.pause : G.play }), h('span', { html: G.next }))
    );
    const pp = this.ccMedia.querySelector('.pp');
    pp.addEventListener('click', (e) => {
      e.stopPropagation();
      this.musicToggle?.();
    });
  }

  openCC() {
    if (this.ccOpen) return;
    this.ccOpen = true;
    this.keyboard.close();
    this.syncCC();
    this.el.classList.add('cc-open');
    tick(0.1);
  }
  closeCC() {
    if (!this.ccOpen) return;
    if (this.suppressCCClick) {
      this.suppressCCClick = false;
    }
    this.ccOpen = false;
    this.el.classList.remove('cc-open');
  }

  setBrightness(v) {
    this.dim.style.opacity = String((1 - v) * 0.75);
  }

  /* --------------------------------------------------------- banners */

  banner({ app = 'messages', title, body, sound = true, icon }) {
    if (this.asleep) {
      this.notifs = [{ app, title, body, time: 'now' }, ...(this.notifs || [])];
      this.renderLockNotifs();
      this.wake();
      return;
    }
    if (this.locked) {
      this.notifs = [{ app, title, body, time: 'now' }, ...(this.notifs || [])];
      this.renderLockNotifs();
      this.lockNotifs.firstChild?.animate([{ transform: 'translateY(-30px) scale(.9)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 450, easing: OPEN_EASE });
      if (sound) tone([1318, 1046], 220, 0.08);
      return;
    }
    const b = h(
      'div.banner',
      h('div.n-icon', { html: icon || iconSVG(app) }),
      h('div.n-body', h('div.n-top', h('b', title), h('span', 'now')), h('div.n-text', body))
    );
    this.bannerEl.append(b);
    if (sound) tone([1318, 1046], 220, 0.08);
    b.animate([{ transform: 'translateY(-140%) scale(.9)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 550, easing: 'cubic-bezier(.2,1.25,.4,1)' });
    let gone = false;
    const hide = () => {
      if (gone) return;
      gone = true;
      b.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-140%)', opacity: 0 }], { duration: 320, easing: 'ease-in', fill: 'forwards' }).finished.then(() => b.remove());
    };
    b.addEventListener('click', () => {
      hide();
      this.openApp(app);
    });
    let y0;
    b.addEventListener('pointerdown', (e) => (y0 = e.clientY));
    b.addEventListener('pointerup', (e) => {
      if (y0 != null && y0 - e.clientY > 20) hide();
    });
    setTimeout(hide, 5000);
  }

  /* --------------------------------------------------------- spotlight */

  openSpotlight() {
    if (this.jiggling) return;
    const results = h('div.sl-results');
    const all = Object.keys(APPS);
    const render = (q) => {
      const list = q ? all.filter((id) => APPS[id].name.toLowerCase().includes(q.toLowerCase())) : ['camera', 'settings', 'photos', 'messages', 'safari', 'notes', 'clock', 'calculator'];
      results.replaceChildren(
        h('div.sl-h', q ? 'Top Hits' : 'Siri Suggestions'),
        h(
          'div.sl-grid',
          list.slice(0, 8).map((id) => {
            const el = h('div.app', h('div.icon', { html: iconSVG(id) }), h('div.label', APPS[id].name));
            el.addEventListener('click', (e) => {
              e.stopPropagation();
              close();
              this.openApp(id, el.querySelector('.icon'));
            });
            return el;
          })
        )
      );
    };
    const field = new FakeField(this, { placeholder: 'Search', onChange: render, returnLabel: 'search', onSubmit: (v) => {
      const id = all.find((x) => APPS[x].name.toLowerCase().startsWith(v.toLowerCase()));
      close();
      if (id) this.openApp(id);
    } });
    const panel = h('div.spotlight', h('div.sl-bar', h('span.sl-ic', { html: G.search }), field.el, h('span.sl-cancel', 'Cancel')), results);
    const close = () => {
      field.blur();
      panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).finished.then(() => panel.remove());
      this.el.classList.remove('spot-open');
    };
    panel.querySelector('.sl-cancel').addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });
    panel.addEventListener('click', (e) => {
      if (e.target === panel) close();
    });
    render('');
    this.home.append(panel);
    this.el.classList.add('spot-open');
    panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    field.focus();
  }
}

/* ----------------------------------------------------- Dynamic Island */

class Island {
  constructor(os) {
    this.os = os;
    this.el = os.islandEl;
    this.compact = this.el.querySelector('.island-compact');
    this.expanded = this.el.querySelector('.island-expanded');
    this.activities = new Map();
    this.el.addEventListener('click', (e) => {
      e.stopPropagation();
      const act = [...this.activities.values()].pop();
      if (this.el.classList.contains('expanded')) return this.collapse();
      if (act?.expanded) this.expand(act.expanded(), 4000);
    });
    setInterval(() => this.renderCompact(), 1000);
  }

  // Persistent Live Activity (timer, music, call...)
  start(key, act) {
    this.activities.set(key, act);
    this.renderCompact();
  }
  end(key) {
    this.activities.delete(key);
    this.renderCompact();
  }

  renderCompact() {
    const act = [...this.activities.values()].pop();
    this.el.classList.toggle('active', !!act);
    if (!act) {
      this.compact.replaceChildren();
      return;
    }
    const r = act.compact();
    this.compact.replaceChildren(h('div.ic-lead', { html: r.top || '' }), h('div.ic-trail', r.bottom instanceof Node ? r.bottom : { html: r.bottom || '' }));
  }

  // Transient alert (AirPods connected, silent mode, Touch ID...)
  expand(content, ms = 3200) {
    clearTimeout(this.t);
    this.expanded.replaceChildren(content);
    this.el.classList.add('expanded');
    this.t = setTimeout(() => this.collapse(), ms);
  }
  collapse() {
    clearTimeout(this.t);
    this.el.classList.remove('expanded');
  }

  airpods() {
    tone([880, 1320], 160, 0.06);
    this.expand(
      h(
        'div.ie-row',
        h('div.ie-art', { html: G.airpods }),
        h('div.ie-txt', h('b', 'AirPods Pro'), h('span', 'Connected')),
        h('div.ie-ring', { html: `<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="14" fill="none" stroke="rgba(48,209,88,.25)" stroke-width="4"/><circle cx="18" cy="18" r="14" fill="none" stroke="#30D158" stroke-width="4" stroke-linecap="round" stroke-dasharray="${88 * 0.82} 88" transform="rotate(-90 18 18)"/></svg><span>82%</span>` })
      ),
      3600
    );
  }

  call(name = 'Mum') {
    const accept = h('div.ie-btn.green', { html: G.phoneUp });
    const decline = h('div.ie-btn.red', { html: G.phoneDown });
    const content = h('div.ie-row.call', h('div.ie-av', name[0]), h('div.ie-txt', h('span', 'mobile'), h('b', name)), decline, accept);
    let ring;
    const stop = () => {
      clearInterval(ring);
      this.collapse();
    };
    decline.addEventListener('click', (e) => {
      e.stopPropagation();
      stop();
    });
    accept.addEventListener('click', (e) => {
      e.stopPropagation();
      stop();
      const t0 = Date.now();
      this.start('call', {
        compact: () => {
          const s = Math.floor((Date.now() - t0) / 1000);
          return { top: `<span class="ic-green">${G.phoneUp}</span>`, bottom: `<span class="ic-vtext ic-green-t">${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</span>` };
        },
        expanded: () => {
          const end = h('div.ie-btn.red', { html: G.phoneDown });
          end.addEventListener('click', (e) => {
            e.stopPropagation();
            this.end('call');
            this.collapse();
          });
          return h('div.ie-row.call', h('div.ie-av', name[0]), h('div.ie-txt', h('span', 'mobile'), h('b', name)), end);
        },
      });
    });
    this.expand(content, 20000);
    const ringOnce = () => tone([440, 480], 900, 0.05);
    ringOnce();
    ring = setInterval(ringOnce, 2500);
    setTimeout(() => clearInterval(ring), 20000);
  }
}

function defaultNotifs() {
  return [
    { app: 'messages', title: 'Alex', body: 'bring the new phone tonight!! 👀', time: '9m ago' },
    { app: 'weather', title: 'Weather', body: 'Clear skies expected through the evening.', time: '1h ago' },
  ];
}

// Clones don't carry canvas pixels or live video; patch them in.
export function copyMedia(src, dst) {
  // Preserve scroll offsets so the snapshot matches what was on screen.
  const ss = [src, ...src.querySelectorAll('*')];
  const ds = [dst, ...dst.querySelectorAll('*')];
  for (let i = 0; i < ss.length && i < ds.length; i++) {
    if (ss[i].scrollTop || ss[i].scrollLeft) {
      ds[i].dataset.st = ss[i].scrollTop;
      ds[i].dataset.sl = ss[i].scrollLeft;
    }
  }
  const sc = src.querySelectorAll('canvas');
  const dc = dst.querySelectorAll('canvas');
  sc.forEach((c, i) => {
    const d = dc[i];
    if (!d || !d.getContext) return;
    try {
      d.width = c.width;
      d.height = c.height;
      d.getContext('2d').drawImage(c, 0, 0);
    } catch {}
  });
  const sv = src.querySelectorAll('video');
  const dv = dst.querySelectorAll('video');
  sv.forEach((v, i) => {
    const c = document.createElement('canvas');
    c.width = v.videoWidth || 2;
    c.height = v.videoHeight || 2;
    try {
      c.getContext('2d').drawImage(v, 0, 0);
    } catch {}
    c.className = v.className;
    c.style.cssText = v.style.cssText;
    dv[i]?.replaceWith(c);
  });
}

export function restoreScroll(root) {
  for (const n of root.querySelectorAll('[data-st]')) {
    n.scrollTop = +n.dataset.st;
    n.scrollLeft = +n.dataset.sl;
  }
}

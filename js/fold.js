// The book-style fold: a live clone of the right half of the inner display swings shut
// around the hinge, revealing the outer display on its back. Drivable by a finger.
import { h, clamp, ease, tween, tick, tone } from './util.js';
import { copyMedia, restoreScroll } from './os.js';

export const GEO = {
  // CSS px at iPad mini (163 px/in). Inner 7.58" @ ~1.4:1, outer 5.36".
  Wi: 1005,
  Hi: 718,
  Ri: 47,
  get Wo() {
    return this.Wi / 2 - 6;
  },
  get Ho() {
    return this.Hi - 6;
  },
  // Outer display: tight corners on the hinge (left) side, full iPhone corners on the right.
  Ro: '13px 49px 49px 13px',
  T: 33, // 5.2 mm per half
};

export class Folder {
  constructor(main) {
    this.m = main;
    this.busy = false;
    this.p = 0;
  }

  get os() {
    return this.m.os;
  }

  // ---- setup ----------------------------------------------------------------

  begin(dir) {
    if (this.busy) return false;
    this.busy = true;
    this.dir = dir; // 'close' | 'open'
    const m = this.m;
    const os = this.os;
    os.keyboard.close();
    os.closeCC();
    os.closeMenu();
    const portrait = m.portrait;
    this.vertical = portrait; // portrait: hinge is horizontal
    const W = portrait ? GEO.Hi : GEO.Wi;
    const H = portrait ? GEO.Wi : GEO.Hi;
    this.W = W;
    this.H = H;

    let outerClone = null;
    if (dir === 'open') {
      outerClone = m.screen.cloneNode(true);
      copyMedia(m.screen, outerClone);
      m.setFolded(false, true); // switch the live screen to the inner geometry (hidden under the flap)
    }
    const innerClone = m.screen.cloneNode(true);
    copyMedia(m.screen, innerClone);
    innerClone.classList.add('fold-clone');
    innerClone.removeAttribute('id');

    const R = GEO.Ri;
    const root = h('div.fold-root');
    const shadeA = h('div.fold-shade-a'); // shadow cast onto the static half
    const front = h('div.face.front', innerClone, h('div.face-shade'), h('div.face-glare'));
    const backInner = h('div.back-glass');
    if (outerClone) {
      outerClone.classList.add('fold-clone');
      outerClone.removeAttribute('id');
      outerClone.classList.remove('asleep');
      backInner.append(outerClone);
    }
    const back = h('div.face.back', backInner, h('div.face-shade'));
    const edge = h('div.fold-edge');
    const flap = h('div.flap', front, back, edge);
    root.append(shadeA, flap);
    m.device.append(root);
    this.root = root;
    this.flap = flap;
    this.front = front;
    this.back = back;
    this.edge = edge;
    this.shadeA = shadeA;
    m.device.classList.add('folding');
    m.stage.dataset.color = m.cfg.color;

    // The LEFT half is the cover: its back is the outer display, so the closed phone's hinge is on its left.
    const T = GEO.T;
    if (!portrait) {
      Object.assign(flap.style, { left: 0, top: 0, width: W / 2 + 'px', height: H + 'px', transformOrigin: '100% 50%' });
      Object.assign(innerClone.style, { left: 0, top: 0 });
      front.style.borderRadius = `${R}px 0 0 ${R}px`;
      Object.assign(edge.style, { left: -T + 'px', top: 0, width: T + 'px', height: H + 'px', transformOrigin: '100% 50%', transform: 'rotateY(-90deg)' });
      back.style.transform = `translateZ(${-T}px) rotateY(180deg)`;
      back.style.borderRadius = '16px 52px 52px 16px';
      Object.assign(shadeA.style, { left: W / 2 + 'px', top: 0, width: W / 2 + 'px', height: H + 'px', background: 'linear-gradient(to right, rgba(0,0,0,.9), rgba(0,0,0,.35))' });
      m.screen.style.clipPath = `inset(0 0 0 50% round 0 ${R}px ${R}px 0)`;
    } else {
      Object.assign(flap.style, { left: 0, top: 0, width: W + 'px', height: H / 2 + 'px', transformOrigin: '50% 100%' });
      Object.assign(innerClone.style, { left: 0, top: 0 });
      front.style.borderRadius = `${R}px ${R}px 0 0`;
      Object.assign(edge.style, { left: 0, top: -T + 'px', width: W + 'px', height: T + 'px', transformOrigin: '50% 100%', transform: 'rotateX(90deg)' });
      back.style.transform = `translateZ(${-T}px) rotateX(180deg)`;
      back.style.borderRadius = '16px 16px 52px 52px';
      if (!outerClone) backInner.style.borderRadius = '10px 10px 46px 46px';
      if (outerClone) {
        // Outer display is portrait; the folded stack is landscape until it turns upright.
        Object.assign(backInner.style, { width: GEO.Wo + 'px', height: GEO.Ho + 'px', left: (W - GEO.Wo) / 2 + 'px', top: (H / 2 - GEO.Ho) / 2 + 'px', transform: 'rotate(90deg)' });
      }
      Object.assign(shadeA.style, { left: 0, top: H / 2 + 'px', width: W + 'px', height: H / 2 + 'px', background: 'linear-gradient(to bottom, rgba(0,0,0,.9), rgba(0,0,0,.35))' });
      m.screen.style.clipPath = `inset(50% 0 0 0 round 0 0 ${R}px ${R}px)`;
    }
    if (outerClone) {
      const k = backInner;
      if (!portrait) Object.assign(k.style, { width: GEO.Wo + 'px', height: GEO.Ho + 'px', left: '3px', top: '3px' });
      Object.assign(outerClone.style, { left: 0, top: 0 });
    }
    m.screen.style.pointerEvents = 'none';
    requestAnimationFrame(() => {
      restoreScroll(innerClone);
      if (outerClone) restoreScroll(outerClone);
    });
    this.set(dir === 'open' ? 1 : 0);
    return true;
  }

  // p: 0 = flat open, 1 = closed.
  set(p) {
    this.p = p;
    const T = GEO.T;
    const a = 180 * p;
    const rot = this.vertical ? `rotateX(${-a}deg)` : `rotateY(${a}deg)`;
    // Rotate about the middle of the slab so the closed outer display lands at z = 0 (no size jump).
    this.flap.style.transform = `translateZ(${-T / 2}px) ${rot} translateZ(${T / 2}px)`;
    const sFront = 0.72 * Math.pow(clamp(a / 90, 0, 1), 1.6);
    const sBack = 0.72 * Math.pow(clamp((180 - a) / 90, 0, 1), 1.6);
    this.front.querySelector('.face-shade').style.opacity = sFront;
    this.back.querySelector('.face-shade').style.opacity = sBack;
    this.front.style.visibility = a < 90 ? 'visible' : 'hidden';
    this.back.style.visibility = a > 90 ? 'visible' : 'hidden';
    const g = this.front.querySelector('.face-glare');
    g.style.opacity = Math.sin((a / 180) * Math.PI) * 0.9;
    g.style.backgroundPosition = `${p * 200 - 100}% 0`;
    this.edge.style.filter = `brightness(${0.55 + 0.6 * Math.sin((a / 180) * Math.PI)})`;
    this.shadeA.style.opacity = String(clamp((p - 0.15) / 0.85, 0, 1) * 0.85);
    // Slide so the folded stack ends centred; in portrait it then turns upright.
    const W = this.W;
    const H = this.H;
    const m = this.m;
    const k = m.k;
    let sx = 0;
    let sy = 0;
    let extra = '';
    if (!this.vertical) sx = (-W / 4) * ease.inOut(p);
    else {
      sy = (-H / 4) * ease.inOut(p);
      const r = clamp((p - 0.82) / 0.18, 0, 1);
      if (r) extra = ` translate(${W / 2}px, ${(3 * H) / 4}px) rotate(${ease.inOut(r) * -90}deg) translate(${-W / 2}px, ${(-3 * H) / 4}px)`;
    }
    const ox = (m.vw - W * k) / 2;
    const oy = (m.vh - H * k) / 2;
    m.device.style.transform = `translate(${ox}px, ${oy}px) scale(${k}) translate(${sx}px, ${sy}px)${extra}`;
    // Perspective follows the viewer, who stays centred on the iPad.
    const cx = m.vw / 2;
    const cy = m.vh / 2;
    const lx = (cx - ox) / k - sx;
    const ly = (cy - oy) / k - sy;
    this.root.style.perspectiveOrigin = `${lx}px ${ly}px`;
  }

  // Animate to a target and finish/revert. Returns a promise.
  run(to, duration) {
    return new Promise((resolve) => {
      const from = this.p;
      const d = duration ?? 950 * Math.abs(to - from) + 120;
      tween({
        from,
        to,
        duration: d,
        easing: ease.inOut,
        onUpdate: (v) => this.set(v),
        onDone: () => {
          this.finish(to === 1);
          resolve();
        },
      });
    });
  }

  finish(closed) {
    const m = this.m;
    this.root.remove();
    m.device.classList.remove('folding');
    m.screen.style.clipPath = '';
    m.screen.style.pointerEvents = '';
    this.busy = false;
    if (closed) {
      tone([95, 140], 70, 0.25);
      tick(0.4);
      m.setFolded(true);
      // The outer display wakes as the magnets catch.
      m.screen.animate([{ opacity: 0, filter: 'brightness(.4)' }, { opacity: 1, filter: 'brightness(1)' }], { duration: 380, easing: 'ease-out' });
    } else {
      m.setFolded(false);
      if (this.dir === 'open') tick(0.2);
    }
  }

  async toggle() {
    if (this.busy) return;
    const closing = !this.m.folded;
    if (!this.begin(closing ? 'close' : 'open')) return;
    await this.run(closing ? 1 : 0);
  }
}

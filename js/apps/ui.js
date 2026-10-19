// Shared UIKit-style building blocks for the apps.
import { h, tick } from '../util.js';
import { G } from '../icons.js';

// Navigation stack. On iPhone Duo the back button and toolbar items live in the window's
// vertical rail (pass `api`); sidebars instead get a compact inline header (`inline: true`).
export function navStack(root, { onChange, api, inline } = {}) {
  const el = h('div.nav' + (inline ? '.inline' : ''));
  root.append(el);
  const stack = [];
  const useRail = !!api && !inline;
  const syncRail = () => {
    if (!useRail) return;
    const page = stack[stack.length - 1];
    if (!page) return;
    api.rail.top([stack.length > 1 ? backBtn(() => nav.pop()) : null, ...[].concat(page._view.right || [])]);
    if (page._view.bottom !== undefined) api.rail.bottom(page._view.bottom);
  };
  const nav = {
    el,
    stack,
    push(view, animated = true) {
      const page = buildPage(view, inline);
      page._view = view;
      el.append(page);
      const prev = stack[stack.length - 1];
      stack.push(page);
      syncRail();
      if (animated && prev) {
        page.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.25,1)' });
        prev.animate([{ transform: 'none', filter: 'brightness(1)' }, { transform: 'translateX(-30%)', filter: 'brightness(.7)' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.25,1)', fill: 'forwards' }).finished.then(() => {
          prev.style.visibility = 'hidden';
        });
      } else if (prev) prev.style.visibility = 'hidden';
      onChange && onChange(stack.length);
      return page;
    },
    pop(animated = true) {
      if (stack.length < 2) return;
      const page = stack.pop();
      const prev = stack[stack.length - 1];
      prev.style.visibility = '';
      prev.getAnimations().forEach((a) => a.cancel());
      syncRail();
      if (animated) {
        prev.animate([{ transform: 'translateX(-30%)', filter: 'brightness(.7)' }, { transform: 'none', filter: 'brightness(1)' }], { duration: 380, easing: 'cubic-bezier(.2,.9,.25,1)' });
        page.animate([{ transform: 'none' }, { transform: 'translateX(100%)' }], { duration: 380, easing: 'cubic-bezier(.2,.9,.25,1)', fill: 'forwards' }).finished.then(() => page.remove());
      } else page.remove();
      onChange && onChange(stack.length);
    },
    reset(view) {
      el.replaceChildren();
      stack.length = 0;
      return nav.push(view, false);
    },
  };
  // Swipe from the left edge to go back.
  let g = null;
  el.addEventListener('pointerdown', (e) => {
    if (stack.length < 2) return;
    const r = el.getBoundingClientRect();
    if (e.clientX - r.left > 22) return;
    g = { x0: e.clientX, w: r.width, page: stack[stack.length - 1], prev: stack[stack.length - 2] };
    el.setPointerCapture(e.pointerId);
    g.prev.style.visibility = '';
    g.prev.getAnimations().forEach((a) => a.cancel());
  });
  el.addEventListener('pointermove', (e) => {
    if (!g) return;
    const dx = Math.max(0, e.clientX - g.x0);
    g.dx = dx;
    g.page.style.transform = `translateX(${dx}px)`;
    g.prev.style.transform = `translateX(${-30 + (dx / g.w) * 30}%)`;
    g.prev.style.filter = `brightness(${0.7 + (dx / g.w) * 0.3})`;
  });
  const end = () => {
    if (!g) return;
    const { page, prev, dx = 0, w } = g;
    g = null;
    page.style.transform = prev.style.transform = prev.style.filter = '';
    if (dx > w * 0.3) {
      stack.pop();
      page.remove();
      syncRail();
      onChange && onChange(stack.length);
    } else {
      prev.style.visibility = 'hidden';
    }
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  return nav;
}

function buildPage(view, inline) {
  const scroller = h('div.page-scroll.scroll');
  const big = view.large !== false && view.title ? h('div.large-title', view.title) : null;
  if (big) scroller.append(big);
  if (view.content) scroller.append(view.content);
  const page = h('div.page' + (view.cls ? '.' + view.cls : ''), scroller);
  if (inline) {
    page.append(
      h(
        'div.ihead',
        view.left || null,
        h('div.ih-t', h('b', view.title || ''), view.subtitle ? h('span', view.subtitle) : null),
        h('div.ih-r', ...[].concat(view.right || []))
      )
    );
    page.classList.add('has-ihead');
  }
  page._scroller = scroller;
  return page;
}

const CHEV_L = `<svg viewBox="0 0 24 24"><path d="M14.5 5 7.5 12l7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function backBtn(fn) {
  return glassBtn(CHEV_L, fn);
}

// Round Liquid Glass button (49 pt), the building block of the rail.
export function glassBtn(glyph, fn, cls = '') {
  const b = h('div.rb' + cls, { html: glyph });
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    fn && fn();
  });
  return b;
}

// Several buttons sharing one glass capsule.
export function rgroup(...btns) {
  return h('div.rgroup', ...btns);
}

// Grouped inset list section.
export function section(rows, { header, footer, cls = '' } = {}) {
  return h(
    'div.sec' + (cls ? '.' + cls : ''),
    header ? h('div.sec-h', header) : null,
    h('div.sec-b', rows.filter(Boolean).map(row)),
    footer ? h('div.sec-f', footer) : null
  );
}

export function row(r) {
  if (r instanceof Node) return r;
  const icon = r.icon ? h('div.r-ic', { style: { background: r.icon.bg }, html: r.icon.svg || '' }, r.icon.text || null) : null;
  let right = null;
  if (r.toggle) {
    right = toggle(r.toggle.value, r.toggle.onChange);
  } else {
    right = h('div.r-right', r.detail != null ? h('span.r-detail', r.detail) : null, r.chevron !== false && r.onClick ? h('span.r-chev', { html: G.chevron }) : null);
  }
  const el = h(
    'div.r' + (r.onClick ? '.tap' : '') + (r.cls ? '.' + r.cls : ''),
    icon,
    h('div.r-main', h('div.r-t', r.title), r.sub ? h('div.r-s', r.sub) : null),
    right
  );
  if (r.onClick)
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      r.onClick(el);
    });
  return el;
}

export function toggle(value, onChange) {
  const t = h('div.switch' + (value ? '.on' : ''), h('i'));
  t.addEventListener('click', (e) => {
    e.stopPropagation();
    t.classList.toggle('on');
    tick(0.15);
    onChange && onChange(t.classList.contains('on'));
  });
  return t;
}

// Vertical Liquid Glass tab bar for the rail; the selected tab gets a lens highlight.
export function tabBar(tabs, onSelect, active = 0) {
  const items = tabs.map((t, i) => {
    const it = h('div.rb' + (i === active ? '.on' : ''), { html: t.icon, title: t.label });
    it.addEventListener('click', (e) => {
      e.stopPropagation();
      items.forEach((x) => x.classList.remove('on'));
      it.classList.add('on');
      onSelect(i);
    });
    return it;
  });
  return h('div.rgroup.vtabs', ...items);
}

export function searchField(api, placeholder = 'Search', onChange) {
  const f = api.field({ placeholder, onChange, returnLabel: 'search' });
  return h('div.searchbar', h('span.sb-ic', { html: G.search }), f.el, h('span.sb-mic', { html: MIC }));
}

export const SEARCH = G.search;
export const DOTS = `<svg viewBox="0 0 24 24"><g fill="currentColor"><circle cx="5.5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="18.5" cy="12" r="1.9"/></g></svg>`;
export const MIC = `<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M6 11a6 6 0 0 0 12 0M12 17v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

// SF-symbol style glyph tiles for Settings rows.
export const S = {
  plane: G.plane,
  wifi: G.wifi,
  bt: G.bt,
  antenna: G.antenna,
  link: `<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  battery: `<svg viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="4" y="9" width="11" height="6" rx="1" fill="currentColor"/><rect x="21" y="10" width="1.6" height="4" rx=".8" fill="currentColor"/></svg>`,
  gear: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10.3 2h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9L2 13.7v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8ZM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/></svg>`,
  access: `<svg viewBox="0 0 24 24"><circle cx="12" cy="4.5" r="2" fill="currentColor"/><path d="M5 8l7 1.5L19 8M12 9.5V14l-3 7M12 14l3 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  camera: G.camera,
  cc: `<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="5" rx="2.5"/><rect x="3" y="14" width="18" height="5" rx="2.5"/></g><circle cx="7.5" cy="7.5" r="1.6" fill="currentColor"/><circle cx="16.5" cy="16.5" r="1.6" fill="currentColor"/></svg>`,
  sun: G.sun,
  grid: `<svg viewBox="0 0 24 24"><g fill="currentColor"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></g></svg>`,
  search: G.search,
  siri: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#fff" stroke-width="2"/><path d="M4 12c3-4 5 4 8 0s5 4 8 0" fill="none" stroke="#fff" stroke-width="1.6"/></svg>`,
  standby: `<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="12" r="2.4" fill="currentColor"/><rect x="13" y="10" width="6" height="1.8" rx=".9" fill="currentColor"/><rect x="13" y="13" width="4" height="1.8" rx=".9" fill="currentColor"/></svg>`,
  flower: `<svg viewBox="0 0 24 24"><g fill="currentColor">${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="12" cy="7" rx="2.6" ry="4.2" transform="rotate(${a} 12 12)" opacity=".9"/>`).join('')}</g></svg>`,
  bell: G.bell,
  speaker: G.speaker,
  moon: G.moon,
  hourglass: `<svg viewBox="0 0 24 24"><path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  touchid: G.touchid,
  sos: `<svg viewBox="0 0 24 24"><text x="12" y="16" text-anchor="middle" font-size="9.5" font-weight="800" fill="currentColor" font-family="-apple-system,system-ui">SOS</text></svg>`,
  hand: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 11V5a1.5 1.5 0 0 1 3 0v5V3.5a1.5 1.5 0 0 1 3 0V10V5a1.5 1.5 0 0 1 3 0v7.5V9a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.6 15a1.6 1.6 0 0 1 2.5-2Z"/></svg>`,
  appstore: `<svg viewBox="0 0 24 24"><g stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="13" y1="4" x2="7" y2="18"/><line x1="11" y1="4" x2="17" y2="18"/><line x1="5" y1="14" x2="19" y2="14"/></g></svg>`,
  wallet: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18" stroke="currentColor" stroke-width="2"/></svg>`,
  cloud: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 19a5 5 0 0 1-.7-9.95A6 6 0 0 1 17.8 8.1 4.5 4.5 0 0 1 17.5 19Z"/></svg>`,
  key: `<svg viewBox="0 0 24 24"><circle cx="8" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 12h9M18 12v3M21 12v2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  apps: `<svg viewBox="0 0 24 24"><g fill="currentColor"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" opacity=".55"/></g></svg>`,
  game: `<svg viewBox="0 0 24 24"><g fill="currentColor"><circle cx="8" cy="8" r="4"/><circle cx="16" cy="8" r="4" opacity=".75"/><circle cx="8" cy="16" r="4" opacity=".75"/><circle cx="16" cy="16" r="4" opacity=".5"/></g></svg>`,
  info: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  fold: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="8" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M13 5.5l7-1.5v16l-7-1.5Z" fill="currentColor" opacity=".8"/></svg>`,
};

export const tile = (bg, svg) => ({ bg, svg });

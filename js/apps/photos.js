import { h } from '../util.js';
import { makePhoto } from '../wallpaper.js';
import { G } from '../icons.js';
import { tabBar, glassBtn } from './ui.js';

// Synthetic library so Photos never looks empty.
let generated;
function library() {
  if (!generated) generated = Array.from({ length: 36 }, (_, i) => ({ id: -i - 1, src: makePhoto(i * 977 + 13, 300, 300), gen: true }));
  return generated;
}

export default {
  theme: 'dark',
  mount(root, api) {
    const grid = h('div.ph-grid');
    const count = h('span');
    const scroll = h('div.ph-scroll.scroll');
    const head = h('div.ph-head', h('div', h('b', 'Photos'), count));
    const colls = h('div.ph-coll');
    scroll.append(head, grid, colls);
    const wrap = h('div.ph', scroll);
    root.append(wrap);
    const LIB = `<svg viewBox="0 0 24 24"><rect x="6" y="3" width="15" height="13" rx="2.5" fill="currentColor" opacity=".55"/><rect x="3" y="7" width="15" height="13" rx="2.5" fill="currentColor"/><path d="M5 18l4-4 3 3 2-2 4 3" fill="none" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
    const COLL = `<svg viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="11" rx="2.5" fill="currentColor"/><path d="M6 6.5h12M8 4h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
    api.rail.bottom([tabBar([{ icon: LIB, label: 'Library' }, { icon: COLL, label: 'Collections' }], (i) => {
      const t = i === 0 ? grid : colls;
      scroll.scrollTo({ top: t.offsetTop - 40, behavior: 'smooth' });
    }), glassBtn(G.search)]);

    const render = () => {
      const items = [...(api.os.photos || []), ...library()];
      const all = [...items].reverse(); // oldest first, newest at the bottom like iOS
      count.textContent = (5000 + items.length).toLocaleString() + ' Items';
      grid.replaceChildren(
        ...all.map((p) => {
          const d = h('div', { style: { backgroundImage: `url(${p.src})` } });
          d.addEventListener('click', () => view(p));
          return d;
        })
      );
      const cards = [
        ['Recent Days', items[0]?.src],
        ['People & Pets', library()[4].src],
        ['Memories', library()[9].src],
        ['Trips', library()[14].src],
        ['Featured', library()[20].src],
      ];
      colls.replaceChildren(
        h('h3', 'Collections'),
        h('div.ph-row', cards.map(([t, src]) => h('div.ph-card', { style: { backgroundImage: `url(${src})` } }, h('b', t))))
      );
      requestAnimationFrame(() => {
        if (!scrolled) scroll.scrollTop = grid.offsetTop + grid.offsetHeight - scroll.clientHeight + 40;
      });
    };
    let scrolled = false;
    scroll.addEventListener('touchstart', () => (scrolled = true), { passive: true });

    const view = (p) => {
      const close = h('div.gbtn', { html: G.back });
      const d = new Date(p.id > 0 ? p.id : Date.now() - 86400000 * 30);
      const v = h(
        'div.ph-view',
        h('img', { src: p.src }),
        h('div.ph-meta', d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }), h('small', d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }))),
        close
      );
      close.addEventListener('click', (e) => {
        e.stopPropagation();
        v.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).finished.then(() => v.remove());
      });
      wrap.append(v);
      v.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.2,.9,.25,1)' });
    };

    const cols = () => {
      const w = root.clientWidth;
      wrap.style.setProperty('--cols', w > 700 ? 7 : w > 450 ? 4 : 3);
    };
    render();
    return {
      refresh: render,
      resize: cols,
      show: () => {
        cols();
        render();
      },
    };
  },
};

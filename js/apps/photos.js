import { h } from '../util.js';
import { makePhoto } from '../wallpaper.js';
import { G } from '../icons.js';

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
    const head = h('div.ph-head', h('div', h('b', 'Photos'), count), h('div.gbtn', { html: G.search }));
    const colls = h('div.ph-coll');
    scroll.append(head, grid, colls);
    const wrap = h('div.ph', scroll);
    root.append(wrap);

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

import { h } from '../util.js';
import { G } from '../icons.js';
import { tabBar, glassBtn } from './ui.js';
import { SONGS } from '../data.js';

const HOME = `<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4Z" fill="currentColor"/></svg>`;
const NEW = `<svg viewBox="0 0 24 24"><g fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></g></svg>`;
const RADIO = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.6 4.6a10.5 10.5 0 0 0 0 14.8M19.4 4.6a10.5 10.5 0 0 1 0 14.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const LIB = `<svg viewBox="0 0 24 24"><path d="M4 4v16M9 4v16M14 4l6 15" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`;

// Playback state is global so the Dynamic Island and Control Centre can share it.
const P = { idx: -1, pos: 0, playing: false, t: 0 };

export default {
  theme: 'dark',
  mount(root, api) {
    const os = api.os;
    const wrap = h('div.mus');
    root.append(wrap);
    let np = null;

    const grid = (list) =>
      h(
        'div.mus-grid',
        list.map((s, i) => {
          const it = h('div.mus-item', h('div.art', { style: { background: `linear-gradient(135deg, ${s.c[0]}, ${s.c[1]})` } }), h('b', s.title), h('span', s.artist));
          it.addEventListener('click', () => play(SONGS.indexOf(s), true));
          return it;
        })
      );
    const content = h(
      'div.page-scroll.scroll',
      { style: { paddingTop: '60px', paddingBottom: '200px' } },
      h('div.large-title', 'Home'),
      h('div', { style: { padding: '0 20px 12px', font: '700 22px var(--display)' } }, 'Top Picks for You'),
      grid(SONGS),
      h('div', { style: { padding: '24px 20px 12px', font: '700 22px var(--display)' } }, 'Recently Played'),
      grid([...SONGS].reverse())
    );
    const mini = h('div.mini');
    mini.addEventListener('click', () => openNP());
    const bar = tabBar(
      [
        { icon: HOME, label: 'Home' },
        { icon: NEW, label: 'New' },
        { icon: RADIO, label: 'Radio' },
        { icon: LIB, label: 'Library' },
      ],
      () => {}
    );
    wrap.append(content, mini);
    api.rail.bottom([bar, glassBtn(G.search)]);
    api.rail.top([glassBtn(`<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 21c0-4.5 3.6-7 8-7s8 2.5 8 7Z" fill="currentColor"/></svg>`)]);

    const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
    const cur = () => SONGS[P.idx];

    function renderMini() {
      const s = cur();
      mini.style.display = s ? '' : 'none';
      if (!s) return;
      const pp = h('span', { html: P.playing ? G.pause : G.play });
      pp.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle();
      });
      const nx = h('span', { html: G.next });
      nx.addEventListener('click', (e) => {
        e.stopPropagation();
        next();
      });
      mini.replaceChildren(h('div.art', { style: { background: `linear-gradient(135deg, ${s.c[0]}, ${s.c[1]})` } }), h('b', s.title), pp, nx);
    }

    function openNP() {
      const s = cur();
      if (!s) return;
      np?.remove();
      const bar = h('i');
      const t1 = h('span');
      const t2 = h('span');
      const pp = h('span.pp', { html: P.playing ? G.pause : G.play });
      const prev = h('span', { html: G.prev });
      const nxt = h('span', { html: G.next });
      pp.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle();
      });
      prev.addEventListener('click', (e) => {
        e.stopPropagation();
        P.pos > 3 ? (P.pos = 0) : play((P.idx + SONGS.length - 1) % SONGS.length, true);
        sync();
      });
      nxt.addEventListener('click', (e) => {
        e.stopPropagation();
        next();
      });
      const grab = h('div.np-grab');
      np = h(
        'div.np' + (P.playing ? '' : '.paused'),
        h('div.np-bg', { style: { background: `linear-gradient(135deg, ${s.c[0]}, ${s.c[1]})` } }),
        grab,
        h('div.np-art', { style: { background: `linear-gradient(135deg, ${s.c[0]}, ${s.c[1]})` } }),
        h('div.np-right', h('div.np-info', h('b', s.title), h('span', s.artist)), h('div.np-prog', h('div.bar', bar), h('div.times', t1, t2)), h('div.np-ctl', prev, pp, nxt))
      );
      np._u = () => {
        bar.style.width = (P.pos / s.len) * 100 + '%';
        t1.textContent = fmt(P.pos);
        t2.textContent = '-' + fmt(s.len - P.pos);
        pp.innerHTML = P.playing ? G.pause : G.play;
        np.classList.toggle('paused', !P.playing);
      };
      np._u();
      let y0 = null;
      np.addEventListener('pointerdown', (e) => (y0 = e.clientY));
      np.addEventListener('pointerup', (e) => {
        if (y0 != null && e.clientY - y0 > 80) closeNP();
        y0 = null;
      });
      grab.addEventListener('click', closeNP);
      wrap.append(np);
      np.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.9,.25,1)' });
    }
    function closeNP() {
      const n = np;
      np = null;
      n?.animate([{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: 350, easing: 'cubic-bezier(.3,.8,.3,1)', fill: 'forwards' }).finished.then(() => n.remove());
    }

    function play(i, open) {
      if (P.idx !== i) P.pos = 0;
      P.idx = i;
      P.playing = true;
      sync();
      if (open) openNP();
    }
    function toggle() {
      if (P.idx < 0) P.idx = 0;
      P.playing = !P.playing;
      sync();
    }
    function next() {
      play((P.idx + 1) % SONGS.length, false);
      if (np) openNP();
    }
    function sync() {
      renderMini();
      np?._u();
      const s = cur();
      os.nowPlaying = s ? { ...s, playing: P.playing } : null;
      os.renderCCMedia?.();
      if (s && P.playing) {
        os.island.start('music', {
          compact: () => ({
            top: `<div class="ic-art" style="background:linear-gradient(135deg,${s.c[0]},${s.c[1]})"></div>`,
            bottom: `<div class="ic-wave" style="color:${s.c[0]}"><i></i><i></i><i></i><i></i></div>`,
          }),
          expanded: () => {
            const pp = h('span', { html: P.playing ? G.pause : G.play });
            pp.addEventListener('click', (e) => {
              e.stopPropagation();
              toggle();
              os.island.collapse();
            });
            const nx = h('span', { html: G.next });
            nx.addEventListener('click', (e) => {
              e.stopPropagation();
              next();
            });
            return h('div.ie-row', h('div.ie-art', { style: { borderRadius: '12px', background: `linear-gradient(135deg, ${s.c[0]}, ${s.c[1]})` } }), h('div.ie-txt', h('b', s.title), h('span', s.artist)), h('div.ie-media', pp, nx));
          },
        });
      } else os.island.end('music');
    }
    os.musicToggle = toggle;

    clearInterval(P.t);
    P.t = setInterval(() => {
      if (!P.playing || P.idx < 0) return;
      P.pos += 0.5;
      if (P.pos >= cur().len) next();
      np?._u();
    }, 500);

    renderMini();
    return {};
  },
};

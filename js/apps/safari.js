import { h } from '../util.js';
import { G } from '../icons.js';

const FAVS = [
  ['Apple', '#1c1c1e', '', 'https://www.apple.com'],
  ['Wikipedia', '#fff', 'W', 'https://en.m.wikipedia.org'],
  ['Google', '#fff', 'G', 'https://www.google.com'],
  ['YouTube', '#ff0033', '▶', 'https://m.youtube.com'],
  ['BBC', '#000', 'B', 'https://www.bbc.co.uk'],
  ['Reddit', '#ff4500', 'r', 'https://www.reddit.com'],
  ['Instagram', 'linear-gradient(45deg,#fdc468,#df4996,#4f5bd5)', '◎', 'https://www.instagram.com'],
  ['GitHub', '#24292f', '⌘', 'https://github.com'],
];
const DOTS = `<svg viewBox="0 0 24 24"><g fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></g></svg>`;
const TABS = `<svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 3h10a3 3 0 0 1 3 3v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

export default {
  theme: 'dark',
  mount(root, api) {
    const frame = h('iframe.saf-frame', { referrerpolicy: 'no-referrer' });
    const favs = h(
      'div.favs',
      FAVS.map(([n, bg, ch, url]) => {
        const f = h('div.fav', h('i', { style: { background: bg, color: bg === '#fff' ? '#000' : '#fff' } }, ch), n);
        f.addEventListener('click', () => go(url));
        return f;
      })
    );
    const page = h(
      'div.saf-page.scroll',
      h('h3', 'Favorites'),
      favs,
      h('h3', 'Privacy Report'),
      h('div.priv', h('span', { style: { fontSize: '26px' } }, '🛡'), h('b', '27'), h('span', { style: { color: 'rgba(235,235,245,.7)', fontSize: '15px' } }, 'In the last seven days, Safari has prevented 27 trackers from profiling you.')),
      h('h3', 'Reading List'),
      h('div.priv', h('span', { style: { color: 'rgba(235,235,245,.7)' } }, 'Save articles to read later — they’ll appear here.'))
    );
    const back = h('div.bi', { html: G.back });
    const field = api.field({
      placeholder: 'Search or enter website',
      returnLabel: 'go',
      onFocus: () => wrap.classList.add('typing'),
      onBlur: () => wrap.classList.remove('typing'),
      onSubmit: (v) => {
        api.keyboard.close();
        go(v);
      },
    });
    const bar = h('div.saf-bar', back, field.el, h('div.bi', { html: DOTS }), h('div.bi', { html: TABS }));
    const wrap = h('div.saf', page, frame, bar);
    root.append(wrap);
    back.addEventListener('click', (e) => {
      e.stopPropagation();
      wrap.classList.remove('loaded');
      frame.removeAttribute('src');
      field.set('');
    });

    function go(q) {
      q = q.trim();
      if (!q) return;
      let url;
      if (/^https?:\/\//i.test(q)) url = q;
      else if (/^[\w-]+(\.[\w-]+)+/.test(q)) url = 'https://' + q;
      else url = 'https://duckduckgo.com/?q=' + encodeURIComponent(q);
      frame.src = url;
      wrap.classList.add('loaded');
      field.set(url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]);
    }
    return {};
  },
};

// Lightweight but believable screens for the apps that don't need real behaviour.
import { h, rng } from '../util.js';
import { iconSVG, G } from '../icons.js';
import { navStack, searchField, section, glassBtn } from './ui.js';
import { APPS } from './registry.js';

const card = (k, v, s, bg, cls = '') => h('div.gen-card' + cls, { style: bg ? { background: bg } : {} }, h('div.k', k), h('div.v', v), s ? h('div.s', s) : null);

const CONTENT = {
  mail: (api) =>
    h(
      'div',
      searchField(api),
      section(
        [
          ['Apple', 'Your receipt from Apple', 'Thank you for your purchase of iPhone Duo.'],
          ['Alex', 'Saturday plans', 'Are we still on for brunch? I can book the place near…'],
          ['Amazon', 'Your package has shipped', 'Arriving tomorrow by 9pm.'],
          ['Netflix', 'New on Netflix this week', 'Here’s what’s new and trending…'],
          ['Bank', 'Your monthly statement is ready', 'Log in to view your statement.'],
          ['LinkedIn', 'You appeared in 12 searches', 'See who’s looking at your profile.'],
        ].map(([from, sub, prev]) => ({ title: from, sub: sub + ' — ' + prev, detail: '9:41', onClick: () => {} })),
        { header: 'Inbox' }
      )
    ),
  reminders: () =>
    h(
      'div.gen-cards',
      card('Today', '3', null, '#0a84ff'),
      card('Scheduled', '5', null, '#ff453a'),
      card('All', '14', null, '#3a3a3c'),
      card('Flagged', '1', null, '#ff9f0a'),
      h('div.gen-card.big', h('div.k', 'Reminders'), ...['Pick up dry cleaning', 'Book dentist', 'Call Sam back', 'Renew passport'].map((t) => h('div.rw-i', { style: { fontSize: '17px', padding: '12px 0' } }, h('span.rw-c', { style: { width: '22px', height: '22px' } }), t)))
    ),
  health: () =>
    h(
      'div.gen-cards',
      card('Steps', '8,412', 'Today', 'linear-gradient(135deg,#ff375f,#ff9f0a)'),
      card('Heart Rate', '68 BPM', 'Latest', 'linear-gradient(135deg,#ff2d55,#bf5af2)'),
      card('Sleep', '7 hr 21 min', 'Last night', 'linear-gradient(135deg,#5e5ce6,#32ade6)'),
      card('Walking + Running', '6.1 km', 'Today', 'linear-gradient(135deg,#ff9f0a,#ffd60a)')
    ),
  fitness: () =>
    h(
      'div.gen-cards',
      card('Move', '312/430 CAL', null, '#1c1c1e'),
      card('Exercise', '17/30 MIN', null, '#1c1c1e'),
      card('Stand', '10/12 HRS', null, '#1c1c1e'),
      card('Trends', 'Move ↑', 'You’re moving more than usual', '#1c1c1e')
    ),
  wallet: () =>
    h(
      'div.gen-cards',
      card('Apple Card', '•••• 4012', 'Apple Pay', 'linear-gradient(135deg,#f5f5f7,#c7c7cc)', '.dark-text'),
      card('Debit', '•••• 8821', 'Apple Pay', 'linear-gradient(135deg,#0a3d91,#1e88e5)'),
      card('Boarding Pass', 'LHR → JFK', 'Gate B32 · 14:05', 'linear-gradient(135deg,#ff9f0a,#ff375f)'),
      card('Apple Cash', '$42.18', null, '#000')
    ),
  appstore: () =>
    h(
      'div.gen-cards',
      card('Get Started', 'Apps made for iPhone Duo', 'Split View, Flex Mode and more.', 'linear-gradient(135deg,#5e5ce6,#0a84ff)', '.big'),
      card('App of the Day', 'Procreate Pocket', 'Sketch anywhere.', 'linear-gradient(135deg,#1c1c1e,#3a3a3c)'),
      card('Game of the Day', 'Monument Valley 3', null, 'linear-gradient(135deg,#ff6a3d,#ff2e7a)')
    ),
  tv: () =>
    h('div.gen-cards', card('Up Next', 'Severance', 'Season 2, Episode 7', 'linear-gradient(135deg,#123,#345)', '.big'), card('Top Chart', 'Slow Horses', null, '#1c1c1e'), card('New', 'Ted Lasso', null, '#1c1c1e')),
  podcasts: () =>
    h('div.gen-cards', card('Up Next', 'The Daily', '24 min left', 'linear-gradient(135deg,#8a2bd0,#d96eff)'), card('New Episode', 'Hard Fork', '58 min', '#1c1c1e'), card('Followed', 'Huberman Lab', null, '#1c1c1e')),
  books: () => h('div.gen-cards', card('Continue', 'Project Hail Mary', '62% · 4 hr left', 'linear-gradient(135deg,#ff9f0a,#ff6a00)'), card('Want to Read', '3 Books', null, '#1c1c1e')),
  stocks: () =>
    h(
      'div',
      section(
        [
          ['AAPL', 'Apple Inc.', '+2.14%'],
          ['MSFT', 'Microsoft Corporation', '+0.82%'],
          ['GOOGL', 'Alphabet Inc.', '-0.41%'],
          ['TSLA', 'Tesla, Inc.', '+3.05%'],
          ['AMZN', 'Amazon.com, Inc.', '+1.11%'],
        ].map(([t, n, c]) => ({ title: t, sub: n, detail: c })),
        { header: 'My Symbols' }
      )
    ),
};

function mapView() {
  const r = rng(42);
  let roads = '';
  for (let i = 0; i < 60; i++) {
    const x1 = r() * 1000;
    const y1 = r() * 1000;
    const x2 = x1 + (r() - 0.5) * 900;
    const y2 = y1 + (r() - 0.5) * 900;
    const w = r() < 0.2 ? 9 : 4;
    roads += `<path d="M${x1} ${y1} Q${(x1 + x2) / 2 + (r() - 0.5) * 200} ${(y1 + y2) / 2 + (r() - 0.5) * 200} ${x2} ${y2}" stroke="${w > 5 ? '#c7a24a' : '#3b3f48'}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  }
  let blocks = '';
  for (let i = 0; i < 40; i++) blocks += `<rect x="${r() * 1000}" y="${r() * 1000}" width="${40 + r() * 120}" height="${40 + r() * 120}" rx="10" fill="${r() < 0.4 ? '#1f3a2a' : '#262a31'}"/>`;
  return h(
    'div.map',
    h('div.map-bg', { html: `<svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice"><rect width="1000" height="1000" fill="#1d2026"/><path d="M0 700 Q300 640 520 760 T1000 720 V1000 H0Z" fill="#14324a"/>${blocks}${roads}</svg>` }),
    h('div.map-me'),
    h('div.map-btns', glassBtn(G.wifi), glassBtn('<svg viewBox="0 0 24 24"><path d="M12 2 4 20l8-4 8 4Z" fill="currentColor"/></svg>')),
    h('div.map-sheet', h('div.searchbar', h('span.sb-ic', { html: G.search }), h('span', 'Search Maps')), section([{ title: 'Home', sub: 'Close by', icon: { bg: '#0a84ff', svg: '' } }, { title: 'Work', sub: '24 min', icon: { bg: '#8e8e93', svg: '' } }]))
  );
}

export function generic(id) {
  return {
    theme: 'dark',
    mount(root, api) {
      if (id === 'maps') {
        root.append(mapView());
        return {};
      }
      const nav = navStack(h('div.gen'));
      root.append(nav.el.parentNode);
      const name = APPS[id]?.name || id;
      const make = CONTENT[id];
      const content = make
        ? make(api)
        : h('div', searchField(api), h('div.gen-empty', h('div.icon', { html: iconSVG(id) }), h('b', { style: { color: '#fff', fontSize: '20px' } }, name), h('span', 'Nothing here yet.')));
      nav.reset({ title: name, content, right: glassBtn(G.plus) });
      return {};
    },
  };
}

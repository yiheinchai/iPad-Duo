import { h } from '../util.js';

export default {
  theme: 'dark',
  mount(root, api) {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const eventsOn = new Set([3, 7, 8, 12, 15, 19, 22, 26, d.getDate()]);
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(h('div'));
    for (let i = 1; i <= days; i++) {
      const wd = (first + i - 1) % 7;
      cells.push(h('div' + (i === d.getDate() ? '.today' : '') + (wd === 0 || wd === 6 ? '.we' : ''), h('span', String(i)), eventsOn.has(i) ? h('i') : null));
    }
    const events = [
      ['#0a84ff', 'Team Sync', '11:00 AM – 11:30 AM'],
      ['#30d158', 'Gym', '6:00 PM – 7:00 PM'],
      ['#ff9f0a', 'Dinner with Alex', '8:00 PM'],
    ];
    const month = h(
      'div.cal-month',
      h('div.cal-mt', d.toLocaleDateString(undefined, { month: 'long' }) + ' ' + y),
      h('div.cal-wd', ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((x) => h('span', x))),
      h('div.cal-g', cells)
    );
    const list = h(
      'div',
      h('div', { style: { padding: '16px 20px 6px', font: '600 20px var(--display)' } }, d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })),
      events.map(([c, t, time]) => h('div.cal-ev', h('div.bar', { style: { background: c } }), h('div', h('b', t), h('span', time))))
    );
    root.append(h('div.cal', h('div.page-scroll.scroll', { style: { paddingTop: '56px' } }, h('div.cal-wrap', month, list))));
    return {};
  },
};

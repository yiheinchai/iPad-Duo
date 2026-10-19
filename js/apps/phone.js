import { h, tone } from '../util.js';
import { G } from '../icons.js';
import { tabBar } from './ui.js';

const DTMF = {
  1: [697, 1209], 2: [697, 1336], 3: [697, 1477],
  4: [770, 1209], 5: [770, 1336], 6: [770, 1477],
  7: [852, 1209], 8: [852, 1336], 9: [852, 1477],
  '*': [941, 1209], 0: [941, 1336], '#': [941, 1477],
};
const LETTERS = { 2: 'ABC', 3: 'DEF', 4: 'GHI', 5: 'JKL', 6: 'MNO', 7: 'PQRS', 8: 'TUV', 9: 'WXYZ', 0: '+' };
const STAR = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6L12 16.8 6.6 19.6l1.1-6L3.2 9.4l6.1-.8Z"/></svg>`;
const CLOCKI = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const PERSON = `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 21c0-4.5 3.6-7 8-7s8 2.5 8 7Z" fill="currentColor"/></svg>`;
const PAD = `<svg viewBox="0 0 24 24"><g fill="currentColor">${[5, 12, 19].flatMap((x) => [5, 12, 19].map((y) => `<circle cx="${x}" cy="${y}" r="2.2"/>`)).join('')}</g></svg>`;
const VM = `<svg viewBox="0 0 24 24"><circle cx="6.5" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6.5 16h11" stroke="currentColor" stroke-width="2"/></svg>`;

export default {
  theme: 'dark',
  mount(root, api) {
    let num = '';
    const numEl = h('div.kp-num');
    const add = h('div.kp-add');
    const render = () => {
      numEl.textContent = format(num);
      add.textContent = num ? 'Add Number' : '';
      del.style.visibility = num ? 'visible' : 'hidden';
    };
    const del = h('div.kp-del', { html: '<svg viewBox="0 0 28 20"><path d="M9 2h15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9l-7-8Z" fill="currentColor"/><path d="m13 7 6 6m0-6-6 6" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>' });
    del.addEventListener('click', () => {
      num = num.slice(0, -1);
      render();
    });
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => {
      const el = h('div.kp-k', h('b', k), h('span', LETTERS[k] || ''));
      el.addEventListener('pointerdown', () => tone(DTMF[k], 160, 0.08));
      el.addEventListener('click', () => {
        if (num.length < 18) num += k;
        render();
      });
      return el;
    });
    const call = h('div.kp-call', { html: G.phoneUp });
    call.addEventListener('click', () => {
      if (!num) return;
      startCall(format(num));
    });
    const kp = h('div.kp', numEl, add, h('div.kp-grid', keys, h('div'), call, del));

    const recents = h(
      'div.page-scroll.scroll',
      { style: { paddingTop: '60px', paddingBottom: '120px' } },
      h('div.large-title', 'Recents'),
      [
        ['Mum', 'mobile', 'Yesterday', false],
        ['Alex', 'FaceTime Audio', 'Yesterday', false],
        ['+44 7700 900123', 'Unknown', 'Saturday', true],
        ['Sam', 'mobile', 'Friday', false],
        ['Dentist', 'work', '12/10', false],
      ].map(([n, t, d, missed]) => {
        const r = h('div.recent' + (missed ? '.missed' : ''), h('div', h('b', n), h('span', t)), h('em', d));
        r.addEventListener('click', () => startCall(n));
        return r;
      })
    );
    const panes = [h('div.clk-pane'), h('div.clk-pane'), h('div.clk-pane'), h('div.clk-pane.on'), h('div.clk-pane')];
    panes[1].append(recents);
    panes[3].append(kp);
    panes[0].append(h('div.page-scroll', { style: { paddingTop: '60px' } }, h('div.large-title', 'Favorites')));
    panes[2].append(h('div.page-scroll', { style: { paddingTop: '60px' } }, h('div.large-title', 'Contacts')));
    panes[4].append(h('div.page-scroll', { style: { paddingTop: '60px' } }, h('div.large-title', 'Voicemail'), h('div.gen-empty', 'No Voicemail')));
    const bar = tabBar(
      [
        { icon: STAR, label: 'Favorites' },
        { icon: CLOCKI, label: 'Recents' },
        { icon: PERSON, label: 'Contacts' },
        { icon: PAD, label: 'Keypad' },
        { icon: VM, label: 'Voicemail' },
      ],
      (i) => panes.forEach((p, j) => p.classList.toggle('on', i === j)),
      3
    );
    bar.style.setProperty('--tint', '#0a84ff');
    const wrap = h('div.phn', ...panes);
    root.append(wrap);
    api.rail.bottom([bar]);

    function startCall(name) {
      const st = h('div.st', 'calling…');
      const btn = (glyph, label) => {
        const i = h('i', glyph);
        i.addEventListener('click', () => i.classList.toggle('on'));
        return h('div', i, label);
      };
      const end = h('div.end', { html: G.phoneDown });
      const scr = h(
        'div.callscr',
        h('div.who', name),
        st,
        h('div.grid3', btn('🔈', 'Speaker'), btn('📹', 'FaceTime'), btn('🎙', 'Mute'), btn('➕', 'Add'), btn('⌨︎', 'Keypad'), btn('👤', 'Contacts')),
        end
      );
      wrap.append(scr);
      scr.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
      let ring = setInterval(() => tone([440, 480], 1200, 0.04), 3000);
      tone([440, 480], 1200, 0.04);
      const t0 = Date.now() + 4000;
      const tm = setInterval(() => {
        const s = Math.floor((Date.now() - t0) / 1000);
        if (s >= 0) {
          clearInterval(ring);
          st.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        }
      }, 500);
      api.os.island.start('call', {
        compact: () => ({ top: `<span class="ic-green">${G.phoneUp}</span>`, bottom: `<span class="ic-vtext ic-green-t">${st.textContent.includes(':') ? st.textContent : '•••'}</span>` }),
        expanded: () => h('div.ie-row.call', h('div.ie-av', name[0]), h('div.ie-txt', h('span', st.textContent), h('b', name))),
      });
      end.addEventListener('click', () => {
        clearInterval(ring);
        clearInterval(tm);
        api.os.island.end('call');
        tone(480, 200, 0.05);
        st.textContent = 'Call Ended';
        setTimeout(() => scr.remove(), 700);
      });
    }

    render();
    return {};
  },
};

function format(n) {
  if (/^\d{10}$/.test(n)) return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
  if (/^0\d{10}$/.test(n)) return `${n.slice(0, 5)} ${n.slice(5)}`;
  return n;
}

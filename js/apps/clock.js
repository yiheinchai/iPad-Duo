import { h, fmtTime, tone } from '../util.js';
import { G, iconSVG } from '../icons.js';
import { tabBar, toggle, glassBtn } from './ui.js';

const GLOBE = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
const ALARM = `<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4l2.5 2M4 5l3-2.5M20 5l-3-2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const STOP = `<svg viewBox="0 0 24 24"><circle cx="12" cy="13.5" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 13.5V9M10 2.5h4M12 2.5v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

const CITIES = [
  ['Cupertino', 'America/Los_Angeles'],
  ['New York', 'America/New_York'],
  ['London', 'Europe/London'],
  ['Paris', 'Europe/Paris'],
  ['Tokyo', 'Asia/Tokyo'],
  ['Sydney', 'Australia/Sydney'],
];

function zoned(tz) {
  try {
    return new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
  } catch {
    return new Date();
  }
}

// Timer state lives at module level so the Live Activity survives the window.
const T = { end: 0, total: 0, paused: 0, running: false };

export default {
  theme: 'dark',
  mount(root, api) {
    const os = api.os;
    const h24 = () => api.cfg.h24;
    const panes = [h('div.clk-pane'), h('div.clk-pane'), h('div.clk-pane'), h('div.clk-pane')];
    const bar = tabBar(
      [
        { icon: GLOBE, label: 'World Clock' },
        { icon: ALARM, label: 'Alarms' },
        { icon: STOP, label: 'Stopwatch' },
        { icon: G.timer, label: 'Timers' },
      ],
      (i) => sel(i),
      3
    );
    const wrap = h('div.clk', ...panes, bar);
    root.append(wrap);
    const sel = (i) => panes.forEach((p, j) => p.classList.toggle('on', i === j));

    /* World clock */
    const wl = h('div.wcl-wrap');
    const renderWorld = () => {
      const here = new Date();
      wl.replaceChildren(
        ...CITIES.map(([n, tz]) => {
          const t = zoned(tz);
          const diff = Math.round((t - here) / 3600000);
          const day = t.getDate() === here.getDate() ? 'Today' : t > here ? 'Tomorrow' : 'Yesterday';
          const [hm, ap] = h24() ? [fmtTime(t, true), ''] : [fmtTime(t), t.getHours() < 12 ? 'AM' : 'PM'];
          return h('div.wcl-row', h('div.l', h('span', `${day}, ${diff >= 0 ? '+' : ''}${diff}HRS`), h('b', n)), h('div.t', hm, h('small', ap)));
        })
      );
    };
    panes[0].append(h('div.page-scroll.scroll', { style: { paddingTop: '60px' } }, h('div.large-title', 'World Clock'), wl));

    /* Alarms */
    const alarms = [
      ['6:30', 'AM', 'Alarm, weekdays', true],
      ['7:15', 'AM', 'Gym', false],
      ['8:00', 'AM', 'Alarm, weekends', true],
      ['10:30', 'PM', 'Wind Down', false],
    ];
    panes[1].append(
      h(
        'div.page-scroll.scroll',
        { style: { paddingTop: '60px' } },
        h('div.large-title', 'Alarms'),
        h('div', { style: { padding: '0 20px 8px', fontSize: '20px', fontWeight: '600' } }, '🛏 Sleep | Wake Up'),
        h('div', { style: { padding: '0 20px 14px', color: 'rgba(235,235,245,.6)' } }, 'No Alarm'),
        alarms.map(([t, ap, l, on]) => {
          const row = h('div.alarm' + (on ? '' : '.off'), h('div', h('b', t, h('small', ap)), h('span', l)));
          row.append(toggle(on, (v) => row.classList.toggle('off', !v)));
          return row;
        })
      )
    );

    /* Stopwatch */
    let sw = { start: 0, acc: 0, running: false, laps: [] };
    const swTime = h('div.sw-time', '00:00,00');
    const lapBtn = h('div.rbtn.gray', 'Lap');
    const startBtn = h('div.rbtn.green', 'Start');
    const laps = h('div.laps');
    const fmtSW = (ms) => {
      const cs = Math.floor(ms / 10) % 100;
      const s = Math.floor(ms / 1000) % 60;
      const m = Math.floor(ms / 60000);
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(cs).padStart(2, '0')}`;
    };
    const swNow = () => sw.acc + (sw.running ? performance.now() - sw.start : 0);
    startBtn.addEventListener('click', () => {
      if (sw.running) {
        sw.acc = swNow();
        sw.running = false;
      } else {
        sw.start = performance.now();
        sw.running = true;
        loop();
      }
      startBtn.textContent = sw.running ? 'Stop' : 'Start';
      startBtn.className = 'rbtn ' + (sw.running ? 'red' : 'green');
      lapBtn.textContent = sw.running || !sw.acc ? 'Lap' : 'Reset';
    });
    lapBtn.addEventListener('click', () => {
      if (sw.running) {
        sw.laps.unshift(swNow());
      } else {
        sw = { start: 0, acc: 0, running: false, laps: [] };
        lapBtn.textContent = 'Lap';
      }
      renderLaps();
      swTime.textContent = fmtSW(swNow());
    });
    const renderLaps = () => {
      laps.replaceChildren(
        ...sw.laps.map((t, i) => {
          const prev = sw.laps[i + 1] || 0;
          return h('div', h('span', 'Lap ' + (sw.laps.length - i)), h('span', fmtSW(t - prev)));
        })
      );
    };
    const loop = () => {
      swTime.textContent = fmtSW(swNow());
      if (sw.running) requestAnimationFrame(loop);
    };
    panes[2].append(h('div.page-scroll.scroll', { style: { paddingTop: '0' } }, swTime, h('div.sw-btns', lapBtn, startBtn), laps));

    /* Timers */
    const ringFg = h('div');
    const tmLabel = h('b', '');
    const C = 2 * Math.PI * 140;
    ringFg.innerHTML = `<svg viewBox="0 0 300 300"><circle cx="150" cy="150" r="140" fill="none" stroke="#2c2c2e" stroke-width="7"/><circle class="arc" cx="150" cy="150" r="140" fill="none" stroke="#ff9f0a" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C} ${C}"/></svg>`;
    const ring = h('div.tm-ring', ringFg.firstChild, tmLabel);
    const presets = h(
      'div.tm-presets',
      [1, 3, 5, 10, 15, 30].map((m) => {
        const b = h('div', m + ' min');
        b.addEventListener('click', () => startTimer(m * 60));
        return b;
      })
    );
    const cancelBtn = h('div.rbtn.gray', 'Cancel');
    const pauseBtn = h('div.rbtn.orange', 'Pause');
    const tmBtns = h('div.sw-btns', cancelBtn, pauseBtn);
    const tmView = h('div', ring, tmBtns);
    const setupView = h('div', h('div.large-title', { style: { paddingTop: '60px' } }, 'Timers'), presets);
    panes[3].append(h('div.page-scroll.scroll', { style: { paddingTop: '0' } }, setupView, tmView));

    const fmtT = (s) => {
      s = Math.max(0, Math.ceil(s));
      const hh = Math.floor(s / 3600);
      const mm = Math.floor(s / 60) % 60;
      const ss = s % 60;
      return (hh ? hh + ':' + String(mm).padStart(2, '0') : String(mm)) + ':' + String(ss).padStart(2, '0');
    };
    const remaining = () => (T.running ? (T.end - Date.now()) / 1000 : T.paused);
    const renderTimer = () => {
      const active = T.running || T.paused > 0;
      setupView.style.display = active ? 'none' : '';
      tmView.style.display = active ? '' : 'none';
      if (!active) return;
      const r = remaining();
      tmLabel.textContent = fmtT(r);
      ring.querySelector('.arc').style.strokeDashoffset = String(C * (1 - r / T.total));
      pauseBtn.textContent = T.running ? 'Pause' : 'Resume';
      pauseBtn.className = 'rbtn ' + (T.running ? 'orange' : 'green');
    };
    const startTimer = (secs) => {
      T.total = secs;
      T.end = Date.now() + secs * 1000;
      T.running = true;
      T.paused = 0;
      tone(880, 80, 0.06);
      os.island.start('timer', {
        compact: () => ({ top: `<span style="color:#ff9f0a;display:block;width:20px;height:20px">${G.timer}</span>`, bottom: `<span class="ic-vtext">${fmtT(remaining())}</span>` }),
        expanded: () => h('div.ie-row', h('div.ie-art', { style: { color: '#ff9f0a', width: '40px', height: '40px' }, html: G.timer }), h('div.ie-txt', h('span', 'Timer'), h('b', { style: { color: '#ff9f0a', fontSize: '34px', fontWeight: '300' } }, fmtT(remaining())))),
      });
      renderTimer();
    };
    pauseBtn.addEventListener('click', () => {
      if (T.running) {
        T.paused = remaining();
        T.running = false;
      } else {
        T.end = Date.now() + T.paused * 1000;
        T.running = true;
        T.paused = 0;
      }
      renderTimer();
    });
    cancelBtn.addEventListener('click', () => {
      T.running = false;
      T.paused = 0;
      os.island.end('timer');
      renderTimer();
    });

    const tickAll = setInterval(() => {
      if (T.running && remaining() <= 0) {
        T.running = false;
        T.paused = 0;
        os.island.end('timer');
        os.banner({ app: 'clock', title: 'Timer', body: 'Timer Done', sound: false });
        let n = 0;
        const ring = setInterval(() => {
          tone([1568, 2093], 140, 0.08);
          if (++n > 8) clearInterval(ring);
        }, 300);
      }
      renderTimer();
      if (panes[0].classList.contains('on')) renderWorld();
    }, 250);

    renderWorld();
    renderTimer();
    sel(3);
    return {
      destroy: () => clearInterval(tickAll),
    };
  },
};

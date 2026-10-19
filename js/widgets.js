// Home Screen / Today View widgets.
import { h, fmtTime } from './util.js';
import { weatherData, batteryLevel, SONGS } from './data.js';
import { makePhoto } from './wallpaper.js';
import { G } from './icons.js';

export function widget(def, os) {
  const fn = W[def.w];
  const el = h(`div.widget.w-${def.s}.wk-${def.w}`);
  const render = () => {
    el.replaceChildren(...[].concat(fn(def.s, os, el)));
  };
  render();
  os.onMinute.push(render);
  const app = APP_FOR[def.w];
  if (app) {
    el.addEventListener('click', () => {
      if (os.jiggling) return;
      os.openApp(app, el);
    });
    os.pressable(el);
  }
  return el;
}

const APP_FOR = {
  weather: 'weather',
  calendar: 'calendar',
  photos: 'photos',
  music: 'music',
  worldclock: 'clock',
  fitness: 'fitness',
  reminders: 'reminders',
  screentime: 'settings',
};

const W = {
  weather(s, os) {
    const d = weatherData(os.cfg.city);
    const top = h(
      'div.ww-top',
      h('div.ww-city', d.city, h('span.ww-arrow', '➤')),
      h('div.ww-temp', d.now + '°')
    );
    const bottom = h('div.ww-bottom', h('div.ww-icon', d.icon), h('div.ww-cond', d.cond), h('div.ww-hl', `H:${d.hi}° L:${d.lo}°`));
    const body = [top];
    if (s === 'M') {
      body.push(
        h(
          'div.ww-hours',
          d.hourly.slice(0, 6).map((x) => h('div.ww-h', h('span.t', x.label), h('span.i', x.icon), h('span.v', x.temp + '°')))
        )
      );
    }
    body.push(bottom);
    return h(`div.ww${d.night ? '.night' : ''}${d.kind.includes('rain') || d.kind === 'cloudy' ? '.overcast' : ''}`, body);
  },

  calendar(s) {
    const d = new Date();
    const wd = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const events = [
      { t: 'Team Sync', time: '11:00 AM', c: '#0A84FF' },
      { t: 'Gym', time: '6:00 PM', c: '#30D158' },
    ];
    if (s === 'S') {
      return h('div.cw', h('div.cw-wd', wd), h('div.cw-day', String(d.getDate())), h('div.cw-none', 'No Events Today'));
    }
    // Medium: mini month + up next
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const daysIn = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(h('span'));
    for (let i = 1; i <= daysIn; i++) cells.push(h('span' + (i === d.getDate() ? '.today' : ''), String(i)));
    return h(
      'div.cw.cw-m',
      h(
        'div.cw-left',
        h('div.cw-wd', wd),
        h('div.cw-day', String(d.getDate())),
        h(
          'div.cw-evs',
          events.map((e) => h('div.cw-ev', { style: { '--c': e.c } }, h('b', e.t), h('span', e.time)))
        )
      ),
      h(
        'div.cw-month',
        h('div.cw-mname', d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()),
        h('div.cw-grid', ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((x) => h('span.hd', x)), cells)
      )
    );
  },

  photos(s, os) {
    const src = os.photoForWidget ? os.photoForWidget() : makePhoto(3, 900, 1200);
    return h(
      'div.pw',
      { style: { backgroundImage: `url(${src})` } },
      h('div.pw-cap', h('b', 'On This Day'), h('span', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase() + ', 2024')),
      s === 'XL' ? h('div.pw-play', { html: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>' }) : null
    );
  },

  batteries() {
    const lvl = Math.round(batteryLevel() * 100);
    const ring = (pct, glyph, on = true) => {
      const r = 26;
      const c = 2 * Math.PI * r;
      return h('div.bw-ring' + (on ? '' : '.off'), {
        html: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="${r}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="5"/>
        ${on ? `<circle cx="32" cy="32" r="${r}" fill="none" stroke="${pct <= 20 ? '#FF453A' : '#30D158'}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(c * pct) / 100} ${c}" transform="rotate(-90 32 32)"/>` : ''}
        </svg><div class="bw-g">${glyph}</div>`,
      });
    };
    const phoneGlyph = `<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2.5" fill="none" stroke="#fff" stroke-width="1.8"/><line x1="12" y1="3" x2="12" y2="21" stroke="#fff" stroke-width="1.2"/></svg>`;
    return h(
      'div.bw',
      h('div.bw-rings', ring(lvl, phoneGlyph), ring(0, G.airpods, false), ring(0, '', false), ring(0, '', false)),
      h('div.bw-pct', lvl + '%')
    );
  },

  music() {
    const items = SONGS.slice(0, 3);
    return h(
      'div.mw',
      h('div.mw-head', h('span', 'Recently Played'), h('span.mw-note', '♫')),
      h(
        'div.mw-row',
        items.map((sg) =>
          h(
            'div.mw-item',
            h('div.mw-art', { style: { background: `linear-gradient(135deg, ${sg.c[0]}, ${sg.c[1]})` } }),
            h('div.mw-t', sg.title),
            h('div.mw-a', sg.artist)
          )
        )
      )
    );
  },

  fitness() {
    const rings = [
      ['#FA114F', 0.72, 26],
      ['#92E82A', 0.55, 19],
      ['#1EEAEF', 0.83, 12],
    ];
    const svg = rings
      .map(([col, p, r]) => {
        const c = 2 * Math.PI * r;
        return `<circle cx="32" cy="32" r="${r}" fill="none" stroke="${col}" stroke-opacity=".22" stroke-width="6.5"/>
        <circle cx="32" cy="32" r="${r}" fill="none" stroke="${col}" stroke-width="6.5" stroke-linecap="round" stroke-dasharray="${c * p} ${c}" transform="rotate(-90 32 32)"/>`;
      })
      .join('');
    return h(
      'div.fw',
      h('div.fw-rings', { html: `<svg viewBox="0 0 64 64">${svg}</svg>` }),
      h('div.fw-stats', h('span.m', '312/430', h('small', 'CAL')), h('span.e', '17/30', h('small', 'MIN')), h('span.s', '10/12', h('small', 'HRS')))
    );
  },

  worldclock(s, os) {
    const zones = [
      ['Cupertino', 'America/Los_Angeles'],
      ['New York', 'America/New_York'],
      ['London', 'Europe/London'],
      ['Tokyo', 'Asia/Tokyo'],
    ];
    return h(
      'div.wc',
      zones.map(([name, tz]) => {
        const t = zoned(tz);
        const night = t.getHours() < 6 || t.getHours() >= 18;
        const hr = ((t.getHours() % 12) + t.getMinutes() / 60) * 30;
        const mn = t.getMinutes() * 6;
        return h(
          'div.wc-c',
          h('div.wc-face' + (night ? '.night' : ''), {
            html: `<svg viewBox="0 0 60 60">${Array.from({ length: 12 }, (_, i) => `<line x1="30" y1="5" x2="30" y2="${i % 3 ? 7.5 : 9}" stroke="currentColor" stroke-width="${i % 3 ? 1 : 1.6}" transform="rotate(${i * 30} 30 30)"/>`).join('')}
            <line x1="30" y1="31" x2="30" y2="17" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" transform="rotate(${hr} 30 30)"/>
            <line x1="30" y1="31" x2="30" y2="10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" transform="rotate(${mn} 30 30)"/>
            <circle cx="30" cy="30" r="1.8" fill="#FF9F0A"/></svg>`,
          }),
          h('div.wc-n', name),
          h('div.wc-t', fmtTime(t, os.cfg.h24))
        );
      })
    );
  },

  screentime() {
    const bars = [40, 65, 30, 80, 55, 90, 45];
    return h(
      'div.st',
      h('div.st-h', 'Screen Time'),
      h('div.st-v', '2h 14m'),
      h(
        'div.st-bars',
        bars.map((b, i) => h('i', { style: { height: b + '%', background: i === 6 ? '#0A84FF' : 'rgba(255,255,255,.35)' } }))
      )
    );
  },

  reminders() {
    const items = ['Pick up dry cleaning', 'Book dentist', 'Call Sam back'];
    return h(
      'div.rw',
      h('div.rw-h', h('span.rw-dot', { html: '≡' }), h('b', '3')),
      h('div.rw-t', 'Reminders'),
      items.map((t) => h('div.rw-i', h('span.rw-c'), t))
    );
  },
};

function zoned(tz) {
  try {
    const s = new Date().toLocaleString('en-US', { timeZone: tz });
    return new Date(s);
  } catch {
    return new Date();
  }
}

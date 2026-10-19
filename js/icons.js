// Hand-drawn SVG app icons (100x100 artboard, clipped to the iOS squircle by CSS).
// Every gradient id is suffixed per render so duplicate icons never collide.

import { uid } from './util.js';

const lg = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join('')}</linearGradient>`;
const rg = (id, stops, cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
    .join('')}</radialGradient>`;
const bg = (fill) => `<rect width="100" height="100" fill="${fill}"/>`;

function gearPath(cx, cy, ro, ri, teeth, frac = 0.5) {
  const pts = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const w = (step * frac) / 2;
    const taper = w * 0.75;
    pts.push([a - w - step * 0.08, ri], [a - taper, ro], [a + taper, ro], [a + w + step * 0.08, ri]);
  }
  return (
    'M' +
    pts
      .map(([a, r]) => `${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`)
      .join('L') +
    'Z'
  );
}

const handset =
  'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z';

const D = {
  phone: (u) =>
    `<defs>${lg('g' + u, [[0, '#6CF57E'], [1, '#14C73A']])}</defs>${bg(`url(#g${u})`)}
     <path d="${handset}" fill="#fff" transform="translate(21 21) scale(2.45)"/>`,

  messages: (u) =>
    `<defs>${lg('g' + u, [[0, '#6CF57E'], [1, '#14C73A']])}</defs>${bg(`url(#g${u})`)}
     <ellipse cx="50" cy="47" rx="33" ry="27" fill="#fff"/>
     <path d="M27 62 C26 70 22 75 17 78 C27 78 34 74 38 70Z" fill="#fff"/>`,

  facetime: (u) =>
    `<defs>${lg('g' + u, [[0, '#6CF57E'], [1, '#14C73A']])}</defs>${bg(`url(#g${u})`)}
     <rect x="17" y="33" width="44" height="34" rx="10" fill="#fff"/>
     <path d="M65 45 L82 34 Q85 32 85 36 V64 Q85 68 82 66 L65 55Z" fill="#fff"/>`,

  mail: (u) =>
    `<defs>${lg('g' + u, [[0, '#24D2FF'], [1, '#1A5CF0']])}</defs>${bg(`url(#g${u})`)}
     <rect x="16" y="28" width="68" height="46" rx="6" fill="#fff"/>
     <path d="M18 31 L50 55 L82 31" fill="none" stroke="#2D7BF5" stroke-width="3" stroke-linejoin="round" opacity=".55"/>
     <path d="M18 72 L42 50 M82 72 L58 50" stroke="#2D7BF5" stroke-width="2" opacity=".25"/>`,

  safari: (u) => {
    let ticks = '';
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const r1 = i % 6 === 0 ? 31 : 33.5;
      ticks += `<line x1="${50 + Math.cos(a) * r1}" y1="${50 + Math.sin(a) * r1}" x2="${50 + Math.cos(a) * 36}" y2="${50 + Math.sin(a) * 36}" stroke="#fff" stroke-width="${i % 6 === 0 ? 1.1 : 0.6}" opacity=".85"/>`;
    }
    return `<defs>${lg('b' + u, [[0, '#ffffff'], [1, '#E3E3E8']])}${lg('c' + u, [[0, '#1BD3FF'], [1, '#1A62EE']])}</defs>
     ${bg(`url(#b${u})`)}<circle cx="50" cy="50" r="39" fill="url(#c${u})"/>${ticks}
     <g transform="rotate(45 50 50)"><path d="M50 18 L55 50 L45 50Z" fill="#FF3B30"/><path d="M50 82 L55 50 L45 50Z" fill="#fff"/></g>
     <circle cx="50" cy="50" r="2.4" fill="#fff"/>`;
  },

  camera: (u) =>
    `<defs>${lg('g' + u, [[0, '#F2F2F5'], [1, '#A9A9AF']])}${rg('l' + u, [[0, '#4a5a7a'], [0.55, '#1b2233'], [1, '#0b0e14']], 0.4, 0.4, 0.6)}</defs>${bg(`url(#g${u})`)}
     <rect x="14" y="30" width="72" height="48" rx="9" fill="#2C2C2E"/>
     <path d="M36 30 L40 23 Q41 21 43 21 H57 Q59 21 60 23 L64 30Z" fill="#2C2C2E"/>
     <circle cx="50" cy="54" r="17" fill="#8E8E93"/><circle cx="50" cy="54" r="14" fill="url(#l${u})"/>
     <circle cx="45" cy="49" r="3.5" fill="#fff" opacity=".35"/>
     <circle cx="76" cy="38" r="2.5" fill="#FFCC00"/>`,

  photos: () => {
    const cols = ['#F7A83A', '#F5D33B', '#A5D64F', '#45C79A', '#3FA3E6', '#7A6BDB', '#C46BCB', '#F25A5A'];
    return `${bg('#fff')}<g style="mix-blend-mode:multiply">${cols
      .map(
        (c, i) =>
          `<ellipse cx="50" cy="31" rx="11" ry="19" fill="${c}" opacity=".88" transform="rotate(${i * 45} 50 50)"/>`
      )
      .join('')}</g>`;
  },

  settings: (u) =>
    `<defs>${lg('g' + u, [[0, '#D9D9DE'], [1, '#8D8D93']])}${lg('r' + u, [[0, '#5b5b60'], [1, '#2a2a2d']])}</defs>${bg(`url(#g${u})`)}
     <path d="${gearPath(50, 50, 40, 33.5, 36, 0.55)}" fill="url(#r${u})"/>
     <circle cx="50" cy="50" r="31" fill="#C9C9CE"/>
     <path d="${gearPath(50, 50, 25, 20, 9, 0.45)}" fill="#47474b"/>
     <circle cx="50" cy="50" r="14" fill="#C9C9CE"/><circle cx="50" cy="50" r="6.5" fill="#47474b"/>
     <g stroke="#47474b" stroke-width="3">${[0, 60, 120, 180, 240, 300]
       .map((a) => `<line x1="50" y1="50" x2="50" y2="31" transform="rotate(${a} 50 50)"/>`)
       .join('')}</g><circle cx="50" cy="50" r="10" fill="#C9C9CE"/><circle cx="50" cy="50" r="5" fill="#47474b"/>`,

  clock: () => {
    let ticks = '';
    for (let i = 0; i < 60; i++) {
      const big = i % 5 === 0;
      ticks += `<line x1="50" y1="${big ? 13.5 : 13.5}" x2="50" y2="${big ? 18 : 15.5}" stroke="#000" stroke-width="${big ? 1.6 : 0.7}" transform="rotate(${i * 6} 50 50)"/>`;
    }
    let nums = '';
    for (let i = 1; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      nums += `<text x="${50 + Math.cos(a) * 26}" y="${50 + Math.sin(a) * 26 + 3.6}" font-size="10" text-anchor="middle" font-family="-apple-system,system-ui,sans-serif" font-weight="500" fill="#000">${i}</text>`;
    }
    const d = new Date();
    const s = d.getSeconds() + d.getMilliseconds() / 1000;
    const m = d.getMinutes() + s / 60;
    const hr = (d.getHours() % 12) + m / 60;
    const anim = (period, now) =>
      `style="animation: icon-rot ${period}s linear infinite; animation-delay:-${now}s; transform-origin:50px 50px"`;
    return `${bg('#000')}<circle cx="50" cy="50" r="39" fill="#fff"/>${ticks}${nums}
     <g ${anim(43200, hr * 3600)}><line x1="50" y1="52" x2="50" y2="31" stroke="#000" stroke-width="3.6" stroke-linecap="round"/></g>
     <g ${anim(3600, m * 60)}><line x1="50" y1="52" x2="50" y2="19" stroke="#000" stroke-width="2.6" stroke-linecap="round"/></g>
     <g ${anim(60, s)}><line x1="50" y1="58" x2="50" y2="16" stroke="#FF9500" stroke-width="1.1"/><circle cx="50" cy="50" r="2.2" fill="#FF9500"/></g>
     <circle cx="50" cy="50" r=".9" fill="#fff"/>`;
  },

  calendar: () => {
    const d = new Date();
    const wd = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    return `${bg('#fff')}<text x="50" y="30" text-anchor="middle" font-size="14" font-weight="600" fill="#FF3B30" font-family="-apple-system,system-ui,sans-serif">${wd}</text>
     <text x="50" y="80" text-anchor="middle" font-size="52" font-weight="300" fill="#000" letter-spacing="-2" font-family="-apple-system,system-ui,sans-serif">${d.getDate()}</text>`;
  },

  weather: (u) =>
    `<defs>${lg('g' + u, [[0, '#1C7EF2'], [1, '#61C1FA']])}${rg('s' + u, [[0, '#FFF27A'], [1, '#FFC800']])}</defs>${bg(`url(#g${u})`)}
     <circle cx="38" cy="38" r="16" fill="url(#s${u})"/>
     <path d="M30 74 Q20 74 20 64 Q20 55 30 54 Q32 42 46 42 Q57 42 61 51 Q64 49 68 49 Q80 49 81 61 Q90 62 90 69 Q90 74 82 74Z" fill="#fff" opacity=".97"/>`,

  notes: (u) =>
    `<defs>${lg('y' + u, [[0, '#FFE066'], [1, '#FFCC02']])}</defs>${bg('#fff')}
     <rect width="100" height="27" fill="url(#y${u})"/>
     <line x1="0" y1="27" x2="100" y2="27" stroke="#d9a400" stroke-width="1"/>
     <g stroke="#C7C7CC" stroke-width="1">${[42, 56, 70, 84].map((y) => `<line x1="10" y1="${y}" x2="100" y2="${y}"/>`).join('')}</g>
     <g fill="#BDBDC2">${Array.from({ length: 15 }, (_, i) => `<circle cx="${8 + i * 6.3}" cy="27" r="1" opacity="0"/>`).join('')}</g>`,

  reminders: () => {
    const rows = [
      ['#0A84FF', 26],
      ['#FF3B30', 50],
      ['#FF9F0A', 74],
    ];
    return `${bg('#fff')}${rows
      .map(
        ([c, y]) =>
          `<circle cx="24" cy="${y}" r="7" fill="${c}"/><circle cx="24" cy="${y}" r="4.6" fill="none" stroke="#fff" stroke-width="1.3"/><rect x="38" y="${y - 1}" width="48" height="2" rx="1" fill="#D1D1D6"/>`
      )
      .join('')}`;
  },

  music: (u) =>
    `<defs>${lg('g' + u, [[0, '#FB5C74'], [1, '#FA233B']])}</defs>${bg(`url(#g${u})`)}
     <path d="M41 30 L73 23 V63 A9 8 0 1 1 67 56 V36 L47 40 V70 A9 8 0 1 1 41 63Z" fill="#fff"/>`,

  appstore: (u) =>
    `<defs>${lg('g' + u, [[0, '#17C9FC'], [1, '#1F6CF3']])}</defs>${bg(`url(#g${u})`)}
     <g stroke="#fff" stroke-width="6.5" stroke-linecap="round">
     <line x1="54" y1="22" x2="31" y2="72"/><line x1="46" y1="22" x2="69" y2="72"/><line x1="24" y1="60" x2="76" y2="60"/></g>`,

  wallet: () =>
    `${bg('#000')}<rect x="17" y="22" width="66" height="56" rx="8" fill="#1c1c1e"/>
     <rect x="21" y="25" width="58" height="14" rx="3" fill="#0A84FF"/>
     <rect x="21" y="32" width="58" height="14" rx="3" fill="#FFB800"/>
     <rect x="21" y="39" width="58" height="14" rx="3" fill="#30D158"/>
     <rect x="21" y="46" width="58" height="14" rx="3" fill="#FF453A"/>
     <path d="M17 54 H40 Q50 64 60 54 H83 V70 Q83 78 75 78 H25 Q17 78 17 70Z" fill="#2C2C2E"/>`,

  health: () =>
    `${bg('#fff')}<path d="M73 28 C66 21 56 24 53 31 C50 24 40 21 33 28 C26 36 31 46 53 62 C75 46 80 36 73 28Z" fill="#FF2D55" transform="translate(9 -6)"/>`,

  files: (u) =>
    `<defs>${lg('f' + u, [[0, '#4FB5FF'], [1, '#1A82FB']])}</defs>${bg('#fff')}
     <path d="M16 30 Q16 25 21 25 H40 L46 31 H79 Q84 31 84 36 V72 Q84 77 79 77 H21 Q16 77 16 72Z" fill="#1570E0"/>
     <path d="M16 39 Q16 35 21 35 H79 Q84 35 84 40 V72 Q84 77 79 77 H21 Q16 77 16 72Z" fill="url(#f${u})"/>`,

  calculator: () =>
    `${bg('#1C1C1E')}<g font-family="-apple-system,system-ui,sans-serif" font-weight="500" text-anchor="middle">
     <circle cx="34" cy="34" r="13" fill="#505053"/><circle cx="66" cy="34" r="13" fill="#FF9F0A"/>
     <circle cx="34" cy="66" r="13" fill="#505053"/><circle cx="66" cy="66" r="13" fill="#FF9F0A"/>
     <text x="34" y="40" font-size="17" fill="#fff">+</text><text x="66" y="40" font-size="17" fill="#fff">−</text>
     <text x="34" y="72" font-size="17" fill="#fff">×</text><text x="66" y="72" font-size="17" fill="#fff">=</text></g>`,

  maps: () =>
    `${bg('#EEF1E6')}<path d="M0 64 Q30 58 48 70 T100 66 V100 H0Z" fill="#B7E2A8"/>
     <path d="M62 0 H100 V34 Q80 30 62 0Z" fill="#AEDCF7"/>
     <path d="M-5 38 L105 22" stroke="#fff" stroke-width="9"/>
     <path d="M34 -5 L58 105" stroke="#FFD15C" stroke-width="10"/>
     <path d="M34 -5 L58 105" stroke="#F5A623" stroke-width="1.5" stroke-dasharray="4 4"/>
     <path d="M22 84 Q40 60 52 52 T80 30" stroke="#0A84FF" stroke-width="5" fill="none" stroke-linecap="round"/>
     <circle cx="80" cy="30" r="7" fill="#fff"/><circle cx="80" cy="30" r="4.5" fill="#0A84FF"/>`,

  fitness: () =>
    `${bg('#000')}<g fill="none" stroke-width="9" stroke-linecap="round">
     <circle cx="50" cy="50" r="34" stroke="#3a0716"/><circle cx="50" cy="50" r="24" stroke="#1f3a06"/><circle cx="50" cy="50" r="14" stroke="#073a3c"/>
     <path d="M50 16 A34 34 0 1 1 18 62" stroke="#FA114F"/>
     <path d="M50 26 A24 24 0 1 1 30 63" stroke="#92E82A"/>
     <path d="M50 36 A14 14 0 1 1 37 55" stroke="#1EEAEF"/></g>`,

  podcasts: (u) =>
    `<defs>${lg('g' + u, [[0, '#D96EFF'], [1, '#8A2BD0']])}</defs>${bg(`url(#g${u})`)}
     <g fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round">
     <path d="M32 67 A26 26 0 1 1 68 67"/><path d="M39 57 A15 15 0 1 1 61 57"/></g>
     <circle cx="50" cy="45" r="7" fill="#fff"/><path d="M45 56 H55 L53 80 H47Z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`,

  tv: () =>
    `${bg('#000')}<text x="50" y="62" font-size="34" text-anchor="middle" fill="#fff" font-weight="600" font-family="-apple-system,system-ui,sans-serif" letter-spacing="-1">tv</text>`,

  home: () =>
    `${bg('#fff')}<path d="M50 20 L84 50 H76 V80 H24 V50 H16Z" fill="#FF9F0A" stroke="#FF9F0A" stroke-width="4" stroke-linejoin="round"/>
     <rect x="43" y="58" width="14" height="22" rx="2" fill="#fff"/>`,

  books: (u) =>
    `<defs>${lg('g' + u, [[0, '#FFA733'], [1, '#FF6A00']])}</defs>${bg(`url(#g${u})`)}
     <path d="M18 30 Q34 25 49 32 V76 Q34 69 18 74Z M82 30 Q66 25 51 32 V76 Q66 69 82 74Z" fill="#fff"/>`,

  findmy: (u) =>
    `<defs>${lg('g' + u, [[0, '#45D364'], [1, '#18A93D']])}</defs>${bg(`url(#g${u})`)}
     <circle cx="50" cy="50" r="31" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>
     <circle cx="50" cy="50" r="19" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/>
     <circle cx="50" cy="50" r="8" fill="#fff"/>`,

  shortcuts: (u) =>
    `<defs>${lg('a' + u, [[0, '#4B6CF7'], [1, '#2B2FA8']])}${lg('b' + u, [[0, '#FF5E8A'], [1, '#C72BCB']], 0, 0, 1, 1)}${lg('c' + u, [[0, '#29D1F6'], [1, '#2A7CF0']], 0, 0, 1, 1)}</defs>${bg(`url(#a${u})`)}
     <rect x="30" y="30" width="44" height="44" rx="10" fill="url(#c${u})" transform="rotate(45 52 52) translate(4 4)" opacity=".95"/>
     <rect x="26" y="26" width="44" height="44" rx="10" fill="url(#b${u})" transform="rotate(45 48 48) translate(-4 -4)" opacity=".95"/>`,

  translate: (u) =>
    `<defs>${lg('g' + u, [[0, '#1E8BFF'], [1, '#0B5FD6']])}</defs>${bg(`url(#g${u})`)}
     <rect x="14" y="20" width="44" height="36" rx="9" fill="#fff"/>
     <rect x="42" y="44" width="44" height="36" rx="9" fill="#000" opacity=".9"/>
     <text x="36" y="46" font-size="24" text-anchor="middle" fill="#0B5FD6" font-weight="600" font-family="-apple-system,system-ui,sans-serif">A</text>
     <text x="64" y="70" font-size="21" text-anchor="middle" fill="#fff" font-family="-apple-system,system-ui,sans-serif">文</text>`,

  stocks: () =>
    `${bg('#000')}<path d="M10 70 L28 58 L40 64 L56 40 L70 48 L90 26" fill="none" stroke="#30D158" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
     <g stroke="#3a3a3c" stroke-width="1">${[30, 50, 70].map((y) => `<line x1="8" x2="92" y1="${y}" y2="${y}"/>`).join('')}</g>`,

  voicememos: () =>
    `${bg('#000')}<g stroke="#FF453A" stroke-width="3.5" stroke-linecap="round">${[
      8, 18, 30, 22, 40, 28, 16, 34, 24, 12, 20, 8,
    ]
      .map((hh, i) => `<line x1="${17 + i * 6}" x2="${17 + i * 6}" y1="${50 - hh / 2}" y2="${50 + hh / 2}"/>`)
      .join('')}</g>`,

  freeform: () =>
    `${bg('#fff')}<path d="M16 66 Q30 30 46 52 T80 34" fill="none" stroke="#0A84FF" stroke-width="6" stroke-linecap="round"/>
     <circle cx="70" cy="68" r="11" fill="#FFD60A"/><rect x="22" y="20" width="18" height="18" rx="4" fill="#FF375F"/>`,

  journal: (u) =>
    `<defs>${lg('g' + u, [[0, '#B79CFF'], [1, '#7E4DE0']], 0, 0, 1, 1)}</defs>${bg(`url(#g${u})`)}
     <rect x="27" y="20" width="46" height="60" rx="6" fill="#fff"/>
     <path d="M50 38 Q42 30 38 40 Q40 48 50 50 Q60 48 62 40 Q58 30 50 38Z" fill="#FF7AA8"/>
     <path d="M50 50 Q44 58 46 62 Q50 60 50 50 Q50 60 54 62 Q56 58 50 50Z" fill="#9F7BFF"/>`,

  passwords: (u) =>
    `<defs>${lg('g' + u, [[0, '#5AC8FA'], [1, '#007AFF']])}</defs>${bg('#fff')}
     <circle cx="38" cy="50" r="17" fill="none" stroke="url(#g${u})" stroke-width="8"/>
     <path d="M54 50 H86 M74 50 V62 M82 50 V58" stroke="url(#g${u})" stroke-width="8" stroke-linecap="round"/>`,

  contacts: (u) =>
    `<defs>${lg('g' + u, [[0, '#E6E6EA'], [1, '#B7B7BD']])}</defs>${bg(`url(#g${u})`)}
     <circle cx="50" cy="40" r="14" fill="#8E8E93"/><path d="M24 80 Q24 58 50 58 Q76 58 76 80Z" fill="#8E8E93"/>`,

  tips: (u) =>
    `<defs>${lg('g' + u, [[0, '#FFD84D'], [1, '#FFB300']])}</defs>${bg(`url(#g${u})`)}
     <circle cx="50" cy="42" r="17" fill="#fff"/><rect x="42" y="56" width="16" height="12" rx="2" fill="#fff"/><rect x="44" y="71" width="12" height="4" rx="2" fill="#fff"/>`,

  magnifier: () =>
    `${bg('#1c1c1e')}<circle cx="44" cy="44" r="20" fill="none" stroke="#fff" stroke-width="7"/><line x1="59" y1="59" x2="78" y2="78" stroke="#fff" stroke-width="9" stroke-linecap="round"/>`,

  compass: () =>
    `${bg('#000')}<circle cx="50" cy="50" r="34" fill="none" stroke="#fff" stroke-width="2"/><path d="M50 22 L57 50 L43 50Z" fill="#FF3B30"/><path d="M50 78 L57 50 L43 50Z" fill="#fff"/>`,

  games: (u) =>
    `<defs>${lg('g' + u, [[0, '#ff5f6d'], [0.5, '#a15cff'], [1, '#3ec7ff']], 0, 0, 1, 1)}</defs>${bg('#fff')}
     <circle cx="38" cy="38" r="14" fill="url(#g${u})"/><circle cx="62" cy="38" r="14" fill="#FFD60A" opacity=".9"/>
     <circle cx="38" cy="62" r="14" fill="#30D158" opacity=".9"/><circle cx="62" cy="62" r="14" fill="#0A84FF" opacity=".9"/>`,

  imageplayground: (u) =>
    `<defs>${rg('g' + u, [[0, '#fff'], [1, '#E4E4EA']])}</defs>${bg(`url(#g${u})`)}
     <circle cx="38" cy="40" r="15" fill="#FF9F0A"/><rect x="48" y="44" width="28" height="28" rx="8" fill="#5E5CE6"/><path d="M30 76 L44 54 L58 76Z" fill="#30D158"/>`,

  folder: () => `${bg('#000')}`,
};

export function iconSVG(id) {
  const u = uid('i');
  const fn = D[id] || D.contacts;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">${fn(u)}</svg>`;
}

// SF-Symbol-ish glyphs used inside the UI (stroke/fill = currentColor).
export const G = {
  wifi: `<svg viewBox="0 0 24 18"><g fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M2.2 6.6a14 14 0 0 1 19.6 0"/><path d="M5.6 10a9.2 9.2 0 0 1 12.8 0"/><path d="M9 13.3a4.4 4.4 0 0 1 6 0"/></g><circle cx="12" cy="16.2" r="1.6" fill="currentColor"/></svg>`,
  cell: `<svg viewBox="0 0 20 14"><rect x="0" y="9" width="3.4" height="5" rx="1" fill="currentColor"/><rect x="5.4" y="6.3" width="3.4" height="7.7" rx="1" fill="currentColor"/><rect x="10.8" y="3.4" width="3.4" height="10.6" rx="1" fill="currentColor"/><rect x="16.2" y="0" width="3.4" height="14" rx="1" fill="currentColor"/></svg>`,
  flashlight: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 2h10v4l-2 3v12a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V9L7 6Zm5 9a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1Z"/></svg>`,
  camera: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 4h6l1.5 2H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5Zm3 4.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"/></svg>`,
  lock: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 10V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Zm2 0h6V7a3 3 0 0 0-6 0Z"/></svg>`,
  unlock: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M15 10V7a3 3 0 0 0-6 0v.5H7V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"/></svg>`,
  search: `<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm4.8 11.3L20 20"/></svg>`,
  chevron: `<svg viewBox="0 0 10 16"><path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  back: `<svg viewBox="0 0 12 20"><path d="M10 2 2 10l8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  plane: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5Z"/></svg>`,
  antenna: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 9a2 2 0 0 1 1 3.7V21h-2v-8.3A2 2 0 0 1 12 9Zm-5-3.5 1.4 1.4a5 5 0 0 0 0 7.1L7 15.5a7 7 0 0 1 0-10Zm10 0a7 7 0 0 1 0 10l-1.4-1.4a5 5 0 0 0 0-7.1ZM4.2 2.7l1.4 1.4a9 9 0 0 0 0 12.8l-1.4 1.4a11 11 0 0 1 0-15.6Zm15.6 0a11 11 0 0 1 0 15.6l-1.4-1.4a9 9 0 0 0 0-12.8Z"/></svg>`,
  bt: `<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m7 7 10 10-5 4V3l5 4L7 17"/></svg>`,
  moon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5Z"/></svg>`,
  sun: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315]
    .map((a) => `<line x1="12" y1="2.5" x2="12" y2="4.5" transform="rotate(${a} 12 12)"/>`)
    .join('')}</g></svg>`,
  speaker: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9h3l5-4v14l-5-4H4Z"/><path d="M15 8.5a5 5 0 0 1 0 7M17.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  mirror: `<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="13" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="8.5" y="9" width="13" height="10" rx="2" fill="currentColor"/></svg>`,
  rotlock: `<svg viewBox="0 0 24 24"><path d="M19 12a7 7 0 1 1-2.1-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17.5 3v4.5H13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="9" y="11" width="6" height="5" rx="1" fill="currentColor"/><path d="M10.2 11V9.8a1.8 1.8 0 0 1 3.6 0V11" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`,
  timer: `<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 13V8.5M10 2.5h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  calc: `<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><rect x="7" y="5" width="10" height="4" rx="1" fill="currentColor"/><g fill="currentColor"><circle cx="8.5" cy="13" r="1.2"/><circle cx="12" cy="13" r="1.2"/><circle cx="15.5" cy="13" r="1.2"/><circle cx="8.5" cy="17" r="1.2"/><circle cx="12" cy="17" r="1.2"/><circle cx="15.5" cy="17" r="1.2"/></g></svg>`,
  play: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24"><rect x="5.5" y="4" width="4.5" height="16" rx="1.2" fill="currentColor"/><rect x="14" y="4" width="4.5" height="16" rx="1.2" fill="currentColor"/></svg>`,
  next: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 6.5v11a.8.8 0 0 0 1.2.7L12 13v4.5a.8.8 0 0 0 1.2.7l9-5.5a.8.8 0 0 0 0-1.4l-9-5.5a.8.8 0 0 0-1.2.7V11L4.2 5.8a.8.8 0 0 0-1.2.7Z"/></svg>`,
  prev: `<svg viewBox="0 0 24 24" style="transform:scaleX(-1)"><path fill="currentColor" d="M3 6.5v11a.8.8 0 0 0 1.2.7L12 13v4.5a.8.8 0 0 0 1.2.7l9-5.5a.8.8 0 0 0 0-1.4l-9-5.5a.8.8 0 0 0-1.2.7V11L4.2 5.8a.8.8 0 0 0-1.2.7Z"/></svg>`,
  plus: `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  compose: `<svg viewBox="0 0 24 24"><path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m17.5 3.5 3 3L12 15l-4 1 1-4Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  airpods: `<svg viewBox="0 0 48 48"><g fill="#f2f2f7"><path d="M14 8c-5 0-8 4-8 9 0 4 2 7 5 8l1 15c0 2 1 3 2.5 3S17 42 17 40V12c0-2-1-4-3-4Z"/><path d="M34 8c5 0 8 4 8 9 0 4-2 7-5 8l-1 15c0 2-1 3-2.5 3S31 42 31 40V12c0-2 1-4 3-4Z"/></g></svg>`,
  bell: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.5a6 6 0 0 1 6 6v4.5l2 3.5H4l2-3.5V8.5a6 6 0 0 1 6-6Zm-2.5 15.5h5a2.5 2.5 0 0 1-5 0Z"/></svg>`,
  phoneDown: `<svg viewBox="0 0 24 24"><path fill="currentColor" transform="rotate(135 12 12)" d="${handset}"/></svg>`,
  phoneUp: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="${handset}"/></svg>`,
  touchid: `<svg viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 14a17 17 0 0 1 24 0"/><path d="M9 22a16 16 0 0 1 30 0"/><path d="M15 38c-2-4-3-8-3-12a12 12 0 0 1 24 0"/><path d="M19 41c-2-5-3-10-3-15a8 8 0 0 1 16 0c0 3 0 6-1 9"/><path d="M24 26c0 6 1 11 4 16"/><path d="M36 30c0 3-.5 6-1.5 9"/></g></svg>`,
};

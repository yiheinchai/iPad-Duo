// Believable, stable-per-day fake data shared by widgets and apps.
import { rng } from './util.js';

const CONDS = [
  { k: 'clear', label: 'Clear', day: '☀️', night: '🌙' },
  { k: 'mostlyclear', label: 'Mostly Clear', day: '🌤️', night: '🌙' },
  { k: 'partly', label: 'Partly Cloudy', day: '⛅️', night: '☁️' },
  { k: 'cloudy', label: 'Cloudy', day: '☁️', night: '☁️' },
  { k: 'rain', label: 'Rain', day: '🌧️', night: '🌧️' },
  { k: 'showers', label: 'Showers', day: '🌦️', night: '🌧️' },
];

export function useFahrenheit() {
  return /^en-(US|LR|MM)/i.test(navigator.language || 'en-US');
}

export function weatherData(city = 'Cupertino') {
  const d = new Date();
  const seed = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
  const r = rng(seed * 7 + city.length * 131);
  const month = d.getMonth();
  // Northern-hemisphere seasonal baseline in °C.
  const base = [6, 7, 10, 13, 17, 21, 24, 24, 21, 16, 11, 7][month];
  const hi = Math.round(base + 3 + r() * 5);
  const lo = Math.round(hi - 6 - r() * 4);
  const condIdx = Math.floor(r() * 4.4);
  const hour = d.getHours();
  const tempAt = (hh) => {
    const t = (Math.sin(((hh - 9) / 24) * Math.PI * 2) + 1) / 2;
    return Math.round(lo + (hi - lo) * t);
  };
  const isNight = (hh) => hh < 7 || hh >= 19;
  const conv = (c) => (useFahrenheit() ? Math.round((c * 9) / 5 + 32) : c);
  const cond = CONDS[condIdx];
  const hourly = Array.from({ length: 24 }, (_, i) => {
    const hh = (hour + i) % 24;
    const c = CONDS[clampIdx(condIdx + Math.round((r() - 0.5) * 1.6))];
    return {
      label: i === 0 ? 'Now' : fmtHour(hh),
      icon: isNight(hh) ? c.night : c.day,
      temp: conv(tempAt(hh)),
    };
  });
  const days = ['Today'];
  for (let i = 1; i < 10; i++) {
    const dd = new Date(d.getTime() + i * 86400000);
    days.push(dd.toLocaleDateString('en-US', { weekday: 'short' }));
  }
  const daily = days.map((label, i) => {
    const c = i === 0 ? cond : CONDS[Math.floor(r() * CONDS.length)];
    const h2 = i === 0 ? hi : Math.round(base + 2 + r() * 7);
    const l2 = i === 0 ? lo : Math.round(h2 - 5 - r() * 5);
    return { label, icon: c.day, hi: conv(h2), lo: conv(l2), rain: c.k.includes('rain') || c.k === 'showers' ? Math.round(30 + r() * 60) : 0 };
  });
  return {
    city,
    now: conv(tempAt(hour)),
    hi: conv(hi),
    lo: conv(lo),
    cond: cond.label,
    icon: isNight(hour) ? cond.night : cond.day,
    night: isNight(hour),
    kind: cond.k,
    hourly,
    daily,
    feels: conv(tempAt(hour) - 1),
    uv: Math.max(0, Math.round(r() * 6 - (isNight(hour) ? 6 : 0))),
    wind: Math.round(5 + r() * 15),
    humidity: Math.round(40 + r() * 45),
  };
}

function clampIdx(i) {
  return Math.max(0, Math.min(CONDS.length - 1, i));
}
function fmtHour(hh) {
  if (!useFahrenheit()) return String(hh).padStart(2, '0');
  const ap = hh < 12 ? 'AM' : 'PM';
  return (hh % 12 || 12) + ap;
}

// Battery level drifts down slowly over the session so it looks alive.
const startLevel = 0.87;
const startAt = Date.now();
export function batteryLevel() {
  const mins = (Date.now() - startAt) / 60000;
  return Math.max(0.12, startLevel - mins * 0.0012);
}

export const CONTACTS = [
  { name: 'Alex', color: '#5E5CE6' },
  { name: 'Mum', color: '#FF375F' },
  { name: 'Sam', color: '#30D158' },
  { name: 'Jordan', color: '#FF9F0A' },
  { name: 'Taylor', color: '#64D2FF' },
  { name: 'Chris', color: '#BF5AF2' },
];

export const CONVERSATIONS = [
  {
    with: 'Alex',
    msgs: [
      { me: false, t: 'wait is that the new foldable iPhone??' },
      { me: true, t: 'yep, the Duo 😎' },
      { me: false, t: 'no way. how is the crease' },
      { me: true, t: 'honestly can barely see it' },
      { me: false, t: 'bring it tonight, need to see this' },
    ],
    time: '9:12',
  },
  {
    with: 'Mum',
    msgs: [
      { me: false, t: 'Did you eat?' },
      { me: true, t: 'Yes mum ❤️' },
      { me: false, t: 'Call me later' },
    ],
    time: 'Yesterday',
  },
  {
    with: 'Sam',
    msgs: [
      { me: true, t: 'Football Sunday?' },
      { me: false, t: 'Always. 10am same pitch' },
    ],
    time: 'Yesterday',
  },
  {
    with: 'Jordan',
    msgs: [
      { me: false, t: 'Sent you the photos from the trip' },
      { me: true, t: 'These are amazing 🙌' },
    ],
    time: 'Saturday',
  },
  {
    with: 'Taylor',
    msgs: [{ me: false, t: 'Thanks for yesterday!' }],
    time: 'Friday',
  },
];

export const SONGS = [
  { title: 'Golden Hour', artist: 'JVKE', len: 209, c: ['#f6a04d', '#7b2d26'] },
  { title: 'Midnight City', artist: 'M83', len: 243, c: ['#5b2a86', '#0e1a40'] },
  { title: 'Blinding Lights', artist: 'The Weeknd', len: 200, c: ['#d7263d', '#1b1b1e'] },
  { title: 'Sunflower', artist: 'Post Malone, Swae Lee', len: 158, c: ['#ffd23f', '#ee4266'] },
  { title: 'Levitating', artist: 'Dua Lipa', len: 203, c: ['#3bceac', '#0ead69'] },
];

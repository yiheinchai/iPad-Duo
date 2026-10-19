import { h } from '../util.js';
import { weatherData, useFahrenheit } from '../data.js';

export default {
  theme: 'dark',
  fullBleed: true,
  mount(root, api) {
    const wrap = h('div.wx');
    root.append(wrap);
    const render = () => {
      const d = weatherData(api.cfg.city);
      wrap.className = 'wx' + (d.night ? ' night' : '') + (d.kind.includes('rain') || d.kind === 'cloudy' ? ' overcast' : '');
      const lo = Math.min(...d.daily.map((x) => x.lo));
      const hi = Math.max(...d.daily.map((x) => x.hi));
      const span = hi - lo || 1;
      const hero = h('div.wx-hero', h('div.city', d.city), h('div.temp', d.now + '°'), h('div.cond', d.cond), h('div.hl', `H:${d.hi}°  L:${d.lo}°`));
      const hourly = h(
        'div.wx-card',
        h('div.hd', `${d.cond} conditions expected around ${d.hourly[3].label}.`),
        h('div.wx-hours', d.hourly.map((x) => h('div', h('span', x.label), h('span.i', x.icon), h('span', x.temp + '°'))))
      );
      const daily = h(
        'div.wx-card',
        h('div.hd', '📅  10-Day Forecast'),
        d.daily.map((x) =>
          h(
            'div.wx-day',
            h('span', x.label),
            h('span', x.icon),
            h('span.lo', x.lo + '°'),
            h('div.wx-bar', h('i', { style: { left: ((x.lo - lo) / span) * 100 + '%', right: (1 - (x.hi - lo) / span) * 100 + '%' } })),
            h('span', { style: { textAlign: 'right' } }, x.hi + '°')
          )
        )
      );
      const tile = (k, v, s) => h('div.wx-card.wx-tile', h('div.hd', k), h('b', v), h('span', s));
      const tiles = h(
        'div.wx-tiles',
        tile('☀︎ UV Index', String(d.uv), d.uv < 3 ? 'Low' : 'Moderate'),
        tile('🌡 Feels Like', d.feels + '°', 'Similar to the actual temperature.'),
        tile('💨 Wind', d.wind + (useFahrenheit() ? ' mph' : ' km/h'), 'Gusts up to ' + (d.wind + 8)),
        tile('💧 Humidity', d.humidity + '%', 'The dew point is ' + (d.lo - 2) + '° right now.')
      );
      const scroll = h('div.wx-scroll.scroll', hero, h('div.wx-cols', h('div', hourly, tiles), h('div', daily)));
      wrap.replaceChildren(scroll);
    };
    render();
    api.os.onMinute.push(render);
    return {};
  },
};

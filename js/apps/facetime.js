import { h, tone } from '../util.js';
import { G } from '../icons.js';
import { section } from './ui.js';
import { getStream, stopStream } from './camera.js';

const VIDEO = `<svg viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="12" rx="3" fill="currentColor"/><path d="M17 10.5 22 7v10l-5-3.5Z" fill="currentColor"/></svg>`;
const LINK = `<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;

export default {
  theme: 'dark',
  mount(root, api) {
    const video = h('video', { playsinline: true, muted: true, autoplay: true });
    video.muted = true;
    let stream;
    let active = false;
    const newBtn = h('div.green', { html: VIDEO }, 'New FaceTime');
    const ui = h(
      'div.ft-ui.scroll',
      h('h1', 'FaceTime'),
      h('div.ft-btns', h('div', { html: LINK }, 'Create Link'), newBtn),
      h('div.ft-list', section(['Mum', 'Alex', 'Jordan', 'Sam'].map((n, i) => ({ title: n, sub: i % 2 ? 'FaceTime Audio' : 'FaceTime Video', detail: ['Yesterday', 'Sunday', 'Friday', '12/10'][i], onClick: () => call(n) })), {}))
    );
    newBtn.addEventListener('click', () => call('Mum'));
    const wrap = h('div.ft', video, ui);
    root.append(wrap);

    function call(name) {
      const v2 = h('video', { playsinline: true, muted: true, autoplay: true });
      v2.muted = true;
      v2.srcObject = stream || null;
      v2.play().catch(() => {});
      const end = h('div.ft-end', { html: G.phoneDown });
      const live = h('div.ft-live', v2, h('div.ft-calling', name, h('span', 'FaceTime…')), end);
      wrap.append(live);
      tone([660, 880], 300, 0.05);
      end.addEventListener('click', () => {
        tone(440, 200, 0.05);
        live.remove();
      });
    }

    async function start() {
      try {
        stream = await getStream('user');
        if (!active) return stopStream(stream);
        video.srcObject = stream;
        video.play().catch(() => {});
      } catch {}
    }
    return {
      show() {
        active = true;
        start();
      },
      hide() {
        active = false;
        stopStream(stream);
        stream = null;
      },
      destroy() {
        active = false;
        stopStream(stream);
      },
    };
  },
};

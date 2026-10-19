import { h, store, tone } from '../util.js';
import { G } from '../icons.js';
import { navStack, glassBtn, searchField } from './ui.js';
import { CONVERSATIONS, CONTACTS } from '../data.js';

const VIDEO = `<svg viewBox="0 0 24 24"><rect x="2.5" y="6.5" width="13" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M15.5 10.5 21 7.5v9l-5.5-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
const FILTER = `<svg viewBox="0 0 24 24"><path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const REPLIES = ['haha no way', 'ok 👍', 'send pics!!', 'lol', 'sounds good', 'omg 😂', 'see you soon', 'wait really?'];
const SEND = `<svg viewBox="0 0 24 24"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export default {
  theme: 'dark',
  mount(root, api) {
    const convs = store.get('convs', CONVERSATIONS);
    const save = () => store.set('convs', convs);
    let wide = null;
    let nav;
    let current = null;
    let listEl;
    let mainPane;
    const color = (name) => CONTACTS.find((c) => c.name === name)?.color;
    const av = (name, cls = 'av') => h('div.' + cls, { style: color(name) ? { background: `linear-gradient(${color(name)}, ${shade(color(name))})` } : {} }, name[0]);

    const pullPending = () => {
      const p = api.os.pendingMessage;
      if (!p) return;
      api.os.pendingMessage = null;
      let c = convs.find((x) => x.with === p.from);
      if (!c) {
        c = { with: p.from, msgs: [], time: 'now' };
        convs.unshift(c);
      }
      c.msgs.push({ me: false, t: p.text });
      c.time = 'now';
      convs.splice(convs.indexOf(c), 1);
      convs.unshift(c);
      save();
    };

    const renderList = () => {
      listEl.replaceChildren(
        ...convs.map((c) => {
          const last = c.msgs[c.msgs.length - 1];
          const r = h('div.conv' + (wide && current === c ? '.sel' : ''), av(c.with), h('div.m', h('div.t', h('b', c.with), h('span', c.time + ' ›')), h('div.p', last ? last.t : '')));
          r.addEventListener('click', () => openChat(c));
          return r;
        })
      );
    };

    const chatView = (c) => {
      const body = h('div.chat-body.scroll');
      const send = h('div.send', { html: SEND });
      const field = api.field({
        placeholder: 'iMessage',
        returnLabel: 'send',
        onChange: (v) => send.classList.toggle('on', !!v.trim()),
        onSubmit: () => doSend(),
      });
      const plus = h('div.plus', { html: G.plus });
      const composer = h('div.composer', plus, h('div.box', field.el, send));
      const renderMsgs = () => {
        body.replaceChildren(h('div.day', 'iMessage\nToday ' + new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })));
        c.msgs.forEach((m, i) => {
          body.append(h('div.bub.' + (m.me ? 'me' : 'them'), m.t));
          if (m.me && i === c.msgs.length - 1) body.append(h('div.delivered', 'Delivered'));
        });
        requestAnimationFrame(() => (body.scrollTop = body.scrollHeight));
      };
      const doSend = () => {
        const t = field.value.trim();
        if (!t) return;
        c.msgs.push({ me: true, t });
        c.time = 'now';
        field.set('');
        send.classList.remove('on');
        save();
        tone([1760, 2349], 90, 0.05);
        renderMsgs();
        if (wide) renderList();
        setTimeout(() => {
          const typing = h('div.bub.them.typing', h('i'), h('i'), h('i'));
          body.append(typing);
          body.scrollTop = body.scrollHeight;
          setTimeout(() => {
            typing.remove();
            c.msgs.push({ me: false, t: REPLIES[Math.floor(Math.random() * REPLIES.length)] });
            save();
            renderMsgs();
            tone([1318, 1046], 160, 0.05);
          }, 1800);
        }, 900);
      };
      send.addEventListener('click', (e) => {
        e.stopPropagation();
        doSend();
      });
      body.addEventListener('click', () => api.keyboard.close());
      renderMsgs();
      const head = h('div.chat-head', av(c.with), h('div.n', c.with + ' ›'));
      return { el: h('div.chat', body, head, composer), head };
    };

    const openChat = (c) => {
      current = c;
      api.keyboard.close();
      const { el, head } = chatView(c);
      if (wide) {
        mainPane.replaceChildren(el);
        renderList();
        api.rail.top([glassBtn(VIDEO)]);
      } else {
        const page = nav.push({ title: '', large: false, content: el, right: [glassBtn(VIDEO)] });
        page._scroller.replaceWith(el);
      }
      void head;
    };

    const listView = () => {
      listEl = h('div');
      renderList();
      const pinned = h('div.pinned', convs.slice(0, 3).map((c) => {
        const p = h('div', av(c.with), c.with);
        p.addEventListener('click', () => openChat(c));
        return p;
      }));
      return { title: 'Messages', subtitle: wide ? convs.length + ' Conversations' : '', large: !wide, left: wide ? glassBtn(FILTER) : null, right: wide ? [glassBtn(G.compose)] : [glassBtn(FILTER), glassBtn(G.compose)], content: h('div', searchField(api), pinned, listEl) };
    };

    const layout = () => {
      const w = root.clientWidth > 700;
      if (w === wide) return;
      wide = w;
      api.keyboard.close();
      root.replaceChildren();
      api.rail.top([]);
      const wrap = h('div.msgs');
      root.append(wrap);
      if (wide) {
        const side = h('div.side');
        mainPane = h('div.main');
        wrap.append(h('div.split2', side, mainPane));
        nav = navStack(side, { inline: true });
        nav.reset(listView());
        openChat(current || convs[0]);
      } else {
        nav = navStack(wrap, { api });
        nav.reset(listView());
        if (current) openChat(current);
      }
    };
    requestAnimationFrame(layout);
    return {
      resize: () => requestAnimationFrame(layout),
      show: () => {
        const had = !!api.os.pendingMessage;
        pullPending();
        if (had) {
          current = convs[0];
          wide = null;
        }
        requestAnimationFrame(layout);
      },
    };
  },
};

function shade(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.round(v * 0.6));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

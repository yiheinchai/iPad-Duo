import { h, store } from '../util.js';
import { G } from '../icons.js';
import { navStack, glassBtn, searchField } from './ui.js';

const SAMPLE = [
  { id: 1, text: 'iPhone Duo first impressions\nThe crease is basically invisible with the nano-texture. Inner display is perfect for reading. Outer screen feels like a normal phone.', t: Date.now() - 3600e3 },
  { id: 2, text: 'Groceries\n- Oat milk\n- Eggs\n- Sourdough\n- Avocados\n- Coffee beans', t: Date.now() - 86400e3 },
  { id: 3, text: 'Gift ideas\nAirPods case, a nice notebook, concert tickets', t: Date.now() - 3 * 86400e3 },
  { id: 4, text: 'Trip packing list\nPassport, chargers, adapter, sunglasses', t: Date.now() - 9 * 86400e3 },
];

export default {
  theme: 'dark',
  mount(root, api) {
    let notes = store.get('notes', SAMPLE);
    let current = null;
    let wide = null;
    let nav;
    let listEl;
    const save = () => store.set('notes', notes);
    const title = (n) => n.text.split('\n')[0] || 'New Note';
    const preview = (n) => {
      const d = new Date(n.t);
      const when = Date.now() - n.t < 86400e3 ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : d.toLocaleDateString();
      return when + '  ' + (n.text.split('\n').slice(1).join(' ') || 'No additional text');
    };

    const renderList = () => {
      listEl.replaceChildren(
        ...notes
          .sort((a, b) => b.t - a.t)
          .map((n) => {
            const r = h('div.note-row' + (wide && current?.id === n.id ? '.sel' : ''), h('b', title(n)), h('span', preview(n)));
            r.addEventListener('click', () => openNote(n));
            return r;
          })
      );
    };

    const editor = (n) => {
      const f = api.field({
        multiline: true,
        value: n.text,
        placeholder: '',
        onChange: (v) => {
          n.text = v;
          n.t = Date.now();
          save();
          if (wide) renderList();
        },
      });
      const ed = h('div.note-ed.scroll', h('div.date', new Date(n.t).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })), f.el);
      ed.addEventListener('click', () => f.focus());
      return { el: ed, f };
    };

    const openNote = (n) => {
      current = n;
      const { el, f } = editor(n);
      if (wide) {
        mainPane.replaceChildren(el, h('div.navbar', h('div.nb-side'), h('div.nb-title'), h('div.nb-side.right', glassBtn(G.compose, newNote))));
        renderList();
      } else {
        nav.push({ title: '', large: false, backLabel: 'Notes', content: el, right: glassBtn(G.compose, newNote) });
        el.style.position = 'relative';
        el.style.padding = '10px 22px 300px';
      }
      if (!n.text) setTimeout(() => f.focus(), 350);
    };

    const newNote = () => {
      const n = { id: Date.now(), text: '', t: Date.now() };
      notes.unshift(n);
      save();
      if (wide) renderList();
      openNote(n);
    };

    const listView = () => {
      listEl = h('div.note-list');
      renderList();
      return {
        title: 'Notes',
        content: h('div', searchField(api), listEl, h('div', { style: { textAlign: 'center', color: 'rgba(235,235,245,.6)', fontSize: '13px', marginTop: '14px' } }, notes.length + ' Notes')),
        right: glassBtn(G.compose, newNote),
      };
    };

    let mainPane;
    const layout = () => {
      const w = root.clientWidth > 700;
      if (w === wide) return;
      wide = w;
      api.keyboard.close();
      root.replaceChildren();
      const wrap = h('div.notes');
      root.append(wrap);
      if (wide) {
        const side = h('div.side');
        mainPane = h('div.main');
        wrap.append(h('div.split2', side, mainPane));
        nav = navStack(side);
        nav.reset(listView());
        openNote(current || notes[0]);
      } else {
        nav = navStack(wrap);
        nav.reset(listView());
        if (current) openNote(current);
      }
    };
    requestAnimationFrame(layout);
    return { resize: () => requestAnimationFrame(layout), show: () => requestAnimationFrame(layout) };
  },
};

import { h, store } from '../util.js';
import { G } from '../icons.js';
import { navStack, glassBtn, rgroup, searchField, MIC, DOTS } from './ui.js';

const SAMPLE = [
  { id: 1, text: 'iPhone Duo first impressions\nThe crease is basically invisible with the nano-texture. Inner display is perfect for reading. Outer screen feels like a normal phone.', t: Date.now() - 3600e3 },
  { id: 2, text: 'Groceries\n- Oat milk\n- Eggs\n- Sourdough\n- Avocados\n- Coffee beans', t: Date.now() - 86400e3 },
  { id: 3, text: 'Gift ideas\nAirPods case, a nice notebook, concert tickets', t: Date.now() - 3 * 86400e3 },
  { id: 4, text: 'Trip packing list\nPassport, chargers, adapter, sunglasses', t: Date.now() - 9 * 86400e3 },
];

const I = {
  sidebar: `<svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.5 4.5v15M5.5 8h2M5.5 11h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  expand: `<svg viewBox="0 0 24 24"><path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  share: `<svg viewBox="0 0 24 24"><path d="M12 15V3.5M8 7.2 12 3.3l4 3.9M8.5 10H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  check: `<svg viewBox="0 0 24 24"><circle cx="6" cy="7" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4.8 7.1l1 1 1.8-2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="6" cy="16" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 7h9M11 16h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  clip: `<svg viewBox="0 0 24 24"><path d="M16.5 7.5 9 15a2 2 0 0 0 2.8 2.8l7.6-7.6a4 4 0 0 0-5.7-5.7L6 12.2a6 6 0 0 0 8.5 8.5l5.3-5.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  pen: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 5.5 8.6 15.8h6.8Z M10.2 18.5 12 15.8l1.8 2.7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
};

export default {
  theme: 'dark',
  mount(root, api) {
    let notes = store.get('notes', SAMPLE);
    let current = null;
    let wide = null;
    let nav;
    let listEl;
    let mainPane;
    const save = () => store.set('notes', notes);
    const title = (n) => n.text.split('\n')[0] || 'New Note';
    const when = (n) => {
      const d = new Date(n.t);
      return Date.now() - n.t < 86400e3 ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : d.toLocaleDateString();
    };
    const preview = (n) => n.text.split('\n').slice(1).join(' ') || 'No additional text';

    const renderList = () => {
      listEl.replaceChildren(
        ...notes
          .sort((a, b) => b.t - a.t)
          .map((n) => {
            const r = h('div.note-row' + (wide && current?.id === n.id ? '.sel' : ''), h('b', title(n)), h('span', when(n) + '  ' + preview(n)));
            r.addEventListener('click', () => openNote(n));
            return r;
          })
      );
    };

    // Editor: first line is the note's title, like Notes.
    const editor = (n) => {
      const head = h('div.note-title', title(n));
      const f = api.field({
        multiline: true,
        value: n.text.split('\n').slice(1).join('\n'),
        onChange: (v) => {
          n.text = title(n) + '\n' + v;
          n.t = Date.now();
          save();
          if (wide) renderList();
        },
      });
      const ed = h('div.note-ed.scroll', head, f.el);
      ed.addEventListener('click', () => f.focus());
      return { el: ed, f };
    };

    const railFor = () => {
      api.rail.top([glassBtn(I.expand), rgroup(glassBtn(I.share), glassBtn(DOTS))]);
      api.rail.bottom([rgroup(glassBtn(I.check), glassBtn(I.clip), glassBtn(I.pen)), glassBtn(G.compose, newNote)]);
    };

    const openNote = (n) => {
      current = n;
      const { el, f } = editor(n);
      if (wide) {
        mainPane.replaceChildren(el);
        renderList();
        railFor();
      } else {
        nav.push({ title: '', large: false, content: el, right: [rgroup(glassBtn(I.share), glassBtn(DOTS))], bottom: [rgroup(glassBtn(I.check), glassBtn(I.clip), glassBtn(I.pen)), glassBtn(G.compose, newNote)] });
        el.style.position = 'relative';
        el.style.padding = '0 26px 300px';
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
        subtitle: notes.length + (notes.length === 1 ? ' Note' : ' Notes'),
        large: !wide,
        left: wide ? glassBtn(I.sidebar) : null,
        right: wide ? glassBtn(DOTS) : [],
        bottom: wide ? undefined : [glassBtn(G.compose, newNote)],
        content: h('div', wide ? null : searchField(api), h('div.notes-sec', 'Today'), listEl),
      };
    };

    const layout = () => {
      const w = root.clientWidth > 640;
      if (w === wide) return;
      wide = w;
      api.keyboard.close();
      root.replaceChildren();
      api.rail.top([]);
      api.rail.bottom([]);
      const wrap = h('div.notes' + (wide ? '.wide-notes' : ''));
      root.append(wrap);
      if (wide) {
        const side = h('div.side');
        mainPane = h('div.main');
        wrap.append(h('div.split2', side, mainPane));
        nav = navStack(side, { inline: true });
        nav.reset(listView());
        side.append(h('div.side-search', { html: G.search }, h('span', 'Search'), h('span.mic', { html: MIC })));
        openNote(current || notes[0]);
      } else {
        nav = navStack(wrap, { api });
        nav.reset(listView());
        if (current) openNote(current);
      }
    };
    requestAnimationFrame(layout);
    return { resize: () => requestAnimationFrame(layout), show: () => requestAnimationFrame(layout) };
  },
};

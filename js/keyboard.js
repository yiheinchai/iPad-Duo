// Custom iOS-style keyboard + fake text fields, so the real iPad keyboard never appears.
import { h, tick } from './util.js';

const ROWS = {
  abc: [
    'qwertyuiop'.split(''),
    'asdfghjkl'.split(''),
    ['⇧', ...'zxcvbnm'.split(''), '⌫'],
    ['123', '☺', 'space', 'return'],
  ],
  num: [
    '1234567890'.split(''),
    ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
    ['#+=', '.', ',', '?', '!', "'", '⌫'],
    ['ABC', '☺', 'space', 'return'],
  ],
  sym: [
    ['[', ']', '{', '}', '#', '%', '^', '*', '+', '='],
    ['_', '\\', '|', '~', '<', '>', '€', '£', '¥', '•'],
    ['123', '.', ',', '?', '!', "'", '⌫'],
    ['ABC', '☺', 'space', 'return'],
  ],
};
const EMOJI = ['😂', '❤️', '😍', '🔥', '👍', '😎', '🙌', '😭', '🥹', '✨', '🎉', '👀'];

export class Keyboard {
  constructor(os) {
    this.os = os;
    this.el = h('div.kb');
    this.target = null;
    this.layer = 'abc';
    this.shift = 0; // 0 off, 1 once, 2 caps lock
    this.render();
    this.el.addEventListener('pointerdown', (e) => e.stopPropagation());
  }

  get isOpen() {
    return !!this.target;
  }

  open(target) {
    if (this.target && this.target !== target) this.target.blur(true);
    this.target = target;
    this.layer = 'abc';
    this.autoShift();
    this.render();
    this.el.classList.add('open');
    this.os.el.classList.add('kb-open');
  }

  close() {
    const t = this.target;
    this.target = null;
    this.el.classList.remove('open');
    this.os.el.classList.remove('kb-open');
    if (t) t.blur(true);
  }

  autoShift() {
    if (!this.target) return;
    const v = this.target.value;
    this.shift = this.shift === 2 ? 2 : !v || /[.!?]\s$/.test(v) || /\n$/.test(v) ? 1 : 0;
  }

  press(k) {
    tick(0.12);
    const t = this.target;
    if (!t) return;
    if (k === '⇧') {
      this.shift = this.shift ? 0 : 1;
      const now = performance.now();
      if (this.lastShift && now - this.lastShift < 300) this.shift = 2;
      this.lastShift = now;
    } else if (k === '⌫') t.backspace();
    else if (k === '123') this.layer = 'num';
    else if (k === 'ABC') this.layer = 'abc';
    else if (k === '#+=') this.layer = 'sym';
    else if (k === 'space') {
      t.insert(' ');
      if (this.layer !== 'abc') this.layer = 'abc';
    } else if (k === 'return') {
      if (t.multiline) t.insert('\n');
      else t.submit();
    } else if (k === '☺') t.insert(EMOJI[Math.floor(Math.random() * EMOJI.length)]);
    else {
      t.insert(this.shift ? k.toUpperCase() : k);
      if (this.shift === 1) this.shift = 0;
    }
    if (k !== '⇧') this.autoShift();
    this.render();
  }

  render() {
    const rows = ROWS[this.layer];
    const rowsEl = rows.map((row, ri) =>
      h(
        `div.kb-row.r${ri}`,
        row.map((k) => {
          const special = k.length > 1 || '⇧⌫☺'.includes(k);
          let label = k;
          if (k === 'space') label = 'space';
          if (k === 'return') label = this.target && !this.target.multiline && this.target.returnLabel ? this.target.returnLabel : 'return';
          if (!special && this.layer === 'abc' && this.shift) label = k.toUpperCase();
          const key = h(
            `div.kb-key${special ? '.sp' : ''}.k-${keyClass(k)}${k === '⇧' && this.shift ? '.on' : ''}${k === 'return' && this.target?.returnLabel ? '.blue' : ''}`,
            k === '⇧'
              ? { html: this.shift === 2 ? '⇪' : '⇧' }
              : k === '⌫'
              ? { html: '<svg viewBox="0 0 28 20"><path d="M9 2h15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9l-7-8Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m13 7 6 6m0-6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' }
              : {},
            k === '⇧' || k === '⌫' ? null : label
          );
          let repeat;
          key.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            key.classList.add('down');
            if (k === '⌫') {
              this.press(k);
              repeat = setTimeout(function rep() {
                this.press('⌫');
                repeat = setTimeout(rep.bind(this), 80);
              }.bind(this), 450);
            }
          });
          const up = (fire) => {
            if (!key.classList.contains('down')) return;
            key.classList.remove('down');
            clearTimeout(repeat);
            if (fire && k !== '⌫') this.press(k);
          };
          key.addEventListener('pointerup', () => up(true));
          key.addEventListener('pointerleave', () => up(false));
          key.addEventListener('pointercancel', () => up(false));
          return key;
        })
      )
    );
    this.el.replaceChildren(h('div.kb-bar', h('span', 'I'), h('span', 'The'), h('span', "I'm")), ...rowsEl, h('div.kb-foot', h('span.kb-globe', '🌐'), h('span.kb-mic', '🎙')));
  }
}

function keyClass(k) {
  return { '⇧': 'shift', '⌫': 'del', '☺': 'emoji', '123': 'mode', ABC: 'mode', '#+=': 'mode2' }[k] || (k.length > 1 ? k : 'ch');
}

// A div that behaves like a text field but drives the custom keyboard.
export class FakeField {
  constructor(os, { placeholder = '', multiline = false, value = '', onSubmit, onChange, onFocus, onBlur, returnLabel, className = '' } = {}) {
    this.os = os;
    this.multiline = multiline;
    this.value = value;
    this.onSubmit = onSubmit;
    this.onChange = onChange;
    this.onFocus = onFocus;
    this.onBlur = onBlur;
    this.returnLabel = returnLabel;
    this.textEl = h('span.ff-text');
    this.caret = h('span.ff-caret');
    this.ph = h('span.ff-ph', placeholder);
    this.el = h('div.ff' + (multiline ? '.multi' : '') + (className ? '.' + className : ''), this.ph, this.textEl, this.caret);
    this.el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.focus();
    });
    this.sync();
  }
  focus() {
    if (this.focused) return;
    this.focused = true;
    this.el.classList.add('focused');
    this.os.keyboard.open(this);
    this.onFocus && this.onFocus();
  }
  blur(fromKb) {
    if (!this.focused) return;
    this.focused = false;
    this.el.classList.remove('focused');
    if (!fromKb) this.os.keyboard.close();
    this.onBlur && this.onBlur();
  }
  set(v) {
    this.value = v;
    this.sync();
  }
  insert(s) {
    this.value += s;
    this.sync(true);
  }
  backspace() {
    this.value = [...this.value].slice(0, -1).join('');
    this.sync(true);
  }
  submit() {
    this.onSubmit && this.onSubmit(this.value);
  }
  sync(changed) {
    this.textEl.textContent = this.value;
    this.ph.style.display = this.value ? 'none' : '';
    if (changed && this.onChange) this.onChange(this.value);
    // Keep the caret visible without scrollIntoView (which would also scroll overflow:hidden ancestors).
    const sc = this.multiline && this.el.closest('.scroll');
    if (sc) {
      const cb = this.caret.getBoundingClientRect().bottom;
      const sb = sc.getBoundingClientRect().bottom;
      if (cb > sb - 10) sc.scrollTop += cb - sb + 40;
    }
  }
}

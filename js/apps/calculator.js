import { h, tick } from '../util.js';
import { G } from '../icons.js';

const PREC = { '+': 1, '−': 1, '×': 2, '÷': 2, '^': 3, 'ʸ√': 3, EE: 4 };
const RIGHT = { '^': true, 'ʸ√': true };

function evaluate(tokens) {
  const out = [];
  const ops = [];
  const apply = () => {
    const op = ops.pop();
    const b = out.pop();
    const a = out.pop();
    let r;
    switch (op) {
      case '+': r = a + b; break;
      case '−': r = a - b; break;
      case '×': r = a * b; break;
      case '÷': r = a / b; break;
      case '^': r = Math.pow(a, b); break;
      case 'ʸ√': r = Math.pow(a, 1 / b); break;
      case 'EE': r = a * Math.pow(10, b); break;
    }
    out.push(r);
  };
  for (const t of tokens) {
    if (typeof t === 'number') out.push(t);
    else if (t === '(') ops.push(t);
    else if (t === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') apply();
      ops.pop();
    } else {
      while (ops.length && ops[ops.length - 1] !== '(' && (PREC[ops[ops.length - 1]] > PREC[t] || (PREC[ops[ops.length - 1]] === PREC[t] && !RIGHT[t]))) apply();
      ops.push(t);
    }
  }
  while (ops.length) {
    if (ops[ops.length - 1] === '(') ops.pop();
    else apply();
  }
  return out.pop() ?? 0;
}

function fact(n) {
  if (n < 0 || n > 170 || !Number.isInteger(n)) return NaN;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export default {
  theme: 'dark',
  mount(root, api) {
    let entry = '0';
    let tokens = [];
    let fresh = true;
    let activeOp = null;
    let mem = 0;
    let rad = false;
    let second = false;
    let wide = false;

    const disp = h('div.calc-disp', '0');
    const expr = h('div.calc-expr');
    const sci = h('div.calc-sci');
    const main = h('div.calc-main');
    const wrap = h('div.calc', expr, disp, h('div.calc-keys', sci, main));
    root.append(wrap);

    const maxDigits = () => (wide ? 16 : 9);
    const fmt = (v) => {
      if (typeof v === 'string') {
        if (v === 'Error') return v;
        const neg = v.startsWith('-');
        const [i, d] = v.replace('-', '').split('.');
        return (neg ? '-' : '') + Number(i).toLocaleString('en-US') + (d !== undefined ? '.' + d : '');
      }
      return v;
    };
    const numToStr = (n) => {
      if (!isFinite(n)) return 'Error';
      const md = maxDigits();
      if (Math.abs(n) >= Math.pow(10, md) || (Math.abs(n) < 1e-8 && n !== 0)) return n.toExponential(md - 5).replace('e+', 'e');
      let s = String(parseFloat(n.toPrecision(md)));
      if (s.replace(/[-.]/g, '').length > md) s = String(parseFloat(n.toFixed(Math.max(0, md - String(Math.trunc(Math.abs(n))).length))));
      return s;
    };
    const show = () => {
      const s = fmt(entry);
      disp.textContent = s;
      const len = s.length;
      const base = wide ? 72 : 86;
      const max = wide ? 15 : 7;
      disp.style.fontSize = (len > max ? (base * max) / len : base) + 'px';
      expr.textContent = tokens.length ? tokens.map((t) => (typeof t === 'number' ? fmt(numToStr(t)) : t)).join(' ') : '';
      acKey.textContent = entry !== '0' && !fresh ? '⌫' : 'AC';
      if (acKey.textContent === '⌫') acKey.innerHTML = `<svg viewBox="0 0 28 20" style="width:34px;height:24px"><path d="M9 2h15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9l-7-8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m13 7 6 6m0-6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
      opKeys.forEach((k) => k.classList.toggle('on', k.dataset.op === activeOp));
      radKey && (radKey.textContent = rad ? 'Deg' : 'Rad');
      expr.dataset.mode = rad ? 'Rad' : '';
    };
    const cur = () => parseFloat(entry) || 0;
    const setEntry = (n) => {
      entry = numToStr(n);
      fresh = true;
      activeOp = null;
    };

    const press = (k) => {
      tick(0.1);
      if (entry === 'Error' && k !== 'AC') entry = '0';
      if (/^[0-9]$/.test(k)) {
        if (fresh) entry = k;
        else if (entry.replace(/[-.]/g, '').length < maxDigits()) entry = entry === '0' ? k : entry === '-0' ? '-' + k : entry + k;
        fresh = false;
        activeOp = null;
      } else if (k === '.') {
        if (fresh) entry = '0.';
        else if (!entry.includes('.')) entry += '.';
        fresh = false;
        activeOp = null;
      } else if (k in PREC) {
        if (activeOp && fresh) tokens[tokens.length - 1] = k;
        else {
          tokens.push(cur(), k);
          if (k === '+' || k === '−') {
            const t = tokens.slice(0, -1);
            const open = t.filter((x) => x === '(').length - t.filter((x) => x === ')').length;
            if (!open) entry = numToStr(evaluate(t));
          }
        }
        activeOp = k;
        fresh = true;
      } else if (k === '=') {
        if (!tokens.length) return show();
        tokens.push(cur());
        setEntry(evaluate(tokens));
        tokens = [];
      } else if (k === 'AC') {
        if (acKey.textContent !== 'AC' && entry !== '0' && !fresh) {
          entry = entry.length > 1 && !(entry.length === 2 && entry.startsWith('-')) ? entry.slice(0, -1) : '0';
        } else {
          entry = '0';
          tokens = [];
          activeOp = null;
          fresh = true;
        }
      } else if (k === '±') {
        entry = entry.startsWith('-') ? entry.slice(1) : '-' + entry;
      } else if (k === '%') setEntry(cur() / 100);
      else if (k === '(') {
        tokens.push('(');
        fresh = true;
      } else if (k === ')') {
        tokens.push(cur(), ')');
        fresh = true;
        entry = numToStr(evaluate(tokens.slice()));
      } else if (k === '2nd') {
        second = !second;
        renderSci();
      } else if (k === 'Rad' || k === 'Deg') {
        rad = !rad;
      } else if (k === 'mc') mem = 0;
      else if (k === 'm+') mem += cur();
      else if (k === 'm-') mem -= cur();
      else if (k === 'mr') setEntry(mem);
      else if (k === 'calc') {
        // Mode button: nothing fancy, flash the keys like iOS' menu would.
        wrap.animate([{ opacity: 1 }, { opacity: 0.6 }, { opacity: 1 }], { duration: 250 });
      } else {
        const x = cur();
        const ang = (v) => (rad ? v : (v * Math.PI) / 180);
        const inv = (v) => (rad ? v : (v * 180) / Math.PI);
        const F = {
          'x²': () => x * x,
          'x³': () => x * x * x,
          'eˣ': () => Math.exp(x),
          '10ˣ': () => Math.pow(10, x),
          '¹/x': () => 1 / x,
          '²√x': () => Math.sqrt(x),
          '³√x': () => Math.cbrt(x),
          ln: () => Math.log(x),
          'log₁₀': () => Math.log10(x),
          'x!': () => fact(x),
          sin: () => Math.sin(ang(x)),
          cos: () => Math.cos(ang(x)),
          tan: () => Math.tan(ang(x)),
          'sin⁻¹': () => inv(Math.asin(x)),
          'cos⁻¹': () => inv(Math.acos(x)),
          'tan⁻¹': () => inv(Math.atan(x)),
          sinh: () => Math.sinh(x),
          cosh: () => Math.cosh(x),
          tanh: () => Math.tanh(x),
          e: () => Math.E,
          π: () => Math.PI,
          Rand: () => Math.random(),
        };
        if (F[k]) setEntry(F[k]());
      }
      show();
    };

    const key = (label, cls = '', op) => {
      const k = h('div.ck' + cls, label);
      if (op) k.dataset.op = op;
      k.addEventListener('click', (e) => {
        e.stopPropagation();
        press(op || label);
      });
      return k;
    };
    const acKey = key('AC', '.fn', 'AC');
    const calcIcon = key('', '', 'calc');
    calcIcon.innerHTML = `<svg viewBox="0 0 24 24" style="width:30px;height:30px">${G.calc.replace(/<\/?svg[^>]*>/g, '')}</svg>`;
    const opKeys = [key('÷', '.op', '÷'), key('×', '.op', '×'), key('−', '.op', '−'), key('+', '.op', '+')];
    main.append(
      acKey, key('+/−', '.fn', '±'), key('%', '.fn', '%'), opKeys[0],
      key('7'), key('8'), key('9'), opKeys[1],
      key('4'), key('5'), key('6'), opKeys[2],
      key('1'), key('2'), key('3'), opKeys[3],
      calcIcon, key('0'), key('.', '', '.'), key('=', '.op', '=')
    );

    let radKey;
    const renderSci = () => {
      const trig = second ? ['sin⁻¹', 'cos⁻¹', 'tan⁻¹'] : ['sin', 'cos', 'tan'];
      const keys = [
        '(', ')', 'mc', 'm+', 'm-', 'mr',
        '2nd', 'x²', 'x³', 'xʸ', 'eˣ', '10ˣ',
        '¹/x', '²√x', '³√x', 'ʸ√x', 'ln', 'log₁₀',
        'x!', trig[0], trig[1], trig[2], 'e', 'EE',
        'Rad', 'sinh', 'cosh', 'tanh', 'π', 'Rand',
      ];
      const map = { 'xʸ': '^', 'ʸ√x': 'ʸ√' };
      sci.replaceChildren(
        ...keys.map((k) => {
          const el = key(k, '.sci' + (k === '2nd' && second ? '.on' : ''), map[k] || k);
          if (k === 'Rad') radKey = el;
          return el;
        })
      );
    };
    renderSci();

    const layout = () => {
      wide = root.clientWidth > root.clientHeight * 1.1;
      show();
    };
    show();
    return { resize: layout, show: layout };
  },
};

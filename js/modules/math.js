// Math: procedurally generated questions per topic & level, with worked explanations.
import { app, esc, rnd, nz, pick, shuffle, topBar, parseNum } from '../ui.js';
import { active, topicProgress } from '../store.js';
import { runQuiz, levelPicker, mistakesOf, reviewMistakes } from '../quiz.js';
import { GRAPHS, PIZZA, graphLab, examMode, riddle, riddleState } from './mathx.js';

const M = s => `<span class="math">${s}</span>`;
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const frac = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); n /= g; d /= g; return d === 1 ? `${n}` : `${n}/${d}`; };
const sgn = n => n < 0 ? `(${n})` : `${n}`;
const term = (c, v = 'x', first = false) => { // pretty "+ 3x", "- x"
  if (c === 0) return '';
  const a = Math.abs(c), s = c < 0 ? (first ? '-' : ' - ') : (first ? '' : ' + ');
  return s + (v ? (a === 1 ? '' : a) + v : a);
};
const expr = (...pairs) => { let out = '', first = true; for (const [c, v] of pairs) { if (!c) continue; out += term(c, v, first); first = false; } return out || '0'; };
const num = (answer, html, explain, extra = {}) => ({ type: 'input', answer, html, explain, ...extra });
const choice = (answer, wrongs, html, explain, extra = {}) => {
  const set = [...new Set([String(answer), ...wrongs.map(String)])].slice(0, 4);
  return { type: 'choice', answer: String(answer), choices: shuffle(set), html, explain, choiceCls: 'math', ansCls: 'math', ...extra };
};
const Q = (s, sub = '') => `<div class="big math">${s}</div>${sub ? `<div class="sub">${sub}</div>` : ''}`;
const fracCheck = ans => v => Math.abs(parseNum(v) - ans) < 1e-6;

export const TOPICS = [
  { key: 'arith', name: 'לוח הכפל וחשבון', em: '✖️', levels: ['חיבור עד 100', 'חיסור עד 100', 'לוח הכפל עד 5', 'לוח הכפל עד 10', 'חילוק', 'כפל דו-ספרתי'],
    gen(l) {
      if (l === 1) { const a = rnd(5, 60), b = rnd(5, 40); return num(a + b, Q(`${a} + ${b} = ?`), `${a} + ${b} = ${a + b}`); }
      if (l === 2) { const a = rnd(20, 100), b = rnd(3, a); return num(a - b, Q(`${a} − ${b} = ?`), `${a} − ${b} = ${a - b}`); }
      if (l <= 4) { const a = rnd(2, l === 3 ? 5 : 10), b = rnd(2, 10); return num(a * b, Q(`${a} × ${b} = ?`), `${a} × ${b} = ${a * b}\nטיפ: ${a} פעמים ${b} זה כמו לחבר ${b} ${a} פעמים`); }
      if (l === 5) { const a = rnd(2, 10), b = rnd(2, 10); return num(b, Q(`${a * b} ÷ ${a} = ?`), `${a} × ${b} = ${a * b} ולכן ${a * b} ÷ ${a} = ${b}`); }
      const a = rnd(11, 30), b = rnd(3, 9); return num(a * b, Q(`${a} × ${b} = ?`), `${a} × ${b} = ${Math.floor(a / 10) * 10}×${b} + ${a % 10}×${b} = ${Math.floor(a / 10) * 10 * b} + ${(a % 10) * b} = ${a * b}`);
    } },

  { key: 'fractions', name: 'שברים', em: '🍕', levels: ['חיבור מכנה שווה', 'חיבור וחיסור מכנה שונה', 'כפל שברים', 'חילוק שברים', 'מספרים מעורבים', 'צמצום והשוואה'],
    gen(l) {
      const H = 'אפשר לענות כשבר (3/4), מספר מעורב (1 1/2) או עשרוני';
      if (l === 1) { const d = rnd(3, 12), a = rnd(1, d - 1), b = rnd(1, d - 1); return num((a + b) / d, Q(`${a}/${d} + ${b}/${d} = ?`), `מכנה שווה ← מחברים מונים: ${a}+${b}=${a + b}\nהתשובה: ${a + b}/${d} = ${frac(a + b, d)}`, { hint: H, check: fracCheck((a + b) / d), answerText: frac(a + b, d) }); }
      if (l === 2) {
        const d1 = rnd(2, 8), d2 = rnd(2, 8), a = rnd(1, d1 - 1 || 1), b = rnd(1, d2 - 1 || 1), op = pick([1, -1]);
        const L = d1 * d2 / gcd(d1, d2), n = a * L / d1 + op * b * L / d2;
        return num(n / L, Q(`${a}/${d1} ${op > 0 ? '+' : '−'} ${b}/${d2} = ?`), `מכנה משותף: ${L}\n${a}/${d1} = ${a * L / d1}/${L} ,  ${b}/${d2} = ${b * L / d2}/${L}\n${a * L / d1} ${op > 0 ? '+' : '−'} ${b * L / d2} = ${n} ← ${frac(n, L)}`, { hint: H, check: fracCheck(n / L), answerText: frac(n, L) });
      }
      if (l === 3) { const a = rnd(1, 7), b = rnd(2, 9), c = rnd(1, 7), d = rnd(2, 9); return num(a * c / (b * d), Q(`${a}/${b} × ${c}/${d} = ?`), `כופלים מונה במונה ומכנה במכנה:\n(${a}×${c})/(${b}×${d}) = ${a * c}/${b * d} = ${frac(a * c, b * d)}`, { hint: H, check: fracCheck(a * c / (b * d)), answerText: frac(a * c, b * d) }); }
      if (l === 4) { const a = rnd(1, 7), b = rnd(2, 9), c = rnd(1, 7), d = rnd(2, 9); return num(a * d / (b * c), Q(`${a}/${b} ÷ ${c}/${d} = ?`), `חילוק = כפל בהופכי:\n${a}/${b} × ${d}/${c} = ${a * d}/${b * c} = ${frac(a * d, b * c)}`, { hint: H, check: fracCheck(a * d / (b * c)), answerText: frac(a * d, b * c) }); }
      if (l === 5) {
        const w1 = rnd(1, 4), w2 = rnd(1, 3), d = pick([2, 3, 4, 5, 6, 8]), a = rnd(1, d - 1), b = rnd(1, d - 1);
        const n = (w1 * d + a) + (w2 * d + b);
        return num(n / d, Q(`${w1} ${a}/${d} + ${w2} ${b}/${d} = ?`), `שלמים: ${w1}+${w2}=${w1 + w2}, שברים: ${a}/${d}+${b}/${d}=${a + b}/${d}\nסה"כ ${n}/${d} = ${Math.floor(n / d)}${n % d ? ' ' + frac(n % d, d) : ''}`, { hint: H, check: fracCheck(n / d), answerText: `${Math.floor(n / d)}${n % d ? ' ' + frac(n % d, d) : ''}` });
      }
      const g = rnd(2, 6), a = rnd(1, 5), b = rnd(a + 1, 9);
      if (Math.random() < .5) return choice(frac(a, b), [frac(a + 1, b), frac(a, b + 1), `${a * g}/${b}`], Q(`צמצמו: ${a * g}/${b * g}`), `מחלקים מונה ומכנה ב-${g * gcd(a, b)}`);
      const c = rnd(1, 5), d = rnd(c + 1, 9), x = a / b, y = c / d;
      const ans = x > y ? '>' : x < y ? '<' : '=';
      return choice(ans, ['>', '<', '='], Q(`${a}/${b} ? ${c}/${d}`, 'מה הסימן המתאים?'), `${a}/${b} ≈ ${x.toFixed(3)} ,  ${c}/${d} ≈ ${y.toFixed(3)}\nאו: כפל בהצלבה ${a}×${d}=${a * d} מול ${c}×${b}=${c * b}`);
    } },

  { key: 'decimals', name: 'שברים עשרוניים', em: '🔢', levels: ['חיבור וחיסור', 'כפל ב-10/100/1000', 'כפל עשרוניים', 'חילוק', 'המרה משבר לעשרוני'],
    gen(l) {
      const d = (x, k = 1) => +x.toFixed(k);
      if (l === 1) { const a = d(rnd(10, 999) / 10), b = d(rnd(10, 500) / 100, 2), op = pick([1, -1]); const r = d(a + op * b, 2); return num(r, Q(`${a} ${op > 0 ? '+' : '−'} ${b} = ?`), `מיישרים את הנקודה העשרונית:\n${a.toFixed(2)} ${op > 0 ? '+' : '−'} ${b.toFixed(2)} = ${r}`); }
      if (l === 2) { const a = d(rnd(1, 9999) / 100, 2), k = pick([10, 100, 1000]), div = Math.random() < .4; const r = div ? +(a / k).toFixed(6) : d(a * k, 3); return num(r, Q(`${a} ${div ? '÷' : '×'} ${k} = ?`), `${div ? 'חילוק' : 'כפל'} ב-${k} מזיז את הנקודה ${String(k).length - 1} מקומות ${div ? 'שמאלה' : 'ימינה'}`); }
      if (l === 3) { const a = d(rnd(2, 99) / 10), b = d(rnd(2, 9) / 10 * (Math.random() < .5 ? 10 : 1)); const r = d(a * b, 3); return num(r, Q(`${a} × ${b} = ?`), `כופלים בלי נקודה ואז סופרים ספרות אחרי הנקודה בשני המספרים.\n${a} × ${b} = ${r}`); }
      if (l === 4) { const b = pick([0.2, 0.5, 0.4, 0.25, 2, 4, 5]), r = d(rnd(2, 40) / (b < 1 ? 1 : 10), 2); const a = d(r * b, 3); return num(r, Q(`${a} ÷ ${b} = ?`), `${a} ÷ ${b} = ${r}\nבדיקה: ${r} × ${b} = ${a}`); }
      const [n, dd] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 8], [3, 8], [7, 10], [3, 20], [9, 25], [1, 20]]);
      return num(n / dd, Q(`${n}/${dd} = ?`, 'כתבו כשבר עשרוני'), `מרחיבים למכנה 10/100/1000: ${n}/${dd} = ${n / dd}`);
    } },

  { key: 'percent', name: 'אחוזים', em: '💯', levels: ['50%, 25%, 10%', 'אחוז ממספר', 'כמה אחוזים?', 'הנחה והתייקרות', 'מציאת המחיר המקורי'],
    gen(l) {
      if (l === 1) { const p = pick([50, 25, 10, 20, 75]), n = rnd(2, 40) * 20; return num(n * p / 100, Q(`${p}% מ-${n} = ?`), `${p}% = ${frac(p, 100)}\n${n} × ${frac(p, 100)} = ${n * p / 100}`); }
      if (l === 2) { const p = pick([5, 15, 30, 40, 60, 12, 35, 80]), n = rnd(1, 30) * 20; return num(n * p / 100, Q(`${p}% מ-${n} = ?`), `1% מ-${n} = ${n / 100}\n${p}% = ${p} × ${n / 100} = ${n * p / 100}`); }
      if (l === 3) { const n = pick([20, 40, 50, 80, 200, 250, 400]), p = pick([10, 20, 25, 30, 40, 60, 75]); const part = n * p / 100; return num(p, Q(`${part} מתוך ${n} = ?%`), `${part} ÷ ${n} = ${part / n}\n× 100 = ${p}%`); }
      if (l === 4) {
        const price = rnd(4, 40) * 10, p = pick([10, 20, 25, 30, 50]), up = Math.random() < .4;
        const r = price * (up ? 1 + p / 100 : 1 - p / 100);
        return num(+r.toFixed(2), Q(`מחיר ${price} ₪ ${up ? 'התייקר' : 'הוזל'} ב-${p}%`, 'מה המחיר החדש?'), `${p}% מ-${price} = ${price * p / 100}\n${price} ${up ? '+' : '−'} ${price * p / 100} = ${r}\nאו: ${price} × ${up ? 1 + p / 100 : 1 - p / 100} = ${r}`);
      }
      const orig = rnd(4, 40) * 10, p = pick([10, 20, 25, 50]), now = orig * (1 - p / 100);
      return num(orig, Q(`אחרי הנחה של ${p}% המחיר ${now} ₪`, 'מה היה המחיר המקורי?'), `${now} הם ${100 - p}% מהמחיר\nמחיר = ${now} ÷ ${(100 - p) / 100} = ${orig}`);
    } },

  { key: 'negatives', name: 'מספרים מכוונים', em: '➖', levels: ['חיבור וחיסור', 'כפל וחילוק', 'תרגילים משולבים'],
    gen(l) {
      if (l === 1) { const a = nz(-20, 20), b = nz(-20, 20), op = pick(['+', '−']); const r = op === '+' ? a + b : a - b; return num(r, Q(`${a} ${op} ${sgn(b)} = ?`), op === '−' ? `חיסור = חיבור הנגדי: ${a} + ${sgn(-b)} = ${r}` : `${a} + ${sgn(b)} = ${r}`); }
      if (l === 2) { const a = nz(-12, 12), b = nz(-12, 12), dv = Math.random() < .4; if (dv) return num(a, Q(`${a * b} ÷ ${sgn(b)} = ?`), `סימנים: ${a * b < 0 ? 'מינוס' : 'פלוס'} ÷ ${b < 0 ? 'מינוס' : 'פלוס'} = ${a < 0 ? 'מינוס' : 'פלוס'}\n${a * b} ÷ ${sgn(b)} = ${a}`); return num(a * b, Q(`${sgn(a)} × ${sgn(b)} = ?`), `סימנים זהים ← פלוס, שונים ← מינוס\n${sgn(a)} × ${sgn(b)} = ${a * b}`); }
      const a = nz(-9, 9), b = nz(-9, 9), c = nz(-9, 9); const r = a * b - c; return num(r, Q(`${sgn(a)} × ${sgn(b)} − ${sgn(c)} = ?`), `קודם כפל: ${sgn(a)}×${sgn(b)} = ${a * b}\n${a * b} − ${sgn(c)} = ${r}`);
    } },

  { key: 'order', name: 'סדר פעולות', em: '🧮', levels: ['כפל לפני חיבור', 'סוגריים', 'חזקות וסוגריים'],
    gen(l) {
      if (l === 1) { const a = rnd(2, 20), b = rnd(2, 9), c = rnd(2, 9); return num(a + b * c, Q(`${a} + ${b} × ${c} = ?`), `קודם כפל: ${b}×${c} = ${b * c}\nואז: ${a} + ${b * c} = ${a + b * c}`); }
      if (l === 2) { const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 6), d = rnd(1, 20); return num((a + b) * c - d, Q(`(${a} + ${b}) × ${c} − ${d} = ?`), `סוגריים: ${a}+${b} = ${a + b}\nכפל: ${a + b}×${c} = ${(a + b) * c}\nחיסור: ${(a + b) * c} − ${d} = ${(a + b) * c - d}`); }
      const a = rnd(2, 5), b = rnd(2, 6), c = rnd(1, 5), d = nz(-6, 6); const r = a ** 2 - b * (c - d);
      return num(r, Q(`${a}² − ${b}(${c} − ${sgn(d)}) = ?`), `חזקה: ${a}² = ${a * a}\nסוגריים: ${c} − ${sgn(d)} = ${c - d}\nכפל: ${b}×${c - d} = ${b * (c - d)}\n${a * a} − ${b * (c - d)} = ${r}`);
    } },

  { key: 'equations', name: 'משוואות', em: '⚖️', levels: ['x + a = b', 'ax = b', 'ax + b = c', 'נעלם בשני האגפים', 'עם סוגריים', 'עם שברים', 'בעיות מילוליות'],
    gen(l) {
      const x = nz(-10, 10), H = 'x = ?';
      if (l === 1) { const a = nz(-15, 15); return num(x, Q(`x ${a < 0 ? '−' : '+'} ${Math.abs(a)} = ${x + a}`, H), `מעבירים ${a} לצד השני (משנים סימן):\nx = ${x + a} ${a < 0 ? '+' : '−'} ${Math.abs(a)} = ${x}`); }
      if (l === 2) { const a = nz(-9, 9); return num(x, Q(`${expr([a, 'x'])} = ${a * x}`, H), `מחלקים ב-${a}:\nx = ${a * x} ÷ ${sgn(a)} = ${x}`); }
      if (l === 3) { const a = nz(-9, 9), b = nz(-20, 20); return num(x, Q(`${expr([a, 'x'], [b, ''])} = ${a * x + b}`, H), `${expr([a, 'x'])} = ${a * x + b} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${a * x}\nx = ${a * x} ÷ ${sgn(a)} = ${x}`); }
      if (l === 4) { let a = nz(-9, 9), c = nz(-9, 9); if (a === c) c = a + 1 || 2; const b = nz(-15, 15), d = (a - c) * x + b; return num(x, Q(`${expr([a, 'x'], [b, ''])} = ${expr([c, 'x'], [d, ''])}`, H), `x-ים לשמאל, מספרים לימין:\n${expr([a - c, 'x'])} = ${d - b}\nx = ${d - b} ÷ ${sgn(a - c)} = ${x}`); }
      if (l === 5) { const a = nz(-6, 6), b = nz(-8, 8), c = nz(-10, 10); return num(x, Q(`${a === 1 ? '' : a === -1 ? '-' : a}(x ${b < 0 ? '−' : '+'} ${Math.abs(b)}) ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${a * (x + b) + c}`, H), `פותחים סוגריים: ${expr([a, 'x'], [a * b, ''], [c, ''])} = ${a * (x + b) + c}\n${expr([a, 'x'])} = ${a * x}\nx = ${x}`); }
      if (l === 6) { const a = pick([2, 3, 4, 5]), xx = a * nz(-6, 6), b = nz(-9, 9); return num(xx, Q(`x/${a} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${xx / a + b}`, H), `x/${a} = ${xx / a + b} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${xx / a}\nכופלים ב-${a}: x = ${xx}`); }
      const k = rnd(1, 3);
      if (k === 1) { const n = rnd(5, 30); return num(n, Q(`חשבתי על מספר, כפלתי אותו ב-3 והוספתי 7. קיבלתי ${3 * n + 7}.`, 'מה המספר?'), `3x + 7 = ${3 * n + 7}\n3x = ${3 * n}\nx = ${n}`, { html: `<div class="big" style="font-size:22px">חשבתי על מספר, כפלתי אותו ב-3 והוספתי 7. קיבלתי ${3 * n + 7}.</div><div class="sub">מה המספר?</div>` }); }
      if (k === 2) { const y = rnd(5, 15), d = rnd(2, 8); return num(y, '', `גיל דני = x, גיל אחותו = x + ${d}\nx + x + ${d} = ${2 * y + d}\n2x = ${2 * y}\nx = ${y}`, { html: `<div class="big" style="font-size:22px">אחותו של דני גדולה ממנו ב-${d} שנים. סכום גילם ${2 * y + d}.</div><div class="sub">בן כמה דני?</div>` }); }
      const pr = rnd(3, 12), n = rnd(2, 6), tot = pr * n + 10; return num(pr, '', `${n}x + 10 = ${tot}\n${n}x = ${pr * n}\nx = ${pr}`, { html: `<div class="big" style="font-size:22px">קניתי ${n} מחברות במחיר זהה ועוד עט ב-10 ₪. שילמתי ${tot} ₪.</div><div class="sub">כמה עולה מחברת?</div>` });
    } },

  { key: 'powers', name: 'חזקות ושורשים', em: '⚡', levels: ['ריבועים', 'שורשים', 'חוקי חזקות', 'חזקה 0 ושלילית', 'כתיב מדעי'],
    gen(l) {
      if (l === 1) { const a = rnd(2, 15), e = a <= 5 && Math.random() < .4 ? 3 : 2; return num(a ** e, Q(`${a}${e === 2 ? '²' : '³'} = ?`), `${Array(e).fill(a).join(' × ')} = ${a ** e}`); }
      if (l === 2) { const a = rnd(2, 15); return num(a, Q(`√${a * a} = ?`), `${a} × ${a} = ${a * a} ולכן √${a * a} = ${a}`); }
      if (l === 3) {
        const b = pick(['a', 'x', '2', '5']), m = rnd(2, 9), n = rnd(2, 9), k = rnd(1, 3);
        if (k === 1) return num(m + n, Q(`${b}<sup>${m}</sup> · ${b}<sup>${n}</sup> = ${b}<sup>?</sup>`), `בכפל בסיסים שווים מחברים מעריכים: ${m}+${n} = ${m + n}`);
        if (k === 2) { const mm = m + n; return num(mm - n, Q(`${b}<sup>${mm}</sup> ÷ ${b}<sup>${n}</sup> = ${b}<sup>?</sup>`), `בחילוק מחסרים מעריכים: ${mm}−${n} = ${mm - n}`); }
        return num(m * n, Q(`(${b}<sup>${m}</sup>)<sup>${n}</sup> = ${b}<sup>?</sup>`), `חזקה של חזקה – כופלים: ${m}×${n} = ${m * n}`);
      }
      if (l === 4) { const b = rnd(2, 5), e = rnd(-3, 0); const v = b ** e; return num(v, Q(`${b}<sup>${e}</sup> = ?`), e === 0 ? `כל מספר (חוץ מ-0) בחזקת 0 שווה 1` : `${b}<sup>${e}</sup> = 1/${b}<sup>${-e}</sup> = 1/${b ** -e}`, { check: fracCheck(v), answerText: e === 0 ? '1' : `1/${b ** -e}`, hint: 'אפשר לענות כשבר, למשל 1/8' }); }
      const m = rnd(11, 99) / 10, e = rnd(2, 6), val = Math.round(m * 10 ** e);
      return num(e, Q(`${val.toLocaleString('en')} = ${m} × 10<sup>?</sup>`), `מזיזים את הנקודה ${e} מקומות`);
    } },

  { key: 'algebra', name: 'ביטויים אלגבריים', em: '🔤', levels: ['הצבה', 'כינוס איברים', 'פתיחת סוגריים', 'כפל מקוצר', 'פירוק לגורמים'],
    gen(l) {
      if (l === 1) { const a = nz(-5, 5), b = nz(-9, 9), x = nz(-5, 5), sq = Math.random() < .5; const v = sq ? x * x + a * x + b : a * x + b; return num(v, Q(`${sq ? expr([1, 'x²'], [a, 'x'], [b, '']) : expr([a, 'x'], [b, ''])}`, `מה ערך הביטוי כאשר x = ${x}?`), `מציבים ${sgn(x)}:\n${sq ? `${sgn(x)}² + ${a}·${sgn(x)} + ${b} = ${x * x} + ${a * x} + ${b}` : `${a}·${sgn(x)} + ${b} = ${a * x} + ${b}`} = ${v}`); }
      if (l === 2) { const a = nz(-7, 7), b = nz(-7, 7), c = nz(-9, 9), d = nz(-9, 9); const ans = expr([a + b, 'x'], [c + d, '']); return choice(ans, [expr([a + b, 'x'], [c - d, '']), expr([a - b, 'x'], [c + d, '']), expr([a + b + c + d, 'x'])], Q(`${expr([a, 'x'], [c, ''], [b, 'x'], [d, ''])}`, 'כנסו איברים דומים'), `x-ים: ${a}+${sgn(b)} = ${a + b}\nמספרים: ${c}+${sgn(d)} = ${c + d}`); }
      if (l === 3) { const k = nz(-6, 6), a = nz(-5, 5), b = nz(-9, 9); const ans = expr([k * a, 'x'], [k * b, '']); return choice(ans, [expr([k * a, 'x'], [b, '']), expr([k + a, 'x'], [k * b, '']), expr([k * a, 'x'], [-k * b, ''])], Q(`${k === 1 ? '' : k === -1 ? '-' : k}(${expr([a, 'x'], [b, ''])})`, 'פתחו סוגריים'), `מכפילים כל איבר ב-${sgn(k)}:\n${sgn(k)}·${a}x = ${k * a}x ,  ${sgn(k)}·${sgn(b)} = ${k * b}`); }
      if (l === 4) {
        const a = rnd(1, 9), t = rnd(1, 3);
        if (t === 1) return choice(`x² + ${2 * a}x + ${a * a}`, [`x² + ${a * a}`, `x² + ${a}x + ${a * a}`, `x² + ${2 * a}x + ${2 * a}`], Q(`(x + ${a})²`), `(a+b)² = a² + 2ab + b²\nx² + 2·${a}·x + ${a}² = x² + ${2 * a}x + ${a * a}`);
        if (t === 2) return choice(`x² − ${2 * a}x + ${a * a}`, [`x² − ${a * a}`, `x² + ${2 * a}x − ${a * a}`, `x² − ${a}x + ${a * a}`], Q(`(x − ${a})²`), `(a−b)² = a² − 2ab + b²\nx² − ${2 * a}x + ${a * a}`);
        return choice(`x² − ${a * a}`, [`x² + ${a * a}`, `x² − ${2 * a}x − ${a * a}`, `x² − ${a}`], Q(`(x + ${a})(x − ${a})`), `(a+b)(a−b) = a² − b²\nx² − ${a * a}`);
      }
      const p = nz(-7, 7); let q = nz(-7, 7); if (q === -p) q = p + 1 || 1; const s = p + q, m = p * q;
      const f = (u, v) => `(x ${u < 0 ? '−' : '+'} ${Math.abs(u)})(x ${v < 0 ? '−' : '+'} ${Math.abs(v)})`;
      return choice(f(p, q), [f(-p, -q), f(p, -q), f(-p, q)], Q(expr([1, 'x²'], [s, 'x'], [m, ''])), `מחפשים שני מספרים שמכפלתם ${m} וסכומם ${s}: ${p} ו-${q}`);
    } },

  { key: 'systems', name: 'מערכת משוואות', em: '🔗', levels: ['חיבור משוואות', 'הצבה', 'מקדמים כלליים'],
    gen(l) {
      const x = nz(-6, 6), y = nz(-6, 6);
      let a = 1, b = 1, c = 1, d = -1;
      if (l === 2) { do { c = nz(-4, 4); d = nz(-4, 4); } while (c === -d); }
      if (l === 3) { do { a = nz(-4, 4); b = nz(-4, 4); c = nz(-4, 4); d = nz(-4, 4); } while (a * d === b * c); }
      const e1 = l === 2 ? `y = ${expr([1, 'x'], [y - x, ''])}` : `${expr([a, 'x'], [b, 'y'])} = ${a * x + b * y}`;
      const e2 = `${expr([c, 'x'], [d, 'y'])} = ${c * x + d * y}`;
      const ans = `(${x}, ${y})`;
      return choice(ans, [`(${y}, ${x})`, `(${-x}, ${y})`, `(${x}, ${-y})`, `(${x + 1}, ${y - 1})`], `<div class="big math" style="font-size:28px">${e1}<br>${e2}</div><div class="sub">מצאו (x, y)</div>`,
        l === 1 ? `מחברים את המשוואות: 2x = ${2 * x} ← x = ${x}\nמציבים: y = ${y}` : l === 2 ? `מציבים את y מהמשוואה הראשונה בשנייה ופותרים: x = ${x}, ואז y = ${y}` : `מבטלים נעלם ע"י כפל והפרש משוואות. בדיקה: ${a}·${sgn(x)} + ${b}·${sgn(y)} = ${a * x + b * y} ✓`);
    } },

  { key: 'quadratic', name: 'משוואה ריבועית', em: '📈', levels: ['x² = k', 'פירוק לגורמים', 'נוסחת השורשים'],
    gen(l) {
      if (l === 1) { const r = rnd(1, 12); return choice(`x = ±${r}`, [`x = ${r}`, `x = ±${r * 2}`, `x = ${r * r}`], Q(`x² = ${r * r}`), `x = ±√${r * r} = ±${r}\nשני פתרונות כי גם (${-r})² = ${r * r}`); }
      const p = nz(-8, 8), q = nz(-8, 8), A = l === 3 ? pick([1, 2, 3]) : 1;
      const s = -(p + q) * A, m = p * q * A;
      const roots = [...new Set([p, q])].sort((u, v) => u - v);
      const fmt = rs => rs.length === 1 ? `x = ${rs[0]}` : `x = ${rs[0]}, ${rs[1]}`;
      return choice(fmt(roots), [fmt([-roots[0], -(roots[1] ?? roots[0])].sort((u, v) => u - v)), fmt([roots[0], roots[0] + 1]), fmt([roots[0] * 2, roots.at(-1)])],
        Q(`${expr([A, 'x²'], [s, 'x'], [m, ''])} = 0`),
        l === 2 ? `מפרקים: (x ${-p < 0 ? '−' : '+'} ${Math.abs(p)})(x ${-q < 0 ? '−' : '+'} ${Math.abs(q)}) = 0\nx = ${p} או x = ${q}` : `Δ = b² − 4ac = ${s * s - 4 * A * m}\nx = (−b ± √Δ) / 2a ← x = ${p}, ${q}`);
    } },

  { key: 'geometry', name: 'גיאומטריה', em: '📐', levels: ['שטח והיקף מלבן', 'שטח משולש', 'זוויות במשולש', 'מעגל (π≈3.14)', 'פיתגורס'],
    gen(l) {
      if (l === 1) { const a = rnd(2, 20), b = rnd(2, 20), per = Math.random() < .5; return num(per ? 2 * (a + b) : a * b, `<div class="huge">▭</div><div class="big" style="font-size:26px">מלבן ${a} על ${b}</div><div class="sub">מה ${per ? 'ההיקף' : 'השטח'}?</div>`, per ? `היקף = 2 × (${a} + ${b}) = ${2 * (a + b)}` : `שטח = ${a} × ${b} = ${a * b}`); }
      if (l === 2) { const a = rnd(2, 20) * 2, h = rnd(2, 15); return num(a * h / 2, `<div class="huge">◺</div><div class="big" style="font-size:26px">בסיס ${a}, גובה ${h}</div><div class="sub">מה שטח המשולש?</div>`, `שטח = (בסיס × גובה) ÷ 2 = (${a}×${h})÷2 = ${a * h / 2}`); }
      if (l === 3) { const a = rnd(20, 100), b = rnd(20, 160 - a); return num(180 - a - b, `<div class="huge">🔺</div><div class="big" style="font-size:26px">זוויות: ${a}°, ${b}°</div><div class="sub">מה הזווית השלישית?</div>`, `סכום זוויות במשולש = 180°\n180 − ${a} − ${b} = ${180 - a - b}°`); }
      if (l === 4) { const r = rnd(1, 10), ar = Math.random() < .5; const v = +(ar ? 3.14 * r * r : 2 * 3.14 * r).toFixed(2); return num(v, `<div class="huge">⭕</div><div class="big" style="font-size:26px">רדיוס ${r}</div><div class="sub">מה ${ar ? 'שטח' : 'היקף'} המעגל? (π≈3.14)</div>`, ar ? `שטח = πr² = 3.14 × ${r * r} = ${v}` : `היקף = 2πr = 2 × 3.14 × ${r} = ${v}`, { check: s => Math.abs(parseNum(s) - v) < 0.06, tol: 0.06 }); }
      const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25]]); const hyp = Math.random() < .6;
      return num(hyp ? c : b, `<div class="huge">📐</div><div class="big" style="font-size:24px">משולש ישר זווית: ${hyp ? `ניצבים ${a}, ${b}` : `ניצב ${a}, יתר ${c}`}</div><div class="sub">מה ${hyp ? 'היתר' : 'הניצב השני'}?</div>`, hyp ? `a² + b² = c²\n${a * a} + ${b * b} = ${c * c} ← c = ${c}` : `${c * c} − ${a * a} = ${b * b} ← ${b}`);
    } },
];

TOPICS.push(GRAPHS, PIZZA);

function topicsFor(p) { return p.mathTopics?.length ? TOPICS.filter(t => p.mathTopics.includes(t.key)) : TOPICS; }

export function mathHome() {
  const p = active();
  const list = topicsFor(p);
  const rs = riddleState(p);
  app().innerHTML = `${topBar('🧮 מתמטיקה')}
    <div class="row" style="margin-bottom:14px;gap:10px">
      <a class="btn ${rs.solved ? 'sec' : 'gold'} grow" href="#/math/riddle">🧩 חידת היום ${rs.solved ? '✅' : '(+50)'}</a>
      <a class="btn grow" href="#/math/exam">📝 מבחן</a></div>
    ${list.some(t => t.key === 'graphs') ? '<a class="btn sec block" href="#/math/lab" style="margin-bottom:14px">🧪 מעבדת גרפים – הזיזו את הפרבולה</a>' : ''}
    <div class="grid">${list.map(t => { const tp = topicProgress(p, 'm_' + t.key); return `<a class="tile" href="#/math/${t.key}">
      <span class="badge">שלב ${tp.maxLevel}/${t.levels.length}</span><span class="em">${t.em}</span>${t.name}
      <div class="bar" style="width:80%"><i style="width:${(tp.maxLevel - 1) / Math.max(1, t.levels.length - 1) * 100}%"></i></div></a>`; }).join('')}</div>
    <a class="btn gold block" href="#/math/mix" style="margin-top:6px">⚡ אתגר 60 שניות – ערבוב</a>
    <a class="btn block" href="#/math/boss" style="margin-top:12px;background:#2d3436">👾 קרב בוס – ערבוב</a>
    ${mistakesOf(p, 'math').length ? `<a class="btn bad block" href="#/math/review" style="margin-top:12px">📕 מחברת טעויות (${mistakesOf(p, 'math').length})</a>` : ''}`;
}

export function mathTopic(key) {
  if (key === 'mix') return speedMix();
  if (key === 'lab') return graphLab('#/math');
  if (key === 'riddle') return riddle('#/math');
  if (key === 'exam') return examMode(topicsFor(active()), '#/math');
  if (key === 'review') return mistakesOf(active(), 'math').length ? reviewMistakes('math', '📕 מחברת טעויות', '#/math') : mathHome();
  if (key === 'boss') return runQuiz({ title: '👾 קרב בוס', key: 'm_boss', boss: true, back: '#/math', mistakes: 'math',
    gen: () => { const p = active(), t = pick(topicsFor(p)); return t.gen(rnd(1, topicProgress(p, 'm_' + t.key).maxLevel)); } });
  const t = TOPICS.find(t => t.key === key); if (!t) return mathHome();
  const k = 'm_' + key, back = '#/math';
  levelPicker(`${t.em} ${t.name}`, back, k, t.levels.length, t.levels, lvl => {
    runQuiz({ title: `${t.name} · שלב ${lvl}`, key: k, levelCount: t.levels.length, back: '#/math/' + key, mistakes: 'math', gen: () => t.gen(lvl) });
  }, `<button class="btn gold block" id="speed" style="margin-top:10px">⚡ אתגר 60 שניות</button>
     <button class="btn block" id="boss" style="margin-top:10px;background:#2d3436">👾 קרב בוס</button>`);
  document.getElementById('boss').onclick = () => {
    const lvl = topicProgress(active(), k).level;
    runQuiz({ title: `👾 ${t.name}`, key: k + '_boss', boss: true, bossLevel: lvl, back: '#/math/' + key, mistakes: 'math', gen: () => t.gen(lvl) });
  };
  document.getElementById('speed').onclick = () => {
    const lvl = topicProgress(active(), k).level;
    runQuiz({ title: `⚡ ${t.name}`, key: k + '_speed', timed: 60, hashPrefix: '#/math', back: '#/math/' + key, gen: () => t.gen(lvl) });
  };
}

function speedMix() {
  const p = active(), list = topicsFor(p);
  runQuiz({ title: '⚡ ערבוב', key: 'm_mix_speed', timed: 60, hashPrefix: '#/math', back: '#/math',
    gen: () => { const t = pick(list); return t.gen(rnd(1, topicProgress(p, 'm_' + t.key).maxLevel)); } });
}

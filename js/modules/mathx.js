// Extra math: graph topic + graph lab, pizza fractions, exam mode, daily riddle.
import { app, esc, rnd, nz, pick, shuffle, topBar, sfx, confetti, toast, parseNum } from '../ui.js';
import { active, save, topicProgress, today } from '../store.js';
import { runQuiz } from '../quiz.js';

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const frac = (n, d) => { const g = gcd(n, d); return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`; };
const lin = (m, b) => `y = ${m === 0 ? '' : m === 1 ? 'x' : m === -1 ? '-x' : m + 'x'}${b === 0 ? (m === 0 ? '0' : '') : (m === 0 ? b : b > 0 ? ' + ' + b : ' − ' + -b)}`;
const par = (a, h, k) => `y = ${a === -1 ? '-' : a === 1 ? '' : a}${h === 0 ? 'x²' : `(x ${h > 0 ? '−' : '+'} ${Math.abs(h)})²`}${k === 0 ? '' : k > 0 ? ' + ' + k : ' − ' + -k}`;

// ---------- SVG graph ----------
const S = 260, U = 20, C = S / 2;
export function graphSVG(fns, { dashed = [] } = {}) {
  const X = x => C + x * U, Y = y => C - y * U;
  let g = '';
  for (let i = -6; i <= 6; i++) g += `<line x1="${X(i)}" y1="0" x2="${X(i)}" y2="${S}" stroke="#e8e5fb"/><line x1="0" y1="${Y(i)}" x2="${S}" y2="${Y(i)}" stroke="#e8e5fb"/>`;
  g += `<line x1="0" y1="${C}" x2="${S}" y2="${C}" stroke="#7a7699" stroke-width="2"/><line x1="${C}" y1="0" x2="${C}" y2="${S}" stroke="#7a7699" stroke-width="2"/>`;
  for (let i = -6; i <= 6; i += 2) if (i) g += `<text x="${X(i)}" y="${C + 14}" font-size="10" text-anchor="middle" fill="#7a7699">${i}</text><text x="${C - 10}" y="${Y(i) + 4}" font-size="10" text-anchor="middle" fill="#7a7699">${i}</text>`;
  const colors = ['#6c5ce7', '#e17055', '#00b894'];
  fns.forEach((f, k) => {
    const pts = []; for (let x = -7; x <= 7; x += .1) { const y = f(x); if (Math.abs(y) < 20) pts.push(`${X(x).toFixed(1)},${Y(y).toFixed(1)}`); }
    g += `<polyline points="${pts.join(' ')}" fill="none" stroke="${colors[k]}" stroke-width="3.5" ${dashed.includes(k) ? 'stroke-dasharray="8 6"' : ''} stroke-linecap="round"/>`;
  });
  return `<svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:300px;background:#fff;border-radius:16px;direction:ltr">${g}</svg>`;
}

export const GRAPHS = { key: 'graphs', name: 'גרפים ופונקציות', em: '📈', levels: ['איזו משוואה מתאימה לישר?', 'מה השיפוע?', 'נקודת חיתוך עם ציר y', 'פרבולות y = ±x² + k', 'צורת קודקוד'],
  gen(l) {
    const m = nz(-3, 3), b = rnd(-4, 4);
    const pic = (f, sub) => `${graphSVG([f])}<div class="sub">${sub}</div>`;
    if (l === 1) {
      const ans = lin(m, b);
      return { type: 'choice', html: pic(x => m * x + b, 'איזו משוואה מתארת את הישר?'), answer: ans, choices: shuffle([...new Set([ans, lin(-m, b), lin(m, -b || 2), lin(b || 1, m)])]), choiceCls: 'math', ansCls: 'math',
        explain: `חיתוך עם ציר y בנקודה ${b} ← b = ${b}\nכל צעד ימינה הישר ${m > 0 ? 'עולה' : 'יורד'} ב-${Math.abs(m)} ← m = ${m}` };
    }
    if (l === 2) return { type: 'input', answer: m, html: pic(x => m * x + b, 'מה השיפוע (m) של הישר?'), explain: `שיפוע = כמה עולים/יורדים בכל צעד ימינה = ${m}` };
    if (l === 3) return { type: 'input', answer: b, html: pic(x => m * x + b, 'באיזה y הישר חותך את ציר y?'), explain: `כשה-x = 0 ← y = ${b}` };
    if (l === 4) {
      const a = pick([1, -1]), k = rnd(-4, 4), ans = par(a, 0, k);
      return { type: 'choice', html: pic(x => a * x * x + k, 'איזו משוואה מתארת את הפרבולה?'), answer: ans, choices: shuffle([...new Set([ans, par(-a, 0, k), par(a, 0, -k || 3), par(a, k || 2, 0)])]), choiceCls: 'math', ansCls: 'math',
        explain: `${a > 0 ? 'פתוחה למעלה ← a חיובי' : 'פתוחה למטה ← a שלילי'}\nהקודקוד ב-(0, ${k}) ← k = ${k}` };
    }
    const h = nz(-3, 3), k = rnd(-3, 3), ans = par(1, h, k);
    return { type: 'choice', html: pic(x => (x - h) ** 2 + k, 'איזו משוואה מתאימה?'), answer: ans, choices: shuffle([...new Set([ans, par(1, -h, k), par(1, h, -k || 2), par(1, -h, -k || 1)])]), choiceCls: 'math', ansCls: 'math',
      explain: `הקודקוד ב-(${h}, ${k})\ny = (x − h)² + k ← שימו לב: הזזה ימינה = מינוס בסוגריים` };
  } };

// ---------- graph lab: change the parameters until your graph matches the target ----------
export function graphLab(back) {
  let mode = 'line', target, cur;
  const newTarget = () => { target = mode === 'line' ? { a: nz(-3, 3), b: rnd(-4, 4) } : { a: pick([1, -1]), h: rnd(-3, 3), k: rnd(-3, 3) }; cur = mode === 'line' ? { a: 1, b: 0 } : { a: 1, h: 0, k: 0 }; };
  const f = o => mode === 'line' ? x => o.a * x + o.b : x => o.a * (x - o.h) ** 2 + o.k;
  const eq = o => mode === 'line' ? lin(o.a, o.b) : par(o.a, o.h, o.k);
  const ctl = (k, name) => `<div class="row" style="justify-content:center;margin:6px 0"><button class="btn sm sec" data-k="${k}" data-d="-1">➖</button><b style="min-width:120px;text-align:center">${name} = ${cur[k]}</b><button class="btn sm sec" data-k="${k}" data-d="1">➕</button></div>`;
  const draw = () => {
    const match = Object.keys(target).every(k => target[k] === cur[k]);
    app().innerHTML = `${topBar('🧪 מעבדת גרפים', { back })}
      <div class="tabs"><button class="${mode === 'line' ? 'on' : ''}" data-m="line">📏 ישר</button><button class="${mode === 'par' ? 'on' : ''}" data-m="par">⌒ פרבולה</button></div>
      <div class="center">${graphSVG([f(target), f(cur)], { dashed: [0] })}</div>
      <p class="center muted">הזיזו את הקו הכתום עד שיעלה על הקו המקווקו</p>
      <h2 class="center math">${eq(cur)}</h2>
      ${mode === 'line' ? ctl('a', 'שיפוע m') + ctl('b', 'חיתוך b') : ctl('a', 'a (כיוון)') + ctl('h', 'h (ימינה/שמאלה)') + ctl('k', 'k (למעלה/למטה)')}
      ${match ? `<div class="feedback good center"><b>🎉 מושלם! ${eq(target)}</b><br><button class="btn ok" id="nt" style="margin-top:8px">עוד אחד ▶️</button></div>` : ''}`;
    app().querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; newTarget(); draw(); });
    app().querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      const k = b.dataset.k; sfx.click();
      cur[k] += +b.dataset.d; if (k === 'a' && mode === 'par') cur.a = cur.a > 0 ? -1 : 1;
      cur[k] = Math.max(-6, Math.min(6, cur[k]));
      if (Object.keys(target).every(x => target[x] === cur[x])) { sfx.win(); confetti(30); const p = active(); p.coins += 5; save(); }
      draw();
    });
    const nt = document.getElementById('nt'); if (nt) nt.onclick = () => { newTarget(); draw(); };
  };
  newTarget(); draw();
}

// ---------- pizza fractions: colour the slices ----------
function pie(L, sel) {
  const r = 110, c = 120;
  if (L === 1) return `<circle cx="${c}" cy="${c}" r="${r}" data-i="0" fill="${sel.has(0) ? '#fdcb6e' : '#fff3d6'}" stroke="#c0803a" stroke-width="3"/>`;
  let s = '';
  for (let i = 0; i < L; i++) {
    const a1 = (i / L) * 2 * Math.PI - Math.PI / 2, a2 = ((i + 1) / L) * 2 * Math.PI - Math.PI / 2;
    const x1 = c + r * Math.cos(a1), y1 = c + r * Math.sin(a1), x2 = c + r * Math.cos(a2), y2 = c + r * Math.sin(a2);
    s += `<path data-i="${i}" d="M${c},${c} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${L === 2 ? 0 : 0} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${sel.has(i) ? '#fdcb6e' : '#fff3d6'}" stroke="#c0803a" stroke-width="3"/>`;
    if (sel.has(i)) { const am = (a1 + a2) / 2; s += `<text x="${c + r * .62 * Math.cos(am)}" y="${c + r * .62 * Math.sin(am) + 8}" font-size="22" text-anchor="middle" pointer-events="none">🍅</text>`; }
  }
  return s;
}
export const PIZZA = { key: 'pizza', name: 'שברים עם פיצה', em: '🍕', levels: ['מכנה שווה', 'חצאים, רבעים ושמיניות', 'שלישים ושישיות', 'חיסור שברים'],
  gen(l) {
    const op = l === 4 ? -1 : 1;
    let d1, d2, a, b, L, n;
    do {   // regenerate until the answer is between 1 slice and one whole pizza
      if (l === 1) { d1 = d2 = pick([3, 4, 5, 6, 8]); }
      else if (l === 3) { [d1, d2] = pick([[3, 6], [2, 6], [2, 3], [6, 3]]); }
      else { [d1, d2] = pick([[2, 4], [4, 8], [2, 8], [4, 2], [8, 4]]); }
      a = rnd(1, d1 - 1); b = rnd(1, d2 - 1);
      L = d1 * d2 / gcd(d1, d2); n = a * L / d1 + op * b * L / d2;
    } while (n <= 0 || n > L);
    return {
      type: 'custom', answer: frac(n, L), ansCls: 'math',
      html: `<div class="big math">${a}/${d1} ${op > 0 ? '+' : '−'} ${b}/${d2} = ?</div><div class="sub">הפיצה חתוכה ל-${L} משולשים. צבעו את התשובה! 🍕</div>`,
      explain: `${a}/${d1} = ${a * L / d1}/${L}  ,  ${b}/${d2} = ${b * L / d2}/${L}\n${a * L / d1} ${op > 0 ? '+' : '−'} ${b * L / d2} = ${n} משולשים מתוך ${L} = ${frac(n, L)}`,
      render(el, done) {
        const sel = new Set();
        const draw = () => {
          el.innerHTML = `<div class="center"><svg viewBox="0 0 240 240" style="width:240px;max-width:80vw">${pie(L, sel)}</svg>
            <p style="font-size:22px;font-weight:700" class="math">${sel.size}/${L}</p><button class="btn ok" id="pz">בדיקה ✓</button></div>`;
          el.querySelectorAll('[data-i]').forEach(s => s.onclick = () => { const i = +s.dataset.i; sel.has(i) ? sel.delete(i) : sel.add(i); sfx.click(); draw(); });
          el.querySelector('#pz').onclick = () => done(sel.size === n);
        };
        draw();
      },
    };
  } };

// ---------- exam mode: 15 mixed questions, then a per-topic report ----------
export function examMode(topics, back) {
  const p = active(), plan = shuffle(Array.from({ length: 15 }, (_, i) => topics[i % topics.length]));
  const res = {}, t0 = Date.now();
  runQuiz({
    title: '📝 מבחן', key: 'm_exam', total: 15, back, mistakes: 'math',
    gen: i => { const t = plan[i]; const q = t.gen(topicProgress(p, 'm_' + t.key).maxLevel); q.topic = t.key; return q; },
    onAnswer: (q, ok) => { const r = (res[q.topic] ||= [0, 0]); r[1]++; if (ok) r[0]++; },
    onFinish: st => {
      const mins = Math.round((Date.now() - t0) / 60000), score = Math.round(st.correct / 15 * 100);
      const rows = topics.filter(t => res[t.key]).map(t => [t, ...res[t.key]]).sort((a, b) => a[1] / a[2] - b[1] / b[2]);
      const weak = rows.filter(r => r[1] / r[2] < .7);
      if (score >= 80) { sfx.win(); confetti(60); }
      app().innerHTML = `${topBar('📝 תוצאות המבחן', { back })}
        <div class="card center"><div style="font-size:64px;font-weight:900;color:${score >= 80 ? 'var(--ok)' : score >= 55 ? '#e1a100' : 'var(--bad)'}">${score}</div>
        <p>${st.correct}/15 נכונות · ${mins || '<1'} דקות</p></div>
        <div class="card list"><h3>לפי נושא</h3>${rows.map(([t, c, n]) => `<div class="item"><span>${t.em}</span><span class="grow">${t.name}</span><b style="color:${c / n >= .7 ? 'var(--ok)' : 'var(--bad)'}">${c}/${n}</b></div>`).join('')}</div>
        <div class="card"><h3>💡 המלצה</h3>${weak.length ? `כדאי לתרגל: ${weak.map(r => `<a href="#/math/${r[0].key}"><b>${r[0].name}</b></a>`).join(', ')}. הטעויות נשמרו במחברת הטעויות 📕` : 'מצוין! אפשר לעלות שלב בנושאים 🚀'}</div>
        <a class="btn block" href="${back}">סיום</a>`;
    },
  });
}

// ---------- daily riddle ----------
const RIDDLES = [
  ['לאבא של שרה יש 5 בנות: ננה, נני, נינו ונונו. מה שם הבת החמישית?', 'שרה', ['נונה', 'נינה', 'שרה', 'ננו'], 'כתוב בשאלה: "לאבא של שרה" 😉'],
  ['3 חתולים תופסים 3 עכברים ב-3 דקות. כמה חתולים יתפסו 100 עכברים ב-100 דקות?', 3, null, 'כל חתול תופס עכבר ב-3 דקות. ב-100 דקות 3 חתולים יספיקו 100 עכברים.'],
  ['מה המספר הבא? 2, 6, 12, 20, 30, ?', 42, null, 'ההפרשים: 4, 6, 8, 10, 12 ← 30 + 12 = 42'],
  ['מחבט וכדור עולים יחד 11 ₪. המחבט יקר מהכדור ב-10 ₪. כמה עולה הכדור?', 0.5, null, 'כדור = x, מחבט = x + 10 ← 2x + 10 = 11 ← x = 0.5'],
  ['מה המספר הבא? 1, 1, 2, 3, 5, 8, ?', 13, null, 'כל מספר הוא סכום שני הקודמים (סדרת פיבונאצ׳י): 5 + 8 = 13'],
  ['אני מספר דו-ספרתי. סכום הספרות שלי 9, ואם הופכים את הספרות אני גדל ב-27. מי אני?', 36, null, 'a + b = 9 ו- 9(b − a) = 27 ← b − a = 3 ← 36'],
  ['שעון מצלצל 6 פעמים ב-5 שניות. כמה שניות ייקח לו לצלצל 12 פעמים?', 11, null, 'בין 6 צלצולים יש 5 הפסקות של שנייה. בין 12 צלצולים יש 11 הפסקות.'],
  ['חילזון בבור בעומק 10 מטר. ביום הוא עולה 3 מטר ובלילה יורד 2. אחרי כמה ימים יצא?', 8, null, 'אחרי 7 ימים הוא ב-7 מטר. ביום ה-8 עולה 3 ← 10 ויוצא!'],
  ['כמה פעמים אפשר להחסיר 5 מ-25?', 'פעם אחת', ['5 פעמים', 'פעם אחת', '4 פעמים', 'אינסוף'], 'אחרי הפעם הראשונה כבר מחסירים מ-20, לא מ-25 😄'],
  ['5 מכונות מייצרות 5 צעצועים ב-5 דקות. כמה דקות ייקח ל-100 מכונות לייצר 100 צעצועים?', 5, null, 'כל מכונה מייצרת צעצוע ב-5 דקות.'],
  ['סכום של 3 מספרים עוקבים הוא 48. מה הגדול מביניהם?', 17, null, '15 + 16 + 17 = 48'],
  ['בחווה יש תרנגולות ופרות: 10 ראשים ו-28 רגליים. כמה פרות?', 4, null, 'אם כולן תרנגולות: 20 רגליים. כל פרה מוסיפה 2 ← 8 ÷ 2 = 4 פרות'],
  ['מה המספר הבא? 2, 3, 5, 7, 11, 13, ?', 17, null, 'מספרים ראשוניים!'],
  ['מה גדול יותר: 2 בחזקת 10 או 10 בחזקת 3?', '2 בחזקת 10', ['2 בחזקת 10', '10 בחזקת 3', 'שווים'], '2¹⁰ = 1024 , 10³ = 1000'],
  ['אחי גדול ממני פי 2. לפני 5 שנים הוא היה גדול ממני פי 3. בן כמה אני?', 10, null, '2x − 5 = 3(x − 5) ← x = 10'],
  ['מה סכום כל המספרים מ-1 עד 100?', 5050, null, 'גאוס: 50 זוגות שכל אחד שווה 101 ← 50 × 101 = 5050'],
  ['אני חושב על מספר, כופל ב-4, מחסיר 6 ומקבל 30. מה המספר?', 9, null, '4x − 6 = 30 ← x = 9'],
  ['ענן אחד ועוד ענן אחד – כמה עננים?', 'ענן אחד גדול', ['2', 'ענן אחד גדול', '0', '11'], 'עננים מתחברים ☁️😄'],
  ['מה המספר הבא? 1, 4, 9, 16, 25, ?', 36, null, 'ריבועים: 6² = 36'],
  ['כמה שניות יש בשעה?', 3600, null, '60 × 60 = 3600'],
];
export function riddleState(p) { const t = today(); return { idx: Math.floor(Date.now() / 864e5) % RIDDLES.length, solved: p.riddle?.date === t && p.riddle.solved, tried: p.riddle?.date === t ? p.riddle.tries : 0 }; }
export function riddle(back) {
  const p = active(), st = riddleState(p), [q, a, choices, why] = RIDDLES[st.idx];
  const solved = () => { p.riddle = { date: today(), solved: true, tries: st.tried + 1 }; p.coins += 50; save(); sfx.win(); confetti(70); riddle(back); };
  app().innerHTML = `${topBar('🧩 חידת היום', { back })}
    <div class="question"><div style="font-size:50px">🧩</div><div class="big" style="font-size:24px;line-height:1.5">${esc(q)}</div></div>
    ${st.solved ? `<div class="feedback good"><b>🎉 פתרת! +50 🪙</b><div class="explain">${esc(why)}</div><p>חידה חדשה מחר!</p></div>`
      : choices ? `<div class="choices one">${choices.map(c => `<button class="choice" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>`
      : `<div class="answer"><input id="ri" inputmode="decimal" placeholder="?"><button class="btn ok" id="rg">✓</button></div>`}
    <p class="muted center">פותרים פעם ביום ומקבלים 50 מטבעות. אין הגבלת ניסיונות 😉</p>`;
  if (st.solved) return;
  const wrong = () => { sfx.bad(); p.riddle = { date: today(), solved: false, tries: st.tried + 1 }; save(); toast(st.tried >= 2 ? '💡 רמז: ' + why.split(/[.←]/)[0] : 'לא בדיוק... תחשבו שוב 🤔'); st.tried++; };
  app().querySelectorAll('[data-c]').forEach(b => b.onclick = () => b.dataset.c === a ? solved() : wrong());
  const go = document.getElementById('rg');
  if (go) { const inp = document.getElementById('ri'); const check = () => Math.abs(parseNum(inp.value) - a) < 1e-6 ? solved() : wrong(); go.onclick = check; inp.onkeydown = e => e.key === 'Enter' && check(); }
}

// Generic round engine used by math, english, gemara.
// question = { html, type:'choice'|'input'|'custom', choices, answer, check(v), explain, say:{text,lang}, render(el, done) }
import { app, esc, sfx, confetti, floatCoin, speak, parseNum, topBar, pick } from './ui.js';
import { active, recordRound, topicProgress, save } from './store.js';

const BOSS_HP = 8;
const BOSSES = ['👾', '🐲', '👹', '🦖', '🤖', '🐙', '👻', '🦈', '🧌'];

// Mistakes notebook: store a serialisable copy of wrong questions to retry later
const MAX_MISTAKES = 40;
function logMistake(p, book, q) {
  if (q.type === 'custom') return;
  const m = (p.mistakes ||= {})[book] ||= [];
  const keep = ({ type, html, answer, answerText, choices, explain, choiceCls, ansCls, hint, one, raw, tol }) => ({ type, html, answer, answerText, choices, explain, choiceCls, ansCls, hint, one, raw, tol });
  if (m.some(x => x.html === q.html)) return;
  m.unshift({ ...keep(q), topic: q.topic }); m.length = Math.min(m.length, MAX_MISTAKES); save();
}
export function mistakesOf(p, book) { return p.mistakes?.[book] || []; }
export function reviewMistakes(book, title, back) {
  const p = active(), list = [...mistakesOf(p, book)];
  if (!list.length) return;
  let k = 0;
  runQuiz({
    title, key: book + '_review', back, total: Math.min(10, list.length),
    gen: () => { const q = { ...list[k++] }; q.fromBook = true; if (q.type === 'input' && q.tol) q.check = v => Math.abs(parseNum(v) - q.answer) < q.tol; return q; },
    onAnswer: (q, ok) => { if (ok) { const m = p.mistakes[book]; const i = m.findIndex(x => x.html === q.html); if (i >= 0) m.splice(i, 1); save(); } },
  });
}

const PRAISE =['מעולה! 🎉', 'כל הכבוד! 💪', 'אלוף! 🏆', 'יפה מאוד! ⭐', 'וואו! 🤩', 'מדהים! 🚀', 'צדקת! ✅'];

export function runQuiz(opts) {
  const p = active();
  const o = { total: 10, back: '#/home', ...opts };
  const st = { i: 0, correct: 0, combo: 0, coins: 0, tries: 0, start: Date.now(), done: false, hp: BOSS_HP, hearts: 3 };
  if (o.boss) st.monster = BOSSES[(o.bossLevel || 1) % BOSSES.length];
  let timer;

  function header() {
    if (o.boss) return `${topBar(esc(o.title), { back: o.back, right: `<div class="pill">🪙 <span id="qc">${p.coins + st.coins}</span></div>` })}
      <div class="boss"><div class="monster" id="monster">${st.monster}</div><div class="grow"><div class="bar hp"><i id="hp" style="width:${st.hp / BOSS_HP * 100}%"></i></div>
      <div class="row" style="justify-content:space-between;margin-top:6px"><span id="hearts" style="font-size:22px">${'❤️'.repeat(st.hearts)}${'🤍'.repeat(3 - st.hearts)}</span><b class="combo" id="combo">${st.combo >= 2 ? '🔥x' + st.combo : ''}</b></div></div></div>`;
    const prog = o.timed ? `<div class="pill" id="clock">⏱️ ${o.timed}</div>` : `<div class="bar"><i style="width:${st.i / o.total * 100}%"></i></div>`;
    return `${topBar(esc(o.title), { back: o.back, right: `<div class="pill">🪙 <span id="qc">${p.coins + st.coins}</span></div>` })}
      <div class="qhead">${prog}<div class="combo" id="combo">${st.combo >= 2 ? '🔥x' + st.combo : ''}</div>
      ${o.timed ? `<div class="pill grow center">ניקוד: <b id="score">${st.correct}</b></div>` : ''}</div>`;
  }

  function next() {
    if (st.done) return;
    if (o.boss) { if (st.hp <= 0 || st.hearts <= 0) return finish(); }
    else if (!o.timed && st.i >= o.total) return finish();
    st.tries = 0;
    const q = o.gen(st.i, st);
    st.q = q;
    const el = app();
    el.innerHTML = header() + `<div class="question">${q.html}</div><div id="ans"></div><div id="fb"></div>`;
    if (q.say) { const b = document.createElement('button'); b.className = 'btn sec sm'; b.textContent = '🔊 שמע שוב'; b.onclick = () => speak(q.say.text, q.say.lang); el.querySelector('.question').appendChild(b); speak(q.say.text, q.say.lang); }
    const ans = el.querySelector('#ans');
    if (q.type === 'choice') {
      ans.innerHTML = `<div class="choices ${q.one ? 'one' : ''}">${q.choices.map((c, k) => `<button class="choice ${q.choiceCls || ''}" data-k="${k}">${q.raw ? c : esc(c)}</button>`).join('')}</div>`;
      ans.querySelectorAll('.choice').forEach(b => b.onclick = () => {
        if (st.locked) return;
        const c = q.choices[+b.dataset.k];
        const ok = q.check ? q.check(c) : c === q.answer;
        if (ok) b.classList.add('right'); else {
          b.classList.add('wrong');
          ans.querySelectorAll('.choice').forEach(x => { if (q.choices[+x.dataset.k] === q.answer) x.classList.add('right'); });
        }
        result(ok, b, true);
      });
    } else if (q.type === 'input') {
      ans.innerHTML = `<div class="answer"><input id="inp" inputmode="none" autocomplete="off" placeholder="?"><button class="btn ok" id="go">✓</button></div>
        <div class="keypad">${['7', '8', '9', '⌫', '4', '5', '6', '-', '1', '2', '3', '/', '0', '.', ' ', '✓'].map(k => `<button data-k="${k}" class="${k === '✓' ? 'go' : ''}">${k === ' ' ? '␣' : k}</button>`).join('')}</div>
        ${q.hint ? `<div class="muted center" style="margin-top:8px">${q.hint}</div>` : ''}`;
      const inp = ans.querySelector('#inp');
      const submit = () => {
        if (st.locked || !inp.value.trim()) return;
        const v = inp.value;
        const ok = q.check ? q.check(v) : Math.abs(parseNum(v) - q.answer) < 1e-6;
        if (!ok && st.tries === 0 && !o.timed) {
          st.tries++; sfx.bad(); inp.classList.add('wrong'); inp.style.animation = 'shake .4s';
          fb(`<div class="feedback badf">לא בדיוק... נסו שוב! 🤔</div>`);
          setTimeout(() => { inp.style.animation = ''; inp.value = ''; }, 450); return;
        }
        result(ok, ans.querySelector('#go'), false);
      };
      ans.querySelector('#go').onclick = submit;
      ans.querySelectorAll('.keypad button').forEach(b => b.onclick = () => {
        sfx.click(); const k = b.dataset.k;
        if (k === '⌫') inp.value = inp.value.slice(0, -1); else if (k === '✓') submit(); else inp.value += k;
      });
      inp.onkeydown = e => { if (e.key === 'Enter') submit(); };
      if (matchMedia('(pointer:fine)').matches) { inp.removeAttribute('inputmode'); inp.focus(); }
    } else if (q.type === 'custom') {
      q.render(ans, ok => result(ok, ans, false));
    }
    st.locked = false;
  }

  const fb = h => { app().querySelector('#fb').innerHTML = h; };

  function result(ok, el, choice) {
    st.locked = true;
    const q = st.q;
    const firstTry = st.tries === 0;
    o.onAnswer?.(q, ok && firstTry);
    if (ok) {
      if (firstTry) { st.correct++; st.combo++; } else st.combo = 0;
      const c = firstTry ? 5 + (st.combo >= 3 ? 2 : 0) : 2;
      st.coins += c; sfx.ok(); floatCoin(el, `+${c} 🪙`);
      if (st.combo > 0 && st.combo % 5 === 0) confetti(20);
      fb(`<div class="feedback good"><b>${pick(PRAISE)}</b>${st.combo >= 3 ? ` רצף של ${st.combo}! 🔥` : ''}${q.explainOk && q.explain ? `<div class="explain">${q.explain}</div>` : ''}</div>`);
      st.i++;
      if (o.boss) {
        st.hp -= st.combo >= 3 ? 2 : 1;   // combo = critical hit!
        const m = document.getElementById('monster'); m?.classList.remove('hit'); m?.offsetHeight; m?.classList.add('hit');
        const hp = document.getElementById('hp'); if (hp) hp.style.width = Math.max(0, st.hp) / BOSS_HP * 100 + '%';
        if (st.combo >= 3) floatCoin(m, '💥 x2');
      }
      setTimeout(next, o.timed ? 450 : (q.explainOk ? 2200 : 900));
    } else {
      st.combo = 0; sfx.bad();
      if (o.mistakes) logMistake(p, o.mistakes, q);
      if (o.boss) { st.hearts--; const h = document.getElementById('hearts'); if (h) h.textContent = '❤️'.repeat(Math.max(0, st.hearts)) + '🤍'.repeat(3 - Math.max(0, st.hearts)); }
      fb(`<div class="feedback badf"><b>התשובה הנכונה: <span class="${q.ansCls || ''}">${esc(q.answerText ?? q.answer)}</span></b>
        ${q.explain ? `<div class="explain">${q.explain}</div>` : ''}
        <button class="btn block" id="cont" style="margin-top:10px">המשך ⬅️</button></div>`);
      st.i++;
      app().querySelector('#cont').onclick = next;
      if (o.timed) setTimeout(next, 1500);
    }
    const qc = app().querySelector('#qc'); if (qc) qc.textContent = p.coins + st.coins;
  }

  function finish() {
    st.done = true; clearInterval(timer);
    const total = o.timed || o.boss ? st.i : o.total;
    if (o.boss && st.hp <= 0) st.coins += 30;
    const res = recordRound(p, o.key, { correct: st.correct, total, coins: st.coins, levelCount: o.timed || o.boss ? 0 : o.levelCount });
    if (o.onFinish) return o.onFinish(st, res);
    if (o.boss) {
      const won = st.hp <= 0;
      if (won) { sfx.win(); confetti(90, ['🎉', '⭐', '💥', st.monster]); }
      app().innerHTML = `${topBar(esc(o.title), { back: o.back })}<div class="card end">
        <div style="font-size:90px">${won ? '🏆' : st.monster}</div>
        <h2>${won ? `ניצחת את הבוס! ${st.monster}💥` : 'הבוס ניצח הפעם... נסו שוב! 💪'}</h2>
        <h3>${st.correct} תשובות נכונות</h3><div class="pill" style="display:inline-block">🪙 +${res.coins}${won ? ' (כולל בונוס 30)' : ''}</div>
        ${res.goalHit ? `<h3>🎯 השלמת את היעד היומי! +30 🪙</h3>` : ''}
        <div class="row" style="margin-top:16px"><button class="btn grow" id="again">${won ? 'בוס הבא 👾' : 'שוב 🔁'}</button><a class="btn sec grow" href="${o.back}">סיום</a></div></div>`;
      app().querySelector('#again').onclick = () => runQuiz({ ...opts, bossLevel: (o.bossLevel || 1) + (won ? 1 : 0) });
      return;
    }
    let best = '';
    if (o.timed) {
      const tp = topicProgress(p, o.key);
      if (st.correct > (tp.speedBest || 0)) { tp.speedBest = st.correct; best = '<h3>🏅 שיא חדש!</h3>'; save(); }
      else best = `<div class="muted">השיא שלך: ${tp.speedBest}</div>`;
    }
    const pct = res.pct, stars = pct >= .9 ? 3 : pct >= .7 ? 2 : pct >= .4 ? 1 : 0;
    if (stars >= 2 || res.leveledUp) { sfx.win(); confetti(res.leveledUp ? 80 : 40); }
    app().innerHTML = `${topBar(esc(o.title), { back: o.back })}
      <div class="card end">
        <h2>${stars === 3 ? 'מושלם!' : stars === 2 ? 'יפה מאוד!' : stars === 1 ? 'התקדמות טובה!' : 'נמשיך להתאמן 💪'}</h2>
        <div class="stars">${[1, 2, 3].map(n => `<i class="${n <= stars ? '' : 'dim'}">⭐</i>`).join('')}</div>
        <h3>${st.correct} / ${total} נכונות</h3>${best}
        <div class="pill" style="display:inline-block;margin:8px">🪙 +${res.coins}</div>
        ${res.leveledUp ? `<h2>🚀 עלית לשלב ${topicProgress(p, o.key).level}!</h2>` : ''}
        ${res.goalHit ? `<h3>🎯 השלמת את היעד היומי! +30 🪙 · רצף ${p.streak} ימים 🔥</h3>` : ''}
        <div class="row" style="margin-top:16px"><button class="btn grow" id="again">שוב 🔁</button><a class="btn sec grow" href="${o.back}">סיום</a></div>
      </div>`;
    app().querySelector('#again').onclick = () => (o.restart ? o.restart() : runQuiz(opts));
  }

  if (o.timed) {
    let left = o.timed;
    timer = setInterval(() => {
      left--; const c = document.getElementById('clock');
      if (!c || !location.hash.startsWith(o.hashPrefix || '#')) { clearInterval(timer); return; }
      c.textContent = `⏱️ ${left}`; const s = document.getElementById('score'); if (s) s.textContent = st.correct;
      if (left <= 0) finish();
    }, 1000);
  }
  next();
}

// Level picker screen shared by topics with levels
export function levelPicker(title, back, key, levelCount, names, onPick, extra = '') {
  const p = active(); const tp = topicProgress(p, key);
  app().innerHTML = `${topBar(title, { back })}
    <div class="card center"><h3>בחרו שלב</h3>
    <div class="lvls">${Array.from({ length: levelCount }, (_, i) => i + 1).map(n =>
      `<button data-l="${n}" class="${n === tp.level ? 'cur' : ''}" ${n > tp.maxLevel ? 'disabled' : ''}>${n > tp.maxLevel ? '🔒' : n}</button>`).join('')}</div>
    <p class="muted" id="lname">${esc(names?.[tp.level - 1] || '')}</p>
    <div class="bar"><i style="width:${(tp.maxLevel - 1) / Math.max(1, levelCount - 1) * 100}%"></i></div>
    <p class="muted">סיימו סבב עם 80% ומעלה כדי לפתוח את השלב הבא</p>
    <button class="btn block ok" id="start">יאללה! ▶️</button>${extra}</div>`;
  app().querySelectorAll('.lvls button').forEach(b => b.onclick = () => {
    tp.level = +b.dataset.l; save();
    app().querySelectorAll('.lvls button').forEach(x => x.classList.toggle('cur', x === b));
    app().querySelector('#lname').textContent = names?.[tp.level - 1] || '';
  });
  app().querySelector('#start').onclick = () => onPick(tp.level);
}

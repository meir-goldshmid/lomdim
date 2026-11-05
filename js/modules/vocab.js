// Vocabulary engine shared by English and Gemara: flashcards, quizzes, listening, spelling, memory, ordering.
import { app, esc, pick, shuffle, topBar, speak, sfx, confetti, floatCoin } from '../ui.js';
import { active, save, recordRound } from '../store.js';
import { runQuiz } from '../quiz.js';
import { canRecognize, listenOnce } from '../recog.js';
import { playHe, stopHe } from '../hebrew.js';
import { STORIES } from '../content/stories.js';
import { PACKS as EN } from '../content/english.js';
import { PACKS as GM } from '../content/gemara.js';

const SUBJ = {
  english: { title: '🇬🇧 אנגלית', lang: 'en', packs: p => EN.filter(k => !p.englishPacks?.length || p.englishPacks.includes(k.id)) },
  gemara: { title: '📜 גמרא', lang: 'he', packs: () => GM },
};

function allPacks(subject, p) {
  const custom = (p.lists[subject] || []).map(l => ({ ...l, em: '⭐', custom: true }));
  return [...custom, ...SUBJ[subject].packs(p)];
}
const findPack = (subject, p, id) => allPacks(subject, p).find(k => k.id === id);
const ck = (pack, it) => `${pack.id}:${it.q}`;
const box = (p, pack, it) => p.cards[ck(pack, it)] || 0;
const mastery = (p, pack) => pack.items.length ? Math.round(pack.items.filter(it => box(p, pack, it) >= 3).length / pack.items.length * 100) : 0;

// Leitner-weighted pick: weaker cards come up more often
function picker(p, pack) {
  let recent = [];
  return () => {
    const pool = pack.items.filter(it => !recent.includes(it));
    const weights = pool.map(it => 6 - box(p, pack, it));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    let it = pool[0];
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) { it = pool[i]; break; } }
    recent.push(it); if (recent.length > Math.min(4, pack.items.length - 1)) recent.shift();
    return it;
  };
}
function grade(p, pack, it, ok) { const k = ck(pack, it); p.cards[k] = ok ? Math.min(5, (p.cards[k] || 0) + 1) : 0; save(); }
const distract = (pack, it, field, n = 3) => shuffle([...new Set(pack.items.filter(x => x[field] !== it[field]).map(x => x[field]))]).slice(0, n);

export function vocabHome(subject) {
  const p = active(), S = SUBJ[subject];
  const packs = allPacks(subject, p);
  app().innerHTML = `${topBar(S.title)}
    <div class="grid">${packs.map(k => `<a class="tile" href="#/${subject}/${k.id}"><span class="badge">${mastery(p, k)}%</span>
      <span class="em">${k.em}</span>${esc(k.name)}<small>${k.items.length} פריטים</small></a>`).join('')}
    ${subject === 'english' ? `<a class="tile" href="#/english/stories"><span class="em">📖</span>סיפורים<small>קוראים, שומעים ועונים</small></a>` : ''}
    <a class="tile" href="#/parent/lists"><span class="em">➕</span>רשימה שלי<small>הוסיפו מילים מבית הספר</small></a></div>`;
}

// ---------- English stories: read along (tap a line to hear it), then answer questions ----------
function storiesRoute(id) {
  const p = active(), back = '#/english/stories';
  const lvl = p.age <= 10 ? 1 : 2;
  if (!id) {
    app().innerHTML = `${topBar('📖 סיפורים', { back: '#/english' })}
      <div class="grid">${[...STORIES].sort((a, b) => Math.abs(a.level - lvl) - Math.abs(b.level - lvl)).map(s => {
        const done = p.progress['english_' + s.id]?.best;
        return `<a class="tile" href="${back}/${s.id}"><span class="badge">${s.level === 1 ? 'קל' : 'בינוני'}</span><span class="em">${s.em}</span><span class="ltr">${esc(s.title)}</span><small>${done != null ? `⭐ ${done}%` : 'חדש!'}</small></a>`;
      }).join('')}</div>`;
    return;
  }
  const s = STORIES.find(x => x.id === id); if (!s) return storiesRoute();
  let showHe = s.level === 1, reading = false;
  const draw = () => {
    app().innerHTML = `${topBar(`${s.em} <span class="ltr">${esc(s.title)}</span>`, { back })}
      <div class="row" style="justify-content:center;gap:10px;margin-bottom:10px"><button class="btn" id="readall">${reading ? '⏸️' : '▶️ הקראה'}</button>
        ${s.lines[0][1] ? `<button class="btn sec" id="he">${showHe ? '✅ תרגום' : '⬜ תרגום'}</button>` : ''}</div>
      <div class="card">${s.lines.map(([en, he], k) => `<div class="line" data-k="${k}"><div class="ltr" style="font-size:21px;line-height:1.5">${esc(en)}</div>${showHe && he ? `<div class="muted">${esc(he)}</div>` : ''}</div>`).join('')}</div>
      <p class="muted center">לחצו על משפט כדי לשמוע אותו 🔊</p>
      <button class="btn ok block" id="qs" style="font-size:22px">❓ לשאלות</button>`;
    app().querySelectorAll('.line').forEach(el => el.onclick = () => { reading = false; mark(+el.dataset.k); speak(s.lines[+el.dataset.k][0].replace(/\p{Extended_Pictographic}/gu, ''), 'en', .8); });
    app().querySelector('#readall').onclick = async () => {
      reading = !reading; draw();
      for (let k = 0; k < s.lines.length && reading && location.hash.endsWith(s.id); k++) { mark(k); await speak(s.lines[k][0].replace(/\p{Extended_Pictographic}/gu, ''), 'en', .8); }
      reading = false; mark(-1); const b = app().querySelector('#readall'); if (b) b.textContent = '▶️ הקראה';
    };
    const he = app().querySelector('#he'); if (he) he.onclick = () => { showHe = !showHe; draw(); };
    app().querySelector('#qs').onclick = () => { reading = false; speechSynthesis.cancel(); quiz(); };
  };
  const mark = k => app().querySelectorAll('.line').forEach((el, j) => el.classList.toggle('on', j === k));
  const quiz = () => {
    let n = 0;
    runQuiz({ title: s.title, key: 'english_' + s.id, back: `${back}/${s.id}`, total: s.qs.length,
      restart: () => storiesRoute(s.id),
      gen: () => { const [q, a, wr] = s.qs[n++]; const rtl = /[֐-׿]/.test(q); return { type: 'choice', one: true, html: `<div class="big ${rtl ? '' : 'ltr'}" style="font-size:24px">${esc(q)}</div>`, answer: a, choices: shuffle([a, ...wr]), choiceCls: /[֐-׿]/.test(a) ? '' : 'ltr', ansCls: 'ltr' }; } });
  };
  draw();
}

const MODES = {
  learn: { name: 'כרטיסיות לימוד', em: '🃏' },
  meaning: { name: 'מה הפירוש?', em: '🤔' },
  reverse: { name: 'איך אומרים?', em: '🔁' },
  pic: { name: 'תמונה ← מילה', em: '🖼️' },
  listen: { name: 'הקשבה', em: '👂' },
  spell: { name: 'איות', em: '🔡' },
  memory: { name: 'משחק זיכרון', em: '🧠' },
  order: { name: 'סדר את הסוגיא', em: '🧩' },
  fill: { name: 'השלמת משפטים', em: '✍️' },
  abcName: { name: 'שמע ובחר אות', em: '👂' },
  abcCase: { name: 'גדולה וקטנה', em: '🔠' },
  abcFirst: { name: 'באיזו אות מתחיל?', em: '🍎' },
  boss: { name: 'קרב בוס', em: '👾' },
  say: { name: 'תגיד באנגלית!', em: '🗣️' },
  build: { name: 'בנו את המשפט', em: '🧩' },
};
Object.assign(MODES, { blend: { name: 'מחברים צלילים', em: '🔊' }, readpic: { name: 'קוראים ומוצאים תמונה', em: '🖼️' }, hear: { name: 'האזנה לסוגיא', em: '🎧' } });
const BOSSABLE = ['readpic','meaning', 'reverse', 'pic', 'listen', 'fill', 'abcName', 'abcCase', 'abcFirst'];

function modesFor(subject, pack) {
  if (pack.type === 'abc') return ['learn', 'abcName', 'abcCase', 'abcFirst', 'memory', 'boss'];
  if (pack.type === 'grammar') return ['fill', 'build', 'boss'];
  if (pack.type === 'phonics') return ['blend', 'readpic', 'listen', 'spell', ...(canRecognize() ? ['say'] : []), 'memory', 'boss'];
  if (subject === 'gemara') return ['hear', 'learn', 'meaning', 'reverse', 'memory', 'boss', ...(pack.custom ? ['order'] : [])];
  const m = ['learn', 'meaning', 'reverse'];
  if (pack.items.some(i => i.e)) m.push('pic');
  if (subject === 'english') m.push('listen', 'spell');
  if (subject === 'english' && canRecognize()) m.push('say');
  m.push('memory', 'boss');
  if (pack.custom && subject === 'gemara') m.push('order');
  return m;
}

export function packHome(subject, id, mode) {
  if (subject === 'english' && id === 'stories') return storiesRoute(mode);
  const p = active(), pack = findPack(subject, p, id);
  if (!pack) return vocabHome(subject);
  if (mode) return play(subject, pack, mode);
  app().innerHTML = `${topBar(`${pack.em} ${esc(pack.name)}`, { back: '#/' + subject })}
    <div class="card"><div class="row"><b>שליטה:</b><div class="bar grow"><i style="width:${mastery(p, pack)}%"></i></div><b>${mastery(p, pack)}%</b></div></div>
    <div class="grid">${modesFor(subject, pack).map(m => `<a class="tile" href="#/${subject}/${id}/${m}"><span class="em">${MODES[m].em}</span>${MODES[m].name}</a>`).join('')}</div>`;
}

function play(subject, pack, mode) {
  const p = active(), S = SUBJ[subject], back = `#/${subject}/${pack.id}`;
  const lang = S.lang, next = picker(p, pack), key = `${subject}_${pack.id}_${mode}`;
  const total = Math.min(10, Math.max(4, pack.items.length));
  const title = `${MODES[mode].em} ${MODES[mode].name}`;
  const qcls = lang === 'en' ? 'ltr' : '';
  const base = { title, key, back, total, onAnswer: (q, ok) => q.item && grade(p, pack, q.item, ok) };

  if (mode === 'learn') return flashcards(subject, pack, back);
  if (mode === 'blend') return blend(pack, back);
  if (mode === 'hear') return hearSugya(pack, back);
  if (mode === 'memory') return memory(pack, back, key, lang);
  if (mode === 'order') return orderGame(pack, back, key);

  const gens = {
    meaning: () => { const it = next(); return { item: it, type: 'choice', html: `${it.e ? `<div class="huge">${it.e}</div>` : ''}<div class="big ${qcls}">${esc(it.q)}</div>`, say: lang === 'en' ? { text: it.q, lang } : null, answer: it.a, choices: shuffle([it.a, ...distract(pack, it, 'a')]), one: subject === 'gemara' }; },
    reverse: () => { const it = next(); return { item: it, type: 'choice', html: `<div class="big">${esc(it.a)}</div><div class="sub">${lang === 'en' ? 'איך אומרים באנגלית?' : 'איך אומרים בגמרא?'}</div>`, answer: it.q, choices: shuffle([it.q, ...distract(pack, it, 'q')]), choiceCls: qcls }; },
    pic: () => { let it; do { it = next(); } while (!it.e); return { item: it, type: 'choice', html: `<div class="huge">${it.e}</div>`, answer: it.q, choices: shuffle([it.q, ...distract(pack, it, 'q')]), choiceCls: 'ltr' }; },
    listen: () => { const it = next(); return { item: it, type: 'choice', html: `<div class="huge">👂</div><div class="sub">הקשיבו ובחרו את המילה</div>`, say: { text: it.q, lang: 'en' }, answer: it.q, choices: shuffle([it.q, ...distract(pack, it, 'q')]), choiceCls: 'ltr', explain: `${it.e || ''} ${it.q} = ${it.a}` }; },
    spell: () => { let it, g = 0; do { it = next(); g++; } while ((it.q.length > 9 || /[^a-z]/i.test(it.q)) && g < 30); return spellQ(it); },
    fill: () => { const it = next(); return { item: it, type: 'choice', html: `<div class="big ltr" style="font-size:26px">${esc(it.q).replace('___', '<u>&nbsp;?&nbsp;</u>')}</div>`, answer: it.a, choices: shuffle([it.a, ...it.wrong]), choiceCls: 'ltr', explain: it.he, explainOk: true, say: null }; },
    abcName: () => { const it = next(); return { item: it, type: 'choice', html: `<div class="huge">👂</div><div class="sub">איזו אות שמעתם?</div>`, say: { text: it.q, lang: 'en' }, answer: it.q, choices: shuffle([it.q, ...distract(pack, it, 'q')]), choiceCls: 'ltr', explain: `${it.q} ${it.a} – ${it.word} ${it.e}` }; },
    abcCase: () => { const it = next(), up = Math.random() < .5; return { item: it, type: 'choice', html: `<div class="huge ltr">${up ? it.q : it.a}</div><div class="sub">מצאו את ה${up ? 'קטנה' : 'גדולה'}</div>`, answer: up ? it.a : it.q, choices: shuffle([up ? it.a : it.q, ...distract(pack, it, up ? 'a' : 'q')]), choiceCls: 'ltr' }; },
    abcFirst: () => { const it = next(); return { item: it, type: 'choice', html: `<div class="huge">${it.e}</div><div class="big ltr">${it.word}</div>`, say: { text: it.word, lang: 'en' }, answer: it.q, choices: shuffle([it.q, ...distract(pack, it, 'q')]), choiceCls: 'ltr' }; },
  };
  gens.readpic = () => { const it = next(); return { item: it, type: 'choice', html: `<div class="big ltr" style="font-size:56px">${esc(it.q)}</div><div class="sub">קראו ומצאו את התמונה</div>`, answer: it.e, choices: shuffle([it.e, ...distract(pack, it, 'e')]), choiceCls: 'pics', explain: `${it.q} = ${it.a}`, answerText: it.e }; };
  gens.say = () => { let it, g = 0; do { it = next(); g++; } while (/[^a-z \-']/i.test(it.q) && g < 30); return sayQ(it); };
  gens.build = () => buildQ(next());
  if (mode === 'boss') {
    const ms = modesFor(subject, pack).filter(m => BOSSABLE.includes(m));
    return runQuiz({ ...base, boss: true, gen: () => gens[pick(ms)]() });
  }
  runQuiz({ ...base, gen: gens[mode] });
}

// ---------- phonics: tap each letter to hear its sound, then blend into the word ----------
const PHON = { a: 'ah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fff', g: 'guh', h: 'huh', i: 'ih', j: 'juh', k: 'kuh', l: 'lll', m: 'mmm', n: 'nnn', o: 'aw', p: 'puh', q: 'kwuh', r: 'rrr', s: 'sss', t: 'tuh', u: 'uh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz' };
function blend(pack, back) {
  const p = active(), items = shuffle(pack.items).slice(0, 8); let i = 0;
  const draw = () => {
    if (i >= items.length) { confetti(50); sfx.win(); recordRound(p, 'english_phonics_blend', { correct: items.length, total: items.length, coins: 20 }); app().innerHTML = `${topBar('🔊 מחברים צלילים', { back })}<div class="card end"><h2>קראת ${items.length} מילים! 📖🎉</h2><div class="pill" style="display:inline-block">🪙 +20</div><br><br><a class="btn block" href="${back}">סיום</a></div>`; return; }
    const it = items[i], letters = it.q.split('');
    let heard = new Set();
    app().innerHTML = `${topBar('🔊 מחברים צלילים', { back })}
      <div class="qhead"><div class="bar"><i style="width:${i / items.length * 100}%"></i></div><div class="pill">${i + 1}/${items.length}</div></div>
      <p class="center muted">לחצו על כל אות ושמעו את הצליל שלה</p>
      <div class="letters" style="gap:12px;margin:10px 0 20px">${letters.map((c, k) => `<button data-k="${k}" style="width:76px;height:86px;font-size:52px">${c}</button>`).join('')}</div>
      <button class="btn gold block" id="bl" style="font-size:24px">🔗 חברו את הצלילים!</button>
      <div class="question hidden" id="rev" style="margin-top:16px"><div class="huge">${it.e}</div><div class="big ltr">${it.q}</div><div class="sub">${it.a}</div></div>
      <button class="btn ok block hidden" id="nx">הבא ▶️</button>`;
    const btns = app().querySelectorAll('[data-k]');
    btns.forEach(b => b.onclick = () => { const k = +b.dataset.k; heard.add(k); b.style.background = '#a29bfe'; b.style.color = '#fff'; speak(PHON[letters[k]] || letters[k], 'en', .7); });
    app().querySelector('#bl').onclick = async () => {
      for (let k = 0; k < letters.length; k++) { btns[k].style.background = '#fdcb6e'; await speak(PHON[letters[k]] || letters[k], 'en', .9); btns[k].style.background = ''; }
      await speak(it.q, 'en', .6);
      app().querySelector('#rev').classList.remove('hidden'); app().querySelector('#nx').classList.remove('hidden'); sfx.ok();
      grade(p, pack, it, true);
    };
    app().querySelector('#nx').onclick = () => { i++; draw(); };
  };
  draw();
}

// ---------- Gemara: listen to the sugya line by line (Aramaic → meaning) ----------
function hearSugya(pack, back) {
  const lines = pack.items; let i = 0, playing = false, withMeaning = true;
  const draw = () => {
    app().innerHTML = `${topBar('🎧 ' + esc(pack.name), { back })}
      <div class="row" style="justify-content:center;gap:10px;margin-bottom:12px">
        <button class="btn" id="play">${playing ? '⏸️ עצור' : '▶️ הקראה'}</button>
        <button class="btn sec" id="mean">${withMeaning ? '✅ עם פירוש' : '⬜ רק ארמית'}</button></div>
      <div class="card list">${lines.map((l, k) => `<div class="item ${k === i ? 'cur' : ''}" data-k="${k}" style="cursor:pointer;${k === i ? 'background:#efeaff;border-radius:12px;padding-inline:8px' : ''}">
        <div class="grow"><b style="font-size:21px">${esc(l.q)}</b>${withMeaning ? `<div class="muted">${esc(l.a)}</div>` : ''}</div><span>🔊</span></div>`).join('')}</div>
      <p class="muted center">לחצו על שורה כדי לשמוע אותה. ההקראה ממוחשבת – בארמית ללא ניקוד היא לא תמיד מדויקת.</p>`;
    app().querySelector('#play').onclick = () => { playing = !playing; if (playing) run(); else stopHe(); draw(); };
    app().querySelector('#mean').onclick = () => { withMeaning = !withMeaning; draw(); };
    app().querySelectorAll('[data-k]').forEach(el => el.onclick = async () => { playing = false; stopHe(); i = +el.dataset.k; draw(); await sayLine(lines[i]); });
    app().querySelector('.item.cur')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  const sayLine = async l => { if ((await playHe(l.q)) === null) { toast('אין חיבור לאינטרנט להקראה'); playing = false; return; } if (withMeaning) await playHe(l.a); };
  const run = async () => {
    while (playing && i < lines.length && location.hash.startsWith(back)) { draw(); await sayLine(lines[i]); if (!playing) return; i++; await new Promise(r => setTimeout(r, 500)); }
    if (i >= lines.length) { i = 0; playing = false; const p = active(); recordRound(p, 'gemara_' + pack.id + '_hear', { correct: lines.length, total: lines.length, coins: 10 }); toast('🎉 סיימתם להאזין לכל הסוגיא! +10 🪙'); }
    if (location.hash.startsWith(back)) draw();
  };
  draw();
}

// Pronunciation check with English speech recognition (2 attempts)
function sayQ(it) {
  const target = it.q.toLowerCase().replace(/[^a-z ]/g, '').trim();
  return {
    item: it, type: 'custom', answer: it.q, ansCls: 'ltr', explain: `${it.e || ''} ${it.q} = ${it.a}`,
    html: `${it.e ? `<div class="huge">${it.e}</div>` : ''}<div class="big ltr">${esc(it.q)}</div><div class="sub">${esc(it.a)}</div>`,
    say: { text: it.q, lang: 'en' },
    render(el, done) {
      let tries = 0;
      el.innerHTML = `<button class="mic" id="smic" style="margin:6px auto">🎤</button><p class="center" id="sst" style="font-size:19px;font-weight:700">לחצו ואמרו את המילה באנגלית</p>`;
      const mic = el.querySelector('#smic'), stt = el.querySelector('#sst');
      mic.onclick = async () => {
        if (mic.classList.contains('rec')) return;
        mic.classList.add('rec'); stt.textContent = '👂 Listening...';
        let alts = [];
        try { alts = await listenOnce('en-US'); } catch (e) { stt.textContent = e === 'network' ? 'צריך אינטרנט לזיהוי דיבור' : 'צריך לאשר מיקרופון 🎤'; mic.classList.remove('rec'); return; }
        mic.classList.remove('rec');
        const heard = alts.map(a => a.toLowerCase().replace(/[^a-z ]/g, '').trim());
        if (heard.some(h => h === target || ` ${h} `.includes(` ${target} `))) return done(true);
        tries++;
        if (tries >= 2) return done(false);
        stt.innerHTML = heard[0] ? `שמעתי "<span class="ltr">${esc(alts[0])}</span>" – נסו שוב! 🔊` : 'לא שמעתי... עוד פעם, חזק יותר';
        speak(it.q, 'en');
      };
    },
  };
}

// Tap the words in order to build the sentence
function buildQ(it) {
  const words = it.q.replace('___', it.a).split(' ');
  return {
    item: it, type: 'custom', answer: words.join(' '), ansCls: 'ltr', explain: it.he,
    html: `<div class="sub">${esc(it.he)}</div><div class="big ltr" id="built" style="font-size:24px;min-height:40px"></div>`,
    render(el, done) {
      const order = shuffle(words.map((w, i) => i)); const chosen = [];
      const draw = () => {
        document.getElementById('built').textContent = chosen.map(i => words[i]).join(' ') || '...';
        el.innerHTML = `<div class="letters" style="gap:10px">${order.map(i => `<button data-i="${i}" class="${chosen.includes(i) ? 'used' : ''}" style="width:auto;padding:0 14px;font-size:21px">${esc(words[i])}</button>`).join('')}</div>
          <div class="row" style="margin-top:12px;justify-content:center"><button class="btn sec sm" id="bundo">⌫ מחק</button></div>`;
        el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
          sfx.click(); chosen.push(+b.dataset.i); draw();
          if (chosen.length === words.length) done(chosen.map(i => words[i]).join(' ') === words.join(' '));
        });
        el.querySelector('#bundo').onclick = () => { chosen.pop(); draw(); };
      };
      draw();
    },
  };
}

function spellQ(it) {
  const word = it.q.toLowerCase();
  return {
    item: it, type: 'custom', answer: it.q, ansCls: 'ltr',
    html: `${it.e ? `<div class="huge">${it.e}</div>` : ''}<div class="big">${esc(it.a)}</div>`,
    say: { text: it.q, lang: 'en' },
    render(el, done) {
      const extra = shuffle('abcdefghijklmnoprstuwy'.split('').filter(c => !word.includes(c))).slice(0, 2);
      const tiles = shuffle([...word.replace(/ /g, '').split(''), ...extra]);
      const chosen = [];
      const draw = () => {
        el.innerHTML = `<div class="slots">${word.replace(/ /g, '').split('').map((_, i) => `<div class="slot ${chosen[i] != null ? 'f' : ''}">${chosen[i] != null ? tiles[chosen[i]] : ''}</div>`).join('')}</div>
          <div class="letters">${tiles.map((c, i) => `<button data-i="${i}" class="${chosen.includes(i) ? 'used' : ''}">${c}</button>`).join('')}</div>
          <div class="row" style="margin-top:12px;justify-content:center"><button class="btn sec sm" id="undo">⌫ מחק</button></div>`;
        el.querySelectorAll('.letters button').forEach(b => b.onclick = () => {
          sfx.click(); chosen.push(+b.dataset.i); draw();
          if (chosen.length === word.replace(/ /g, '').length) done(chosen.map(i => tiles[i]).join('') === word.replace(/ /g, ''));
        });
        el.querySelector('#undo').onclick = () => { chosen.pop(); draw(); };
      };
      draw();
    },
  };
}

function flashcards(subject, pack, back) {
  const p = active(), lang = SUBJ[subject].lang;
  const items = shuffle(pack.items).sort((a, b) => box(p, pack, a) - box(p, pack, b)).slice(0, 15);
  let i = 0, flipped = false;
  const draw = () => {
    if (i >= items.length) { confetti(30); sfx.win(); app().innerHTML = `${topBar('🃏 כרטיסיות', { back })}<div class="card end"><h2>סיימתם ${items.length} כרטיסים! 🎉</h2><p>עכשיו נסו משחק 😉</p><a class="btn block" href="${back}">למשחקים</a></div>`; return; }
    const it = items[i], front = pack.type === 'abc' ? `${it.q} ${it.a}` : it.q;
    const backTxt = pack.type === 'abc' ? `${it.e} ${it.word}` : `${it.e || ''} ${it.a}`;
    app().innerHTML = `${topBar('🃏 כרטיסיות', { back })}
      <div class="qhead"><div class="bar"><i style="width:${i / items.length * 100}%"></i></div><div class="pill">${i + 1}/${items.length}</div></div>
      <div class="question" id="card" style="min-height:260px;cursor:pointer">
        ${flipped ? `<div class="big">${esc(backTxt)}</div><div class="sub ${lang === 'en' ? 'ltr' : ''}">${esc(front)}</div>` : `${it.e && pack.type !== 'abc' ? `<div class="huge">${it.e}</div>` : ''}<div class="big ${lang === 'en' ? 'ltr' : ''}">${esc(front)}</div><div class="sub">לחצו כדי להפוך 👆</div>`}
      </div>
      <button class="btn sec block" id="say" style="margin-bottom:12px">🔊 שמע</button>
      <div class="row"><button class="btn bad grow" id="no">עוד לא 🤔</button><button class="btn ok grow" id="yes">יודע/ת! ✅</button></div>`;
    app().querySelector('#card').onclick = () => { flipped = !flipped; sfx.click(); draw(); };
    const say = app().querySelector('#say'); if (say) say.onclick = () => lang === 'en' ? speak(pack.type === 'abc' ? `${it.q}. ${it.word}` : it.q, 'en') : playHe(flipped ? it.a : it.q);
    app().querySelector('#yes').onclick = () => { grade(p, pack, it, true); p.coins += 1; save(); i++; flipped = false; draw(); };
    app().querySelector('#no').onclick = () => { grade(p, pack, it, false); i++; flipped = false; draw(); };
    if (lang === 'en' && !flipped) speak(pack.type === 'abc' ? it.q : it.q, 'en');
  };
  draw();
}

function memory(pack, back, key, lang) {
  const p = active();
  const n = Math.min(6, pack.items.length);
  const items = shuffle(pack.items).slice(0, n);
  const side = it => pack.type === 'abc' ? [it.q, it.e] : [it.q, it.e && Math.random() < .5 ? it.e : it.a];
  const cards = shuffle(items.flatMap((it, k) => { const [a, b] = side(it); return [{ k, t: a, l: lang === 'en' }, { k, t: b, l: false }]; }));
  let open = [], done = new Set(), moves = 0, lock = false;
  const draw = () => {
    app().innerHTML = `${topBar('🧠 משחק זיכרון', { back })}
      <div class="row" style="margin-bottom:12px"><div class="pill">מהלכים: ${moves}</div><div class="pill">זוגות: ${done.size}/${n}</div></div>
      <div class="mem ${n > 4 ? 'c4' : ''}">${cards.map((c, i) => `<button class="mcard ${open.includes(i) ? 'open' : ''} ${done.has(c.k) ? 'done open' : ''}" data-i="${i}">
        <span class="${c.l ? 'ltr' : ''} ${/\p{Extended_Pictographic}/u.test(c.t) && c.t.length <= 4 ? 'e' : ''}">${esc(c.t)}</span></button>`).join('')}</div>`;
    app().querySelectorAll('.mcard').forEach(b => b.onclick = () => {
      const i = +b.dataset.i, c = cards[i];
      if (lock || open.includes(i) || done.has(c.k)) return;
      sfx.click(); open.push(i);
      if (open.length === 2) {
        moves++; const [x, y] = open.map(j => cards[j]);
        if (x.k === y.k) { done.add(x.k); open = []; sfx.ok(); if (lang === 'en') speak(items[x.k].q, 'en'); }
        else { lock = true; setTimeout(() => { open = []; lock = false; draw(); }, 900); }
      }
      draw();
      if (done.size === n) setTimeout(() => {
        const coins = Math.max(5, 40 - (moves - n) * 3);
        recordRound(p, key, { correct: n, total: moves, coins });
        sfx.win(); confetti(50);
        app().innerHTML = `${topBar('🧠 משחק זיכרון', { back })}<div class="card end"><h2>כל הכבוד! 🎉</h2><div class="stars">${moves <= n + 2 ? '⭐⭐⭐' : moves <= n + 5 ? '⭐⭐' : '⭐'}</div>
          <h3>${moves} מהלכים</h3><div class="pill" style="display:inline-block">🪙 +${coins}</div>
          <div class="row" style="margin-top:16px"><button class="btn grow" id="again">שוב 🔁</button><a class="btn sec grow" href="${back}">סיום</a></div></div>`;
        app().querySelector('#again').onclick = () => memory(pack, back, key, lang);
      }, 600);
    });
  };
  draw();
}

// Put the lines of a custom sugya in order (tap them in sequence)
function orderGame(pack, back, key) {
  const p = active();
  const lines = pack.items.slice(0, 8);
  const order = shuffle(lines.map((_, i) => i));
  let nextIdx = 0, mistakes = 0;
  const draw = () => {
    app().innerHTML = `${topBar('🧩 סדר את הסוגיא', { back })}
      <p class="muted center">לחצו על השורות לפי הסדר הנכון</p>
      <div class="card">${lines.slice(0, nextIdx).map(l => `<div class="feedback good" style="margin:6px 0"><b>${esc(l.q)}</b> – ${esc(l.a)}</div>`).join('') || '<div class="muted center">...</div>'}</div>
      <div class="choices one">${order.filter(i => i >= nextIdx).map(i => `<button class="choice" data-i="${i}" style="font-size:20px">${esc(lines[i].q)}</button>`).join('')}</div>`;
    app().querySelectorAll('.choice').forEach(b => b.onclick = () => {
      if (+b.dataset.i === nextIdx) { sfx.ok(); nextIdx++; floatCoin(b, '+3 🪙'); }
      else { sfx.bad(); mistakes++; b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 400); return; }
      if (nextIdx === lines.length) {
        const coins = Math.max(5, lines.length * 3 - mistakes * 2);
        recordRound(p, key, { correct: lines.length, total: lines.length + mistakes, coins });
        confetti(40); sfx.win();
        app().innerHTML = `${topBar('🧩 סדר את הסוגיא', { back })}<div class="card end"><h2>הסוגיא מסודרת! 🎉</h2><h3>${mistakes} טעויות</h3><div class="pill" style="display:inline-block">🪙 +${coins}</div>
          <div class="row" style="margin-top:16px"><button class="btn grow" id="again">שוב 🔁</button><a class="btn sec grow" href="${back}">סיום</a></div></div>`;
        app().querySelector('#again').onclick = () => orderGame(pack, back, key);
        return;
      }
      draw();
    });
  };
  draw();
}

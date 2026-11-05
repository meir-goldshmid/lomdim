// App shell: hash router, profile picker, kid home, shop.
import { app, esc, topBar, toast, sfx, confetti } from './ui.js';
import { profiles, active, setActive, save, dailyRounds, parseSetup, applySetup } from './store.js';
import { mathHome, mathTopic } from './modules/math.js';
import { vocabHome, packHome } from './modules/vocab.js';
import { speechHome, speechRoute } from './modules/speech.js';
import { parentRoute } from './modules/parent.js';
import { stopMic } from './audio.js';

const SUBJ = {
  math: { em: '🧮', name: 'מתמטיקה', sub: 'משוואות, שברים, אחוזים ועוד' },
  english: { em: '🇬🇧', name: 'אנגלית', sub: 'מילים, הקשבה, איות' },
  gemara: { em: '📜', name: 'גמרא', sub: 'ארמית, ראשי תיבות, מבנה הסוגיא' },
  speech: { em: '🗣️', name: 'מדברים יפה', sub: 'משחקי צלילים' },
};

// Cooperative weekly goal: everyone's correct answers (and speech stars) fill one family bar
const FAMILY_GOAL = 300;
function familyGoal() {
  const weekAgo = Date.now() - 7 * 864e5;
  const per = profiles().map(p => [p, p.log.filter(l => new Date(l.d) > weekAgo).reduce((a, l) => a + (l.score || 0), 0)]);
  const total = per.reduce((a, [, n]) => a + n, 0), pct = Math.min(100, total / FAMILY_GOAL * 100);
  return `<div class="card" style="margin-top:18px"><div class="row"><b>🏆 יעד משפחתי השבוע</b><span class="grow"></span><b>${total}/${FAMILY_GOAL} ⭐</b></div>
    <div class="bar" style="height:18px;margin:8px 0"><i style="width:${pct}%;background:linear-gradient(90deg,#fdcb6e,#e17055)"></i></div>
    <div class="row wrap" style="gap:6px">${per.map(([p, n]) => `<span class="pill" style="box-shadow:none;background:#f1effc">${p.avatar} ${n}</span>`).join('')}</div>
    <p class="muted" style="margin:8px 0 0">${total >= FAMILY_GOAL ? '🎉 הגעתם ליעד! מגיע לכם פרס משפחתי!' : 'כל תשובה נכונה של כל אחד מקרבת את כולם לפרס 💪'}</p></div>`;
}

function pickProfile() {
  document.documentElement.style.setProperty('--kid', '#6c5ce7');
  if (!profiles().length) {
    app().innerHTML = `<div class="center" style="margin-top:40px"><div style="font-size:70px">🎓</div><h1 style="font-size:34px;margin:0">לומדים בכיף</h1>
      <p class="muted">עוד אין כאן ילדים. הוסיפו את הילד הראשון באזור ההורים.</p><a class="btn" href="#/parent/kids">➕ הוספת ילד/ה</a></div>`;
    return;
  }
  app().innerHTML = `<div class="center" style="margin-top:20px"><div style="font-size:60px">🎓</div><h1 style="font-size:34px;margin:0">לומדים בכיף</h1><p class="muted">מי משחק עכשיו?</p></div>
    <div class="kids">${profiles().map(p => `<button class="kid" data-id="${p.id}" style="background:${p.color}"><span class="av">${p.avatar}</span>${esc(p.name)}<small>🪙 ${p.coins} · 🔥 ${p.streak}</small></button>`).join('')}</div>
    ${familyGoal()}
    <div class="center" style="margin-top:26px"><a class="btn sec" href="#/parent">👨‍👩‍👧 אזור הורים</a></div>`;
  app().querySelectorAll('.kid').forEach(b => b.onclick = () => { sfx.click(); setActive(b.dataset.id); location.hash = '#/home'; });
}

function home() {
  const p = active(); if (!p) return pickProfile();
  const today = dailyRounds(p), goal = p.goal;
  app().innerHTML = `${topBar('', { back: '#/', right: `<a class="iconbtn" href="#/shop">🛍️</a>` })}
    <div class="hero"><span class="av">${p.avatar}</span><div class="grow"><h2>שלום ${esc(p.name)}!</h2>
      <div class="stats"><span>🪙 ${p.coins}</span><span>🔥 ${p.streak} ימים</span><span>⭐ ${Math.floor(p.xp / 100) + 1} רמה</span></div></div></div>
    <div class="card"><div class="row"><b>🎯 יעד היום</b><span class="grow"></span><b>${Math.min(today, goal)}/${goal}</b></div>
      <div class="bar" style="margin-top:8px"><i style="width:${Math.min(100, today / goal * 100)}%"></i></div>
      ${today >= goal ? '<p style="margin:8px 0 0">🏆 השלמת את היעד היום! אלוף/ה!</p>' : ''}</div>
    <div class="grid">${p.subjects.map(s => `<a class="tile" href="#/${s}"><span class="em">${SUBJ[s].em}</span>${SUBJ[s].name}<small>${SUBJ[s].sub}</small></a>`).join('')}
      <a class="tile" href="#/shop"><span class="em">🛍️</span>חנות<small>קונים פרסים במטבעות</small></a></div>`;
}

const SHOP = [
  ['🐶', 30], ['🐱', 30], ['🐼', 40], ['🦊', 40], ['🐸', 40], ['🐧', 50], ['🦉', 50], ['🐙', 60], ['🦄', 80], ['🐲', 100], ['🦖', 100], ['🦁', 80],
  ['🚀', 120], ['🏎️', 120], ['🎸', 90], ['⚽', 60], ['🏀', 60], ['🎨', 70], ['🧸', 70], ['👑', 200], ['💎', 250], ['🌈', 150], ['🪐', 180], ['🏆', 300],
];
function shop() {
  const p = active(); if (!p) return pickProfile();
  app().innerHTML = `${topBar('🛍️ חנות', { right: `<div class="pill">🪙 ${p.coins}</div>` })}
    <p class="muted center">קונים דמויות ומשתמשים בהן כתמונת פרופיל!</p>
    <div class="grid" style="grid-template-columns:repeat(3,1fr)">${SHOP.map(([e, c]) => {
      const own = p.owned.includes(e);
      return `<button class="shopitem" data-e="${e}" data-c="${c}"><span class="e">${e}</span>${own ? (p.avatar === e ? '✅ בשימוש' : 'לבחירה') : `🪙 ${c}`}</button>`;
    }).join('')}</div>`;
  app().querySelectorAll('.shopitem').forEach(b => b.onclick = () => {
    const e = b.dataset.e, c = +b.dataset.c;
    if (p.owned.includes(e)) { p.avatar = e; save(); sfx.ok(); return shop(); }
    if (p.coins < c) { sfx.bad(); return toast(`חסרים ${c - p.coins} מטבעות – עוד קצת תרגול! 💪`); }
    p.coins -= c; p.owned.push(e); p.avatar = e; save(); sfx.win(); confetti(40, [e, '✨']); shop();
  });
}

function route() {
  stopMic(); speechSynthesis?.cancel?.();
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [r, ...rest] = parts;
  const p = active();
  if (p) document.documentElement.style.setProperty('--kid', p.color);
  if (r === 'parent') return parentRoute(rest[0]);
  if (!r) return pickProfile();
  if (!p) { location.hash = '#/'; return; }
  window.scrollTo(0, 0);
  switch (r) {
    case 'home': return home();
    case 'shop': return shop();
    case 'math': return rest[0] ? mathTopic(rest[0]) : mathHome();
    case 'english': case 'gemara': return rest[0] ? packHome(r, rest[0], rest[1]) : vocabHome(r);
    case 'speech': return rest[0] ? speechRoute(rest) : speechHome();
    default: return home();
  }
}

// Family setup link (see store.js). Remove the code from the address bar and history right away.
function setupFromLink() {
  const m = location.hash.match(/^#setup=([\w-]+)$/);
  if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  try {
    const added = applySetup(parseSetup(m[1]));
    setTimeout(() => toast(added.length ? `נוספו: ${added.map(k => k.name).join(', ')} 🎉` : 'כל הילדים כבר נמצאים כאן ✔'), 200);
  } catch (e) { setTimeout(() => toast('קישור ההגדרה לא תקין'), 200); }
}
setupFromLink();

addEventListener('hashchange', () => { setupFromLink(); route(); });
// Links to the current hash (e.g. "back" from a quiz to its own topic screen) don't fire hashchange – re-route manually.
addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (a && a.getAttribute('href') === location.hash) { e.preventDefault(); route(); }
});
route();

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');

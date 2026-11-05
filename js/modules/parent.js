// Parent area (PIN protected): progress, custom content lists, kid settings, backup.
import { app, esc, topBar, toast, $$ } from '../ui.js';
import { getState, profiles, active, save, addProfile, removeProfile, exportJSON, importJSON, uid } from '../store.js';
import { TOPICS } from './math.js';
import { PACKS as EN } from '../content/english.js';
import { SOUNDS } from './speech.js';

let unlocked = false;
const SUBJECTS = { math: '🧮 מתמטיקה', english: '🇬🇧 אנגלית', gemara: '📜 גמרא', speech: '🗣️ דיבור' };

// ---------- weekly report: this week vs last week, strengths, what needs work ----------
function weekStats(p) {
  const now = Date.now(), W = 7 * 864e5;
  const inRange = (l, a, b) => { const t = now - new Date(l.d); return t >= a && t < b; };
  const sum = (arr, f) => arr.reduce((s, l) => s + f(l), 0);
  const cur = p.log.filter(l => inRange(l, 0, W)), prev = p.log.filter(l => inRange(l, W, 2 * W));
  const days = new Set(cur.map(l => l.d.slice(0, 10))).size;
  const byTopic = {};
  cur.forEach(l => { const k = l.topic.replace(/_(speed|boss|review)$/, ''); const t = (byTopic[k] ||= [0, 0]); t[0] += l.score; t[1] += l.total; });
  const topics = Object.entries(byTopic).filter(([, [, n]]) => n >= 3).map(([k, [c, n]]) => [k, c / n, n]);
  const strong = topics.filter(t => t[1] >= .85).sort((a, b) => b[2] - a[2]).slice(0, 2);
  const weak = topics.filter(t => t[1] < .65).sort((a, b) => a[1] - b[1]).slice(0, 2);
  return { rounds: cur.length, prevRounds: prev.length, correct: sum(cur, l => l.score), total: sum(cur, l => l.total), prevCorrect: sum(prev, l => l.score), days, strong, weak };
}
function report(el) {
  const lines = [];
  el.innerHTML = profiles().map(p => {
    const s = weekStats(p), acc = s.total ? Math.round(s.correct / s.total * 100) : 0;
    const trend = s.correct > s.prevCorrect ? '📈' : s.correct < s.prevCorrect ? '📉' : '➖';
    const mistakes = p.mistakes?.math?.length || 0;
    const tips = [];
    if (!s.rounds) tips.push('לא תרגל/ה השבוע – אולי להציע 10 דקות ביחד?');
    else if (s.days < 3) tips.push('תרגל/ה רק ' + s.days + ' ימים – עדיף מעט כל יום');
    s.weak.forEach(([k]) => tips.push('לחזק: ' + topicName(k)));
    if (mistakes >= 5) tips.push(`יש ${mistakes} שאלות במחברת הטעויות – כדאי לעבור עליהן`);
    if (s.strong.length) tips.push('לפרגן על: ' + s.strong.map(([k]) => topicName(k)).join(', ') + ' 👏');
    lines.push(`${p.avatar} ${p.name}: ${s.rounds} סבבים ב-${s.days} ימים, ${s.correct} תשובות נכונות (${acc}%) ${trend}${tips.length ? '\n   ' + tips.join('\n   ') : ''}`);
    return `<div class="card"><div class="row"><span style="font-size:40px">${p.avatar}</span><div class="grow"><h3 style="margin:0">${esc(p.name)}</h3>
      <span class="muted">🔥 רצף ${p.streak} ימים · 🪙 ${p.coins}</span></div><span style="font-size:30px">${trend}</span></div>
      <div class="row wrap" style="margin:10px 0;gap:8px">
        <span class="pill">🗓️ ${s.days}/7 ימים</span><span class="pill">🔁 ${s.rounds} סבבים <small class="muted">(שבוע שעבר ${s.prevRounds})</small></span>
        <span class="pill">✅ ${s.correct} נכונות</span>${s.total ? `<span class="pill">🎯 ${acc}%</span>` : ''}</div>
      ${tips.map(t => `<div>• ${esc(t)}</div>`).join('')}</div>`;
  }).join('') + `<button class="btn block" id="share">📤 שיתוף הדוח (וואטסאפ / העתקה)</button>`;
  el.querySelector('#share').onclick = async () => {
    const text = `📈 דוח שבועי – לומדים בכיף\n\n${lines.join('\n\n')}`;
    try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); toast('הדוח הועתק ✔'); } } catch (e) { }
  };
}

export function parentRoute(tab = 'report') {
  if (!unlocked) return pinGate(() => { unlocked = true; parentRoute(tab); });
  const tabs = { report: '📈 דוח שבועי', progress: '📊 התקדמות', lists: '📝 רשימות תוכן', kids: '👧 ילדים', backup: '💾 גיבוי' };
  app().innerHTML = `${topBar('👨‍👩‍👧 אזור הורים', { back: active() ? '#/home' : '#/' })}
    <div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button class="${k === tab ? 'on' : ''}" data-t="${k}">${v}</button>`).join('')}</div><div id="pc"></div>`;
  $$('.tabs button').forEach(b => b.onclick = () => { location.hash = '#/parent/' + b.dataset.t; });
  ({ report, progress, lists, kids, backup })[tab]?.(document.getElementById('pc'));
}

function pinGate(ok) {
  const a = 3 + Math.floor(Math.random() * 6), b = 6 + Math.floor(Math.random() * 7);
  app().innerHTML = `${topBar('🔒 אזור הורים', { back: active() ? '#/home' : '#/' })}
    <div class="card center"><p>הכניסו קוד הורים (ברירת מחדל: 1234)</p>
    <div class="answer"><input id="pin" type="password" inputmode="numeric" placeholder="••••"><button class="btn ok" id="go">כניסה</button></div>
    <p class="muted" style="margin-top:14px">שכחתם? פתרו: ${a} × ${b} = ?</p>
    <div class="answer"><input id="mq" inputmode="numeric" placeholder="?"><button class="btn sec" id="go2">כניסה</button></div></div>`;
  const pin = document.getElementById('pin'); pin.focus();
  const check = () => pin.value === getState().pin ? ok() : toast('קוד שגוי');
  document.getElementById('go').onclick = check; pin.onkeydown = e => e.key === 'Enter' && check();
  document.getElementById('go2').onclick = () => (+document.getElementById('mq').value === a * b ? ok() : toast('לא נכון'));
}

const topicName = key => {
  if (key.startsWith('m_')) { const t = TOPICS.find(t => key.startsWith('m_' + t.key)); return t ? `🧮 ${t.name}${key.endsWith('_speed') ? ' ⚡' : ''}` : key; }
  const [subj, ...rest] = key.split('_'); return `${SUBJECTS[subj]?.split(' ')[0] || ''} ${rest.join(' ')}`;
};

function progress(el) {
  el.innerHTML = profiles().map(p => {
    const rows = Object.entries(p.progress).filter(([, v]) => v.rounds).sort((a, b) => b[1].rounds - a[1].rounds);
    const week = p.log.filter(l => Date.now() - new Date(l.d) < 7 * 864e5);
    return `<div class="card"><div class="row"><span style="font-size:40px">${p.avatar}</span><div class="grow"><h3 style="margin:0">${esc(p.name)}</h3>
      <span class="muted">🪙 ${p.coins} · 🔥 ${p.streak} ימים · ${week.length} סבבים השבוע</span></div></div>
      ${rows.length ? `<div class="list">${rows.map(([k, v]) => `<div class="item"><span class="grow">${esc(topicName(k))}</span>
        ${v.maxLevel > 1 || k.startsWith('m_') ? `<span class="pill">שלב ${v.level}/${v.maxLevel}</span>` : ''}
        <span class="muted">${Math.round(v.correct / Math.max(1, v.correct + v.wrong) * 100)}% · ${v.rounds} סבבים</span></div>`).join('')}</div>` : '<p class="muted">עוד לא שיחק/ה</p>'}
      ${p.subjects.includes('speech') ? `<p>🗣️ תרגולי דיבור: ${Object.entries(p.speech.done).map(([s, n]) => `${s}: ${n}`).join(' · ') || '—'}</p>` : ''}</div>`;
  }).join('');
}

// Parse "word - translation" lines (also accepts | , tab, = , –)
export function parseList(txt) {
  return txt.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const m = l.split(/\s*(?:\t|\||=|\s[-–—]\s)\s*/);
    return m.length >= 2 ? { q: m[0].trim(), a: m.slice(1).join(' - ').trim() } : null;
  }).filter(Boolean);
}

function lists(el, kidId = active()?.id || profiles()[0]?.id, subject = 'english') {
  const p = profiles().find(x => x.id === kidId);
  if (!p) { el.innerHTML = '<div class="card center">קודם מוסיפים ילד/ה בלשונית "ילדים" 👧</div>'; return; }
  const L = p.lists[subject] ||= [];
  el.innerHTML = `<div class="card">
    <div class="row"><select class="f grow" id="kid">${profiles().map(k => `<option value="${k.id}" ${k.id === kidId ? 'selected' : ''}>${k.avatar} ${esc(k.name)}</option>`).join('')}</select>
    <select class="f grow" id="subj"><option value="english" ${subject === 'english' ? 'selected' : ''}>אנגלית</option><option value="gemara" ${subject === 'gemara' ? 'selected' : ''}>גמרא</option></select></div>
    ${L.map((l, i) => `<div class="item row"><b class="grow">⭐ ${esc(l.name)}</b><span class="muted">${l.items.length}</span>
      <button class="btn sm sec" data-edit="${i}">✏️</button><button class="btn sm bad" data-del="${i}">🗑️</button></div>`).join('') || '<p class="muted">אין עדיין רשימות</p>'}</div>
    <div class="card"><h3 id="ftitle">רשימה חדשה</h3>
      <input class="f" id="lname" placeholder="${subject === 'english' ? 'למשל: Unit 4 – מילים למבחן' : 'למשל: אלו מציאות – דף כא.'}">
      <textarea id="ltext" placeholder="${subject === 'english' ? 'מילה - תרגום (שורה לכל מילה)\nbeautiful - יפה\nbuild - לבנות' : 'ארמית - פירוש (שורה לכל ביטוי, לפי סדר הסוגיא)\nמצא פירות מפוזרין - מצא פירות מפוזרים\nהרי אלו שלו - הם שלו'}"></textarea>
      <p class="muted">💡 אפשר להעתיק מרשימה של בית הספר. בגמרא – הכניסו את שורות הסוגיא לפי הסדר, ותופיע גם "סדר את הסוגיא".</p>
      <button class="btn ok block" id="savel">שמירה</button></div>`;
  let editing = -1;
  el.querySelector('#kid').onchange = e => lists(el, e.target.value, subject);
  el.querySelector('#subj').onchange = e => lists(el, kidId, e.target.value);
  $$('[data-del]', el).forEach(b => b.onclick = () => { if (confirm('למחוק את הרשימה?')) { L.splice(+b.dataset.del, 1); save(); lists(el, kidId, subject); } });
  $$('[data-edit]', el).forEach(b => b.onclick = () => {
    editing = +b.dataset.edit; const l = L[editing];
    el.querySelector('#ftitle').textContent = 'עריכת רשימה'; el.querySelector('#lname').value = l.name;
    el.querySelector('#ltext').value = l.items.map(i => `${i.q} - ${i.a}`).join('\n'); el.querySelector('#lname').scrollIntoView({ behavior: 'smooth' });
  });
  el.querySelector('#savel').onclick = () => {
    const name = el.querySelector('#lname').value.trim() || 'הרשימה שלי', items = parseList(el.querySelector('#ltext').value);
    if (items.length < 2) return toast('צריך לפחות 2 שורות בפורמט: מילה - תרגום');
    if (editing >= 0) Object.assign(L[editing], { name, items }); else L.push({ id: 'c_' + uid(), name, items });
    save(); toast(`נשמרו ${items.length} פריטים ✔`); lists(el, kidId, subject);
  };
}

function kids(el, openId) {
  el.innerHTML = profiles().map(p => `<details class="card" ${p.id === openId ? 'open' : ''}><summary style="font-size:20px;font-weight:700">${p.avatar} ${esc(p.name)} <span class="muted">(${p.age})</span></summary>
    <div data-id="${p.id}" style="margin-top:10px">
      <label>שם<input class="f" name="name" value="${esc(p.name)}"></label>
      <div class="row"><label class="grow">גיל<input class="f" name="age" type="number" value="${p.age}"></label>
      <label class="grow">אווטר<input class="f" name="avatar" value="${p.avatar}"></label><label class="grow">צבע<input class="f" name="color" type="color" value="${p.color}"></label></div>
      <label>יעד יומי (סבבים)<input class="f" name="goal" type="number" min="1" max="20" value="${p.goal}"></label>
      <b>מקצועות</b> <span class="muted">(אם לא מסמנים כלום – הכל)</span><div>${Object.entries(SUBJECTS).map(([k, v]) => `<label class="chk"><input type="checkbox" name="subj" value="${k}" ${p.subjects.includes(k) ? 'checked' : ''}>${v}</label>`).join('')}</div>
      <b>נושאי מתמטיקה</b> <span class="muted">(אם לא מסמנים כלום – הכל)</span><div>${TOPICS.map(t => `<label class="chk"><input type="checkbox" name="mt" value="${t.key}" ${p.mathTopics.includes(t.key) ? 'checked' : ''}>${t.em} ${t.name}</label>`).join('')}</div>
      <b>חבילות אנגלית</b><div>${EN.map(k => `<label class="chk"><input type="checkbox" name="ep" value="${k.id}" ${p.englishPacks.includes(k.id) ? 'checked' : ''}>${k.em} ${k.name}</label>`).join('')}</div>
      <b>דיבור – אילו צלילים לתרגל?</b> <span class="muted">(אם לא מסמנים כלום – הכל)</span><div>${Object.keys(SOUNDS).map(s => `<label class="chk"><input type="checkbox" name="snd" value="${s}" ${p.speech.sounds?.includes(s) ? 'checked' : ''}>${SOUNDS[s].em} ${s}</label>`).join('')}</div>
      <b>דיבור – במה הוא מחליף כל צליל?</b> <span class="muted">(למשחק "נכון או מצחיק")</span><div class="row wrap">${Object.keys(SOUNDS).map(s => `<label>${s} ← <input class="f" style="width:52px" name="sub_${s}" value="${p.speech.subs[s] || SOUNDS[s].sub}"></label>`).join('')}</div>
      <div class="row"><button class="btn ok grow" data-save>שמירה</button><button class="btn bad" data-remove>🗑️</button></div>
    </div></details>`).join('') + `<button class="btn block gold" id="addkid">➕ הוספת ילד/ה</button>`;
  $$('[data-save]', el).forEach(b => b.onclick = () => {
    const box = b.closest('[data-id]'), p = profiles().find(x => x.id === box.dataset.id), v = n => box.querySelector(`[name="${n}"]`).value;
    Object.assign(p, { name: v('name'), age: +v('age'), avatar: v('avatar') || '🙂', color: v('color'), goal: +v('goal') || 3 });
    p.subjects = $$('[name=subj]:checked', box).map(x => x.value);
    p.mathTopics = $$('[name=mt]:checked', box).map(x => x.value);
    p.englishPacks = $$('[name=ep]:checked', box).map(x => x.value);
    Object.keys(SOUNDS).forEach(s => { const x = v('sub_' + s).trim(); if (x) p.speech.subs[s] = x; });
    p.speech.sounds = $$('[name=snd]:checked', box).map(x => x.value);
    save(); toast('נשמר ✔');
  });
  $$('[data-remove]', el).forEach(b => b.onclick = () => { const id = b.closest('[data-id]').dataset.id; if (confirm('למחוק את הפרופיל וכל ההתקדמות?')) { removeProfile(id); kids(el); } });
  el.querySelector('#addkid').onclick = () => { const n = addProfile({ name: 'ילד/ה חדש/ה', avatar: '🐣', subjects: ['math'] }); kids(el, n.id); };
}

function backup(el) {
  el.innerHTML = `<div class="card"><h3>💾 גיבוי ושחזור</h3><p class="muted">כל המידע נשמר במכשיר הזה. כדאי לייצא גיבוי מדי פעם, או כדי להעביר למכשיר אחר.</p>
      <button class="btn block" id="exp">⬇️ ייצוא גיבוי</button><br><br>
      <label class="btn sec block">⬆️ שחזור מקובץ<input type="file" id="imp" accept=".json" hidden></label>
      <p class="muted">הקלטות קול נשמרות בנפרד ולא נכללות בגיבוי.</p></div>
    <div class="card"><h3>🔒 קוד הורים</h3><div class="answer"><input id="np" inputmode="numeric" placeholder="קוד חדש"><button class="btn ok" id="sp">שמירה</button></div></div>`;
  el.querySelector('#exp').onclick = () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([exportJSON()], { type: 'application/json' }));
    a.download = `lomdim-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  };
  el.querySelector('#imp').onchange = async e => { try { importJSON(await e.target.files[0].text()); toast('שוחזר ✔'); } catch (er) { toast('קובץ לא תקין'); } };
  el.querySelector('#sp').onclick = () => { const v = el.querySelector('#np').value.trim(); if (v.length < 4) return toast('לפחות 4 ספרות'); getState().pin = v; save(); toast('הקוד עודכן ✔'); };
}

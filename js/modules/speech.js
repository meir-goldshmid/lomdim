// Speech-sound practice for little kids (articulation): voice-powered games, listening, bubbles, wheel, memory, say-it practice.
// Not a replacement for a speech therapist (קלינאית תקשורת) – a fun daily-practice companion.
import { app, esc, pick, shuffle, topBar, speak, sfx, confetti, hasVoice, toast } from '../ui.js';
import { active, save } from '../store.js';
import { getClip, putClip, playBlob, recorder, stopMic } from '../audio.js';
import { canRecognize, listenOnce, judge } from '../recog.js';
import { playHe } from '../hebrew.js';

// game types: sustain = moves while the sound is held; burstGrow = grows per burst; burstMove = hops per burst; burstUp = rises per burst
const SKY = 'linear-gradient(#bde0fe,#e0f2ff 70%,#9ad18b 70%)', SEA = 'linear-gradient(#bde0fe,#e0f2ff 60%,#4dabf7 60%)';
export const SOUNDS = {
  'ב': { em: '🎈', color: '#e84393', sub: 'ד', game: { type: 'burstGrow', actor: '🎈', end: '💥', say: 'בּ! בּ! בּ!', note: 'כל "בּ" חזק מנפח את הבלון. 8 פעמים – והוא מתפוצץ!' },
    tip: 'בּ – השפתיים נצמדות ו"מתפוצצות" כמו בלון קטן. שימו אצבע על השפתיים, הראו במראה. אפשר להתחיל מ-מ (מממ) ואז לפתוח בחוזקה: מ←בּ.',
    syll: ['בָּה', 'בּוֹ', 'בִּי', 'בּוּ', 'בֶּה'],
    words: [['בננה', '🍌', 1], ['בית', '🏠', 1], ['בלון', '🎈', 1], ['ביצה', '🥚', 1], ['בובה', '🪆', 1], ['ברווז', '🦆', 1], ['בקבוק', '🍼', 1], ['בצל', '🧅', 1],
      ['אבא', '👨', 2], ['דובי', '🧸', 2], ['קוביה', '🎲', 2], ['סבון', '🧼', 2]],
    sentences: ['אבא אוכל בננה', 'הבלון של דובי', 'הבובה בבית'] },
  'ר': { em: '🚗', color: '#0984e3', sub: 'ל', game: { type: 'sustain', actor: '🚗', end: '🏁', bg: SKY, say: 'רררררר', note: 'כל זמן שאומרים ררר ארוך – המכונית נוסעת לדגל!' },
    tip: 'ר – כמו מנוע של מכונית: ררררר. אפשר להתחיל מגרגור מים, או מ-ג ולהאריך. בגיל 3.5 קושי בצליל ר נחשב לרוב תקין התפתחותית – מתאמנים בכיף, בלי לחץ.',
    syll: ['רָה', 'רוֹ', 'רִי', 'רוּ', 'רֶה'],
    words: [['רכבת', '🚂', 1], ['רגל', '🦵', 1], ['רובוט', '🤖', 1], ['רדיו', '📻', 1], ['ריבה', '🍓', 1], ['רופא', '🧑‍⚕️', 1],
      ['ארנב', '🐰', 2], ['פרפר', '🦋', 2], ['תרנגול', '🐓', 2], ['מטריה', '☂️', 2], ['ורד', '🌹', 2], ['פרה', '🐮', 2],
      ['כדור', '⚽', 3], ['גזר', '🥕', 3], ['נמר', '🐯', 3], ['ספר', '📚', 3], ['עכבר', '🐭', 3]],
    sentences: ['הרכבת נוסעת מהר', 'הארנב אוכל גזר', 'פרפר על הפרח'] },
  'ח': { em: '⛵', color: '#00b894', sub: 'ט', game: { type: 'sustain', actor: '⛵', end: '🏝️', bg: SEA, say: 'חחחחחח', note: 'כל זמן שאומרים חחח ארוך – הסירה שטה לאי!' },
    tip: 'ח – צליל מהגרון, כמו "חחח" של צחוק או כמו לנשוף חם על חלון קר. אם יוצא ט – הלשון קופצת קדימה. בקשו שהלשון "תישן" למטה ליד השיניים התחתונות, ושהאוויר "ינשוף" מאחורה.',
    syll: ['חָה', 'חוֹ', 'חִי', 'חוּ', 'חֶה'],
    words: [['חתול', '🐱', 1], ['חלב', '🥛', 1], ['חמור', '🫏', 1], ['חלון', '🪟', 1], ['חולצה', '👕', 1], ['חציל', '🍆', 1], ['חביתה', '🍳', 1],
      ['לחם', '🍞', 2], ['מחשב', '💻', 2], ['מחבת', '🍳', 2],
      ['תפוח', '🍎', 3], ['ירח', '🌙', 3], ['פרח', '🌸', 3], ['מפתח', '🔑', 3], ['אבטיח', '🍉', 3]],
    sentences: ['החתול שותה חלב', 'תפוח וחלה', 'הירח בחלון'] },
  'כ': { em: '🚀', color: '#6c5ce7', sub: 'ט', game: { type: 'burstUp', actor: '🚀', end: '🌟', say: 'כּ! כּ! כּ!', note: 'כל "כּ" מרים את הטיל למעלה. 8 פעמים – והוא טס לכוכבים!' },
    tip: 'כּ/ק – מהגרון, החלק האחורי של הלשון עולה. קצה הלשון נשאר למטה (אפשר להחזיק אותו בעדינות עם כפית). כמו שעון: כּ-כּ-כּ, או כמו שיעול קטן. ילדים שאומרים ט במקום ח לרוב אומרים גם ט במקום כּ.',
    syll: ['כָּה', 'קוֹ', 'כִּי', 'קוּ', 'כֶּה'],
    words: [['כלב', '🐶', 1], ['כדור', '⚽', 1], ['כובע', '🎩', 1], ['כוכב', '⭐', 1], ['קוף', '🐒', 1], ['קיפוד', '🦔', 1], ['כפית', '🥄', 1], ['קערה', '🥣', 1],
      ['מכונית', '🚗', 2], ['בקבוק', '🍼', 2], ['סוכריה', '🍬', 2], ['שוקולד', '🍫', 2], ['אוקטופוס', '🐙', 2]],
    sentences: ['הקוף עם כובע', 'הכלב ראה כוכב', 'כדור במכונית'] },
  'ג': { em: '⚽', color: '#e17055', sub: 'ד', game: { type: 'burstMove', actor: '⚽', end: '🥅', bg: SKY, say: 'גּוֹ! גּוֹ! גּוֹ!', note: 'כל "גּוֹ" בועט בכדור קדימה. 8 בעיטות – גול!' },
    tip: 'ג – כמו כּ, אבל עם קול (מהגרון). "גוֹ גוֹ גוֹ" כמו אוהדים במשחק. אם יוצא ד – קצה הלשון עולה קדימה; מזכירים לו שהלשון "ישנה" למטה.',
    syll: ['גָּה', 'גּוֹ', 'גִּי', 'גּוּ', 'גֶּה'],
    words: [['גמל', '🐪', 1], ['גזר', '🥕', 1], ['גלידה', '🍦', 1], ['גיטרה', '🎸', 1], ['גשם', '🌧️', 1], ['גרב', '🧦', 1],
      ['דגל', '🚩', 2], ['עגבניה', '🍅', 2], ['מגפיים', '👢', 2], ['אגס', '🍐', 2],
      ['דג', '🐟', 3], ['שלג', '❄️', 3], ['מזלג', '🍴', 3]],
    sentences: ['הגמל אוכל גזר', 'גלידה בגשם', 'דג עם דגל'] },
  'ל': { em: '🐸', color: '#00cec9', sub: 'י', game: { type: 'burstMove', actor: '🐸', end: '🪷', bg: SEA, say: 'לָה לָה לָה', note: 'כל "לָה" – הצפרדע קופצת. 8 קפיצות והיא מגיעה לפרח!' },
    tip: 'ל – קצה הלשון עולה ונוגע מאחורי השיניים העליונות. שרים "לה-לה-לה" ביחד, אפשר ללקק סוכריה/דבש מאחורי השיניים כדי להרגיש את המקום.',
    syll: ['לָה', 'לוֹ', 'לִי', 'לוּ', 'לֶה'],
    words: [['לימון', '🍋', 1], ['לחם', '🍞', 1], ['לב', '❤️', 1], ['ליצן', '🤡', 1], ['לוויתן', '🐳', 1],
      ['בלון', '🎈', 2], ['כלב', '🐶', 2], ['מלך', '👑', 2], ['שוקולד', '🍫', 2],
      ['גמל', '🐪', 3], ['דגל', '🚩', 3], ['חתול', '🐱', 3], ['גלגל', '🛞', 3]],
    sentences: ['לכלב יש לב', 'ליצן עם בלון', 'המלך אוכל לחם'] },
  'ש': { em: '🚂', color: '#fd79a8', sub: 'ס', game: { type: 'sustain', actor: '🚂', end: '🏠', bg: SKY, say: 'שששששש', note: 'כל זמן שאומרים שששש – הרכבת נוסעת הביתה!' },
    tip: 'ש – שפתיים קדימה כמו נשיקה, שיניים קרובות, "ששש... התינוק ישן". אם יוצא ס – מבקשים לעגל את השפתיים ולהזיז את הלשון טיפה אחורה.',
    syll: ['שָׁה', 'שׁוֹ', 'שִׁי', 'שׁוּ', 'שֶׁה'],
    words: [['שמש', '☀️', 1], ['שעון', '⌚', 1], ['שוקולד', '🍫', 1], ['שן', '🦷', 1], ['שבלול', '🐌', 1], ['שועל', '🦊', 1], ['שלג', '❄️', 1],
      ['משאית', '🚚', 2], ['כבשה', '🐑', 2], ['מברשת', '🪥', 2],
      ['דבש', '🍯', 3], ['נחש', '🐍', 3], ['חמש', '🖐️', 3]],
    sentences: ['השמש זורחת', 'השועל אוכל דבש', 'נחש ושבלול'] },
  'ס': { em: '🐍', color: '#55a630', sub: 'ת', game: { type: 'sustain', actor: '🐍', end: '🍎', bg: SKY, say: 'סססססס', note: 'כל זמן שאומרים ססס – הנחש זוחל לתפוח!' },
    tip: 'ס – מחייכים, שיניים סגורות, הלשון מאחורי השיניים, והאוויר יוצא כמו נחש: ססס. אם יוצא ת – מאריכים את הצליל ולא "עוצרים" אותו.',
    syll: ['סָה', 'סוֹ', 'סִי', 'סוּ', 'סֶה'],
    words: [['סוס', '🐴', 1], ['סבון', '🧼', 1], ['סוכריה', '🍬', 1], ['ספר', '📚', 1], ['סירה', '⛵', 1], ['סל', '🧺', 1], ['סנאי', '🐿️', 1],
      ['מספריים', '✂️', 2], ['פסנתר', '🎹', 2], ['מכנסיים', '👖', 2],
      ['אוטובוס', '🚌', 3], ['אננס', '🍍', 3], ['קקטוס', '🌵', 3], ['כוס', '🥛', 3]],
    sentences: ['הסוס אוכל סוכריה', 'סבתא בסירה', 'אננס באוטובוס'] },
  'צ': { em: '🐥', color: '#fdcb6e', sub: 'ט', game: { type: 'burstMove', actor: '🐥', end: '🪺', bg: SKY, say: 'צ! צ! צ!', note: 'כל "צ" – האפרוח קופץ. 8 קפיצות והוא מגיע לקן!' },
    tip: 'צ = ת + ס מהר: הלשון "דופקת" מאחורי השיניים ומיד ממשיכה בשריקה. כמו ציוץ של ציפור: צְ-צְ-צְ.',
    syll: ['צָה', 'צוֹ', 'צִי', 'צוּ', 'צֶה'],
    words: [['צב', '🐢', 1], ['צפרדע', '🐸', 1], ['ציפור', '🐦', 1], ['צלחת', '🍽️', 1], ['צדף', '🐚', 1],
      ['ביצה', '🥚', 2], ['חולצה', '👕', 2], ['מצלמה', '📷', 2], ['פיצה', '🍕', 2],
      ['עץ', '🌳', 3], ['מיץ', '🧃', 3]],
    sentences: ['הצב אוכל פיצה', 'ציפור על העץ', 'ביצה בצלחת'] },
  'ז': { em: '🐝', color: '#f9ca24', sub: 'ד', game: { type: 'sustain', actor: '🐝', end: '🌻', bg: SKY, fly: true, say: 'זזזזזז', note: 'כל זמן שאומרים זזז – הדבורה עפה לפרח!' },
    tip: 'ז – כמו ס, אבל עם "מנוע" בגרון. שימו יד על הגרון ותרגישו את הרטט: זזז כמו דבורה.',
    syll: ['זָה', 'זוֹ', 'זִי', 'זוּ', 'זֶה'],
    words: [['זברה', '🦓', 1], ['זאב', '🐺', 1], ['זבוב', '🪰', 1], ['זית', '🫒', 1], ['זיקוקים', '🎆', 1],
      ['מזלג', '🍴', 2], ['מזוודה', '🧳', 2],
      ['ברווז', '🦆', 3], ['אגוז', '🌰', 3], ['ארגז', '📦', 3]],
    sentences: ['הזברה והזאב', 'זבוב על הזית', 'ברווז אוכל אגוז'] },
};
const STICKERS = ['🦁', '🐯', '🐼', '🐨', '🐸', '🦊', '🐵', '🦄', '🐲', '🦖', '🚀', '🚒', '🚜', '🏎️', '⚽', '🎈', '🍭', '🍦', '🌈', '⭐', '🐳', '🦋', '🐞', '🦕', '🐙', '🦒', '🐘', '🦜', '🐬', '🚁', '🛸', '🎠', '🧁', '🍩', '🐧', '🦩'];
const POS = { 1: 'בתחילת המילה', 2: 'באמצע המילה', 3: 'בסוף המילה' };
const CHEERS = ['איזה יופי!', 'אלוף!', 'וואו!', 'כל הכבוד!', 'מדהים!', 'איזה גיבור!'];

const modelKey = text => `model:${text}`;
const kidKey = (p, text) => `kid:${p.id}:${text}`;
const enc = encodeURIComponent;
const soundsFor = p => Object.entries(SOUNDS).filter(([s]) => !p.speech.sounds?.length || p.speech.sounds.includes(s));

// Pre-generated Hebrew audio (tools/make_audio.py → audio/he/manifest.json). Works on every device, offline too.
let warned = false;
// order: parent's own recording → pre-generated file → device Hebrew voice → online voice → visible notice
async function playModel(text) {
  const c = await getClip(modelKey(text));
  if (c) return playBlob(c);
  if (await playHe(text, .75)) return true;
  if (!warned) { warned = true; toast('🔇 אין קול עברי במכשיר – הקליטו את המילים ב"הקלטות הורה", או אמרו אותן בקול', 4000); }
  return null; // parent says it
}
const cheer = () => { const c = pick(CHEERS); playModel(c).catch(() => { }); return c; };

export function speechHome() {
  const p = active();
  app().innerHTML = `${topBar('🗣️ מדברים יפה')}
    <div class="mascot"><span class="mface">🐻</span><div class="bubble">שלום ${esc(p.name)}! באיזה צליל נשחק היום?</div></div>
    <a class="tile" href="#/speech/mine" style="background:linear-gradient(135deg,#ff9f43,#fd79a8);color:#fff;margin-bottom:14px;flex-direction:row;justify-content:center;gap:14px">
      <span class="em">⭐</span><span style="font-size:24px">המילים שלי</span><small style="color:#fff">${myWords(p).length} מילים</small></a>
    <div class="grid">${soundsFor(p).map(([s, d]) => `<a class="tile" href="#/speech/${enc(s)}" style="background:${d.color};color:#fff">
      <span class="em">${d.em}</span><span style="font-size:48px;font-weight:900;line-height:1">${s}</span><small style="color:#fff">⭐ ${p.speech.done[s] || 0}</small></a>`).join('')}</div>
    <div class="grid" style="margin-top:14px">
      <a class="tile" href="#/speech/album"><span class="em">📒</span>האלבום שלי<small>${p.stickers.length} מדבקות</small></a>
      <a class="tile" href="#/speech/rec"><span class="em">🎙️</span>הקלטות הורה<small>הקליטו את הקול שלכם</small></a>
      <a class="tile" href="#/speech/weekly"><span class="em">📅</span>הקלטה שבועית<small>לשמוע את ההתקדמות</small></a></div>
    <div class="parentnote">💡 להורים: 5–10 דקות ביום, בשמחה ובלי לתקן יותר מדי. מחמיאים על כל ניסיון. בחירת הצלילים לכל ילד – באזור ההורים. האפליקציה היא כלי עזר – מומלץ להתייעץ עם קלינאית תקשורת.</div>`;
  app().querySelector('.mface').onclick = e => { e.target.style.animation = 'none'; e.target.offsetHeight; e.target.style.animation = ''; app().querySelector('.bubble').textContent = cheer(); sfx.pop(); };
}

// ---------- personal words: the exact words HE mispronounces (family names etc.) ----------
const photoURLs = {};
const photoKey = (p, id) => `photo:${p.id}:${id}`;
const myWords = p => (p.speech.myWords ||= []);
// letters in the target word that are missing from how he says it → the sounds to work on
export const missing = (word, says) => [...new Set([...word].filter(c => !says.includes(c) && 'אבגדהוזחטיכלמנסעפצקרשתךםןףץ'.includes(c)))];
async function loadPhotos(p) {
  for (const w of myWords(p)) if (w.photo && !photoURLs[w.id]) { const b = await getClip(photoKey(p, w.id)); if (b) photoURLs[w.id] = URL.createObjectURL(b); }
}
const picOf = w => photoURLs[w.id] ? `<img class="ph" src="${photoURLs[w.id]}" alt="">` : (w.em || '⭐');
function mineSound(p) {
  const ws = myWords(p);
  return { em: '⭐', color: '#ff9f43', custom: true, words: ws.map(w => [w.word, picOf(w), 1]), syll: [], sentences: [],
    wrongOf: Object.fromEntries(ws.map(w => [w.word, w.says])), saysOf: Object.fromEntries(ws.map(w => [w.word, w.says])) };
}

function mineHome(d) {
  const p = active(), ws = myWords(p), n = ws.length;
  const g = (k, em, name, min = 1) => n >= min ? `<a class="tile" href="#/speech/mine/${k}"><span class="em">${em}</span>${name}</a>` : '';
  app().innerHTML = `${topBar('⭐ המילים שלי', { back: '#/speech' })}
    <div class="card list">${ws.map(w => `<div class="item"><span class="mypic">${picOf(w)}</span><div class="grow"><b style="font-size:22px">${esc(w.word)}</b>
      <div class="muted">אומר: <s>${esc(w.says)}</s> ${missing(w.word, w.says).map(c => `<span class="pill" style="padding:2px 8px">${c}</span>`).join(' ')}</div></div>
      <span class="muted">⭐ ${p.speech.wordStars?.[w.word] || 0}</span></div>`).join('') || '<p class="muted">עוד אין מילים</p>'}</div>
    <div class="grid">${g('game', '🚂', 'אומרים ומתקדמים')}${g('say', '🎤', 'אני אומר!')}${g('silly', '🤪', 'נכון או מצחיק?')}${g('find', '🖼️', 'מי זה?', 3)}${g('wheel', '🎡', 'גלגל המזל', 2)}${g('bubbles', '🫧', 'בועות')}${g('memory', '🧠', 'זיכרון', 3)}${g('story', '📖', 'סיפור', 4)}
      <a class="tile" href="#/speech/mine/edit"><span class="em">✏️</span>הוספה ועריכה<small>להורים</small></a></div>
    ${n && n < 3 ? '<div class="parentnote">הוסיפו לפחות 3 מילים כדי לפתוח את כל המשחקים</div>' : ''}`;
}

function mineEdit() {
  const p = active(), ws = myWords(p);
  app().innerHTML = `${topBar('✏️ המילים של ' + esc(p.name), { back: '#/speech/mine' })}
    <div class="parentnote">כתבו מילים ש${esc(p.name)} אומר לא נכון – שמות של בני המשפחה, חברים, מאכלים שהוא אוהב. כתבו בדיוק איך הוא אומר, והאפליקציה תתרגל איתו את ההבדל. תמונה אמיתית (של אחות, סבא...) הופכת את זה להרבה יותר כיף!</div>
    <div class="card">
      <label>המילה הנכונה<input class="f" id="w" placeholder="למשל: כדור"></label>
      <label>איך הוא אומר<input class="f" id="s" placeholder="למשל: טדור"></label>
      <div class="row"><label class="grow">אימוג׳י (לא חובה)<input class="f" id="e" placeholder="🦄"></label>
      <label class="btn sec" style="margin-top:8px">📷 תמונה<input type="file" id="ph" accept="image/*" hidden></label><span id="phok"></span></div>
      <button class="btn ok block" id="add">➕ הוספה</button></div>
    <div class="card list">${ws.map((w, i) => `<div class="item"><span class="mypic">${picOf(w)}</span><b class="grow">${esc(w.word)} <span class="muted">(${esc(w.says)})</span></b>
      <label class="btn sm sec">📷<input type="file" accept="image/*" hidden data-ph="${i}"></label><button class="btn sm bad" data-del="${i}">🗑️</button></div>`).join('')}</div>`;
  let photo = null;
  const photoInput = async file => await shrink(file);
  app().querySelector('#ph').onchange = async e => { photo = await photoInput(e.target.files[0]); app().querySelector('#phok').textContent = photo ? '✔' : ''; };
  app().querySelector('#add').onclick = async () => {
    const word = app().querySelector('#w').value.trim(), says = app().querySelector('#s').value.trim();
    if (!word || !says) return toast('צריך את המילה וגם איך הוא אומר');
    const w = { id: Math.random().toString(36).slice(2, 9), word, says, em: app().querySelector('#e').value.trim() || '⭐', photo: !!photo };
    if (photo) { await putClip(photoKey(p, w.id), photo); photoURLs[w.id] = URL.createObjectURL(photo); }
    ws.push(w); save(); toast('נוסף ✔'); mineEdit();
  };
  app().querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const w = ws[+b.dataset.del]; if (confirm(`למחוק את "${w.word}"?`)) { ws.splice(+b.dataset.del, 1); save(); mineEdit(); } });
  app().querySelectorAll('[data-ph]').forEach(inp => inp.onchange = async e => {
    const w = ws[+inp.dataset.ph], blob = await photoInput(e.target.files[0]); if (!blob) return;
    await putClip(photoKey(p, w.id), blob); photoURLs[w.id] = URL.createObjectURL(blob); w.photo = true; save(); mineEdit();
  });
}

// downscale a photo to ~320px JPEG so storage stays small
function shrink(file) {
  if (!file) return Promise.resolve(null);
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 320 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => res(b), 'image/jpeg', .85);
    };
    img.onerror = () => res(null);
    img.src = URL.createObjectURL(file);
  });
}

export async function speechRoute(parts) {
  const [a, b] = parts.map(decodeURIComponent);
  if (a === 'album') return album();
  if (a === 'rec') return parentRecordings(b);
  if (a === 'weekly') return weekly();
  if (a === 'mine') {
    const p = active(); await loadPhotos(p);
    if (b === 'edit') return mineEdit();
    const d = mineSound(p);
    if (!b || (['find', 'memory'].includes(b) && d.words.length < 3) || !d.words.length) return mineHome(d);
    stopMic();
    return ({ game: voiceGame, silly: sillyGame, find: findGame, say: sayHome, bubbles, wheel, memory, story: storyGame })[b]?.('mine', d, parts[2]);
  }
  const d = SOUNDS[a]; if (!d) return speechHome();
  if (!b) return soundHome(a, d);
  stopMic();
  ({ game: voiceGame, silly: sillyGame, find: findGame, say: sayHome, bubbles, wheel, memory, story: storyGame })[b]?.(a, d, parts[2]);
}

function soundHome(s, d) {
  const g = (k, em, name) => `<a class="tile" href="#/speech/${enc(s)}/${k}"><span class="em">${em}</span>${name}</a>`;
  app().innerHTML = `${topBar(`הצליל ${s}`, { back: '#/speech' })}
    <div class="parentnote">👨‍👩‍👦 ${d.tip}</div>
    <div class="grid">
      ${g('game', d.game.actor, 'אומרים ומתקדמים')}${g('bubbles', '🫧', 'בועות')}${g('wheel', '🎡', 'גלגל המזל')}
      ${g('find', '🖼️', 'מצא את התמונה')}${g('silly', '🤪', 'נכון או מצחיק?')}${g('memory', '🧠', 'זיכרון')}
      ${g('say', '🎤', 'אני אומר!')}${g('story', '📖', 'סיפור')}
    </div>`;
}

// ---------- rewards: stars → surprise egg with a sticker ----------
function reward(s, n = 1) {
  const p = active();
  const before = p.speech.done[s] || 0;
  p.speech.done[s] = before + n; p.coins += n * 3;
  p.log.unshift({ d: new Date().toISOString(), topic: 'speech_' + s, score: n * 2, total: n * 2 }); p.log = p.log.slice(0, 200);
  save();
  if (Math.floor(before / 5) !== Math.floor((before + n) / 5) || n >= 3) surpriseEgg();
}

function surpriseEgg() {
  const p = active(), st = pick(STICKERS);
  p.stickers.push(st); save();
  const ov = document.createElement('div'); ov.className = 'overlay';
  ov.innerHTML = `<div class="eggbox"><h2>🎁 הפתעה!</h2><div class="egg" id="egg">🥚</div><p id="eggtxt">לחצו על הביצה!</p></div>`;
  document.body.appendChild(ov); sfx.win();
  let taps = 0;
  const egg = ov.querySelector('#egg');
  egg.onclick = () => {
    taps++; sfx.pop(); egg.classList.remove('wob'); egg.offsetHeight; egg.classList.add('wob');
    if (taps === 2) egg.textContent = '🐣';
    if (taps >= 3) {
      egg.onclick = null; egg.textContent = st; egg.classList.add('reveal');
      ov.querySelector('#eggtxt').innerHTML = `מדבקה חדשה לאלבום! <br><button class="btn ok" style="margin-top:12px">יש! 🎉</button>`;
      confetti(70, [st, '⭐', '🎉', '✨']); sfx.win(); cheer();
      ov.querySelector('button').onclick = () => ov.remove();
    }
  };
}

// ---------- 1. word game: the actor moves ONLY when he says the target word correctly (speech recognition) ----------
const GROUP = { 'כ': 'כק', 'צ': 'צ' };
function focusFor(s, d, word) {
  if (d.custom) return missing(word, d.saysOf[word] || '');
  const g = GROUP[s] || s;
  return [...new Set([...word].filter(c => g.includes(c)))];
}
const MINE_GAME = { type: 'burstMove', actor: '🚂', end: '🏠', bg: 'linear-gradient(#bde0fe,#e0f2ff 70%,#9ad18b 70%)', note: 'על כל מילה שאומרים נכון – הרכבת מתקדמת הביתה!' };

function voiceGame(s, d) {
  const back = `#/speech/${enc(s)}`, G = d.game || MINE_GAME, GOAL = 5;
  const words = shuffle(d.words); let wi = 0, step = 0, tries = 0, busy = false;
  const parentMode = !canRecognize();
  const startPos = {
    sustain: `right:10px;top:52%;transform:scaleX(-1)`, burstMove: `right:10px;top:52%;transform:scaleX(-1)`,
    burstGrow: `left:50%;top:50%;transform:translate(-50%,-50%) scale(.6)`, burstUp: `left:50%;bottom:6px;transform:translateX(-50%)`,
  }[G.type];
  app().innerHTML = `${topBar(`משחק ${s === 'mine' ? '⭐' : s}`, { back })}
    <div class="stage" style="height:170px;background:${G.bg || 'linear-gradient(#1e1b4b,#4c3fa0)'}">
      ${G.type === 'burstUp' ? `<div class="actor" style="left:50%;top:6px;transform:translateX(-50%)">${G.end}</div><div class="actor" style="left:10%;top:20%;font-size:24px">✨</div>` : ''}
      ${G.type === 'sustain' || G.type === 'burstMove' ? `<div class="actor" style="left:12px;top:52%">${G.end}</div>` : ''}
      <div class="actor" id="act" style="${startPos}">${G.actor}</div>
    </div>
    <div class="dots" id="dots">${'<i></i>'.repeat(GOAL)}</div>
    <div class="question" style="min-height:0;padding:14px;margin-bottom:10px"><div id="tpic" style="font-size:80px;line-height:1"></div><div class="big" id="tword"></div></div>
    <div class="row" style="justify-content:center;gap:16px"><button class="btn gold" id="hear" style="font-size:28px">🔊</button><button class="mic" id="mic" style="width:100px;height:100px;font-size:46px;margin:0">🎤</button></div>
    <p class="center" id="status" style="font-size:20px;font-weight:700;min-height:30px">${parentMode ? 'הורה – הקשיבו ולחצו ✅ אם אמר נכון' : 'לחצו על 🎤 ואמרו את המילה'}</p>
    <div class="row" style="justify-content:center"><button class="btn sm sec" id="pok">✅ ${parentMode ? 'אמר נכון' : '(הורה) אמר נכון'}</button><button class="btn sm sec" id="skip">⏭️ מילה אחרת</button></div>
    <div class="parentnote">על כל מילה שאומרים נכון – ${G.actor} מתקדם ל-${G.end}! 5 מילים נכונות = ניצחון. הבדיקה היא לפי זיהוי דיבור – אם המכשיר לא מבין ילד קטן, ההורה יכול לאשר ידנית.</div>`;
  const act = document.getElementById('act'), status = document.getElementById('status');
  const cur = () => words[wi % words.length];
  const show = () => {
    const [w, pic] = cur(); tries = 0;
    document.getElementById('tpic').innerHTML = pic; document.getElementById('tword').textContent = w;
    playModel(w);
  };
  const advance = () => {
    step++; sfx.ok(); document.querySelectorAll('#dots i')[step - 1]?.classList.add('on');
    const f = step / GOAL;
    if (G.type === 'burstGrow') act.style.transform = `translate(-50%,-50%) scale(${.6 + f * 1.6})`;
    if (G.type === 'burstUp') act.style.bottom = `calc(${f * 70}% + 6px)`;
    if (G.type === 'sustain' || G.type === 'burstMove') { act.style.right = `calc(${f * 78}% + 10px)`; if (G.fly) act.style.top = 30 + Math.random() * 30 + '%'; }
    act.classList.remove('hop'); act.offsetHeight; act.classList.add('hop');
    confetti(12, ['⭐', G.actor]);
    status.textContent = '👏 ' + cheer();
    if (step >= GOAL) {
      if (G.type === 'burstGrow') act.textContent = G.end;
      setTimeout(() => {
        confetti(70, ['🎉', '⭐', G.actor, G.end]); sfx.win(); reward(s, 3);
        status.innerHTML = '🏆 ניצחת!';
        app().querySelector('.row').insertAdjacentHTML('afterend', `<button class="btn ok block" id="again" style="margin:10px 0">עוד פעם! 🔁</button>`);
        document.getElementById('again').onclick = () => voiceGame(s, d);
      }, 600);
      return;
    }
    wi++; setTimeout(show, 1300);
  };
  document.getElementById('hear').onclick = () => playModel(cur()[0]);
  document.getElementById('pok').onclick = () => { if (step < GOAL) advance(); };
  document.getElementById('skip').onclick = () => { wi++; show(); };
  const mic = document.getElementById('mic');
  mic.onclick = async () => {
    if (busy || step >= GOAL) return;
    if (parentMode) return toast('במכשיר הזה אין זיהוי דיבור – ההורה מאשר עם ✅');
    busy = true; mic.classList.add('rec'); status.textContent = '👂 מקשיב...';
    try {
      const [w] = cur();
      const alts = await listenOnce('he-IL');
      const r = judge(alts, w, focusFor(s, d, w), d.wrongOf?.[w] || '');
      if (r.ok) advance();
      else {
        tries++; sfx.bad();
        status.innerHTML = !r.heard ? 'לא שמעתי... עוד פעם, חזק יותר 🙂'
          : r.wrongForm ? `שמעתי "${esc(r.heard)}" 😄 בוא נגיד ביחד: <b>${esc(w)}</b>`
          : `שמעתי "${esc(r.heard)}" – כמעט! עוד פעם: <b>${esc(w)}</b>`;
        if (r.heard) setTimeout(() => playModel(w), 900);
      }
    } catch (e) {
      status.textContent = e === 'not-allowed' ? 'צריך לאשר גישה למיקרופון 🎤' : e === 'network' ? 'זיהוי הדיבור צריך אינטרנט – ההורה יכול לאשר עם ✅' : 'משהו לא עבד – ההורה יכול לאשר עם ✅';
    }
    mic.classList.remove('rec'); busy = false;
  };
  show();
}

// ---------- 2. bubbles: pop a bubble → hear the word → say it ----------
function bubbles(s, d) {
  const back = `#/speech/${enc(s)}`, GOAL = 10;
  let popped = 0, timer;
  app().innerHTML = `${topBar('🫧 בועות', { back })}
    <div class="row" style="margin-bottom:8px"><div class="pill">🫧 ${'<b id="pc">0</b>'}/${GOAL}</div><span class="grow"></span></div>
    <div class="pond" id="pond"><div class="showword hidden" id="show"></div></div>
    <div class="parentnote">פוצצו בועה, הקשיבו למילה – ואמרו אותה ביחד! 🗣️</div>`;
  const pond = document.getElementById('pond'), show = document.getElementById('show');
  const spawn = () => {
    if (!document.getElementById('pond')) return clearInterval(timer);
    if (pond.querySelectorAll('.bub').length > 6) return;
    const w = pick(d.words), b = document.createElement('button');
    b.className = 'bub'; b.innerHTML = w[1];
    b.style.left = 5 + Math.random() * 70 + '%'; b.style.animationDuration = 6 + Math.random() * 4 + 's';
    b.onclick = () => {
      sfx.pop(); b.classList.add('popped'); b.onclick = null; setTimeout(() => b.remove(), 300);
      popped++; document.getElementById('pc').textContent = popped;
      show.innerHTML = `<div style="font-size:90px">${w[1]}</div><b>${w[0]}</b>`; show.classList.remove('hidden');
      playModel(w[0]); setTimeout(() => show.classList.add('hidden'), 1800);
      if (popped === GOAL) { clearInterval(timer); setTimeout(() => { confetti(60, ['🫧', '⭐']); cheer(); reward(s, 3); }, 1900); }
    };
    b.addEventListener('animationend', () => b.remove());
    pond.appendChild(b);
  };
  spawn(); timer = setInterval(spawn, 1100);
}

// ---------- 3. wheel: spin → say the picture → parent gives stars ----------
function wheel(s, d) {
  const back = `#/speech/${enc(s)}`;
  const items = shuffle(d.words).slice(0, 6), N = items.length, step = 360 / N;
  const COLORS = ['#ff7675', '#fdcb6e', '#55efc4', '#74b9ff', '#a29bfe', '#fd79a8'];
  const bg = `conic-gradient(from ${-step / 2}deg,${items.map((_, i) => `${COLORS[i]} ${i * step}deg ${(i + 1) * step}deg`).join(',')})`;
  let rot = 0, spins = 0;
  app().innerHTML = `${topBar('🎡 גלגל המזל', { back })}
    <div class="wheelwrap"><div class="pointer">🔻</div><div class="wheel" id="wh" style="background:${bg}">${items.map((w, i) => `<span style="transform:rotate(${i * step}deg) translateY(-105px) rotate(${-i * step}deg)">${w[1]}</span>`).join('')}</div></div>
    <button class="btn gold block" id="spin" style="font-size:24px">🎡 סובבו!</button>
    <div id="res" class="center"></div>`;
  const wh = document.getElementById('wh');
  document.getElementById('spin').onclick = () => {
    const btn = document.getElementById('spin'); btn.disabled = true; document.getElementById('res').innerHTML = '';
    const i = Math.floor(Math.random() * N);
    rot += 360 * 4 + ((360 - i * step) - (rot % 360) + 360) % 360;
    wh.style.transform = `rotate(${rot}deg)`;
    let t = 0; const tick = setInterval(() => { sfx.click(); if (++t > 14) clearInterval(tick); }, 180);
    setTimeout(() => {
      const w = items[i]; sfx.ok();
      document.getElementById('res').innerHTML = `<div class="bigpic" style="font-size:100px">${w[1]}</div><h1 style="font-size:42px;margin:0">${w[0]}</h1>
        <div class="row" style="justify-content:center;margin:10px 0"><button class="btn sec" id="hear">🔊</button></div>
        <div class="card"><b>להורה – איך היה?</b><div class="row" style="justify-content:center;margin-top:8px">${[1, 2, 3].map(n => `<button class="btn sec" data-r="${n}" style="font-size:22px">${'⭐'.repeat(n)}</button>`).join('')}</div></div>`;
      document.getElementById('hear').onclick = () => playModel(w[0]);
      playModel(w[0]);
      document.querySelectorAll('#res [data-r]').forEach(b => b.onclick = () => {
        const r = +b.dataset.r; confetti(r * 10, ['⭐', w[1]]); cheer(); spins++;
        reward(s, r); btn.disabled = false; document.getElementById('res').innerHTML = `<h2>${'⭐'.repeat(r)}</h2>`;
      });
    }, 3200);
  };
}

// ---------- 4. find the picture (listening) ----------
function findGame(s, d) {
  const back = `#/speech/${enc(s)}`;
  let round = 0, good = 0;
  const next = () => {
    if (round >= 6) { reward(s, good >= 5 ? 3 : 1); app().innerHTML = `${topBar('מצא את התמונה', { back })}<div class="card end"><div class="bigpic">🏆</div><h2>${good} / 6</h2><a class="btn block" href="${back}">סיום</a></div>`; return; }
    const opts = shuffle(d.words).slice(0, 3), target = pick(opts);
    app().innerHTML = `${topBar('מצא את התמונה', { back })}
      <div class="center"><button class="btn gold" id="hear" style="font-size:40px;padding:20px 40px">🔊</button></div>
      <div class="parentnote">להורה: אם אין קול – אמרו בקול: <b>${target[0]}</b></div>
      <div class="picks">${opts.map((w, i) => `<button data-i="${i}">${w[1]}</button>`).join('')}</div>`;
    const hear = () => playModel(target[0]);
    app().querySelector('#hear').onclick = hear; hear();
    let first = true;
    app().querySelectorAll('.picks button').forEach(b => b.onclick = () => {
      if (opts[+b.dataset.i] === target) { sfx.ok(); if (first) good++; b.style.background = '#55efc4'; confetti(12, [target[1], '⭐']); round++; setTimeout(next, 1100); }
      else { first = false; sfx.bad(); b.style.animation = 'shake .4s'; setTimeout(() => b.style.animation = '', 400); }
    });
  };
  next();
}

// ---------- 5. correct or silly? (auditory discrimination of his own substitution) ----------
function sillyGame(s, d) {
  const p = active(), back = `#/speech/${enc(s)}`;
  const sub = p.speech.subs[s] || d.sub;
  let round = 0, good = 0;
  const next = () => {
    if (round >= 8) { reward(s, good >= 7 ? 3 : 1); app().innerHTML = `${topBar('נכון או מצחיק?', { back })}<div class="card end"><div class="bigpic">🦻</div><h2>${good} / 8</h2><p>אוזניים של אלוף!</p><a class="btn block" href="${back}">סיום</a></div>`; return; }
    const w = pick(d.words), right = Math.random() < .5;
    const sounds = s === 'כ' ? /[כקך]/g : s === 'צ' ? /[צץ]/g : new RegExp(s, 'g');
    const text = right ? w[0] : (d.wrongOf?.[w[0]] || w[0].replace(sounds, sub));
    app().innerHTML = `${topBar('נכון או מצחיק?', { back })}
      <div class="bigpic">${w[1]}</div>
      <div class="center"><button class="btn gold" id="hear" style="font-size:34px">🔊 הקשיבו</button></div>
      <div class="parentnote">להורה: ${hasVoice('he') ? 'אפשר גם לומר בעצמכם:' : 'אמרו בקול:'} <b>${text}</b></div>
      <div class="picks two"><button id="ok">👍</button><button id="no">🤪</button></div>`;
    const hear = () => playModel(text);
    app().querySelector('#hear').onclick = hear; hear();
    const ans = said => {
      if (said === right) { sfx.ok(); good++; confetti(10, ['⭐', w[1]]); }
      else { sfx.bad(); toast(right ? `זה היה נכון: ${w[0]} 👍` : `זה היה מצחיק! אומרים ${w[0]} 😄`); }
      round++; setTimeout(next, 1300);
    };
    app().querySelector('#ok').onclick = () => ans(true);
    app().querySelector('#no').onclick = () => ans(false);
  };
  next();
}

// ---------- 6. picture memory (toddler size) ----------
function memory(s, d) {
  const back = `#/speech/${enc(s)}`;
  const items = shuffle(d.words).slice(0, 3);
  const cards = shuffle([...items, ...items].map((w, k) => ({ w, k: items.indexOf(w), id: k })));
  let open = [], done = new Set(), lock = false;
  const draw = () => {
    app().innerHTML = `${topBar('🧠 זיכרון', { back })}
      <p class="center muted">מצאו שתי תמונות זהות!</p>
      <div class="mem">${cards.map((c, i) => `<button class="mcard ${open.includes(i) || done.has(c.k) ? 'open' : ''} ${done.has(c.k) ? 'done' : ''}" data-i="${i}"><span class="e" style="font-size:54px">${c.w[1]}</span></button>`).join('')}</div>`;
    app().querySelectorAll('.mcard').forEach(b => b.onclick = () => {
      const i = +b.dataset.i, c = cards[i];
      if (lock || open.includes(i) || done.has(c.k)) return;
      sfx.click(); open.push(i);
      if (open.length === 2) {
        const [x, y] = open.map(j => cards[j]);
        if (x.k === y.k) { done.add(x.k); open = []; sfx.ok(); playModel(x.w[0]); }
        else { lock = true; setTimeout(() => { open = []; lock = false; draw(); }, 1000); }
      }
      draw();
      if (done.size === items.length) setTimeout(() => { confetti(50); cheer(); reward(s, 2); app().insertAdjacentHTML('beforeend', `<button class="btn block ok" style="margin-top:16px" id="again">עוד פעם! 🔁</button>`); document.getElementById('again').onclick = () => memory(s, d); }, 700);
    });
  };
  draw();
}

// ---------- 7. say it! (syllables → words → sentences) with recording & parent rating ----------
function sayHome(s, d, lvl) {
  const back = `#/speech/${enc(s)}`;
  const groups = d.custom ? [['all', 'המילים שלי', d.words]]
    : [['syll', 'הברות', d.syll.map(x => [x, s])], ...[1, 2, 3].map(k => [String(k), POS[k], d.words.filter(w => w[2] === k)]).filter(g => g[2].length), ['sent', 'משפטים', d.sentences.map(x => [x, '💬'])]];
  if (d.custom) lvl = 'all';
  if (!lvl) {
    app().innerHTML = `${topBar(`אני אומר ${s}`, { back })}<div class="parentnote">מתחילים מהברות, ומתקדמים רק כשזה קל. 3 כוכבים מהורה = התקדמות!</div>
      <div class="choices one">${groups.map(g => `<a class="choice center" href="${back}/say/${g[0]}" style="text-decoration:none">${g[1]} <span class="muted">(${g[2].length})</span></a>`).join('')}</div>`;
    return;
  }
  const g = groups.find(x => x[0] === lvl); if (!g) return sayHome(s, d);
  const items = g[2]; let i = 0;
  const p = active();
  const draw = () => {
    const [text, pic] = items[i % items.length];
    const says = d.saysOf?.[text];
    app().innerHTML = `${topBar(g[1], { back: d.custom ? back : `${back}/say` })}
      <div class="bigpic" style="font-size:${pic.length <= 2 && /\p{Extended_Pictographic}/u.test(pic) ? 120 : 90}px">${pic}</div>
      <h1 class="center" style="font-size:44px">${esc(text)}</h1>
      ${says ? `<div class="parentnote">להורה: הוא אומר <s>${esc(says)}</s> – הצליל לתרגול: <b>${missing(text, says).join(', ') || '—'}</b>. אמרו לאט ומודגש, ואפשר לשחק "${esc(says)}? לא! ${esc(text)}!" 😄</div>` : ''}
      <div class="row" style="justify-content:center;margin-bottom:14px"><button class="btn gold" id="model">🔊 איך אומרים</button><button class="btn sec" id="mine" disabled>▶️ אני</button></div>
      <button class="mic" id="rec">🎤</button>
      <p class="center muted" id="hint">לחצו על המיקרופון ואמרו את המילה</p>
      <div class="card center"><b>להורה – איך היה?</b>
        <div class="row" style="justify-content:center;margin-top:8px">${[1, 2, 3].map(n => `<button class="btn sec" data-r="${n}" style="font-size:22px">${'⭐'.repeat(n)}</button>`).join('')}</div></div>`;
    app().querySelector('#model').onclick = async () => { if ((await playModel(text)) === null) toast(`אמרו בקול: ${text}`); };
    const mine = app().querySelector('#mine');
    getClip(kidKey(p, text)).then(c => { if (c) { mine.disabled = false; mine.onclick = () => playBlob(c); } });
    const recBtn = app().querySelector('#rec');
    recBtn.onclick = async () => {
      try {
        const r = await recorder(); r.start(); recBtn.classList.add('rec'); app().querySelector('#hint').textContent = 'מקליט... 🔴';
        setTimeout(async () => {
          const blob = await r.stop(); recBtn.classList.remove('rec'); stopMic();
          await putClip(kidKey(p, text), blob);
          app().querySelector('#hint').textContent = 'הנה איך זה נשמע 👂'; mine.disabled = false; mine.onclick = () => playBlob(blob);
          await playBlob(blob);
        }, lvl === 'sent' ? 3500 : 2500);
      } catch (e) { toast('צריך לאשר גישה למיקרופון 🎤'); }
    };
    app().querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
      const r = +b.dataset.r; sfx.ok(); confetti(r * 8, ['⭐', pic]);
      if (d.custom) { const ws = (p.speech.wordStars ||= {}); ws[text] = (ws[text] || 0) + r; }
      reward(s, r); i++; setTimeout(draw, 700);
    });
    playModel(text);
  };
  draw();
}

// ---------- 8. story: narration pauses at each target word, he says it (checked by recognition / parent) ----------
export const STORY_LINES = { intro: 'יום אחד יצא דוד לטייל.', pages: ['פתאום הוא ראה...', 'ואז הוא מצא...', 'אחר כך הוא פגש...', 'ובסוף הוא חזר הביתה עם...'], outro: 'איזה טיול כיף! הסוף.', ask: 'מה זה?' };
function storyGame(s, d) {
  const back = `#/speech/${enc(s)}`, words = shuffle(d.words).slice(0, 4);
  let page = -1;
  const draw = async () => {
    if (page === -1) {
      app().innerHTML = `${topBar('📖 סיפור', { back })}<div class="bigpic">🚶‍♂️🌳</div><h2 class="center">${STORY_LINES.intro}</h2>
        <button class="btn ok block" id="nx" style="font-size:24px">▶️ מתחילים</button>`;
      playHe(STORY_LINES.intro);
      document.getElementById('nx').onclick = () => { page = 0; draw(); };
      return;
    }
    if (page >= words.length) {
      app().innerHTML = `${topBar('📖 סיפור', { back })}<div class="bigpic">🏠${words.map(w => w[1]).join('')}</div><h2 class="center">${STORY_LINES.outro}</h2>
        <button class="btn ok block" id="nx">📖 עוד סיפור</button>`;
      playHe(STORY_LINES.outro); confetti(50); reward(s, 3);
      document.getElementById('nx').onclick = () => storyGame(s, d);
      return;
    }
    const [w, pic] = words[page];
    app().innerHTML = `${topBar(`📖 עמוד ${page + 1}/${words.length}`, { back })}
      <h2 class="center">${STORY_LINES.pages[page]}</h2>
      <div class="bigpic" id="spic" style="font-size:130px">${pic}</div>
      <h1 class="center hidden" id="sword" style="font-size:44px;margin:0">${esc(w)}</h1>
      <div class="row" style="justify-content:center;gap:16px;margin-top:10px"><button class="btn gold" id="hint">💡 רמז</button>${canRecognize() ? '<button class="mic" id="smic" style="width:96px;height:96px;font-size:44px;margin:0">🎤</button>' : ''}</div>
      <p class="center" id="sst" style="font-size:20px;font-weight:700">${STORY_LINES.ask} ${canRecognize() ? 'לחצו 🎤 ותגידו!' : ''}</p>
      <div class="center"><button class="btn sm sec" id="pok">✅ (הורה) אמר נכון</button></div>`;
    await playHe(STORY_LINES.pages[page]); playHe(STORY_LINES.ask);
    const good = () => { sfx.ok(); document.getElementById('sword').classList.remove('hidden'); const sp = document.getElementById('spic'); sp.classList.add('dance'); confetti(15, ['⭐', pic]); playModel(w); page++; setTimeout(draw, 2200); };
    document.getElementById('pok').onclick = good;
    document.getElementById('hint').onclick = () => { document.getElementById('sword').classList.remove('hidden'); playModel(w); };
    const mic = document.getElementById('smic');
    if (mic) mic.onclick = async () => {
      if (mic.classList.contains('rec')) return;
      mic.classList.add('rec'); const st = document.getElementById('sst'); st.textContent = '👂 מקשיב...';
      try {
        const r = judge(await listenOnce('he-IL'), w, focusFor(s, d, w), d.wrongOf?.[w] || '');
        mic.classList.remove('rec');
        if (r.ok) return good();
        sfx.bad(); st.innerHTML = r.heard ? `שמעתי "${esc(r.heard)}" – בוא ננסה שוב! 💡` : 'לא שמעתי... עוד פעם 🙂';
      } catch (e) { mic.classList.remove('rec'); st.textContent = 'ההורה יכול לאשר עם ✅'; }
    };
  };
  draw();
}

// ---------- 9. weekly progress recording: same words every week → hear the improvement over time ----------
const weekOf = (d = new Date()) => { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); return x.toISOString().slice(0, 10); };
function weekly() {
  const p = active(), wk = weekOf();
  const list = [...myWords(p).map(w => w.word), ...soundsFor(p).map(([, d]) => d.words[0][0])].filter((x, i, a) => a.indexOf(x) === i).slice(0, 6);
  const weeks = (p.speech.weeks ||= []);
  const key = (w, word) => `weekly:${p.id}:${w}:${word}`;
  app().innerHTML = `${topBar('📅 הקלטה שבועית', { back: '#/speech' })}
    <div class="parentnote">פעם בשבוע הקליטו את ${esc(p.name)} אומר את אותן מילים. כך תשמעו את ההתקדמות לאורך זמן – ואפשר להשמיע לקלינאית. השבוע: ${wk.split('-').reverse().join('/')}</div>
    <div class="card list">${list.map((word, i) => `<div class="item" style="flex-wrap:wrap"><b style="font-size:22px;min-width:80px">${esc(word)}</b>
      <button class="btn sm bad" data-rec="${i}">🎤 השבוע</button><span class="grow"></span>
      ${weeks.map(w => `<button class="btn sm sec" data-play="${i}" data-w="${w}">▶️ ${w.slice(8, 10)}/${w.slice(5, 7)}</button>`).join('')}</div>`).join('')}</div>`;
  app().querySelectorAll('[data-rec]').forEach(b => b.onclick = async () => {
    const word = list[+b.dataset.rec];
    try {
      const r = await recorder(); r.start(); b.textContent = '🔴'; b.disabled = true;
      setTimeout(async () => {
        const blob = await r.stop(); stopMic(); await putClip(key(wk, word), blob);
        if (!weeks.includes(wk)) { weeks.push(wk); save(); }
        b.textContent = '✔'; playBlob(blob); setTimeout(weekly, 2600);
      }, 2500);
    } catch (e) { toast('צריך לאשר גישה למיקרופון 🎤'); }
  });
  app().querySelectorAll('[data-play]').forEach(b => b.onclick = async () => { const c = await getClip(key(b.dataset.w, list[+b.dataset.play])); c ? playBlob(c) : toast('אין הקלטה לשבוע הזה'); });
}

function album() {
  const p = active();
  app().innerHTML = `${topBar('📒 האלבום שלי', { back: '#/speech' })}
    <div class="card center"><h2>${p.stickers.length} מדבקות</h2><p class="muted">לחצו על מדבקה 👆</p></div>
    <div class="album">${p.stickers.map(x => `<button class="stk">${x}</button>`).join('') || '<p class="muted">עוד אין מדבקות – בואו נשחק!</p>'}</div>`;
  app().querySelectorAll('.stk').forEach(b => b.onclick = () => { sfx.pop(); b.classList.remove('dance'); b.offsetHeight; b.classList.add('dance'); confetti(6, [b.textContent]); });
}

function parentRecordings(only) {
  const p = active();
  const list = [...(myWords(p).length ? [['mine', mineSound(p)]] : []), ...soundsFor(p)];
  const cur = only && (SOUNDS[only] || only === 'mine') ? only : list[0]?.[0];
  const d = cur === 'mine' ? mineSound(p) : SOUNDS[cur];
  const all = d ? [...d.syll.map(x => [x, cur]), ...d.words.map(w => [w[0], w[1]]), ...d.sentences.map(x => [x, '💬'])] : [];
  app().innerHTML = `${topBar('🎙️ הקלטות הורה', { back: '#/speech' })}
    <div class="parentnote">הקליטו כל מילה בקול שלכם, ברור ולאט. הילד ישמע את הקול שלכם במקום קול ממוחשב. ✔ = יש הקלטה</div>
    <div class="tabs">${list.map(([s]) => `<button class="${s === cur ? 'on' : ''}" data-s="${s}" style="font-size:22px">${s === 'mine' ? '⭐ שלי' : s}</button>`).join('')}</div>
    <div class="card list">${all.map(([t, e], i) => `<div class="item"><span style="font-size:28px">${e}</span><b class="grow">${esc(t)}</b><span id="st${i}"></span>
      <button class="btn sm sec" data-play="${i}">▶️</button><button class="btn sm bad" data-rec="${i}">🎤</button></div>`).join('')}</div>`;
  app().querySelectorAll('.tabs button').forEach(b => b.onclick = () => parentRecordings(b.dataset.s));
  all.forEach(async ([t], i) => { if (await getClip(modelKey(t))) { const el = document.getElementById('st' + i); if (el) el.textContent = '✔'; } });
  app().querySelectorAll('[data-play]').forEach(b => b.onclick = async () => { const t = all[+b.dataset.play][0]; const c = await getClip(modelKey(t)); c ? playBlob(c) : toast('אין עדיין הקלטה'); });
  app().querySelectorAll('[data-rec]').forEach(b => b.onclick = async () => {
    const i = +b.dataset.rec, t = all[i][0];
    try {
      const r = await recorder(); r.start(); b.textContent = '🔴'; b.disabled = true;
      setTimeout(async () => { const blob = await r.stop(); stopMic(); await putClip(modelKey(t), blob); b.textContent = '🎤'; b.disabled = false; document.getElementById('st' + i).textContent = '✔'; playBlob(blob); }, t.includes(' ') ? 3000 : 2000);
    } catch (e) { toast('צריך לאשר גישה למיקרופון 🎤'); }
  });
}

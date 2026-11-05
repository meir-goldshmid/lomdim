// Speech recognition (Web Speech API, Chrome/Android/Edge/Safari) + lenient-but-strict word matching for kids.
const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const canRecognize = () => !!SR;

// Listen once; resolves to an array of alternative transcripts (best first). Rejects with an error code string.
export function listenOnce(lang = 'he-IL', ms = 7000) {
  return new Promise((res, rej) => {
    if (!SR) return rej('unsupported');
    const r = new SR();
    r.lang = lang; r.interimResults = false; r.maxAlternatives = 3; r.continuous = false;
    let done = false;
    const finish = (fn, v) => { if (done) return; done = true; clearTimeout(t); try { r.abort(); } catch (e) { } fn(v); };
    r.onresult = e => finish(res, [...e.results[0]].map(a => a.transcript));
    r.onerror = e => finish(e.error === 'no-speech' ? res : rej, e.error === 'no-speech' ? [] : e.error);
    r.onend = () => finish(res, []);
    const t = setTimeout(() => finish(res, []), ms);
    r.start();
  });
}

const FINAL = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
export const norm = s => String(s).replace(/[֑-ׇ]/g, '').replace(/[ךםןףץ]/g, c => FINAL[c]).replace(/[^א-ת ]/g, '').replace(/\s+/g, ' ').trim();
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

// Decide if the child said the target word.
// focus = letters that MUST be heard (the sound we practise), wrong = the known mispronunciation (e.g. "טדור").
export function judge(alts, target, focus = [], wrong = '') {
  const T = norm(target), W = wrong ? norm(wrong) : null;
  const top = alts.slice(0, 2).map(norm).filter(Boolean);
  if (!top.length) return { ok: false, heard: '' };
  const cands = top.flatMap(a => [a, a.replace(/ /g, ''), ...a.split(' ')]);
  if (W && cands.includes(W)) return { ok: false, heard: alts[0], wrongForm: true };
  if (cands.includes(T)) return { ok: true, heard: alts[0] };
  // tolerate one small slip on longer words, but only if every practised sound was heard in place
  const near = cands.map(c => c.length === T.length + 1 && c[0] === 'ה' ? c.slice(1) : c)   // "הכדור" → "כדור"
    .find(c => (c === T) || (T.length >= 4 && lev(c, T) <= 1 && focus.every(f => c.includes(norm(f)))));
  return near ? { ok: true, heard: alts[0] } : { ok: false, heard: alts[0] };
}

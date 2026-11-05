// Local persistence. All data lives in one JSON blob in localStorage (audio recordings live in IndexedDB, see audio.js).
// Shape is designed so that later it can be synced as-is to a cloud DB (one doc per family / per profile).
const KEY = 'lomdim.v1';

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9);

export function newProfile(p) {
  return {
    id: p.id || uid(), name: p.name, age: p.age || 8, avatar: p.avatar || '🦁', color: p.color || '#6c5ce7',
    subjects: p.subjects || ['math'],              // math | english | gemara | speech
    mathTopics: p.mathTopics || [],                // empty = all topics for the track
    englishPacks: p.englishPacks || [],
    coins: 0, xp: 0, stickers: [], owned: [],
    progress: {},                                  // topicKey -> {level, maxLevel, rounds, correct, wrong, best}
    cards: {},                                     // vocab item key -> leitner box 0..5
    lists: { english: [], gemara: [] },            // custom content lists: {id,name,items:[{q,a}]}
    speech: { subs: {}, done: {}, sounds: [], myWords: [], wordStars: {} },
    daily: { date: today(), rounds: 0 }, goal: 3, streak: 0, lastDay: null,
    log: [],                                       // last 200 rounds {d, topic, score, total}
  };
}

const DEFAULT = () => ({ version: 1, pin: '1234', activeId: null, profiles: [], audio: {} });

// Private family setup: the family is defined in the URL fragment (#setup=...), which browsers never send to the server.
// A link can be crafted by anyone, so every field is validated before it reaches the app.
const clean = (v, max = 40) => String(v ?? '').replace(/[<>&"'`]/g, '').slice(0, max);
const ids = v => (Array.isArray(v) ? v : []).map(String).filter(x => /^\w{1,30}$/.test(x));
function cleanProfile(k) {
  const sp = k.speech || {};
  const p = newProfile({ id: /^\w{1,30}$/.test(k.id) ? k.id : uid(), name: clean(k.name) || '?', age: Math.min(120, Math.max(1, +k.age || 8)), avatar: clean(k.avatar, 8) || '🦁',
    color: /^#[0-9a-f]{6}$/i.test(k.color) ? k.color : '#6c5ce7', subjects: ids(k.subjects).filter(x => ['math', 'english', 'gemara', 'speech'].includes(x)), mathTopics: ids(k.mathTopics), englishPacks: ids(k.englishPacks) });
  for (const [from, to] of Object.entries(sp.subs || {})) p.speech.subs[clean(from, 1)] = clean(to, 1);
  p.speech.sounds = (Array.isArray(sp.sounds) ? sp.sounds : []).map(x => clean(x, 1)).filter(Boolean);
  p.speech.myWords = (Array.isArray(sp.myWords) ? sp.myWords : []).slice(0, 50).map(([word, says, em], i) => ({ id: 'seed' + i, word: clean(word), says: clean(says), em: clean(em, 8) }));
  return p;
}
export function parseSetup(code) {
  const f = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(code.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))));
  const audio = {};
  for (const [t, file] of Object.entries(f.audio || {})) if (/^[0-9a-f]{12}\.mp3$/.test(file)) audio[t] = file;
  return { kids: (f.kids || []).slice(0, 20).map(cleanProfile), audio };
}
// Adds only children who aren't on this device yet, so opening the link again never erases progress.
export function applySetup({ kids, audio }) {
  const have = new Set(state.profiles.map(p => p.id)), added = kids.filter(k => !have.has(k.id));
  state.profiles.push(...added); state.audio = { ...state.audio, ...audio }; save();
  return added;
}

let state = load();

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.profiles) {
      // forward-compat: fill missing fields on old profiles
      s.profiles = s.profiles.map(p => ({ ...newProfile(p), ...p, speech: { ...newProfile(p).speech, ...p.speech }, lists: { english: [], gemara: [], ...p.lists } }));
      return s;
    }
  } catch (e) { /* ignore */ }
  return DEFAULT();
}

export function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn(e); } }
export const getState = () => state;
export const profiles = () => state.profiles;
export const active = () => state.profiles.find(p => p.id === state.activeId) || null;
export function setActive(id) { state.activeId = id; save(); }
export function addProfile(p) { const n = newProfile(p); state.profiles.push(n); save(); return n; }
export function removeProfile(id) { state.profiles = state.profiles.filter(p => p.id !== id); if (state.activeId === id) state.activeId = null; save(); }
export function exportJSON() { return JSON.stringify(state, null, 1); }
export function importJSON(txt) { const s = JSON.parse(txt); if (!s.profiles) throw new Error('bad file'); state = s; save(); }
export function resetAll() { state = DEFAULT(); save(); }

export function topicProgress(p, key) {
  return (p.progress[key] ||= { level: 1, maxLevel: 1, rounds: 0, correct: 0, wrong: 0, best: 0 });
}

// Called at the end of each round. Returns info for the end screen.
export function recordRound(p, key, { correct, total, coins, levelCount }) {
  const tp = topicProgress(p, key);
  tp.rounds++; tp.correct += correct; tp.wrong += total - correct;
  const pct = total ? correct / total : 0;
  let leveledUp = false;
  if (levelCount && pct >= 0.8 && tp.level === tp.maxLevel && tp.maxLevel < levelCount) {
    tp.maxLevel++; tp.level = tp.maxLevel; leveledUp = true; coins += 20;
  }
  tp.best = Math.max(tp.best, Math.round(pct * 100));
  p.coins += coins; p.xp += correct * 10;
  // daily goal + streak
  const d = today();
  if (p.daily.date !== d) p.daily = { date: d, rounds: 0 };
  p.daily.rounds++;
  let goalHit = false;
  if (p.daily.rounds === p.goal) {
    goalHit = true;
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    p.streak = p.lastDay === y ? p.streak + 1 : (p.lastDay === d ? p.streak : 1);
    p.lastDay = d; p.coins += 30;
  }
  p.log.unshift({ d: new Date().toISOString(), topic: key, score: correct, total });
  p.log = p.log.slice(0, 200);
  save();
  return { pct, leveledUp, goalHit, coins };
}

export function dailyRounds(p) { return p.daily.date === today() ? p.daily.rounds : 0; }
export { uid, today };

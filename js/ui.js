// Shared UI helpers: DOM, sound effects, speech synthesis, confetti, random utils.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const app = () => document.getElementById('app');

export const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const nz = (a, b) => { let x; do { x = rnd(a, b); } while (x === 0); return x; };

export function topBar(title, { back = '#/home', right = '' } = {}) {
  return `<div class="top">${back ? `<a class="iconbtn" href="${back}" aria-label="חזרה">➡️</a>` : ''}
    <div class="title">${title}</div>${right}</div>`;
}

export function toast(msg, ms = 2200) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), ms);
}

export function confetti(n = 40, set = ['🎉', '⭐', '🌟', '🎊', '💜', '✨', '🍬']) {
  set = set.filter(x => !String(x).startsWith('<')); if (!set.length) set = ['⭐', '🎉'];   // skip photo HTML
  const fx = document.getElementById('fx');
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span'); s.className = 'conf'; s.textContent = pick(set);
    s.style.left = Math.random() * 100 + 'vw'; s.style.animationDuration = 1.6 + Math.random() * 1.8 + 's';
    s.style.animationDelay = Math.random() * .6 + 's'; s.style.fontSize = 18 + Math.random() * 26 + 'px';
    fx.appendChild(s); setTimeout(() => s.remove(), 4200);
  }
}

export function floatCoin(el, text = '+5 🪙') {
  const r = el?.getBoundingClientRect?.() || { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
  const s = document.createElement('div'); s.className = 'floatcoin'; s.textContent = text;
  s.style.left = r.left + r.width / 2 - 30 + 'px'; s.style.top = r.top + 'px';
  document.body.appendChild(s); setTimeout(() => s.remove(), 1000);
}

// ---- sound effects (WebAudio, no files) ----
let ctx;
const ac = () => { ctx ||= new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; };
function tone(freq, start, dur, type = 'sine', vol = .18) {
  const c = ac(), o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq; o.connect(g); g.connect(c.destination);
  const t = c.currentTime + start;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.start(t); o.stop(t + dur);
}
export const sfx = {
  ok() { try { tone(660, 0, .12); tone(880, .1, .2); } catch (e) { } },
  bad() { try { tone(220, 0, .25, 'square', .08); } catch (e) { } },
  click() { try { tone(500, 0, .05, 'triangle', .1); } catch (e) { } },
  win() { try { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * .13, .3, 'triangle')); } catch (e) { } },
  pop() { try { tone(900, 0, .08, 'sine', .25); tone(300, .05, .15, 'sine', .2); } catch (e) { } },
};

// ---- text to speech ----
let voices = [];
const loadVoices = () => { voices = speechSynthesis?.getVoices?.() || []; };
if (typeof window !== 'undefined' && 'speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
export function hasVoice(lang) { return voices.some(v => v.lang.toLowerCase().startsWith(lang)); }
export function speak(text, lang = 'en', rate = .85) {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  return new Promise(res => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = voices.find(v => v.lang.toLowerCase().startsWith(lang) && /google|natural|online/i.test(v.name))
      || voices.find(v => v.lang.toLowerCase().startsWith(lang));
    if (v) u.voice = v;
    u.lang = lang === 'en' ? 'en-US' : lang === 'he' ? 'he-IL' : lang;
    u.rate = rate; u.onend = res; u.onerror = res;
    speechSynthesis.speak(u);
    setTimeout(res, 6000);
  });
}

// Normalise math answers: supports "3/4", "1 1/2", "-2.5", "2,5"
export function parseNum(s) {
  s = String(s).trim().replace(',', '.').replace(/\s+/g, ' ').replace('−', '-');
  if (!s) return NaN;
  let m = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/);
  if (m) return (m[1] ? -1 : 1) * (+m[2] + +m[3] / +m[4]);
  m = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (m) return +m[1] / +m[2];
  return s.match(/^-?\d*\.?\d+$/) ? +s : NaN;
}

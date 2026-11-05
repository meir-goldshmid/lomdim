// Play any Hebrew/Aramaic text: pre-generated file → device Hebrew voice → online voice (Google Translate TTS) → null.
import { speak, hasVoice } from './ui.js';
import { getState } from './store.js';

let manifest;
const loadManifest = () => (manifest ||= fetch('audio/he/manifest.json').then(r => r.ok ? r.json() : {}).catch(() => ({})));
let current;
function playUrl(url) {
  return new Promise(res => {
    current?.pause();
    const a = new Audio(url); current = a;
    a.onended = () => res(true); a.onerror = () => res(false);
    a.play().catch(() => res(false));
  });
}
export function stopHe() { current?.pause(); speechSynthesis?.cancel?.(); }

export async function playHe(text, rate = .8) {
  const m = await loadManifest();
  const file = m[text] || getState().audio?.[text];
  if (file && await playUrl('audio/he/' + file)) return true;
  if (hasVoice('he')) { await speak(text, 'he', rate); return true; }
  if (navigator.onLine !== false) {
    // unofficial endpoint, ~200 chars per request → split long lines on spaces
    const parts = text.match(/.{1,180}(\s|$)/g) || [text];
    let ok = true;
    for (const part of parts) ok = (await playUrl(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=iw&q=${encodeURIComponent(part.trim())}`)) && ok;
    if (ok) return true;
  }
  return null;
}

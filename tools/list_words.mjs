// Prints (JSON) every Hebrew text the speech module may play: words, wrong forms, syllables, sentences, cheers, seeded names.
import { SOUNDS, STORY_LINES } from '../js/modules/speech.js';
import { newProfile } from '../js/store.js';

const out = new Set(['איזה יופי!', 'אלוף!', 'וואו!', 'כל הכבוד!', 'מדהים!', 'איזה גיבור!']);
const subsAll = { 'ח': ['ט', 'כ'], 'כ': ['ט'], 'ג': ['ד'], 'ר': ['א', 'ל', 'י'], 'ב': ['ד', 'פ'], 'ש': ['ס'], 'ס': ['ת', 'ש'], 'ל': ['י'], 'צ': ['ט', 'ת'], 'ז': ['ד'] };
for (const [s, d] of Object.entries(SOUNDS)) {
  d.syll.forEach(x => out.add(x));
  d.sentences.forEach(x => out.add(x));
  const re = s === 'כ' ? /[כקך]/g : s === 'צ' ? /[צץ]/g : new RegExp(s, 'g');
  for (const [w] of d.words) {
    out.add(w);
    for (const sub of new Set([d.sub, ...(subsAll[s] || [])])) out.add(w.replace(re, sub));   // "silly" forms
  }
}
void newProfile;
[STORY_LINES.intro, STORY_LINES.outro, STORY_LINES.ask, ...STORY_LINES.pages].forEach(x => out.add(x));
console.log(JSON.stringify([...out]));

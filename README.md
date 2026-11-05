# לומדים בכיף 🎓

Family learning PWA (Hebrew, RTL, mobile-first). Plain HTML/JS — no build step.

## Run locally
```
cd lomdim
python -m http.server 8765
```
Open http://localhost:8765 (the microphone works on localhost or https only).

## Hosting
Published with GitHub Pages from the `main` branch of a **public** repo, so nothing personal may be committed.

- The app starts with no children. Add them in Parent area → Kids, or open a family setup link once on each device.
- A setup link is `<site>/#setup=<code>`, where the code is base64url JSON (`kids`, `audio`). The part after `#` is never sent to the server.
- Keep family details in `private/` (git-ignored). Never put them in code, comments or `audio/he/manifest.json`.
- Clips for family-only words are listed in the setup link's `audio` map instead of the public manifest.

On the phone: open the link → "Add to Home Screen". Once installed over https, the built-in audio is cached for offline use.

## Structure
| File | What |
|---|---|
| `js/app.js` | router, profile picker, home, shop |
| `js/store.js` | profiles & progress (localStorage, one JSON blob – ready to sync to a cloud DB later) |
| `js/quiz.js` | shared round engine: coins, combo, stars, level unlock, 60s challenge |
| `js/modules/math.js` | 12 topics with generated questions + worked explanations |
| `js/modules/vocab.js` | English + Gemara: flashcards, quizzes, listening, spelling, memory, sugya ordering (Leitner spaced repetition) |
| `js/modules/speech.js` | speech sounds ב / ר / ח: voice-powered games, listening, say-it practice with recording |
| `js/modules/parent.js` | parent area (PIN 1234): progress, custom word lists, kid settings, backup |
| `js/content/*.js` | built-in content – easy to extend |

## Adding content
In the app: Parent area → Content lists → paste lines in `word - translation` format (English or Gemara).
In code: add items to `js/content/english.js` / `gemara.js`, or a new topic to `TOPICS` in `math.js`.

## Next ideas
- Cloud sync (Firebase / Supabase) so progress is shared across devices
- More speech sounds (ש, ס, כ, ל) and word lists
- Gemara: per-masechta packs; English: reading passages

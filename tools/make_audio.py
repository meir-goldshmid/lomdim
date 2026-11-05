"""Generate natural Hebrew audio for every word in the speech module (run once, re-run after adding words).

    python -m pip install edge-tts
    python tools/make_audio.py

Writes audio/he/*.mp3 + audio/he/manifest.json (text -> file). Only new texts are generated.
Uses Microsoft Edge's free online neural voices (needs internet while generating; the app then plays files offline).
"""
import asyncio, json, os, subprocess, sys, hashlib

import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'audio', 'he')
VOICE = os.environ.get('VOICE', 'he-IL-HilaNeural')   # alternative: he-IL-AvriNeural
RATE = '-15%'


def texts():
    r = subprocess.run(['node', os.path.join(ROOT, 'tools', 'list_words.mjs')], capture_output=True, text=True, encoding='utf-8', cwd=ROOT)
    if r.returncode:
        sys.exit(r.stderr)
    return json.loads(r.stdout.strip().splitlines()[-1])


async def main():
    os.makedirs(OUT, exist_ok=True)
    mpath = os.path.join(OUT, 'manifest.json')
    manifest = json.load(open(mpath, encoding='utf-8')) if os.path.exists(mpath) else {}
    todo = [t for t in texts() if t not in manifest or not os.path.exists(os.path.join(OUT, manifest[t]))]
    print(f'{len(todo)} new texts to generate with {VOICE}')
    for i, t in enumerate(todo, 1):
        name = hashlib.md5(t.encode('utf-8')).hexdigest()[:12] + '.mp3'
        for attempt in range(3):
            try:
                await edge_tts.Communicate(t, VOICE, rate=RATE).save(os.path.join(OUT, name))
                manifest[t] = name
                break
            except Exception as e:  # network hiccup – retry
                print('  retry', t, e)
                await asyncio.sleep(2)
        if i % 20 == 0:
            print(f'  {i}/{len(todo)}')
            json.dump(manifest, open(mpath, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    json.dump(manifest, open(mpath, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print('done:', len(manifest), 'files in', OUT)


asyncio.run(main())

// Microphone helpers: record clips (stored in IndexedDB) and live loudness meter for voice-powered games.
const DB = 'lomdim-audio', STORE = 'clips';
function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
export async function putClip(key, blob) { const d = await db(); return new Promise(r => { const t = d.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(blob, key); t.oncomplete = r; }); }
export async function getClip(key) { const d = await db(); return new Promise(r => { const q = d.transaction(STORE).objectStore(STORE).get(key); q.onsuccess = () => r(q.result || null); q.onerror = () => r(null); }); }
export async function delClip(key) { const d = await db(); return new Promise(r => { const t = d.transaction(STORE, 'readwrite'); t.objectStore(STORE).delete(key); t.oncomplete = r; }); }

let current;
export function playBlob(blob) {
  return new Promise(res => {
    current?.pause();
    const a = new Audio(URL.createObjectURL(blob)); current = a;
    a.onended = res; a.onerror = res; a.play().catch(res);
  });
}

let stream;
async function mic() {
  if (stream && stream.active) return stream;
  stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false } });
  return stream;
}
export function stopMic() { stream?.getTracks().forEach(t => t.stop()); stream = null; }

// Returns a recorder handle: await start(); const blob = await stop();
export async function recorder() {
  const s = await mic();
  const type = ['audio/webm', 'audio/mp4', 'audio/ogg'].find(t => window.MediaRecorder?.isTypeSupported?.(t)) || '';
  const mr = new MediaRecorder(s, type ? { mimeType: type } : {});
  const chunks = [];
  mr.ondataavailable = e => e.data.size && chunks.push(e.data);
  return {
    start() { mr.start(); },
    stop() { return new Promise(r => { mr.onstop = () => r(new Blob(chunks, { type: mr.mimeType })); mr.stop(); }); },
  };
}

// Live loudness 0..1, calls cb(level) ~30 times/sec. Returns stop function.
export async function loudness(cb) {
  const s = await mic();
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const src = ctx.createMediaStreamSource(s), an = ctx.createAnalyser();
  an.fftSize = 1024; src.connect(an);
  const buf = new Float32Array(an.fftSize);
  let on = true;
  const loop = () => {
    if (!on) return;
    an.getFloatTimeDomainData(buf);
    let sum = 0; for (const v of buf) sum += v * v;
    cb(Math.min(1, Math.sqrt(sum / buf.length) * 6));
    requestAnimationFrame(loop);
  };
  loop();
  return () => { on = false; ctx.close(); };
}

// --- Web Audio API Synth Alert Sounds ---
let audioCtx = null;

export function initAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (err) {
    console.warn('Web Audio API not supported or blocked:', err);
  }
}

function playTone(freq, startTime, duration, type = 'sine', maxVolume = 0.15) {
  if (!audioCtx) return;
  
  const oscNode = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscNode.type = type;
  oscNode.frequency.setValueAtTime(freq, startTime);
  
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(maxVolume, startTime + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  oscNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscNode.start(startTime);
  oscNode.stop(startTime + duration);
}

export function playLowerBoundChime() {
  initAudio();
  if (!audioCtx) return;
  
  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const noteDuration = 0.18;
  const noteGap = 0.12;
  
  notes.forEach((freq, idx) => {
    playTone(freq, now + idx * noteGap, noteDuration, 'sine', 0.15);
  });
}

export function playUpperBoundChime() {
  initAudio();
  if (!audioCtx) return;
  
  const now = audioCtx.currentTime;
  const pattern = [
    { freq: 659.25, time: now },
    { freq: 523.25, time: now + 0.12 },
    { freq: 659.25, time: now + 0.45 },
    { freq: 523.25, time: now + 0.57 }
  ];
  
  pattern.forEach(p => {
    playTone(p.freq, p.time, 0.15, 'triangle', 0.12);
  });
}

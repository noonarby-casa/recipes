// --- Web Audio API Synth Alert Sounds ---
let audioCtx: AudioContext | null = null;

export function initAudio(): void {
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (err) {
    console.warn('Web Audio API not supported or blocked:', err);
  }
}

function playTone(
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  maxVolume: number = 0.15
): void {
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

export function playLowerBoundChime(): void {
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

export function playUpperBoundChime(): void {
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

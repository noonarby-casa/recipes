// --- Web Audio API Synth Alert Sounds ---
let audioCtx: AudioContext | null = null;

export function initAudio(): void {
  try {
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  } catch (err) {
    console.warn("Web Audio API not supported or blocked:", err);
  }
}

function playTone(
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = "sine",
  maxVolume: number = 0.15,
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
  const notes = [783.99, 987.77, 1174.66]; // G5, B5, D6 (bright ascending major triad)
  const noteDuration = 0.25;
  const noteGap = 0.15;

  // Play ascending chime twice with a delay in between
  for (let repeat = 0; repeat < 2; repeat++) {
    const startOffset = repeat * 0.8;
    notes.forEach((freq, idx) => {
      playTone(
        freq,
        now + startOffset + idx * noteGap,
        noteDuration,
        "sine",
        0.6,
      );
    });
  }
}

export function playUpperBoundChime(): void {
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  const pattern = [
    { freq: 523.25, timeOffset: 0.0, duration: 0.14 }, // C5 (swing long)
    { freq: 587.33, timeOffset: 0.12, duration: 0.1 }, // D5 (swing short)
    { freq: 622.25, timeOffset: 0.2, duration: 0.14 }, // D#5 (swing long)
    { freq: 659.25, timeOffset: 0.32, duration: 0.1 }, // E5 (swing short)
    { freq: 783.99, timeOffset: 0.4, duration: 0.14 }, // G5 (swing long)
    { freq: 880.0, timeOffset: 0.52, duration: 0.1 }, // A5 (swing short)
    { freq: 783.99, timeOffset: 0.6, duration: 0.18 }, // G5 (swing long)
    { freq: 659.25, timeOffset: 0.78, duration: 0.3 }, // E5 (sustained swing resolution)
  ];

  // Play pattern 4 times, getting progressively louder each repeat (total duration ~5.0 seconds)
  for (let repeat = 0; repeat < 4; repeat++) {
    const startOffset = repeat * 1.25;
    const volume = 0.3 + repeat * 0.2;
    pattern.forEach((p) => {
      playTone(
        p.freq,
        now + startOffset + p.timeOffset,
        p.duration,
        "triangle",
        volume,
      );
    });
  }
}

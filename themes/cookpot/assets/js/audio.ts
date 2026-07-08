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
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (err) {
    console.warn('Web Audio API not supported or blocked:', err);
  }
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function playTone(
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  maxVolume: number = 0.15,
): void {
  if (!audioCtx) {
    return;
  }

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
  if (!audioCtx) {
    return;
  }

  const now = audioCtx.currentTime;
  const notes = [6271.93, 7902.13, 9397.27]; // G8, B8, D9 (bright ascending major triad in Octave 8/9)
  const noteDuration = 0.8; // longer decay for bell tones to ring out
  const noteGap = 0.15;
  const volume = 0.5;

  // Play ascending chime twice with a delay in between
  for (let repeat = 0; repeat < 2; repeat++) {
    const startOffset = repeat * 0.8;
    notes.forEach((freq, idx) => {
      playBellTone(
        freq,
        now + startOffset + idx * noteGap,
        noteDuration,
        volume,
      );
    });
  }
}

function playBellTone(
  freq: number,
  startTime: number,
  duration: number,
  maxVolume: number = 0.5,
): void {
  const ctx = audioCtx;
  if (!ctx) {
    return;
  }

  // Jean-Claude Risset's 11-partial bell model
  const partials = [
    { ratio: 0.56, amp: 1.0, durRatio: 1.0 },
    { ratio: 0.561, amp: 0.67, durRatio: 0.9 },
    { ratio: 0.92, amp: 1.0, durRatio: 0.65 },
    { ratio: 0.922, amp: 1.8, durRatio: 0.55 },
    { ratio: 1.19, amp: 2.67, durRatio: 0.35 },
    { ratio: 1.7, amp: 1.67, durRatio: 0.25 },
    { ratio: 2.0, amp: 1.46, durRatio: 0.15 },
    { ratio: 2.74, amp: 1.33, durRatio: 0.15 },
    { ratio: 3.0, amp: 1.33, durRatio: 0.1 },
    { ratio: 3.76, amp: 1.0, durRatio: 0.075 },
    { ratio: 4.07, amp: 1.33, durRatio: 0.05 },
  ];

  const normFactor = 15.26; // sum of all partial amplitudes

  partials.forEach((p) => {
    const oscNode = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscNode.type = 'sine';
    oscNode.frequency.setValueAtTime(freq * p.ratio, startTime);

    const partialVolume = maxVolume * (p.amp / normFactor);
    const partialDuration = duration * p.durRatio;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(partialVolume, startTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + partialDuration,
    );

    oscNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscNode.start(startTime);
    oscNode.stop(startTime + partialDuration);
  });
}

export function playUpperBoundChime(): void {
  initAudio();
  if (!audioCtx) {
    return;
  }

  const now = audioCtx.currentTime;

  const RE = 4698.63;
  const MI = 5274.04;
  const SOL = 6271.93;
  const LA = 7040.0;
  const SI = 7902.13;

  const bars = [
    [RE, MI, SOL, LA, SI, LA, SI],
    [RE, MI, SOL, LA, SI, SOL, LA],
    [RE, MI, SOL, LA, SI, LA, SI],
    [RE, MI, SOL, LA, SI, SOL, RE],
  ];

  const noteInterval = 0.25; // time between notes in a bar (slower, more emphasis)
  const barInterval = 2.0; // time between start of bars (8.0s total start span)
  const noteDuration = 2.0; // longer decay duration for ringing tones
  const volume = 0.45; // comfortable volume for high-pitched bell chimes

  bars.forEach((bar, barIdx) => {
    const barStart = now + barIdx * barInterval;
    bar.forEach((freq, noteIdx) => {
      playBellTone(
        freq,
        barStart + noteIdx * noteInterval,
        noteDuration,
        volume,
      );
    });
  });
}

// Audio effects using Web Audio API - no external file dependencies, guaranteed to play cleanly.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Short and fitting reminder chime for high priority orders
 * Two-tone pleasant notification chime (D5 -> A5) with warm envelope
 */
export function playReminderSound(volume: number = 0.5): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(ctx.destination);

    // Note 1 (D5: 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.6, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2 (A5: 880.00 Hz) slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880.00, now + 0.12);
    gain2.gain.setValueAtTime(0.001, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.7, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);

    // Subtle gentle bell overtone
    const oscHarmonic = ctx.createOscillator();
    const gainHarmonic = ctx.createGain();
    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(1760.00, now + 0.12);
    gainHarmonic.gain.setValueAtTime(0.001, now + 0.12);
    gainHarmonic.gain.exponentialRampToValueAtTime(0.2, now + 0.15);
    gainHarmonic.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    oscHarmonic.connect(gainHarmonic);
    gainHarmonic.connect(masterGain);
    oscHarmonic.start(now + 0.12);
    oscHarmonic.stop(now + 0.5);
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
}

/**
 * Short, uplifting and encouraging completion chime
 * Quick cheerful arpeggio (C5 -> E5 -> G5 -> C6) with warm sparkling finish
 */
export function playSuccessSound(volume: number = 0.5): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(ctx.destination);

    // Tones: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.22, vol: 0.45 },
      { freq: 659.25, time: 0.09, dur: 0.22, vol: 0.50 },
      { freq: 783.99, time: 0.18, dur: 0.26, vol: 0.55 },
      { freq: 1046.50, time: 0.27, dur: 0.60, vol: 0.70 },
      { freq: 1318.51, time: 0.36, dur: 0.55, vol: 0.35 }, // E6 sparkle harmonic
    ];

    notes.forEach(({ freq, time, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);
      
      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.exponentialRampToValueAtTime(vol, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start(now + time);
      osc.stop(now + time + dur);
    });
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
}

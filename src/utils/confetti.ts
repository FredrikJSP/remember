import confetti from 'canvas-confetti';

export function fireCompletionConfetti() {
  // Center burst
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
    disableForReducedMotion: true,
  });

  // Side cannons for extra cheerfulness
  setTimeout(() => {
    confetti({
      particleCount: 30,
      angle: 60,
      spread: 55,
      origin: { x: 0.15, y: 0.75 },
      colors: ['#34d399', '#60a5fa', '#f43f5e'],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 30,
      angle: 120,
      spread: 55,
      origin: { x: 0.85, y: 0.75 },
      colors: ['#fbbf24', '#a855f7', '#10b981'],
      disableForReducedMotion: true,
    });
  }, 120);
}

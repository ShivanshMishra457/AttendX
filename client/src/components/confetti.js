// Tiny canvas confetti, no library needed
export function confetti() {
  const cv = document.createElement('canvas');
  Object.assign(cv.style, { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 });
  cv.width = innerWidth; cv.height = innerHeight;
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const colors = ['#ff5d8f', '#ffd23f', '#4d8dff', '#2ee6a6', '#9b5cff'];
  const bits = Array.from({ length: 150 }, () => ({
    x: innerWidth / 2, y: innerHeight * 0.6, vx: (Math.random() - 0.5) * 18, vy: Math.random() * -16 - 4,
    s: Math.random() * 8 + 5, c: colors[(Math.random() * 5) | 0], r: Math.random() * 6,
  }));
  let f = 0;
  (function tick() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    bits.forEach((b) => {
      b.x += b.vx; b.y += b.vy; b.vy += 0.45; b.r += 0.2;
      ctx.fillStyle = b.c; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r);
      ctx.fillRect(-b.s / 2, -b.s / 2, b.s, b.s * 0.6); ctx.restore();
    });
    if (++f < 110) requestAnimationFrame(tick); else cv.remove();
  })();
}

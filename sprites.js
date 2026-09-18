(function () {
  function drawBackground(ctx, width, height, time) {
    ctx.save();

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#34205f');
    sky.addColorStop(0.48, '#d65b4a');
    sky.addColorStop(1, '#f0a14b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const drift = (time || 0) * 3;
    ctx.fillStyle = 'rgba(255, 238, 170, 0.9)';
    ctx.beginPath();
    ctx.arc(width * 0.25, height * 0.25, Math.max(24, width * 0.075), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 196, 101, 0.82)';
    ctx.beginPath();
    ctx.arc(width * 0.72, height * 0.2, Math.max(17, width * 0.052), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(56, 35, 66, 0.62)';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.6);
    ctx.quadraticCurveTo(width * 0.2, height * 0.49, width * 0.4, height * 0.61);
    ctx.quadraticCurveTo(width * 0.63, height * 0.46, width, height * 0.58);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(104, 52, 54, 0.66)';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.72);
    ctx.quadraticCurveTo(width * 0.27, height * 0.61, width * 0.52, height * 0.73);
    ctx.quadraticCurveTo(width * 0.78, height * 0.62, width, height * 0.7);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 203, 113, 0.42)';
    ctx.lineWidth = 2;
    for (let i = -1; i < 7; i += 1) {
      const x = i * 92 - (drift % 92);
      ctx.beginPath();
      ctx.moveTo(x, height * 0.77);
      ctx.lineTo(x + 38, height * 0.74);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGround(ctx, width, height, groundHeight, offset) {
    ctx.save();
    const top = height - groundHeight;
    ctx.fillStyle = '#9a4f32';
    ctx.fillRect(0, top, width, groundHeight);
    ctx.fillStyle = '#5c2f2e';
    ctx.fillRect(0, top, width, 7);

    const slide = ((offset || 0) % 48 + 48) % 48;
    ctx.strokeStyle = '#d98243';
    ctx.lineWidth = 3;
    for (let x = -48 - slide; x < width + 48; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, top + 17);
      ctx.lineTo(x + 24, top + 34);
      ctx.lineTo(x + 5, top + 53);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBird(ctx, x, y, size, velocity) {
    ctx.save();
    const tilt = Math.max(-0.34, Math.min(0.45, (velocity || 0) / 950));
    ctx.translate(x, y);
    ctx.rotate(tilt);
    const half = size / 2;
    const nose = size * 0.5;
    ctx.fillStyle = '#1b1725';
    ctx.beginPath();
    ctx.moveTo(-half * 0.95, size * 0.04);
    ctx.lineTo(-half * 0.2, -half * 0.18);
    ctx.lineTo(half * 0.22, -half * 0.2);
    ctx.lineTo(nose, 0);
    ctx.lineTo(half * 0.2, half * 0.2);
    ctx.lineTo(-half * 0.42, half * 0.22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ef6e3f';
    ctx.beginPath();
    ctx.moveTo(-half * 0.82, 0);
    ctx.lineTo(-half * 0.1, -half * 0.28);
    ctx.lineTo(half * 0.36, -half * 0.18);
    ctx.lineTo(half * 0.8, 0);
    ctx.lineTo(half * 0.28, half * 0.16);
    ctx.lineTo(-half * 0.5, half * 0.15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f4c86e';
    ctx.beginPath();
    ctx.moveTo(-half * 0.12, -half * 0.1);
    ctx.lineTo(half * 0.2, -half * 0.08);
    ctx.lineTo(half * 0.39, 0);
    ctx.lineTo(half * 0.17, half * 0.07);
    ctx.lineTo(-half * 0.12, half * 0.04);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#11101b';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-half * 0.95, size * 0.04);
    ctx.lineTo(-half * 0.2, -half * 0.18);
    ctx.lineTo(half * 0.22, -half * 0.2);
    ctx.lineTo(nose, 0);
    ctx.lineTo(half * 0.2, half * 0.2);
    ctx.lineTo(-half * 0.42, half * 0.22);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = '#ffdc75';
    ctx.beginPath();
    ctx.moveTo(-half * 0.92, -half * 0.06);
    ctx.lineTo(-half * 0.98, half * 0.03);
    ctx.lineTo(-half * 0.76, half * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPipe(ctx, x, gapTop, gapBottom, pipeWidth, height) {
    ctx.save();
    const outline = '#171329';
    const body = '#3ec5c8';
    const glow = '#a8f4db';
    const capHeight = Math.min(14, pipeWidth * 0.24);
    const inset = 2;

    function gate(y, h, capAtBottom) {
      if (h <= 0) return;
      ctx.fillStyle = body;
      ctx.fillRect(x, y, pipeWidth, h);
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, Math.max(0, pipeWidth - 3), Math.max(0, h - 3));
      ctx.fillStyle = glow;
      ctx.fillRect(x + inset, y + inset, Math.max(2, pipeWidth * 0.16), Math.max(0, h - inset * 2));
      const capY = capAtBottom ? y + h - capHeight : y;
      ctx.fillStyle = '#68e5db';
      ctx.fillRect(x, capY, pipeWidth, capHeight);
      ctx.strokeStyle = outline;
      ctx.strokeRect(x + 1.5, capY + 1.5, Math.max(0, pipeWidth - 3), Math.max(0, capHeight - 3));
    }

    gate(0, gapTop, true);
    gate(gapBottom, height - gapBottom, false);
    ctx.restore();
  }

  window.SPRITES = { drawBackground, drawGround, drawBird, drawPipe };
})();

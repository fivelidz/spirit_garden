import Phaser from 'phaser';

export function drawStar(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  points: number,
  innerRadius: number,
  outerRadius: number
): void {
  const step = Math.PI / points;

  graphics.beginPath();

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;

    if (i === 0) {
      graphics.moveTo(px, py);
    } else {
      graphics.lineTo(px, py);
    }
  }

  graphics.closePath();
  graphics.fillPath();
}

export function drawDiamond(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  graphics.beginPath();
  graphics.moveTo(x, y - height / 2);
  graphics.lineTo(x + width / 2, y);
  graphics.lineTo(x, y + height / 2);
  graphics.lineTo(x - width / 2, y);
  graphics.closePath();
  graphics.fillPath();
}

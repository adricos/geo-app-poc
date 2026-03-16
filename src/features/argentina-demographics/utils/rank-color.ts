/**
 * Color scale by rank (t in [0,1]): blue → cyan → yellow → orange → red.
 * Returns RGBA in 0–255 for reuse in deck.gl and Cesium.
 */
export function rankToRgba(t: number): [number, number, number, number] {
  const alpha = 200;
  if (t <= 0) return [100, 150, 220, alpha];
  if (t >= 1) return [220, 50, 50, alpha];
  if (t < 0.25) {
    const s = t / 0.25;
    return [
      Math.round(100 + s * 80),
      Math.round(150 + s * 80),
      Math.round(220 - s * 120),
      alpha,
    ];
  }
  if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    return [
      Math.round(180 + s * 75),
      Math.round(230 - s * 30),
      Math.round(100 - s * 100),
      alpha,
    ];
  }
  if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    return [
      Math.round(255),
      Math.round(200 - s * 150),
      Math.round(0),
      alpha,
    ];
  }
  const s = (t - 0.75) / 0.25;
  return [
    Math.round(255),
    Math.round(50 - s * 0),
    Math.round(0 + s * 50),
    alpha,
  ];
}

// Turns assets/hands-source.png into a compact "ink map" the hero redraws as dots.
// Output: public/hands.bin (one byte of ink per cell, 0–255) and lib/hands-meta.json.
// Run: node scripts/build-hands.mjs
import fs from "node:fs";
import { PNG } from "pngjs";

const SRC = "assets/hands-source.png";
const CELL = 3; // source pixels per cell

const png = PNG.sync.read(fs.readFileSync(SRC));
const { width, height, data } = png;

// The paper colour is the most common pixel; anything darker is ink.
const lum = (i) => 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
let paper = 0;
let darkest = 255;
for (let i = 0; i < width * height; i++) {
  const l = lum(i * 4);
  paper = Math.max(paper, l);
  darkest = Math.min(darkest, l);
}

const cols = Math.floor(width / CELL);
const rows = Math.floor(height / CELL);
const ink = new Uint8Array(cols * rows);

for (let cy = 0; cy < rows; cy++) {
  for (let cx = 0; cx < cols; cx++) {
    let sum = 0;
    for (let y = 0; y < CELL; y++) {
      for (let x = 0; x < CELL; x++) {
        const i = ((cy * CELL + y) * width + cx * CELL + x) * 4;
        sum += (paper - lum(i)) / (paper - darkest);
      }
    }
    const v = Math.max(0, Math.min(1, sum / (CELL * CELL)));
    // Faint paper texture below this is noise, not hand.
    ink[cy * cols + cx] = v < 0.04 ? 0 : Math.round(v * 255);
  }
}

// Find the empty gap between the two hands so the logo can sit in it.
const colInk = Array.from({ length: cols }, (_, x) => {
  let s = 0;
  for (let y = 0; y < rows; y++) s += ink[y * cols + x];
  return s;
});
const mid = Math.floor(cols / 2);
let gapStart = mid;
let gapEnd = mid;
while (gapStart > 0 && colInk[gapStart - 1] === 0) gapStart--;
while (gapEnd < cols - 1 && colInk[gapEnd + 1] === 0) gapEnd++;

// Fingertip rows: where each hand reaches the gap.
const tipRow = (x) => {
  let s = 0;
  let n = 0;
  for (let y = 0; y < rows; y++) {
    const v = ink[y * cols + x];
    s += v * y;
    n += v;
  }
  return n ? Math.round(s / n) : Math.floor(rows / 2);
};

const meta = {
  cols,
  rows,
  cell: CELL,
  gapStart,
  gapEnd,
  leftTip: { x: gapStart - 1, y: tipRow(gapStart - 1) },
  rightTip: { x: gapEnd + 1, y: tipRow(gapEnd + 1) },
};

fs.writeFileSync("public/hands.bin", ink);
fs.writeFileSync("lib/hands-meta.json", JSON.stringify(meta, null, 2) + "\n");
console.log(meta, `paper=${paper.toFixed(0)} darkest=${darkest.toFixed(0)}`);

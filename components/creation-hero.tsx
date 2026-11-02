"use client";

// The brand mark: Michelangelo's two hands, redrawn as dots from public/hands.bin,
// with a topic logo dithered into the gap between the fingers.
import { useEffect, useRef, useState } from "react";
import meta from "@/lib/hands-meta.json";

export type HeroLogo = { title: string; hex: string; path: string };

// 4×4 Bayer matrix: the threshold each cell must beat to get a dot.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const TONE = 1.35; // averaged ink reads lighter than the source dither; lift it back
const LOGO_CELLS = 34;
const DEVELOP_MS = 1400;
const CYCLE_MS = 3200;

let inkPromise: Promise<Uint8Array> | null = null;
function loadInk() {
  inkPromise ??= fetch("/hands.bin")
    .then((r) => r.arrayBuffer())
    .then((b) => new Uint8Array(b));
  return inkPromise;
}

/** Rasterise a 24×24 icon path into per-cell coverage (0–1). */
function logoCoverage(path: string, cells: number) {
  const scale = 8;
  const size = cells * scale;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(size / 24, size / 24);
  ctx.fill(new Path2D(path));
  const px = ctx.getImageData(0, 0, size, size).data;
  const out = new Float32Array(cells * cells);
  for (let cy = 0; cy < cells; cy++) {
    for (let cx = 0; cx < cells; cx++) {
      let a = 0;
      for (let y = 0; y < scale; y++) {
        for (let x = 0; x < scale; x++) {
          a += px[((cy * scale + y) * size + cx * scale + x) * 4 + 3];
        }
      }
      out[cy * cells + cx] = a / (255 * scale * scale);
    }
  }
  return out;
}

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

export function CreationHero({
  logos,
  className = "",
  label,
}: {
  logos: HeroLogo[];
  className?: string;
  label?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const [crop, setCrop] = useState({ x0: 0, x1: meta.cols });

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const split = (meta.gapStart + meta.gapEnd) / 2;
    const center = { x: split, y: (meta.leftTip.y + meta.rightTip.y) / 2 };

    let ink: Uint8Array | null = null;
    let raf = 0;
    let start = performance.now();
    let logoIndex = 0;
    let logoStart = start;
    let close = 0; // 0 = resting, 1 = hands nudged together on hover
    let closeTarget = 0;
    let view = { x0: 0, x1: meta.cols };
    const coverage = logos.map((l) => logoCoverage(l.path, LOGO_CELLS));

    const colours = () => {
      const s = getComputedStyle(document.documentElement);
      return { dot: s.getPropertyValue("--dot").trim() || "#4f7322" };
    };
    let palette = colours();

    function resize() {
      const w = wrap.clientWidth;
      // On narrow screens, zoom in on the fingertips so the gap stays readable.
      view = w < 640 ? { x0: 96, x1: meta.cols - 96 } : { x0: 0, x1: meta.cols };
      setCrop(view);
      const cols = view.x1 - view.x0;
      const h = Math.round((w * meta.rows) / cols);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = `${h}px`;
      draw(performance.now());
    }

    function draw(now: number) {
      if (!ink) return;
      const W = canvas.width;
      const H = canvas.height;
      const cols = view.x1 - view.x0;
      const s = W / cols; // device px per cell
      const d = Math.max(1, Math.round(s * 0.62));
      ctx.clearRect(0, 0, W, H);

      const develop = reduced ? 1 : ease((now - start) / DEVELOP_MS);
      const drift = (1 - develop) * 10 - close * 2.5; // cells each hand sits away from rest
      ctx.fillStyle = palette.dot;

      for (let y = 0; y < meta.rows; y++) {
        const row = y * meta.cols;
        for (let x = view.x0; x < view.x1; x++) {
          const v = ink[row + x];
          if (!v) continue;
          const t = BAYER[((y & 3) << 2) | (x & 3)];
          if ((v / 255) * TONE * develop <= t) continue;
          const shift = x < split ? -drift : drift;
          ctx.fillRect(Math.round((x - view.x0 + shift) * s), Math.round(y * s), d, d);
        }
      }

      // Logo in the gap, in its own colour.
      if (coverage.length) {
        const cov = coverage[logoIndex];
        const appear = reduced ? 1 : ease((now - Math.max(logoStart, start + DEVELOP_MS * 0.55)) / 700);
        const lx = center.x - LOGO_CELLS / 2 - view.x0;
        const ly = center.y - LOGO_CELLS / 2;
        ctx.fillStyle = `#${logos[logoIndex].hex}`;
        for (let y = 0; y < LOGO_CELLS; y++) {
          for (let x = 0; x < LOGO_CELLS; x++) {
            const a = cov[y * LOGO_CELLS + x];
            if (!a) continue;
            const t = BAYER[((y & 3) << 2) | (x & 3)];
            if (a * appear * (1.15 + close * 0.3) <= t) continue;
            ctx.fillRect(Math.round((lx + x) * s), Math.round((ly + y) * s), d, d);
          }
        }
      }
    }

    function frame(now: number) {
      close += (closeTarget - close) * 0.12;
      if (logos.length > 1 && !reduced && now - logoStart > CYCLE_MS && now - start > DEVELOP_MS) {
        logoIndex = (logoIndex + 1) % logos.length;
        logoStart = now;
        setActive(logoIndex);
      }
      draw(now);
      const settling =
        now - start < DEVELOP_MS + 800 || Math.abs(closeTarget - close) > 0.01 || now - logoStart < 800;
      if (settling || logos.length > 1) raf = requestAnimationFrame(frame);
      else raf = 0;
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    function onMove(e: PointerEvent) {
      const r = canvas.getBoundingClientRect();
      const cols = view.x1 - view.x0;
      const gx = r.left + ((center.x - view.x0) / cols) * r.width;
      const gy = r.top + (center.y / meta.rows) * r.height;
      closeTarget = Math.hypot(e.clientX - gx, e.clientY - gy) < r.width * 0.16 ? 1 : 0;
      kick();
    }
    function onLeave() {
      closeTarget = 0;
      kick();
    }

    const themeWatch = new MutationObserver(() => {
      palette = colours();
      kick();
    });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const ro = new ResizeObserver(resize);

    loadInk().then((data) => {
      ink = data;
      start = logoStart = performance.now();
      ro.observe(wrap);
      resize();
      kick();
    });
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeWatch.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [logos]);

  const cols = crop.x1 - crop.x0;
  const gapLeft = ((meta.gapStart - crop.x0) / cols) * 100;
  const gapWidth = ((meta.gapEnd - meta.gapStart) / cols) * 100;
  const tipY = (meta.leftTip.y + meta.rightTip.y) / 2;
  const labelTop = ((tipY + LOGO_CELLS / 2 + 8) / meta.rows) * 100;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="block w-full [mask-image:linear-gradient(90deg,transparent,#000_9%,#000_91%,transparent)]"
        style={{ aspectRatio: `${cols} / ${meta.rows}` }}
        role="img"
        aria-label={`Two hands reaching toward the ${logos[active]?.title ?? ""} logo, after Michelangelo's Creation of Adam`}
      />
      {/* Dimension line across the gap: the space this course closes. */}
      <div
        className="pointer-events-none absolute hidden flex-col items-center text-muted sm:flex"
        style={{ left: `${gapLeft}%`, width: `${gapWidth}%`, top: `${labelTop}%` }}
        aria-hidden
      >
        <div className="flex w-full items-center">
          <span className="h-2 w-px bg-current opacity-50" />
          <span className="h-px flex-1 bg-current opacity-30" />
          <span className="h-2 w-px bg-current opacity-50" />
        </div>
        <span className="mt-1 font-mono text-[0.6rem] tracking-[0.12em] uppercase">
          {label ?? logos[active]?.title}
        </span>
      </div>
    </div>
  );
}

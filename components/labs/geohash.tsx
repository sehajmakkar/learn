"use client";

// Nearest store with a geohash grid. 600 stores in a box around London; click anywhere to search. The search only
// checks stores in the query's cell and its eight neighbours, then measures real distances to pick the nearest.
import { useState } from "react";

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
const LAT = [51.3, 51.7];
const LON = [-0.5, 0.2];
const W = 360;
const H = 330;

function geohash(lat: number, lon: number, precision: number): string {
  let latLo = -90, latHi = 90, lonLo = -180, lonHi = 180;
  let hash = "", bits = 0, ch = 0, even = true;
  while (hash.length < precision) {
    if (even) {
      const mid = (lonLo + lonHi) / 2;
      if (lon >= mid) { ch = (ch << 1) | 1; lonLo = mid; } else { ch <<= 1; lonHi = mid; }
    } else {
      const mid = (latLo + latHi) / 2;
      if (lat >= mid) { ch = (ch << 1) | 1; latLo = mid; } else { ch <<= 1; latHi = mid; }
    }
    even = !even;
    if (++bits === 5) { hash += BASE32[ch]; bits = 0; ch = 0; }
  }
  return hash;
}

function bounds(hash: string) {
  let latLo = -90, latHi = 90, lonLo = -180, lonHi = 180, even = true;
  for (const c of hash) {
    const v = BASE32.indexOf(c);
    for (let b = 4; b >= 0; b--) {
      const bit = (v >> b) & 1;
      if (even) { const mid = (lonLo + lonHi) / 2; if (bit) lonLo = mid; else lonHi = mid; }
      else { const mid = (latLo + latHi) / 2; if (bit) latLo = mid; else latHi = mid; }
      even = !even;
    }
  }
  return { latLo, latHi, lonLo, lonHi };
}

function neighbours(hash: string): string[] {
  const b = bounds(hash);
  const dLat = b.latHi - b.latLo, dLon = b.lonHi - b.lonLo;
  const cLat = (b.latLo + b.latHi) / 2, cLon = (b.lonLo + b.lonHi) / 2;
  const out: string[] = [];
  for (const dy of [1, 0, -1]) for (const dx of [-1, 0, 1]) out.push(geohash(cLat + dy * dLat, cLon + dx * dLon, hash.length));
  return out;
}

function km(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

let seed = 11;
const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 2 ** 32);
const STORES = Array.from({ length: 600 }, () => {
  // Denser in the middle, like a real city.
  const u = rnd(), v = rnd();
  const lat = LAT[0] + (LAT[1] - LAT[0]) * (0.5 + (u - 0.5) * (0.3 + 0.7 * rnd()));
  const lon = LON[0] + (LON[1] - LON[0]) * (0.5 + (v - 0.5) * (0.3 + 0.7 * rnd()));
  return { lat, lon };
});

const r1 = (n: number) => Math.round(n * 10) / 10;
const x = (lon: number) => r1(((lon - LON[0]) / (LON[1] - LON[0])) * W);
const y = (lat: number) => r1(((LAT[1] - lat) / (LAT[1] - LAT[0])) * H);

export function GeohashLab() {
  const [precision, setPrecision] = useState(5);
  const [q, setQ] = useState({ lat: 51.5074, lon: -0.1278 });
  const cell = geohash(q.lat, q.lon, precision);
  const cells = neighbours(cell);
  const cellSet = new Set(cells);
  const candidates = STORES.map((s, i) => ({ ...s, i })).filter((s) => cellSet.has(geohash(s.lat, s.lon, precision)));
  const nearest = candidates.reduce<(typeof candidates)[number] | null>((best, s) => (!best || km(q.lat, q.lon, s.lat, s.lon) < km(q.lat, q.lon, best.lat, best.lon) ? s : best), null);
  const trueNearest = STORES.reduce((bi, s, i) => (km(q.lat, q.lon, s.lat, s.lon) < km(q.lat, q.lon, STORES[bi].lat, STORES[bi].lon) ? i : bi), 0);
  const b = bounds(cell);
  const cellKm = [km(b.latLo, b.lonLo, b.latHi, b.lonLo), km(b.latLo, b.lonLo, b.latLo, b.lonHi)];

  // Grid lines for the chosen precision across the visible box.
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const dLon = b.lonHi - b.lonLo, dLat = b.latHi - b.latLo;
  for (let lon = Math.ceil(LON[0] / dLon) * dLon; lon < LON[1]; lon += dLon) lines.push({ x1: x(lon), y1: 0, x2: x(lon), y2: H });
  for (let lat = Math.ceil(LAT[0] / dLat) * dLat; lat < LAT[1]; lat += dLat) lines.push({ x1: 0, y1: y(lat), x2: W, y2: y(lat) });

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    setQ({ lat: LAT[1] - (py / H) * (LAT[1] - LAT[0]), lon: LON[0] + (px / W) * (LON[1] - LON[0]) });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Geohash precision">
        <span className="mr-1 text-[0.85rem] text-ink-2">Precision</span>
        {[4, 5, 6].map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={precision === p}
            onClick={() => setPrecision(p)}
            className={`border px-2.5 py-1 font-mono text-[0.75rem] ${precision === p ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-ink-2 hover:border-ink-2"}`}
          >
            {p} characters
          </button>
        ))}
      </div>

      <div className="mt-4 grid items-start gap-6 sm:grid-cols-[minmax(0,22rem)_1fr]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full cursor-crosshair border border-line" onClick={onClick} role="img" aria-label="Map of stores; click to search near a point">
          <rect width={W} height={H} fill="var(--paper)" />
          {cells.map((c) => {
            const cb = bounds(c);
            return <rect key={c} x={x(cb.lonLo)} y={y(cb.latHi)} width={r1(x(cb.lonHi) - x(cb.lonLo))} height={r1(y(cb.latLo) - y(cb.latHi))} fill={c === cell ? "var(--accent-soft)" : "var(--paper-2)"} />;
          })}
          {lines.map((l, i) => (
            <line key={i} {...l} stroke="var(--line)" strokeWidth={0.6} />
          ))}
          {STORES.map((s, i) => (
            <circle key={i} cx={x(s.lon)} cy={y(s.lat)} r={1.6} fill={cellSet.has(geohash(s.lat, s.lon, precision)) ? "var(--ink-2)" : "var(--muted)"} opacity={cellSet.has(geohash(s.lat, s.lon, precision)) ? 1 : 0.45} />
          ))}
          {nearest && <line x1={x(q.lon)} y1={y(q.lat)} x2={x(nearest.lon)} y2={y(nearest.lat)} stroke="var(--accent)" strokeWidth={1.5} />}
          {nearest && <circle cx={x(nearest.lon)} cy={y(nearest.lat)} r={4} fill="var(--accent)" />}
          <circle cx={x(q.lon)} cy={y(q.lat)} r={4} fill="none" stroke="var(--danger)" strokeWidth={2} />
        </svg>

        <div className="text-[0.85rem]">
          <p className="text-ink-2">Click the map to search from a point.</p>
          <dl className="mt-3 space-y-2">
            <div>
              <dt className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">Query cell</dt>
              <dd className="font-mono text-ink">
                {cell} <span className="text-muted">({cellKm[0].toFixed(1)} × {cellKm[1].toFixed(1)} km)</span>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">Cells searched</dt>
              <dd className="font-mono text-[0.75rem] leading-relaxed text-ink-2">{cells.join(" ")}</dd>
            </div>
            <div>
              <dt className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">Stores checked</dt>
              <dd className="text-ink">
                {candidates.length} of {STORES.length}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">Nearest found</dt>
              <dd className="text-ink">
                {nearest
                  ? `${km(q.lat, q.lon, nearest.lat, nearest.lon).toFixed(2)} km away${nearest.i === trueNearest ? ", the true nearest" : ", but not the true nearest"}`
                  : "No stores in these nine cells: search the next ring, or use a shorter geohash."}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

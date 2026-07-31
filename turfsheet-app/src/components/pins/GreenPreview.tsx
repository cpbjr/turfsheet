/**
 * SVG green outline + pin for Table/Delivery previews.
 * Phase 1: pure SVG. Phase 2: optional static aerial via backgroundSrc.
 */

import { useMemo, type ReactNode } from 'react';
import { measurePin, ringToLocalUV } from '@/lib/courseGeometry';
import type { GreenIndex, Pin } from '@/types/courseMap';

interface GreenPreviewProps {
  hole: number;
  greenIndex: GreenIndex;
  pin?: Pin | null;
  /** Phase 2: static aerial underlay path (e.g. /geo/green-previews/h01.webp). */
  backgroundSrc?: string;
  className?: string;
  /** Pixel size of the square viewBox area. */
  size?: number;
}

export default function GreenPreview({
  hole,
  greenIndex,
  pin,
  backgroundSrc,
  className = '',
  size = 160,
}: GreenPreviewProps) {
  const svg = useMemo(() => {
    const g = greenIndex[hole];
    const W = size;
    const H = size;
    const pad = 10;
    if (!g) {
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" aria-hidden>
          <rect width="100%" height="100%" fill="#fafafa" />
          <text x="50%" y="50%" textAnchor="middle" fill="#999" fontSize="11">
            No green
          </text>
        </svg>
      );
    }

    const pts = ringToLocalUV(g);
    const minU = g.frontU;
    const maxU = g.backU;
    const minV = g.leftV;
    const maxV = g.rightV;
    const spanU = Math.max(0.5, maxU - minU);
    const spanV = Math.max(0.5, maxV - minV);
    const availW = W - pad * 2;
    const availH = H - pad * 2;
    const scale = Math.min(availW / spanV, availH / spanU);
    const drawW = spanV * scale;
    const drawH = spanU * scale;
    const ox = (W - drawW) / 2;
    const oy = (H - drawH) / 2;

    const proj = (u: number, v: number): [number, number] => [
      ox + (v - minV) * scale,
      oy + (maxU - u) * scale,
    ];

    const poly = pts
      .map((p) => {
        const [x, y] = proj(p.u, p.v);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const [fx1, fy1] = proj(minU, (minV + maxV) / 2);

    let pinDot: ReactNode = null;
    let resolved = pin;
    if (pin && pin.ok && (pin.u == null || pin.v == null) && pin.lat != null && pin.lng != null) {
      resolved = measurePin(greenIndex, hole, pin.lat, pin.lng);
    }
    if (resolved && resolved.ok && resolved.u != null && resolved.v != null) {
      const [px, py] = proj(resolved.u, resolved.v);
      pinDot = (
        <circle
          cx={px}
          cy={py}
          r={5}
          fill="#c62828"
          stroke="#111"
          strokeWidth={0.9}
        />
      );
    }

    // Approach cue: short dashed line below front edge
    const approachY = oy + drawH + 4;

    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        aria-label={`Hole ${hole} green preview`}
      >
        {backgroundSrc ? (
          <image href={backgroundSrc} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
        ) : (
          <rect width="100%" height="100%" fill="#eef5ea" />
        )}
        <polygon
          points={poly}
          fill="#81c784"
          fillOpacity={backgroundSrc ? 0.35 : 0.85}
          stroke="#2e7d32"
          strokeWidth={1.4}
        />
        <line
          x1={ox}
          y1={oy + drawH}
          x2={ox + drawW}
          y2={oy + drawH}
          stroke="#666"
          strokeWidth={0.7}
          strokeDasharray="2 2"
        />
        <line
          x1={fx1}
          y1={oy + drawH}
          x2={fx1}
          y2={Math.min(H - 2, approachY + 8)}
          stroke="#888"
          strokeWidth={0.6}
          strokeDasharray="2 2"
        />
        <text
          x={fx1}
          y={Math.min(H - 3, fy1 + 12)}
          textAnchor="middle"
          fontSize={8}
          fill="#555"
        >
          front
        </text>
        {pinDot}
      </svg>
    );
  }, [backgroundSrc, greenIndex, hole, pin, size]);

  return (
    <div
      className={`border border-border-color bg-panel-white overflow-hidden ${className}`}
      style={{ aspectRatio: '1 / 1' }}
    >
      {svg}
    </div>
  );
}

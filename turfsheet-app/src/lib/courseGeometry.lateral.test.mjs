/**
 * Pure unit tests for lateralEdgeDistancesM (no Vite).
 * Run: node src/lib/courseGeometry.lateral.test.mjs
 */

/** Inline copy of the intersection logic — keep in sync with courseGeometry.ts */
function lateralEdgeDistancesM(ringUV, pu, pv) {
  const eps = 1e-9;
  let bestLeft = null;
  let bestRight = null;

  const n = ringUV.length;
  if (n < 2) {
    return { leftM: 0, rightM: 0 };
  }

  for (let i = 0; i < n - 1; i++) {
    const a = ringUV[i];
    const b = ringUV[i + 1];
    const du = b.u - a.u;
    const dv = b.v - a.v;
    if (Math.abs(du) < eps) {
      if (Math.abs(a.u - pu) > eps) continue;
      const vLo = Math.min(a.v, b.v);
      const vHi = Math.max(a.v, b.v);
      if (vLo <= pv + eps) {
        const vHit = Math.min(vHi, pv);
        if (bestLeft == null || vHit > bestLeft) bestLeft = vHit;
      }
      if (vHi >= pv - eps) {
        const vHit = Math.max(vLo, pv);
        if (bestRight == null || vHit < bestRight) bestRight = vHit;
      }
      continue;
    }
    const t = (pu - a.u) / du;
    if (t < -eps || t > 1 + eps) continue;
    const vHit = a.v + t * dv;
    if (vHit <= pv + eps) {
      if (bestLeft == null || vHit > bestLeft) bestLeft = vHit;
    }
    if (vHit >= pv - eps) {
      if (bestRight == null || vHit < bestRight) bestRight = vHit;
    }
  }

  if (bestLeft == null || bestRight == null) {
    for (const p of ringUV) {
      if (bestLeft == null && p.v <= pv) bestLeft = p.v;
      else if (p.v <= pv && p.v > bestLeft) bestLeft = p.v;
      if (bestRight == null && p.v >= pv) bestRight = p.v;
      else if (p.v >= pv && p.v < bestRight) bestRight = p.v;
    }
  }

  const leftM = bestLeft == null ? 0 : Math.max(0, pv - bestLeft);
  const rightM = bestRight == null ? 0 : Math.max(0, bestRight - pv);
  return { leftM, rightM };
}

function assertClose(actual, expected, tol = 1e-6, msg = '') {
  if (Math.abs(actual - expected) > tol) {
    throw new Error(`${msg} expected ${expected}, got ${actual}`);
  }
}

// Axis-aligned rectangle: u 0..20, v -10..10 (20m deep, 20m wide)
const rect = [
  { u: 0, v: -10 },
  { u: 20, v: -10 },
  { u: 20, v: 10 },
  { u: 0, v: 10 },
  { u: 0, v: -10 },
];

// Center pin
{
  const d = lateralEdgeDistancesM(rect, 10, 0);
  assertClose(d.leftM, 10, 1e-6, 'center left');
  assertClose(d.rightM, 10, 1e-6, 'center right');
}

// 3m from left edge (v = -7): left=3, right=17
{
  const d = lateralEdgeDistancesM(rect, 10, -7);
  assertClose(d.leftM, 3, 1e-6, 'near-left left');
  assertClose(d.rightM, 17, 1e-6, 'near-left right');
}

// 2m from right edge (v = 8)
{
  const d = lateralEdgeDistancesM(rect, 5, 8);
  assertClose(d.leftM, 18, 1e-6, 'near-right left');
  assertClose(d.rightM, 2, 1e-6, 'near-right right');
}

// Tapered trap: front (u=0) v -5..5, back (u=20) v -15..15
const trap = [
  { u: 0, v: -5 },
  { u: 20, v: -15 },
  { u: 20, v: 15 },
  { u: 0, v: 5 },
  { u: 0, v: -5 },
];
// Mid depth u=10: left edge v = -5 + 0.5*(-10) = -10; right = 5 + 0.5*10 = 10
{
  const d = lateralEdgeDistancesM(trap, 10, 0);
  assertClose(d.leftM, 10, 1e-6, 'trap center left');
  assertClose(d.rightM, 10, 1e-6, 'trap center right');
}
// At u=10, pin at v=-8 → left=2, right=18
{
  const d = lateralEdgeDistancesM(trap, 10, -8);
  assertClose(d.leftM, 2, 1e-6, 'trap near-left left');
  assertClose(d.rightM, 18, 1e-6, 'trap near-left right');
}

console.log('courseGeometry.lateral.test.mjs: all passed');

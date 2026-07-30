/**
 * Offline Club Championship pin-sheet PDFs → local dir (then Drive upload).
 * Usage: node scripts/generate-pin-handout-pdfs.mjs
 */
import { createRequire } from 'module';
import { mkdirSync, writeFileSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const APP = join(ROOT, 'turfsheet-app');
const OUT = join(ROOT, 'tmp', 'pin-handouts');

const DAY_IDS = {
  day1: '34125f73-4bb8-487e-a97f-a911f50e6f44', // BanBury Club Championship - Day 1 (newer)
  day2: '7d83dc60-ab74-4aea-8871-f0aa6d9b1539', // BanBury Club Championship - Day 2
};

function loadEnv() {
  const env = {};
  const text = readFileSync('/home/clawuser/.hermes/.env', 'utf8');
  for (const line of text.split('\n')) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[k] = v;
  }
  return env;
}

async function fetchPinSet(env, id) {
  const url = `${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/banbury_pin_sets?id=eq.${id}&select=*`;
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Accept-Profile': 'turfsheet',
      'Content-Profile': 'turfsheet',
    },
  });
  if (!res.ok) throw new Error(`fetch pin set ${id}: ${res.status} ${await res.text()}`);
  const rows = await res.json();
  if (!rows[0]) throw new Error(`No pin set ${id}`);
  return rows[0];
}

async function bundleHelpers() {
  const outfile = join(OUT, 'pin-print-bundle.mjs');
  mkdirSync(OUT, { recursive: true });
  await build({
    entryPoints: [join(APP, 'src/lib/pinSheetPrintHtml.ts')],
    bundle: true,
    platform: 'neutral',
    format: 'esm',
    outfile,
    // Stub import.meta.env for courseGeometry BASE_URL
    define: {
      'import.meta.env.BASE_URL': JSON.stringify('/'),
    },
    // Don't try to resolve react or CSS
    external: [],
    logLevel: 'warning',
  });
  return outfile;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const env = loadEnv();
  const bundlePath = await bundleHelpers();
  // Dynamic import of bundled ESM
  const mod = await import(bundlePath);
  const { buildPinSheetPrintHtml } = mod;
  const geoPath = join(APP, 'public/geo/banbury-course-v1.geojson');
  // buildGreenIndex is in courseGeometry — import from same bundle? pinSheetPrintHtml doesn't export it.
  // Bundle a tiny entry instead.
  const entry = join(OUT, 'entry.ts');
  writeFileSync(
    entry,
    `
import { readFileSync } from 'fs';
import { buildGreenIndex, pinsFromStorage } from '${join(APP, 'src/lib/courseGeometry.ts').replace(/\\/g, '/')}';
import { buildPinSheetPrintHtml } from '${join(APP, 'src/lib/pinSheetPrintHtml.ts').replace(/\\/g, '/')}';

export function renderHtml(geoJsonText, row, handoutBase) {
  const geo = JSON.parse(geoJsonText);
  const greenIndex = buildGreenIndex(geo);
  const pins = pinsFromStorage(row.pins || {}, greenIndex);
  const tokenUrl = row.public_token
    ? \`\${handoutBase}?pinToken=\${encodeURIComponent(row.public_token)}\`
    : '';
  return buildPinSheetPrintHtml({
    label: row.label || 'Daily pins',
    playDate: row.play_date,
    status: row.status || 'draft',
    startHole: row.start_hole || 1,
    pins,
    avoid: row.avoid || { course: [], holes: {} },
    greenIndex,
    tokenUrl,
    autoPrint: false,
  });
}
`
  );

  const outBundle = join(OUT, 'render.mjs');
  await build({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: outBundle,
    define: { 'import.meta.env.BASE_URL': JSON.stringify('/') },
    banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
    logLevel: 'warning',
  });

  const { renderHtml } = await import(outBundle);
  const geoText = readFileSync(geoPath, 'utf8');
  const handoutBase = 'https://whitepine-tech.com/turfsheet/maps';

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const [key, id] of Object.entries(DAY_IDS)) {
    const row = await fetchPinSet(env, id);
    const html = renderHtml(geoText, row, handoutBase);
    const htmlPath = join(OUT, `${key}.html`);
    const pdfPath = join(
      OUT,
      `BanBury_Club_Championship_${key === 'day1' ? 'Day1' : 'Day2'}_${row.play_date}_pin_sheet.pdf`
    );
    writeFileSync(htmlPath, html);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({
      path: pdfPath,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' },
    });
    await page.close();
    const pinCount = Object.keys(row.pins || {}).length;
    results.push({ key, id, label: row.label, play_date: row.play_date, pinCount, pdfPath, htmlPath });
    console.log('PDF', pdfPath, 'pins', pinCount);
  }

  await browser.close();
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

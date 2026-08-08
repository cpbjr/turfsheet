#!/usr/bin/env node
/**
 * Verify that the anon key cannot read any turfsheet table, and that the pin-handout
 * RPC still works. This is the test that matters for the site-auth lockdown: the anon
 * key ships inside the client bundle, so anyone can query PostgREST directly and never
 * touch the React app. Clicking around in a browser proves nothing here.
 *
 * Run BEFORE the lockdown migration to capture a baseline (everything OPEN), and again
 * AFTER to confirm every table is LOCKED.
 *
 *   node scripts/verify-anon-lockdown.mjs                     # uses turfsheet-app/.env.local
 *   node scripts/verify-anon-lockdown.mjs --token <pinToken>  # also exercises the RPC
 *
 * Against production, lift the key from the deployed bundle instead:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/verify-anon-lockdown.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

const TABLES = [
  'banbury_pin_sets', 'calendar_events', 'chemical_products', 'course_features',
  'daily_assignments', 'daily_board', 'default_schedule', 'equipment', 'jobs',
  'maintenance_issues', 'maintenance_reporters', 'memory_chunks', 'memory_documents',
  'memory_events', 'pesticide_applications', 'project_sections', 'projects',
  'scheduled_job_queue', 'second_job_board', 'spray_mix_templates', 'staff',
  'staff_schedules', 'staff_skills', 'staff_time_off',
];

function loadEnv() {
  let url = process.env.SUPABASE_URL;
  let key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    const envPath = resolve(HERE, '..', 'turfsheet-app', '.env.local');
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const [k, ...rest] = line.split('=');
      const v = rest.join('=').trim();
      if (k.trim() === 'VITE_SUPABASE_URL') url ||= v;
      if (k.trim() === 'VITE_SUPABASE_ANON_KEY') key ||= v;
    }
  }
  if (!url || !key) throw new Error('Missing Supabase URL / anon key');
  return { url: url.replace(/\/$/, ''), key };
}

const { url, key } = loadEnv();
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Accept-Profile': 'turfsheet',
  'Content-Profile': 'turfsheet',
};

let open = 0;
console.log(`anon read check against ${url}\n`);

for (const table of TABLES) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, { headers });
  const body = await res.text();
  let rows = null;
  try { rows = JSON.parse(body); } catch { /* error payload, not an array */ }

  if (res.ok && Array.isArray(rows) && rows.length > 0) {
    open++;
    console.log(`  OPEN    ${table}  (${res.status}, returned a row)`);
  } else if (res.ok && Array.isArray(rows)) {
    // Empty set: either RLS is blocking, or the table is genuinely empty. Both are safe
    // reads, but an empty table cannot distinguish the two - flagged so it is not
    // mistaken for proof.
    console.log(`  empty   ${table}  (${res.status}, no rows - locked or table is empty)`);
  } else {
    console.log(`  LOCKED  ${table}  (${res.status})`);
  }
}

console.log(`\n${open} of ${TABLES.length} tables returned data to anon.`);

const tokenArg = process.argv.indexOf('--token');
if (tokenArg !== -1 && process.argv[tokenArg + 1]) {
  const res = await fetch(`${url}/rest/v1/rpc/banbury_pin_set_by_token`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_token: process.argv[tokenArg + 1] }),
  });
  const body = await res.text();
  const ok = res.ok && body !== 'null' && body !== '[]';
  console.log(`\npin handout RPC: ${ok ? 'WORKS' : 'BROKEN'} (${res.status}) ${ok ? '' : body.slice(0, 200)}`);
  if (!ok) process.exitCode = 1;
} else {
  console.log('\npin handout RPC: not checked (pass --token <pinToken> to exercise it)');
}

if (open > 0) process.exitCode = 1;

/**
 * One-time migration from legacy localStorage blob or /api/state JSON to Supabase.
 *
 * Usage:
 *   1. Export legacy state JSON to legacy-state.json in the project root.
 *   2. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (server-side only).
 *   3. Run: node scripts/migrate-local-state.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGACY_STATE_PATH = path.resolve(__dirname, "../legacy-state.json");

const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running migration.");
  process.exit(1);
}

if (!fs.existsSync(LEGACY_STATE_PATH)) {
  console.error(`Missing ${LEGACY_STATE_PATH}. Export legacy state first.`);
  process.exit(1);
}

const legacyState = JSON.parse(fs.readFileSync(LEGACY_STATE_PATH, "utf-8"));

async function supabaseRequest(table, method, body, query = "") {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: supabaseKey,
      authorization: `Bearer ${supabaseKey}`,
      "content-type": "application/json",
      prefer: method === "POST" ? "return=minimal" : "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${table} ${method} failed (${response.status}): ${text}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function dataUrlToBuffer(dataUrl) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

async function migrateSchedules(schedules = {}) {
  const rows = Object.entries(schedules).map(([dateKey, schedule]) => ({
    group_id: schedule.groupId || `legacy-${dateKey}`,
    date_key: dateKey,
    type: schedule.type || "공지 대기 (미정)",
    start_time: schedule.startTime || "",
    memo: schedule.memo || "",
    range_start: schedule.rangeStart || dateKey,
    range_end: schedule.rangeEnd || dateKey,
  }));

  if (!rows.length) {
    console.log("No schedules to migrate.");
    return;
  }

  await supabaseRequest("schedules", "POST", rows);
  console.log(`Migrated ${rows.length} schedule rows.`);
}

async function uploadFanartFile(storagePath, buffer, contentType) {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/fanart/${storagePath}`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      authorization: `Bearer ${supabaseKey}`,
      "content-type": contentType,
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Storage upload failed (${response.status}): ${text}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/fanart/${storagePath}`;
}

async function migrateFanart(fanartItems = []) {
  if (!fanartItems.length) {
    console.log("No fanart to migrate.");
    return;
  }

  for (const item of fanartItems) {
    const storagePath = `legacy/${item.id || crypto.randomUUID()}.png`;
    const { buffer, contentType } = dataUrlToBuffer(item.src);
    const imageUrl = await uploadFanartFile(storagePath, buffer, contentType);

    await supabaseRequest("fanart", "POST", [{
      title: item.title || "legacy fanart",
      image_url: imageUrl,
      storage_path: storagePath,
    }]);
  }

  console.log(`Migrated ${fanartItems.length} fanart items.`);
}

async function main() {
  await migrateSchedules(legacyState.schedules);
  await migrateFanart(legacyState.galleryItems?.fanart || []);
  console.log("Migration complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

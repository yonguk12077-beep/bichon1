import { fail, getSupabaseClient, readJsonBody, sanitizeText, sendJson } from "./_supabase.js";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 120;

function parseDateKey(dateKey) {
  if (!DATE_KEY_RE.test(dateKey || "")) throw fail(400, "Invalid date.");

  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw fail(400, "Invalid date.");

  return date;
}

function getDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getDateKeysBetween(startKey, endKey) {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);

  if (end < start) throw fail(400, "End date must be after start date.");

  const keys = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    if (keys.length >= MAX_RANGE_DAYS) throw fail(400, "Schedule range is too long.");

    keys.push(getDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return keys;
}

function normalizeSchedulePayload(payload) {
  const rangeStart = sanitizeText(payload.rangeStart, 10);
  const rangeEnd = sanitizeText(payload.rangeEnd || rangeStart, 10);
  const type = sanitizeText(payload.type, 40) || "schedule";

  return {
    groupId: sanitizeText(payload.groupId, 120) || `schedule-${Date.now()}`,
    existingGroupId: sanitizeText(payload.existingGroupId, 120),
    type,
    startTime: sanitizeText(payload.startTime, 40),
    memo: sanitizeText(payload.memo, 160),
    rangeStart,
    rangeEnd,
    rangeKeys: getDateKeysBetween(rangeStart, rangeEnd),
  };
}

async function fetchScheduleRows(client) {
  const { data, error } = await client
    .from("schedules")
    .select("*")
    .order("date_key", { ascending: true });

  if (error) throw error;
  return data || [];
}

export default async function handler(request, response) {
  try {
    const client = getSupabaseClient();

    if (request.method === "GET") {
      sendJson(response, 200, { schedules: await fetchScheduleRows(client) });
      return;
    }

    if (request.method === "POST" || request.method === "PUT") {
      const schedule = normalizeSchedulePayload(await readJsonBody(request));
      const groupToReplace = schedule.existingGroupId || schedule.groupId;

      if (groupToReplace) {
        const { error: deleteError } = await client
          .from("schedules")
          .delete()
          .eq("group_id", groupToReplace);

        if (deleteError) throw deleteError;
      }

      const rows = schedule.rangeKeys.map((dateKey) => ({
        group_id: schedule.groupId,
        date_key: dateKey,
        type: schedule.type,
        start_time: schedule.startTime,
        memo: schedule.memo,
        range_start: schedule.rangeStart,
        range_end: schedule.rangeEnd,
      }));

      const { error: insertError } = await client.from("schedules").insert(rows);
      if (insertError) throw insertError;

      sendJson(response, 200, { schedules: await fetchScheduleRows(client) });
      return;
    }

    if (request.method === "DELETE") {
      const body = await readJsonBody(request);
      const groupId = sanitizeText(body.groupId, 120);

      if (!groupId) throw fail(400, "Missing schedule group id.");

      const { error } = await client
        .from("schedules")
        .delete()
        .eq("group_id", groupId);

      if (error) throw error;

      sendJson(response, 200, { schedules: await fetchScheduleRows(client) });
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Unknown error",
    });
  }
}

const SCHEDULES_API_URL = "/api/schedules";

async function requestJson(options = {}) {
  const response = await fetch(SCHEDULES_API_URL, {
    ...options,
    headers: {
      accept: "application/json",
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    throw new Error(data?.error || "Schedule request failed.");
  }

  return data;
}

export function rowsToScheduleMap(rows) {
  const map = {};

  for (const row of rows) {
    map[row.date_key] = {
      groupId: row.group_id,
      type: row.type,
      startTime: row.start_time || "",
      memo: row.memo || "",
      rangeStart: row.range_start || row.date_key,
      rangeEnd: row.range_end || row.date_key,
    };
  }

  return map;
}

export async function fetchSchedules() {
  const data = await requestJson();
  return rowsToScheduleMap(data.schedules || []);
}

export async function saveScheduleGroup({
  groupId,
  existingGroupId,
  type,
  startTime,
  memo,
  rangeStart,
  rangeEnd,
  rangeKeys,
}) {
  const data = await requestJson({
    method: "POST",
    body: JSON.stringify({
      groupId,
      existingGroupId,
      type,
      startTime,
      memo,
      rangeStart,
      rangeEnd,
      rangeKeys,
    }),
  });

  return rowsToScheduleMap(data.schedules || []);
}

export async function deleteScheduleGroup(groupId) {
  const data = await requestJson({
    method: "DELETE",
    body: JSON.stringify({ groupId }),
  });

  return rowsToScheduleMap(data.schedules || []);
}

const HOTCLIPS_API_URL = "/api/hotclips";

async function requestJson(options = {}) {
  const response = await fetch(HOTCLIPS_API_URL, {
    ...options,
    headers: {
      accept: "application/json",
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    throw new Error(data?.error || "Hotclip request failed.");
  }

  return data;
}

export async function fetchHotclips() {
  const data = await requestJson();
  return data.items || [];
}

export async function saveHotclip(clip) {
  const data = await requestJson({
    method: "POST",
    body: JSON.stringify(clip),
  });

  return data.item;
}

export async function deleteHotclip(id) {
  const data = await requestJson({
    method: "DELETE",
    body: JSON.stringify({ id }),
  });

  return data.items || [];
}

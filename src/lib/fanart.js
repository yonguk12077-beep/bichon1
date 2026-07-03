const FANART_API_URL = "/api/fanart";
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

async function requestJson(options = {}) {
  const response = await fetch(FANART_API_URL, {
    ...options,
    headers: {
      accept: "application/json",
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    throw new Error(data?.error || "Fanart request failed.");
  }

  return data;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function fetchFanart() {
  const data = await requestJson();
  return data.items || [];
}

export async function uploadFanart(file) {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Fanart image is too large.");
  }

  const data = await requestJson({
    method: "POST",
    body: JSON.stringify({
      title: file.name.replace(/\.[^/.]+$/, ""),
      fileName: file.name,
      dataUrl: await readFileAsDataUrl(file),
    }),
  });

  return data.item;
}

export async function deleteFanart(item) {
  await requestJson({
    method: "DELETE",
    body: JSON.stringify({
      id: item.id,
      storagePath: item.storagePath,
    }),
  });
}

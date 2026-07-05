const UPBO_API_URL = "/api/upbo";
const MAX_FILE_BYTES = 5 * 1024 * 1024;

async function requestJson(options = {}) {
  const response = await fetch(UPBO_API_URL, {
    ...options,
    headers: {
      accept: "application/json",
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    throw new Error(data?.error || "Upbo request failed.");
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

export async function fetchUpboFiles() {
  const data = await requestJson();
  return data.items || [];
}

export async function uploadUpboFile(file) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Upbo file is too large.");
  }

  const data = await requestJson({
    method: "POST",
    body: JSON.stringify({
      title: file.name,
      fileName: file.name,
      dataUrl: await readFileAsDataUrl(file),
    }),
  });

  return data.item;
}

export async function deleteUpboFile(item) {
  const data = await requestJson({
    method: "DELETE",
    body: JSON.stringify({
      id: item.id,
      storagePath: item.storagePath,
    }),
  });

  return data.items || [];
}

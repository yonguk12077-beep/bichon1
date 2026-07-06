const UPBO_API_URL = "/api/upbo";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const GOOGLE_SHORTCUT_TYPES = {
  gdoc: "application/vnd.google-apps.document",
  gsheet: "application/vnd.google-apps.spreadsheet",
  gsheeet: "application/vnd.google-apps.spreadsheet",
  gslides: "application/vnd.google-apps.presentation",
};

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

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function getExtension(fileName) {
  return String(fileName || "").match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || "";
}

function isGoogleShortcutFile(file) {
  return Boolean(GOOGLE_SHORTCUT_TYPES[getExtension(file.name)]);
}

function normalizeGoogleUrl(value) {
  const href = String(value || "").trim();

  if (!/^https:\/\/(?:docs|drive)\.google\.com\//.test(href)) {
    return "";
  }

  return href;
}

async function saveUpboLink({ title, fileName, href, contentType }) {
  const data = await requestJson({
    method: "POST",
    body: JSON.stringify({
      title,
      fileName,
      href,
      contentType,
    }),
  });

  return data.item;
}

async function readGoogleShortcut(file) {
  const extension = getExtension(file.name);
  const contentType = GOOGLE_SHORTCUT_TYPES[extension];

  if (!contentType) return null;

  const rawText = String(await readFileAsText(file) || "").replace(/^\uFEFF/, "").trim();
  let shortcut;

  try {
    shortcut = JSON.parse(rawText);
  } catch {
    shortcut = {};
  }

  const normalizedText = rawText.replace(/\\\//g, "/");
  const fallbackUrl = normalizedText.match(/https?:\/\/(?:docs|drive)\.google\.com\/[^"'\s}]+/)?.[0] || "";
  const href = normalizeGoogleUrl(shortcut.url || shortcut.targetUrl || shortcut.target_url || fallbackUrl);

  if (!href) {
    throw new Error("구글 시트 바로가기 파일에서 링크를 읽을 수 없습니다.");
  }

  return { href, contentType };
}

async function requestGoogleShortcutUrl(file) {
  const contentType = GOOGLE_SHORTCUT_TYPES[getExtension(file.name)];
  const pastedUrl = window.prompt(
    "이 구글 드라이브 바로가기 파일은 브라우저에서 직접 읽을 수 없어요.\n구글 시트를 열고 공유 링크를 붙여넣어 주세요."
  );
  const href = normalizeGoogleUrl(pastedUrl);

  if (!href) {
    throw new Error("구글 시트 공유 링크가 필요합니다.");
  }

  return { href, contentType };
}

export async function fetchUpboFiles() {
  const data = await requestJson();
  return data.items || [];
}

export async function uploadUpboFile(file) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Upbo file is too large.");
  }

  let googleShortcut = null;

  if (isGoogleShortcutFile(file)) {
    try {
      googleShortcut = await readGoogleShortcut(file);
    } catch {
      googleShortcut = await requestGoogleShortcutUrl(file);
    }
  }

  if (googleShortcut) {
    return saveUpboLink({
      title: file.name,
      fileName: file.name,
      href: googleShortcut.href,
      contentType: googleShortcut.contentType,
    });
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

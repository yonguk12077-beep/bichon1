import { fail, getSupabaseClient, readJsonBody, sanitizeText, sendJson } from "./_supabase.js";

const HOTCLIP_CATEGORIES = new Set(["battlegrounds", "minecraft", "jandi", "fulltrack"]);
const GENERIC_HOTCLIP_TITLES = new Set(["Hot Clip", "핫클립", "SOOP 핫클립"]);

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function getMetaContent(html, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapedSelector}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const reversePattern = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapedSelector}["'][^>]*>`,
    "i"
  );

  return decodeHtml(html.match(pattern)?.[1] || html.match(reversePattern)?.[1] || "");
}

function getTitleTag(html) {
  return decodeHtml(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "");
}

function sanitizeUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function resolveUrl(value, baseUrl) {
  try {
    return new URL(String(value || "").trim(), baseUrl).toString();
  } catch {
    return "";
  }
}

async function fetchHotclipMeta(url) {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Mozilla/5.0 BichonFanpageBot/1.0",
      },
    });

    if (!response.ok) return {};

    const html = await response.text();
    const title =
      getMetaContent(html, "og:title") ||
      getMetaContent(html, "twitter:title") ||
      getTitleTag(html);
    const thumbnail =
      getMetaContent(html, "og:image") ||
      getMetaContent(html, "twitter:image");

    return {
      title: sanitizeText(title.replace(/\s*-\s*SOOP.*$/i, ""), 140),
      thumbnail: sanitizeUrl(resolveUrl(thumbnail, url)),
    };
  } catch {
    return {};
  }
}

function shouldRefreshMeta(row) {
  return !row.thumbnail || !row.title || GENERIC_HOTCLIP_TITLES.has(row.title);
}

function rowToHotclip(row) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    href: row.href,
    thumbnail: row.thumbnail || "",
    embedUrl: row.embed_url || "",
    createdAt: row.created_at || "",
  };
}

function normalizeHotclipPayload(payload) {
  const category = sanitizeText(payload.category, 40);
  const href = sanitizeUrl(payload.href);

  if (!HOTCLIP_CATEGORIES.has(category)) throw fail(400, "Invalid hotclip category.");
  if (!href) throw fail(400, "Invalid hotclip URL.");

  return {
    category,
    title: sanitizeText(payload.title, 140) || "Hot Clip",
    href,
    thumbnail: sanitizeUrl(payload.thumbnail),
    embedUrl: sanitizeUrl(payload.embedUrl),
  };
}

async function fetchHotclipRows(client) {
  const { data, error } = await client
    .from("hotclips")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return Promise.all((data || []).map(async (row) => {
    if (!shouldRefreshMeta(row)) return rowToHotclip(row);

    const meta = await fetchHotclipMeta(row.href);
    const nextTitle = GENERIC_HOTCLIP_TITLES.has(row.title) && meta.title ? meta.title : row.title;
    const nextThumbnail = row.thumbnail || meta.thumbnail || "";

    if (nextTitle !== row.title || nextThumbnail !== row.thumbnail) {
      await client
        .from("hotclips")
        .update({
          title: nextTitle,
          thumbnail: nextThumbnail,
        })
        .eq("id", row.id);
    }

    return rowToHotclip({
      ...row,
      title: nextTitle,
      thumbnail: nextThumbnail,
    });
  }));
}

export default async function handler(request, response) {
  try {
    const client = getSupabaseClient();

    if (request.method === "GET") {
      sendJson(response, 200, { items: await fetchHotclipRows(client) });
      return;
    }

    if (request.method === "POST" || request.method === "PUT") {
      const hotclip = normalizeHotclipPayload(await readJsonBody(request));
      const meta = await fetchHotclipMeta(hotclip.href);
      const title = GENERIC_HOTCLIP_TITLES.has(hotclip.title) && meta.title ? meta.title : hotclip.title;
      const thumbnail = hotclip.thumbnail || meta.thumbnail || "";
      const { data, error } = await client
        .from("hotclips")
        .insert({
          category: hotclip.category,
          title,
          href: hotclip.href,
          thumbnail,
          embed_url: hotclip.embedUrl,
        })
        .select("*")
        .single();

      if (error) throw error;

      sendJson(response, 200, { item: rowToHotclip(data) });
      return;
    }

    if (request.method === "DELETE") {
      const body = await readJsonBody(request);
      const id = sanitizeText(body.id, 120);

      if (!id) throw fail(400, "Missing hotclip id.");

      const { error } = await client
        .from("hotclips")
        .delete()
        .eq("id", id);

      if (error) throw error;

      sendJson(response, 200, { items: await fetchHotclipRows(client) });
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Unknown error",
    });
  }
}

import { fail, getSupabaseClient, readJsonBody, sanitizeText, sendJson } from "./_supabase.js";

const HOTCLIP_CATEGORIES = new Set(["battlegrounds", "minecraft"]);

function sanitizeUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
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
  return (data || []).map(rowToHotclip);
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
      const { data, error } = await client
        .from("hotclips")
        .insert({
          category: hotclip.category,
          title: hotclip.title,
          href: hotclip.href,
          thumbnail: hotclip.thumbnail,
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

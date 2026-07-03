/* global Buffer */

import { randomUUID } from "node:crypto";
import { fail, getSupabaseClient, readJsonBody, sanitizeText, sendJson } from "./_supabase.js";

const FANART_BUCKET = "fanart";
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function rowToGalleryItem(row) {
  return {
    id: row.id,
    title: row.title,
    src: row.image_url,
    storagePath: row.storage_path || "",
  };
}

function getExtension(contentType, fileName) {
  const byType = {
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const fromName = String(fileName || "").match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();

  return byType[contentType] || fromName || "png";
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw fail(400, "Invalid image data.");

  const contentType = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) throw fail(400, "Unsupported image type.");

  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length) throw fail(400, "Empty image.");
  if (buffer.length > MAX_IMAGE_BYTES) throw fail(413, "Image is too large.");

  return { buffer, contentType };
}

async function fetchFanartRows(client) {
  const { data, error } = await client
    .from("fanart")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(rowToGalleryItem);
}

export default async function handler(request, response) {
  try {
    const client = getSupabaseClient();

    if (request.method === "GET") {
      sendJson(response, 200, { items: await fetchFanartRows(client) });
      return;
    }

    if (request.method === "POST" || request.method === "PUT") {
      const body = await readJsonBody(request);
      const title = sanitizeText(body.title || body.fileName || "fanart", 120);
      const { buffer, contentType } = parseDataUrl(body.dataUrl);
      const storagePath = `${randomUUID()}.${getExtension(contentType, body.fileName)}`;

      const { error: uploadError } = await client.storage
        .from(FANART_BUCKET)
        .upload(storagePath, buffer, {
          cacheControl: "3600",
          contentType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = client.storage
        .from(FANART_BUCKET)
        .getPublicUrl(storagePath);

      const { data, error: insertError } = await client
        .from("fanart")
        .insert({
          title,
          image_url: publicData.publicUrl,
          storage_path: storagePath,
        })
        .select("*")
        .single();

      if (insertError) {
        await client.storage.from(FANART_BUCKET).remove([storagePath]);
        throw insertError;
      }

      sendJson(response, 200, { item: rowToGalleryItem(data) });
      return;
    }

    if (request.method === "DELETE") {
      const body = await readJsonBody(request);
      const id = sanitizeText(body.id, 120);

      if (!id) throw fail(400, "Missing fanart id.");

      const { data: existingItem, error: readError } = await client
        .from("fanart")
        .select("storage_path")
        .eq("id", id)
        .maybeSingle();

      if (readError) throw readError;
      if (existingItem?.storage_path) {
        await client.storage.from(FANART_BUCKET).remove([existingItem.storage_path]);
      }

      const { error } = await client
        .from("fanart")
        .delete()
        .eq("id", id);

      if (error) throw error;

      sendJson(response, 200, { items: await fetchFanartRows(client) });
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Unknown error",
    });
  }
}

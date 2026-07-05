/* global Buffer */

import { randomUUID } from "node:crypto";
import { fail, getSupabaseClient, readJsonBody, sanitizeText, sendJson } from "./_supabase.js";

const UPBO_BUCKET = "upbo";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  "application/msword",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv",
  "text/plain",
]);

const EXTENSION_TYPES = {
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  pdf: "application/pdf",
  png: "image/png",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  webp: "image/webp",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function rowToUpboFile(row) {
  return {
    id: row.id,
    title: row.title,
    fileName: row.file_name,
    href: row.file_url,
    storagePath: row.storage_path || "",
    contentType: row.content_type || "",
    sizeBytes: row.size_bytes || 0,
    createdAt: row.created_at || "",
  };
}

function getExtension(fileName) {
  return String(fileName || "").match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || "file";
}

function sanitizeFileName(value) {
  const fileName = String(value || "upbo-file").trim().replace(/[\\/:*?"<>|]+/g, "_");
  return fileName.slice(0, 180) || "upbo-file";
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

function getContentType(contentType, fileName) {
  const normalizedType = String(contentType || "").toLowerCase();
  const fallbackType = EXTENSION_TYPES[getExtension(fileName)] || "";

  if (ALLOWED_FILE_TYPES.has(normalizedType)) return normalizedType;
  if (fallbackType) return fallbackType;

  throw fail(400, "Unsupported file type.");
}

function parseDataUrl(dataUrl, fileName) {
  const match = String(dataUrl || "").match(/^data:([^;]*);base64,(.+)$/);
  if (!match) throw fail(400, "Invalid file data.");

  const contentType = getContentType(match[1], fileName);
  const buffer = Buffer.from(match[2], "base64");

  if (!buffer.length) throw fail(400, "Empty file.");
  if (buffer.length > MAX_FILE_BYTES) throw fail(413, "File is too large.");

  return { buffer, contentType };
}

async function fetchUpboRows(client) {
  const { data, error } = await client
    .from("upbo_files")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(rowToUpboFile);
}

export default async function handler(request, response) {
  try {
    const client = getSupabaseClient();

    if (request.method === "GET") {
      sendJson(response, 200, { items: await fetchUpboRows(client) });
      return;
    }

    if (request.method === "POST" || request.method === "PUT") {
      const body = await readJsonBody(request);
      const fileName = sanitizeFileName(body.fileName || body.title || "upbo-file");
      const title = sanitizeText(body.title || fileName, 180);
      const href = sanitizeUrl(body.href);

      if (href) {
        const { data, error } = await client
          .from("upbo_files")
          .insert({
            title,
            file_name: fileName,
            file_url: href,
            storage_path: null,
            content_type: sanitizeText(body.contentType || "link", 120),
            size_bytes: 0,
          })
          .select("*")
          .single();

        if (error) throw error;

        sendJson(response, 200, { item: rowToUpboFile(data) });
        return;
      }

      const { buffer, contentType } = parseDataUrl(body.dataUrl, fileName);
      const storagePath = `${randomUUID()}.${getExtension(fileName)}`;

      const { error: uploadError } = await client.storage
        .from(UPBO_BUCKET)
        .upload(storagePath, buffer, {
          cacheControl: "3600",
          contentType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = client.storage
        .from(UPBO_BUCKET)
        .getPublicUrl(storagePath);

      const { data, error: insertError } = await client
        .from("upbo_files")
        .insert({
          title,
          file_name: fileName,
          file_url: publicData.publicUrl,
          storage_path: storagePath,
          content_type: contentType,
          size_bytes: buffer.length,
        })
        .select("*")
        .single();

      if (insertError) {
        await client.storage.from(UPBO_BUCKET).remove([storagePath]);
        throw insertError;
      }

      sendJson(response, 200, { item: rowToUpboFile(data) });
      return;
    }

    if (request.method === "DELETE") {
      const body = await readJsonBody(request);
      const id = sanitizeText(body.id, 120);

      if (!id) throw fail(400, "Missing upbo file id.");

      const { data: existingItem, error: readError } = await client
        .from("upbo_files")
        .select("storage_path")
        .eq("id", id)
        .maybeSingle();

      if (readError) throw readError;
      if (existingItem?.storage_path) {
        await client.storage.from(UPBO_BUCKET).remove([existingItem.storage_path]);
      }

      const { error } = await client
        .from("upbo_files")
        .delete()
        .eq("id", id);

      if (error) throw error;

      sendJson(response, 200, { items: await fetchUpboRows(client) });
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Unknown error",
    });
  }
}

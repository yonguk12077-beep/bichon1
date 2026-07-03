/* global Buffer, process */

import { createClient } from "@supabase/supabase-js";

let cachedClient = null;

export function getSupabaseConfig() {
  return {
    url: (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, ""),
    key:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      "",
  };
}

export function getSupabaseClient() {
  const { url, key } = getSupabaseConfig();

  if (!url || !key) {
    const error = new Error("Shared Supabase storage is not configured.");
    error.statusCode = 503;
    throw error;
  }

  if (!cachedClient) {
    cachedClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return cachedClient;
}

export async function readJsonBody(request) {
  if (request.body) {
    if (typeof request.body === "string") return JSON.parse(request.body);
    if (Buffer.isBuffer(request.body)) return JSON.parse(request.body.toString("utf8"));
    return request.body;
  }

  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

export function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("cache-control", "no-store");
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

export function sanitizeText(value, maxLength = 120) {
  return String(value || "").trim().slice(0, maxLength);
}

export function fail(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

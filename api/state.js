/* global Buffer, process */

const STATE_KEY = "bichon:fanpage:shared-state";

function createEmptyGallery() {
  return {
    fanart: [],
  };
}

function createEmptyState() {
  return {
    schedules: {},
    galleryItems: createEmptyGallery(),
    userClips: [],
  };
}

function normalizeState(state) {
  return {
    ...createEmptyState(),
    ...(state && typeof state === "object" ? state : {}),
    galleryItems: {
      ...createEmptyGallery(),
      ...(state?.galleryItems || {}),
    },
  };
}

function getRedisConfig() {
  return {
    url: (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, ""),
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "",
  };
}

function getSupabaseConfig() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "",
  };
}

function isWriteAuthorized(request) {
  const writeToken = process.env.SHARED_WRITE_TOKEN || "";

  if (!writeToken) return false;
  return request.headers["x-shared-write-token"] === writeToken;
}

async function redisCommand(command) {
  const { url, token } = getRedisConfig();

  if (!url || !token) {
    const error = new Error("Shared storage is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const redisResponse = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!redisResponse.ok) {
    const error = new Error("Shared storage request failed.");
    error.statusCode = redisResponse.status;
    throw error;
  }

  return redisResponse.json();
}

async function fetchSupabaseState() {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  const targetUrl = `${url}/rest/v1/bichon_state?id=eq.default`;
  const response = await fetch(targetUrl, {
    method: "GET",
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Supabase table 'bichon_state' not found. Please create the table in Supabase first.");
    }
    throw new Error(`Supabase request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data) && data.length > 0) {
    return data[0].state;
  }
  return null;
}

async function saveSupabaseState(state) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error("Supabase is not configured.");
  }

  const targetUrl = `${url}/rest/v1/bichon_state`;
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id: "default",
      state: state,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Supabase save failed with status ${response.status}`);
  }
}

async function readRequestBody(request) {
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

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("cache-control", "no-store");
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

export default async function handler(request, response) {
  try {
    const supabaseConfig = getSupabaseConfig();
    const redisConfig = getRedisConfig();

    const isSupabaseEnabled = !!(supabaseConfig.url && supabaseConfig.key);
    const isRedisEnabled = !!(redisConfig.url && redisConfig.token);

    if (!isSupabaseEnabled && !isRedisEnabled) {
      sendJson(response, 503, {
        error: "Shared storage is not configured. Please set environment variables for Vercel KV (Redis) or Supabase.",
      });
      return;
    }

    if (request.method === "GET") {
      let state = null;
      if (isSupabaseEnabled) {
        state = await fetchSupabaseState();
      } else if (isRedisEnabled) {
        const { result } = await redisCommand(["GET", STATE_KEY]);
        state = result ? JSON.parse(result) : null;
      }

      sendJson(response, 200, normalizeState(state || createEmptyState()));
      return;
    }

    if (request.method === "PUT" || request.method === "POST") {
      if (!isWriteAuthorized(request)) {
        sendJson(response, 401, { error: "Write access is not authorized." });
        return;
      }

      const state = normalizeState(await readRequestBody(request));

      if (isSupabaseEnabled) {
        await saveSupabaseState(state);
      } else if (isRedisEnabled) {
        await redisCommand(["SET", STATE_KEY, JSON.stringify(state)]);
      }

      sendJson(response, 200, state);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Unknown error",
    });
  }
}

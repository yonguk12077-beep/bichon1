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
    if (request.method === "GET") {
      const { result } = await redisCommand(["GET", STATE_KEY]);
      const state = result ? JSON.parse(result) : createEmptyState();

      sendJson(response, 200, normalizeState(state));
      return;
    }

    if (request.method === "PUT" || request.method === "POST") {
      if (!isWriteAuthorized(request)) {
        sendJson(response, 401, { error: "Write access is not authorized." });
        return;
      }

      const state = normalizeState(await readRequestBody(request));

      await redisCommand(["SET", STATE_KEY, JSON.stringify(state)]);
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

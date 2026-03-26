const SUPABASE_URL = process.env.SUPABASE_URL || "https://povizsshrvyqcaszwzmr.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_NOTIFY_TO = splitList(process.env.CONTACT_NOTIFY_TO);
const CONTACT_NOTIFY_TO_OASIS = splitList(process.env.CONTACT_NOTIFY_TO_OASIS);
const CONTACT_NOTIFY_TO_CORNERSTONE = splitList(process.env.CONTACT_NOTIFY_TO_CORNERSTONE);
const CONTACT_NOTIFY_TO_STILL_DECIDING = splitList(process.env.CONTACT_NOTIFY_TO_STILL_DECIDING);
const CONTACT_NOTIFY_BCC = splitList(process.env.CONTACT_NOTIFY_BCC);
const CONTACT_NOTIFY_FROM = process.env.CONTACT_NOTIFY_FROM || "VUE Communities <onboarding@resend.dev>";
const CONTACT_ALLOWED_ORIGINS = splitList(process.env.CONTACT_ALLOWED_ORIGINS);
const CONTACT_RATE_LIMIT_MAX = parsePositiveInt(process.env.CONTACT_RATE_LIMIT_MAX, 5);
const CONTACT_RATE_LIMIT_WINDOW_MS = parsePositiveInt(process.env.CONTACT_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000);
const ALLOWED_COMMUNITIES = new Set(["The Oasis", "Cornerstone", "Still deciding"]);
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
const RATE_LIMIT_BUCKET = globalThis.__vueContactRateLimit ?? new Map();
globalThis.__vueContactRateLimit = RATE_LIMIT_BUCKET;

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function splitList(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sendJson(res, status, payload, extraHeaders = {}) {
  res.statusCode = status;
  Object.entries({ ...JSON_HEADERS, ...extraHeaders }).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(payload));
}

function normalizeString(value, maxLength) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeCommunity(value) {
  const community = normalizeString(value, 50);
  return ALLOWED_COMMUNITIES.has(community) ? community : "";
}

function parseJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.trim()) return JSON.parse(req.body);
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 64) {
        reject(new Error("Body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }

  return req.socket?.remoteAddress || "unknown";
}

function isAllowedOrigin(req) {
  if (!CONTACT_ALLOWED_ORIGINS.length) return true;
  const origin = normalizeString(req.headers.origin, 200);
  if (!origin) return true;
  return CONTACT_ALLOWED_ORIGINS.includes(origin);
}

function applyRateLimit(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowStart = now - CONTACT_RATE_LIMIT_WINDOW_MS;
  const existing = RATE_LIMIT_BUCKET.get(ip) || [];
  const active = existing.filter((timestamp) => timestamp > windowStart);

  if (active.length >= CONTACT_RATE_LIMIT_MAX) {
    const retryAfterSeconds = Math.max(1, Math.ceil((active[0] + CONTACT_RATE_LIMIT_WINDOW_MS - now) / 1000));
    return { ok: false, retryAfterSeconds };
  }

  active.push(now);
  RATE_LIMIT_BUCKET.set(ip, active);

  if (RATE_LIMIT_BUCKET.size > 5000) {
    for (const [key, timestamps] of RATE_LIMIT_BUCKET.entries()) {
      const fresh = timestamps.filter((timestamp) => timestamp > windowStart);
      if (fresh.length) RATE_LIMIT_BUCKET.set(key, fresh);
      else RATE_LIMIT_BUCKET.delete(key);
    }
  }

  return { ok: true };
}

function validateSubmission(payload) {
  const name = normalizeString(payload.name, 120);
  const email = normalizeString(payload.email, 160).toLowerCase();
  const phone = normalizeString(payload.phone, 40);
  const community = normalizeCommunity(payload.community);
  const moveIn = normalizeString(payload.moveIn ?? payload.move_in, 120);
  const message = normalizeString(payload.message, 4000);
  const website = normalizeString(payload.website, 120);

  if (website) {
    return { ok: false, status: 400, error: "Invalid submission." };
  }

  if (!name) {
    return { ok: false, status: 400, error: "Name is required." };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: "A valid email is required." };
  }

  if (payload.community && !community) {
    return { ok: false, status: 400, error: "Community must be The Oasis, Cornerstone, or Still deciding." };
  }

  return {
    ok: true,
    submission: {
      name,
      email,
      phone: phone || null,
      community: community || null,
      move_in: moveIn || null,
      message: message || null,
    },
  };
}

async function insertSubmission(submission) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/contact_submissions`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase insert failed (${response.status}): ${details}`);
  }

  const rows = await response.json();
  return rows[0] || submission;
}

function getNotificationRecipients(submission) {
  if (submission.community === "The Oasis") {
    return CONTACT_NOTIFY_TO_OASIS.length ? CONTACT_NOTIFY_TO_OASIS : CONTACT_NOTIFY_TO;
  }

  if (submission.community === "Cornerstone") {
    return CONTACT_NOTIFY_TO_CORNERSTONE.length ? CONTACT_NOTIFY_TO_CORNERSTONE : CONTACT_NOTIFY_TO;
  }

  if (submission.community === "Still deciding") {
    return CONTACT_NOTIFY_TO_STILL_DECIDING.length ? CONTACT_NOTIFY_TO_STILL_DECIDING : CONTACT_NOTIFY_TO;
  }

  return CONTACT_NOTIFY_TO;
}

async function sendNotification(submission, req) {
  const to = getNotificationRecipients(submission);
  if (!RESEND_API_KEY || !to.length) return { skipped: true };

  const subject = `New VUE Communities inquiry${submission.community ? ` - ${submission.community}` : ""}`;
  const ip = getClientIp(req);
  const origin = normalizeString(req.headers.origin, 200) || "Not provided";
  const referrer = normalizeString(req.headers.referer, 500) || "Not provided";
  const userAgent = normalizeString(req.headers["user-agent"], 500) || "Not provided";
  const lines = [
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Phone: ${submission.phone || "Not provided"}`,
    `Community: ${submission.community || "Still deciding / not provided"}`,
    `Preferred move-in: ${submission.move_in || "Not provided"}`,
    `IP: ${ip}`,
    `Origin: ${origin}`,
    `Referrer: ${referrer}`,
    `User agent: ${userAgent}`,
    "",
    submission.message || "No additional notes provided.",
  ];

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0d2744;max-width:680px;margin:0 auto;padding:24px;">
      <h1 style="margin:0 0 16px;font-size:24px;">New VUE Communities inquiry</h1>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tbody>
          ${[
            ["Name", submission.name],
            ["Email", submission.email],
            ["Phone", submission.phone || "Not provided"],
            ["Community", submission.community || "Still deciding / not provided"],
            ["Preferred move-in", submission.move_in || "Not provided"],
            ["IP", ip],
            ["Origin", origin],
            ["Referrer", referrer],
          ]
            .map(
              ([label, value]) => `
                <tr>
                  <td style="padding:8px 12px;border:1px solid #d8e1ec;background:#f6f9fc;font-weight:600;width:180px;">${escapeHtml(label)}</td>
                  <td style="padding:8px 12px;border:1px solid #d8e1ec;">${escapeHtml(value)}</td>
                </tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <h2 style="font-size:18px;margin:0 0 8px;">Message</h2>
      <div style="padding:16px;border:1px solid #d8e1ec;border-radius:12px;background:#ffffff;white-space:pre-wrap;">${escapeHtml(
        submission.message || "No additional notes provided.",
      )}</div>
      <p style="margin-top:20px;color:#5f6f81;font-size:13px;">User agent: ${escapeHtml(userAgent)}</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: CONTACT_NOTIFY_FROM,
      to,
      bcc: CONTACT_NOTIFY_BCC,
      reply_to: submission.email,
      subject,
      text: lines.join("\n"),
      html,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend notification failed (${response.status}): ${details}`);
  }

  return response.json();
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Allow", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.headers.origin && isAllowedOrigin(req)) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
      res.setHeader("Vary", "Origin");
    }
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    sendJson(res, 405, { ok: false, error: "Method not allowed." });
    return;
  }

  if (!isAllowedOrigin(req)) {
    sendJson(res, 403, { ok: false, error: "Origin not allowed." });
    return;
  }

  const contentType = normalizeString(req.headers["content-type"], 120).toLowerCase();
  if (contentType && !contentType.includes("application/json")) {
    sendJson(res, 415, { ok: false, error: "Content type must be application/json." });
    return;
  }

  const rateLimit = applyRateLimit(req);
  if (!rateLimit.ok) {
    sendJson(
      res,
      429,
      { ok: false, error: "Too many inquiries from this device. Please try again shortly." },
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
    return;
  }

  let payload;
  try {
    payload = await parseJsonBody(req);
  } catch {
    sendJson(res, 400, { ok: false, error: "Invalid request body." });
    return;
  }

  const validation = validateSubmission(payload);
  if (!validation.ok) {
    sendJson(res, validation.status, { ok: false, error: validation.error });
    return;
  }

  try {
    const inserted = await insertSubmission(validation.submission);

    try {
      await sendNotification(inserted, req);
    } catch (error) {
      console.error("Optional contact notification failed:", error);
    }

    sendJson(res, 200, { ok: true, submission: inserted });
  } catch (error) {
    console.error("Contact submission failed:", error);
    sendJson(res, 500, { ok: false, error: "Unable to submit inquiry right now." });
  }
};

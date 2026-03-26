const SUPABASE_URL = process.env.SUPABASE_URL || "https://povizsshrvyqcaszwzmr.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_NOTIFY_TO = process.env.CONTACT_NOTIFY_TO;
const CONTACT_NOTIFY_FROM = process.env.CONTACT_NOTIFY_FROM || "VUE Communities <onboarding@resend.dev>";
const ALLOWED_COMMUNITIES = new Set(["The Oasis", "Cornerstone", "Still deciding"]);
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function sendJson(res, status, payload) {
  res.statusCode = status;
  Object.entries(JSON_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(payload));
}

function normalizeString(value, maxLength) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.slice(0, maxLength);
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

async function sendNotification(submission) {
  if (!RESEND_API_KEY || !CONTACT_NOTIFY_TO) return { skipped: true };

  const subject = `New VUE Communities inquiry${submission.community ? ` - ${submission.community}` : ""}`;
  const lines = [
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Phone: ${submission.phone || "Not provided"}`,
    `Community: ${submission.community || "Still deciding / not provided"}`,
    `Preferred move-in: ${submission.move_in || "Not provided"}`,
    "",
    submission.message || "No additional notes provided.",
  ];

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: CONTACT_NOTIFY_FROM,
      to: [CONTACT_NOTIFY_TO],
      reply_to: submission.email,
      subject,
      text: lines.join("\n"),
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
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    sendJson(res, 405, { ok: false, error: "Method not allowed." });
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
      await sendNotification(inserted);
    } catch (error) {
      console.error("Optional contact notification failed:", error);
    }

    sendJson(res, 200, { ok: true, submission: inserted });
  } catch (error) {
    console.error("Contact submission failed:", error);
    sendJson(res, 500, { ok: false, error: "Unable to submit inquiry right now." });
  }
};

const SHEET_NAME = "Presentation Signups";
const ABUSE_SHEET_NAME = "Signup Abuse Log";
const CAPACITY = 10;
const TIME_ZONE = "America/New_York";
const REQUEST_LIMIT = 12;
const REQUEST_WINDOW_SECONDS = 15 * 60;
const PASSWORD_ATTEMPT_LIMIT = 6;
const PASSWORD_WINDOW_SECONDS = 30 * 60;
const SIGNUP_LIMIT = 3;
const SIGNUP_WINDOW_SECONDS = 60 * 60;

function doGet(event) {
  const requestedDate = String((event && event.parameter && event.parameter.date) || "");
  return jsonResponse_(getCurrentLineup_(requestedDate));
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
  } catch (error) {
    return jsonResponse_({ ok: false, error: "Signup is busy. Please try again shortly." });
  }
  try {
    const parameters = (event && event.parameter) || {};
    const clientKey = clientKey_(parameters.clientId);
    const requestRate = consumeRate_("request:" + clientKey, REQUEST_LIMIT, REQUEST_WINDOW_SECONDS);
    if (!requestRate.allowed) {
      if (requestRate.count === REQUEST_LIMIT + 1) {
        logAbuse_("request-limit", clientKey, requestRate.count + " requests");
      }
      return jsonResponse_({ ok: false, error: "Too many requests. Please try again later." });
    }
    if (String(parameters.website || "").trim()) {
      logAbuse_("bot-trap", clientKey, "Honeypot field was filled");
      return jsonResponse_({ ok: false, error: "Unable to process signup." });
    }
    if ((parameters.action || "signup") !== "signup") {
      logAbuse_("unknown-action", clientKey, String(parameters.action || ""));
      return jsonResponse_({ ok: false, error: "Unknown action." });
    }
    if (!isTuesday_()) {
      return jsonResponse_({ ok: false, error: "Demo signup is only available on Tuesdays." });
    }

    const expectedPassword = PropertiesService.getScriptProperties().getProperty("DEMO_SIGNUP_PASSWORD");
    if (!expectedPassword) {
      return jsonResponse_({ ok: false, error: "Demo signup password is not configured." });
    }
    const password = String(parameters.password || "");
    if (rateCount_("password:" + clientKey) >= PASSWORD_ATTEMPT_LIMIT) {
      return jsonResponse_({ ok: false, error: "Too many incorrect attempts. Please try again later." });
    }
    if (password !== expectedPassword) {
      const passwordRate = consumeRate_("password:" + clientKey, PASSWORD_ATTEMPT_LIMIT, PASSWORD_WINDOW_SECONDS);
      if ([1, 3, PASSWORD_ATTEMPT_LIMIT].indexOf(passwordRate.count) !== -1) {
        logAbuse_("password-failure", clientKey, passwordRate.count + " failed attempts");
      }
      return jsonResponse_({
        ok: false,
        error: passwordRate.allowed ? "Incorrect demo signup password." : "Too many incorrect attempts. Please try again later."
      });
    }

    const signupRate = consumeRate_("signup:" + clientKey, SIGNUP_LIMIT, SIGNUP_WINDOW_SECONDS);
    if (!signupRate.allowed) {
      if (signupRate.count === SIGNUP_LIMIT + 1) {
        logAbuse_("signup-limit", clientKey, signupRate.count + " signup attempts");
      }
      return jsonResponse_({ ok: false, error: "Too many signup attempts. Please try again later." });
    }

    const name = normalizeName_(parameters.name);
    const instagram = normalizeInstagram_(parameters.instagram);
    const shareInstagram = String(parameters.shareInstagram || "") === "true";
    const instagramConsent = String(parameters.instagramConsent || "") === "true";
    if (!name) return jsonResponse_({ ok: false, error: "Please enter your name." });
    if (name.length > 60) return jsonResponse_({ ok: false, error: "Please use 60 characters or fewer." });
    if (instagram && !/^[a-z0-9._]{1,30}$/.test(instagram)) {
      return jsonResponse_({ ok: false, error: "Please enter a valid Instagram handle." });
    }

    const sheet = getSheet_();
    const meetingDate = currentMeetingTuesdayKey_();
    const presenters = presentersForDate_(sheet, meetingDate);
    if (presenters.some((presenter) => presenter.name.toLowerCase() === name.toLowerCase())) {
      return jsonResponse_({ ok: false, error: "That name is already signed up for this Tuesday." });
    }
    if (presenters.length >= CAPACITY) {
      return jsonResponse_({ ok: false, error: "This Tuesday’s demo list is full." });
    }
    sheet.appendRow([
      meetingDate,
      name,
      instagram,
      shareInstagram ? "Yes" : "No",
      instagramConsent ? "Yes" : "No",
      new Date()
    ]);
    presenters.push({ name, instagram: shareInstagram ? instagram : "" });
    return jsonResponse_({ ok: true, meetingDate, capacity: CAPACITY, presenters });
  } finally {
    lock.releaseLock();
  }
}

function normalizeName_(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeInstagram_(value) {
  return String(value || "").normalize("NFKC").trim().replace(/^@+/, "").toLowerCase();
}

function clientKey_(value) {
  const clientId = String(value || "");
  const safeId = /^[A-Za-z0-9_-]{16,80}$/.test(clientId) ? clientId : "missing-client-id";
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, safeId, Utilities.Charset.UTF_8);
  return digest.map(function (byte) { return (byte + 256).toString(16).slice(-2); }).join("").slice(0, 16);
}

function consumeRate_(key, limit, windowSeconds) {
  const cache = CacheService.getScriptCache();
  const cacheKey = "signup-rate:" + key;
  const count = Number(cache.get(cacheKey) || 0) + 1;
  cache.put(cacheKey, String(count), windowSeconds);
  return { allowed: count <= limit, count: count };
}

function rateCount_(key) {
  return Number(CacheService.getScriptCache().get("signup-rate:" + key) || 0);
}

function logAbuse_(type, clientKey, detail) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(ABUSE_SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(ABUSE_SHEET_NAME);
      sheet.appendRow(["Timestamp", "Event", "Client fingerprint", "Detail"]);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([new Date(), type, clientKey, String(detail || "").slice(0, 120)]);
  } catch (error) {
    console.warn("Could not write signup abuse log", error);
  }
}

function getCurrentLineup_(requestedDate) {
  const meetingDate = currentMeetingTuesdayKey_();
  // The public lineup only exposes the current signup cycle. On Tuesday this
  // points at the new date immediately, so last week's names cannot carry over.
  if (requestedDate && requestedDate !== meetingDate) {
    return { ok: true, meetingDate, capacity: CAPACITY, presenters: [] };
  }
  return { ok: true, meetingDate, capacity: CAPACITY, presenters: presentersForDate_(getSheet_(), meetingDate) };
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "Meeting date",
      "Name",
      "Instagram",
      "Share Instagram publicly",
      "Instagram posting permission",
      "Signed up at"
    ]);
    sheet.setFrozenRows(1);
  } else if (sheet.getRange(1, 3).getDisplayValue() === "Signed up at") {
    sheet.insertColumnsBefore(3, 3);
    setSignupHeaders_(sheet);
  } else if (sheet.getRange(1, 4).getDisplayValue() === "Signed up at") {
    sheet.insertColumnsBefore(4, 2);
    setSignupHeaders_(sheet);
  }
  return sheet;
}

function setSignupHeaders_(sheet) {
  sheet.getRange(1, 1, 1, 6).setValues([[
    "Meeting date",
    "Name",
    "Instagram",
    "Share Instagram publicly",
    "Instagram posting permission",
    "Signed up at"
  ]]);
}

function presentersForDate_(sheet, date) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 4).getDisplayValues()
    .filter((row) => row[0] === date && row[1])
    .map((row) => ({ name: row[1], instagram: row[3] === "Yes" ? row[2] : "" }))
    .slice(0, CAPACITY);
}

function currentMeetingTuesdayKey_() {
  const localDate = Utilities.formatDate(new Date(), TIME_ZONE, "yyyy-MM-dd");
  const parts = localDate.split("-").map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const daysSinceTuesday = (date.getUTCDay() - 2 + 7) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceTuesday);
  return Utilities.formatDate(date, "UTC", "yyyy-MM-dd");
}

function isTuesday_() {
  const localDate = Utilities.formatDate(new Date(), TIME_ZONE, "yyyy-MM-dd");
  const parts = localDate.split("-").map(Number);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).getUTCDay() === 2;
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

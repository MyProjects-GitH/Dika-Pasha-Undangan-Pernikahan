const SHEET_NAME = "Ucapan";
const HEADERS = ["ID", "Waktu", "Nama", "Ucapan"];
const RSVP_SHEET_NAME = "RSVP";
const RSVP_HEADERS = ["ID", "Waktu", "Nama", "Kehadiran", "Jumlah Tamu"];

function doGet(e) {
  const callback = e && e.parameter ? e.parameter.callback : "";
  if (e && e.parameter && e.parameter.action === "rsvp-status") {
    try {
      const id = String(e.parameter.id || "").trim();
      if (!id || id.length > 80) throw new Error("ID RSVP tidak valid.");
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (!spreadsheet) throw new Error("Skrip harus terhubung ke Google Sheets.");
      const sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);
      return respond({ ok: true, exists: sheet ? hasSubmissionId(sheet, id) : false }, callback);
    } catch (error) {
      return respond({ ok: false, error: "Status RSVP gagal diperiksa." }, callback);
    }
  }

  try {
    const sheet = getWishesSheet();
    const lastRow = sheet.getLastRow();
    const wishes = lastRow < 2
      ? []
      : sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues().map((row) => ({
          id: String(row[0]),
          createdAt: row[1] instanceof Date ? row[1].toISOString() : String(row[1]),
          name: String(row[2]),
          message: String(row[3])
        }));
    return respond({ ok: true, wishes: wishes }, callback);
  } catch (error) {
    return respond({ ok: false, error: "Ucapan gagal dimuat." }, callback);
  }
}

function doPost(e) {
  const values = e && e.parameter ? e.parameter : {};
  const action = String(values.action || "wish");
  try {
    if (action === "rsvp") return saveRsvp(values);
    if (action !== "wish") throw new Error("Jenis data tidak dikenal.");

    const id = String(values.id || "").trim();
    const name = String(values.name || "").trim();
    const message = String(values.message || "").trim();
    if (!id || id.length > 80 || !name || name.length > 60 || !message || message.length > 300) {
      throw new Error("Data ucapan tidak valid.");
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getWishesSheet();
      if (hasSubmissionId(sheet, id)) return respond({ ok: true });
      sheet.appendRow([id, new Date(), name, message]);
    } finally {
      lock.releaseLock();
    }
    return respond({ ok: true });
  } catch (error) {
    const message = action === "rsvp" ? "Konfirmasi RSVP gagal disimpan." : "Ucapan gagal disimpan.";
    return respond({ ok: false, error: message });
  }
}

function saveRsvp(values) {
  const id = String(values.id || "").trim();
  const name = String(values.name || "").trim();
  const attendance = String(values.attendance || "").trim();
  const guests = Number(values.guests);
  if (!id || id.length > 80 || !name || name.length > 60
      || (attendance !== "Hadir" && attendance !== "Tidak hadir")
      || [1, 2, 3].indexOf(guests) === -1) {
    throw new Error("Data RSVP tidak valid.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getRsvpSheet();
    if (hasSubmissionId(sheet, id)) return respond({ ok: true });
    sheet.appendRow([id, new Date(), name, attendance, guests]);
  } finally {
    lock.releaseLock();
  }
  return respond({ ok: true });
}

function hasSubmissionId(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const existingIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  return existingIds.some((row) => String(row[0]) === id);
}

function getWishesSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Skrip harus terhubung ke Google Sheets.");
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  return sheet;
}

function getRsvpSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Skrip harus terhubung ke Google Sheets.");
  let sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(RSVP_SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(RSVP_HEADERS);
  return sheet;
}

function respond(data, callback) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  if (callback) {
    if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
      return ContentService.createTextOutput("Invalid callback")
        .setMimeType(ContentService.MimeType.TEXT);
    }
    return ContentService.createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

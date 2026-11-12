const SHEET_NAME = "Ucapan";
const HEADERS = ["ID", "Waktu", "Nama", "Ucapan"];

function doGet(e) {
  const callback = e && e.parameter ? e.parameter.callback : "";
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
  try {
    const values = e && e.parameter ? e.parameter : {};
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
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const existingIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
        if (existingIds.some((existingId) => String(existingId) === id)) {
          return respond({ ok: true });
        }
      }
      sheet.appendRow([id, new Date(), name, message]);
    } finally {
      lock.releaseLock();
    }
    return respond({ ok: true });
  } catch (error) {
    return respond({ ok: false, error: "Ucapan gagal disimpan." });
  }
}

function getWishesSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Skrip harus terhubung ke Google Sheets.");
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
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

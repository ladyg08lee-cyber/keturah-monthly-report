/**
 * Keturah Reserve — Monthly Project Report · live back-end (Google Apps Script)
 * ---------------------------------------------------------------------------
 * Stores the report data in your Google Drive, saves supporting files to Drive,
 * and keeps records in a Google Sheet (Change Log + Supporting Documents).
 *
 * One-time setup (see README.md):
 *   1. Paste this file into a new Apps Script project (script.google.com).
 *   2. Run  setup()  once and allow access. The log shows the team passcode,
 *      the Drive folder and the Records sheet.
 *   3. Deploy ▸ New deployment ▸ Web app — Execute as: Me · Who has access: Anyone.
 *   4. Copy the Web app URL into config.js in the GitHub repository.
 */
const PROPS = PropertiesService.getScriptProperties();
const KEEP_VERSIONS = 30;          // saved versions kept per report month (older ones are deleted for good)
const SESSION_MIN = 15;            // auto-saves by the same person within 15 minutes count as one editing session
const MAX_UPLOAD_MB = 25;          // largest supporting file accepted

function setup() {
  const p = PROPS.getProperties();
  const root = p.ROOT_ID ? DriveApp.getFolderById(p.ROOT_ID) : DriveApp.createFolder('Keturah Monthly Report — Live');
  const data = p.DATA_ID ? DriveApp.getFolderById(p.DATA_ID) : root.createFolder('Report Data (do not edit)');
  const sup = p.SUPPORT_ID ? DriveApp.getFolderById(p.SUPPORT_ID) : root.createFolder('Supporting Documents');
  let ss;
  if (p.SHEET_ID) ss = SpreadsheetApp.openById(p.SHEET_ID);
  else { ss = SpreadsheetApp.create('Keturah Monthly Report — Records'); DriveApp.getFileById(ss.getId()).moveTo(root); }
  ensureSheet_(ss, 'Change Log', ['Timestamp', 'Report', 'Version', 'Saved by', 'Note', 'Size (KB)', 'Data file']);
  ensureSheet_(ss, 'Supporting Documents', ['Timestamp', 'Report', 'Section ID', 'Section', 'File name', 'Type', 'Size (KB)', 'Uploaded by', 'Note', 'Drive link', 'File ID', 'Status', 'Status changed by', 'Status changed']);
  const s1 = ss.getSheetByName('Sheet1'); if (s1 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  const pass = p.PASSCODE || ('KR-' + Utilities.getUuid().slice(0, 8).toUpperCase());
  PROPS.setProperties({ ROOT_ID: root.getId(), DATA_ID: data.getId(), SUPPORT_ID: sup.getId(), SHEET_ID: ss.getId(), PASSCODE: pass,
                        ROOT_URL: root.getUrl(), SHEET_URL: ss.getUrl() });
  Logger.log('Setup complete.\nTeam passcode: ' + pass + '\nDrive folder: ' + root.getUrl() + '\nRecords sheet: ' + ss.getUrl());
}

/** Change the team passcode: edit the value below, then run this function once. */
function setPasscode() { PROPS.setProperty('PASSCODE', 'CHANGE-ME'); Logger.log('Passcode updated.'); }

function doGet() { return out_({ ok: true, service: 'Keturah Monthly Report', note: 'This address is used by the report page.' }); }

function doPost(e) {
  let q;
  try { q = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad-request' }); }
  const p = PROPS.getProperties();
  if (!p.PASSCODE) return out_({ ok: false, error: 'not-setup' });
  if (String(q.key || '') !== p.PASSCODE) return out_({ ok: false, error: 'auth' });
  try {
    switch (q.action) {
      case 'ping': return out_({ ok: true, folder: p.ROOT_URL || folderUrl_(p.ROOT_ID), sheet: p.SHEET_URL || sheetUrl_(p.SHEET_ID), reports: reports_() });
      case 'load': return load_(q, p);
      case 'save': return save_(q, p);
      case 'upload': return upload_(q, p);
      case 'remove': return remove_(q, p);
      case 'attachments': return out_({ ok: true, attachments: attachments_(q.report, p) });
      default: return out_({ ok: false, error: 'unknown-action' });
    }
  } catch (err) { return out_({ ok: false, error: String(err && err.message || err) }); }
}

/* ---------------- report data ---------------- */
function reports_() { try { return JSON.parse(PROPS.getProperty('REPORTS') || '{}'); } catch (e) { return {}; } }
function cleanId_(id) { return String(id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40); }

function load_(q, p) {
  const id = cleanId_(q.report), meta = reports_()[id];
  const att = JSON.stringify(attachments_(id, p));
  if (!meta) return out_('{"ok":true,"meta":null,"data":null,"attachments":' + att + '}');
  const content = DriveApp.getFileById(meta.fileId).getBlob().getDataAsString('UTF-8');
  return out_('{"ok":true,"meta":' + JSON.stringify(meta) + ',"attachments":' + att + ',"data":' + content + '}');
}

function save_(q, p) {
  const id = cleanId_(q.report); if (!id) return out_({ ok: false, error: 'no-report-id' });
  if (!q.data || !q.data.meta) return out_({ ok: false, error: 'no-data' });
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const reg = reports_(), cur = reg[id];
    if (cur && !q.force && Number(q.baseVersion) !== Number(cur.version))
      return out_({ ok: false, error: 'conflict', current: cur });
    const version = (cur ? Number(cur.version) : 0) + 1, user = String(q.user || ''), now = new Date();
    const auto = /^auto-save/i.test(String(q.note || ''));
    const stamp = Utilities.formatDate(now, 'Asia/Dubai', 'yyyy-MM-dd_HHmm');
    const content = JSON.stringify(q.data);
    const file = DriveApp.getFolderById(p.DATA_ID).createFile(
      Utilities.newBlob(content, 'application/json', id + '_v' + ('00' + version).slice(-3) + '_' + stamp + '.json'));
    const log = SpreadsheetApp.openById(p.SHEET_ID).getSheetByName('Change Log');
    // one editing session = one Change Log row and one stored version: an auto-save by the same person within
    // SESSION_MIN minutes of their previous auto-save replaces that version instead of adding another 9 MB copy
    const sameSession = auto && cur && cur.auto && cur.by === user && cur.logRow && (now - new Date(cur.at)) < SESSION_MIN * 60000;
    let logRow, saves = 1;
    if (sameSession) {
      saves = (Number(cur.saves) || 1) + 1; logRow = cur.logRow;
      log.getRange(logRow, 1, 1, 7).setValues([[now, id, version, user, 'Auto-save (' + saves + ' saves in this session)', Math.round(content.length / 1024), file.getUrl()]]);
      if (cur.fileId) deleteFile_(cur.fileId);
    } else {
      log.appendRow([now, id, version, user, String(q.note || ''), Math.round(content.length / 1024), file.getUrl()]);
      logRow = log.getLastRow();
    }
    reg[id] = { fileId: file.getId(), version: version, by: user, at: now.toISOString(), title: String(q.title || id).slice(0, 120),
                auto: auto, saves: saves, logRow: logRow };
    PROPS.setProperty('REPORTS', JSON.stringify(reg));
    prune_(p.DATA_ID, id, file.getId());
    return out_({ ok: true, meta: reg[id] });
  } finally { lock.releaseLock(); }
}

function prune_(folderId, id, keepId) {
  const files = [], it = DriveApp.getFolderById(folderId).getFiles();
  while (it.hasNext()) { const f = it.next(); if (f.getName().indexOf(id + '_v') === 0 && f.getId() !== keepId) files.push(f); }
  files.sort((a, b) => b.getDateCreated() - a.getDateCreated());
  files.slice(KEEP_VERSIONS - 1).forEach(f => deleteFile_(f.getId()));
}

/** Deletes a superseded data file for good (Drive service), so old copies do not fill the Drive trash. */
function deleteFile_(fileId) {
  try { Drive.Files.remove(fileId); }
  catch (e) { try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e2) {} }
}

/* ---------------- supporting documents ---------------- */
function subFolder_(parent, name) {
  const it = parent.getFoldersByName(name); return it.hasNext() ? it.next() : parent.createFolder(name);
}
function upload_(q, p) {
  const id = cleanId_(q.report); if (!id) return out_({ ok: false, error: 'no-report-id' });
  const bytes = Utilities.base64Decode(String(q.b64 || ''));
  if (!bytes.length) return out_({ ok: false, error: 'empty-file' });
  if (bytes.length > MAX_UPLOAD_MB * 1024 * 1024) return out_({ ok: false, error: 'file-too-large' });
  const section = String(q.sectionTitle || q.section || 'General').replace(/[\\/:*?"<>|]/g, '-').slice(0, 90);
  const folder = subFolder_(subFolder_(DriveApp.getFolderById(p.SUPPORT_ID), id), section);
  const name = String(q.name || 'file').slice(0, 180);
  const file = folder.createFile(Utilities.newBlob(bytes, String(q.mime || 'application/octet-stream'), name));
  file.setDescription('Keturah monthly report ' + id + ' · ' + section + ' · uploaded by ' + (q.user || '') + (q.note ? ' · ' + q.note : ''));
  const now = new Date();
  SpreadsheetApp.openById(p.SHEET_ID).getSheetByName('Supporting Documents').appendRow([
    now, id, String(q.section || ''), section, name, String(q.mime || ''), Math.round(bytes.length / 1024),
    String(q.user || ''), String(q.note || ''), file.getUrl(), file.getId(), 'Active', '', '']);
  return out_({ ok: true, attachment: { id: file.getId(), name: name, url: file.getUrl(), section: String(q.section || ''),
    sectionTitle: section, by: String(q.user || ''), at: now.toISOString(), kb: Math.round(bytes.length / 1024), note: String(q.note || '') } });
}

function attachments_(id, p) {
  const sh = SpreadsheetApp.openById(p.SHEET_ID).getSheetByName('Supporting Documents');
  const v = sh.getDataRange().getValues(); const outA = [];
  for (let i = 1; i < v.length; i++) {
    const r = v[i]; if (String(r[1]) !== String(id) || String(r[11]) !== 'Active') continue;
    outA.push({ id: String(r[10]), name: String(r[4]), url: String(r[9]), section: String(r[2]), sectionTitle: String(r[3]),
      by: String(r[7]), at: r[0] instanceof Date ? r[0].toISOString() : String(r[0]), kb: Number(r[6]) || 0, note: String(r[8]) });
  }
  return outA;
}

function remove_(q, p) {
  const sh = SpreadsheetApp.openById(p.SHEET_ID).getSheetByName('Supporting Documents');
  const v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][10]) === String(q.fileId) && String(v[i][11]) === 'Active') {
      sh.getRange(i + 1, 12, 1, 3).setValues([['Removed', String(q.user || ''), new Date()]]);
      try { DriveApp.getFileById(String(q.fileId)).setTrashed(true); } catch (e) {}
      return out_({ ok: true });
    }
  }
  return out_({ ok: false, error: 'not-found' });
}

/* ---------------- helpers ---------------- */
function ensureSheet_(ss, name, header) {
  let sh = ss.getSheetByName(name); if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) { sh.appendRow(header); sh.setFrozenRows(1); sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#EFECE5'); }
  return sh;
}
function folderUrl_(id) { try { return DriveApp.getFolderById(id).getUrl(); } catch (e) { return ''; } }
function sheetUrl_(id) { try { return SpreadsheetApp.openById(id).getUrl(); } catch (e) { return ''; } }
function out_(o) { return ContentService.createTextOutput(typeof o === 'string' ? o : JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

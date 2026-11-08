# Keturah Reserve — Monthly Project Report (team edition)

The interactive monthly report, live for the team:

* **Edit together** — ✎ Edit to change text, tables, figures; add or remove pages. **☁ Save to team** saves the report to Google Drive and records who saved it, when and why in the **Change Log**. If someone else saved in the meantime, the page warns before overwriting.
* **Supporting files** — in ✎ Edit mode every page has **📎 Attach file**. Files are saved in Google Drive (`Supporting Documents / <month> / <page>`) and logged in the **Supporting Documents** tab of the Records sheet. They show on their page and in the *Supporting Documents* register at the end of the report. Removing a file moves it to the Drive trash and marks the log row *Removed* (the record is kept).
* **PDF** — ⎙ Export PDF ▸ *Save as PDF* (A4 landscape, page layout built in).
* **HTML** — ⬇ Download HTML gives a stand-alone copy that works offline.
* **Months** — the month menu switches between saved months; **+ New month…** starts the next month as a copy of the current one.

**No project data is stored in this repository.** The page is only the template; the report content lives in your Google Drive and is opened with the team passcode.

---

## One-time setup (about 10 minutes)

### 1 · Back-end in your Google account
1. Go to <https://script.google.com> ▸ **New project**. Name it *Keturah Monthly Report*.
2. Delete the sample code, paste everything from [`apps-script/Code.gs`](apps-script/Code.gs), and save.
3. Choose **setup** in the function menu ▸ **Run** ▸ allow access (Drive + Sheets).
   The execution log shows the **team passcode**, the new Drive folder **Keturah Monthly Report — Live** and the **Records** sheet.
4. **Deploy ▸ New deployment ▸ Web app** — *Execute as:* **Me** · *Who has access:* **Anyone** ▸ Deploy. Copy the **Web app URL** (ends in `/exec`).

### 2 · Website on GitHub
1. Open `config.js` in this repository ▸ ✎ edit ▸ paste the Web app URL into `apiUrl` ▸ Commit.
2. **Settings ▸ Pages** ▸ *Source:* Deploy from a branch ▸ *Branch:* `main` / root ▸ Save.
   After a minute the report is live at `https://<your-user>.github.io/<repository>/`.

### 3 · First upload
Open the site, enter the passcode and your name. As no month is saved yet, choose the October report HTML file, then click **☁ Save to team**.

### 4 · Team access
* Send the team the site link and the passcode.
* To let them open attached files from the report, share the Drive folder **Keturah Monthly Report — Live ▸ Supporting Documents** with them (Viewer is enough).
* To change the passcode: in Apps Script edit `setPasscode()`, run it, and tell the team.

## Updating the back-end
After changing `Code.gs`: **Deploy ▸ Manage deployments ▸ ✎ ▸ Version: New version ▸ Deploy** (the URL stays the same).

## Limits
* Supporting files: up to 25 MB each.
* The 40 most recent saved versions of each month are kept in *Report Data (do not edit)*; older ones go to the Drive trash.

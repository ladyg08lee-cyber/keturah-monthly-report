# Keturah Reserve — Monthly Project Report (team edition)

**Open the report:** https://ladyg08lee-cyber.github.io/keturah-monthly-report/

The interactive monthly report, live for the whole team.

* **No passcode** — open the link, enter your name once (it is remembered on that computer).
* **Edit together** — ✎ Edit to change text, tables, figures, photos; add or remove pages.
* **Saved automatically** — changes are saved to Google Drive a few seconds after you stop typing, and straight away when you leave Edit mode. ☁ Save to team is still there if you want to add a note.
* **Always in sync** — every open copy checks Google every 45 seconds and refreshes with other people's changes. If two people edit the same month at once, the page warns before anything is overwritten.
* **Change record** — the *Change Log* tab of the Records sheet shows, for every save: date and time, month, version, **Updated by**, and **Changed items** (for example *Risk register (TH)*, *Authority approvals (MU)*, *Page: Cost Tracker / Summary – Infrastructure*). Auto-saves by the same person within 15 minutes are one row.
* **Supporting files** — in ✎ Edit mode every page has 📎 Attach file. Files go to Google Drive (*Supporting Documents / month / page*) and are logged in the *Supporting Documents* tab of the Records sheet (who, when, file, page, link). They show on their page and in the *Supporting Documents* register at the end of the report. Removing a file moves it to the Drive trash; the log row is kept, marked *Removed*.
* **PDF** — ⎙ Export PDF ▸ Save as PDF (A4 landscape, page layout built in).
* **HTML** — ⬇ Download HTML gives a stand-alone copy that works offline.
* **Months** — the month menu switches between saved months; **+ New month…** starts the next month as a copy of the current one.

No project data is stored in this repository — the page is only the template. The report content lives in the owner's Google Drive (*Keturah Monthly Report — Live*).

> **Access:** the site is public and has no passcode, so anyone with the link can view and edit the report. Share the link only with the team.

## How it is set up
* **Website:** this repository, published with GitHub Pages (`index.html`, `config.js`).
* **Back-end:** Google Apps Script project *Keturah Monthly Report* (code in [`apps-script/Code.gs`](apps-script/Code.gs)), deployed as a web app — *Execute as: Me · Who has access: Anyone*. The web-app address is in `config.js`.
* **Storage:** Drive folder *Keturah Monthly Report — Live* — *Report Data (do not edit)* (the 30 most recent saved versions of each month), *Supporting Documents*, and the *Keturah Monthly Report — Records* sheet (Change Log · Supporting Documents).

## Updating the back-end
Edit the code in Apps Script, then **Deploy ▸ Manage deployments ▸ ✎ ▸ Version: New version ▸ Deploy** (the address stays the same). Keep `apps-script/Code.gs` here as the matching copy.

## Limits
* Supporting files: up to 25 MB each.

# Apps Script Deployment

## Prerequisites
- Google account: mauricioromerolondono@gmail.com
- Google Sheet created with header row (see below)
- Google Drive folder created

## Step-by-step

1. **Create the Google Sheet**
   - Go to sheets.google.com → create new spreadsheet
   - Name it: "BREAD Mexico 2026 — Submissions"
   - Add header row: Timestamp | Author | Co-authors | Email | Affiliation | Current Title | Paper Title | Abstract | LAC-based | Mentoring | PDF Link | Status | Rating | Notes
   - Copy the Sheet ID from the URL (between /d/ and /edit)

2. **Create the Google Drive folder**
   - Go to drive.google.com → create new folder (ideally in a Shared Drive for institutional continuity)
   - Name it: "BREAD Mexico 2026 — Submissions"
   - Copy the Folder ID from the URL (after /folders/)
   - Share with committee members
   - **Backup:** Weekly, download the Sheet as CSV and save alongside the Drive folder

3. **Create the Apps Script**
   - Go to script.google.com → New Project
   - Replace Code.gs contents with the code from `Code.gs` in this directory
   - Update `SHEET_ID` and `DRIVE_FOLDER_ID` with your IDs
   - Update `SUBMISSION_DEADLINE` when the deadline is set

4. **Deploy as Web App**
   - Click Deploy → New deployment
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Click Deploy → Authorize when prompted
   - Copy the deployment URL

5. **Update the website**
   - In `script.js`, replace `APPS_SCRIPT_URL` with the deployment URL
   - Commit and push to GitHub

## Testing

Submit a test paper through the form. Verify:
- Row appears in the Sheet
- PDF appears in the Drive folder
- Success message shows on the form

## Re-deploying after changes

After editing Code.gs in the Apps Script editor:
- Deploy → Manage deployments → Edit → Version: New version → Deploy

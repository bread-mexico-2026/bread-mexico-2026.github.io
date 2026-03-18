// === CONFIGURATION ===
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
const DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID';
const SUBMISSION_DEADLINE = new Date('2026-08-15T23:59:59-06:00'); // Update when known

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 1. Honeypot check
    if (data.website && data.website.trim() !== '') {
      return jsonResponse({ success: true, message: 'Submission received.' }); // fake success
    }

    // 2. Deadline check
    if (new Date() > SUBMISSION_DEADLINE) {
      return jsonResponse({ success: false, message: 'Submissions are now closed.' });
    }

    // 3. Validate required text fields
    const textRequired = ['authors', 'email', 'affiliation', 'title', 'abstract', 'lac'];
    for (const field of textRequired) {
      if (!data[field] || String(data[field]).trim() === '') {
        return jsonResponse({ success: false, message: 'Missing required field: ' + field });
      }
    }
    if (!data.pdfBase64) {
      return jsonResponse({ success: false, message: 'Missing PDF upload.' });
    }

    // 4. Check file size before decoding (base64 is ~4/3 of actual size)
    var approxSize = data.pdfBase64.length * 3 / 4;
    if (approxSize > 20 * 1024 * 1024) {
      return jsonResponse({ success: false, message: 'PDF exceeds 20MB limit.' });
    }

    // 5. Decode and save PDF
    var pdfBlob = Utilities.newBlob(
      Utilities.base64Decode(data.pdfBase64),
      'application/pdf',
      buildFileName(data)
    );

    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var file = folder.createFile(pdfBlob);
    var pdfUrl = file.getUrl();

    // 6. Append row to Sheet
    var sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    var timestamp = new Date();
    sheet.appendRow([
      timestamp,
      data.authors,
      data.email,
      data.affiliation,
      data.title,
      data.abstract,
      data.lac,
      pdfUrl,
      'Received', // Status
      '',         // Rating
      ''          // Notes
    ]);

    return jsonResponse({ success: true, message: 'Submission received. Thank you!' });

  } catch (err) {
    console.error('doPost error:', err);
    return jsonResponse({ success: false, message: 'Server error: ' + err.message });
  }
}

function buildFileName(data) {
  var now = new Date();
  var ts = Utilities.formatDate(now, 'America/Mexico_City', 'yyyyMMdd-HHmmss');
  var emailPrefix = data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  var titleSlug = data.title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .slice(0, 5)
    .join('-');
  return ts + '_' + emailPrefix + '_' + titleSlug + '.pdf';
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

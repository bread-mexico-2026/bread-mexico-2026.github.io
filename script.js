/* =============================================================
   BREAD Mexico 2026 — script.js
   Tasks 6–7: form validation, word counter, localStorage,
   deadline check, PDF base64 encoding, Apps Script submission
============================================================= */

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyapomcvsI1EgkTNoL6PSIO8GXmqusdctdb8utAtrpS1vpOJAGHbvlTOe_nlOmxDbmJ/exec';

// Deadline: August 15 2026 23:59:59 CST (UTC-6)
const SUBMISSION_DEADLINE = new Date('2026-08-15T23:59:59-06:00');

const DRAFT_KEY = 'bread-submission-draft';

// Fields to persist in localStorage (excludes file input and honeypot)
const DRAFT_FIELDS = ['authors', 'coauthors', 'email', 'affiliation', 'currentTitle', 'title', 'abstract'];

// ---------------------------------------------------------------------------
// ELEMENT REFERENCES (resolved after DOMContentLoaded)
// ---------------------------------------------------------------------------

let abstractField;
let wordCountEl;

// ---------------------------------------------------------------------------
// WORD COUNTER
// ---------------------------------------------------------------------------

function countWords(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function updateWordCount() {
  const words = countWords(abstractField.value);
  wordCountEl.textContent = `${words} / 300 words`;
  wordCountEl.classList.toggle('over-limit', words > 300);
}

// ---------------------------------------------------------------------------
// LOCALSTORAGE DRAFT SAVE / RESTORE
// ---------------------------------------------------------------------------

function saveFormDraft() {
  const form = document.getElementById('submission-form');
  if (!form) return;

  const draft = {};

  // Text / email / textarea fields
  DRAFT_FIELDS.forEach(name => {
    const el = form.elements[name];
    if (el) draft[name] = el.value;
  });

  // Radio: lac
  const lacChecked = form.querySelector('input[name="lac"]:checked');
  draft.lac = lacChecked ? lacChecked.value : '';

  // Radio: mentoring
  const mentoringChecked = form.querySelector('input[name="mentoring"]:checked');
  draft.mentoring = mentoringChecked ? mentoringChecked.value : '';

  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function restoreFormDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return;

  let draft;
  try {
    draft = JSON.parse(raw);
  } catch (_) {
    return;
  }

  const form = document.getElementById('submission-form');
  if (!form) return;

  // Text / email / textarea fields
  DRAFT_FIELDS.forEach(name => {
    const el = form.elements[name];
    if (el && draft[name] !== undefined) {
      el.value = draft[name];
    }
  });

  // Radio: lac
  if (draft.lac) {
    const radio = form.querySelector(`input[name="lac"][value="${draft.lac}"]`);
    if (radio) radio.checked = true;
  }

  // Radio: mentoring
  if (draft.mentoring) {
    const radio = form.querySelector(`input[name="mentoring"][value="${draft.mentoring}"]`);
    if (radio) radio.checked = true;
  }
}

// ---------------------------------------------------------------------------
// CLIENT-SIDE VALIDATION
// ---------------------------------------------------------------------------

function validateForm(form) {
  const errors = [];

  // Required text fields
  const textFields = [
    { name: 'authors',      label: 'Author name(s)' },
    { name: 'email',        label: 'Contact email' },
    { name: 'affiliation',  label: 'Affiliation(s)' },
    { name: 'currentTitle', label: 'Current title' },
    { name: 'title',        label: 'Paper title' },
    { name: 'abstract',     label: 'Abstract' },
  ];

  textFields.forEach(({ name, label }) => {
    const el = form.elements[name];
    if (!el || el.value.trim() === '') {
      errors.push(`${label} is required`);
    }
  });

  // Email format
  const emailEl = form.elements.email;
  if (emailEl && emailEl.value.trim() !== '') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) {
      errors.push('Contact email is not a valid email address');
    }
  }

  // Abstract word count
  const abstractEl = form.elements.abstract;
  if (abstractEl && abstractEl.value.trim() !== '') {
    const words = countWords(abstractEl.value);
    if (words > 300) {
      errors.push(`Abstract exceeds 300 words (currently ${words} words)`);
    }
  }

  // LAC radio
  const lacChecked = form.querySelector('input[name="lac"]:checked');
  if (!lacChecked) {
    errors.push('Please indicate whether you are based in Latin America or the Caribbean');
  }

  // Mentoring radio
  const mentoringChecked = form.querySelector('input[name="mentoring"]:checked');
  if (!mentoringChecked) {
    errors.push('Please indicate whether you would like to participate in the mentoring program');
  }

  // PDF file
  const pdfEl = form.elements.pdf;
  if (!pdfEl || !pdfEl.files || pdfEl.files.length === 0) {
    errors.push('A PDF file is required');
  } else {
    const file = pdfEl.files[0];
    if (file.type !== 'application/pdf') {
      errors.push('The uploaded file must be a PDF');
    }
    if (file.size > 20 * 1024 * 1024) {
      errors.push('PDF file size must not exceed 20 MB');
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// DEADLINE CHECK
// ---------------------------------------------------------------------------

function isPastDeadline() {
  return new Date() > SUBMISSION_DEADLINE;
}

function checkDeadline() {
  if (isPastDeadline()) {
    const form = document.getElementById('submission-form');
    if (form) form.style.display = 'none';

    const notice = document.getElementById('deadline-notice');
    if (notice) {
      notice.style.display = 'block';
      notice.textContent = 'Submissions are now closed.';
    }
  }
}

// ---------------------------------------------------------------------------
// FILE TO BASE64
// ---------------------------------------------------------------------------

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// DROP ZONE INTERACTION
// ---------------------------------------------------------------------------

function initDropZone() {
  const dropZone = document.getElementById('drop-zone');
  const pdfInput = document.getElementById('pdf');
  if (!dropZone || !pdfInput) return;

  // Click on drop zone opens file picker
  dropZone.addEventListener('click', (e) => {
    // Avoid double-trigger if click lands directly on the input
    if (e.target !== pdfInput) {
      pdfInput.click();
    }
  });

  // Drag-and-drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Assign dropped file to the input so validation and submission work
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(files[0]);
      pdfInput.files = dataTransfer.files;
      updateDropZoneLabel(files[0]);
    }
  });

  // Show filename after selection via browser dialog
  pdfInput.addEventListener('change', () => {
    if (pdfInput.files.length > 0) {
      updateDropZoneLabel(pdfInput.files[0]);
    }
  });
}

function updateDropZoneLabel(file) {
  const dropZone = document.getElementById('drop-zone');
  if (!dropZone) return;
  const p = dropZone.querySelector('p');
  if (p) p.textContent = `Selected: ${file.name}`;
}

// ---------------------------------------------------------------------------
// FORM SUBMIT HANDLER
// ---------------------------------------------------------------------------

function initSubmitHandler() {
  const form = document.getElementById('submission-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const statusDiv = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');

    // Clear previous status
    statusDiv.className = '';
    statusDiv.textContent = '';

    const errors = validateForm(form);
    if (errors.length > 0) {
      statusDiv.className = 'error';
      statusDiv.textContent = errors.join('. ');
      return;
    }

    saveFormDraft();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    statusDiv.className = '';
    statusDiv.textContent = 'Uploading your paper. This may take a minute for large files.';

    try {
      const pdfFile = form.elements.pdf.files[0];
      const pdfBase64 = await fileToBase64(pdfFile);

      const mentoringEl = form.querySelector('input[name="mentoring"]:checked');
      const payload = {
        authors:      form.elements.authors.value.trim(),
        coauthors:    form.elements.coauthors ? form.elements.coauthors.value.trim() : '',
        email:        form.elements.email.value.trim(),
        affiliation:  form.elements.affiliation.value.trim(),
        currentTitle: form.elements.currentTitle.value.trim(),
        title:        form.elements.title.value.trim(),
        abstract:     form.elements.abstract.value.trim(),
        lac:          form.querySelector('input[name="lac"]:checked').value,
        mentoring:    mentoringEl ? mentoringEl.value : '',
        website:      form.elements.website ? form.elements.website.value : '', // honeypot
        pdfName:      pdfFile.name,
        pdfBase64:    pdfBase64,
      };

      // mode: 'no-cors' is required because Google Apps Script's redirect
      // chain does not include proper CORS headers. This means we get an
      // opaque response (can't read the body), but the request goes through.
      // Server-side errors are visible in the Apps Script execution logs.
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });

      // If fetch didn't throw, the request was sent successfully
      statusDiv.className = 'success';
      statusDiv.textContent = 'Submission received. Thank you!';
      form.reset();
      // Reset drop zone label
      const p = document.querySelector('#drop-zone p');
      if (p) p.textContent = 'Drop PDF here or click to browse';
      localStorage.removeItem(DRAFT_KEY);
      // Reset word counter
      updateWordCount();
    } catch (err) {
      statusDiv.className = 'error';
      statusDiv.textContent = 'Error: ' + err.message + ' (check browser console for details)';
      console.error('Submission error:', err);
      console.error('Error name:', err.name);
      console.error('Error stack:', err.stack);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Paper';
    }
  });
}

// ---------------------------------------------------------------------------
// DOMCONTENTLOADED WIRING
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  abstractField = document.getElementById('abstract');
  wordCountEl   = document.getElementById('word-count');

  // Attach word counter listener
  abstractField.addEventListener('input', updateWordCount);

  // Restore draft from localStorage
  restoreFormDraft();

  // Trigger deadline check (hides form if past deadline)
  checkDeadline();

  // Wire up submit handler
  initSubmitHandler();

  // Wire up drop zone
  initDropZone();

  // Update word counter to reflect restored draft
  abstractField.dispatchEvent(new Event('input'));

  // Save draft on every input change in the form
  const form = document.getElementById('submission-form');
  if (form) {
    form.addEventListener('input', saveFormDraft);
  }
});

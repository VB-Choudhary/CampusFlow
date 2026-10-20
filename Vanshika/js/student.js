/* ============================================================
   CampusFlow — js/student.js
   Student Dashboard logic
   Depends on: data.js, toast.js, nav.js, timeline.js, student360.js
   ============================================================ */

(function () {
  'use strict';

  var CF = window.CampusFlow;

  // For demo: the logged-in student
  var CURRENT_STUDENT = CF.STUDENTS[0];

  /* ── Init ──────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    CFNav.inject('student');
    lucide.createIcons();

    renderStats();
    renderHistory();
    setupUpload();
    setupForm();
    setupParentSimulation();
    setupDetailModal();

    // Responsive: stack columns on narrow screens
    if (window.innerWidth <= 700) {
      var layout = document.getElementById('cf-student-layout');
      if (layout) {
        layout.style.gridTemplateColumns = '1fr';
      }
    }
  });

  /* ── Stats ─────────────────────────────────────────────── */
  function renderStats() {
    var myReqs = CF.requestsByStudent(CURRENT_STUDENT.id);
    var pending   = myReqs.filter(function(r){ return CF.overallStatus(r) === 'pending'; }).length;
    var approved  = myReqs.filter(function(r){ return CF.overallStatus(r) === 'approved'; }).length;
    var rejected  = myReqs.filter(function(r){ return CF.overallStatus(r) === 'rejected'; }).length;

    var el = document.getElementById('cf-student-stats');
    if (!el) return;

    el.innerHTML =
      stat('file-text',      myReqs.length,              'Total Applications', 'primary') +
      stat('clock',          pending,                     'Pending',            'warning') +
      stat('check-circle',   approved,                    'Approved',           'success') +
      stat('calendar-days',  CURRENT_STUDENT.leaveBalance,'Leave Balance (days)','cyan');

    lucide.createIcons();
  }

  function stat(icon, value, label, color) {
    return '<div class="cf-stat">' +
      '<div class="cf-stat__icon cf-icon-bg--' + color + '">' +
        '<i data-lucide="' + icon + '" style="width:22px;height:22px"></i>' +
      '</div>' +
      '<div class="cf-stat__body">' +
        '<div class="cf-stat__value">' + value + '</div>' +
        '<div class="cf-stat__label">' + label + '</div>' +
      '</div>' +
    '</div>';
  }

  /* ── Leave History ─────────────────────────────────────── */
  function renderHistory() {
    var myReqs = CF.requestsByStudent(CURRENT_STUDENT.id);
    var el     = document.getElementById('cf-leave-history');
    if (!el) return;

    if (myReqs.length === 0) {
      el.innerHTML =
        '<div class="cf-empty">' +
          '<i data-lucide="inbox" class="cf-empty__icon" style="width:48px;height:48px"></i>' +
          '<div class="cf-empty__title">No leave applications yet</div>' +
          '<p>Submit your first application using the form.</p>' +
        '</div>';
      lucide.createIcons();
      return;
    }

    var html = '';
    myReqs.forEach(function (req) {
      var status    = CF.overallStatus(req);
      var badgeCls  = 'cf-badge--' + (status === 'pending' ? 'pending' : status === 'approved' ? 'approved' : 'rejected');
      var typeLabel = req.leaveType === 'vacation' ? '🏖️ Vacation' : '🏠 Normal';

      html += '<div style="padding:var(--cf-sp-4) var(--cf-sp-5);border-bottom:1px solid var(--cf-border);display:flex;align-items:center;gap:var(--cf-sp-4);flex-wrap:wrap">' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:700;font-size:var(--cf-fs-sm);margin-bottom:2px">' +
            req.id + ' · ' + typeLabel +
          '</div>' +
          '<div style="font-size:var(--cf-fs-xs);color:var(--cf-text-3)">' +
            CF.dateLabel(req.fromDate) + ' → ' + CF.dateLabel(req.toDate) +
            ' · ' + req.destination +
          '</div>' +
        '</div>' +
        '<span class="cf-badge ' + badgeCls + '">' + status.charAt(0).toUpperCase() + status.slice(1) + '</span>' +
        '<button class="cf-btn cf-btn--ghost cf-btn--sm cf-view-detail-btn" data-req-id="' + req.id + '">' +
          '<i data-lucide="eye" style="width:13px;height:13px"></i> View' +
        '</button>' +
      '</div>';
    });

    el.innerHTML = html;
    lucide.createIcons();

    // Wire up view buttons
    el.querySelectorAll('.cf-view-detail-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openDetailModal(btn.getAttribute('data-req-id'));
      });
    });
  }

  /* ── Detail Modal ──────────────────────────────────────── */
  function setupDetailModal() {
    document.getElementById('cf-detail-modal-close').addEventListener('click', closeDetailModal);
    document.getElementById('cf-detail-modal-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeDetailModal();
    });
  }

  function openDetailModal(reqId) {
    var req = CF.requestById(reqId);
    if (!req) return;
    var body = document.getElementById('cf-detail-modal-body');
    body.innerHTML =
      '<div style="margin-bottom:var(--cf-sp-4)">' +
        '<div class="cf-grid-2" style="gap:var(--cf-sp-3);margin-bottom:var(--cf-sp-4)">' +
          infoRow('Application ID', req.id) +
          infoRow('Leave Type', req.leaveType === 'vacation' ? 'Vacation' : 'Normal') +
          infoRow('From', CF.dateLabel(req.fromDate)) +
          infoRow('To',   CF.dateLabel(req.toDate)) +
          infoRow('Destination', req.destination) +
          infoRow('Submitted', CF.dateTimeLabel(req.submittedAt)) +
        '</div>' +
        '<p style="font-size:var(--cf-fs-sm);color:var(--cf-text-2);margin-bottom:var(--cf-sp-5);line-height:1.6">' +
          '<strong>Reason:</strong> ' + req.reason + '</p>' +
      '</div>' +
      '<h4 style="font-size:var(--cf-fs-sm);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--cf-text-3);margin-bottom:var(--cf-sp-3)">Workflow Progress</h4>' +
      '<div id="cf-modal-timeline"></div>';

    CFTimeline.render(document.getElementById('cf-modal-timeline'), req);
    document.getElementById('cf-detail-modal-overlay').classList.add('open');
    lucide.createIcons();
  }

  function closeDetailModal() {
    document.getElementById('cf-detail-modal-overlay').classList.remove('open');
  }

  function infoRow(label, value) {
    return '<div style="display:flex;flex-direction:column;gap:2px">' +
           '<span style="font-size:var(--cf-fs-xs);color:var(--cf-text-3)">' + label + '</span>' +
           '<span style="font-size:var(--cf-fs-sm);font-weight:600">' + (value || '—') + '</span>' +
           '</div>';
  }

  /* ── Upload & OCR Simulation ───────────────────────────── */
  function setupUpload() {
    var area      = document.getElementById('cf-upload-area');
    var fileInput = document.getElementById('cf-file-input');
    var skipBtn   = document.getElementById('cf-skip-upload-btn');

    if (!area) return;

    area.addEventListener('click',   function () { fileInput.click(); });
    area.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });

    area.addEventListener('dragover',  function (e) { e.preventDefault(); area.classList.add('drag-over'); });
    area.addEventListener('dragleave', function ()  { area.classList.remove('drag-over'); });
    area.addEventListener('drop',      function (e) {
      e.preventDefault();
      area.classList.remove('drag-over');
      var file = e.dataTransfer.files[0];
      if (file) processFile(file);
    });

    fileInput.addEventListener('change', function () {
      if (fileInput.files[0]) processFile(fileInput.files[0]);
    });

    skipBtn.addEventListener('click', function () {
      showForm(false);
    });
  }

  function processFile(file) {
    // Show OCR step
    document.getElementById('cf-upload-step').classList.add('hidden');
    document.getElementById('cf-ocr-step').classList.remove('hidden');

    // Show image preview
    var preview = document.getElementById('cf-ocr-preview');
    if (file.type.startsWith('image/')) {
      var reader = new FileReader();
      reader.onload = function (e) { preview.src = e.target.result; };
      reader.readAsDataURL(file);
    } else {
      preview.src = '';
      preview.style.display = 'none';
    }

    document.getElementById('cf-ocr-msg').textContent = 'Scanning "' + file.name + '"…';

    // Simulate OCR delay then pre-fill form
    setTimeout(function () {
      document.getElementById('cf-ocr-scanning-indicator').innerHTML =
        '<i data-lucide="check-circle" style="width:16px;height:16px;color:var(--cf-approved)"></i>' +
        '<span style="color:var(--cf-approved)">OCR extraction complete.</span>';
      lucide.createIcons();

      // Simulate extracted values
      document.getElementById('cf-f-name').value    = CURRENT_STUDENT.name;
      document.getElementById('cf-f-roll').value    = CURRENT_STUDENT.roll;
      document.getElementById('cf-f-hostel').value  = CURRENT_STUDENT.hostel;
      document.getElementById('cf-f-contact').value = CURRENT_STUDENT.contact;
      document.getElementById('cf-f-pname').value   = CURRENT_STUDENT.parentName;
      document.getElementById('cf-f-pphone').value  = CURRENT_STUDENT.parentPhone;

      setTimeout(function () {
        document.getElementById('cf-ocr-step').classList.add('hidden');
        showForm(true);
      }, 700);
    }, 2200);
  }

  function showForm(fromOcr) {
    document.getElementById('cf-upload-step').classList.add('hidden');
    document.getElementById('cf-ocr-step').classList.add('hidden');
    var reviewBanner = document.getElementById('cf-ocr-review-banner');
    if (!fromOcr) reviewBanner.classList.add('hidden');
    document.getElementById('cf-leave-form').classList.remove('hidden');
    updateEmailPreview();
  }

  /* ── Form ──────────────────────────────────────────────── */
  function setupForm() {
    var form     = document.getElementById('cf-leave-form');
    var backBtn  = document.getElementById('cf-form-back-btn');
    var newAppBtn = document.getElementById('cf-new-app-btn');

    if (!form) return;

    // Live email preview update
    ['cf-f-name','cf-f-roll','cf-f-pemail','cf-f-type','cf-f-from','cf-f-to','cf-f-dest','cf-f-reason'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', updateEmailPreview);
      if (el) el.addEventListener('change', updateEmailPreview);
    });

    backBtn.addEventListener('click', resetToUpload);

    newAppBtn && newAppBtn.addEventListener('click', resetToUpload);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleSubmit();
    });
  }

  function updateEmailPreview() {
    var name   = document.getElementById('cf-f-name').value   || '[Student Name]';
    var roll   = document.getElementById('cf-f-roll').value   || '[Roll]';
    var pname  = document.getElementById('cf-f-pname') && document.getElementById('cf-f-pname').value  || '[Parent Name]';
    var pemail = document.getElementById('cf-f-pemail').value || '[parent@email.com]';
    var type   = document.getElementById('cf-f-type').value;
    var from   = document.getElementById('cf-f-from').value;
    var to     = document.getElementById('cf-f-to').value;
    var dest   = document.getElementById('cf-f-dest').value   || '[Destination]';
    var reason = document.getElementById('cf-f-reason').value || '[Reason]';

    var typeLabel = type === 'vacation' ? 'Vacation Leave' : type === 'normal' ? 'Normal Leave' : '[Leave Type]';
    var dateRange = from && to ? CF.dateLabel(from) + ' to ' + CF.dateLabel(to) : '[Dates]';

    document.getElementById('cf-email-to').textContent = 'To: ' + pemail;
    document.getElementById('cf-email-body').textContent =
      'Dear ' + pname + ',\n\n' +
      'Your ward ' + name + ' (' + roll + ') has submitted a ' + typeLabel + ' application.\n\n' +
      'Destination: ' + dest + '\n' +
      'Duration:    ' + dateRange + '\n' +
      'Reason:      ' + reason + '\n\n' +
      'Please click one of the buttons below to APPROVE or REJECT this request.\n\n' +
      'Regards,\nCampusFlow System';
  }

  function handleSubmit() {
    var name   = document.getElementById('cf-f-name').value.trim();
    var roll   = document.getElementById('cf-f-roll').value.trim();
    var pname  = document.getElementById('cf-f-pname').value.trim();
    var pemail = document.getElementById('cf-f-pemail').value.trim();
    var type   = document.getElementById('cf-f-type').value;
    var from   = document.getElementById('cf-f-from').value;
    var to     = document.getElementById('cf-f-to').value;
    var dest   = document.getElementById('cf-f-dest').value.trim();
    var reason = document.getElementById('cf-f-reason').value.trim();

    if (!name || !roll || !pname || !pemail || !type || !from || !to || !dest || !reason) {
      CFToast.error('Please fill in all required fields.');
      return;
    }

    if (new Date(to) < new Date(from)) {
      CFToast.error('To date cannot be before From date.');
      return;
    }

    CF.submitLeave({
      studentId:    CURRENT_STUDENT.id,
      studentName:  name,
      roll:         roll,
      hostel:       (document.getElementById('cf-f-hostel').value || '').trim(),
      contact:      (document.getElementById('cf-f-contact').value || '').trim(),
      parentName:   pname,
      parentEmail:  pemail,
      parentPhone:  (document.getElementById('cf-f-pphone').value || '').trim(),
      leaveType:    type,
      destination:  dest,
      reason:       reason,
      fromDate:     from,
      toDate:       to
    });

    document.getElementById('cf-leave-form').classList.add('hidden');
    document.getElementById('cf-submit-success').classList.remove('hidden');

    CFToast.success('Application submitted! Parent approval email simulated.');
    renderStats();
    renderHistory();
    setupParentSimulation();
    lucide.createIcons();
  }

  function resetToUpload() {
    document.getElementById('cf-leave-form').classList.add('hidden');
    document.getElementById('cf-submit-success').classList.add('hidden');
    document.getElementById('cf-ocr-step').classList.add('hidden');
    document.getElementById('cf-upload-step').classList.remove('hidden');
    document.getElementById('cf-leave-form').reset();
    document.getElementById('cf-ocr-review-banner').classList.remove('hidden');
    lucide.createIcons();
  }

  /* ── Parent Email Simulation ───────────────────────────── */
  function setupParentSimulation() {
    var sel      = document.getElementById('cf-parent-req-sel');
    var noPend   = document.getElementById('cf-parent-no-pending');
    var emailView = document.getElementById('cf-parent-email-view');
    if (!sel) return;

    var pendingParent = CF.state.requests.filter(function (r) {
      return r.stages.parentApproval.status === 'pending';
    });

    // Populate select
    sel.innerHTML = '<option value="">Choose application…</option>';
    pendingParent.forEach(function (r) {
      var opt = document.createElement('option');
      opt.value       = r.id;
      opt.textContent = r.id + ' — ' + r.studentName + ' (' + r.leaveType + ')';
      sel.appendChild(opt);
    });

    if (pendingParent.length === 0) {
      noPend.classList.remove('hidden');
      emailView.classList.add('hidden');
    } else {
      noPend.classList.add('hidden');
    }

    sel.addEventListener('change', function () {
      var reqId = sel.value;
      if (!reqId) { emailView.classList.add('hidden'); return; }
      var req = CF.requestById(reqId);
      if (!req) return;

      document.getElementById('cf-pe-to').textContent = 'To: ' + req.parentEmail;
      document.getElementById('cf-pe-body').textContent =
        'Dear ' + req.parentName + ',\n\n' +
        'Your ward ' + req.studentName + ' (' + req.roll + ') has submitted a ' +
        (req.leaveType === 'vacation' ? 'Vacation Leave' : 'Normal Leave') + ' application.\n\n' +
        'Destination: ' + req.destination + '\n' +
        'Duration:    ' + CF.dateLabel(req.fromDate) + ' to ' + CF.dateLabel(req.toDate) + '\n' +
        'Reason:      ' + req.reason + '\n\n' +
        'Please click one of the buttons below to APPROVE or REJECT this request.\n\n' +
        'Regards,\nCampusFlow System';

      emailView.classList.remove('hidden');

      document.getElementById('cf-pe-approve-btn').onclick = function () {
        CF.parentApprove(reqId, true);
        CFToast.success('Parent APPROVED the application (simulated).');
        refreshAll();
      };
      document.getElementById('cf-pe-reject-btn').onclick = function () {
        CF.parentApprove(reqId, false);
        CFToast.warning('Parent REJECTED the application (simulated).');
        refreshAll();
      };
    });
  }

  function refreshAll() {
    renderStats();
    renderHistory();
    setupParentSimulation();
    lucide.createIcons();
  }

})();

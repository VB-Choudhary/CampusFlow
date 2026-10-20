/* ============================================================
   CampusFlow — js/vani-mandir.js
   Vani Mandir Dashboard: Verify records + Issue gate passes
   Depends on: data.js, toast.js, nav.js, timeline.js, student360.js
   ============================================================ */

(function () {
  'use strict';

  var CF = window.CampusFlow;
  var _activeReqId = null;
  var _activeModal = null; // 'verify' | 'qr'

  document.addEventListener('DOMContentLoaded', function () {
    CFNav.inject('vani');
    lucide.createIcons();
    renderAll();
    setupVerifyModal();
    setupQrModal();
  });

  /* ── Render ────────────────────────────────────────────── */
  function renderAll() {
    renderStats();
    renderVerifyQueue();
    renderGatePassQueue();
    renderIssuedList();
  }

  function renderStats() {
    var verifyPend = CF.requestsForStage('vaniMandirVerify', 'pending').length;
    // Gate pass ready = wardenFinal approved AND gatePass waiting
    var gpReady    = readyForGatePass().length;
    var issued     = CF.requestsForStage('gatePass', 'approved').length;
    var total      = CF.state.requests.length;

    var el = document.getElementById('cf-vani-stats');
    if (!el) return;
    el.innerHTML =
      stat('clipboard-check', verifyPend, 'Verification Queue', 'purple') +
      stat('qr-code',         gpReady,    'Gate Pass Ready',    'warning') +
      stat('ticket',          issued,     'Passes Issued',      'success') +
      stat('file-text',       total,      'Total Applications', 'primary');
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

  /* ── Verification Queue ────────────────────────────────── */
  function renderVerifyQueue() {
    var reqs = CF.requestsForStage('vaniMandirVerify', 'pending');
    var el   = document.getElementById('cf-verify-queue');
    var cnt  = document.getElementById('cf-verify-count');
    if (!el) return;
    if (cnt) cnt.textContent = reqs.length + ' pending';

    if (reqs.length === 0) {
      el.innerHTML = emptyState('check-circle', 'Verification queue is empty', 'No applications awaiting Vani Mandir verification.');
      lucide.createIcons();
      return;
    }

    var html = tableWrap(['ID','Student','Type','Dates','Actions'], reqs, function (req) {
      var typeLabel = req.leaveType === 'vacation' ? '🏖️ Vacation' : '🏠 Normal';
      return '<tr>' +
        '<td><strong>' + req.id + '</strong></td>' +
        '<td>' +
          '<div style="font-weight:600">' + req.studentName + '</div>' +
          '<div style="font-size:var(--cf-fs-xs);color:var(--cf-text-3)">' + req.roll + '</div>' +
        '</td>' +
        '<td>' + typeLabel + '</td>' +
        '<td>' + CF.dateLabel(req.fromDate) + ' → ' + CF.dateLabel(req.toDate) + '</td>' +
        '<td>' +
          '<button class="cf-btn cf-btn--primary cf-btn--sm cf-vani-verify-btn" data-req-id="' + req.id + '">' +
            '<i data-lucide="eye" style="width:13px;height:13px"></i> Verify' +
          '</button>' +
        '</td>' +
      '</tr>';
    });

    el.innerHTML = html;
    lucide.createIcons();
    el.querySelectorAll('.cf-vani-verify-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openVerifyModal(btn.getAttribute('data-req-id'));
      });
    });
  }

  /* ── Gate Pass Issuance Queue ──────────────────────────── */
  function readyForGatePass() {
    return CF.state.requests.filter(function (r) {
      return r.stages.wardenFinal.status === 'approved' &&
             r.stages.gatePass.status    === 'waiting';
    });
  }

  function renderGatePassQueue() {
    var reqs = readyForGatePass();
    var el   = document.getElementById('cf-gatepass-queue');
    var cnt  = document.getElementById('cf-gp-count');
    if (!el) return;
    if (cnt) cnt.textContent = reqs.length + ' ready';

    if (reqs.length === 0) {
      el.innerHTML = emptyState('qr-code', 'No passes ready yet', 'Applications must pass all approval stages first.');
      lucide.createIcons();
      return;
    }

    var html = tableWrap(['ID','Student','Type','Dates','Leave To','Action'], reqs, function (req) {
      return '<tr>' +
        '<td><strong>' + req.id + '</strong></td>' +
        '<td>' +
          '<div style="font-weight:600">' + req.studentName + '</div>' +
          '<div style="font-size:var(--cf-fs-xs);color:var(--cf-text-3)">' + req.roll + '</div>' +
        '</td>' +
        '<td>' + (req.leaveType === 'vacation' ? '🏖️ Vacation' : '🏠 Normal') + '</td>' +
        '<td>' + CF.dateLabel(req.fromDate) + ' → ' + CF.dateLabel(req.toDate) + '</td>' +
        '<td>' + req.destination + '</td>' +
        '<td>' +
          '<button class="cf-btn cf-btn--sm cf-btn--primary cf-vani-issue-btn" ' +
            'style="background:var(--cf-vani);border-color:var(--cf-vani)" data-req-id="' + req.id + '">' +
            '<i data-lucide="qr-code" style="width:13px;height:13px"></i> Issue Pass' +
          '</button>' +
        '</td>' +
      '</tr>';
    });

    el.innerHTML = html;
    lucide.createIcons();
    el.querySelectorAll('.cf-vani-issue-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        issueGatePass(btn.getAttribute('data-req-id'));
      });
    });
  }

  function issueGatePass(reqId) {
    var token = CF.issueGatePass(reqId);
    var req   = CF.requestById(reqId);
    if (!token || !req) { CFToast.error('Failed to issue gate pass.'); return; }

    // Show QR modal
    document.getElementById('cf-qr-token').textContent = token;
    document.getElementById('cf-qr-meta').textContent  =
      req.studentName + ' · ' + req.roll + ' · ' + CF.dateLabel(req.fromDate) + ' → ' + CF.dateLabel(req.toDate);

    // Simple QR-like placeholder grid
    var qrEl = document.getElementById('cf-qr-display');
    qrEl.innerHTML = buildQrPlaceholder(token);

    document.getElementById('cf-qr-modal-overlay').classList.add('open');
    CFToast.success('Gate pass token generated: ' + token);
    renderAll();
    lucide.createIcons();
  }

  /* ── Issued List ───────────────────────────────────────── */
  function renderIssuedList() {
    var issued = CF.requestsForStage('gatePass', 'approved');
    var el     = document.getElementById('cf-issued-queue');
    if (!el) return;

    if (issued.length === 0) {
      el.innerHTML = emptyState('ticket', 'No passes issued yet', 'Issued gate passes will appear here.');
      lucide.createIcons();
      return;
    }

    var html = tableWrap(['ID','Student','Token','Issued At','Exit Status'], issued, function (req) {
      var gp = req.stages.gatePass;
      return '<tr>' +
        '<td>' + req.id + '</td>' +
        '<td>' + req.studentName + '</td>' +
        '<td><code style="font-size:var(--cf-fs-xs);color:var(--cf-primary)">' + (gp.token || '—') + '</code></td>' +
        '<td>' + CF.dateTimeLabel(gp.issuedAt) + '</td>' +
        '<td>' +
          (req.exitRecorded
            ? '<span class="cf-badge cf-badge--approved">Exited ' + CF.dateTimeLabel(req.exitAt) + '</span>'
            : '<span class="cf-badge cf-badge--neutral">Not yet exited</span>') +
        '</td>' +
      '</tr>';
    });

    el.innerHTML = html;
  }

  /* ── Verify Modal ──────────────────────────────────────── */
  function setupVerifyModal() {
    document.getElementById('cf-vani-verify-close').addEventListener('click',  closeVerifyModal);
    document.getElementById('cf-vani-verify-cancel').addEventListener('click', closeVerifyModal);
    document.getElementById('cf-vani-verify-modal-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeVerifyModal();
    });

    document.getElementById('cf-vani-verify-approve').addEventListener('click', function () {
      var note = getNote('cf-vani-verify-note');
      CF.advanceStage(_activeReqId, 'vaniMandirVerify', 'approve', note || 'Records verified.');
      CFToast.success('Records verified. Application advancing.');
      closeVerifyModal();
      renderAll();
    });

    document.getElementById('cf-vani-verify-reject').addEventListener('click', function () {
      var note = getNote('cf-vani-verify-note');
      CF.advanceStage(_activeReqId, 'vaniMandirVerify', 'reject', note || 'Records discrepancy found.');
      CFToast.error('Application rejected at verification stage.');
      closeVerifyModal();
      renderAll();
    });

    document.getElementById('cf-vani-verify-360').addEventListener('click', function () {
      if (_activeReqId) CFDrawer.open(_activeReqId);
    });
  }

  function openVerifyModal(reqId) {
    _activeReqId = reqId;
    var req = CF.requestById(reqId);
    if (!req) return;

    var student  = CF.studentById(req.studentId) || {};
    var body     = document.getElementById('cf-vani-verify-body');

    body.innerHTML =
      '<div class="cf-alert cf-alert--info" style="margin-bottom:var(--cf-sp-5)">' +
        '<i data-lucide="info" style="width:16px;height:16px;flex-shrink:0"></i>' +
        '<div>Verify student records match official university data before approving.</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--cf-sp-3);margin-bottom:var(--cf-sp-5)">' +
        kv('Student Name',    req.studentName) +
        kv('Roll No.',        req.roll) +
        kv('Hostel',          req.hostel) +
        kv('CGPA',            student.cgpa || '—') +
        kv('Leave Balance',   (student.leaveBalance || '—') + ' days') +
        kv('Parent Name',     req.parentName) +
        kv('Destination',     req.destination) +
        kv('Duration',        CF.dateLabel(req.fromDate) + ' → ' + CF.dateLabel(req.toDate)) +
      '</div>' +
      '<div class="cf-form-group" style="margin-bottom:var(--cf-sp-4)">' +
        '<label class="cf-label" for="cf-vani-verify-note">Verification Notes</label>' +
        '<textarea class="cf-textarea" id="cf-vani-verify-note" placeholder="e.g. Records verified against hostel register" style="min-height:70px"></textarea>' +
      '</div>' +
      '<div style="font-size:var(--cf-fs-xs);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--cf-text-3);margin-bottom:var(--cf-sp-3)">Workflow</div>' +
      '<div id="cf-vani-verify-timeline"></div>';

    CFTimeline.render(document.getElementById('cf-vani-verify-timeline'), req, { compact: true });
    document.getElementById('cf-vani-verify-modal-overlay').classList.add('open');
    lucide.createIcons();
  }

  function closeVerifyModal() {
    document.getElementById('cf-vani-verify-modal-overlay').classList.remove('open');
    _activeReqId = null;
  }

  /* ── QR Modal ──────────────────────────────────────────── */
  function setupQrModal() {
    document.getElementById('cf-qr-modal-close').addEventListener('click',  closeQrModal);
    document.getElementById('cf-qr-modal-done').addEventListener('click',   closeQrModal);
    document.getElementById('cf-qr-modal-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeQrModal();
    });
  }

  function closeQrModal() {
    document.getElementById('cf-qr-modal-overlay').classList.remove('open');
  }

  /* ── QR placeholder generator ──────────────────────────── */
  function buildQrPlaceholder(token) {
    // Deterministic pixel grid from token chars (visual simulation)
    var cells = '';
    var seed  = 0;
    for (var i = 0; i < token.length; i++) seed += token.charCodeAt(i);

    var size = 10;
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var filled = ((seed ^ (r * 13 + c * 7) ^ (r + c)) % 3) !== 0;
        // Force corners white for QR aesthetics
        if ((r < 2 && c < 2) || (r < 2 && c >= size-2) || (r >= size-2 && c < 2)) filled = true;
        cells += '<rect x="' + (c*14+3) + '" y="' + (r*14+3) + '" width="12" height="12" fill="' +
                 (filled ? '#0F172A' : '#F1F5F9') + '" rx="1"/>';
      }
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150" ' +
           'role="img" aria-label="Gate pass QR code">' +
           '<rect width="150" height="150" fill="#F8FAFC" rx="8"/>' +
           cells +
           '</svg>';
  }

  /* ── Helpers ───────────────────────────────────────────── */
  function getNote(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function kv(label, value) {
    return '<div>' +
      '<div style="font-size:var(--cf-fs-xs);color:var(--cf-text-3);margin-bottom:2px">' + label + '</div>' +
      '<div style="font-size:var(--cf-fs-sm);font-weight:600">' + (value || '—') + '</div>' +
    '</div>';
  }

  function emptyState(icon, title, sub) {
    return '<div class="cf-empty" style="padding:var(--cf-sp-10)">' +
      '<i data-lucide="' + icon + '" class="cf-empty__icon" style="width:40px;height:40px"></i>' +
      '<div class="cf-empty__title">' + title + '</div>' +
      '<p>' + sub + '</p>' +
    '</div>';
  }

  function tableWrap(headers, rows, rowFn) {
    var html = '<div class="cf-table-wrap"><table class="cf-table"><thead><tr>';
    headers.forEach(function(h){ html += '<th>' + h + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.forEach(function(r){ html += rowFn(r); });
    html += '</tbody></table></div>';
    return html;
  }

})();

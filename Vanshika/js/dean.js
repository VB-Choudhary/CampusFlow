/* ============================================================
   CampusFlow — js/dean.js
   Dean Dashboard: Normal Leave approval queue
   Depends on: data.js, toast.js, nav.js, timeline.js, student360.js
   ============================================================ */

(function () {
  'use strict';

  var CF = window.CampusFlow;
  var _activeReqId = null;

  document.addEventListener('DOMContentLoaded', function () {
    CFNav.inject('dean');
    lucide.createIcons();
    renderAll();
    setupModal();
    setupBypassChevron();
  });

  /* ── Render ────────────────────────────────────────────── */
  function renderAll() {
    renderStats();
    renderQueue();
    renderBypassedList();
  }

  function renderStats() {
    var all       = CF.state.requests;
    var pending   = CF.requestsForStage('deanApproval', 'pending').length;
    var approved  = CF.requestsForStage('deanApproval', 'approved').length;
    var bypassed  = CF.requestsForStage('deanApproval', 'bypassed').length;
    var rejected  = CF.requestsForStage('deanApproval', 'rejected').length;

    var el = document.getElementById('cf-dean-stats');
    if (!el) return;
    el.innerHTML =
      stat('clock',       pending,   'Pending Review',  'warning') +
      stat('check-circle',approved,  'Approved',        'success') +
      stat('zap',         bypassed,  'Bypassed (Vacation)', 'purple') +
      stat('x-circle',    rejected,  'Rejected',        'danger');
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

  function renderQueue() {
    var pending = CF.requestsForStage('deanApproval', 'pending');
    var el      = document.getElementById('cf-dean-queue');
    var cnt     = document.getElementById('cf-dean-count');
    if (!el) return;

    if (cnt) cnt.textContent = pending.length + ' pending';

    if (pending.length === 0) {
      el.innerHTML =
        '<div class="cf-empty" style="padding:var(--cf-sp-10)">' +
          '<i data-lucide="check-circle" class="cf-empty__icon" style="width:40px;height:40px;color:var(--cf-approved);opacity:1"></i>' +
          '<div class="cf-empty__title">No pending approvals</div>' +
          '<p>All Normal Leave requests have been processed.</p>' +
        '</div>';
      lucide.createIcons();
      return;
    }

    var html = '<div class="cf-table-wrap"><table class="cf-table"><thead><tr>' +
      '<th>ID</th><th>Student</th><th>Dates</th><th>Destination</th><th>Reason</th><th>Actions</th>' +
    '</tr></thead><tbody>';

    pending.forEach(function (req) {
      html += '<tr>' +
        '<td><strong>' + req.id + '</strong></td>' +
        '<td>' +
          '<div style="font-weight:600">' + req.studentName + '</div>' +
          '<div style="font-size:var(--cf-fs-xs);color:var(--cf-text-3)">' + req.roll + '</div>' +
        '</td>' +
        '<td style="white-space:nowrap">' + CF.dateLabel(req.fromDate) + ' → ' + CF.dateLabel(req.toDate) + '</td>' +
        '<td>' + req.destination + '</td>' +
        '<td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
          req.reason +
        '</td>' +
        '<td>' +
          '<button class="cf-btn cf-btn--warning cf-btn--sm cf-dean-review-btn" data-req-id="' + req.id + '">' +
            '<i data-lucide="eye" style="width:13px;height:13px"></i> Review' +
          '</button>' +
        '</td>' +
      '</tr>';
    });

    html += '</tbody></table></div>';
    el.innerHTML = html;
    lucide.createIcons();

    el.querySelectorAll('.cf-dean-review-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openModal(btn.getAttribute('data-req-id'));
      });
    });
  }

  function renderBypassedList() {
    var bypassed = CF.requestsForStage('deanApproval', 'bypassed');
    var el       = document.getElementById('cf-bypassed-list');
    if (!el || bypassed.length === 0) {
      if (el) el.innerHTML = '<p class="text-muted text-sm">No vacation bypass records.</p>';
      return;
    }

    var html = '<div class="cf-table-wrap"><table class="cf-table"><thead><tr>' +
      '<th>ID</th><th>Student</th><th>Dates</th><th>Bypass Reason</th>' +
    '</tr></thead><tbody>';

    bypassed.forEach(function (req) {
      html += '<tr>' +
        '<td>' + req.id + '</td>' +
        '<td>' + req.studentName + '</td>' +
        '<td>' + CF.dateLabel(req.fromDate) + ' → ' + CF.dateLabel(req.toDate) + '</td>' +
        '<td>' +
          '<span class="cf-badge cf-badge--bypassed">Bypassed</span> ' +
          '<span style="font-size:var(--cf-fs-xs);color:var(--cf-text-2)">' +
            (req.stages.deanApproval.bypassReason || 'Vacation policy') + '</span>' +
        '</td>' +
      '</tr>';
    });

    html += '</tbody></table></div>';
    el.innerHTML = html;
  }

  /* ── Bypass chevron toggle ─────────────────────────────── */
  function setupBypassChevron() {
    var details  = document.getElementById('cf-bypass-reference');
    var chevron  = document.getElementById('cf-bypass-chevron');
    if (!details || !chevron) return;
    details.addEventListener('toggle', function () {
      chevron.style.transform = details.open ? 'rotate(180deg)' : '';
    });
  }

  /* ── Modal ─────────────────────────────────────────────── */
  function setupModal() {
    document.getElementById('cf-dean-modal-close').addEventListener('click',  closeModal);
    document.getElementById('cf-dean-modal-cancel').addEventListener('click', closeModal);
    document.getElementById('cf-dean-modal-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });

    document.getElementById('cf-dean-approve-btn').addEventListener('click', function () {
      var note = getNoteValue();
      CF.advanceStage(_activeReqId, 'deanApproval', 'approve', note);
      CFToast.success('Leave approved by Dean.');
      closeModal();
      renderAll();
    });

    document.getElementById('cf-dean-reject-btn').addEventListener('click', function () {
      var note = getNoteValue();
      CF.advanceStage(_activeReqId, 'deanApproval', 'reject', note);
      CFToast.error('Leave rejected by Dean.');
      closeModal();
      renderAll();
    });

    document.getElementById('cf-dean-view-360').addEventListener('click', function () {
      if (_activeReqId) CFDrawer.open(_activeReqId);
    });
  }

  function getNoteValue() {
    var el = document.getElementById('cf-dean-note');
    return el ? el.value.trim() : '';
  }

  function openModal(reqId) {
    _activeReqId = reqId;
    var req = CF.requestById(reqId);
    if (!req) return;

    document.getElementById('cf-dean-modal-title').textContent = 'Dean Review — ' + req.id;

    var body = document.getElementById('cf-dean-modal-body');
    body.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--cf-sp-3);margin-bottom:var(--cf-sp-5)">' +
        kv('Student',     req.studentName + ' (' + req.roll + ')') +
        kv('Leave Type',  '🏠 Normal Leave') +
        kv('Destination', req.destination) +
        kv('Submitted',   CF.dateTimeLabel(req.submittedAt)) +
        kv('From',        CF.dateLabel(req.fromDate)) +
        kv('To',          CF.dateLabel(req.toDate)) +
      '</div>' +
      '<div class="cf-alert cf-alert--info" style="margin-bottom:var(--cf-sp-4)">' +
        '<i data-lucide="message-square" style="width:16px;height:16px;flex-shrink:0"></i>' +
        '<div><strong>Reason:</strong> ' + req.reason + '</div>' +
      '</div>' +
      '<div class="cf-form-group" style="margin-bottom:var(--cf-sp-4)">' +
        '<label class="cf-label" for="cf-dean-note">Remarks (optional)</label>' +
        '<textarea class="cf-textarea" id="cf-dean-note" placeholder="Add your decision remarks…" style="min-height:70px"></textarea>' +
      '</div>' +
      '<div style="font-size:var(--cf-fs-xs);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--cf-text-3);margin-bottom:var(--cf-sp-3)">Workflow</div>' +
      '<div id="cf-dean-modal-timeline"></div>';

    CFTimeline.render(document.getElementById('cf-dean-modal-timeline'), req, { compact: true });
    document.getElementById('cf-dean-modal-overlay').classList.add('open');
    lucide.createIcons();
  }

  function closeModal() {
    document.getElementById('cf-dean-modal-overlay').classList.remove('open');
    _activeReqId = null;
  }

  function kv(label, value) {
    return '<div>' +
      '<div style="font-size:var(--cf-fs-xs);color:var(--cf-text-3);margin-bottom:2px">' + label + '</div>' +
      '<div style="font-size:var(--cf-fs-sm);font-weight:600">' + (value || '—') + '</div>' +
    '</div>';
  }

})();

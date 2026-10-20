/* ============================================================
   CampusFlow — js/warden.js
   Warden Dashboard: Initial & Final approval queues
   Depends on: data.js, toast.js, nav.js, timeline.js, student360.js
   ============================================================ */

(function () {
  'use strict';

  var CF  = window.CampusFlow;
  var _activeReqId  = null;
  var _activeStageName = null;

  document.addEventListener('DOMContentLoaded', function () {
    CFNav.inject('warden');
    lucide.createIcons();
    renderAll();
    setupModal();
  });

  /* ── Render ────────────────────────────────────────────── */
  function renderAll() {
    renderStats();
    renderQueue('wardenInitial', 'cf-initial-queue', 'cf-initial-count');
    renderQueue('wardenFinal',   'cf-final-queue',   'cf-final-count');
  }

  function renderStats() {
    var all       = CF.state.requests;
    var initPend  = CF.requestsForStage('wardenInitial', 'pending').length;
    var finalPend = CF.requestsForStage('wardenFinal',   'pending').length;
    var approved  = all.filter(function(r){ return CF.overallStatus(r) === 'approved'; }).length;
    var total     = all.length;

    var el = document.getElementById('cf-warden-stats');
    if (!el) return;
    el.innerHTML =
      stat('file-text',      total,      'Total Applications', 'primary') +
      stat('inbox',          initPend,   'Initial Queue',      'warning') +
      stat('check-square',   finalPend,  'Final Queue',        'purple') +
      stat('check-circle',   approved,   'Fully Approved',     'success');
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

  function renderQueue(stageName, containerId, countId) {
    var reqs = CF.requestsForStage(stageName, 'pending');
    var el   = document.getElementById(containerId);
    var cnt  = document.getElementById(countId);
    if (!el) return;

    if (cnt) cnt.textContent = reqs.length + ' pending';

    if (reqs.length === 0) {
      el.innerHTML =
        '<div class="cf-empty" style="padding:var(--cf-sp-10)">' +
          '<i data-lucide="check-circle" class="cf-empty__icon" style="width:40px;height:40px;color:var(--cf-approved);opacity:1"></i>' +
          '<div class="cf-empty__title">Queue is clear</div>' +
          '<p>No applications awaiting ' + (stageName === 'wardenInitial' ? 'initial' : 'final') + ' approval.</p>' +
        '</div>';
      lucide.createIcons();
      return;
    }

    var html = '<div class="cf-table-wrap"><table class="cf-table"><thead><tr>' +
      '<th>ID</th><th>Student</th><th>Type</th><th>Dates</th><th>Destination</th><th>Actions</th>' +
    '</tr></thead><tbody>';

    reqs.forEach(function (req) {
      var typeLabel = req.leaveType === 'vacation' ? '🏖️ Vacation' : '🏠 Normal';
      html += '<tr>' +
        '<td><strong>' + req.id + '</strong></td>' +
        '<td>' +
          '<div style="font-weight:600">' + req.studentName + '</div>' +
          '<div style="font-size:var(--cf-fs-xs);color:var(--cf-text-3)">' + req.roll + ' · ' + req.hostel + '</div>' +
        '</td>' +
        '<td>' + typeLabel + '</td>' +
        '<td style="white-space:nowrap">' + CF.dateLabel(req.fromDate) + '<br>' + CF.dateLabel(req.toDate) + '</td>' +
        '<td>' + req.destination + '</td>' +
        '<td>' +
          '<div style="display:flex;gap:var(--cf-sp-2)">' +
            '<button class="cf-btn cf-btn--primary cf-btn--sm cf-warden-review-btn" ' +
              'data-req-id="' + req.id + '" data-stage="' + stageName + '">' +
              '<i data-lucide="eye" style="width:13px;height:13px"></i> Review' +
            '</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    });

    html += '</tbody></table></div>';
    el.innerHTML = html;
    lucide.createIcons();

    el.querySelectorAll('.cf-warden-review-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openModal(btn.getAttribute('data-req-id'), btn.getAttribute('data-stage'));
      });
    });
  }

  /* ── Modal ─────────────────────────────────────────────── */
  function setupModal() {
    document.getElementById('cf-warden-modal-close').addEventListener('click',  closeModal);
    document.getElementById('cf-warden-modal-cancel').addEventListener('click', closeModal);
    document.getElementById('cf-warden-modal-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });

    document.getElementById('cf-warden-approve-btn').addEventListener('click', function () {
      var note = getNoteValue();
      CF.advanceStage(_activeReqId, _activeStageName, 'approve', note);
      CFToast.success('Application approved.');
      closeModal();
      renderAll();
    });

    document.getElementById('cf-warden-reject-btn').addEventListener('click', function () {
      var note = getNoteValue();
      CF.advanceStage(_activeReqId, _activeStageName, 'reject', note);
      CFToast.error('Application rejected.');
      closeModal();
      renderAll();
    });

    document.getElementById('cf-warden-view-360').addEventListener('click', function () {
      if (_activeReqId) CFDrawer.open(_activeReqId);
    });
  }

  function getNoteValue() {
    var el = document.getElementById('cf-warden-note');
    return el ? el.value.trim() : '';
  }

  function openModal(reqId, stageName) {
    _activeReqId    = reqId;
    _activeStageName = stageName;

    var req = CF.requestById(reqId);
    if (!req) return;

    document.getElementById('cf-warden-modal-title').textContent =
      (stageName === 'wardenInitial' ? 'Initial' : 'Final') + ' Approval — ' + req.id;

    var body = document.getElementById('cf-warden-modal-body');
    body.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--cf-sp-3);margin-bottom:var(--cf-sp-5)">' +
        kv('Student',     req.studentName + ' (' + req.roll + ')') +
        kv('Hostel',      req.hostel) +
        kv('Leave Type',  req.leaveType === 'vacation' ? '🏖️ Vacation' : '🏠 Normal') +
        kv('Destination', req.destination) +
        kv('From',        CF.dateLabel(req.fromDate)) +
        kv('To',          CF.dateLabel(req.toDate)) +
        kv('Parent',      req.parentName) +
        kv('Parent Email',req.parentEmail) +
      '</div>' +
      '<div class="cf-form-group" style="margin-bottom:var(--cf-sp-4)">' +
        '<label class="cf-label" for="cf-warden-note">Remarks (optional)</label>' +
        '<textarea class="cf-textarea" id="cf-warden-note" placeholder="Add your remarks…" style="min-height:70px"></textarea>' +
      '</div>' +
      '<div style="margin-bottom:var(--cf-sp-4)">' +
        '<div style="font-size:var(--cf-fs-xs);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--cf-text-3);margin-bottom:var(--cf-sp-3)">Reason for Leave</div>' +
        '<p style="font-size:var(--cf-fs-sm);color:var(--cf-text-2)">' + req.reason + '</p>' +
      '</div>' +
      '<div style="font-size:var(--cf-fs-xs);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--cf-text-3);margin-bottom:var(--cf-sp-3)">Current Workflow</div>' +
      '<div id="cf-warden-modal-timeline"></div>';

    CFTimeline.render(document.getElementById('cf-warden-modal-timeline'), req, { compact: true });
    document.getElementById('cf-warden-modal-overlay').classList.add('open');
    lucide.createIcons();
  }

  function closeModal() {
    document.getElementById('cf-warden-modal-overlay').classList.remove('open');
    _activeReqId     = null;
    _activeStageName = null;
  }

  function kv(label, value) {
    return '<div>' +
      '<div style="font-size:var(--cf-fs-xs);color:var(--cf-text-3);margin-bottom:2px">' + label + '</div>' +
      '<div style="font-size:var(--cf-fs-sm);font-weight:600">' + (value || '—') + '</div>' +
    '</div>';
  }

})();

/* ============================================================
   CampusFlow — js/student360.js
   Student 360° Side Drawer component
   Depends on: data.js, timeline.js, toast.js, styles.css
   ============================================================ */

(function () {
  'use strict';

  var CF = window.CampusFlow;
  var _drawerEl    = null;
  var _overlayEl   = null;
  var _currentReqId = null;

  function build() {
    if (document.getElementById('cf-drawer')) return;

    // Overlay
    var overlay = document.createElement('div');
    overlay.className = 'cf-drawer-overlay';
    overlay.id        = 'cf-drawer-overlay';
    overlay.addEventListener('click', close);
    document.body.appendChild(overlay);
    _overlayEl = overlay;

    // Drawer
    var drawer = document.createElement('div');
    drawer.className = 'cf-drawer';
    drawer.id        = 'cf-drawer';
    drawer.innerHTML =
      '<div class="cf-drawer__header" id="cf-drawer-header">' +
        '<div class="cf-drawer__avatar" id="cf-drawer-avatar">?</div>' +
        '<div>' +
          '<div class="cf-drawer__name" id="cf-drawer-name">—</div>' +
          '<div class="cf-drawer__sub"  id="cf-drawer-sub">—</div>' +
        '</div>' +
        '<button class="cf-drawer__close" id="cf-drawer-close" title="Close">' +
          '<i data-lucide="x" style="width:16px;height:16px"></i>' +
        '</button>' +
      '</div>' +
      '<div class="cf-drawer__body" id="cf-drawer-body"></div>';

    document.body.appendChild(drawer);
    _drawerEl = drawer;

    document.getElementById('cf-drawer-close').addEventListener('click', close);

    // Keyboard ESC
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  function open(reqId) {
    build();
    _currentReqId = reqId;

    var req = CF.requestById(reqId);
    if (!req) return;

    var student = CF.studentById(req.studentId);

    // Header
    var initials = req.studentName.split(' ').map(function(w){ return w[0]; }).join('').toUpperCase();
    document.getElementById('cf-drawer-avatar').textContent = initials;
    document.getElementById('cf-drawer-name').textContent   = req.studentName;
    document.getElementById('cf-drawer-sub').textContent    =
      (student ? student.branch + ' · ' : '') + req.roll;

    // Body
    var body = document.getElementById('cf-drawer-body');
    var html = '';

    /* Student profile */
    html += '<div class="cf-drawer__section">';
    html +=   '<div class="cf-drawer__section-title">Student Profile</div>';
    html += infoRow('Roll No.',    req.roll);
    html += infoRow('Hostel',      req.hostel);
    html += infoRow('Contact',     req.contact);
    if (student) {
      html += infoRow('CGPA',        student.cgpa);
      html += infoRow('Year',        student.year);
      html += infoRow('Leave Balance', student.leaveBalance + ' days');
    }
    html += '</div>';

    /* Leave details */
    html += '<div class="cf-drawer__section">';
    html +=   '<div class="cf-drawer__section-title">Leave Details</div>';
    html += infoRow('Application ID', req.id);
    html += infoRow('Leave Type', req.leaveType === 'vacation' ? '🏖️ Vacation' : '🏠 Normal');
    html += infoRow('From',        CF.dateLabel(req.fromDate));
    html += infoRow('To',          CF.dateLabel(req.toDate));
    html += infoRow('Destination', req.destination);
    html += infoRow('Submitted',   CF.dateTimeLabel(req.submittedAt));

    // Duration
    var from  = new Date(req.fromDate);
    var to    = new Date(req.toDate);
    var days  = Math.ceil((to - from) / 86400000) + 1;
    html += infoRow('Duration', days + ' day(s)');
    html += '</div>';

    /* Reason */
    html += '<div class="cf-drawer__section">';
    html +=   '<div class="cf-drawer__section-title">Reason</div>';
    html +=   '<p style="font-size:var(--cf-fs-sm);color:var(--cf-text-2);line-height:1.6">' +
              req.reason + '</p>';
    html += '</div>';

    /* Parent info */
    html += '<div class="cf-drawer__section">';
    html +=   '<div class="cf-drawer__section-title">Parent / Guardian</div>';
    html += infoRow('Name',    req.parentName);
    html += infoRow('Phone',   req.parentPhone);
    html += infoRow('Email',   req.parentEmail);
    html += '</div>';

    /* Workflow timeline */
    html += '<div class="cf-drawer__section">';
    html +=   '<div class="cf-drawer__section-title">Workflow Status</div>';
    html +=   '<div id="cf-drawer-timeline"></div>';
    html += '</div>';

    /* Exit status */
    if (req.exitRecorded) {
      html += '<div class="cf-drawer__section">';
      html +=   '<div class="cf-drawer__section-title">Gate Exit</div>';
      html +=   '<div class="cf-alert cf-alert--success" style="font-size:var(--cf-fs-xs)">' +
                '<i data-lucide="log-out" style="width:16px;height:16px"></i>' +
                ' Exited campus at ' + CF.dateTimeLabel(req.exitAt) +
                '</div>';
      html += '</div>';
    }

    body.innerHTML = html;

    // Render timeline inside drawer
    CFTimeline.render(
      document.getElementById('cf-drawer-timeline'),
      req,
      { compact: false }
    );

    // Show
    _overlayEl.classList.add('open');
    _drawerEl.classList.add('open');
    document.body.style.overflow = 'hidden';

    if (window.lucide) window.lucide.createIcons();
  }

  function infoRow(label, value) {
    return '<div class="cf-info-row">' +
           '<span class="cf-info-row__label">' + label + '</span>' +
           '<span class="cf-info-row__value">' + (value || '—') + '</span>' +
           '</div>';
  }

  function close() {
    if (_overlayEl) _overlayEl.classList.remove('open');
    if (_drawerEl)  _drawerEl.classList.remove('open');
    document.body.style.overflow = '';
    _currentReqId = null;
  }

  window.CFDrawer = { open: open, close: close };

})();

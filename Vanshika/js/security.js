/* ============================================================
   CampusFlow — js/security.js
   Security Dashboard: Gate pass validation & exit recording
   Depends on: data.js, toast.js, nav.js, timeline.js, student360.js
   ============================================================ */

(function () {
  'use strict';

  var CF = window.CampusFlow;

  document.addEventListener('DOMContentLoaded', function () {
    CFNav.inject('security');
    lucide.createIcons();
    renderStats();
    renderQuickFill();
    renderExitLog();
    setupValidator();
  });

  /* ── Stats ─────────────────────────────────────────────── */
  function renderStats() {
    var issued  = CF.requestsForStage('gatePass', 'approved');
    var exited  = issued.filter(function(r){ return r.exitRecorded; }).length;
    var pending = issued.filter(function(r){ return !r.exitRecorded; }).length;
    var total   = CF.state.requests.length;

    var el = document.getElementById('cf-security-stats');
    if (!el) return;
    el.innerHTML =
      stat('ticket',     issued.length, 'Total Passes Issued', 'primary') +
      stat('log-out',    exited,         'Exits Recorded',      'success') +
      stat('clock',      pending,        'Outstanding Passes',  'warning') +
      stat('file-text',  total,          'All Applications',    'cyan');
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

  /* ── Quick-fill issued tokens ──────────────────────────── */
  function renderQuickFill() {
    var issued = CF.requestsForStage('gatePass', 'approved').filter(function(r){ return !r.exitRecorded; });
    var el     = document.getElementById('cf-issued-tokens-quick');
    if (!el) return;

    if (issued.length === 0) {
      el.innerHTML = '<p style="font-size:var(--cf-fs-xs);color:var(--cf-text-3)">No outstanding gate passes.</p>';
      return;
    }

    var html = '<div style="font-size:var(--cf-fs-xs);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--cf-text-3);margin-bottom:var(--cf-sp-2)">Quick-fill from issued passes</div>' +
               '<div style="display:flex;flex-wrap:wrap;gap:var(--cf-sp-2)">';
    issued.forEach(function (req) {
      var token = req.stages.gatePass.token;
      html += '<button class="cf-btn cf-btn--outline cf-btn--sm cf-quick-fill-btn" data-token="' + token + '" ' +
              'title="' + req.studentName + '">' +
              '<i data-lucide="clipboard" style="width:12px;height:12px"></i> ' + token + '</button>';
    });
    html += '</div>';
    el.innerHTML = html;
    lucide.createIcons();

    el.querySelectorAll('.cf-quick-fill-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.getElementById('cf-token-input').value = btn.getAttribute('data-token');
        validateToken(btn.getAttribute('data-token'));
      });
    });
  }

  /* ── Token Validator ───────────────────────────────────── */
  function setupValidator() {
    var btn   = document.getElementById('cf-validate-btn');
    var input = document.getElementById('cf-token-input');
    if (!btn || !input) return;

    btn.addEventListener('click', function () {
      validateToken(input.value.trim().toUpperCase());
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') validateToken(input.value.trim().toUpperCase());
    });
  }

  function findRequestByToken(token) {
    return CF.state.requests.find(function (r) {
      return r.stages.gatePass && r.stages.gatePass.token === token;
    }) || null;
  }

  function validateToken(token) {
    var resultEl = document.getElementById('cf-scan-result');
    if (!token) {
      resultEl.innerHTML = invalid('Please enter a token to validate.');
      resultEl.classList.remove('hidden');
      lucide.createIcons();
      return;
    }

    var req = findRequestByToken(token);

    if (!req) {
      resultEl.innerHTML = invalid('Token <strong>' + token + '</strong> not found in the system.');
      resultEl.classList.remove('hidden');
      CFToast.error('Invalid gate pass token.');
      lucide.createIcons();
      return;
    }

    if (req.stages.gatePass.status !== 'approved') {
      resultEl.innerHTML = invalid('This application does not have an approved gate pass.');
      resultEl.classList.remove('hidden');
      lucide.createIcons();
      return;
    }

    if (req.exitRecorded) {
      resultEl.innerHTML = warning(req, token);
      resultEl.classList.remove('hidden');
      lucide.createIcons();
      return;
    }

    // Valid — show confirm exit
    resultEl.innerHTML = valid(req, token);
    resultEl.classList.remove('hidden');
    lucide.createIcons();

    var confirmBtn = document.getElementById('cf-confirm-exit-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        CF.recordExit(req.id);
        CFToast.success('Exit recorded for ' + req.studentName + '.');
        renderStats();
        renderQuickFill();
        renderExitLog();
        validateToken(token); // re-render result
      });
    }
  }

  function valid(req, token) {
    var gp   = req.stages.gatePass;
    var from = CF.dateLabel(req.fromDate);
    var to   = CF.dateLabel(req.toDate);
    return '<div class="cf-scan-result cf-scan-result--valid" style="margin-bottom:var(--cf-sp-4)">' +
      '<div class="cf-scan-result__icon"><i data-lucide="check-circle" style="width:40px;height:40px"></i></div>' +
      '<div class="cf-scan-result__status">VALID GATE PASS</div>' +
      '<div style="font-size:var(--cf-fs-sm);color:var(--cf-text-2);margin-bottom:var(--cf-sp-4)">' +
        '<strong>' + req.studentName + '</strong> (' + req.roll + ')<br>' +
        req.hostel + '<br>' +
        'Destination: ' + req.destination + '<br>' +
        'Leave: ' + from + ' → ' + to + '<br>' +
        'Token: <code style="color:var(--cf-primary)">' + token + '</code>' +
      '</div>' +
      '<button class="cf-btn cf-btn--success" id="cf-confirm-exit-btn" style="width:100%">' +
        '<i data-lucide="log-out" style="width:16px;height:16px"></i> Confirm Exit & Record' +
      '</button>' +
    '</div>';
  }

  function invalid(msg) {
    return '<div class="cf-scan-result cf-scan-result--invalid" style="margin-bottom:var(--cf-sp-4)">' +
      '<div class="cf-scan-result__icon"><i data-lucide="x-circle" style="width:40px;height:40px"></i></div>' +
      '<div class="cf-scan-result__status">INVALID</div>' +
      '<p style="font-size:var(--cf-fs-sm);color:var(--cf-text-2)">' + msg + '</p>' +
    '</div>';
  }

  function warning(req, token) {
    return '<div class="cf-scan-result" style="margin-bottom:var(--cf-sp-4)">' +
      '<div class="cf-scan-result__icon" style="background:#FEF3C7">' +
        '<i data-lucide="alert-triangle" style="width:40px;height:40px;color:#D97706"></i>' +
      '</div>' +
      '<div style="font-size:var(--cf-fs-lg);font-weight:800;color:#D97706;margin-bottom:var(--cf-sp-2)">ALREADY EXITED</div>' +
      '<p style="font-size:var(--cf-fs-sm);color:var(--cf-text-2)">' +
        req.studentName + ' (' + req.roll + ') has already exited at ' + CF.dateTimeLabel(req.exitAt) +
      '</p>' +
    '</div>';
  }

  /* ── Exit Log ──────────────────────────────────────────── */
  function renderExitLog() {
    var exited = CF.state.requests.filter(function (r) { return r.exitRecorded; });
    var el     = document.getElementById('cf-exit-log');
    if (!el) return;

    if (exited.length === 0) {
      el.innerHTML =
        '<div class="cf-empty" style="padding:var(--cf-sp-10)">' +
          '<i data-lucide="log-out" class="cf-empty__icon" style="width:40px;height:40px"></i>' +
          '<div class="cf-empty__title">No exits recorded</div>' +
          '<p>Exits will appear here after tokens are validated.</p>' +
        '</div>';
      lucide.createIcons();
      return;
    }

    var html = '<div class="cf-table-wrap"><table class="cf-table"><thead><tr>' +
      '<th>ID</th><th>Student</th><th>Token</th><th>Leave Dates</th><th>Exit Recorded At</th>' +
    '</tr></thead><tbody>';

    exited.forEach(function (req) {
      html += '<tr>' +
        '<td><strong>' + req.id + '</strong></td>' +
        '<td>' + req.studentName + ' <span style="color:var(--cf-text-3);font-size:var(--cf-fs-xs)">(' + req.roll + ')</span></td>' +
        '<td><code style="font-size:var(--cf-fs-xs);color:var(--cf-primary)">' + (req.stages.gatePass.token || '—') + '</code></td>' +
        '<td>' + CF.dateLabel(req.fromDate) + ' → ' + CF.dateLabel(req.toDate) + '</td>' +
        '<td>' + CF.dateTimeLabel(req.exitAt) + '</td>' +
      '</tr>';
    });

    html += '</tbody></table></div>';
    el.innerHTML = html;
  }

})();

/* ============================================================
   CampusFlow — js/timeline.js
   Workflow timeline renderer
   Depends on: data.js, styles.css
   ============================================================ */

(function () {
  'use strict';

  var CF = window.CampusFlow;

  var STATUS_ICONS = {
    approved: '<i data-lucide="check" style="width:12px;height:12px;color:#059669"></i>',
    rejected: '<i data-lucide="x"     style="width:12px;height:12px;color:#DC2626"></i>',
    pending:  '<i data-lucide="clock" style="width:12px;height:12px;color:#D97706"></i>',
    bypassed: '<i data-lucide="zap"   style="width:12px;height:12px;color:#7C3AED"></i>',
    waiting:  ''
  };

  var BADGE_CLASS = {
    approved: 'cf-badge--approved',
    rejected: 'cf-badge--rejected',
    pending:  'cf-badge--pending',
    bypassed: 'cf-badge--bypassed',
    waiting:  'cf-badge--neutral'
  };

  var BADGE_LABEL = {
    approved: 'Approved',
    rejected: 'Rejected',
    pending:  'Pending',
    bypassed: 'Bypassed',
    waiting:  'Waiting'
  };

  /**
   * Render a full workflow timeline for a request into `container`.
   * @param {HTMLElement} container  - DOM node to render into
   * @param {Object}      req        - leave request object from CF.state
   * @param {Object}      [opts]
   * @param {boolean}     [opts.compact] - compact layout (no actor notes)
   */
  function render(container, req, opts) {
    opts = opts || {};
    if (!container || !req) return;

    var html = '<div class="cf-timeline">';

    CF.STAGE_ORDER.forEach(function (key) {
      var stageData  = req.stages[key];
      var label      = CF.STAGE_LABELS[key];
      var status     = stageData ? stageData.status : 'waiting';
      var stepClass  = status === 'approved' ? 'done'
                     : status === 'bypassed' ? 'bypassed'
                     : status === 'rejected' ? 'rejected'
                     : status === 'pending'  ? 'pending'
                     : 'waiting';

      html += '<div class="cf-timeline__step ' + stepClass + '">';
      html +=   '<div class="cf-timeline__line"></div>';
      html +=   '<div class="cf-timeline__dot">' + (STATUS_ICONS[status] || '') + '</div>';
      html +=   '<div class="cf-timeline__content">';
      html +=     '<div class="cf-timeline__stage">';
      html +=       '<span>' + label + '</span>';
      html +=       '<span class="cf-badge ' + (BADGE_CLASS[status] || 'cf-badge--neutral') + '">' +
                      (BADGE_LABEL[status] || status) + '</span>';
      html +=     '</div>';

      // Meta line: actor note + timestamp
      if (!opts.compact) {
        var metaParts = [];
        if (stageData && stageData.actedAt)   metaParts.push(CF.dateTimeLabel(stageData.actedAt));
        if (stageData && stageData.actorNote) metaParts.push(stageData.actorNote);
        if (metaParts.length) {
          html += '<div class="cf-timeline__meta">' + metaParts.join(' · ') + '</div>';
        }
      }

      // Gate pass token
      if (key === 'gatePass' && stageData && stageData.token) {
        html += '<div class="cf-timeline__meta" style="margin-top:6px">' +
                '🎫 Token: <strong style="font-family:monospace;color:var(--cf-primary)">' +
                stageData.token + '</strong></div>';
      }

      // Bypass note for Dean / Vacation Leave
      if (status === 'bypassed' && stageData && stageData.bypassReason) {
        html += '<div class="cf-timeline__bypass-note">' +
                '⚡ Bypass reason: ' + stageData.bypassReason +
                '</div>';
      }

      html += '</div>'; // .cf-timeline__content
      html += '</div>'; // .cf-timeline__step
    });

    html += '</div>';
    container.innerHTML = html;

    // Re-render lucide icons
    if (window.lucide) window.lucide.createIcons();
  }

  window.CFTimeline = { render: render };

})();

/* ============================================================
   CampusFlow — js/nav.js
   Shared navigation header injection — role-aware, auth-aware.
   Shows only the current role. Provides Logout button.
   Depends on: auth.js, data.js, toast.js
   ============================================================ */

(function () {
  'use strict';

  var ROLE_CONFIG = {
    student:  { label: 'Student',       color: 'var(--cf-student)',  icon: 'user'        },
    warden:   { label: 'Warden',        color: 'var(--cf-warden)',   icon: 'shield'      },
    dean:     { label: 'Dean / Dept.',  color: 'var(--cf-dean)',     icon: 'briefcase'   },
    vani:     { label: 'Vani Mandir',   color: 'var(--cf-vani)',     icon: 'building-2'  },
    security: { label: 'Security',      color: 'var(--cf-security)', icon: 'scan-line'   }
  };

  /* ── Inject nav into #cf-nav-placeholder ──────────────── */
  function inject(activeRole) {
    var placeholder = document.getElementById('cf-nav-placeholder');
    var nav         = buildNav(activeRole);

    if (placeholder) {
      placeholder.innerHTML = '';
      placeholder.appendChild(nav);
    } else {
      document.body.insertBefore(nav, document.body.firstChild);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function buildNav(activeRole) {
    var nav = document.createElement('nav');
    nav.className = 'cf-nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'CampusFlow main navigation');

    /* Brand */
    var brand = document.createElement('div');
    brand.className = 'cf-nav__brand';
    brand.innerHTML =
      '<div class="cf-nav__logo">CF</div>' +
      '<div class="cf-nav__title">Campus<span>Flow</span></div>';
    nav.appendChild(brand);

    /* Spacer */
    var spacer = document.createElement('div');
    spacer.style.flex = '1';
    nav.appendChild(spacer);

    /* Actions */
    var actions = document.createElement('div');
    actions.className = 'cf-nav__actions';

    /* Active role badge with user name from session */
    if (activeRole && ROLE_CONFIG[activeRole]) {
      var rc      = ROLE_CONFIG[activeRole];
      var session = window.CFAuth ? window.CFAuth.getSession() : null;

      var badge = document.createElement('div');
      badge.className = 'cf-nav__role-badge';
      badge.id        = 'cf-nav-role-badge';
      badge.innerHTML =
        '<i data-lucide="' + rc.icon + '" style="width:12px;height:12px"></i>' +
        '<span>' + rc.label + (session ? ' — ' + session.name : '') + '</span>';
      badge.style.setProperty('--badge-color', rc.color);
      actions.appendChild(badge);
    }

    /* Reset demo button */
    if (window.CampusFlow) {
      var resetBtn = document.createElement('button');
      resetBtn.className = 'cf-btn cf-btn--outline cf-btn--sm';
      resetBtn.id        = 'cf-nav-reset-btn';
      resetBtn.title     = 'Reset demo data to seed state';
      resetBtn.innerHTML =
        '<i data-lucide="refresh-cw" style="width:13px;height:13px"></i>' +
        '<span>Reset Demo</span>';
      resetBtn.addEventListener('click', function () {
        if (confirm('Reset all demo data to the original seed state?\n\nThis cannot be undone.')) {
          window.CampusFlow.resetToSeed();
          if (window.CFToast) window.CFToast.success('Demo data reset to seed state.');
          setTimeout(function () { location.reload(); }, 800);
        }
      });
      actions.appendChild(resetBtn);
    }

    /* Logout button */
    var logoutBtn = document.createElement('button');
    logoutBtn.className = 'cf-btn cf-btn--ghost cf-btn--sm';
    logoutBtn.id        = 'cf-nav-logout-btn';
    logoutBtn.innerHTML =
      '<i data-lucide="log-out" style="width:13px;height:13px"></i>' +
      '<span>Logout</span>';
    logoutBtn.addEventListener('click', function () {
      if (window.CFAuth) {
        window.CFAuth.logout();
      } else {
        window.location.href = 'index.html';
      }
    });
    actions.appendChild(logoutBtn);

    nav.appendChild(actions);
    return nav;
  }

  window.CFNav = { inject: inject, ROLE_CONFIG: ROLE_CONFIG };

})();

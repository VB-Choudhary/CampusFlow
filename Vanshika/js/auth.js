/* ============================================================
   CampusFlow — js/auth.js
   Simulated demo authentication and role-based access control.

   SECURITY NOTE: This is a frontend-only demo. Credentials are
   stored in plain JavaScript and localStorage. This does NOT
   provide real security — it is suitable for demonstration only.
   ============================================================ */

(function () {
  'use strict';

  var AUTH_KEY = 'campusflow_auth_v1'; // separate from app data key

  /* ── Demo credentials ──────────────────────────────────────
     username  : password   → role key → redirect
  ─────────────────────────────────────────────────────────── */
  var DEMO_USERS = [
    { username: 'student',  password: 'demo123', role: 'student',  name: 'Priya Sharma',       href: 'student.html'     },
    { username: 'warden',   password: 'demo123', role: 'warden',   name: 'Dr. A. Kulkarni',    href: 'warden.html'      },
    { username: 'dean',     password: 'demo123', role: 'dean',     name: 'Prof. R. Mehta',     href: 'dean.html'        },
    { username: 'vani',     password: 'demo123', role: 'vani',     name: 'Mrs. S. Deshpande',  href: 'vani-mandir.html' },
    { username: 'security', password: 'demo123', role: 'security', name: 'Guard – Main Gate',  href: 'security.html'    }
  ];

  /* ── Role → allowed page mapping ──────────────────────────
     Each role may only access its own dashboard page filename.
  ─────────────────────────────────────────────────────────── */
  var ROLE_PAGES = {
    student:  'student.html',
    warden:   'warden.html',
    dean:     'dean.html',
    vani:     'vani-mandir.html',
    security: 'security.html'
  };

  /* ── Helpers ───────────────────────────────────────────── */
  function currentPageFile() {
    var parts = window.location.pathname.split('/');
    return parts[parts.length - 1] || 'index.html';
  }

  function getSession() {
    try {
      var raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function setSession(user) {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify({
        role:     user.role,
        username: user.username,
        name:     user.name,
        loginAt:  new Date().toISOString()
      }));
    } catch (e) {
      console.warn('[CampusFlow Auth] localStorage write failed');
    }
  }

  function clearSession() {
    try { localStorage.removeItem(AUTH_KEY); } catch (e) {}
  }

  /* ── Login validation ──────────────────────────────────── */
  function login(username, password) {
    var u = username.trim().toLowerCase();
    var p = password;
    for (var i = 0; i < DEMO_USERS.length; i++) {
      var user = DEMO_USERS[i];
      if (user.username === u && user.password === p) {
        setSession(user);
        return { success: true, user: user };
      }
    }
    return { success: false };
  }

  function logout() {
    clearSession();
    window.location.href = 'index.html';
  }

  /* ── Role guard — call this at the top of every dashboard ─
     pagRole: the role that owns this page (e.g. 'student')
     If not logged in → index.html
     If wrong role    → that role's own page
  ─────────────────────────────────────────────────────────── */
  function requireRole(pageRole) {
    var session = getSession();

    if (!session) {
      // Not logged in at all
      window.location.href = 'index.html';
      return false;
    }

    if (session.role !== pageRole) {
      // Logged in but wrong role → redirect to their own dashboard
      var ownPage = ROLE_PAGES[session.role] || 'index.html';
      window.location.href = ownPage;
      return false;
    }

    return true; // access granted
  }

  /* ── Redirect logged-in users away from login page ────── */
  function redirectIfLoggedIn() {
    var session = getSession();
    if (session && ROLE_PAGES[session.role]) {
      window.location.href = ROLE_PAGES[session.role];
    }
  }

  /* ── Public API ────────────────────────────────────────── */
  window.CFAuth = {
    login:             login,
    logout:            logout,
    getSession:        getSession,
    requireRole:       requireRole,
    redirectIfLoggedIn: redirectIfLoggedIn,
    DEMO_USERS:        DEMO_USERS,
    ROLE_PAGES:        ROLE_PAGES
  };

  console.log('[CampusFlow] auth.js ready.');

})();

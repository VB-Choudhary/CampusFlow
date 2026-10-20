# CampusFlow — Leave & Gate-Pass Management System

> **Frontend Demo · Stage 1 · Branch: `Main1` · Module: `Vanshika/`**  
> Repository: `VB-Choudhary/CampusFlow`

---

## How to run locally

1. Clone or pull the `Main1` branch of `VB-Choudhary/CampusFlow`.
2. Open **Windows File Explorer** → navigate to `CampusFlow/Vanshika/`.
3. **Double-click `index.html`** — it opens in your default browser directly via the `file://` protocol.
4. Log in with any of the demo credentials below.
5. **No build step, no Node.js, no local server required.**

> **Note:** Lucide icons and Google Fonts require an internet connection (loaded from CDN).
> If you are offline, the layout will still work; icons will be invisible.

---

## Demo Credentials

All passwords are `demo123`.

| Role | Username | Password | Dashboard |
|------|----------|----------|-----------|
| Student | `student` | `demo123` | `student.html` |
| Warden | `warden` | `demo123` | `warden.html` |
| Dean / Department | `dean` | `demo123` | `dean.html` |
| Vani Mandir | `vani` | `demo123` | `vani-mandir.html` |
| Security | `security` | `demo123` | `security.html` |

A **"Demo Credentials"** expand panel on the login page shows all credentials with one-click fill buttons.

---

## Role → Dashboard Mapping

| Role | File | Responsibility |
|------|------|----------------|
| Student | `student.html` | Submit leave, simulate parent email approval, track status |
| Warden | `warden.html` | Initial approval queue, Final approval queue, Student 360° |
| Dean / Department | `dean.html` | Normal Leave approval; Vacation Bypass auto-skips this step |
| Vani Mandir | `vani-mandir.html` | Record verification, issue QR gate-pass token |
| Security | `security.html` | Validate gate-pass token, record campus exit |

**Parent is not a dashboard role.** Parent approval is simulated inside the Student Dashboard.

---

## Normal Leave Workflow

```
Student Submits
  → Parent Approval (simulated in Student Dashboard)
    → Warden Initial Approval
      → Vani Mandir Verification
        → Dean / Department Approval  ← Normal Leave only
          → Warden Final Approval
            → Vani Mandir issues Gate Pass Token
              → Security validates token and records exit
```

---

## Vacation Bypass Workflow

```
Student Submits (selects Vacation Leave type)
  → Parent Approval (simulated in Student Dashboard)
    → Warden Initial Approval
      → Vani Mandir Verification
        → Dean / Department  ← AUTO-BYPASSED with recorded reason
          → Warden Final Approval
            → Vani Mandir issues Gate Pass Token
              → Security validates token and records exit
```

The Dean stage is **never hidden** for Vacation Bypass — it shows a purple `BYPASSED` chip with the official reason logged in the timeline.

---

## Pre-Loaded Demo Records

Two records are seeded automatically on first use.

### L001 — Normal Leave (Priya Sharma)
- **Student:** Priya Sharma · Roll 21CS101 · Kaveri Block
- **Leave type:** Normal Leave
- **Destination:** Home – Pune, Maharashtra
- **Dates:** 25 Oct → 28 Oct 2026
- **Parent approval:** ✅ Approved
- **Warden Initial:** ⏳ **Pending** — appears in Warden Initial Approval Queue

### L002 — Vacation Bypass (Ananya Verma)
- **Student:** Ananya Verma · Roll 21EC103 · Godavari Block
- **Leave type:** Vacation Bypass
- **Destination:** Home – Jaipur, Rajasthan
- **Dates:** 30 Oct → 05 Nov 2026
- **Parent approval:** ✅ Approved
- **Warden Initial:** ✅ Approved
- **Vani Mandir Verify:** ✅ Approved
- **Dean Approval:** 🟣 Bypassed (Vacation policy)
- **Warden Final:** ⏳ **Pending** — appears in Warden Final Approval Queue

### Demonstrating the queues
1. Log in as **Warden** (`warden` / `demo123`).
2. L001 appears in the **Initial Approval Queue**.
3. L002 appears in the **Final Approval Queue**.

---

## How Simulated Parent Email Approval Works

1. The Student submits a leave application.
2. A simulated email preview is generated with the student's details and leave dates.
3. In the **"Parent Email Approval"** section of the Student Dashboard:
   - Select the application whose parent approval is pending.
   - Click **Approve** or **Reject** to simulate the parent's email response.
4. The application status updates immediately and the timeline records the action.
5. **No real email is sent. No external service is contacted.**

---

## How to Test Gate-Pass Generation and Security Exit

1. Advance an application through all required stages by logging in as each role in order.
2. Log in as **Warden** → approve Warden Final for the application.
3. Log in as **Vani Mandir** → the application appears in **Gate Pass Issuance Queue**.
4. Click **Issue Pass** → a QR modal appears with a unique token (`CF-L00X-…`).
5. Log in as **Security** → enter the token or click the quick-fill button.
6. Click **Confirm Exit & Record** → the exit is logged with a timestamp.
7. The same token cannot be used again (shows "ALREADY EXITED").

---

## How to Reset Demo Data

- Click the **Reset Demo** button in the navigation bar on any dashboard.
- Confirm the prompt.
- All applications revert to the original L001 / L002 seed state.
- Your login session is **not** cleared by a reset.
- **Reset only happens when you explicitly click the button — it never happens automatically on page load.**

---

## LocalStorage Persistence

- **Application data** is stored under the key `campusflow_data_v1`.
- **Login session** is stored under the key `campusflow_auth_v1`.
- Both keys are stored in the browser's localStorage for the current origin (the `file://` path).
- Data persists across page refreshes and browser restarts until cleared manually or via Reset Demo.
- Data is **not shared** across different browsers, browser profiles, or devices.
- Clearing browser data / site data / localStorage will reset the application.

---

## Authentication — Limitations

- This is **client-side simulated authentication only**.
- Credentials are stored in plain JavaScript (`js/auth.js`) and can be viewed in the browser's DevTools.
- The login session is stored in `localStorage` and can be modified by any user with DevTools access.
- **This is not secure and does not replace server-side authentication.**
- It is suitable for a frontend demonstration only.
- Each dashboard page calls `CFAuth.requireRole('<role>')` synchronously; if the session is absent or the role does not match, the page redirects immediately to `index.html` (or the user's own dashboard).

---

## No Real Services

This application provides **no**:
- Real OCR (document scanning is simulated with pre-filled values)
- Real email delivery (parent approval is a button click in the UI)
- Server-side database (all data lives in browser localStorage)
- Real QR scanning (the gate-pass QR is a visual placeholder)
- Real security validation (token check is a localStorage lookup)
- Backend API of any kind
- Vercel deployment (deployment is not part of this task)

---

## File Structure

```
Vanshika/
├── index.html              Login page (role-based redirect after login)
├── student.html            Student dashboard
├── warden.html             Warden dashboard
├── dean.html               Dean / Department dashboard
├── vani-mandir.html        Vani Mandir dashboard
├── security.html           Security dashboard
├── README.md               This file
│
├── css/
│   └── styles.css          Complete design system
│
└── js/
    ├── auth.js             Demo authentication, role guard, session management
    ├── data.js             Global state, seed data, localStorage persistence
    ├── nav.js              Role-aware navigation header (Logout button)
    ├── timeline.js         Workflow timeline renderer
    ├── student360.js       Student 360° side-drawer component
    ├── toast.js            Toast notification system
    ├── student.js          Student dashboard logic
    ├── warden.js           Warden dashboard logic
    ├── dean.js             Dean dashboard logic
    ├── vani-mandir.js      Vani Mandir dashboard logic
    └── security.js         Security dashboard logic
```

**18 files total.** No `parent.html` or `js/parent.js` — parent approval is simulated in `student.js`.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Markup | HTML5, semantic elements, ARIA |
| Styling | Vanilla CSS (custom properties, no Tailwind) |
| Logic | Vanilla JavaScript (ES5 IIFEs, no modules) |
| Icons | Lucide Icons via CDN |
| Fonts | Inter — Google Fonts |
| State | `window.CampusFlow` + `localStorage` |
| Auth | `window.CFAuth` + `localStorage` (simulated) |

**No ES modules, no `import`/`export`, no bundler** — required for `file://` protocol compatibility.

---

## Authors

| Module | Contributor |
|--------|-------------|
| Frontend (this module) | Vanshika Jain |
| Backend / Integration | Varsha (varsha/) |

---

*CampusFlow — Stage 1 Frontend Demo · October 2026 · Branch: Main1*

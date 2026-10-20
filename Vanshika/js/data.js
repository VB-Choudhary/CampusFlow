/* ============================================================
   CampusFlow — js/data.js
   Global state, seed data, localStorage persistence
   No ES modules — attaches to window.CampusFlow
   ============================================================ */

(function () {
  'use strict';

  var STORAGE_KEY = 'campusflow_data_v1';

  /* ── Seed Data ─────────────────────────────────────────── */
  var SEED_REQUESTS = [
    {
      /* L001 — Normal Leave. Parent approved. Warden Initial PENDING.
         → Must appear in Warden Initial Approval Queue. */
      id: 'L001',
      studentId: 'STU-2021-101',
      studentName: 'Priya Sharma',
      roll: '21CS101',
      hostel: 'Kaveri Block – Room 204',
      contact: '9876543210',
      parentName: 'Ramesh Sharma',
      parentEmail: 'ramesh.sharma@example.com',
      parentPhone: '9876543200',
      leaveType: 'normal',
      destination: 'Home – Pune, Maharashtra',
      reason: "Father's medical check-up and family function.",
      fromDate: '2026-10-25',
      toDate: '2026-10-28',
      applicationImageUrl: null,
      submittedAt: '2026-10-20T10:15:00+05:30',

      stages: {
        parentApproval:  { status: 'approved', actorNote: 'I approve this leave.', actedAt: '2026-10-20T11:00:00+05:30' },
        wardenInitial:   { status: 'pending',  actorNote: '', actedAt: null },
        vaniMandirVerify:{ status: 'waiting',  actorNote: '', actedAt: null },
        deanApproval:    { status: 'waiting',  actorNote: '', actedAt: null },
        wardenFinal:     { status: 'waiting',  actorNote: '', actedAt: null },
        gatePass:        { status: 'waiting',  token: null, issuedAt: null }
      },

      exitRecorded: false,
      exitAt: null,
      createdAt: '2026-10-20T10:15:00+05:30'
    },
    {
      /* L002 — Vacation Bypass. All stages done except Warden Final.
         → Must appear in Warden Final Approval Queue. */
      id: 'L002',
      studentId: 'STU-2021-103',
      studentName: 'Ananya Verma',
      roll: '21EC103',
      hostel: 'Godavari Block – Room 110',
      contact: '9812345670',
      parentName: 'Suresh Verma',
      parentEmail: 'suresh.verma@example.com',
      parentPhone: '9812345600',
      leaveType: 'vacation',
      destination: 'Home – Jaipur, Rajasthan',
      reason: 'Diwali vacation as per official university calendar.',
      fromDate: '2026-10-30',
      toDate: '2026-11-05',
      applicationImageUrl: null,
      submittedAt: '2026-10-20T09:00:00+05:30',

      stages: {
        parentApproval:  { status: 'approved',  actorNote: 'Approved by parent.', actedAt: '2026-10-20T09:45:00+05:30' },
        wardenInitial:   { status: 'approved',  actorNote: 'Verified. Initial approval granted.', actedAt: '2026-10-20T10:30:00+05:30' },
        vaniMandirVerify:{ status: 'approved',  actorNote: 'Records verified. No discrepancies.', actedAt: '2026-10-20T11:45:00+05:30' },
        deanApproval:    { status: 'bypassed',  actorNote: 'Vacation Bypass – Dean/Department approval not required per university policy.', actedAt: '2026-10-20T09:00:00+05:30', bypassReason: 'Official Diwali vacation period (university circular dated 2026-10-01).' },
        wardenFinal:     { status: 'pending',   actorNote: '', actedAt: null },
        gatePass:        { status: 'waiting',   token: null, issuedAt: null }
      },

      exitRecorded: false,
      exitAt: null,
      createdAt: '2026-10-20T09:00:00+05:30'
    }
  ];

  /* ── Students master list ──────────────────────────────── */
  var STUDENTS = [
    { id: 'STU-2021-101', name: 'Priya Sharma',   roll: '21CS101', branch: 'B.Tech CSE', year: '4th Year', hostel: 'Kaveri Block – Room 204',    contact: '9876543210', parentName: 'Ramesh Sharma',  parentPhone: '9876543200', cgpa: '8.7', leaveBalance: 12 },
    { id: 'STU-2021-103', name: 'Ananya Verma',   roll: '21EC103', branch: 'B.Tech ECE', year: '4th Year', hostel: 'Godavari Block – Room 110',  contact: '9812345670', parentName: 'Suresh Verma',   parentPhone: '9812345600', cgpa: '7.9', leaveBalance: 9  },
    { id: 'STU-2022-201', name: 'Sneha Patel',    roll: '22CS201', branch: 'B.Tech CSE', year: '3rd Year', hostel: 'Kaveri Block – Room 312',    contact: '9898989898', parentName: 'Dinesh Patel',   parentPhone: '9898989800', cgpa: '9.1', leaveBalance: 15 },
    { id: 'STU-2023-301', name: 'Rohan Kulkarni', roll: '23EC301', branch: 'B.Tech ECE', year: '2nd Year', hostel: 'Saraswati Block – Room 205', contact: '9123456789', parentName: 'Vijay Kulkarni', parentPhone: '9123456700', cgpa: '8.2', leaveBalance: 10 }
  ];

  /* ── Stage order definitions ───────────────────────────── */
  var STAGE_ORDER = [
    'parentApproval',
    'wardenInitial',
    'vaniMandirVerify',
    'deanApproval',
    'wardenFinal',
    'gatePass'
  ];

  var STAGE_LABELS = {
    parentApproval:   'Parent Approval',
    wardenInitial:    'Warden Initial Approval',
    vaniMandirVerify: 'Vani Mandir Verification',
    deanApproval:     'Dean / Department Approval',
    wardenFinal:      'Warden Final Approval',
    gatePass:         'Gate Pass Issued'
  };

  /* ── Token counter ─────────────────────────────────────── */
  var _tokenCounter = 3; // L001 and L002 pre-seeded

  /* ── Core helpers ──────────────────────────────────────── */
  function generateToken(id) {
    var ts = Date.now().toString(36).toUpperCase();
    return 'CF-' + id + '-' + ts;
  }

  function generateId() {
    _tokenCounter++;
    return 'L' + (_tokenCounter < 10 ? '00' : _tokenCounter < 100 ? '0' : '') + _tokenCounter;
  }

  function now() {
    return new Date().toISOString();
  }

  function dateLabel(isoStr) {
    if (!isoStr) return '—';
    var d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function timeLabel(isoStr) {
    if (!isoStr) return '—';
    var d = new Date(isoStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  function dateTimeLabel(isoStr) {
    if (!isoStr) return '—';
    return dateLabel(isoStr) + ' ' + timeLabel(isoStr);
  }

  /* ── Current stage logic ───────────────────────────────── */
  function currentStage(req) {
    for (var i = 0; i < STAGE_ORDER.length; i++) {
      var key = STAGE_ORDER[i];
      var s = req.stages[key];
      if (!s) continue;
      if (s.status === 'pending' || s.status === 'waiting') return key;
      if (s.status === 'rejected') return key;
    }
    return 'gatePass'; // all done
  }

  function isCompleted(req) {
    return req.stages.gatePass && req.stages.gatePass.status === 'approved';
  }

  function overallStatus(req) {
    for (var i = 0; i < STAGE_ORDER.length; i++) {
      if (req.stages[STAGE_ORDER[i]].status === 'rejected') return 'rejected';
    }
    if (isCompleted(req)) return 'approved';
    return 'pending';
  }

  function studentById(id) {
    for (var i = 0; i < STUDENTS.length; i++) {
      if (STUDENTS[i].id === id) return STUDENTS[i];
    }
    return null;
  }

  function requestById(id) {
    var state = CF.state;
    for (var i = 0; i < state.requests.length; i++) {
      if (state.requests[i].id === id) return state.requests[i];
    }
    return null;
  }

  /* ── Persistence ───────────────────────────────────────── */
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(CF.state));
    } catch (e) {
      console.warn('[CampusFlow] localStorage save failed:', e);
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.requests)) {
          CF.state = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('[CampusFlow] localStorage load failed:', e);
    }
    resetToSeed();
  }

  function resetToSeed() {
    CF.state = {
      requests: JSON.parse(JSON.stringify(SEED_REQUESTS))
    };
    _tokenCounter = 3;
    save();
  }

  /* ── Workflow actions ──────────────────────────────────── */
  function advanceStage(reqId, stageName, action, note) {
    var req = requestById(reqId);
    if (!req) return false;
    var stage = req.stages[stageName];
    if (!stage) return false;

    if (action === 'approve') {
      stage.status = 'approved';
    } else if (action === 'reject') {
      stage.status = 'rejected';
    }
    stage.actorNote = note || '';
    stage.actedAt   = now();

    // Auto-set next stage to pending
    var idx = STAGE_ORDER.indexOf(stageName);
    if (action === 'approve' && idx < STAGE_ORDER.length - 1) {
      var next = STAGE_ORDER[idx + 1];
      var nextStage = req.stages[next];
      if (nextStage && nextStage.status === 'waiting') {
        // Skip bypassed stages
        if (nextStage.status === 'bypassed') {
          // keep, already handled
        } else {
          nextStage.status = 'pending';
        }
      }
    }

    save();
    return true;
  }

  function issueGatePass(reqId) {
    var req = requestById(reqId);
    if (!req) return null;
    var gp = req.stages.gatePass;
    if (!gp) return null;
    var token = generateToken(reqId);
    gp.token    = token;
    gp.status   = 'approved';
    gp.issuedAt = now();
    save();
    return token;
  }

  function recordExit(reqId) {
    var req = requestById(reqId);
    if (!req) return false;
    req.exitRecorded = true;
    req.exitAt       = now();
    save();
    return true;
  }

  function submitLeave(data) {
    /* data: { studentId, studentName, roll, hostel, contact, parentName, parentEmail,
               parentPhone, leaveType, destination, reason, fromDate, toDate } */
    var id  = generateId();
    var req = {
      id: id,
      studentId:         data.studentId,
      studentName:       data.studentName,
      roll:              data.roll,
      hostel:            data.hostel,
      contact:           data.contact,
      parentName:        data.parentName,
      parentEmail:       data.parentEmail,
      parentPhone:       data.parentPhone,
      leaveType:         data.leaveType,
      destination:       data.destination,
      reason:            data.reason,
      fromDate:          data.fromDate,
      toDate:            data.toDate,
      applicationImageUrl: data.applicationImageUrl || null,
      submittedAt:       now(),

      stages: {
        parentApproval:  { status: 'pending', actorNote: '', actedAt: null },
        wardenInitial:   { status: 'waiting', actorNote: '', actedAt: null },
        vaniMandirVerify:{ status: 'waiting', actorNote: '', actedAt: null },
        deanApproval:    data.leaveType === 'vacation'
          ? { status: 'bypassed', actorNote: 'Vacation Leave – Dean approval bypassed per university policy.', actedAt: now(), bypassReason: 'Official vacation period (Dean bypass rule active).' }
          : { status: 'waiting', actorNote: '', actedAt: null },
        wardenFinal:     { status: 'waiting', actorNote: '', actedAt: null },
        gatePass:        { status: 'waiting', token: null, issuedAt: null }
      },

      exitRecorded: false,
      exitAt:       null,
      createdAt:    now()
    };

    CF.state.requests.unshift(req);
    save();
    return req;
  }

  function parentApprove(reqId, approved, note) {
    var req = requestById(reqId);
    if (!req) return false;
    var pa = req.stages.parentApproval;
    pa.status   = approved ? 'approved' : 'rejected';
    pa.actorNote = note || (approved ? 'Approved by parent.' : 'Rejected by parent.');
    pa.actedAt   = now();
    if (approved) {
      req.stages.wardenInitial.status = 'pending';
    }
    save();
    return true;
  }

  /* ── Queries ───────────────────────────────────────────── */
  function requestsForStage(stageName, statusFilter) {
    return CF.state.requests.filter(function (r) {
      var s = r.stages[stageName];
      if (!s) return false;
      if (statusFilter) return s.status === statusFilter;
      return true;
    });
  }

  function requestsByStudent(studentId) {
    return CF.state.requests.filter(function (r) {
      return r.studentId === studentId;
    });
  }

  /* ── Statistics helpers ────────────────────────────────── */
  function stats() {
    var all = CF.state.requests;
    return {
      total:    all.length,
      pending:  all.filter(function(r){ return overallStatus(r) === 'pending'; }).length,
      approved: all.filter(function(r){ return overallStatus(r) === 'approved'; }).length,
      rejected: all.filter(function(r){ return overallStatus(r) === 'rejected'; }).length,
      exited:   all.filter(function(r){ return r.exitRecorded; }).length
    };
  }

  /* ── Public namespace ──────────────────────────────────── */
  var CF = {
    state: { requests: [] },

    STAGE_ORDER:  STAGE_ORDER,
    STAGE_LABELS: STAGE_LABELS,
    STUDENTS:     STUDENTS,

    // Helpers
    generateToken:    generateToken,
    generateId:       generateId,
    now:              now,
    dateLabel:        dateLabel,
    timeLabel:        timeLabel,
    dateTimeLabel:    dateTimeLabel,

    // Queries
    currentStage:     currentStage,
    isCompleted:      isCompleted,
    overallStatus:    overallStatus,
    studentById:      studentById,
    requestById:      requestById,
    requestsForStage: requestsForStage,
    requestsByStudent:requestsByStudent,
    stats:            stats,

    // Actions
    submitLeave:   submitLeave,
    parentApprove: parentApprove,
    advanceStage:  advanceStage,
    issueGatePass: issueGatePass,
    recordExit:    recordExit,

    // Persistence
    save:        save,
    load:        load,
    resetToSeed: resetToSeed
  };

  window.CampusFlow = CF;

  // Auto-load on script parse
  load();

  console.log('[CampusFlow] data.js ready. Requests:', CF.state.requests.length);
})();

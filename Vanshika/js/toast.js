/* ============================================================
   CampusFlow — js/toast.js
   Lightweight toast notification system
   Depends on: styles.css
   ============================================================ */

(function () {
  'use strict';

  var DURATION = 3500; // ms

  function ensureContainer() {
    var c = document.getElementById('cf-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'cf-toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function show(message, type, duration) {
    var container = ensureContainer();
    type     = type     || 'info';
    duration = duration || DURATION;

    var toast = document.createElement('div');
    toast.className = 'cf-toast cf-toast--' + type;

    // Icon mapping
    var icons = {
      success: '<i data-lucide="check-circle" style="width:18px;height:18px;flex-shrink:0"></i>',
      error:   '<i data-lucide="x-circle"     style="width:18px;height:18px;flex-shrink:0"></i>',
      warning: '<i data-lucide="alert-triangle" style="width:18px;height:18px;flex-shrink:0"></i>',
      info:    '<i data-lucide="info"          style="width:18px;height:18px;flex-shrink:0"></i>'
    };

    toast.innerHTML = (icons[type] || icons.info) +
      '<span style="flex:1">' + message + '</span>';

    container.appendChild(toast);

    // Re-render lucide icons for the new toast
    if (window.lucide) {
      window.lucide.createIcons();
    }

    setTimeout(function () {
      toast.classList.add('leaving');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);

    return toast;
  }

  window.CFToast = {
    show:    show,
    success: function(msg, dur) { return show(msg, 'success', dur); },
    error:   function(msg, dur) { return show(msg, 'error',   dur); },
    warning: function(msg, dur) { return show(msg, 'warning', dur); },
    info:    function(msg, dur) { return show(msg, 'info',    dur); }
  };

})();

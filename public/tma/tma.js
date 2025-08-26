(function (window) {
  // Minimal Telegram Mini App (TMA) shim.
  // Exposes a simple `tma` object on window with a small subset of the WebApp API
  // It delegates to Telegram's WebApp if present, otherwise provides a harmless fallback

  var native = (window.Telegram && window.Telegram.WebApp) || window.TelegramWebApp || null;
  var events = {};

  function isFn(v) { return typeof v === 'function'; }

  var tma = {
    isTelegram: !!native,

    init: function (config) {
      if (native && config) {
        try {
          // try to apply some basic config to native API if available
          if (config.backgroundColor && isFn(native.setBackgroundColor)) {
            native.setBackgroundColor(config.backgroundColor);
          }
        } catch (e) {
          console.warn('tma.init native set failed', e);
        }
      }
      return this;
    },

    ready: function (cb) {
      if (native) {
        try {
          native.ready && native.ready();
        } catch (e) { /* ignore */ }
        if (isFn(cb)) cb(native);
      } else {
        // fallback: call cb next tick
        setTimeout(function () { if (isFn(cb)) cb(tma); }, 0);
      }
    },

    getInitData: function () {
      return native ? native.initData : (window.__TMA_INIT_DATA__ || null);
    },

    getUser: function () {
      try {
        if (native && native.initDataUnsafe) return native.initDataUnsafe.user || null;
      } catch (e) { /* ignore */ }
      return null;
    },

    sendData: function (data) {
      if (native && isFn(native.sendData)) {
        try {
          native.sendData(typeof data === 'string' ? data : JSON.stringify(data));
        } catch (e) {
          console.warn('tma.sendData failed', e);
        }
      } else {
        console.log('tma.sendData (fallback) ->', data);
      }
    },

    close: function () {
      if (native && isFn(native.close)) {
        try { native.close(); } catch (e) { /* ignore */ }
      } else {
        console.log('tma.close (fallback)');
      }
    },

    on: function (name, cb) {
      if (!name || !isFn(cb)) return;
      if (native && isFn(native.onEvent)) {
        try { native.onEvent(name, cb); } catch (e) { /* ignore */ }
        return;
      }
      events[name] = events[name] || [];
      events[name].push(cb);
    },

    off: function (name, cb) {
      if (!name) return;
      if (native && isFn(native.offEvent)) {
        try { native.offEvent(name, cb); } catch (e) { /* ignore */ }
        return;
      }
      if (!events[name]) return;
      if (!cb) { events[name] = []; return; }
      events[name] = events[name].filter(function (f) { return f !== cb; });
    },

    _emit: function (name, payload) {
      // For local testing only: emits to registered handlers
      var list = events[name] || [];
      list.forEach(function (cb) { try { cb(payload); } catch (e) { console.error(e); } });
    }
  };

  // Expose globally
  try {
    window.tma = window.tma || tma;
  } catch (e) {
    console.warn('unable to attach tma', e);
  }

})(window);

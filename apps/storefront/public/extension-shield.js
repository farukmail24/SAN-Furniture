/**
 * SAN Furniture - Third-Party Browser Extension Error Shield
 * Intercepts, silences, and purges runtime errors thrown by browser extensions
 * (such as coupon searchers, video downloaders, translation tools, e.g. 200.js / M_ID)
 * so that Next.js development error overlays never interrupt testing.
 */
(function () {
  if (typeof window === "undefined") return;

  function isIgnored(val) {
    if (!val) return false;
    var str = "";
    try {
      if (typeof val === "string") {
        str = val;
      } else if (val instanceof Error) {
        str = (val.message || "") + " " + (val.stack || "");
      } else if (typeof val === "object") {
        str =
          (val.message || "") +
          " " +
          (val.filename || "") +
          " " +
          (val.source || "") +
          " " +
          (val.reason && (val.reason.message || val.reason.stack || "")) +
          " " +
          (val.error && (val.error.message || val.error.stack || "")) +
          " " +
          JSON.stringify(val);
      }
    } catch (_) {
      try {
        str = String(val);
      } catch (__) {
        str = "";
      }
    }
    var lower = str.toLowerCase();
    return (
      lower.indexOf("chrome-extension://") !== -1 ||
      lower.indexOf("moz-extension://") !== -1 ||
      lower.indexOf("safari-extension://") !== -1 ||
      lower.indexOf("eppicocmhmnlblhjplcgkofcliegomcon") !== -1 ||
      lower.indexOf("m_id") !== -1 ||
      lower.indexOf("executors/200.js") !== -1 ||
      lower.indexOf("200.js") !== -1
    );
  }

  // 1. Wrap window.addEventListener so Next.js's dev-overlay error listeners never receive extension errors
  var originalAddEventListener = window.addEventListener;
  window.addEventListener = function (type, listener, options) {
    if ((type === "error" || type === "unhandledrejection") && typeof listener === "function") {
      var wrappedListener = function (event) {
        if (isIgnored(event)) {
          if (event && event.stopImmediatePropagation) event.stopImmediatePropagation();
          if (event && event.preventDefault) event.preventDefault();
          return;
        }
        return listener.apply(this, arguments);
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.apply(this, arguments);
  };

  // 2. Immediate capture-phase listeners on window
  originalAddEventListener.call(
    window,
    "error",
    function (e) {
      if (isIgnored(e)) {
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e.preventDefault) e.preventDefault();
      }
    },
    true
  );

  originalAddEventListener.call(
    window,
    "unhandledrejection",
    function (e) {
      if (isIgnored(e)) {
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e.preventDefault) e.preventDefault();
      }
    },
    true
  );

  // 3. Monkeypatch console.error to prevent Next.js dev overlay console interceptor from capturing it
  var originalConsoleError = window.console.error;
  window.console.error = function () {
    for (var i = 0; i < arguments.length; i++) {
      if (isIgnored(arguments[i])) {
        return; // Drop silently
      }
    }
    return originalConsoleError.apply(window.console, arguments);
  };

  // 4. MutationObserver to purge any <nextjs-portal> that renders an extension error
  function purgeExtensionOverlay() {
    try {
      var portals = document.querySelectorAll("nextjs-portal");
      for (var i = 0; i < portals.length; i++) {
        var portal = portals[i];
        var shadow = portal.shadowRoot;
        if (shadow) {
          var content = shadow.innerHTML || "";
          if (isIgnored(content)) {
            portal.remove();
          }
        }
      }
    } catch (_) {}
  }

  if (typeof MutationObserver !== "undefined") {
    var observer = new MutationObserver(function () {
      purgeExtensionOverlay();
    });
    if (document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        observer.observe(document.documentElement, { childList: true, subtree: true });
      });
    }
  }

  setInterval(purgeExtensionOverlay, 400);
})();

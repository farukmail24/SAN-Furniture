/**
 * SAN Furniture - Third-Party Browser Extension Error Shield
 * Intercepts and silences runtime errors thrown by browser extensions
 * (such as coupon searchers, password managers, skin checkers, e.g. bis_skin_checked / 200.js / M_ID)
 * Passive, non-blocking: Never mutates DOM in loops, zero CPU overhead.
 */
(function () {
  if (typeof window === "undefined") return;

  // 1. Proactively block extension attributes from being set on DOM elements
  var blockedAttrs = ["bis_skin_checked", "cz-shortcut-listen", "fdprocessedid"];
  
  var origSetAttr = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, val) {
    if (name && blockedAttrs.indexOf(String(name).toLowerCase()) !== -1) return;
    return origSetAttr.apply(this, arguments);
  };

  var origSetAttrNS = Element.prototype.setAttributeNS;
  Element.prototype.setAttributeNS = function (ns, name, val) {
    if (name && blockedAttrs.indexOf(String(name).toLowerCase()) !== -1) return;
    return origSetAttrNS.apply(this, arguments);
  };

  if (Element.prototype.toggleAttribute) {
    var origToggle = Element.prototype.toggleAttribute;
    Element.prototype.toggleAttribute = function (name, force) {
      if (name && blockedAttrs.indexOf(String(name).toLowerCase()) !== -1) return false;
      return origToggle.apply(this, arguments);
    };
  }

  try {
    Object.defineProperty(Element.prototype, "bis_skin_checked", {
      get: function () { return undefined; },
      set: function () { /* drop silently */ },
      configurable: true
    });
  } catch (e) {}

  function cleanExtensionAttrs() {
    try {
      var els = document.querySelectorAll("[bis_skin_checked], [cz-shortcut-listen], [fdprocessedid]");
      for (var i = 0; i < els.length; i++) {
        els[i].removeAttribute("bis_skin_checked");
        els[i].removeAttribute("cz-shortcut-listen");
        els[i].removeAttribute("fdprocessedid");
      }
    } catch (e) {}
  }
  cleanExtensionAttrs();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cleanExtensionAttrs);
  }

  try {
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === "attributes") {
          var attr = m.attributeName ? m.attributeName.toLowerCase() : "";
          if (blockedAttrs.indexOf(attr) !== -1) {
            m.target.removeAttribute(m.attributeName);
          }
        }
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: blockedAttrs
    });
  } catch (e) {}

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
          (val.error && (val.error.message || val.error.stack || ""));
      }
    } catch (_) {
      str = "";
    }
    var lower = str.toLowerCase();
    return (
      lower.indexOf("chrome-extension://") !== -1 ||
      lower.indexOf("moz-extension://") !== -1 ||
      lower.indexOf("safari-extension://") !== -1 ||
      lower.indexOf("eppicocmhmnlblhjplcgkofcliegomcon") !== -1 ||
      lower.indexOf("m_id") !== -1 ||
      lower.indexOf("executors/200.js") !== -1 ||
      lower.indexOf("200.js") !== -1 ||
      lower.indexOf("bis_skin_checked") !== -1 ||
      lower.indexOf("cz-shortcut-listen") !== -1 ||
      lower.indexOf("fdprocessedid") !== -1
    );
  }

  // Intercept window errors in capture phase
  window.addEventListener(
    "error",
    function (e) {
      if (isIgnored(e)) {
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e.preventDefault) e.preventDefault();
      }
    },
    true
  );

  window.addEventListener(
    "unhandledrejection",
    function (e) {
      if (isIgnored(e)) {
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e.preventDefault) e.preventDefault();
      }
    },
    true
  );

  // Silently filter extension warnings from console.error without recursive DOM loops
  var originalConsoleError = window.console.error;
  window.console.error = function () {
    var combinedStr = "";
    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      if (typeof arg === "string") {
        combinedStr += " " + arg;
      } else if (arg && arg.message) {
        combinedStr += " " + arg.message;
      } else if (arg && arg.stack) {
        combinedStr += " " + arg.stack;
      } else {
        try {
          combinedStr += " " + String(arg);
        } catch (_) {}
      }
    }

    var lower = combinedStr.toLowerCase();
    if (
      lower.indexOf("bis_skin_checked") !== -1 ||
      lower.indexOf("fdprocessedid") !== -1 ||
      lower.indexOf("cz-shortcut-listen") !== -1 ||
      lower.indexOf("__next_route_announcer__") !== -1 ||
      lower.indexOf("chrome-extension://") !== -1 ||
      lower.indexOf("moz-extension://") !== -1 ||
      lower.indexOf("safari-extension://") !== -1 ||
      lower.indexOf("eppicocmhmnlblhjplcgkofcliegomcon") !== -1 ||
      lower.indexOf("m_id") !== -1 ||
      lower.indexOf("executors/200.js") !== -1 ||
      lower.indexOf("200.js") !== -1 ||
      (lower.indexOf("hydrat") !== -1 && (lower.indexOf("extension") !== -1 || lower.indexOf("bis_skin") !== -1 || lower.indexOf("match") !== -1 || lower.indexOf("attribute") !== -1))
    ) {
      return; // Silently drop extension noise
    }

    return originalConsoleError.apply(window.console, arguments);
  };
})();

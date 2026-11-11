"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Trash2
} from "lucide-react";

export type AlertModalType = "danger" | "warning" | "success" | "info";

export interface AlertModalOptions {
  title?: string;
  message: string | React.ReactNode;
  type?: AlertModalType;
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
}

interface InternalAlertState extends AlertModalOptions {
  id: number;
  resolve: (value: boolean) => void;
}

type ModalSubscriber = (state: InternalAlertState | null) => void;

let activeSubscriber: ModalSubscriber | null = null;
let currentResolve: ((value: boolean) => void) | null = null;

/**
 * Global Imperative Confirm Modal
 * Can be called anywhere in client code: `const ok = await showConfirm("Are you sure?");`
 */
export function showConfirm(
  optionsOrMessage: string | AlertModalOptions,
  type: AlertModalType = "danger"
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const opts: AlertModalOptions =
      typeof optionsOrMessage === "string"
        ? {
            title:
              type === "danger"
                ? "Confirm Permanent Action"
                : type === "warning"
                ? "Please Confirm"
                : "Confirmation",
            message: optionsOrMessage,
            type,
            confirmText: type === "danger" ? "Delete / Proceed" : "Confirm",
            cancelText: "Cancel",
            isConfirm: true
          }
        : {
            title: optionsOrMessage.title || "Please Confirm",
            message: optionsOrMessage.message,
            type: optionsOrMessage.type || type,
            confirmText: optionsOrMessage.confirmText || (optionsOrMessage.type === "danger" ? "Delete" : "Confirm"),
            cancelText: optionsOrMessage.cancelText || "Cancel",
            isConfirm: true
          };

    // Close any hanging previous modal safely
    if (currentResolve) {
      currentResolve(false);
      currentResolve = null;
    }

    currentResolve = resolve;

    if (activeSubscriber) {
      activeSubscriber({
        ...opts,
        id: Date.now(),
        resolve
      });
    } else {
      // Fallback if modal provider is not yet mounted (e.g. initial server hydration)
      if (typeof window !== "undefined") {
        const nativeOk = window.confirm(
          typeof opts.message === "string"
            ? `${opts.title ? opts.title + "\n\n" : ""}${opts.message}`
            : String(opts.title || "Confirm")
        );
        resolve(nativeOk);
      } else {
        resolve(false);
      }
    }
  });
}

/**
 * Global Imperative Alert Modal
 * Can be called anywhere in client code: `await showAlert("Item updated successfully", "success");`
 */
export function showAlert(
  optionsOrMessage: string | AlertModalOptions,
  type: AlertModalType = "info"
): Promise<void> {
  return new Promise<void>((resolve) => {
    const opts: AlertModalOptions =
      typeof optionsOrMessage === "string"
        ? {
            title:
              type === "danger"
                ? "Action Required / Error"
                : type === "success"
                ? "Action Successful"
                : type === "warning"
                ? "Notice"
                : "Information",
            message: optionsOrMessage,
            type,
            confirmText: "Done",
            isConfirm: false
          }
        : {
            title:
              optionsOrMessage.title ||
              (optionsOrMessage.type === "danger"
                ? "Action Required / Error"
                : optionsOrMessage.type === "success"
                ? "Action Successful"
                : "Notice"),
            message: optionsOrMessage.message,
            type: optionsOrMessage.type || type,
            confirmText: optionsOrMessage.confirmText || "Done",
            isConfirm: false
          };

    if (currentResolve) {
      currentResolve(false);
      currentResolve = null;
    }

    currentResolve = () => resolve();

    if (activeSubscriber) {
      activeSubscriber({
        ...opts,
        id: Date.now(),
        resolve: () => resolve()
      });
    } else {
      if (typeof window !== "undefined") {
        window.alert(
          typeof opts.message === "string"
            ? `${opts.title ? opts.title + "\n\n" : ""}${opts.message}`
            : String(opts.title || "Notice")
        );
      }
      resolve();
    }
  });
}

// React Context for declarative hook consumers
interface AlertModalContextType {
  confirm: typeof showConfirm;
  alert: typeof showAlert;
}

const AlertModalContext = createContext<AlertModalContextType>({
  confirm: showConfirm,
  alert: showAlert
});

export function useAlertModal() {
  return useContext(AlertModalContext);
}

/**
 * Global Alert Modal Provider
 * Mounts once at the root level (StorefrontShell / RootLayout)
 */
export function AlertModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<InternalAlertState | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeSubscriber = (state) => setModalState(state);
    return () => {
      activeSubscriber = null;
    };
  }, []);

  const handleClose = useCallback(
    (confirmed: boolean) => {
      if (modalState) {
        modalState.resolve(confirmed);
      }
      currentResolve = null;
      setModalState(null);
    },
    [modalState]
  );

  // Keyboard navigation: Escape to cancel, Enter to confirm
  useEffect(() => {
    if (!modalState) return;

    // Focus confirm button when modal opens for immediate keyboard usability
    const timer = setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose(false);
      } else if (e.key === "Enter" && !e.shiftKey) {
        // If Enter is pressed inside an input/button, allow native handling, otherwise confirm
        if (document.activeElement?.tagName !== "TEXTAREA") {
          e.preventDefault();
          handleClose(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalState, handleClose]);

  const type = modalState?.type || "info";

  // Visual Theme mapping based on Alert Type
  const theme = {
    danger: {
      accentBar: "bg-gradient-to-r from-rose-500 via-red-500 to-rose-600",
      iconBg: "bg-rose-50 border-rose-200 text-rose-600 ring-4 ring-rose-500/10",
      icon: <Trash2 className="w-5 h-5 text-rose-600" />,
      confirmBtn:
        "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-md shadow-rose-600/20"
    },
    warning: {
      accentBar: "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500",
      iconBg: "bg-amber-50 border-amber-200 text-amber-600 ring-4 ring-amber-500/10",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20"
    },
    success: {
      accentBar: "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-200 text-emerald-600 ring-4 ring-emerald-500/10",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      confirmBtn: "bg-[#00072D] hover:bg-navy-900 text-[#FAF6EE] shadow-md shadow-navy-950/20 border border-navy-800"
    },
    info: {
      accentBar: "bg-gradient-to-r from-[#00072D] via-[#C89B3C] to-[#00072D]",
      iconBg: "bg-[#FAF6EE] border-[#C89B3C]/50 text-[#00072D] ring-4 ring-[#C89B3C]/10",
      icon: <Info className="w-5 h-5 text-[#C89B3C]" />,
      confirmBtn: "bg-[#00072D] hover:bg-navy-900 text-[#FAF6EE] shadow-md shadow-navy-950/20"
    }
  }[type];

  return (
    <AlertModalContext.Provider value={{ confirm: showConfirm, alert: showAlert }}>
      {children}

      <AnimatePresence>
        {modalState && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop with elegant blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleClose(false)}
              className="fixed inset-0 bg-[#00072D]/75 backdrop-blur-md"
              aria-hidden="true"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", damping: 25, stiffness: 320 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-sand-300 overflow-hidden z-10"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="alert-modal-title"
              aria-describedby="alert-modal-description"
            >
              {/* Top Accent Stripe */}
              <div className={`h-1.5 w-full ${theme.accentBar}`} />

              <div className="p-6">
                {/* Header Row: Icon, Title & Close Button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${theme.iconBg}`}
                    >
                      {theme.icon}
                    </div>
                    <div className="min-w-0">
                      <h3
                        id="alert-modal-title"
                        className="font-display text-base sm:text-lg font-bold text-navy-950 leading-tight truncate"
                      >
                        {modalState.title || "Notification"}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brass-500 shrink-0" />
                        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-navy-400">
                          SAN Furniture UK • Operations Suite
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleClose(false)}
                    className="w-8 h-8 rounded-full bg-sand-100 hover:bg-sand-200 text-navy-500 hover:text-navy-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    aria-label="Close dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Message */}
                {React.isValidElement(modalState.message) ? (
                  <div id="alert-modal-description" className="mt-4">
                    {modalState.message}
                  </div>
                ) : (
                  <div
                    id="alert-modal-description"
                    className="mt-4 text-xs sm:text-sm text-navy-700 leading-relaxed font-normal bg-sand-50/80 p-4 rounded-xl border border-sand-200/80 whitespace-pre-line shadow-2xs"
                  >
                    {modalState.message}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-end gap-2.5">
                  {modalState.isConfirm && (
                    <button
                      type="button"
                      onClick={() => handleClose(false)}
                      className="px-4 py-2.5 rounded-xl border border-sand-300 bg-sand-100 hover:bg-sand-200 text-navy-800 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {modalState.cancelText || "Cancel"}
                    </button>
                  )}

                  <button
                    ref={confirmButtonRef}
                    type="button"
                    onClick={() => handleClose(true)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${theme.confirmBtn}`}
                  >
                    <span>{modalState.confirmText || (modalState.isConfirm ? "Confirm" : "Done")}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AlertModalContext.Provider>
  );
}

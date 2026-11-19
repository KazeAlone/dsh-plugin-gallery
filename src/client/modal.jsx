import React, { useEffect, useRef } from "react";

/** Keep keyboard interaction within the foremost Gallery dialog. */
export function Modal({
  children,
  onClose,
  confirmation = false,
  variant = "",
}) {
  const root = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const overlay = root.current;
    const dialog = overlay.querySelector(
      '[role="dialog"], [role="alertdialog"]',
    );
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    if (variant === "paper-detail") document.body.style.overflow = "hidden";
    const focusable = () =>
      [
        ...dialog.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, [tabindex="0"]',
        ),
      ].filter((el) => el.getClientRects().length && el.type !== "file");
    const initial =
      dialog.querySelector(
        '[autofocus], input:not([type="file"]):not(:disabled)',
      ) ||
      focusable()[0] ||
      dialog;
    initial.focus();
    function handleKey(event) {
      const overlays = document.querySelectorAll("[data-gallery-modal]");
      if (overlays[overlays.length - 1] !== overlay) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close.current?.();
      }
      if (event.key === "Tab") {
        const controls = focusable();
        const first = controls[0],
          last = controls[controls.length - 1];
        if (!first) {
          event.preventDefault();
          dialog.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            !dialog.contains(document.activeElement))
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !dialog.contains(document.activeElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (variant === "paper-detail")
        document.body.style.overflow = oldOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <div
      ref={root}
      data-gallery-modal
      onMouseDown={
        variant === "paper-detail"
          ? (event) => {
              if (event.target === event.currentTarget) close.current?.();
            }
          : undefined
      }
      className={
        confirmation
          ? "gal-overlay gal-confirm-overlay"
          : variant === "paper-detail"
            ? "gal-overlay gal-paper-detail-overlay"
            : "gal-overlay"
      }
    >
      {children}
    </div>
  );
}

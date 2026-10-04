"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Accessible modal: closes on Escape, backdrop click or the X button. */
export function Dialog({
  open,
  onClose,
  label,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Keep the latest onClose without re-running the open/close effect on every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, mounted]);

  if (!open || !mounted) return null;

  // Rendered into <body> so no parent transform or stacking context can trap it.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`pop relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl ${
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        }`}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur hover:bg-black/40"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

"use client";

import { Briefcase, ChevronDown, Ellipsis, GraduationCap, Layers, Smile, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { moreQuestions, quickQuestions, type Intent, type QuickKey } from "@/lib/site";

const ICONS: Record<QuickKey, { Icon: typeof Smile; color: string }> = {
  me: { Icon: Smile, color: "text-teal-500" },
  projects: { Icon: Briefcase, color: "text-emerald-600 dark:text-emerald-400" },
  skills: { Icon: Layers, color: "text-violet-500" },
  experience: { Icon: GraduationCap, color: "text-pink-500" },
  contact: { Icon: UserRound, color: "text-amber-500" },
};

/** Landing page: square tiles with the icon above the label. */
export function QuickTiles({ onAsk }: { onAsk: (q: string, intent?: Intent) => void }) {
  return (
    <ul className="mx-auto grid w-full max-w-[30rem] grid-cols-5 gap-1.5 sm:gap-3">
      {quickQuestions.map(({ key, label, question, intent }) => {
        const { Icon, color } = ICONS[key];
        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => onAsk(question, intent)}
              className="flex h-[68px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface/80 text-xs font-medium shadow-soft backdrop-blur transition-transform hover:-translate-y-0.5 hover:bg-surface sm:h-[72px] sm:text-sm"
            >
              <Icon size={18} className={color} />
              {label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Chat page: a row of chips above the input, plus a "More" menu and a hide toggle. */
export function QuickChips({
  onAsk,
  active,
  disabled,
}: {
  onAsk: (q: string, intent?: Intent) => void;
  active?: string;
  disabled?: boolean;
}) {
  const [hidden, setHidden] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  const ask = (q: string, intent?: Intent) => {
    setMoreOpen(false);
    onAsk(q, intent);
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => setHidden((h) => !h)}
        aria-expanded={!hidden}
        className="mb-2 flex items-center gap-1 text-xs text-muted hover:text-fg"
      >
        <ChevronDown size={14} className={`transition-transform ${hidden ? "rotate-180" : ""}`} />
        {hidden ? "Show quick questions" : "Hide quick questions"}
      </button>

      {!hidden && (
        <div className="relative flex w-full items-center justify-start gap-2 sm:justify-center">
          <ul className="no-scrollbar flex gap-2 overflow-x-auto px-1 py-1">
            {quickQuestions.map(({ key, label, question, intent }) => {
              const { Icon, color } = ICONS[key];
              const isActive = active === question;
              return (
                <li key={key} className="shrink-0">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => ask(question, intent)}
                    className={`flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                      isActive ? "border-border bg-surface-2" : "border-border bg-surface hover:bg-surface-2"
                    }`}
                  >
                    <Icon size={16} className={color} />
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
          <div ref={moreRef} className="relative shrink-0">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setMoreOpen((o) => !o)}
              aria-expanded={moreOpen}
              aria-label="More questions"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface-2 disabled:opacity-50"
            >
              <Ellipsis size={18} />
            </button>
            {moreOpen && (
              <div className="pop absolute right-0 bottom-12 z-30 w-72 rounded-2xl border border-border bg-surface p-1.5 shadow-soft">
                <p className="px-3 pt-2 pb-1 text-xs font-medium text-muted">More questions</p>
                <ul>
                  {moreQuestions.map(({ question, intent }) => (
                    <li key={question}>
                      <button
                        type="button"
                        onClick={() => ask(question, intent)}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-2"
                      >
                        {question}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

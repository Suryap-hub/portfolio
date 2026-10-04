"use client";

import { ArrowUp, Square } from "lucide-react";
import { forwardRef, useState } from "react";

const MAX = 500;

type Props = {
  onSubmit: (text: string) => void;
  onStop?: () => void;
  streaming?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  /** "landing" is the white pill with a soft shadow; "dock" is the grey chat input. */
  variant?: "landing" | "dock";
};

/** The rounded "Ask me anything" pill with a round send / stop button. */
export const ChatInput = forwardRef<HTMLInputElement, Props>(function ChatInput(
  { onSubmit, onStop, streaming = false, autoFocus = false, placeholder = "Ask me anything", variant = "dock" },
  ref,
) {
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (streaming) return;
    const text = value.trim();
    if (!text) return;
    onSubmit(text);
    setValue("");
  };

  const landing = variant === "landing";
  const canSend = value.trim().length > 0;

  return (
    <form onSubmit={submit} className="w-full">
      <div
        className={`flex items-center gap-2 rounded-full border transition-colors focus-within:border-accent/60 ${
          landing
            ? "h-14 border-border bg-surface/90 pr-2 pl-5 shadow-soft backdrop-blur"
            : "h-14 border-transparent bg-surface-2 pr-2 pl-5"
        }`}
      >
        <label htmlFor={`ask-${variant}`} className="sr-only">
          Ask a question
        </label>
        <input
          id={`ask-${variant}`}
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX))}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          enterKeyHint="send"
          className="min-w-0 flex-1 bg-transparent text-[0.97rem] outline-none placeholder:text-subtle"
        />
        {value.length > MAX - 80 && (
          <span className="text-xs text-subtle tabular-nums">
            {value.length}/{MAX}
          </span>
        )}
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop the answer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pill text-pill-fg"
          >
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send question"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-[background-color,opacity] hover:bg-accent-hover disabled:opacity-50"
          >
            <ArrowUp size={19} strokeWidth={2.4} />
          </button>
        )}
      </div>
    </form>
  );
});

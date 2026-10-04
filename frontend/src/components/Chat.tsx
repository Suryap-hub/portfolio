"use client";

import { Check, Copy, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { streamChat, warmUp } from "@/lib/api";
import { site, type Intent } from "@/lib/site";
import type { Card, ChatMessage, StreamEvent } from "@/lib/types";
import { Avatar } from "./Avatar";
import { CardView } from "./Cards";
import { ChatInput } from "./ChatInput";
import { InfoButton, SwitchPill } from "./HeaderBits";
import { Markdown } from "./Markdown";
import { QuickChips, QuickTiles } from "./Quick";

const SLOW_AFTER_MS = 4000;

let counter = 0;
const newId = () => `m${Date.now()}-${counter++}`;

/** What we send back to the API for earlier turns. */
function toApiMessages(messages: ChatMessage[]) {
  return messages
    .filter((m) => !m.error)
    .map((m) => {
      let content = m.text.trim();
      if (m.role === "assistant" && !content && m.cards.length) {
        content = `[Showed ${m.cards.map((c: Card) => c.type).join(" and ")} card]`;
      }
      return { role: m.role, content };
    })
    .filter((m) => m.content);
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface-2 hover:text-fg"
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

export function Chat({ initialQuery, initialIntent }: { initialQuery?: string; initialIntent?: Intent }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;
  const lastQuestion = [...messages].reverse().find((m) => m.role === "user")?.text;

  const updateLast = (fn: (m: ChatMessage) => ChatMessage) =>
    setMessages((prev) => {
      if (!prev.length) return prev;
      const next = [...prev];
      next[next.length - 1] = fn(next[next.length - 1]);
      return next;
    });

  const send = useCallback(async (question: string, history: ChatMessage[], intent?: Intent) => {
    const userMsg: ChatMessage = { id: newId(), role: "user", text: question, cards: [], intent };
    const aiMsg: ChatMessage = { id: newId(), role: "assistant", text: "", cards: [], pending: true };
    const conversation = [...history, userMsg];
    setMessages([...conversation, aiMsg]);
    setBusy(true);
    setSlow(false);

    // Bring the new question to the top of the screen, like a fresh page.
    requestAnimationFrame(() =>
      document.getElementById(userMsg.id)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let gotFirstEvent = false;
    const slowTimer = setTimeout(() => !gotFirstEvent && setSlow(true), SLOW_AFTER_MS);

    const onEvent = (event: StreamEvent) => {
      if (!gotFirstEvent) {
        gotFirstEvent = true;
        setSlow(false);
      }
      if (event.type === "text") updateLast((m) => ({ ...m, text: m.text + event.delta }));
      else if (event.type === "card") updateLast((m) => ({ ...m, cards: [...m.cards, event.card] }));
      else if (event.type === "error") updateLast((m) => ({ ...m, error: event.message }));
    };

    try {
      await streamChat(toApiMessages(conversation), onEvent, controller.signal, intent);
    } catch (err) {
      if (controller.signal.aborted) return;
      const message =
        err instanceof TypeError
          ? "I couldn't reach the server. It may still be waking up, so try again in a few seconds."
          : (err as Error).message;
      updateLast((m) => ({ ...m, error: message }));
    } finally {
      clearTimeout(slowTimer);
      if (!controller.signal.aborted) {
        updateLast((m) => ({ ...m, pending: false }));
        setBusy(false);
        setSlow(false);
      }
    }
  }, []);

  const ask = useCallback(
    (question: string, intent?: Intent) => {
      if (busy) return;
      void send(question, messagesRef.current.filter((m) => !m.pending), intent);
    },
    [busy, send],
  );

  const stop = () => {
    abortRef.current?.abort();
    updateLast((m) => ({ ...m, pending: false, stopped: true }));
    setBusy(false);
    setSlow(false);
  };

  const retry = () => {
    const all = messagesRef.current;
    const lastUser = [...all].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    void send(lastUser.text, all.slice(0, all.lastIndexOf(lastUser)), lastUser.intent as Intent | undefined);
  };

  const newChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setBusy(false);
    setSlow(false);
    window.history.replaceState(null, "", "/chat");
    window.scrollTo({ top: 0 });
  };

  // In development React runs this effect twice (mount, cleanup, mount). The
  // cleanup aborts the first request and the second run sends it again, so the
  // question is always answered exactly once.
  useEffect(() => {
    warmUp();
    if (initialQuery) void send(initialQuery.slice(0, 500), [], initialIntent);
    return () => abortRef.current?.abort();
  }, [initialQuery, initialIntent, send]);

  // Press "/" anywhere to jump to the input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-dvh">
      <header className="fixed inset-x-0 top-0 z-20 bg-gradient-to-b from-bg from-60% to-transparent">
        <div className="mx-auto grid h-20 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
          <div>
            <SwitchPill to="classic" />
          </div>
          <Link href="/" aria-label="Back to the start" className="rounded-full">
            <Avatar size={46} />
          </Link>
          <div className="flex items-center justify-end gap-1">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={newChat}
                aria-label="New chat"
                title="New chat"
                className="flex h-10 w-10 items-center justify-center rounded-full text-fg/80 hover:bg-surface-2"
              >
                <RotateCcw size={18} />
              </button>
            )}
            <InfoButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pt-24 pb-64 sm:px-6">
        {messages.length === 0 ? (
          <div className="appear flex flex-col items-center pt-[12vh] text-center">
            <Avatar size={88} />
            <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">What would you like to know?</h1>
            <p className="mt-2 text-muted">Pick a topic or ask your own question below.</p>
            <div className="mt-8">
              <QuickTiles onAsk={ask} />
            </div>
          </div>
        ) : (
          <ol className="flex flex-col gap-8">
            {messages.map((m, index) =>
              m.role === "user" ? (
                <li key={m.id} id={m.id} className="flex scroll-mt-24 justify-end pt-2">
                  <p className="max-w-[85%] rounded-3xl bg-surface-2 px-4 py-2.5 whitespace-pre-wrap">{m.text}</p>
                </li>
              ) : (
                <li
                  key={m.id}
                  // The newest answer gets at least a screen of room, so its question can sit at the top.
                  className={`appear flex flex-col gap-6 ${index === messages.length - 1 ? "min-h-[calc(100dvh-25rem)]" : ""}`}
                  aria-live="polite"
                  aria-busy={m.pending}
                >
                  {m.pending && !m.text && !m.cards.length && !m.error && (
                    <div>
                      <span className="dots" aria-label="Thinking">
                        <span />
                        <span />
                        <span />
                      </span>
                      {slow && (
                        <p className="mt-2 text-sm text-muted">
                          Still working on it. The server may be waking up, or the free AI tier may be busy, so
                          this can take a little longer.
                        </p>
                      )}
                    </div>
                  )}

                  {m.cards.map((card, i) => (
                    <CardView key={i} card={card} onAsk={busy ? undefined : ask} />
                  ))}

                  {m.text && (
                    <div className={`answer ${m.pending ? "streaming" : ""}`}>
                      <Markdown text={m.text} />
                    </div>
                  )}

                  {m.stopped && !m.text && !m.cards.length && <p className="text-sm text-muted">Stopped.</p>}

                  {m.error && (
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm">
                      <p className="text-red-700 dark:text-red-400">{m.error}</p>
                      {!busy && (
                        <button type="button" onClick={retry} className="font-medium underline underline-offset-4">
                          Try again
                        </button>
                      )}
                    </div>
                  )}

                  {!m.pending && m.text && (
                    <div className="-mt-3 -ml-2">
                      <CopyButton text={m.text} />
                    </div>
                  )}
                </li>
              ),
            )}
          </ol>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20">
        <div aria-hidden="true" className="h-10 bg-gradient-to-t from-bg to-transparent" />
        <div className="mx-auto w-full max-w-3xl bg-bg px-4 sm:px-6">
          {messages.length > 0 && <QuickChips onAsk={ask} active={lastQuestion} disabled={busy} />}
          <div className="mt-3">
            <ChatInput ref={inputRef} onSubmit={ask} onStop={stop} streaming={busy} autoFocus={!initialQuery} />
          </div>
          <p className="py-3 text-center text-xs text-subtle">
            AI answers from my portfolio can be wrong. For anything important,{" "}
            <a href={`mailto:${site.email}`} className="underline underline-offset-2 hover:text-fg">
              email me
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

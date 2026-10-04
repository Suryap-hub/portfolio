"use client";

import { Info, LayoutList, MessageCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site";
import { Avatar } from "./Avatar";
import { Dialog } from "./Dialog";

/** Top-left pill linking to the classic one-page view (or back to the chat). */
export function SwitchPill({ to }: { to: "classic" | "chat" }) {
  const classic = to === "classic";
  return (
    <Link
      href={classic ? "/about" : "/"}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 py-1.5 pr-2.5 pl-1.5 text-sm font-medium shadow-soft backdrop-blur hover:bg-surface-2"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pill text-pill-fg">
        {classic ? <LayoutList size={15} /> : <MessageCircle size={15} />}
      </span>
      <span className="hidden sm:inline">{classic ? "Classic view" : "Ask me instead"}</span>
      <ChevronRight size={15} className="text-muted" />
    </Link>
  );
}

/** Top-right (i) button with a short "how this site works" panel. */
export function InfoButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How this site works"
        className="flex h-10 w-10 items-center justify-center rounded-full text-fg/80 hover:bg-surface-2"
      >
        <Info size={20} />
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} label="How this site works">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-700 px-6 pt-10 pb-8 text-white">
          <Avatar size={56} />
          <h2 className="mt-4 text-2xl font-bold tracking-tight">How this site works</h2>
          <p className="mt-1 text-white/70">A portfolio you can talk to.</p>
        </div>
        <div className="space-y-4 px-6 py-6 text-[0.95rem]">
          <p>
            Ask anything about my work. An AI answers in my voice, using only the facts I&apos;ve written about my
            projects, internships and skills. When it shows a project, skill or contact card, that card comes straight
            from my data, not from the AI.
          </p>
          <p className="text-muted">
            It can still get things wrong. For anything important, email me at{" "}
            <a className="text-accent underline underline-offset-2" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            .
          </p>
          <div className="rounded-2xl bg-surface-2 p-4 text-sm">
            <p className="font-semibold">Built with</p>
            <p className="mt-1 text-muted">
              Next.js and Tailwind CSS on the front. A FastAPI backend streams answers from a Groq-hosted model over
              Server-Sent Events, with tool calls for the cards, per-visitor rate limiting and a grounded prompt.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/about" className="rounded-full bg-pill px-4 py-2 text-sm font-medium text-pill-fg">
              Open classic view
            </Link>
            {site.repo && (
              <a
                href={site.repo}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
              >
                Source code
              </a>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}

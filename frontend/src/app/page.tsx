"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChatInput } from "@/components/ChatInput";
import { FluidBackground } from "@/components/FluidBackground";
import { InfoButton, SwitchPill } from "@/components/HeaderBits";
import { InteractiveAvatar } from "@/components/InteractiveAvatar";
import { QuickTiles } from "@/components/Quick";
import { warmUp } from "@/lib/api";
import { site, type Intent } from "@/lib/site";

export default function Home() {
  const router = useRouter();

  // Start waking the free-tier backend while the visitor looks around.
  useEffect(() => warmUp(), []);

  const ask = (q: string, intent?: Intent) =>
    router.push(`/chat?query=${encodeURIComponent(q)}${intent ? `&intent=${intent}` : ""}`);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Giant faded name behind everything */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex translate-y-[22%] justify-center mix-blend-multiply select-none"
      >
        <span className="text-[30vw] leading-none font-black tracking-tighter text-watermark sm:text-[22vw]">
          {site.watermark}
        </span>
      </div>

      {/* Colourful fluid that follows the mouse */}
      <FluidBackground />

      <header className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center px-4 py-4 sm:px-6">
        <div>
          <SwitchPill to="classic" />
        </div>
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-lg font-black tracking-tighter shadow-soft"
        >
          SP
        </span>
        <div className="flex justify-end">
          <InfoButton />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 pt-2 pb-16 text-center sm:px-6">
        <p className="enter text-lg font-semibold sm:text-xl" style={{ animationDelay: "0ms" }}>
          Hey, I&apos;m {site.nickname} 👋
        </p>
        <h1
          className="enter mt-1 text-[2.6rem] leading-[1.05] font-extrabold tracking-tight sm:text-6xl md:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          {site.role}
        </h1>

        <div className="enter my-8 sm:my-10" style={{ animationDelay: "180ms" }}>
          <InteractiveAvatar className="h-[180px] w-[180px] text-[80px] sm:h-[230px] sm:w-[230px]" />
        </div>

        <div className="enter w-full max-w-lg" style={{ animationDelay: "280ms" }}>
          <ChatInput variant="landing" onSubmit={ask} placeholder="Ask me anything…" />
        </div>

        <div className="enter mt-5" style={{ animationDelay: "360ms" }}>
          <QuickTiles onAsk={ask} />
        </div>

        <p className="enter mt-6 text-sm text-muted" style={{ animationDelay: "440ms" }}>
          {site.location} · CS &apos;27 at SRM IST · open to SDE &amp; AI roles
        </p>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";
import { Avatar } from "./Avatar";

const GREETINGS = ["Hi! 👋", "Ask me anything!", "Try “Projects” 👇", "Nice to meet you!"];

/**
 * The big landing-page avatar.
 * - Turns to look toward the cursor (3D tilt).
 * - Click / tap: bounces, says hi, and fires a burst into the fluid background.
 * Uses `site.avatarVideo` (a looping memoji video) or `site.avatar` (image) when set.
 */
export function InteractiveAvatar({ className = "h-[230px] w-[230px]" }: { className?: string }) {
  const box = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [bounce, setBounce] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);
  const greet = useRef(0);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = box.current?.getBoundingClientRect();
        if (!r) return;
        const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        setTilt({ x: Math.max(-1, Math.min(1, dx * 2)), y: Math.max(-1, Math.min(1, dy * 2)) });
      });
    };
    const reset = () => setTilt({ x: 0, y: 0 });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", reset);
    };
  }, []);

  useEffect(() => () => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
  }, []);

  const poke = () => {
    setBounce((b) => b + 1);
    setBubble(GREETINGS[greet.current % GREETINGS.length]);
    greet.current += 1;
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 2200);
    const r = box.current?.getBoundingClientRect();
    if (r) {
      window.dispatchEvent(
        new CustomEvent("fluid-burst", { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }),
      );
    }
  };

  const transform = `perspective(700px) rotateY(${tilt.x * 18}deg) rotateX(${-tilt.y * 14}deg) translate3d(${
    tilt.x * 10
  }px, ${tilt.y * 6}px, 0)`;

  return (
    <div className={`relative ${className}`}>
      {bubble && (
        <span
          key={bubble + bounce}
          role="status"
          className="pop absolute -top-3 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-2xl rounded-bl-md border border-border bg-surface px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap shadow-soft"
        >
          {bubble}
        </span>
      )}
      <button
        ref={box}
        type="button"
        onClick={poke}
        aria-label={`Say hi to ${site.nickname}`}
        className="group block h-full w-full rounded-full transition-transform duration-200 ease-out will-change-transform hover:scale-[1.03] active:scale-95"
        style={{ transform }}
      >
        <span key={bounce} className={`block h-full w-full ${bounce ? "wiggle" : "float"}`}>
          {site.avatarVideo ? (
            <video
              src={site.avatarVideo}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-contain drop-shadow-[0_18px_30px_rgb(0_0_0/0.18)]"
            />
          ) : site.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={site.avatar}
              alt=""
              className="h-full w-full object-contain drop-shadow-[0_18px_30px_rgb(0_0_0/0.18)]"
            />
          ) : (
            <Avatar size={230} className="h-full! w-full! shadow-[0_24px_50px_-12px_rgb(37_99_235/0.45)]" />
          )}
        </span>
      </button>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

/**
 * Colourful fluid that follows the mouse (or finger) across a white page.
 *
 * Uses webgl-fluid-enhanced (MIT), a port of Pavel Dobryakov's WebGL fluid
 * simulation. To get soft pastel colour on white (like ink in water), the
 * simulation runs on black and the canvas is colour-inverted, so black becomes
 * white and each colour becomes its opposite. The canvas ignores clicks (pointer-events: none); we listen on
 * the whole window and inject "splats" ourselves, so buttons and the input
 * under it keep working. Turned off for visitors who prefer reduced motion,
 * and quietly skipped if the browser has no WebGL.
 */

type Fluid = {
  start(): void;
  stop(): void;
  multipleSplats(n: number): void;
  splatAtLocation(x: number, y: number, dx: number, dy: number, hex?: string): void;
  setConfig(c: Record<string, unknown>): void;
};

export function FluidBackground({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const test = document.createElement("canvas");
    if (!test.getContext("webgl2") && !test.getContext("webgl")) return;

    let fluid: Fluid | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let cancelled = false;
    const mobile = window.matchMedia("(pointer: coarse)").matches;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // The canvas can't receive the mouse itself (it sits under the page and
    // ignores clicks), so we hand it a copy of every movement. The library then
    // colours the trail exactly like the original simulation.
    const feed = (x: number, y: number) => {
      canvas?.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: false }));
    };
    const onPointerMove = (e: PointerEvent) => feed(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) feed(t.clientX, t.clientY);
    };

    // A quick swirl drawn around a point, used for the intro and avatar clicks.
    const swirl = (cx: number, cy: number, radius: number, turns = 1.25, steps = 26) => {
      for (let k = 0; k <= steps; k++) {
        timers.push(
          setTimeout(() => {
            const a = (k / steps) * Math.PI * 2 * turns;
            const r = radius * (0.35 + 0.65 * (k / steps));
            feed(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          }, k * 14),
        );
      }
    };
    const onBurst = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      swirl(x, y, 150);
      fluid?.multipleSplats(2);
    };

    (async () => {
      const { default: WebGLFluidEnhanced } = await import("webgl-fluid-enhanced");
      if (cancelled || !host.current) return;
      try {
        fluid = new WebGLFluidEnhanced(host.current) as unknown as Fluid;
        fluid.setConfig({
          // Simulate on black, then invert: black page -> white, bright ink -> soft pastel.
          backgroundColor: "#000000",
          transparent: false,
          inverted: true,
          hover: true, // trail follows the pointer without clicking
          colorful: true, // hue keeps changing -> rainbow trail
          colorUpdateSpeed: 6,
          bloom: false,
          sunrays: false,
          shading: true,
          simResolution: mobile ? 64 : 128,
          dyeResolution: mobile ? 512 : 1024,
          densityDissipation: 2.2, // how fast the colour fades (higher = faster)
          velocityDissipation: 0.9,
          pressure: 0.8,
          curl: 14,
          splatRadius: mobile ? 0.35 : 0.25,
          splatForce: 6000,
          brightness: 0.7,
        });
        fluid.start();
        canvas = host.current.querySelector("canvas");
        // A soft swirl on load so there's colour before anyone moves.
        const w = window.innerWidth;
        const h = window.innerHeight;
        timers.push(setTimeout(() => swirl(w * 0.2, h * 0.25, Math.min(w, h) * 0.18), 300));
        timers.push(setTimeout(() => swirl(w * 0.82, h * 0.4, Math.min(w, h) * 0.16, -1.1), 650));
      } catch {
        fluid = null; // no WebGL support: just a white page
      }
    })();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("fluid-burst", onBurst);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("fluid-burst", onBurst);
      fluid?.stop();
      host.current?.replaceChildren();
    };
  }, []);

  return (
    <div aria-hidden="true" className={`pointer-events-none fixed inset-0 ${className}`}>
      <div ref={host} className="h-full w-full" />
    </div>
  );
}

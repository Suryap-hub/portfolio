import { site } from "@/lib/site";

/**
 * Your photo or memoji if `site.avatar` is set, otherwise a gradient badge
 * with your initial. Drop a square image at public/avatar.png to replace it.
 */
export function Avatar({ size = 48, className = "" }: { size?: number; className?: string }) {
  if (site.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={site.avatar}
        alt={`${site.name}`}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={site.name}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 font-semibold text-white shadow-[inset_0_-6px_16px_rgb(0_0_0/0.18),inset_0_6px_14px_rgb(255_255_255/0.35)] ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.44, lineHeight: 1 }}
    >
      <span
        aria-hidden="true"
        className="absolute -top-[20%] -left-[10%] h-[70%] w-[70%] rounded-full bg-white/25 blur-xl"
      />
      <span className="relative tracking-tight">{site.nickname.charAt(0)}</span>
    </span>
  );
}

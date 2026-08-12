"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

const LOGO_ICON_PATH =
  "M267 3661 c-104 -6 -110 -7 -133 -34 l-24 -28 0 -1095 c0 -928 2 -1100 14 -1129 10 -22 241 -259 647 -665 667 -664 657 -656 723 -634 14 5 165 148 336 319 280 279 310 312 310 342 0 30 -49 82 -572 603 l-573 570 -3 -188 c-1 -103 0 -198 3 -211 3 -13 87 -106 186 -207 217 -221 213 -208 105 -318 -58 -58 -81 -76 -102 -76 -23 0 -70 42 -267 237 -131 131 -245 251 -254 267 -14 27 -15 102 -8 675 4 356 11 650 16 655 12 13 26 0 912 -883 444 -443 818 -810 831 -815 13 -5 34 -6 47 -3 13 3 92 75 175 159 l151 153 7 190 c3 105 6 603 6 1108 0 981 1 970 -48 996 -31 16 -548 15 -558 -1 -4 -7 -7 -366 -7 -798 1 -433 -2 -792 -7 -799 -4 -7 -14 -11 -23 -9 -9 1 -368 354 -799 783 -431 430 -799 792 -818 807 -42 30 -108 37 -273 29z";

function LogoMark({ className }: { className?: string }) {
  const gradientId = useId();

  return (
    <svg
      viewBox="356 228 309 401"
      className={cn("size-6 shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b600f0" />
          <stop offset="35%" stopColor="#7800f8" />
          <stop offset="70%" stopColor="#1450fa" />
          <stop offset="100%" stopColor="#00adff" />
        </linearGradient>
      </defs>
      <g transform="translate(365,240)">
        <g
          transform="translate(0.000000,375.000000) scale(0.1,-0.1)"
          fill={`url(#${gradientId})`}
          stroke="none"
        >
          <path d={LOGO_ICON_PATH} />
        </g>
      </g>
    </svg>
  );
}

function LogoRing({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full p-[3px]",
        className,
      )}
      style={{
        background:
          "conic-gradient(from 200deg, var(--accent-1), var(--accent-2), var(--accent-3), var(--accent-4), var(--accent-1))",
      }}
    >
      <div className="flex size-full items-center justify-center rounded-full bg-[#0b0c1a]">
        <LogoMark className={cn("size-[62%]", markClassName)} />
      </div>
    </div>
  );
}

function Logo({
  className,
  subtitle = false,
  ring = false,
  markClassName,
}: {
  className?: string;
  subtitle?: boolean;
  ring?: boolean;
  markClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {ring ? (
        <LogoRing className={markClassName} />
      ) : (
        <LogoMark className={markClassName} />
      )}
      <div className="flex flex-col leading-none">
        <span className="text-base font-extrabold tracking-[0.3px] text-foreground">
          Next Level
        </span>
        {subtitle && (
          <span className="mt-0.5 text-[10.5px] font-bold tracking-[2.5px] text-muted-foreground uppercase">
            Gaming House
          </span>
        )}
      </div>
    </div>
  );
}

export { Logo, LogoMark, LogoRing };

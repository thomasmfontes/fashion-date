import type { SVGProps } from "react";

export function UsersAnimatedIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={`resend-nav-icon icon-users ${className || ""}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Background secondary user */}
      <g className="user-secondary-head">
        <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </g>
      {/* Foreground primary user */}
      <g className="user-primary">
        <circle cx="9" cy="7" r="4" />
        <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
      </g>
    </svg>
  );
}

export function SlidersAnimatedIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={`resend-nav-icon icon-sliders ${className || ""}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Top track + slider dial */}
      <line x1="3" y1="6" x2="21" y2="6" className="slider-track" />
      <circle cx="8" cy="6" r="2.5" className="slider-knob slider-knob-top" fill="currentColor" />

      {/* Middle track + slider dial */}
      <line x1="3" y1="12" x2="21" y2="12" className="slider-track" />
      <circle cx="16" cy="12" r="2.5" className="slider-knob slider-knob-mid" fill="currentColor" />

      {/* Bottom track + slider dial */}
      <line x1="3" y1="18" x2="21" y2="18" className="slider-track" />
      <circle cx="10" cy="18" r="2.5" className="slider-knob slider-knob-bot" fill="currentColor" />
    </svg>
  );
}

export function ScreenLiveAnimatedIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={`resend-nav-icon icon-screen ${className || ""}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Screen frame & stand */}
      <rect x="2" y="3" width="20" height="13" rx="2" className="screen-frame" />
      <line x1="8" y1="20" x2="16" y2="20" className="screen-base" />
      <line x1="12" y1="16" x2="12" y2="20" className="screen-stand" />

      {/* Play indicator */}
      <polygon points="10 6.5 15 9.5 10 12.5" className="screen-play" fill="currentColor" />

      {/* Pulsing Live indicator dot */}
      <circle cx="18" cy="6" r="1.5" className="screen-live-dot" fill="#ef4444" stroke="none" />
    </svg>
  );
}

export function MedalAnimatedIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={`resend-nav-icon icon-medal ${className || ""}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Ribbon tails */}
      <path d="M8.21 13.89L7 22l5-3 5 3-1.21-8.11" className="medal-ribbon" />

      {/* Medal disc */}
      <circle cx="12" cy="8" r="6" className="medal-disc" fill="none" />

      {/* Sparkling Star */}
      <polygon
        points="12 5.5 13.09 7.7 15.5 8.05 13.75 9.75 14.18 12.15 12 11 9.82 12.15 10.25 9.75 8.5 8.05 10.91 7.7"
        className="medal-star"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function LogoutAnimatedIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={`resend-nav-icon icon-logout ${className || ""}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Door frame */}
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" className="logout-door" />

      {/* Dynamic Exit Arrow */}
      <g className="logout-arrow">
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </g>
    </svg>
  );
}

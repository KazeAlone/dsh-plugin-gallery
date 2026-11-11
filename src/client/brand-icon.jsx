import React, { useId } from "react";

/** Original marketplace mark shared by the DSH sidebar and page heading. */
export function BrandIcon({ size = 20 }) {
  const gradientId = `gal-aurora-${useId().replace(/:/g, "")}`;
  const paint = `url(#${gradientId})`;
  return (
    <svg
      className="gal-brand-icon"
      width={size}
      height={size}
      viewBox="3 2.5 26 26"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="7" y1="26" x2="25" y2="5" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#12d9af" />
          <stop offset="0.48" stopColor="#35abff" />
          <stop offset="1" stopColor="#9e6aff" />
        </linearGradient>
      </defs>
      <path
        d="M8 12h16l1 14H7l1-14Z"
        stroke={paint}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 12V9a4 4 0 0 1 8 0v3"
        stroke={paint}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="11" y="16" width="4" height="3" rx=".8" fill={paint} />
      <rect x="17" y="16" width="4" height="3" rx=".8" fill={paint} />
      <rect x="11" y="21" width="4" height="3" rx=".8" fill={paint} />
      <rect x="17" y="21" width="4" height="3" rx=".8" fill={paint} />
    </svg>
  );
}

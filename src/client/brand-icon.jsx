import React from "react";

/** Original marketplace mark shared by the DSH sidebar and page heading. */
export function BrandIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="3 2.5 26 26"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 12h16l1 14H7l1-14Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 12V9a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="11" y="16" width="4" height="3" rx=".8" fill="currentColor" />
      <rect x="17" y="16" width="4" height="3" rx=".8" fill="currentColor" />
      <rect x="11" y="21" width="4" height="3" rx=".8" fill="currentColor" />
      <rect x="17" y="21" width="4" height="3" rx=".8" fill="currentColor" />
    </svg>
  );
}

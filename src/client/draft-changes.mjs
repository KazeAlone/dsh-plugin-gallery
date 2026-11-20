import { useMemo, useRef } from "react";

/** Compare editable content, preserving array order but ignoring object key order. */
export function draftFingerprint(value) {
  return JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]]),
        )
      : item,
  );
}
export function useDraftChanges(value, pendingImport = false) {
  const current = useMemo(() => draftFingerprint(value), Object.values(value));
  const baseline = useRef(current);
  return pendingImport || current !== baseline.current;
}

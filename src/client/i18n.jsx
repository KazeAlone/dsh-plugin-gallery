import React, { createContext, useContext, useMemo } from "react";
import { createGalleryText, normalizeLanguage } from "./locale.mjs";
const GalleryLocaleContext = createContext(createGalleryText("zh"));
export function GalleryLocale({ t, children }) {
  const language = normalizeLanguage(t?.("language.code"));
  const value = useMemo(() => createGalleryText(language), [language]);
  return (
    <GalleryLocaleContext.Provider value={value}>
      {children}
    </GalleryLocaleContext.Provider>
  );
}
export const useGalleryText = () => useContext(GalleryLocaleContext);

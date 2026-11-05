window.__ModuleLoader__.load({id:"dsh-plugin-gallery",factory:(require)=>{var module={exports:{}};var exports=module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.jsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react4 = __toESM(require("react"), 1);

// src/descriptors.mjs
var json = {
  mode: "strict",
  typeSymbol: "dsh-plugin-gallery#Json",
  create: () => ({ parse: (x) => x })
};
var string = (name) => ({
  name,
  wire: name,
  source: "json",
  codec: {
    mode: "strict",
    typeSymbol: "dsh-plugin-gallery#String",
    create: () => ({
      parse: (x) => {
        if (typeof x !== "string" || x.length > 8 * 1024 * 1024)
          throw new TypeError("Invalid Gallery argument");
        return x;
      }
    })
  }
});
var methods = {
  uiStatus: [],
  uiList: ["payload"],
  uiGet: ["id"],
  uiCreate: ["payload"],
  uiUpdate: ["id", "payload"],
  uiStorageSettings: [],
  uiTestStorage: ["payload"],
  uiConfigureStorage: []
};
var DESCRIPTORS = Object.entries(methods).map(([method, names]) => ({
  id: `dsh-plugin-gallery#gallery/${method}`,
  service: "gallery",
  namespace: "gallery",
  method,
  invocation: { kind: "direct" },
  parameters: names.map(string),
  result: json
}));
var REMOTE = {
  package: "dsh-plugin-gallery",
  descriptors: DESCRIPTORS
};

// src/client/styles.css
var styles_default = '.gal {\n  --g-bg: #ffffff;\n  --g-card: #ffffff;\n  --g-soft: #f5f6f7;\n  --g-hover: #f0f2f4;\n  --g-ink: #20242b;\n  --g-muted: #606873;\n  --g-line: #dfe3e8;\n  --g-control: #9da5af;\n  --g-accent: #20242b;\n  --g-on-accent: #ffffff;\n  --g-ring: #3568c5;\n  --g-error: #a12622;\n  --g-error-bg: #fff4f2;\n  --g-success: #245c3b;\n  --g-success-bg: #f0f8f2;\n  --g-overlay: #10151c66;\n  box-sizing: border-box;\n  width: 100%;\n  min-height: 100%;\n  overflow: auto;\n  background: var(--g-bg);\n  color: var(--g-ink);\n  padding: 32px clamp(16px, 4vw, 48px);\n  font:\n    14px/1.6 -apple-system,\n    BlinkMacSystemFont,\n    "Segoe UI",\n    "PingFang SC",\n    "Microsoft YaHei",\n    sans-serif;\n  color-scheme: light;\n}\n.gal *,\n.gal *::before,\n.gal *::after {\n  box-sizing: border-box;\n}\n.gal h1,\n.gal h2,\n.gal h3,\n.gal p {\n  margin: 0;\n}\n.gal h1 {\n  font-size: 24px;\n  line-height: 1.4;\n  font-weight: 600;\n}\n.gal h2 {\n  font-size: 20px;\n  line-height: 1.5;\n  font-weight: 600;\n  overflow-wrap: anywhere;\n}\n.gal h3 {\n  font-size: 15px;\n  line-height: 1.5;\n  font-weight: 600;\n}\n.gal button,\n.gal input,\n.gal textarea,\n.gal select {\n  font: inherit;\n}\n.gal button,\n.gal .gal-upload {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  min-height: 38px;\n  padding: 7px 14px;\n  border: 1px solid var(--g-control);\n  border-radius: 5px;\n  background: var(--g-card);\n  color: var(--g-ink);\n  cursor: pointer;\n  transition:\n    background-color 150ms,\n    border-color 150ms;\n  touch-action: manipulation;\n}\n.gal button:hover:not(:disabled),\n.gal .gal-upload:hover {\n  background: var(--g-hover);\n}\n.gal button:active:not(:disabled) {\n  background: var(--g-line);\n}\n.gal button:disabled {\n  opacity: 0.45;\n  cursor: not-allowed;\n}\n.gal :is(button, input, textarea, select, summary):focus-visible,\n.gal .gal-upload:focus-within {\n  outline: 2px solid var(--g-ring);\n  outline-offset: 3px;\n}\n.gal button.gal-primary {\n  background: var(--g-accent);\n  color: var(--g-on-accent);\n  border-color: var(--g-accent);\n}\n.gal button.gal-primary:hover:not(:disabled) {\n  background: var(--g-muted);\n  border-color: var(--g-muted);\n}\n.gal input,\n.gal textarea,\n.gal select {\n  width: 100%;\n  min-width: 0;\n  padding: 9px 12px;\n  color: var(--g-ink);\n  background: var(--g-card);\n  border: 1px solid var(--g-control);\n  border-radius: 5px;\n}\n.gal input::placeholder,\n.gal textarea::placeholder {\n  color: var(--g-muted);\n  opacity: 1;\n}\n.gal textarea {\n  resize: vertical;\n}\n.gal label {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  margin: 0 0 20px;\n  font-weight: 500;\n}\n.gal-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 24px;\n  margin-bottom: 28px;\n}\n.gal-header-actions {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  min-width: 0;\n}\n.gal-header-actions > button:first-child {\n  color: var(--g-muted);\n}\n.gal-header-actions .gal-primary {\n  flex-shrink: 0;\n}\n.gal-toolbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 24px;\n  border-bottom: 1px solid var(--g-line);\n  padding-bottom: 16px;\n}\n.gal-filters {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  flex-wrap: wrap;\n}\n.gal-filters button {\n  border-color: transparent;\n  color: var(--g-muted);\n  padding: 7px 12px;\n}\n.gal-filters button.active {\n  color: var(--g-ink);\n  background: var(--g-soft);\n  font-weight: 600;\n  box-shadow: inset 0 -2px var(--g-ink);\n}\n.gal input.gal-search {\n  max-width: 280px;\n}\n.gal-list-heading {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 12px 0;\n  color: var(--g-muted);\n  font-size: 13px;\n}\n.gal-list-heading strong {\n  margin-left: 6px;\n  font-weight: 500;\n  font-variant-numeric: tabular-nums;\n}\n.gal-list-heading button {\n  border-color: transparent;\n  min-height: 32px;\n  padding: 4px 10px;\n  color: var(--g-muted);\n}\n.gal-resource-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(min(100%, 270px), 1fr));\n  gap: 20px;\n}\n.gal button.gal-resource-card {\n  width: 100%;\n  display: flex;\n  flex-direction: column;\n  gap: 0;\n  padding: 0;\n  text-align: left;\n  border: 1px solid var(--g-line);\n  border-radius: 12px;\n  overflow: hidden;\n  align-items: stretch;\n  justify-content: flex-start;\n  min-width: 0;\n}\n.gal-resource-type {\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--g-muted);\n}\n.gal-resource-content {\n  min-width: 0;\n  padding: 18px 18px 0;\n}\n.gal-resource-content h3 {\n  overflow-wrap: anywhere;\n  font-size: 16px;\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}\n.gal-resource-content p {\n  color: var(--g-muted);\n  margin-top: 6px;\n  font-size: 13px;\n  display: -webkit-box;\n  -webkit-line-clamp: 1;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  overflow-wrap: anywhere;\n}\n.gal-tags {\n  display: flex;\n  gap: 6px;\n  flex-wrap: wrap;\n  margin: 12px 0;\n}\n.gal-tags span {\n  font-size: 12px;\n  line-height: 1.5;\n  border: 1px solid var(--g-line);\n  border-radius: 3px;\n  padding: 2px 7px;\n  color: var(--g-muted);\n  overflow-wrap: anywhere;\n}\n.gal-resource-card .gal-tags {\n  margin: 12px 0 18px;\n  padding: 0 18px;\n  min-height: 24px;\n}\n.gal-resource-card footer {\n  display: flex;\n  justify-content: space-between;\n  gap: 12px;\n  margin-top: auto;\n  padding: 12px 18px;\n  border-top: 1px solid var(--g-line);\n  color: var(--g-muted);\n  font-size: 12px;\n  font-variant-numeric: tabular-nums;\n}\n.gal-empty {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 12px;\n  min-height: 300px;\n  padding: 40px 16px;\n  text-align: center;\n  color: var(--g-muted);\n}\n.gal-empty h3 {\n  color: var(--g-ink);\n}\n.gal-empty .gal-primary {\n  margin-top: 8px;\n}\n.gal-pagination {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 20px;\n  padding: 24px 0;\n  color: var(--g-muted);\n}\n.gal-alert,\n.gal-notice {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n  padding: 10px 14px;\n  border: 1px solid currentColor;\n  border-radius: 4px;\n  margin-bottom: 20px;\n  overflow-wrap: anywhere;\n  white-space: pre-wrap;\n  position: relative;\n  z-index: 40;\n}\n.gal-alert {\n  color: var(--g-error);\n  background: var(--g-error-bg);\n}\n.gal-notice {\n  color: var(--g-success);\n  background: var(--g-success-bg);\n}\n.gal-alert button,\n.gal-notice button {\n  min-height: 28px;\n  min-width: 28px;\n  padding: 0;\n  border-color: transparent;\n  color: inherit;\n  background: transparent;\n  flex-shrink: 0;\n}\n.gal-overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 30;\n  padding: 24px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: var(--g-overlay);\n}\n.gal-confirm-overlay {\n  z-index: 60;\n}\n.gal-dialog {\n  display: flex;\n  flex-direction: column;\n  width: min(880px, 100%);\n  max-height: calc(100dvh - 48px);\n  border: 1px solid var(--g-control);\n  border-radius: 6px;\n  background: var(--g-card);\n  overflow: hidden;\n}\n.gal-dialog-head {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 24px;\n  padding: 24px;\n  border-bottom: 1px solid var(--g-line);\n  flex-shrink: 0;\n}\n.gal-dialog-head > div {\n  min-width: 0;\n}\n.gal-dialog-head p {\n  font-size: 13px;\n  color: var(--g-muted);\n  margin-top: 6px;\n}\n.gal-dialog-head > button {\n  border-color: transparent;\n  min-width: 36px;\n  min-height: 36px;\n  padding: 0;\n  font-size: 24px;\n  line-height: 1;\n  flex-shrink: 0;\n}\n.gal-dialog-body {\n  padding: 24px;\n  overflow: auto;\n  min-height: 0;\n}\n.gal-dialog-footer {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  flex-wrap: wrap;\n  gap: 12px;\n  padding: 16px 24px;\n  border-top: 1px solid var(--g-line);\n  flex-shrink: 0;\n}\n.gal-dialog-footer > .gal-local {\n  margin-right: auto;\n  color: var(--g-muted);\n  font-size: 13px;\n}\n.gal-pill {\n  display: inline-block;\n  font-size: 12px;\n  color: var(--g-muted);\n  margin-bottom: 8px;\n}\n.gal-detail-actions {\n  display: flex;\n  gap: 8px;\n  flex-wrap: wrap;\n  padding: 16px 24px;\n  border-bottom: 1px solid var(--g-line);\n  flex-shrink: 0;\n}\n.gal-description {\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n}\n.gal-file {\n  border: 1px solid var(--g-line);\n  border-radius: 4px;\n  margin: 16px 0 0;\n  overflow: hidden;\n}\n.gal summary {\n  cursor: pointer;\n  padding: 12px;\n  overflow-wrap: anywhere;\n}\n.gal-file summary span {\n  float: right;\n  color: var(--g-muted);\n  font-size: 12px;\n  margin-left: 12px;\n}\n.gal pre {\n  font:\n    13px/1.8 ui-monospace,\n    SFMono-Regular,\n    Consolas,\n    monospace;\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n  background: var(--g-soft);\n  padding: 16px;\n  border-top: 1px solid var(--g-line);\n  margin: 0;\n  max-height: 380px;\n  overflow: auto;\n}\n.gal-file > p {\n  padding: 16px;\n}\n.gal-form-row {\n  display: flex;\n  gap: 20px;\n}\n.gal-form-row > label {\n  flex: 1;\n  min-width: 0;\n}\n.gal-form-row > label.gal-grow {\n  flex: 3;\n}\n.gal-file-toolbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 12px;\n  margin: 24px 0 12px;\n}\n.gal-file-toolbar small {\n  font-size: 12px;\n  color: var(--g-muted);\n  margin-left: 8px;\n  font-weight: 400;\n}\n.gal-file-toolbar > div {\n  display: flex;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n.gal label.gal-upload {\n  margin: 0;\n  font-weight: 400;\n  position: relative;\n}\n.gal-upload input {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  opacity: 0;\n  overflow: hidden;\n}\n.gal-add-file {\n  display: flex;\n  gap: 8px;\n  margin-bottom: 12px;\n}\n.gal-add-file button {\n  white-space: nowrap;\n}\n.gal-file-editor {\n  display: grid;\n  grid-template-columns: 200px minmax(0, 1fr);\n  min-height: 300px;\n  border: 1px solid var(--g-control);\n  border-radius: 4px;\n  overflow: hidden;\n}\n.gal-file-editor nav {\n  background: var(--g-soft);\n  border-right: 1px solid var(--g-line);\n  padding: 8px;\n  max-height: 420px;\n  overflow: auto;\n}\n.gal-file-editor nav button {\n  width: 100%;\n  justify-content: flex-start;\n  text-align: left;\n  border-color: transparent;\n  background: transparent;\n  border-radius: 3px;\n  font-size: 13px;\n  overflow-wrap: anywhere;\n}\n.gal-file-editor nav button.active {\n  color: var(--g-ink);\n  background: var(--g-line);\n  font-weight: 600;\n}\n.gal-file-editor nav p,\n.gal-code-placeholder {\n  padding: 16px;\n  color: var(--g-muted);\n  font-size: 13px;\n}\n.gal-file-editor > div {\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n}\n.gal-code-head {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 12px;\n  padding: 8px 12px;\n  border-bottom: 1px solid var(--g-line);\n}\n.gal-code-head span {\n  font:\n    13px/1.5 ui-monospace,\n    monospace;\n  overflow-wrap: anywhere;\n}\n.gal-code-head button {\n  color: var(--g-error);\n  border-color: transparent;\n  padding: 4px 8px;\n  flex-shrink: 0;\n}\n.gal-file-editor textarea {\n  flex: 1;\n  min-height: 280px;\n  font:\n    13px/1.8 ui-monospace,\n    SFMono-Regular,\n    Consolas,\n    monospace;\n  border: 0;\n  border-radius: 0;\n  tab-size: 2;\n}\n.gal-file-editor textarea:focus-visible {\n  outline-offset: -3px;\n}\n.gal-advanced {\n  margin-top: 24px;\n  border-top: 1px solid var(--g-line);\n}\n.gal-advanced summary {\n  padding: 16px 0;\n  color: var(--g-muted);\n}\n.gal-advanced textarea,\n.gal-reference textarea {\n  font:\n    13px/1.7 ui-monospace,\n    Consolas,\n    monospace;\n}\n.gal-reference textarea {\n  resize: vertical;\n}\n.gal-error {\n  color: var(--g-error);\n  margin: 12px 0;\n}\n.gal-small {\n  max-width: 440px;\n}\n.gal-storage {\n  max-width: 600px;\n}\n.gal-storage-providers {\n  margin-bottom: 24px;\n}\n.gal-storage-providers > div {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n  padding: 12px 0;\n  border-bottom: 1px solid var(--g-line);\n}\n.gal-storage-providers strong {\n  font-weight: 500;\n}\n.gal-storage-providers span,\n.gal-storage-providers > div:not(.active) {\n  color: var(--g-muted);\n}\n.gal-storage .gal-dialog-body > p {\n  color: var(--g-muted);\n  font-size: 13px;\n  margin: 0 0 24px;\n}\n.gal-storage .gal-dialog-body > p[role="alert"] {\n  color: var(--g-error);\n  margin: 16px 0 0;\n}\n.gal-storage .gal-dialog-body > p[role="status"] {\n  color: var(--g-success);\n  margin: 16px 0 0;\n}\n@media (prefers-color-scheme: dark) {\n  .gal {\n    --g-bg: #181a1e;\n    --g-card: #1e2126;\n    --g-soft: #25292f;\n    --g-hover: #2c3139;\n    --g-ink: #edf0f4;\n    --g-muted: #adb5c0;\n    --g-line: #383f49;\n    --g-control: #737e8d;\n    --g-accent: #edf0f4;\n    --g-on-accent: #181a1e;\n    --g-ring: #8bb4ff;\n    --g-error: #ffb5ae;\n    --g-error-bg: #382422;\n    --g-success: #a7dbb7;\n    --g-success-bg: #203329;\n    --g-overlay: #00000099;\n    color-scheme: dark;\n  }\n}\n@media (max-width: 900px) {\n  .gal-header {\n    flex-wrap: wrap;\n  }\n  .gal-header-actions {\n    flex-wrap: wrap;\n  }\n  .gal-toolbar {\n    flex-wrap: wrap;\n    gap: 16px;\n  }\n  .gal input.gal-search {\n    max-width: none;\n  }\n}\n@media (max-width: 600px) {\n  .gal {\n    padding: 24px 16px;\n    font-size: 14px;\n  }\n  .gal-header {\n    gap: 16px;\n    margin-bottom: 24px;\n  }\n  .gal-header-actions {\n    width: auto;\n    justify-content: flex-end;\n    gap: 8px;\n  }\n  .gal-filters {\n    width: 100%;\n    gap: 0;\n  }\n  .gal-filters button {\n    flex: 1;\n    min-height: 44px;\n    padding: 7px 5px;\n  }\n  .gal input,\n  .gal textarea,\n  .gal select {\n    font-size: 16px;\n  }\n  .gal-overlay {\n    padding: 12px;\n  }\n  .gal-dialog {\n    max-height: calc(100dvh - 24px);\n  }\n  .gal-dialog-head,\n  .gal-dialog-body {\n    padding: 20px;\n  }\n  .gal-dialog-footer {\n    padding: 16px 20px;\n    gap: 8px;\n  }\n  .gal-dialog-footer > .gal-local {\n    width: 100%;\n  }\n  .gal-detail-actions {\n    padding: 12px 20px;\n  }\n  .gal-form-row {\n    flex-wrap: wrap;\n    gap: 0;\n  }\n  .gal-form-row > label,\n  .gal-form-row > label.gal-grow {\n    flex: 1 1 100%;\n    width: 100%;\n  }\n  .gal-file-editor {\n    grid-template-columns: 1fr;\n  }\n  .gal-file-editor nav {\n    max-height: 140px;\n    border-right: 0;\n    border-bottom: 1px solid var(--g-line);\n  }\n  .gal-file-editor textarea {\n    font-size: 16px;\n  }\n  .gal-file-toolbar > div {\n    width: 100%;\n  }\n  .gal-add-file {\n    flex-wrap: wrap;\n  }\n  .gal-add-file input {\n    flex: 1 1 180px;\n  }\n  .gal-code-head {\n    flex-wrap: wrap;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .gal *,\n  .gal *::before,\n  .gal *::after {\n    transition: none !important;\n    animation: none !important;\n    scroll-behavior: auto !important;\n  }\n}\n\n.gal svg {\n  flex-shrink: 0;\n  vertical-align: middle;\n}\n.gal h1 {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n}\n.gal button.gal-icon-button {\n  width: 38px;\n  min-width: 38px;\n  height: 38px;\n  padding: 0;\n  border-color: var(--g-line);\n  border-radius: 8px;\n}\n.gal .gal-search-wrap {\n  position: relative;\n  width: 280px;\n  max-width: 100%;\n}\n.gal-search-wrap > svg {\n  position: absolute;\n  left: 12px;\n  top: 50%;\n  transform: translateY(-50%);\n  color: var(--g-muted);\n  pointer-events: none;\n}\n.gal input.gal-search {\n  padding-left: 38px;\n  border-color: var(--g-line);\n  border-radius: 8px;\n}\n.gal-filters button {\n  border-radius: 7px;\n}\n.gal-filters button.active {\n  box-shadow: none;\n  border-color: var(--g-line);\n}\n.gal button.gal-resource-card:hover:not(:disabled) {\n  background: var(--g-card);\n  border-color: var(--g-control);\n}\n.gal-resource-visual {\n  display: block;\n  position: relative;\n  height: 132px;\n  width: 100%;\n  background: var(--g-soft);\n  color: var(--g-muted);\n  border-bottom: 1px solid var(--g-line);\n}\n.gal-resource-visual.skill {\n  --visual-ink: #386a54;\n  --visual-bg: #eef5f0;\n}\n.gal-resource-visual.agent {\n  --visual-ink: #6552a0;\n  --visual-bg: #f2eff9;\n}\n.gal-resource-visual.mcp {\n  --visual-ink: #366c92;\n  --visual-bg: #edf4f9;\n}\n.gal-resource-visual.workflow {\n  --visual-ink: #936424;\n  --visual-bg: #faf4e9;\n}\n.gal-resource-visual {\n  color: var(--visual-ink);\n  background: var(--visual-bg);\n}\n.gal-resource-drawing {\n  position: absolute;\n  width: 240px;\n  height: 100px;\n  left: 50%;\n  top: 24px;\n  transform: translateX(-50%);\n}\n.gal-visual-type {\n  position: absolute;\n  top: 12px;\n  left: 14px;\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  font-size: 12px;\n  font-weight: 500;\n}\n.gal-card-arrow {\n  position: absolute;\n  right: 14px;\n  top: 13px;\n}\n.gal-resource-card footer > span {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n}\n.gal-tags span {\n  background: var(--g-soft);\n  border-color: transparent;\n  border-radius: 4px;\n}\n.gal-detail-actions button {\n  border-color: var(--g-line);\n}\n.gal-pill {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n}\n@media (prefers-color-scheme: dark) {\n  .gal-resource-visual.skill {\n    --visual-ink: #9dcbb0;\n    --visual-bg: #24382e;\n  }\n  .gal-resource-visual.agent {\n    --visual-ink: #b6a7e0;\n    --visual-bg: #302b42;\n  }\n  .gal-resource-visual.mcp {\n    --visual-ink: #9bbfdd;\n    --visual-bg: #253442;\n  }\n  .gal-resource-visual.workflow {\n    --visual-ink: #d8bb83;\n    --visual-bg: #3d3425;\n  }\n}\n@media (max-width: 900px) {\n  .gal .gal-search-wrap {\n    width: 100%;\n  }\n}\n@media (max-width: 600px) {\n  .gal-header {\n    flex-wrap: nowrap;\n    gap: 12px;\n  }\n  .gal-header-actions {\n    flex-shrink: 0;\n  }\n  .gal-header h1 {\n    font-size: 21px;\n    gap: 8px;\n  }\n  .gal-filters button {\n    flex-direction: column;\n    gap: 5px;\n    font-size: 12px;\n    padding: 8px 4px;\n  }\n  .gal-resource-grid {\n    gap: 16px;\n  }\n  .gal-resource-visual {\n    height: 140px;\n  }\n}\n.gal-empty > svg {\n  width: 56px;\n  height: 56px;\n  padding: 14px;\n  border-radius: 12px;\n  background: var(--g-soft);\n}\n.gal-list-actions {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n.gal-list-actions button.gal-primary {\n  min-height: 38px;\n  color: var(--g-on-accent);\n}\n.gal-type-field {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  flex: 1;\n  margin-bottom: 20px;\n  font-weight: 500;\n}\n.gal-editor-type {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-height: 42px;\n}\n@media (max-width: 600px) {\n  .gal-type-field {\n    flex: 1 1 100%;\n  }\n}\n';

// src/client/modal.jsx
var import_react = __toESM(require("react"), 1);
function Modal({ children, onClose, confirmation = false }) {
  const root = (0, import_react.useRef)(null);
  const close = (0, import_react.useRef)(onClose);
  close.current = onClose;
  (0, import_react.useEffect)(() => {
    const overlay = root.current;
    const dialog = overlay.querySelector(
      '[role="dialog"], [role="alertdialog"]'
    );
    const previous = document.activeElement;
    const focusable = () => [
      ...dialog.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, [tabindex="0"]'
      )
    ].filter((el) => el.getClientRects().length && el.type !== "file");
    const initial = dialog.querySelector(
      '[autofocus], input:not([type="file"]):not(:disabled)'
    ) || focusable()[0] || dialog;
    initial.focus();
    function handleKey(event) {
      const overlays = document.querySelectorAll("[data-gallery-modal]");
      if (overlays[overlays.length - 1] !== overlay) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close.current?.();
      }
      if (event.key === "Tab") {
        const controls = focusable();
        const first = controls[0], last = controls[controls.length - 1];
        if (!first) {
          event.preventDefault();
          dialog.focus();
        } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return /* @__PURE__ */ import_react.default.createElement(
    "div",
    {
      ref: root,
      "data-gallery-modal": true,
      className: confirmation ? "gal-overlay gal-confirm-overlay" : "gal-overlay"
    },
    children
  );
}

// src/client/brand-icon.jsx
var import_react2 = __toESM(require("react"), 1);
function BrandIcon({ size = 20 }) {
  return /* @__PURE__ */ import_react2.default.createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 32 32",
      fill: "none",
      "aria-hidden": "true",
      focusable: "false"
    },
    /* @__PURE__ */ import_react2.default.createElement(
      "path",
      {
        d: "M8 12h16l1 14H7l1-14Z",
        stroke: "currentColor",
        strokeWidth: "1.8",
        strokeLinejoin: "round"
      }
    ),
    /* @__PURE__ */ import_react2.default.createElement(
      "path",
      {
        d: "M12 12V9a4 4 0 0 1 8 0v3",
        stroke: "currentColor",
        strokeWidth: "1.8",
        strokeLinecap: "round"
      }
    ),
    /* @__PURE__ */ import_react2.default.createElement("rect", { x: "11", y: "16", width: "4", height: "3", rx: ".8", fill: "currentColor" }),
    /* @__PURE__ */ import_react2.default.createElement("rect", { x: "17", y: "16", width: "4", height: "3", rx: ".8", fill: "currentColor" }),
    /* @__PURE__ */ import_react2.default.createElement("rect", { x: "11", y: "21", width: "4", height: "3", rx: ".8", fill: "currentColor" }),
    /* @__PURE__ */ import_react2.default.createElement("rect", { x: "17", y: "21", width: "4", height: "3", rx: ".8", fill: "currentColor" })
  );
}

// src/client/icons.jsx
var import_react3 = __toESM(require("react"), 1);
var paths = {
  skill: ["M5 3h10l4 4v14H5z", "M14 3v5h5", "M8 12h8M8 16h5"],
  agent: [
    "M9 4h6v3H9z",
    "M5 9h14v11H5z",
    "M9 13h.01M15 13h.01M9 17h6",
    "M2 12v5M22 12v5"
  ],
  mcp: ["M8 3v5M16 3v5", "M6 8h12v4a6 6 0 0 1-12 0z", "M12 18v4"],
  workflow: [
    "M3 3h6v6H3zM15 15h6v6h-6z",
    "M9 6h6a3 3 0 0 1 3 3v6",
    "M15 12l3 3 3-3"
  ],
  grid: ["M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"],
  plus: ["M12 5v14M5 12h14"],
  search: ["M21 21l-5-5", "M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0"],
  refresh: ["M20 7v5h-5", "M20 12a8 8 0 1 0-2 6"],
  settings: ["M4 7h16M4 17h16", "M8 4v6M16 14v6"],
  file: ["M5 3h10l4 4v14H5z", "M14 3v5h5"],
  folder: ["M3 6h7l2 2h9v12H3z"],
  clock: ["M12 8v5l3 2", "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"],
  arrow: ["M6 18L18 6M6 6h12v12"],
  edit: ["M14 5l5 5M4 20l5-1L21 7l-5-5L4 14z"],
  download: ["M12 3v12M7 10l5 5 5-5", "M4 16v5h16v-5"],
  link: [
    "M10 14l4-4",
    "M10 15l-2 2a4 4 0 0 1-5-5l4-4",
    "M14 9l2-2a4 4 0 0 1 5 5l-4 4"
  ],
  upload: ["M12 16V3M7 8l5-5 5 5", "M4 16v5h16v-5"],
  close: ["M6 6l12 12M6 18L18 6"]
};
function Glyph({ name, size = 18, className = "" }) {
  return /* @__PURE__ */ import_react3.default.createElement(
    "svg",
    {
      className,
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.6",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false"
    },
    (paths[name] || paths.file).map((d, i) => /* @__PURE__ */ import_react3.default.createElement("path", { key: i, d }))
  );
}
function ResourceVisual({ type }) {
  return /* @__PURE__ */ import_react3.default.createElement("span", { className: `gal-resource-visual ${type}`, "aria-hidden": "true" }, /* @__PURE__ */ import_react3.default.createElement(
    "svg",
    {
      className: "gal-resource-drawing",
      viewBox: "0 0 240 100",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.5",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    },
    type === "skill" && /* @__PURE__ */ import_react3.default.createElement(import_react3.default.Fragment, null, /* @__PURE__ */ import_react3.default.createElement(
      "rect",
      {
        x: "85",
        y: "12",
        width: "70",
        height: "80",
        rx: "5",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react3.default.createElement("path", { d: "M99 30h25M99 42h43M99 52h36M99 62h43M99 72h25" }), /* @__PURE__ */ import_react3.default.createElement(
      "rect",
      {
        x: "149",
        y: "45",
        width: "30",
        height: "30",
        rx: "7",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react3.default.createElement("path", { d: "M158 60l4 4 8-9" })),
    type === "agent" && /* @__PURE__ */ import_react3.default.createElement(import_react3.default.Fragment, null, /* @__PURE__ */ import_react3.default.createElement("path", { d: "M66 50h27M147 50h27M120 24V12M120 76v12" }), /* @__PURE__ */ import_react3.default.createElement(
      "rect",
      {
        x: "93",
        y: "24",
        width: "54",
        height: "52",
        rx: "13",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react3.default.createElement("circle", { cx: "109", cy: "45", r: "3" }), /* @__PURE__ */ import_react3.default.createElement("circle", { cx: "131", cy: "45", r: "3" }), /* @__PURE__ */ import_react3.default.createElement("path", { d: "M109 60h22" }), /* @__PURE__ */ import_react3.default.createElement("circle", { cx: "59", cy: "50", r: "7", fill: "var(--g-card)" }), /* @__PURE__ */ import_react3.default.createElement("circle", { cx: "181", cy: "50", r: "7", fill: "var(--g-card)" }), /* @__PURE__ */ import_react3.default.createElement("circle", { cx: "120", cy: "10", r: "3" })),
    type === "mcp" && /* @__PURE__ */ import_react3.default.createElement(import_react3.default.Fragment, null, /* @__PURE__ */ import_react3.default.createElement("path", { d: "M72 27l29 16M72 73l29-16M139 43l29-16M139 57l29 16" }), /* @__PURE__ */ import_react3.default.createElement(
      "rect",
      {
        x: "100",
        y: "30",
        width: "40",
        height: "40",
        rx: "10",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react3.default.createElement("path", { d: "M114 40v8M126 40v8M111 48h18v5a9 9 0 0 1-18 0zM120 62v8" }), /* @__PURE__ */ import_react3.default.createElement(
      "rect",
      {
        x: "56",
        y: "15",
        width: "22",
        height: "22",
        rx: "5",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react3.default.createElement(
      "rect",
      {
        x: "56",
        y: "63",
        width: "22",
        height: "22",
        rx: "5",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react3.default.createElement(
      "rect",
      {
        x: "162",
        y: "15",
        width: "22",
        height: "22",
        rx: "5",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react3.default.createElement(
      "rect",
      {
        x: "162",
        y: "63",
        width: "22",
        height: "22",
        rx: "5",
        fill: "var(--g-card)"
      }
    )),
    type === "workflow" && /* @__PURE__ */ import_react3.default.createElement(import_react3.default.Fragment, null, /* @__PURE__ */ import_react3.default.createElement("path", { d: "M71 35h29q10 0 10 10v15q0 10 10 10h38M148 63l8 7-8 7" }), /* @__PURE__ */ import_react3.default.createElement(
      "rect",
      {
        x: "43",
        y: "19",
        width: "36",
        height: "32",
        rx: "6",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react3.default.createElement(
      "rect",
      {
        x: "101",
        y: "38",
        width: "36",
        height: "32",
        rx: "6",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react3.default.createElement(
      "rect",
      {
        x: "158",
        y: "55",
        width: "36",
        height: "32",
        rx: "6",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react3.default.createElement("path", { d: "M55 35h12M113 54h12M170 71h12" }))
  ), /* @__PURE__ */ import_react3.default.createElement("span", { className: "gal-visual-type" }, /* @__PURE__ */ import_react3.default.createElement(Glyph, { name: type, size: 14 }), type === "mcp" ? "MCP" : type === "workflow" ? "Workflow" : type === "agent" ? "Agent" : "Skill"), /* @__PURE__ */ import_react3.default.createElement(Glyph, { name: "arrow", className: "gal-card-arrow", size: 17 }));
}

// src/client/index.jsx
var NS = "dsh-gallery";
var TYPES = { skill: "Skill", agent: "Agent", mcp: "MCP", workflow: "Workflow" };
var blank = () => ({
  type: "skill",
  name: "",
  description: "",
  tags: [],
  files: [],
  metadata: {},
  references: []
});
var when = (s) => s ? new Date(s).toLocaleString() : "";
var fail = (e) => e?.rpcError?.message || e?.message || String(e);
async function call(remote, name, ...args) {
  const r = await remote[name](...args);
  if (r?.ok === false) throw new Error(r.error?.message || "Gallery \u8BF7\u6C42\u5931\u8D25");
  return r?.ok === true ? r.value : r;
}
var json2 = JSON.stringify;
function download(name, value, type = "application/json") {
  const url = URL.createObjectURL(new Blob([value], { type })), a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function Icon({ size = 20 }) {
  return /* @__PURE__ */ import_react4.default.createElement(BrandIcon, { size });
}
function Gallery({ remote }) {
  const [status, setStatus] = (0, import_react4.useState)(null), [error, setError] = (0, import_react4.useState)(""), [notice, setNotice] = (0, import_react4.useState)(""), [busy, setBusy] = (0, import_react4.useState)(false);
  const [items, setItems] = (0, import_react4.useState)([]), [total, setTotal] = (0, import_react4.useState)(0), [type, setType] = (0, import_react4.useState)(""), [scope, setScope] = (0, import_react4.useState)("all"), [q, setQ] = (0, import_react4.useState)(""), [refresh, setRefresh] = (0, import_react4.useState)(0), [offset, setOffset] = (0, import_react4.useState)(0), [loading, setLoading] = (0, import_react4.useState)(false);
  const [selected, setSelected] = (0, import_react4.useState)(null), [editor, setEditor] = (0, import_react4.useState)(null);
  const [reference, setReference] = (0, import_react4.useState)("");
  const [storageSettings, setStorageSettings] = (0, import_react4.useState)(null);
  const [connectionResult, setConnectionResult] = (0, import_react4.useState)("");
  const [confirmation, setConfirmation] = (0, import_react4.useState)(null);
  const confirmAction = (message) => new Promise((resolve) => setConfirmation({ message, resolve }));
  function answerConfirmation(value) {
    const current = confirmation;
    setConfirmation(null);
    current?.resolve(value);
  }
  async function run(fn) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      return await fn();
    } catch (e) {
      setError(fail(e));
    } finally {
      setBusy(false);
    }
  }
  (0, import_react4.useEffect)(() => {
    let live = true;
    call(remote, "uiStatus").then((x) => {
      if (live) {
        setStatus(x);
        if (x.storage && !x.storage.configured) {
          setStorageSettings(x.storage);
        }
      }
    }).catch((e) => {
      if (live) setError(fail(e));
    });
    return () => {
      live = false;
    };
  }, []);
  (0, import_react4.useEffect)(() => {
    if (!status?.ready) return;
    let live = true;
    setLoading(true);
    const timer = setTimeout(
      () => call(remote, "uiList", json2({ type, scope, q, limit: 48, offset })).then((x) => {
        if (live) {
          setItems(x.items);
          setTotal(x.total);
        }
      }).catch((e) => {
        if (live) setError(fail(e));
      }).finally(() => {
        if (live) setLoading(false);
      }),
      180
    );
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [
    status?.ready,
    status?.storage?.activeLibraryId,
    type,
    scope,
    q,
    offset,
    refresh
  ]);
  async function load(id) {
    const r = await call(remote, "uiGet", id);
    setSelected(r);
    setReference("");
    return r;
  }
  function edit(r) {
    setNotice("");
    setError("");
    if (!r && !type) return;
    const d = r || { ...blank(), type };
    setEditor({
      id: r?.id,
      revision: r?.revision,
      resource: structuredClone(d),
      tags: d.tags.join(", "),
      metadata: json2(d.metadata, null, 2),
      references: json2(d.references, null, 2),
      fileIndex: 0,
      newPath: "",
      importError: ""
    });
  }
  function change(key, value) {
    setEditor((x) => ({ ...x, [key]: value }));
  }
  function field(key, value) {
    setEditor((x) => ({ ...x, resource: { ...x.resource, [key]: value } }));
  }
  async function upload(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    try {
      if (files.length === 1 && files[0].name.endsWith(".json")) {
        const raw = await files[0].text();
        let bundle;
        try {
          bundle = JSON.parse(raw);
        } catch {
        }
        if (bundle?.format === "dsh-gallery-resource" && [1, 2].includes(bundle.schemaVersion) && bundle.resource) {
          const r = bundle.resource;
          if (r.type !== editor.resource.type)
            throw new Error(
              `\u8D44\u6E90\u5305\u7C7B\u578B\u4E0D\u5339\u914D\uFF0C\u8BF7\u5728 ${TYPES[r.type] || r.type} \u5206\u7C7B\u4E2D\u5BFC\u5165\u3002`
            );
          setEditor((x) => ({
            ...x,
            resource: { ...blank(), ...r },
            tags: (r.tags || []).join(", "),
            metadata: json2(r.metadata || {}, null, 2),
            references: json2(r.references || [], null, 2),
            fileIndex: 0,
            importError: ""
          }));
          return;
        }
      }
      const incoming = [];
      let size = 0;
      for (const f of files) {
        size += f.size;
        if (size > 5 * 1024 * 1024) throw new Error("\u6587\u4EF6\u603B\u91CF\u4E0D\u80FD\u8D85\u8FC7 5 MiB");
        const bytes = new Uint8Array(await f.arrayBuffer());
        let content2, encoding = "utf8";
        try {
          content2 = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
          if (content2.includes("\0")) throw new Error();
        } catch {
          encoding = "base64";
          content2 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(f);
          });
        }
        incoming.push({
          path: f.webkitRelativePath || f.name,
          encoding,
          content: content2
        });
      }
      setEditor((x) => {
        const merged = new Map(x.resource.files.map((f) => [f.path, f]));
        for (const f of incoming) merged.set(f.path, f);
        return {
          ...x,
          resource: {
            ...x.resource,
            name: x.resource.name || files[0].name.replace(/\.[^.]+$/, ""),
            files: [...merged.values()]
          },
          importError: ""
        };
      });
    } catch (e) {
      setEditor((x) => ({ ...x, importError: fail(e) }));
    }
  }
  async function save() {
    const resource = {
      ...editor.resource,
      tags: editor.tags.split(/[,，]/).map((x) => x.trim()).filter(Boolean),
      metadata: JSON.parse(editor.metadata),
      references: JSON.parse(editor.references)
    };
    const r = editor.id ? await call(
      remote,
      "uiUpdate",
      editor.id,
      json2({ resource, expectedRevision: editor.revision })
    ) : await call(remote, "uiCreate", json2(resource));
    setEditor(null);
    await load(r.id);
    setRefresh((x) => x + 1);
    setNotice("\u8D44\u6E90\u5DF2\u4FDD\u5B58\u3002");
  }
  async function closeEditor() {
    if (busy) return;
    if (await confirmAction("\u653E\u5F03\u5C1A\u672A\u4FDD\u5B58\u7684\u4FEE\u6539\uFF1F")) setEditor(null);
  }
  function closeStorage() {
    if (busy) return;
    return run(async () => {
      if (!storageSettings.configured) {
        const storage = await call(remote, "uiConfigureStorage");
        setStatus((x) => ({ ...x, storage }));
      }
      setStorageSettings(null);
    });
  }
  const content = selected;
  const activeFile = editor?.resource.files[editor.fileIndex];
  const chooseFilter = (t) => {
    setType(t);
    setOffset(0);
  };
  return /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal" }, /* @__PURE__ */ import_react4.default.createElement("header", { className: "gal-header" }, /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("h1", null, /* @__PURE__ */ import_react4.default.createElement(BrandIcon, { size: 32 }), "Gallery")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-header-actions" }, /* @__PURE__ */ import_react4.default.createElement(
    "button",
    {
      className: "gal-icon-button",
      "aria-label": "\u5B58\u50A8\u8BBE\u7F6E",
      title: "\u5B58\u50A8\u8BBE\u7F6E \xB7 " + (status?.storage?.libraries.find(
        (l) => l.id === status.storage.activeLibraryId
      )?.name || "\u672C\u5730\u8D44\u6E90\u5E93"),
      disabled: busy || !status?.ready,
      onClick: () => run(async () => {
        const settings = await call(remote, "uiStorageSettings");
        setStorageSettings(settings);
        setConnectionResult("");
      })
    },
    /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "settings", size: 20 })
  ))), error && /* @__PURE__ */ import_react4.default.createElement("div", { role: "alert", className: "gal-alert" }, error, /* @__PURE__ */ import_react4.default.createElement("button", { "aria-label": "\u5173\u95ED\u9519\u8BEF", onClick: () => setError("") }, /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "close" }))), notice && /* @__PURE__ */ import_react4.default.createElement("div", { role: "status", className: "gal-notice" }, notice, /* @__PURE__ */ import_react4.default.createElement("button", { "aria-label": "\u5173\u95ED\u63D0\u793A", onClick: () => setNotice("") }, /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "close" }))), !status?.ready ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-empty" }, error ? "\u8D44\u6E90\u5E93\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u68C0\u67E5\u63D0\u793A\u540E\u5237\u65B0\u3002" : "\u6B63\u5728\u6253\u5F00\u672C\u5730\u8D44\u6E90\u5E93\u2026") : /* @__PURE__ */ import_react4.default.createElement(import_react4.default.Fragment, null, /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-toolbar" }, /* @__PURE__ */ import_react4.default.createElement("nav", { className: "gal-filters", "aria-label": "\u8D44\u6E90\u7C7B\u578B" }, /* @__PURE__ */ import_react4.default.createElement(
    "button",
    {
      className: !type ? "active" : "",
      "aria-pressed": !type,
      onClick: () => {
        setScope("all");
        chooseFilter("");
      }
    },
    /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "grid" }),
    "\u5168\u90E8"
  ), Object.entries(TYPES).map(([key, label]) => /* @__PURE__ */ import_react4.default.createElement(
    "button",
    {
      key,
      className: type === key ? "active" : "",
      "aria-pressed": type === key,
      onClick: () => chooseFilter(key)
    },
    /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: key }),
    label
  ))), /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-search-wrap" }, /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "search" }), /* @__PURE__ */ import_react4.default.createElement(
    "input",
    {
      "aria-label": "\u641C\u7D22\u8D44\u6E90",
      className: "gal-search",
      placeholder: "\u641C\u7D22\u540D\u79F0\u3001\u63CF\u8FF0\u6216\u6807\u7B7E\u2026",
      value: q,
      onChange: (e) => {
        setQ(e.target.value);
        setOffset(0);
      }
    }
  ))), /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-list-heading" }, /* @__PURE__ */ import_react4.default.createElement("span", null, type ? TYPES[type] : "\u8D44\u6E90", " ", /* @__PURE__ */ import_react4.default.createElement("strong", null, total)), /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-list-actions" }, type && /* @__PURE__ */ import_react4.default.createElement(
    "button",
    {
      className: "gal-primary",
      disabled: busy,
      onClick: () => edit(null)
    },
    /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "plus" }),
    "\u65B0\u5EFA ",
    TYPES[type]
  ), /* @__PURE__ */ import_react4.default.createElement(
    "button",
    {
      className: "gal-icon-button",
      title: "\u5237\u65B0\u8D44\u6E90",
      "aria-label": "\u5237\u65B0",
      disabled: busy,
      onClick: () => setRefresh((x) => x + 1)
    },
    /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "refresh" })
  ))), loading ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-empty" }, "\u6B63\u5728\u52A0\u8F7D\u8D44\u6E90\u2026") : items.length === 0 ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-empty" }, /* @__PURE__ */ import_react4.default.createElement(Icon, null), /* @__PURE__ */ import_react4.default.createElement("h3", null, q || type || scope !== "all" ? "\u6CA1\u6709\u5339\u914D\u7684\u8D44\u6E90" : "\u6682\u65E0\u8D44\u6E90"), /* @__PURE__ */ import_react4.default.createElement("p", null, q || type || scope !== "all" ? "\u8BD5\u8BD5\u5176\u4ED6\u5173\u952E\u8BCD\u6216\u5206\u7C7B\u3002" : "\u9009\u62E9\u5206\u7C7B\u540E\u65B0\u5EFA\u8D44\u6E90\u3002")) : /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-resource-grid" }, items.map((r) => /* @__PURE__ */ import_react4.default.createElement(
    "button",
    {
      key: r.id,
      className: "gal-resource-card",
      title: r.name,
      disabled: busy,
      onClick: () => run(() => load(r.id))
    },
    /* @__PURE__ */ import_react4.default.createElement(ResourceVisual, { type: r.type }),
    /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-resource-content" }, /* @__PURE__ */ import_react4.default.createElement("h3", null, r.name), r.description && /* @__PURE__ */ import_react4.default.createElement("p", null, r.description)),
    /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-tags" }, r.tags.slice(0, 2).map((t) => /* @__PURE__ */ import_react4.default.createElement("span", { key: t }, t))),
    /* @__PURE__ */ import_react4.default.createElement("footer", null, /* @__PURE__ */ import_react4.default.createElement("span", { title: "\u6587\u4EF6\u6570\u91CF" }, /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "file", size: 15 }), r.fileCount), /* @__PURE__ */ import_react4.default.createElement("span", { title: "\u66F4\u65B0\u65F6\u95F4" }, /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "clock", size: 15 }), new Date(r.updatedAt).toLocaleDateString()))
  ))), total > 48 && /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-pagination" }, /* @__PURE__ */ import_react4.default.createElement(
    "button",
    {
      disabled: !offset,
      onClick: () => setOffset((x) => Math.max(0, x - 48))
    },
    "\u4E0A\u4E00\u9875"
  ), /* @__PURE__ */ import_react4.default.createElement("span", null, Math.floor(offset / 48) + 1, " / ", Math.ceil(total / 48)), /* @__PURE__ */ import_react4.default.createElement(
    "button",
    {
      disabled: offset + 48 >= total,
      onClick: () => setOffset((x) => x + 48)
    },
    "\u4E0B\u4E00\u9875"
  ))), selected && !editor && /* @__PURE__ */ import_react4.default.createElement(Modal, { onClose: () => !busy && setSelected(null) }, /* @__PURE__ */ import_react4.default.createElement(
    "section",
    {
      tabIndex: -1,
      className: "gal-dialog gal-detail",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "\u8D44\u6E90\u8BE6\u60C5"
    },
    /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("span", { className: "gal-pill " + selected.type }, /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: selected.type, size: 16 }), TYPES[selected.type]), /* @__PURE__ */ import_react4.default.createElement("h2", null, content.name), /* @__PURE__ */ import_react4.default.createElement("p", null, "\u66F4\u65B0\u4E8E ", when(selected.updatedAt))), /* @__PURE__ */ import_react4.default.createElement("button", { "aria-label": "\u5173\u95ED\u8BE6\u60C5", onClick: () => setSelected(null) }, /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "close" }))),
    /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-detail-actions" }, selected.canEdit && /* @__PURE__ */ import_react4.default.createElement("button", { onClick: () => edit(selected) }, /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "edit" }), "\u7F16\u8F91\u8D44\u6E90"), /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        onClick: () => download(
          `${content.name}.gallery.json`,
          json2(
            {
              format: "dsh-gallery-resource",
              schemaVersion: 2,
              resource: {
                type: content.type,
                name: content.name,
                description: content.description,
                tags: content.tags,
                files: content.files,
                metadata: content.metadata,
                references: content.references
              },
              source: {
                libraryId: selected.libraryId,
                id: selected.id,
                digest: selected.digest
              }
            },
            null,
            2
          )
        )
      },
      /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "download" }),
      "\u4E0B\u8F7D\u8D44\u6E90"
    ), /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        onClick: () => setReference(
          json2(
            {
              libraryId: selected.libraryId,
              id: selected.id,
              digest: selected.digest
            },
            null,
            2
          )
        )
      },
      /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "link" }),
      "\u83B7\u53D6\u5F15\u7528"
    )),
    /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-dialog-body" }, reference && /* @__PURE__ */ import_react4.default.createElement("label", { className: "gal-reference" }, "\u8D44\u6E90\u5F15\u7528", /* @__PURE__ */ import_react4.default.createElement("textarea", { readOnly: true, rows: 4, value: reference })), /* @__PURE__ */ import_react4.default.createElement("p", { className: "gal-description" }, content.description || "\u6682\u65E0\u63CF\u8FF0"), /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-tags" }, content.tags.map((t) => /* @__PURE__ */ import_react4.default.createElement("span", { key: t }, t))), content.files.map((f) => /* @__PURE__ */ import_react4.default.createElement("details", { className: "gal-file", key: f.path }, /* @__PURE__ */ import_react4.default.createElement("summary", null, /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "file", size: 16 }), " ", f.path, /* @__PURE__ */ import_react4.default.createElement("span", null, f.bytes ?? new Blob([f.content]).size, " B")), f.encoding === "utf8" ? /* @__PURE__ */ import_react4.default.createElement("pre", null, f.content) : /* @__PURE__ */ import_react4.default.createElement("p", null, "\u4E8C\u8FDB\u5236\u9644\u4EF6\u5305\u542B\u5728\u4E0B\u8F7D\u7684\u8D44\u6E90\u5305\u4E2D\u3002"))), /* @__PURE__ */ import_react4.default.createElement("details", { className: "gal-file" }, /* @__PURE__ */ import_react4.default.createElement("summary", null, "\u5143\u6570\u636E\u4E0E\u4F9D\u8D56"), /* @__PURE__ */ import_react4.default.createElement("pre", null, json2(
      {
        metadata: content.metadata,
        references: content.references
      },
      null,
      2
    ))))
  )), editor && /* @__PURE__ */ import_react4.default.createElement(Modal, { onClose: closeEditor }, /* @__PURE__ */ import_react4.default.createElement(
    "section",
    {
      tabIndex: -1,
      className: "gal-dialog gal-editor",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": editor.id ? "\u7F16\u8F91\u8D44\u6E90" : "\u65B0\u5EFA\u8D44\u6E90"
    },
    /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("h2", null, editor.id ? "\u7F16\u8F91" : "\u65B0\u5EFA", " ", TYPES[editor.resource.type])), /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        "aria-label": "\u5173\u95ED\u7F16\u8F91",
        onClick: closeEditor,
        disabled: busy
      },
      /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "close" })
    )),
    /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-dialog-body" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-form-row" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-type-field" }, /* @__PURE__ */ import_react4.default.createElement("span", null, "\u7C7B\u578B"), /* @__PURE__ */ import_react4.default.createElement("span", { className: "gal-editor-type" }, /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: editor.resource.type }), TYPES[editor.resource.type])), /* @__PURE__ */ import_react4.default.createElement("label", { className: "gal-grow" }, "\u8D44\u6E90\u540D\u79F0", /* @__PURE__ */ import_react4.default.createElement(
      "input",
      {
        value: editor.resource.name,
        maxLength: 160,
        onChange: (e) => field("name", e.target.value),
        placeholder: "\u8F93\u5165\u8D44\u6E90\u540D\u79F0"
      }
    ))), /* @__PURE__ */ import_react4.default.createElement("label", null, "\u63CF\u8FF0", /* @__PURE__ */ import_react4.default.createElement(
      "textarea",
      {
        rows: 3,
        value: editor.resource.description,
        onChange: (e) => field("description", e.target.value),
        placeholder: "\u8D44\u6E90\u63CF\u8FF0\uFF08\u9009\u586B\uFF09",
        maxLength: 1e4
      }
    )), /* @__PURE__ */ import_react4.default.createElement("label", null, "\u6807\u7B7E", /* @__PURE__ */ import_react4.default.createElement(
      "input",
      {
        value: editor.tags,
        onChange: (e) => change("tags", e.target.value),
        placeholder: "\u6807\u7B7E\uFF0C\u7528\u9017\u53F7\u5206\u9694"
      }
    )), /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-file-toolbar" }, /* @__PURE__ */ import_react4.default.createElement("h3", null, "\u8D44\u6E90\u6587\u4EF6 ", /* @__PURE__ */ import_react4.default.createElement("small", null, editor.resource.files.length, " / 100")), /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("label", { className: "gal-upload" }, /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "upload" }), "\u4E0A\u4F20\u6587\u4EF6", /* @__PURE__ */ import_react4.default.createElement(
      "input",
      {
        "aria-label": "\u4E0A\u4F20\u8D44\u6E90\u6587\u4EF6",
        type: "file",
        multiple: true,
        onChange: (e) => {
          upload(e.target.files);
          e.target.value = "";
        }
      }
    )), /* @__PURE__ */ import_react4.default.createElement("label", { className: "gal-upload" }, /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "folder" }), "\u4E0A\u4F20\u6587\u4EF6\u5939", /* @__PURE__ */ import_react4.default.createElement(
      "input",
      {
        "aria-label": "\u4E0A\u4F20\u8D44\u6E90\u6587\u4EF6\u5939",
        type: "file",
        multiple: true,
        webkitdirectory: "",
        onChange: (e) => {
          upload(e.target.files);
          e.target.value = "";
        }
      }
    )))), editor.importError && /* @__PURE__ */ import_react4.default.createElement("p", { className: "gal-error" }, editor.importError), /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-add-file" }, /* @__PURE__ */ import_react4.default.createElement(
      "input",
      {
        "aria-label": "\u65B0\u6587\u4EF6\u8DEF\u5F84",
        placeholder: "\u65B0\u6587\u4EF6\u8DEF\u5F84\uFF0C\u4F8B\u5982 SKILL.md",
        value: editor.newPath,
        onChange: (e) => change("newPath", e.target.value)
      }
    ), /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        disabled: !editor.newPath.trim(),
        onClick: () => {
          const p = editor.newPath.trim();
          if (editor.resource.files.some((f) => f.path === p)) {
            change("importError", "\u8BE5\u6587\u4EF6\u5DF2\u5B58\u5728");
            return;
          }
          setEditor((x) => ({
            ...x,
            newPath: "",
            fileIndex: x.resource.files.length,
            resource: {
              ...x.resource,
              files: [
                ...x.resource.files,
                { path: p, encoding: "utf8", content: "" }
              ]
            }
          }));
        }
      },
      "\u6DFB\u52A0\u6587\u672C\u6587\u4EF6"
    )), /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-file-editor" }, /* @__PURE__ */ import_react4.default.createElement("nav", null, editor.resource.files.map((f, i) => /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        className: i === editor.fileIndex ? "active" : "",
        key: f.path,
        onClick: () => change("fileIndex", i)
      },
      f.path
    )), !editor.resource.files.length && /* @__PURE__ */ import_react4.default.createElement("p", null, "\u53EF\u4E0A\u4F20\u5DF2\u6709\u6587\u4EF6\uFF0C\u4E5F\u53EF\u76F4\u63A5\u521B\u5EFA\u6587\u672C\u6587\u4EF6\u3002")), /* @__PURE__ */ import_react4.default.createElement("div", null, activeFile ? /* @__PURE__ */ import_react4.default.createElement(import_react4.default.Fragment, null, /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-code-head" }, /* @__PURE__ */ import_react4.default.createElement("span", null, activeFile.path), /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        onClick: () => setEditor((x) => ({
          ...x,
          fileIndex: 0,
          resource: {
            ...x.resource,
            files: x.resource.files.filter(
              (_, i) => i !== x.fileIndex
            )
          }
        }))
      },
      "\u79FB\u9664\u6587\u4EF6"
    )), activeFile.encoding === "utf8" ? /* @__PURE__ */ import_react4.default.createElement(
      "textarea",
      {
        "aria-label": "\u6587\u4EF6\u5185\u5BB9",
        spellCheck: "false",
        value: activeFile.content,
        onChange: (e) => setEditor((x) => ({
          ...x,
          resource: {
            ...x.resource,
            files: x.resource.files.map(
              (f, i) => i === x.fileIndex ? { ...f, content: e.target.value } : f
            )
          }
        }))
      }
    ) : /* @__PURE__ */ import_react4.default.createElement("p", null, "\u4E8C\u8FDB\u5236\u6587\u4EF6\u5DF2\u4E0A\u4F20\uFF0C\u53EF\u79FB\u9664\u540E\u91CD\u65B0\u4E0A\u4F20\u66FF\u6362\u3002")) : /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-code-placeholder" }, "\u9009\u62E9\u6587\u4EF6\u4EE5\u67E5\u770B\u6216\u7F16\u8F91"))), /* @__PURE__ */ import_react4.default.createElement("details", { className: "gal-advanced" }, /* @__PURE__ */ import_react4.default.createElement("summary", null, "\u5143\u6570\u636E\u4E0E\u8D44\u6E90\u5F15\u7528"), /* @__PURE__ */ import_react4.default.createElement("label", null, "\u5143\u6570\u636E\uFF08JSON \u5BF9\u8C61\uFF09", /* @__PURE__ */ import_react4.default.createElement(
      "textarea",
      {
        rows: 5,
        value: editor.metadata,
        onChange: (e) => change("metadata", e.target.value),
        spellCheck: "false"
      }
    )), /* @__PURE__ */ import_react4.default.createElement("label", null, "\u8D44\u6E90\u4F9D\u8D56\uFF08JSON\uFF09", /* @__PURE__ */ import_react4.default.createElement(
      "textarea",
      {
        rows: 5,
        value: editor.references,
        onChange: (e) => change("references", e.target.value),
        spellCheck: "false"
      }
    )))),
    /* @__PURE__ */ import_react4.default.createElement("footer", { className: "gal-dialog-footer" }, /* @__PURE__ */ import_react4.default.createElement("button", { disabled: busy, onClick: closeEditor }, "\u53D6\u6D88"), /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        className: "gal-primary",
        disabled: busy,
        onClick: () => run(save)
      },
      busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u8D44\u6E90"
    ))
  )), storageSettings && /* @__PURE__ */ import_react4.default.createElement(Modal, { onClose: closeStorage }, /* @__PURE__ */ import_react4.default.createElement(
    "section",
    {
      tabIndex: -1,
      className: "gal-dialog gal-storage",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "gal-storage-title"
    },
    /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react4.default.createElement("h2", { id: "gal-storage-title" }, storageSettings.configured ? "\u8D44\u6E90\u5E93\u5B58\u50A8" : "\u9009\u62E9\u8D44\u6E90\u5E93\u5B58\u50A8"), /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        "aria-label": "\u5173\u95ED\u5B58\u50A8\u8BBE\u7F6E",
        disabled: busy,
        onClick: closeStorage
      },
      /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: "close" })
    )),
    /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-dialog-body" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-storage-providers" }, storageSettings.providers.map((provider) => /* @__PURE__ */ import_react4.default.createElement(
      "div",
      {
        key: provider.type,
        className: provider.available ? "active" : ""
      },
      /* @__PURE__ */ import_react4.default.createElement("strong", null, provider.name),
      /* @__PURE__ */ import_react4.default.createElement("span", null, provider.available ? "\u53EF\u7528" : "\u540E\u7EED\u63A5\u5165")
    ))), connectionResult && /* @__PURE__ */ import_react4.default.createElement("p", { role: "status" }, connectionResult), error && /* @__PURE__ */ import_react4.default.createElement("p", { role: "alert" }, error)),
    /* @__PURE__ */ import_react4.default.createElement("footer", { className: "gal-dialog-footer" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "gal-local" }, "v0.4.8"), /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        disabled: busy,
        onClick: () => run(async () => {
          await call(
            remote,
            "uiTestStorage",
            json2({ libraryId: "local" })
          );
          setConnectionResult("\u8D44\u6E90\u5E93\u53EF\u7528");
        })
      },
      "\u68C0\u67E5\u5B58\u50A8"
    ), /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        className: "gal-primary",
        disabled: busy,
        onClick: closeStorage
      },
      busy ? "\u5904\u7406\u4E2D\u2026" : "\u5B8C\u6210"
    ))
  )), confirmation && /* @__PURE__ */ import_react4.default.createElement(Modal, { confirmation: true, onClose: () => answerConfirmation(false) }, /* @__PURE__ */ import_react4.default.createElement(
    "section",
    {
      tabIndex: -1,
      className: "gal-dialog gal-small",
      role: "alertdialog",
      "aria-modal": "true",
      "aria-label": "\u786E\u8BA4\u64CD\u4F5C"
    },
    /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react4.default.createElement("h2", null, "\u786E\u8BA4\u64CD\u4F5C")),
    /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-dialog-body" }, /* @__PURE__ */ import_react4.default.createElement("p", null, confirmation.message)),
    /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-dialog-footer" }, /* @__PURE__ */ import_react4.default.createElement("button", { autoFocus: true, onClick: () => answerConfirmation(false) }, "\u53D6\u6D88"), /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        className: "gal-primary",
        onClick: () => answerConfirmation(true)
      },
      "\u786E\u8BA4"
    ))
  )));
}
var inject = ["remote", "slots", "locale"];
async function apply(ctx) {
  await ctx.remote.$mount(REMOTE);
  const remote = ctx.get("remote.gallery");
  ctx.effect(
    () => ctx.locale.register(NS, {
      zh: { title: "Gallery" },
      en: { title: "Gallery" }
    })
  );
  ctx.effect(() => {
    const s = document.createElement("style");
    s.dataset.gallery = "styles";
    s.textContent = styles_default;
    document.head.appendChild(s);
    return () => s.remove();
  });
  ctx.slots.inject(
    "sidebar.panellist",
    () => ctx.slots.register(
      {
        name: "sidebar.panellist",
        id: "gallery",
        order: 62,
        locale: NS,
        label: () => "Gallery"
      },
      Icon
    )
  );
  ctx.slots.inject(
    "main",
    () => ctx.slots.register(
      { name: "main", key: "gallery", locale: NS, inject: () => ({ remote }) },
      Gallery
    )
  );
}
return module.exports;}});

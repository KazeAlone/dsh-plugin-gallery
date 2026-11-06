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
var import_react11 = __toESM(require("react"), 1);

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
  uiSkillCatalog: [],
  uiCheckMcp: ["payload"],
  uiPublishWorkflow: ["id"],
  uiList: ["payload"],
  uiGet: ["id"],
  uiCreate: ["payload"],
  uiUpdate: ["id", "payload"],
  uiDelete: ["id", "payload"],
  uiSetUsername: ["payload"],
  uiStorageSettings: [],
  uiTestStorage: ["payload"],
  uiConfigureStorage: []
};
var DESCRIPTORS = Object.entries(methods).map(([method, names2]) => ({
  id: `dsh-plugin-gallery#gallery/${method}`,
  service: "gallery",
  namespace: "gallery",
  method,
  invocation: { kind: "direct" },
  parameters: names2.map(string),
  result: json
}));
var REMOTE = {
  package: "dsh-plugin-gallery",
  descriptors: DESCRIPTORS
};

// src/client/styles.css
var styles_default = `.gal {
  --g-bg: #ffffff;
  --g-card: #ffffff;
  --g-soft: #f5f6f7;
  --g-hover: #f0f2f4;
  --g-ink: #20242b;
  --g-muted: #606873;
  --g-line: #dfe3e8;
  --g-control: #9da5af;
  --g-accent: #20242b;
  --g-on-accent: #ffffff;
  --g-ring: #3568c5;
  --g-error: #a12622;
  --g-error-bg: #fff4f2;
  --g-success: #245c3b;
  --g-success-bg: #f0f8f2;
  --g-overlay: #10151c66;
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  overflow: auto;
  background: var(--g-bg);
  color: var(--g-ink);
  padding: 32px clamp(16px, 4vw, 48px);
  font:
    14px/1.6 -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    "PingFang SC",
    "Microsoft YaHei",
    sans-serif;
  color-scheme: light;
}
.gal *,
.gal *::before,
.gal *::after {
  box-sizing: border-box;
}
.gal h1,
.gal h2,
.gal h3,
.gal p {
  margin: 0;
}
.gal h1 {
  font-size: 24px;
  line-height: 1.4;
  font-weight: 600;
}
.gal h2 {
  font-size: 20px;
  line-height: 1.5;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.gal h3 {
  font-size: 15px;
  line-height: 1.5;
  font-weight: 600;
}
.gal button,
.gal input,
.gal textarea,
.gal select {
  font: inherit;
}
.gal button,
.gal .gal-upload {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  padding: 7px 14px;
  border: 1px solid var(--g-control);
  border-radius: 5px;
  background: var(--g-card);
  color: var(--g-ink);
  cursor: pointer;
  transition:
    background-color 150ms,
    border-color 150ms;
  touch-action: manipulation;
}
.gal button:hover:not(:disabled),
.gal .gal-upload:hover {
  background: var(--g-hover);
}
.gal button:active:not(:disabled) {
  background: var(--g-line);
}
.gal button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.gal :is(button, input, textarea, select, summary):focus-visible,
.gal .gal-upload:focus-within {
  outline: 2px solid var(--g-ring);
  outline-offset: 3px;
}
.gal button.gal-primary {
  background: var(--g-accent);
  color: var(--g-on-accent);
  border-color: var(--g-accent);
}
.gal button.gal-primary:hover:not(:disabled) {
  background: var(--g-muted);
  border-color: var(--g-muted);
}
.gal input,
.gal textarea,
.gal select {
  width: 100%;
  min-width: 0;
  padding: 9px 12px;
  color: var(--g-ink);
  background: var(--g-card);
  border: 1px solid var(--g-control);
  border-radius: 5px;
}
.gal input::placeholder,
.gal textarea::placeholder {
  color: var(--g-muted);
  opacity: 1;
}
.gal textarea {
  resize: vertical;
}
.gal label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 20px;
  font-weight: 500;
}
.gal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin-bottom: 28px;
}
.gal-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.gal-header-actions > button:first-child {
  color: var(--g-muted);
}
.gal-header-actions .gal-primary {
  flex-shrink: 0;
}
.gal-theme-picker { position: relative; }
.gal-theme-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 80;
  width: 224px;
  padding: 6px;
  border: 1px solid var(--g-line);
  border-radius: 12px;
  background: var(--g-card);
  box-shadow: 0 14px 38px #0000002b;
}
.gal .gal-theme-menu button {
  display: flex;
  width: 100%;
  justify-content: flex-start;
  min-height: 52px;
  padding: 6px 8px;
  border: 0;
  border-radius: 8px;
  text-align: left;
}
.gal-theme-menu button > span:nth-child(2) { flex: 1; display: grid; gap: 0; }
.gal-theme-menu strong { font-size: 13px; font-weight: 600; }
.gal-theme-menu small { color: var(--g-muted); font-size: 11px; }
.gal-theme-swatch { width: 30px; height: 30px; border: 1px solid var(--g-line); border-radius: 7px; flex: 0 0 auto; }
.gal-theme-swatch.system { background: linear-gradient(135deg, #f5f6f7 50%, #25292f 50%); }
.gal-theme-swatch.atelier { background: linear-gradient(135deg, #0d1b17 60%, #c5a773 60%); }
.gal-theme-swatch.paper { background: linear-gradient(135deg, #f8f4e9 60%, #ad6549 60%); }
.gal-theme-swatch.neon { background: linear-gradient(135deg, #27134b 35%, #c845e2 65%, #36d5b8); }
.gal-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border-bottom: 1px solid var(--g-line);
  padding-bottom: 16px;
}
.gal-filters {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.gal-filters button {
  border-color: transparent;
  color: var(--g-muted);
  padding: 7px 12px;
}
.gal-filters button.active {
  color: var(--g-ink);
  background: var(--g-soft);
  font-weight: 600;
  box-shadow: inset 0 -2px var(--g-ink);
}
.gal input.gal-search {
  max-width: 280px;
}
.gal-list-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  color: var(--g-muted);
  font-size: 13px;
}
.gal-list-heading strong {
  margin-left: 6px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.gal-list-heading button {
  border-color: transparent;
  min-height: 32px;
  padding: 4px 10px;
  color: var(--g-muted);
}
.gal-resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 270px), 1fr));
  gap: 20px;
}
.gal button.gal-resource-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  text-align: left;
  border: 1px solid var(--g-line);
  border-radius: 12px;
  overflow: hidden;
  align-items: stretch;
  justify-content: flex-start;
  min-width: 0;
}
.gal-resource-type {
  font-size: 13px;
  font-weight: 500;
  color: var(--g-muted);
}
.gal-resource-content {
  min-width: 0;
  padding: 18px 18px 0;
}
.gal-resource-content h3 {
  overflow-wrap: anywhere;
  font-size: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.gal-resource-content p {
  color: var(--g-muted);
  margin-top: 6px;
  font-size: 13px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}
.gal-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 12px 0;
}
.gal-tags span {
  font-size: 12px;
  line-height: 1.5;
  border: 1px solid var(--g-line);
  border-radius: 3px;
  padding: 2px 7px;
  color: var(--g-muted);
  overflow-wrap: anywhere;
}
.gal-resource-card .gal-tags {
  margin: 12px 0 18px;
  padding: 0 18px;
  min-height: 24px;
}
.gal-resource-card footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding: 12px 18px;
  border-top: 1px solid var(--g-line);
  color: var(--g-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.gal-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 300px;
  padding: 40px 16px;
  text-align: center;
  color: var(--g-muted);
}
.gal-empty h3 {
  color: var(--g-ink);
}
.gal-empty .gal-primary {
  margin-top: 8px;
}
.gal-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 24px 0;
  color: var(--g-muted);
}
.gal-alert,
.gal-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 14px;
  border: 1px solid currentColor;
  border-radius: 4px;
  margin-bottom: 20px;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  position: relative;
  z-index: 40;
}
.gal-alert {
  color: var(--g-error);
  background: var(--g-error-bg);
}
.gal-notice {
  position: fixed;
  top: max(20px, env(safe-area-inset-top));
  right: max(20px, env(safe-area-inset-right));
  z-index: 100;
  max-width: min(360px, calc(100vw - 32px));
  margin: 0;
  gap: 10px;
  padding: 10px 12px;
  border-color: var(--g-line);
  border-radius: 10px;
  color: var(--g-success);
  background: var(--g-success-bg);
  box-shadow: 0 4px 18px #00000012;
}
.gal-notice > span {
  flex: 1;
}
@media (max-width: 600px) {
  .gal-notice {
    top: max(12px, env(safe-area-inset-top));
    right: max(16px, env(safe-area-inset-right));
  }
}
.gal-alert button,
.gal-notice button {
  min-height: 28px;
  min-width: 28px;
  padding: 0;
  border-color: transparent;
  color: inherit;
  background: transparent;
  flex-shrink: 0;
}
.gal-overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--g-overlay);
}
.gal-confirm-overlay {
  z-index: 60;
}
.gal-dialog {
  display: flex;
  flex-direction: column;
  width: min(880px, 100%);
  max-height: calc(100dvh - 48px);
  border: 1px solid var(--g-control);
  border-radius: 6px;
  background: var(--g-card);
  overflow: hidden;
}
.gal-dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 24px;
  border-bottom: 1px solid var(--g-line);
  flex-shrink: 0;
}
.gal-dialog-head > div {
  min-width: 0;
}
.gal-dialog-head p {
  font-size: 13px;
  color: var(--g-muted);
  margin-top: 6px;
}
.gal-dialog-head > button {
  border-color: transparent;
  min-width: 36px;
  min-height: 36px;
  padding: 0;
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
}
.gal-dialog-body {
  padding: 24px;
  overflow: auto;
  min-height: 0;
}
.gal-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--g-line);
  flex-shrink: 0;
}
.gal-dialog-footer > .gal-local {
  margin-right: auto;
  color: var(--g-muted);
  font-size: 13px;
}
.gal-pill {
  display: inline-block;
  font-size: 12px;
  color: var(--g-muted);
  margin-bottom: 8px;
}
.gal-detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 16px 24px;
  border-bottom: 1px solid var(--g-line);
  flex-shrink: 0;
}
.gal-description {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.gal-file {
  border: 1px solid var(--g-line);
  border-radius: 4px;
  margin: 16px 0 0;
  overflow: hidden;
}
.gal summary {
  cursor: pointer;
  padding: 12px;
  overflow-wrap: anywhere;
}
.gal-file summary span {
  float: right;
  color: var(--g-muted);
  font-size: 12px;
  margin-left: 12px;
}
.gal pre {
  font:
    13px/1.8 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: var(--g-soft);
  padding: 16px;
  border-top: 1px solid var(--g-line);
  margin: 0;
  max-height: 380px;
  overflow: auto;
}
.gal-file > p {
  padding: 16px;
}
.gal-form-row {
  display: flex;
  gap: 20px;
}
.gal-form-row > label {
  flex: 1;
  min-width: 0;
}
.gal-form-row > label.gal-grow {
  flex: 3;
}
.gal-file-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 24px 0 12px;
}
.gal-file-toolbar small {
  font-size: 12px;
  color: var(--g-muted);
  margin-left: 8px;
  font-weight: 400;
}
.gal-file-toolbar > div {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.gal label.gal-upload {
  margin: 0;
  font-weight: 400;
  position: relative;
}
.gal-upload input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  opacity: 0;
  overflow: hidden;
}
.gal-add-file {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.gal-add-file button {
  white-space: nowrap;
}
.gal-file-editor {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  min-height: 300px;
  border: 1px solid var(--g-control);
  border-radius: 4px;
  overflow: hidden;
}
.gal-file-editor nav {
  background: var(--g-soft);
  border-right: 1px solid var(--g-line);
  padding: 8px;
  max-height: 420px;
  overflow: auto;
}
.gal-file-editor nav button {
  width: 100%;
  justify-content: flex-start;
  text-align: left;
  border-color: transparent;
  background: transparent;
  border-radius: 3px;
  font-size: 13px;
  overflow-wrap: anywhere;
}
.gal-file-editor nav button.active {
  color: var(--g-ink);
  background: var(--g-line);
  font-weight: 600;
}
.gal-file-editor nav p,
.gal-code-placeholder {
  padding: 16px;
  color: var(--g-muted);
  font-size: 13px;
}
.gal-file-editor > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.gal-code-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--g-line);
}
.gal-code-head span {
  font:
    13px/1.5 ui-monospace,
    monospace;
  overflow-wrap: anywhere;
}
.gal-code-head button {
  color: var(--g-error);
  border-color: transparent;
  padding: 4px 8px;
  flex-shrink: 0;
}
.gal-file-editor textarea {
  flex: 1;
  min-height: 280px;
  font:
    13px/1.8 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  border: 0;
  border-radius: 0;
  tab-size: 2;
}
.gal-file-editor textarea:focus-visible {
  outline-offset: -3px;
}
.gal-advanced {
  margin-top: 24px;
  border-top: 1px solid var(--g-line);
}
.gal-advanced summary {
  padding: 16px 0;
  color: var(--g-muted);
}
.gal-advanced textarea,
.gal-reference textarea {
  font:
    13px/1.7 ui-monospace,
    Consolas,
    monospace;
}
.gal-reference textarea {
  resize: vertical;
}
.gal-error {
  color: var(--g-error);
  margin: 12px 0;
}
.gal-small {
  max-width: 440px;
}
.gal-storage {
  max-width: 600px;
}
.gal-storage-providers {
  margin-bottom: 24px;
}
.gal-storage-providers > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--g-line);
}
.gal-storage-providers strong {
  font-weight: 500;
}
.gal-storage-providers span,
.gal-storage-providers > div:not(.active) {
  color: var(--g-muted);
}
.gal-storage .gal-dialog-body > p {
  color: var(--g-muted);
  font-size: 13px;
  margin: 0 0 24px;
}
.gal-storage .gal-dialog-body > p[role="alert"] {
  color: var(--g-error);
  margin: 16px 0 0;
}
.gal-storage .gal-dialog-body > p[role="status"] {
  color: var(--g-success);
  margin: 16px 0 0;
}
@media (prefers-color-scheme: dark) {
  .gal[data-theme="system"] {
    --g-bg: #181a1e;
    --g-card: #1e2126;
    --g-soft: #25292f;
    --g-hover: #2c3139;
    --g-ink: #edf0f4;
    --g-muted: #adb5c0;
    --g-line: #383f49;
    --g-control: #737e8d;
    --g-accent: #edf0f4;
    --g-on-accent: #181a1e;
    --g-ring: #8bb4ff;
    --g-error: #ffb5ae;
    --g-error-bg: #382422;
    --g-success: #a7dbb7;
    --g-success-bg: #203329;
    --g-overlay: #00000099;
    color-scheme: dark;
  }
}
@media (max-width: 900px) {
  .gal-header {
    flex-wrap: wrap;
  }
  .gal-header-actions {
    flex-wrap: wrap;
  }
  .gal-toolbar {
    flex-wrap: wrap;
    gap: 16px;
  }
  .gal input.gal-search {
    max-width: none;
  }
}
@media (max-width: 600px) {
  .gal {
    padding: 24px 16px;
    font-size: 14px;
  }
  .gal-header {
    gap: 16px;
    margin-bottom: 24px;
  }
  .gal-header-actions {
    width: auto;
    justify-content: flex-end;
    gap: 8px;
  }
  .gal-filters {
    width: 100%;
    gap: 0;
  }
  .gal-filters button {
    flex: 1;
    min-height: 44px;
    padding: 7px 5px;
  }
  .gal input,
  .gal textarea,
  .gal select {
    font-size: 16px;
  }
  .gal-overlay {
    padding: 12px;
  }
  .gal-dialog {
    max-height: calc(100dvh - 24px);
  }
  .gal-dialog-head,
  .gal-dialog-body {
    padding: 20px;
  }
  .gal-dialog-footer {
    padding: 16px 20px;
    gap: 8px;
  }
  .gal-dialog-footer > .gal-local {
    width: 100%;
  }
  .gal-detail-actions {
    padding: 12px 20px;
  }
  .gal-form-row {
    flex-wrap: wrap;
    gap: 0;
  }
  .gal-form-row > label,
  .gal-form-row > label.gal-grow {
    flex: 1 1 100%;
    width: 100%;
  }
  .gal-file-editor {
    grid-template-columns: 1fr;
  }
  .gal-file-editor nav {
    max-height: 140px;
    border-right: 0;
    border-bottom: 1px solid var(--g-line);
  }
  .gal-file-editor textarea {
    font-size: 16px;
  }
  .gal-file-toolbar > div {
    width: 100%;
  }
  .gal-add-file {
    flex-wrap: wrap;
  }
  .gal-add-file input {
    flex: 1 1 180px;
  }
  .gal-code-head {
    flex-wrap: wrap;
  }
}
@media (prefers-reduced-motion: reduce) {
  .gal *,
  .gal *::before,
  .gal *::after {
    transition: none !important;
    animation: none !important;
    scroll-behavior: auto !important;
  }
}

.gal svg {
  flex-shrink: 0;
  vertical-align: middle;
}
.gal h1 {
  display: flex;
  align-items: center;
  gap: 12px;
}
.gal button.gal-icon-button {
  width: 38px;
  min-width: 38px;
  height: 38px;
  padding: 0;
  border-color: var(--g-line);
  border-radius: 8px;
}
.gal .gal-search-wrap {
  position: relative;
  width: 280px;
  max-width: 100%;
}
.gal-search-wrap > svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--g-muted);
  pointer-events: none;
}
.gal input.gal-search {
  padding-left: 38px;
  border-color: var(--g-line);
  border-radius: 8px;
}
.gal-filters button {
  border-radius: 7px;
}
.gal-filters button.active {
  box-shadow: none;
  border-color: var(--g-line);
}
.gal button.gal-resource-card:hover:not(:disabled) {
  background: var(--g-card);
  border-color: var(--g-control);
}
.gal-resource-visual {
  display: block;
  position: relative;
  height: 132px;
  width: 100%;
  background: var(--g-soft);
  color: var(--g-muted);
  border-bottom: 1px solid var(--g-line);
}
.gal-resource-visual.skill {
  --visual-ink: #386a54;
  --visual-bg: #eef5f0;
}
.gal-resource-visual.agent {
  --visual-ink: #6552a0;
  --visual-bg: #f2eff9;
}
.gal-resource-visual.mcp {
  --visual-ink: #366c92;
  --visual-bg: #edf4f9;
}
.gal-resource-visual.workflow {
  --visual-ink: #936424;
  --visual-bg: #faf4e9;
}
.gal-resource-visual {
  color: var(--visual-ink);
  background: var(--visual-bg);
}
.gal-resource-drawing {
  position: absolute;
  width: 240px;
  height: 100px;
  left: 50%;
  top: 24px;
  transform: translateX(-50%);
}
.gal-visual-type {
  position: absolute;
  top: 12px;
  left: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
}
.gal-card-arrow {
  position: absolute;
  right: 14px;
  top: 13px;
}
.gal-resource-card footer > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.gal-tags span {
  background: var(--g-soft);
  border-color: transparent;
  border-radius: 4px;
}
.gal-detail-actions button {
  border-color: var(--g-line);
}
.gal-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
@media (prefers-color-scheme: dark) {
  .gal[data-theme="system"] .gal-resource-visual.skill {
    --visual-ink: #9dcbb0;
    --visual-bg: #24382e;
  }
  .gal[data-theme="system"] .gal-resource-visual.agent {
    --visual-ink: #b6a7e0;
    --visual-bg: #302b42;
  }
  .gal[data-theme="system"] .gal-resource-visual.mcp {
    --visual-ink: #9bbfdd;
    --visual-bg: #253442;
  }
  .gal[data-theme="system"] .gal-resource-visual.workflow {
    --visual-ink: #d8bb83;
    --visual-bg: #3d3425;
  }
}
@media (max-width: 900px) {
  .gal .gal-search-wrap {
    width: 100%;
  }
}
@media (max-width: 600px) {
  .gal-header {
    flex-wrap: nowrap;
    gap: 12px;
  }
  .gal-header-actions {
    flex-shrink: 0;
  }
  .gal-header h1 {
    font-size: 21px;
    gap: 8px;
  }
  .gal-filters button {
    flex-direction: column;
    gap: 5px;
    font-size: 12px;
    padding: 8px 4px;
  }
  .gal-resource-grid {
    gap: 16px;
  }
  .gal-resource-visual {
    height: 140px;
  }
}
.gal-empty > svg {
  width: 56px;
  height: 56px;
  padding: 14px;
  border-radius: 12px;
  background: var(--g-soft);
}
.gal-list-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.gal-list-actions button.gal-primary {
  min-height: 38px;
  color: var(--g-on-accent);
}
.gal-type-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  margin-bottom: 20px;
  font-weight: 500;
}
.gal-editor-type {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
}
@media (max-width: 600px) {
  .gal-type-field {
    flex: 1 1 100%;
  }
}

/* Skill folder creation */
.gal-skill-wizard {
  width: min(1200px, 100%);
  height: min(860px, calc(100dvh - 48px));
}
.gal-skill-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 16px 24px;
  gap: 8px;
  border-bottom: 1px solid var(--g-line);
}
.gal-skill-steps button {
  border: 0;
  background: var(--g-soft);
  justify-content: flex-start;
}
.gal-skill-steps button[aria-current="step"] {
  background: var(--g-accent);
  color: var(--g-on-accent);
}
.gal-skill-steps button span {
  border: 1px solid currentColor;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.gal-skill-layout {
  flex: 1;
  align-content: start;
  scrollbar-gutter: stable;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 24px;
}
.gal-skill-layout main {
  min-width: 0;
}
.gal-skill-fields {
  display: grid;
  gap: 16px;
  margin-top: 16px;
  min-width: 0;
}
.gal-skill-fields > p,
.gal-skill-folder p {
  color: var(--g-muted);
}
.gal-skill-fields fieldset,
fieldset.gal-skill-fields {
  border: 1px solid var(--g-line);
  padding: 16px;
}
.gal-skill-code {
  min-height: 300px;
  font-family: monospace !important;
}
.gal-skill-preview {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: var(--g-soft);
  padding: 16px;
  max-height: 360px;
  overflow: auto;
}
.gal-skill-preview h2,
.gal-skill-preview h3 {
  margin: 12px 0;
}
.gal-skill-tree {
  align-self: start;
  background: var(--g-soft);
  padding: 16px;
  border-radius: 8px;
  overflow-wrap: anywhere;
}
.gal-skill-tree summary {
  cursor: pointer;
  margin-bottom: 16px;
}
.gal-skill-tree svg {
  vertical-align: middle;
  flex-shrink: 0;
}
.gal-skill-tree > div {
  margin: 12px 0 0 10px;
}
.gal-skill-leaf {
  margin: 8px 0 0 12px;
}
.gal-skill-folders {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.gal-skill-folder {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  border: 1px dashed var(--g-control);
  padding: 14px;
  border-radius: 8px;
}
.gal-skill-folder code {
  font-size: 12px;
}
.gal-skill-folder p {
  flex: 1;
}
.gal-skill-folder .gal-upload {
  position: relative;
}
.gal-skill-filelist > div {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.gal-skill-filelist > div > button:first-child {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: left;
}
.gal-skill-summary {
  display: grid;
  justify-items: start;
  gap: 12px;
  padding: 20px;
  background: var(--g-soft);
  border-radius: 8px;
}
.gal-skill-ok {
  color: var(--g-success) !important;
}
.gal-skill-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid var(--g-line);
}
@media (max-width: 700px) {
  .gal-skill-layout {
    grid-template-columns: 1fr;
  }
  .gal-skill-steps {
    padding: 12px;
    gap: 4px;
  }
  .gal-skill-steps button {
    flex-direction: column;
    padding: 8px 2px;
    font-size: 12px;
  }
  .gal-skill-folders {
    grid-template-columns: 1fr;
  }
  .gal-skill-folder {
    display: grid;
    grid-template-columns: auto 1fr;
  }
  .gal-skill-footer {
    padding: 12px;
  }
}
.gal .gal-skill-steps button[aria-current="step"],
.gal .gal-skill-steps button[aria-current="step"]:hover {
  background: var(--g-accent);
  color: var(--g-on-accent);
}
.gal-skill-steps,
.gal-skill-footer {
  flex-shrink: 0;
}

.gal-skill-footer > .gal-primary {
  width: 168px;
  height: 42px;
  flex: 0 0 168px;
  justify-content: center;
  white-space: nowrap;
}
.gal-skill-attachments {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(0, 2fr);
  align-items: start;
  gap: 16px;
}
.gal-skill-attachments > fieldset.gal-skill-fields {
  margin: 0;
}
.gal-skill-attachments textarea {
  min-height: 240px;
  font-family: monospace;
}
@media (max-width: 900px) {
  .gal-skill-attachments {
    grid-template-columns: 1fr;
  }
}

.gal-usage-total {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px !important;
}
.gal-resource-card footer {
  flex-wrap: wrap;
}

.gal-card-creator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--g-muted);
  padding: 0 18px;
  overflow-wrap: anywhere;
}
.gal button.gal-delete {
  color: var(--g-error);
}
.gal-username-setting {
  margin: 20px 0 12px;
}

/* Four category charts, ordered by cumulative calls. */
.gal-leaderboards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
}
.gal-board {
  --rank-color: #32715a;
  --rank-tint: #edf6f0;
  border: 1px solid var(--g-line);
  border-top: 3px solid var(--rank-color);
  border-radius: 12px;
  background: var(--g-card);
  overflow: hidden;
  min-width: 0;
}
.gal-board.agent {
  --rank-color: #7753ac;
  --rank-tint: #f3effa;
}
.gal-board.mcp {
  --rank-color: #247d87;
  --rank-tint: #edf7f8;
}
.gal-board.workflow {
  --rank-color: #a3742b;
  --rank-tint: #faf4e8;
}
.gal-board-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 22px 16px;
  background: var(--rank-tint);
}
.gal-board-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--rank-color);
  border-radius: 12px;
  color: var(--rank-color);
  flex-shrink: 0;
}
.gal-board-head h2 {
  font-size: 19px;
  letter-spacing: -0.4px;
}
.gal-board-head div > span {
  color: var(--g-muted);
  font-size: 12px;
}
.gal-board-top {
  margin-left: auto;
  writing-mode: vertical-rl;
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--rank-color);
  font-weight: 700;
}
.gal-board-columns {
  display: flex;
  justify-content: space-between;
  padding: 14px 16px 8px;
  color: var(--g-muted);
  font-size: 11px;
}
.gal-board-list {
  list-style: none;
  margin: 0;
  padding: 0 8px 12px;
}
.gal .gal-rank-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  padding: 15px 8px;
  min-height: 80px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  text-align: left;
}
.gal .gal-rank-row:hover {
  background: var(--rank-tint);
}
.gal-rank-number {
  width: 25px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--g-muted);
  font-size: 17px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.gal .rank-1 {
  background: var(--rank-tint);
  margin: 4px 0;
  min-height: 104px;
}
.rank-1 .gal-rank-number {
  color: var(--rank-color);
  font-size: 24px;
}
.rank-2 .gal-rank-number,
.rank-3 .gal-rank-number {
  color: var(--rank-color);
}
.gal-rank-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.gal-rank-info > strong {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.rank-1 .gal-rank-info > strong {
  font-size: 16px;
}
.gal-rank-author {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--g-muted);
  overflow-wrap: anywhere;
}
.gal-rank-count {
  font-size: 16px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
  flex-shrink: 0;
}
.rank-1 .gal-rank-count {
  color: var(--rank-color);
  font-size: 20px;
}
.gal-rank-track {
  display: block;
  height: 3px;
  background: var(--g-line);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 3px;
}
.gal-rank-track > span {
  display: block;
  height: 100%;
  background: var(--rank-color);
  border-radius: 3px;
}
.gal .gal-board-more {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: 0;
  border-top: 1px solid var(--g-line);
  border-radius: 0;
  padding: 14px 18px;
  color: var(--rank-color);
  background: transparent;
  min-height: 48px;
}
.gal-board-empty {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--g-muted);
}
.gal-board-empty svg {
  color: var(--rank-color);
}
@media (max-width: 1100px) {
  .gal-leaderboards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 560px) {
  .gal-leaderboards {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }
  .gal-board-head {
    padding: 18px;
  }
}
@media (prefers-color-scheme: dark) {
  .gal[data-theme="system"] .gal-board {
    --rank-color: #8fc7aa;
    --rank-tint: #20382d;
  }
  .gal[data-theme="system"] .gal-board.agent {
    --rank-color: #b9a0e4;
    --rank-tint: #30273e;
  }
  .gal[data-theme="system"] .gal-board.mcp {
    --rank-color: #87c9d0;
    --rank-tint: #20353a;
  }
  .gal[data-theme="system"] .gal-board.workflow {
    --rank-color: #dfbc7d;
    --rank-tint: #3b3121;
  }
}

.gal.gal-toast-host {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  width: auto;
  min-height: 0;
  overflow: visible;
  padding: 0;
  background: transparent;
}
.gal-toast-host .gal-notice {
  position: absolute;
  pointer-events: auto;
}

.gal-mcp-transport {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.gal .gal-mcp-transport button[aria-pressed="true"] {
  border-color: var(--g-accent);
  background: var(--g-soft);
}
.gal-mcp-result {
  padding: 16px;
  border: 1px solid var(--g-line);
  border-radius: 8px;
  max-height: 300px;
  overflow: auto;
}
.gal-mcp-result > p {
  display: flex;
  gap: 8px;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px solid var(--g-line);
}
.gal-mcp-result > p span {
  color: var(--g-muted);
  min-width: 0;
  overflow-wrap: anywhere;
}
.gal-workflow-card { display: grid; gap: 10px; padding: 14px; margin: 10px 0; border: 1px solid var(--gal-border, #ddd); border-radius: 12px; }
.gal-workflow-card > button { justify-self: end; }
.gal-workflow-card select[multiple] { min-height: 76px; }

/* Optional Gallery-only themes. Layout, content and controls remain shared. */
.gal[data-theme="atelier"] {
  --g-bg: #0e1b17;
  --g-card: #172720;
  --g-soft: #20352a;
  --g-hover: #2a4134;
  --g-ink: #f2eadb;
  --g-muted: #b6c2b5;
  --g-line: #405a4b;
  --g-control: #809687;
  --g-accent: #c9ac78;
  --g-on-accent: #132019;
  --g-ring: #e8c68a;
  --g-error: #ffc1ae;
  --g-error-bg: #402823;
  --g-success: #b5dbb9;
  --g-success-bg: #20402d;
  --g-overlay: #050d0ab8;
  color-scheme: dark;
  background-image: radial-gradient(circle at 95% 0, #28423366, transparent 38%);
}
.gal[data-theme="paper"] {
  --g-bg: #f8f4eb;
  --g-card: #fffdf8;
  --g-soft: #eee7d9;
  --g-hover: #e8dfcf;
  --g-ink: #292e28;
  --g-muted: #68655e;
  --g-line: #d6cabb;
  --g-control: #a59783;
  --g-accent: #77523c;
  --g-on-accent: #fffdf8;
  --g-ring: #9b6849;
  --g-error: #a4382f;
  --g-error-bg: #fbebe3;
  --g-success: #386b49;
  --g-success-bg: #e8f1e4;
  --g-overlay: #2f271f7a;
  color-scheme: light;
  background-image: radial-gradient(circle at 100% 0, #e8dcc98a, transparent 42%);
}
.gal[data-theme="atelier"] .gal-header,
.gal[data-theme="paper"] .gal-header { border-bottom: 1px solid var(--g-line); padding-bottom: 22px; }
.gal[data-theme="atelier"] .gal-header h1 { color: #f3e4c6; letter-spacing: .02em; }
.gal[data-theme="atelier"] .gal-board,
.gal[data-theme="atelier"] button.gal-resource-card { box-shadow: 0 16px 36px #00000030; }
.gal[data-theme="paper"] .gal-board,
.gal[data-theme="paper"] button.gal-resource-card { box-shadow: 0 10px 30px #5a483012; }
.gal[data-theme="atelier"] .gal-board { --rank-color: #d9bb82; --rank-tint: #24382a; }
.gal[data-theme="atelier"] .gal-board.agent { --rank-color: #c7c4a6; --rank-tint: #2d392c; }
.gal[data-theme="atelier"] .gal-board.mcp { --rank-color: #99bfad; --rank-tint: #213b35; }
.gal[data-theme="atelier"] .gal-board.workflow { --rank-color: #c9a976; --rank-tint: #383225; }
.gal[data-theme="paper"] .gal-board { --rank-color: #697c5f; --rank-tint: #edf1e6; }
.gal[data-theme="paper"] .gal-board.agent { --rank-color: #946f78; --rank-tint: #f4e9e9; }
.gal[data-theme="paper"] .gal-board.mcp { --rank-color: #527a80; --rank-tint: #e9f1f0; }
.gal[data-theme="paper"] .gal-board.workflow { --rank-color: #a5784f; --rank-tint: #f4ecdf; }
.gal[data-theme="atelier"] .gal-resource-visual.skill { --visual-ink: #d8bb82; --visual-bg: #27392c; }
.gal[data-theme="atelier"] .gal-resource-visual.agent { --visual-ink: #c7c4a6; --visual-bg: #303b2e; }
.gal[data-theme="atelier"] .gal-resource-visual.mcp { --visual-ink: #99bfad; --visual-bg: #213a34; }
.gal[data-theme="atelier"] .gal-resource-visual.workflow { --visual-ink: #c9a976; --visual-bg: #3a3328; }
.gal[data-theme="paper"] .gal-resource-visual.skill { --visual-ink: #697c5f; --visual-bg: #e9eee4; }
.gal[data-theme="paper"] .gal-resource-visual.agent { --visual-ink: #946f78; --visual-bg: #f1e6e7; }
.gal[data-theme="paper"] .gal-resource-visual.mcp { --visual-ink: #527a80; --visual-bg: #e6f0ef; }
.gal[data-theme="paper"] .gal-resource-visual.workflow { --visual-ink: #a5784f; --visual-bg: #f2e9dd; }

/* Neon Glass changes the page composition as well as its palette. */
.gal[data-theme="neon"] {
  --g-bg: #0d0a1c;
  --g-card: #201533;
  --g-soft: #2b1b43;
  --g-hover: #382452;
  --g-ink: #fbf3ff;
  --g-muted: #c4b3d5;
  --g-line: #65477d;
  --g-control: #9a75b2;
  --g-accent: #e981ef;
  --g-on-accent: #21102f;
  --g-ring: #80efd6;
  --g-error: #ffb7c3;
  --g-error-bg: #452038;
  --g-success: #9cf1d7;
  --g-success-bg: #153f3a;
  --g-overlay: #090617c9;
  color-scheme: dark;
  background-color: var(--g-bg);
  background-image: radial-gradient(circle at 80% 0%, #57197b67 0, transparent 34%), radial-gradient(circle at 8% 72%, #164e5959 0, transparent 38%);
  background-attachment: fixed;
}
.gal[data-theme="neon"] .gal-header {
  position: relative;
  z-index: 3;
  min-height: 170px;
  padding: 26px 30px;
  align-items: flex-start;
  overflow: visible;
  border: 1px solid #9562b08c;
  border-radius: 22px;
  background: radial-gradient(circle at 70% 40%, #7832a173, transparent 30%), linear-gradient(110deg, #341b54e6, #18122ede 58%, #172b39d9);
  box-shadow: inset 0 1px #f6d8ff4d, 0 16px 50px #05020b80;
  isolation: isolate;
}
.gal[data-theme="neon"] .gal-header::after {
  content: '';
  position: absolute;
  z-index: -1;
  width: 116px;
  height: 116px;
  left: min(57%, 650px);
  top: 25px;
  border: 2px solid #ac93ffb3;
  border-radius: 27px;
  transform: rotate(-25deg);
  box-shadow: 0 0 34px #b94affb0, inset 0 0 28px #9a4aff87, 0 0 0 13px #ab79ff1a;
  pointer-events: none;
}
.gal[data-theme="neon"] .gal-header h1 {
  font-size: clamp(36px, 5vw, 58px);
  font-weight: 750;
  letter-spacing: -.045em;
  text-shadow: 0 0 26px #f076ff8a;
}
.gal[data-theme="neon"] .gal-header h1 svg { width: 40px; height: 40px; filter: drop-shadow(0 0 12px #d868ff); }
.gal[data-theme="neon"] .gal-header-actions { position: relative; z-index: 2; }
.gal[data-theme="neon"] .gal-theme-menu { background: #241839f2; backdrop-filter: blur(20px); }
.gal[data-theme="neon"] .gal-toolbar { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; border: 0; }
.gal[data-theme="neon"] .gal-filters { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
.gal[data-theme="neon"] .gal-filters button {
  min-height: 72px;
  border: 1px solid #765697a8;
  border-radius: 16px;
  background: #35254b96;
  box-shadow: inset 0 1px #ffffff25;
  color: var(--g-ink);
  font-size: 15px;
  font-weight: 600;
  backdrop-filter: blur(14px);
}
.gal[data-theme="neon"] .gal-filters button svg { width: 26px; height: 26px; color: #c590f4; }
.gal[data-theme="neon"] .gal-filters button.active {
  border-color: #ef9afa;
  background: linear-gradient(130deg, #8b3cbd, #602fa3 70%, #383c79);
  box-shadow: 0 0 24px #ba4ae477, inset 0 1px #ffe6ff78;
}
.gal[data-theme="neon"] .gal-filters button.active svg { color: #fff1ff; }
.gal[data-theme="neon"] .gal-search-wrap { width: min(100%, 400px); }
.gal[data-theme="neon"] input.gal-search { max-width: none; border-radius: 22px; border-color: #8766a9; background: #1b1430bd; backdrop-filter: blur(14px); }
.gal[data-theme="neon"] .gal-list-heading { padding: 12px 0 20px; font-size: 15px; color: #e8d6f5; }
.gal[data-theme="neon"] .gal-board {
  --rank-color: #d494fa; --rank-tint: #50276b80;
  border: 1px solid #9960b9a8;
  border-radius: 18px;
  background: linear-gradient(160deg, #3d2358bc, #1b1535d9 55%, #142835bb);
  box-shadow: inset 0 1px #ffffff2f, 0 14px 38px #0803138c;
  backdrop-filter: blur(18px);
}
.gal[data-theme="neon"] .gal-board.agent { --rank-color: #ef95dc; --rank-tint: #642b5c80; }
.gal[data-theme="neon"] .gal-board.mcp { --rank-color: #75ebd4; --rank-tint: #1b655f80; }
.gal[data-theme="neon"] .gal-board.workflow { --rank-color: #b69aff; --rank-tint: #45358a80; }
.gal[data-theme="neon"] .gal-board-head { min-height: 94px; background: linear-gradient(110deg, var(--rank-tint), transparent); }
.gal[data-theme="neon"] .gal-board-icon { border-radius: 14px; box-shadow: 0 0 20px var(--rank-tint); }
.gal[data-theme="neon"] .gal-board-head h2 { font-size: 21px; }
.gal[data-theme="neon"] .rank-1 { border: 1px solid var(--rank-color); border-radius: 11px; box-shadow: inset 0 0 24px var(--rank-tint), 0 0 14px var(--rank-tint); }
.gal[data-theme="neon"] button.gal-resource-card {
  border-color: #8b62a9;
  border-radius: 18px;
  background: #251a3ac9;
  box-shadow: inset 0 1px #ffffff33, 0 12px 32px #06030d91;
  backdrop-filter: blur(16px);
}
.gal[data-theme="neon"] button.gal-resource-card:hover:not(:disabled) { border-color: #dc9afb; background: #302047; box-shadow: 0 0 25px #a543ce63; }
.gal[data-theme="neon"] .gal-resource-visual.skill { --visual-ink: #d894fa; --visual-bg: #39204e; }
.gal[data-theme="neon"] .gal-resource-visual.agent { --visual-ink: #f0a1df; --visual-bg: #452043; }
.gal[data-theme="neon"] .gal-resource-visual.mcp { --visual-ink: #87f0d8; --visual-bg: #163b45; }
.gal[data-theme="neon"] .gal-resource-visual.workflow { --visual-ink: #bea8ff; --visual-bg: #292456; }
.gal[data-theme="neon"] .gal-resource-visual { height: 158px; background-image: radial-gradient(circle at 50% 55%, currentColor 0, transparent 63%); background-blend-mode: soft-light; }
.gal[data-theme="neon"] .gal-resource-drawing { top: 33px; filter: drop-shadow(0 0 10px currentColor); }
.gal[data-theme="neon"] .gal-dialog { border: 1px solid #8f61ac; box-shadow: 0 24px 70px #030207e0, 0 0 35px #8a42b33b; }
@media (max-width: 800px) {
  .gal[data-theme="neon"] .gal-filters { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .gal[data-theme="neon"] .gal-header { min-height: 140px; }
  .gal[data-theme="neon"] .gal-header::after { width: 82px; height: 82px; left: 57%; }
}
@media (max-width: 520px) {
  .gal[data-theme="neon"] .gal-header { min-height: 110px; padding: 18px; border-radius: 16px; }
  .gal[data-theme="neon"] .gal-header h1 { font-size: 30px; }
  .gal[data-theme="neon"] .gal-header h1 svg { width: 28px; height: 28px; }
  .gal[data-theme="neon"] .gal-header::after { width: 56px; height: 56px; left: 60%; top: 24px; }
  .gal[data-theme="neon"] .gal-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .gal[data-theme="neon"] .gal-filters button { min-height: 58px; font-size: 13px; }
  .gal[data-theme="neon"] .gal-filters button:first-child { grid-column: 1 / -1; }
}
@media (prefers-reduced-motion: no-preference) {
  .gal[data-theme="neon"] .gal-filters button,
  .gal[data-theme="neon"] button.gal-resource-card { transition: transform 160ms, box-shadow 160ms, border-color 160ms, background-color 160ms; }
  .gal[data-theme="neon"] .gal-filters button:hover:not(:disabled),
  .gal[data-theme="neon"] button.gal-resource-card:hover:not(:disabled) { transform: translateY(-2px); }
}

/* Astral Gold keeps moving decoration separate from the resource content. */
.gal[data-theme="astral"] {
  --g-bg: #0b0d1c;
  --g-card: #15182c;
  --g-soft: #1e2138;
  --g-hover: #2b2b43;
  --g-ink: #fff0d6;
  --g-muted: #c3b9ab;
  --g-line: #6d583d;
  --g-control: #a88a59;
  --g-accent: #efca87;
  --g-on-accent: #161222;
  --g-ring: #ffdb96;
  --g-error: #ffc0be;
  --g-error-bg: #432433;
  --g-success: #b4ebca;
  --g-success-bg: #163931;
  --g-overlay: #070816d9;
  position: relative;
  isolation: isolate;
  color-scheme: dark;
  background: radial-gradient(ellipse at 55% 0, #29264b, transparent 55%), var(--g-bg);
}
.gal-theme-swatch.astral { background: linear-gradient(135deg, #181830 35%, #e8bd73 52%, #41385d 70%); }
.gal-astral-sky {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  background-image: radial-gradient(circle, #f8d9a377 1px, transparent 1.6px), radial-gradient(circle, #b9bfff55 1px, transparent 1.5px);
  background-size: 127px 103px, 193px 157px;
  background-position: 29px 13px, 63px 41px;
}
.gal-astral-orbit {
  transform-origin: 270px 68px;
  filter: drop-shadow(0 0 5px #ffcc74);
  animation: gal-astral-orbit 42s linear infinite;
}
.gal-astral-meteor {
  position: absolute;
  top: 9%;
  left: 12%;
  width: clamp(70px, 15vw, 210px);
  height: 2px;
  transform: rotate(24deg);
  opacity: 0;
  background: linear-gradient(90deg, transparent, #ecc27b, #fff6d6);
  animation: gal-astral-fall 9s linear infinite;
}
.gal-astral-meteor:nth-child(3) { top: 38%; left: 43%; animation-delay: -3s; }
.gal-astral-meteor:nth-child(4) { top: 64%; left: 7%; animation-delay: -6s; }
@keyframes gal-astral-orbit { to { transform: rotate(360deg); } }
@keyframes gal-astral-fall {
  0% { transform: rotate(24deg) translateX(-50%); opacity: 0; }
  8% { opacity: .85; }
  32%, 100% { transform: rotate(24deg) translateX(230%); opacity: 0; }
}
.gal[data-theme="astral"] .gal-header {
  border-bottom: 1px solid var(--g-control);
  padding-bottom: 20px;
}
.gal[data-theme="astral"] .gal-header h1 { font-family: Georgia, serif; color: var(--g-accent); }
.gal-astral-motion {
  align-self: center;
  padding: 6px 10px;
  border: 1px solid var(--g-line);
  border-radius: 8px;
  background: var(--g-soft);
  color: var(--g-ink);
  cursor: pointer;
}
.gal[data-theme="astral"] .gal-board {
  --rank-color: #85e6b7;
  --rank-tint: #173830;
  --astral-delay: 0s;
  border-color: var(--g-control);
  background: linear-gradient(150deg, var(--rank-tint), var(--g-card) 65%);
  animation: gal-astral-halo 8s ease-in-out infinite var(--astral-delay);
}
.gal[data-theme="astral"] .gal-board.agent { --rank-color: #91caff; --rank-tint: #1a3054; --astral-delay: 2s; }
.gal[data-theme="astral"] .gal-board.mcp { --rank-color: #d0a2ff; --rank-tint: #342149; --astral-delay: 4s; }
.gal[data-theme="astral"] .gal-board.workflow { --rank-color: #ffd28c; --rank-tint: #3c2c1d; --astral-delay: 6s; }
@keyframes gal-astral-halo {
  0%, 35%, 100% { box-shadow: 0 0 0 transparent; }
  20% { box-shadow: 0 0 18px color-mix(in srgb, var(--rank-color), transparent 65%); }
}
.gal[data-motion-paused="true"] :is(.gal-astral-orbit, .gal-astral-meteor, .gal-board) { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .gal[data-theme="astral"] :is(.gal-astral-orbit, .gal-astral-meteor, .gal-board) { animation: none; }
  .gal-astral-motion { display: none; }
}

.gal-astral-chart {
  position: absolute;
  top: -30px;
  left: 50%;
  width: min(56%, 700px);
  transform: translateX(-50%);
  color: #e5bd78;
  opacity: .67;
}
.gal[data-theme="astral"] .gal-header {
  min-height: 112px;
  border-image: linear-gradient(90deg, #7c5736, #ffe1a5, #7c5736) 1;
}
.gal[data-theme="astral"] .gal-header h1 { font-size: clamp(28px, 4vw, 54px); }
.gal-astral-title {
  border-left: 1px solid #bb9563;
  padding-left: 14px;
  font: 500 clamp(12px, 1.4vw, 19px) Georgia, serif;
  letter-spacing: .18em;
}
.gal[data-theme="astral"] .gal-leaderboards {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  align-items: stretch;
}
.gal[data-theme="astral"] .gal-board {
  --frame-cut: 13px;
  --frame-shape: polygon(var(--frame-cut) 0, calc(100% - var(--frame-cut)) 0, 100% var(--frame-cut), 100% calc(100% - var(--frame-cut)), calc(100% - var(--frame-cut)) 100%, var(--frame-cut) 100%, 0 calc(100% - var(--frame-cut)), 0 var(--frame-cut));
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  border: 0;
  border-radius: 0;
  padding: 5px;
  background: transparent;
  overflow: visible;
}
.gal[data-theme="astral"] .gal-board::before,
.gal[data-theme="astral"] .gal-board::after {
  content: "";
  position: absolute;
  pointer-events: none;
  clip-path: var(--frame-shape);
  z-index: -1;
}
.gal[data-theme="astral"] .gal-board::before {
  inset: 0;
  background: linear-gradient(135deg, #fff0bd, #885a32 23%, #f6d28c 49%, #9c6940 75%, #ffe5aa);
}
.gal[data-theme="astral"] .gal-board::after {
  inset: 3px;
  background: radial-gradient(ellipse at 50% 0, var(--rank-tint), var(--g-bg) 80%);
}
.gal[data-theme="astral"] .gal-board-head {
  position: relative;
  justify-content: center;
  min-height: 90px;
  border-bottom: 1px solid #b9905c77;
  background: transparent;
  padding-inline: 44px;
}
.gal[data-theme="astral"] .gal-board-head::before,
.gal[data-theme="astral"] .gal-board-head::after {
  content: "";
  position: absolute;
  width: 13px;
  height: 13px;
  top: 12px;
  border: 1px solid #ffe5ad;
  transform: rotate(45deg);
  background: conic-gradient(var(--rank-color), #1b1a30, var(--rank-color), #fff4dc, var(--rank-color));
  box-shadow: 0 0 10px var(--rank-color);
  pointer-events: none;
}
.gal[data-theme="astral"] .gal-board-head::before { left: 13px; }
.gal[data-theme="astral"] .gal-board-head::after { right: 13px; }
.gal[data-theme="astral"] .gal-board-head h2 { font: 600 28px Georgia, serif; color: var(--g-accent); }
.gal[data-theme="astral"] .gal-board-top { position: absolute; right: 15px; bottom: 9px; writing-mode: horizontal-tb; }
.gal[data-theme="astral"] .gal-board-empty { min-height: 115px; }
.gal[data-theme="astral"] .gal-board-more { margin-top: auto; }
@media (max-width: 1100px) {
  .gal[data-theme="astral"] .gal-leaderboards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 560px) {
  .gal[data-theme="astral"] .gal-leaderboards { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 700px) {
  .gal-astral-title { display: none; }
}

.gal-resource-visual.gal-purpose-cover {
  --visual-ink: hsl(var(--cover-hue) 75% 82%);
  --visual-bg: hsl(var(--cover-hue) 42% 17%);
  background: radial-gradient(ellipse at 58% 50%, hsl(var(--cover-hue) 47% 30%), transparent 68%), var(--visual-bg);
}
.gal-purpose-drawing {
  position: absolute;
  inset: 30px 0 10px;
  display: grid;
  place-items: center;
}
.gal-purpose-drawing svg { width: 70px; height: 70px; }
.gal-cover-picker { display: grid; gap: 8px; }
.gal-cover-picker .gal-purpose-cover { border-radius: 8px; }

.gal-skill-steps.gal-three-steps { grid-template-columns: repeat(3, minmax(0, 1fr)); }

.gal[data-theme="comic"] {
  --g-bg: #f9efd8;
  --g-card: #fffaf0;
  --g-soft: #f4e4be;
  --g-hover: #ffedb3;
  --g-ink: #211c20;
  --g-muted: #584950;
  --g-line: #352b31;
  --g-control: #352b31;
  --g-accent: #ffce53;
  --g-on-accent: #211c20;
  --g-ring: #155aaa;
  --g-error: #851c36;
  --g-error-bg: #ffe0e7;
  --g-success: #154f43;
  --g-success-bg: #cdf1e4;
  --g-overlay: #241c25b3;
  color-scheme: light;
  background-color: var(--g-bg);
  background-image: radial-gradient(#4c32472b 1px, transparent 1px);
  background-size: 8px 8px;
}
.gal-theme-swatch.comic { background: linear-gradient(135deg, #ffe06c 45%, #211c20 45% 55%, #fba2b7 55%); }
.gal[data-theme="comic"] :is(.gal-header, .gal-board, button.gal-resource-card, .gal-dialog) {
  border: 2px solid var(--g-ink);
  border-radius: 4px;
  box-shadow: 5px 5px 0 var(--g-ink);
}
.gal[data-theme="comic"] .gal-header {
  padding: clamp(12px, 3vw, 28px);
  background: repeating-conic-gradient(from 72deg at 35% 100%, #ffdc72 0deg 12deg, #ffe8a0 12deg 23deg);
}
.gal[data-theme="comic"] .gal-header h1 {
  font-weight: 950;
  font-style: italic;
  text-shadow: 2px 2px 0 #fffaf0;
}
.gal[data-theme="comic"] .gal-filters button.active {
  background: #ffce53;
  color: var(--g-ink);
  border-color: var(--g-ink);
  box-shadow: 2px 2px 0 var(--g-ink);
}
.gal[data-theme="comic"] .gal-board { --rank-color: #175744; --rank-tint: #a4e2be; }
.gal[data-theme="comic"] .gal-board.agent { --rank-color: #58377b; --rank-tint: #dac0f8; }
.gal[data-theme="comic"] .gal-board.mcp { --rank-color: #174e7d; --rank-tint: #a5d9ff; }
.gal[data-theme="comic"] .gal-board.workflow { --rank-color: #802f45; --rank-tint: #f9aec4; }
.gal[data-theme="comic"] .gal-board-head {
  border-bottom: 2px solid var(--g-ink);
  background-image: radial-gradient(#211c2040 1px, transparent 1px);
  background-size: 6px 6px;
}
.gal[data-theme="comic"] .gal-board-head h2 { font-weight: 900; }
.gal[data-theme="comic"] .gal-board-icon { background: var(--g-card); border-color: var(--g-ink); }
.gal[data-theme="comic"] .gal-purpose-cover {
  --visual-ink: hsl(var(--cover-hue) 55% 24%);
  --visual-bg: hsl(var(--cover-hue) 76% 82%);
  background: radial-gradient(#211c2030 1px, transparent 1px) 0 0 / 7px 7px, var(--visual-bg);
  border-bottom: 2px solid var(--g-ink);
}
`;

// src/client/leaderboards.jsx
var import_react2 = __toESM(require("react"), 1);

// src/client/icons.jsx
var import_react = __toESM(require("react"), 1);
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
  palette: ["M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.4-3.4 1.7 1.7 0 0 1 1.2-2.9H17a4 4 0 0 0 4-4A9 9 0 0 0 12 3z", "M7 10h.01M10 6h.01M15 7h.01M18 11h.01"],
  file: ["M5 3h10l4 4v14H5z", "M14 3v5h5"],
  folder: ["M3 6h7l2 2h9v12H3z"],
  trophy: [
    "M8 3h8v7a4 4 0 0 1-8 0z",
    "M8 5H4v3a4 4 0 0 0 4 4M16 5h4v3a4 4 0 0 1-4 4M12 14v5M8 21h8M10 19h4"
  ],
  user: ["M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0", "M4 21v-2a8 8 0 0 1 16 0v2"],
  trash: ["M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"],
  usage: ["M4 20h16M7 16v-5M12 16V4M17 16V8"],
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
  check: ["M5 12l4 4L19 6"],
  close: ["M6 6l12 12M6 18L18 6"]
};
function Glyph({ name, size = 18, className = "" }) {
  return /* @__PURE__ */ import_react.default.createElement(
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
    (paths[name] || paths.file).map((d, i) => /* @__PURE__ */ import_react.default.createElement("path", { key: i, d }))
  );
}
function ResourceVisual({ type }) {
  return /* @__PURE__ */ import_react.default.createElement("span", { className: `gal-resource-visual ${type}`, "aria-hidden": "true" }, /* @__PURE__ */ import_react.default.createElement(
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
    type === "skill" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(
      "rect",
      {
        x: "85",
        y: "12",
        width: "70",
        height: "80",
        rx: "5",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react.default.createElement("path", { d: "M99 30h25M99 42h43M99 52h36M99 62h43M99 72h25" }), /* @__PURE__ */ import_react.default.createElement(
      "rect",
      {
        x: "149",
        y: "45",
        width: "30",
        height: "30",
        rx: "7",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react.default.createElement("path", { d: "M158 60l4 4 8-9" })),
    type === "agent" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("path", { d: "M66 50h27M147 50h27M120 24V12M120 76v12" }), /* @__PURE__ */ import_react.default.createElement(
      "rect",
      {
        x: "93",
        y: "24",
        width: "54",
        height: "52",
        rx: "13",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react.default.createElement("circle", { cx: "109", cy: "45", r: "3" }), /* @__PURE__ */ import_react.default.createElement("circle", { cx: "131", cy: "45", r: "3" }), /* @__PURE__ */ import_react.default.createElement("path", { d: "M109 60h22" }), /* @__PURE__ */ import_react.default.createElement("circle", { cx: "59", cy: "50", r: "7", fill: "var(--g-card)" }), /* @__PURE__ */ import_react.default.createElement("circle", { cx: "181", cy: "50", r: "7", fill: "var(--g-card)" }), /* @__PURE__ */ import_react.default.createElement("circle", { cx: "120", cy: "10", r: "3" })),
    type === "mcp" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("path", { d: "M72 27l29 16M72 73l29-16M139 43l29-16M139 57l29 16" }), /* @__PURE__ */ import_react.default.createElement(
      "rect",
      {
        x: "100",
        y: "30",
        width: "40",
        height: "40",
        rx: "10",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react.default.createElement("path", { d: "M114 40v8M126 40v8M111 48h18v5a9 9 0 0 1-18 0zM120 62v8" }), /* @__PURE__ */ import_react.default.createElement(
      "rect",
      {
        x: "56",
        y: "15",
        width: "22",
        height: "22",
        rx: "5",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "rect",
      {
        x: "56",
        y: "63",
        width: "22",
        height: "22",
        rx: "5",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "rect",
      {
        x: "162",
        y: "15",
        width: "22",
        height: "22",
        rx: "5",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react.default.createElement(
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
    type === "workflow" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("path", { d: "M71 35h29q10 0 10 10v15q0 10 10 10h38M148 63l8 7-8 7" }), /* @__PURE__ */ import_react.default.createElement(
      "rect",
      {
        x: "43",
        y: "19",
        width: "36",
        height: "32",
        rx: "6",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "rect",
      {
        x: "101",
        y: "38",
        width: "36",
        height: "32",
        rx: "6",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "rect",
      {
        x: "158",
        y: "55",
        width: "36",
        height: "32",
        rx: "6",
        fill: "var(--g-card)"
      }
    ), /* @__PURE__ */ import_react.default.createElement("path", { d: "M55 35h12M113 54h12M170 71h12" }))
  ), /* @__PURE__ */ import_react.default.createElement("span", { className: "gal-visual-type" }, /* @__PURE__ */ import_react.default.createElement(Glyph, { name: type, size: 14 }), type === "mcp" ? "MCP" : type === "workflow" ? "Workflow" : type === "agent" ? "Agent" : "Skill"), /* @__PURE__ */ import_react.default.createElement(Glyph, { name: "arrow", className: "gal-card-arrow", size: 17 }));
}

// src/client/leaderboards.jsx
var names = {
  skill: "Skill",
  agent: "Agent",
  mcp: "MCP",
  workflow: "Workflow"
};
function Leaderboards({ boards, busy, filtered, onOpen, onCategory }) {
  return /* @__PURE__ */ import_react2.default.createElement("div", { className: "gal-leaderboards" }, Object.entries(names).map(([type, label]) => {
    const board = boards.find((b) => b.type === type) || {
      items: [],
      total: 0
    };
    const maximum = board.items[0]?.usageCount || 0;
    return /* @__PURE__ */ import_react2.default.createElement(
      "section",
      {
        key: type,
        className: `gal-board ${type}`,
        "aria-label": `${label} \u8C03\u7528\u699C`
      },
      /* @__PURE__ */ import_react2.default.createElement("header", { className: "gal-board-head" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "gal-board-icon" }, /* @__PURE__ */ import_react2.default.createElement(Glyph, { name: type, size: 26 })), /* @__PURE__ */ import_react2.default.createElement("div", null, /* @__PURE__ */ import_react2.default.createElement("h2", null, label), /* @__PURE__ */ import_react2.default.createElement("span", null, board.total, " \u4E2A\u8D44\u6E90")), /* @__PURE__ */ import_react2.default.createElement("span", { className: "gal-board-top" }, "TOP 10")),
      /* @__PURE__ */ import_react2.default.createElement("div", { className: "gal-board-columns" }, /* @__PURE__ */ import_react2.default.createElement("span", null, "\u6392\u540D / \u8D44\u6E90"), /* @__PURE__ */ import_react2.default.createElement("span", null, "\u8C03\u7528\u6B21\u6570")),
      board.items.length ? /* @__PURE__ */ import_react2.default.createElement("ol", { className: "gal-board-list" }, board.items.map((r, i) => /* @__PURE__ */ import_react2.default.createElement("li", { key: r.id }, /* @__PURE__ */ import_react2.default.createElement(
        "button",
        {
          className: `gal-rank-row rank-${i + 1}`,
          disabled: busy,
          onClick: () => onOpen(r),
          title: `${r.name} \xB7 ${r.creator?.username || "\u672A\u8BB0\u5F55"} \xB7 \u7D2F\u8BA1\u8C03\u7528 ${r.usageCount ?? 0} \u6B21`
        },
        /* @__PURE__ */ import_react2.default.createElement("span", { className: "gal-rank-number" }, i === 0 && /* @__PURE__ */ import_react2.default.createElement(Glyph, { name: "trophy", size: 16 }), /* @__PURE__ */ import_react2.default.createElement("span", null, String(i + 1).padStart(2, "0"))),
        /* @__PURE__ */ import_react2.default.createElement("span", { className: "gal-rank-info" }, /* @__PURE__ */ import_react2.default.createElement("strong", null, r.name), /* @__PURE__ */ import_react2.default.createElement("span", { className: "gal-rank-author" }, /* @__PURE__ */ import_react2.default.createElement(Glyph, { name: "user", size: 12 }), r.creator?.username || "\u672A\u8BB0\u5F55"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "gal-rank-track", "aria-hidden": "true" }, /* @__PURE__ */ import_react2.default.createElement(
          "span",
          {
            style: {
              width: `${maximum ? Math.max(0, Math.min(100, (r.usageCount || 0) / maximum * 100)) : 0}%`
            }
          }
        ))),
        /* @__PURE__ */ import_react2.default.createElement(
          "span",
          {
            className: "gal-rank-count",
            "aria-label": `\u7D2F\u8BA1\u8C03\u7528 ${r.usageCount ?? 0} \u6B21`
          },
          (r.usageCount ?? 0).toLocaleString()
        )
      )))) : /* @__PURE__ */ import_react2.default.createElement("div", { className: "gal-board-empty" }, /* @__PURE__ */ import_react2.default.createElement(Glyph, { name: type, size: 36 }), /* @__PURE__ */ import_react2.default.createElement("p", null, filtered ? "\u6CA1\u6709\u5339\u914D\u7684\u8D44\u6E90" : "\u6682\u65E0\u8D44\u6E90")),
      /* @__PURE__ */ import_react2.default.createElement("button", { className: "gal-board-more", onClick: () => onCategory(type) }, "\u67E5\u770B ", label, /* @__PURE__ */ import_react2.default.createElement(Glyph, { name: "arrow", size: 16 }))
    );
  }));
}

// src/client/gallery-trigger.mjs
function createGalleryTrigger(remote, icon) {
  return {
    trigger: "/",
    name: "Gallery",
    order: 1,
    async candidates(session, { query, signal }) {
      const key = query.toLowerCase();
      if (key !== "gallery" && !key.startsWith("gallery/")) {
        return "gallery".startsWith(key) ? [
          {
            name: "gallery",
            label: "Gallery",
            description: "\u9009\u62E9 Gallery Skill",
            icon,
            value: "open",
            drill: true
          }
        ] : [];
      }
      const result = await remote.uiSkillCatalog();
      signal?.throwIfAborted();
      if (result?.ok === false)
        throw new Error(result.error?.message || "\u65E0\u6CD5\u8BFB\u53D6 Gallery Skill");
      const rows = result?.ok === true ? result.value : result;
      const search = key.startsWith("gallery/") ? key.slice(8) : "";
      return rows.filter(
        (r) => `${r.label} ${r.description}`.toLowerCase().includes(search)
      ).map((r) => ({
        name: r.label,
        description: r.description,
        icon,
        value: r.name
      }));
    },
    header(session, { query }) {
      return query.toLowerCase().startsWith("gallery") ? [{ label: "Gallery Skills", value: "open", current: true }] : void 0;
    },
    onPick({ candidate }) {
      if (candidate.value === "open")
        return { text: "/gallery/", continue: true };
      if (!/^gskill-[a-f0-9]{32}$/.test(candidate.value || "")) return;
      return { text: `/${candidate.value} ` };
    },
    async matchEnter(session, line) {
      if (line === "/gallery" || line === "/gallery/")
        return { text: "/gallery/", continue: true };
    }
  };
}

// src/client/resource-basics.jsx
var import_react3 = __toESM(require("react"), 1);
function ResourceBasics({ name, onName, description, onDescription, identifier, onIdentifier, identifierMax = 64, busy = false }) {
  return /* @__PURE__ */ import_react3.default.createElement("div", { className: "gal-skill-fields gal-resource-basics" }, /* @__PURE__ */ import_react3.default.createElement("label", null, "\u540D\u79F0", /* @__PURE__ */ import_react3.default.createElement("input", { "aria-label": "\u540D\u79F0", maxLength: 160, value: name, disabled: busy, placeholder: "\u4E3A\u8D44\u6E90\u8D77\u4E00\u4E2A\u4FBF\u4E8E\u8BC6\u522B\u7684\u540D\u79F0", onChange: (e) => onName(e.target.value) })), /* @__PURE__ */ import_react3.default.createElement("label", null, "\u63CF\u8FF0", /* @__PURE__ */ import_react3.default.createElement("textarea", { "aria-label": "\u63CF\u8FF0", rows: 4, maxLength: 1024, value: description, disabled: busy, placeholder: "\u8BF4\u660E\u5B83\u80FD\u505A\u4EC0\u4E48\uFF0C\u4EE5\u53CA\u4EC0\u4E48\u65F6\u5019\u4F7F\u7528", onChange: (e) => onDescription(e.target.value) })), /* @__PURE__ */ import_react3.default.createElement("p", null, "\u540D\u79F0\u7528\u4E8E\u5C55\u793A\uFF0C\u63CF\u8FF0\u7528\u4E8E\u5E2E\u52A9\u7528\u6237\u548C Agent \u5224\u65AD\u4F55\u65F6\u4F7F\u7528\u3002"), /* @__PURE__ */ import_react3.default.createElement("details", null, /* @__PURE__ */ import_react3.default.createElement("summary", null, "\u9AD8\u7EA7\u8BBE\u7F6E"), /* @__PURE__ */ import_react3.default.createElement("label", null, "\u8C03\u7528\u6807\u8BC6", /* @__PURE__ */ import_react3.default.createElement("input", { "aria-label": "\u8C03\u7528\u6807\u8BC6", maxLength: identifierMax, value: identifier, disabled: busy, onChange: (e) => onIdentifier(e.target.value) })), /* @__PURE__ */ import_react3.default.createElement("p", null, "\u7528\u4E8E\u7CFB\u7EDF\u8C03\u7528\uFF0C\u5DF2\u81EA\u52A8\u751F\u6210\uFF0C\u4E00\u822C\u65E0\u9700\u4FEE\u6539\u3002")));
}

// src/client/resource-cover.jsx
var import_react4 = __toESM(require("react"), 1);
var covers = [
  { id: "writing", label: "\u5199\u4F5C\u4E0E\u6587\u6863", keywords: /写作|周报|文档|总结|摘要|writing|document|summary/, hue: 36, path: "M13 5h20l9 9v29H13z M33 5v10h9 M20 23h15m-15 7h15m-15 7h10" },
  { id: "code", label: "\u5F00\u53D1\u4E0E\u5BA1\u67E5", keywords: /代码|开发|审查|编程|code|review|github|gitlab/, hue: 229, path: "M18 12 6 24l12 12m12-24 12 12-12 12M28 8l-8 32" },
  { id: "data", label: "\u6570\u636E\u4E0E\u5206\u6790", keywords: /数据|分析|表格|数据库|data|analytics|sql|spreadsheet/, hue: 163, path: "M6 6v36h36M12 36V24h7v12m5 0V16h7v20m5 0V9h7v27" },
  { id: "language", label: "\u8BED\u8A00\u4E0E\u7FFB\u8BD1", keywords: /翻译|语言|多语|translation|translate|language/, hue: 284, path: "M5 8h24v19H16l-7 6v-6H5z M24 32h8l7 6v-6h5V17H34M11 17h12m-6-4v9" },
  { id: "search", label: "\u641C\u7D22\u4E0E\u7814\u7A76", keywords: /搜索|检索|研究|调研|search|research|browse/, hue: 195, path: "M34 20a14 14 0 1 1-28 0 14 14 0 1 1 28 0m-4 10 12 12M13 20h14m-7-7v14" },
  { id: "automation", label: "\u8FDE\u63A5\u4E0E\u81EA\u52A8\u5316", keywords: /连接|自动化|集成|接口|automation|connector|integration|api/, hue: 326, path: "M7 7h12v12H7z M29 29h12v12H29z M13 19v10a6 6 0 0 0 6 6h10M35 29V19a6 6 0 0 0-6-6h-4" }
];
var hasResourceCover = (type) => ["skill", "agent", "mcp"].includes(type);
function resolveCover(resource) {
  const selected = resource.cover ?? resource.metadata?.cover;
  const subject = [...resource.tags ?? [], resource.name, resource.description].join(" ").toLowerCase();
  const cover = covers.find((item) => item.id === selected) ?? covers.find((item) => item.keywords.test(subject));
  if (cover) return cover;
  const name = resource.name?.trim() || resource.type;
  let hash = 0;
  for (const character of name) hash = hash * 31 + character.codePointAt(0) >>> 0;
  return { hue: [35, 165, 197, 231, 276, 328][hash % 6], initial: [...name][0].toUpperCase() };
}
function CoverDrawing({ cover }) {
  return /* @__PURE__ */ import_react4.default.createElement("svg", { viewBox: "0 0 48 48", "aria-hidden": "true" }, cover.path ? /* @__PURE__ */ import_react4.default.createElement("path", { d: cover.path, fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }) : /* @__PURE__ */ import_react4.default.createElement("text", { x: "24", y: "25", textAnchor: "middle", dominantBaseline: "central", fill: "currentColor", fontSize: "30", fontWeight: "650" }, cover.initial));
}
function ResourceCover({ resource }) {
  if (!hasResourceCover(resource.type)) return /* @__PURE__ */ import_react4.default.createElement(ResourceVisual, { type: resource.type });
  const cover = resolveCover(resource);
  return /* @__PURE__ */ import_react4.default.createElement("span", { className: "gal-resource-visual gal-purpose-cover", style: { "--cover-hue": cover.hue }, "aria-hidden": "true" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "gal-visual-type" }, /* @__PURE__ */ import_react4.default.createElement(Glyph, { name: resource.type, size: 14 }), { skill: "Skill", agent: "Agent", mcp: "MCP" }[resource.type]), /* @__PURE__ */ import_react4.default.createElement("span", { className: "gal-purpose-drawing" }, /* @__PURE__ */ import_react4.default.createElement(CoverDrawing, { cover })));
}
function ResourceCoverPicker({ resource, onChange }) {
  const value = covers.some(({ id }) => id === resource.cover) ? resource.cover : "";
  return /* @__PURE__ */ import_react4.default.createElement("div", { className: "gal-cover-picker" }, /* @__PURE__ */ import_react4.default.createElement("label", null, "\u5C01\u9762", /* @__PURE__ */ import_react4.default.createElement("select", { value, onChange: (event) => onChange(event.target.value) }, /* @__PURE__ */ import_react4.default.createElement("option", { value: "" }, "\u6309\u7528\u9014\u81EA\u52A8\u9009\u62E9"), covers.map(({ id, label }) => /* @__PURE__ */ import_react4.default.createElement("option", { key: id, value: id }, label)))), /* @__PURE__ */ import_react4.default.createElement(ResourceCover, { resource }));
}
function withResourceCover(metadata, cover) {
  const { cover: previous, ...rest } = metadata ?? {};
  return cover ? { ...rest, cover } : rest;
}

// src/client/mcp-wizard.jsx
var import_react6 = __toESM(require("react"), 1);

// src/client/modal.jsx
var import_react5 = __toESM(require("react"), 1);
function Modal({ children, onClose, confirmation = false }) {
  const root = (0, import_react5.useRef)(null);
  const close = (0, import_react5.useRef)(onClose);
  close.current = onClose;
  (0, import_react5.useEffect)(() => {
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
    const initial2 = dialog.querySelector(
      '[autofocus], input:not([type="file"]):not(:disabled)'
    ) || focusable()[0] || dialog;
    initial2.focus();
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
  return /* @__PURE__ */ import_react5.default.createElement(
    "div",
    {
      ref: root,
      "data-gallery-modal": true,
      className: confirmation ? "gal-overlay gal-confirm-overlay" : "gal-overlay"
    },
    children
  );
}

// src/client/mcp-wizard.jsx
var steps = ["\u57FA\u672C\u4FE1\u606F", "\u8FDE\u63A5\u914D\u7F6E\u4E0E\u6D4B\u8BD5", "\u68C0\u67E5\u4FDD\u5B58"];
var parseLines = (value) => value.split("\n").map((x) => x.trim()).filter(Boolean);
var parseRefs = (value) => Object.fromEntries(
  parseLines(value).map((line) => {
    const index = line.indexOf("=");
    if (index < 1) throw Error("\u73AF\u5883\u53D8\u91CF\u6620\u5C04\u6BCF\u884C\u586B\u5199 KEY=\u73AF\u5883\u53D8\u91CF\u540D");
    return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
  })
);
function McpWizard({ resource, onClose, onSave, onCheck }) {
  const [cover, setCover] = (0, import_react6.useState)(resource?.metadata?.cover ?? "");
  const saved = resource?.metadata?.mcp || {};
  const [step, setStep] = (0, import_react6.useState)(0), [name, setName] = (0, import_react6.useState)(resource?.name || ""), [description, setDescription] = (0, import_react6.useState)(resource?.description || ""), [serverName, setServerName] = (0, import_react6.useState)(saved.serverName || `mcp-${crypto.randomUUID().slice(0, 8)}`), [transport, setTransport] = (0, import_react6.useState)(saved.transport || "stdio"), [command, setCommand] = (0, import_react6.useState)(saved.command || ""), [args, setArgs] = (0, import_react6.useState)((saved.args || []).join("\n")), [cwd, setCwd] = (0, import_react6.useState)(saved.cwd || ""), [url, setUrl] = (0, import_react6.useState)(saved.url || ""), [envRefs, setEnvRefs] = (0, import_react6.useState)(
    Object.entries(saved.envRefs || {}).map(([a, b]) => `${a}=${b}`).join("\n")
  ), [tags, setTags] = (0, import_react6.useState)((resource?.tags || []).join(", ")), [testResult, setTestResult] = (0, import_react6.useState)(
    resource?.metadata?.mcpVerification ?? null
  ), [error, setError] = (0, import_react6.useState)(""), [busy, setBusy] = (0, import_react6.useState)(false);
  const heading = (0, import_react6.useRef)(null);
  (0, import_react6.useEffect)(() => {
    heading.current?.focus();
  }, [step]);
  const validName = !!name.trim() && name.length <= 160 && !!description.trim();
  const validServer = /^[A-Za-z0-9_-]{1,32}$/.test(serverName);
  const validConnection = validServer && (transport === "stdio" ? !!command.trim() : /^https?:\/\/[^\s/]+/.test(url));
  function config() {
    return {
      serverName,
      transport,
      ...transport === "stdio" ? { command, args: parseLines(args), cwd, envRefs: parseRefs(envRefs) } : { url, envRefs: parseRefs(envRefs) }
    };
  }
  function change(setter) {
    return (e) => {
      setter(e.target.value);
      setTestResult(null);
    };
  }
  const parsedTags = [
    ...new Set(
      tags.split(/[,，]/).map((x) => x.trim()).filter(Boolean)
    )
  ];
  async function check() {
    setBusy(true);
    setError("");
    try {
      const result = await onCheck(config());
      setTestResult({ ...result, checkedAt: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (e) {
      setTestResult(null);
      setError(e?.rpcError?.message || e.message || String(e));
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const data = config();
      await onSave({
        type: "mcp",
        name: name.trim(),
        description: description.trim(),
        tags: parsedTags,
        metadata: {
          ...withResourceCover(resource?.metadata, cover),
          mcp: data,
          mcpVerification: testResult ? { checkedAt: testResult.checkedAt } : null
        },
        references: resource?.references || [],
        files: [
          {
            path: "mcp.json",
            encoding: "utf8",
            content: JSON.stringify(data, null, 2) + "\n"
          }
        ]
      });
    } catch (e) {
      setError(e?.rpcError?.message || e.message || String(e));
      setBusy(false);
    }
  }
  return /* @__PURE__ */ import_react6.default.createElement(Modal, { onClose: () => !busy && onClose() }, /* @__PURE__ */ import_react6.default.createElement(
    "section",
    {
      className: "gal-dialog gal-skill-wizard",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": resource ? "\u7F16\u8F91 MCP" : "\u65B0\u5EFA MCP",
      tabIndex: -1
    },
    /* @__PURE__ */ import_react6.default.createElement("header", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react6.default.createElement("h2", null, /* @__PURE__ */ import_react6.default.createElement(Glyph, { name: "mcp" }), " ", resource ? "\u7F16\u8F91 MCP" : "\u65B0\u5EFA MCP"), /* @__PURE__ */ import_react6.default.createElement("button", { "aria-label": "\u5173\u95ED\u7F16\u8F91", disabled: busy, onClick: onClose }, /* @__PURE__ */ import_react6.default.createElement(Glyph, { name: "close" }))),
    /* @__PURE__ */ import_react6.default.createElement("nav", { className: "gal-skill-steps gal-three-steps", "aria-label": "\u521B\u5EFA\u8FDB\u5EA6" }, steps.map((title, i) => /* @__PURE__ */ import_react6.default.createElement(
      "button",
      {
        key: title,
        "aria-current": step === i ? "step" : void 0,
        disabled: busy || i > 0 && !validName || i > 1 && !validConnection,
        onClick: () => setStep(i)
      },
      /* @__PURE__ */ import_react6.default.createElement("span", null, i < step ? "\u2713" : i + 1),
      title
    ))),
    /* @__PURE__ */ import_react6.default.createElement("div", { className: "gal-dialog-body gal-skill-layout" }, /* @__PURE__ */ import_react6.default.createElement("main", null, /* @__PURE__ */ import_react6.default.createElement("h3", { ref: heading, tabIndex: -1 }, steps[step]), step === 0 && /* @__PURE__ */ import_react6.default.createElement(ResourceBasics, { name, onName: setName, description, onDescription: setDescription, identifier: serverName, onIdentifier: (value) => {
      setServerName(value);
      setTestResult(null);
    }, identifierMax: 32, busy }), step === 1 && /* @__PURE__ */ import_react6.default.createElement("div", { className: "gal-skill-fields" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "gal-mcp-transport" }, /* @__PURE__ */ import_react6.default.createElement(
      "button",
      {
        "aria-pressed": transport === "stdio",
        onClick: () => {
          setTransport("stdio");
          setTestResult(null);
        }
      },
      /* @__PURE__ */ import_react6.default.createElement(Glyph, { name: "settings" }),
      " \u672C\u5730\u8FDB\u7A0B"
    ), /* @__PURE__ */ import_react6.default.createElement(
      "button",
      {
        "aria-pressed": transport === "streamable-http",
        onClick: () => {
          setTransport("streamable-http");
          setTestResult(null);
        }
      },
      /* @__PURE__ */ import_react6.default.createElement(Glyph, { name: "link" }),
      " \u8FDC\u7A0B HTTP"
    )), transport === "stdio" ? /* @__PURE__ */ import_react6.default.createElement(import_react6.default.Fragment, null, /* @__PURE__ */ import_react6.default.createElement("label", null, "\u542F\u52A8\u547D\u4EE4", /* @__PURE__ */ import_react6.default.createElement(
      "input",
      {
        "aria-label": "\u542F\u52A8\u547D\u4EE4",
        value: command,
        onChange: change(setCommand),
        placeholder: "npx"
      }
    )), /* @__PURE__ */ import_react6.default.createElement("label", null, "\u53C2\u6570\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF09", /* @__PURE__ */ import_react6.default.createElement(
      "textarea",
      {
        "aria-label": "\u542F\u52A8\u53C2\u6570",
        rows: 4,
        value: args,
        onChange: change(setArgs),
        placeholder: "-y\\n@modelcontextprotocol/server-filesystem"
      }
    )), /* @__PURE__ */ import_react6.default.createElement("label", null, "\u5DE5\u4F5C\u76EE\u5F55\uFF08\u9009\u586B\uFF09", /* @__PURE__ */ import_react6.default.createElement(
      "input",
      {
        "aria-label": "\u5DE5\u4F5C\u76EE\u5F55",
        value: cwd,
        onChange: change(setCwd),
        placeholder: "\u7559\u7A7A\u4F7F\u7528 DSH \u9ED8\u8BA4\u76EE\u5F55"
      }
    ))) : /* @__PURE__ */ import_react6.default.createElement("label", null, "Streamable HTTP \u5730\u5740", /* @__PURE__ */ import_react6.default.createElement(
      "input",
      {
        "aria-label": "MCP \u5730\u5740",
        type: "url",
        value: url,
        onChange: change(setUrl),
        placeholder: "https://example.com/mcp"
      }
    )), /* @__PURE__ */ import_react6.default.createElement("label", null, transport === "stdio" ? "\u73AF\u5883\u53D8\u91CF\u6620\u5C04" : "\u8BF7\u6C42\u5934\u6620\u5C04", "\uFF08\u9009\u586B\uFF09", /* @__PURE__ */ import_react6.default.createElement(
      "textarea",
      {
        "aria-label": "\u73AF\u5883\u53D8\u91CF\u6620\u5C04",
        rows: 3,
        value: envRefs,
        onChange: change(setEnvRefs),
        placeholder: transport === "stdio" ? "API_KEY=MY_API_KEY" : "Authorization=MCP_AUTH_HEADER"
      }
    )), /* @__PURE__ */ import_react6.default.createElement("p", null, "\u6BCF\u884C\u586B\u5199\u300C\u670D\u52A1\u5B57\u6BB5=DSH \u73AF\u5883\u53D8\u91CF\u540D\u300D\u3002\u8D44\u6E90\u4E2D\u53EA\u4FDD\u5B58\u53D8\u91CF\u540D\uFF0C\u4E0D\u4FDD\u5B58\u5BC6\u94A5\u3002"), /* @__PURE__ */ import_react6.default.createElement("p", null, "\u8FDE\u63A5\u6D4B\u8BD5\u4F1A\u5C1D\u8BD5\u542F\u52A8\u6216\u8BBF\u95EE\u8BE5\u670D\u52A1\uFF0C\u5E76\u8BFB\u53D6\u5B83\u63D0\u4F9B\u7684\u5DE5\u5177\u3002\u5B8C\u6210\u540E\u4F1A\u65AD\u5F00\u6D4B\u8BD5\u8FDE\u63A5\u3002"), /* @__PURE__ */ import_react6.default.createElement("button", { className: "gal-primary", disabled: busy || !validConnection, onClick: check }, /* @__PURE__ */ import_react6.default.createElement(Glyph, { name: "refresh" }), busy ? "\u68C0\u67E5\u4E2D\u2026" : "\u68C0\u67E5\u8FDE\u63A5"), testResult && /* @__PURE__ */ import_react6.default.createElement("div", { className: "gal-mcp-result", role: "status" }, /* @__PURE__ */ import_react6.default.createElement("strong", null, "\u2713 \u8FDE\u63A5\u6210\u529F", testResult.tools && ` \xB7 ${testResult.tools.length} \u4E2A\u5DE5\u5177`), testResult.tools?.map((tool) => /* @__PURE__ */ import_react6.default.createElement("p", { key: tool.name }, /* @__PURE__ */ import_react6.default.createElement(Glyph, { name: "mcp", size: 15 }), /* @__PURE__ */ import_react6.default.createElement("b", null, tool.name), tool.description && /* @__PURE__ */ import_react6.default.createElement("span", null, tool.description)))), /* @__PURE__ */ import_react6.default.createElement("p", null, "\u4E5F\u53EF\u4EE5\u8DF3\u8FC7\u68C0\u67E5\uFF0C\u4FDD\u5B58\u4E3A\u5F85\u9A8C\u8BC1\u914D\u7F6E\u3002")), step === 2 && /* @__PURE__ */ import_react6.default.createElement("div", { className: "gal-skill-fields" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "gal-skill-summary" }, /* @__PURE__ */ import_react6.default.createElement(Glyph, { name: "mcp", size: 36 }), /* @__PURE__ */ import_react6.default.createElement("h2", null, name), /* @__PURE__ */ import_react6.default.createElement("p", null, description), /* @__PURE__ */ import_react6.default.createElement("span", null, serverName, " \xB7", " ", transport === "stdio" ? "\u672C\u5730\u8FDB\u7A0B" : "\u8FDC\u7A0B HTTP")), /* @__PURE__ */ import_react6.default.createElement(
      ResourceCoverPicker,
      {
        resource: {
          type: "mcp",
          name,
          description,
          tags: tags.split(/[,，]/),
          cover
        },
        onChange: setCover
      }
    ), /* @__PURE__ */ import_react6.default.createElement("label", null, "\u6807\u7B7E\uFF08\u9009\u586B\uFF09", /* @__PURE__ */ import_react6.default.createElement(
      "input",
      {
        "aria-label": "\u6807\u7B7E",
        value: tags,
        onChange: (e) => setTags(e.target.value),
        placeholder: "\u4F8B\u5982\uFF1A\u6587\u4EF6\uFF0C\u641C\u7D22"
      }
    )), /* @__PURE__ */ import_react6.default.createElement("p", null, testResult ? "\u2713 \u5DF2\u901A\u8FC7\u8FDE\u63A5\u6D4B\u8BD5" : "\u672A\u9A8C\u8BC1 \xB7 \u4FDD\u5B58\u540E\u53EF\u91CD\u65B0\u68C0\u67E5\u8FDE\u63A5"), /* @__PURE__ */ import_react6.default.createElement("details", null, /* @__PURE__ */ import_react6.default.createElement("summary", null, "\u67E5\u770B mcp.json"), /* @__PURE__ */ import_react6.default.createElement("pre", { className: "gal-skill-preview" }, (() => {
      try {
        return JSON.stringify(config(), null, 2);
      } catch {
        return "\u8BF7\u68C0\u67E5\u73AF\u5883\u53D8\u91CF\u6620\u5C04\u683C\u5F0F";
      }
    })()))), error && /* @__PURE__ */ import_react6.default.createElement("p", { role: "alert", className: "gal-error" }, error)), /* @__PURE__ */ import_react6.default.createElement("details", { open: true, className: "gal-skill-tree" }, /* @__PURE__ */ import_react6.default.createElement("summary", null, "\u6587\u4EF6\u7ED3\u6784"), /* @__PURE__ */ import_react6.default.createElement("strong", null, /* @__PURE__ */ import_react6.default.createElement(Glyph, { name: "folder" }), " ", serverName || "my-mcp", "/"), /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement(Glyph, { name: "file" }), " mcp.json"))),
    /* @__PURE__ */ import_react6.default.createElement("footer", { className: "gal-skill-footer" }, /* @__PURE__ */ import_react6.default.createElement(
      "button",
      {
        disabled: busy,
        onClick: step ? () => setStep(step - 1) : onClose
      },
      step ? "\u4E0A\u4E00\u6B65" : "\u53D6\u6D88"
    ), step < 2 ? /* @__PURE__ */ import_react6.default.createElement(
      "button",
      {
        className: "gal-primary",
        disabled: busy || step === 0 && !validName || step === 1 && !validConnection,
        onClick: () => setStep(step + 1)
      },
      "\u4E0B\u4E00\u6B65 ",
      /* @__PURE__ */ import_react6.default.createElement(Glyph, { name: "arrow" })
    ) : /* @__PURE__ */ import_react6.default.createElement(
      "button",
      {
        className: "gal-primary",
        disabled: busy || parsedTags.length > 20 || parsedTags.some((x) => x.length > 40),
        onClick: save
      },
      busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58 MCP"
    ))
  ));
}

// src/client/workflow-wizard.jsx
var import_react7 = __toESM(require("react"), 1);

// src/workflow-template.mjs
function demand(ok, status, code, message) {
  if (!ok) throw Object.assign(new Error(message), { status, code });
}
var object = (v, label) => {
  demand(v && typeof v === "object" && !Array.isArray(v), 400, "INVALID_WORKFLOW", `${label} \u683C\u5F0F\u65E0\u6548`);
  return v;
};
var text = (v, label, max, required = false) => {
  demand(typeof v === "string" && v.length <= max && (!required || v.trim()), 400, "INVALID_WORKFLOW", `${label} \u4E0D\u80FD\u4E3A\u7A7A\u6216\u8D85\u8FC7 ${max} \u5B57\u7B26`);
  return v.trim();
};
var array = (v, label, max) => {
  demand(Array.isArray(v) && v.length <= max, 400, "INVALID_WORKFLOW", `${label} \u683C\u5F0F\u65E0\u6548\u6216\u8FC7\u957F`);
  return v;
};
function validateWorkflowTemplate(input) {
  const v = object(input, "\u6A21\u677F");
  const members = array(v.members, "\u6210\u5458", 32).map((raw) => {
    const m = object(raw, "\u6210\u5458");
    return { name: text(m.name, "\u6210\u5458\u540D\u79F0", 80, true), summary: text(m.summary, "\u7B80\u4ECB", 16e3), role: text(m.role, "\u89D2\u8272", 16e3), executionPrompt: text(m.executionPrompt, "\u6267\u884C\u6307\u4EE4", 16e3) };
  });
  demand(members.every((m) => /^[\p{L}\p{N}_-]+$/u.test(m.name) && m.name.toLowerCase() !== "captain") && new Set(members.map((m) => m.name.toLowerCase())).size === members.length, 400, "INVALID_WORKFLOW", "\u6210\u5458\u540D\u79F0\u91CD\u590D\u6216\u65E0\u6548");
  const tasks = array(v.tasks, "\u8282\u70B9", 32).map((raw) => {
    const t = object(raw, "\u8282\u70B9"), g = object(t.general, "\u4EFB\u52A1\u8981\u6C42");
    const id = text(t.id, "\u8282\u70B9 ID", 80, true);
    demand(/^[a-zA-Z0-9_-]+$/.test(id) && typeof t.checkpoint === "boolean", 400, "INVALID_WORKFLOW", "\u8282\u70B9 ID \u6216\u7C7B\u578B\u65E0\u6548");
    demand(!/^t\d+$/.test(id) || Number.isSafeInteger(Number(id.slice(1))) && Number(id.slice(1)) < Number.MAX_SAFE_INTEGER, 400, "INVALID_WORKFLOW", "\u8282\u70B9\u5E8F\u53F7\u8D85\u51FA\u8303\u56F4");
    return { id, subject: text(t.subject, "\u8282\u70B9\u540D\u79F0", 200, true), assignee: text(t.assignee, "\u8D1F\u8D23\u4EBA", 80), dependencies: array(t.dependencies, "\u4F9D\u8D56", 32).map((d) => text(d, "\u4F9D\u8D56 ID", 80, true)), checkpoint: t.checkpoint, general: { requirements: text(g.requirements, "\u4EFB\u52A1\u8981\u6C42", 16e3), deliverables: text(g.deliverables, "\u4EA4\u4ED8\u7269", 16e3), acceptance: text(g.acceptance, "\u9A8C\u6536\u6807\u51C6", 16e3) } };
  });
  demand(tasks.length > 0 && new Set(tasks.map((t) => t.id)).size === tasks.length, 400, "INVALID_WORKFLOW", "\u9700\u8981 1\u201332 \u4E2A\u4E0D\u540C\u7684\u8282\u70B9");
  const ids = new Set(tasks.map((t) => t.id)), names2 = new Set(members.map((m) => m.name));
  for (const t of tasks) {
    demand(!(t.checkpoint && t.assignee) && (!t.assignee || t.assignee === "captain" || names2.has(t.assignee)), 400, "INVALID_WORKFLOW", "\u8282\u70B9\u8D1F\u8D23\u4EBA\u4E0D\u5B58\u5728\u6216\u4EBA\u5DE5\u8282\u70B9\u5206\u914D\u4E86\u8D1F\u8D23\u4EBA");
    demand(t.dependencies.every((id) => ids.has(id)) && new Set(t.dependencies).size === t.dependencies.length, 400, "INVALID_WORKFLOW", "\u8282\u70B9\u4F9D\u8D56\u7F3A\u5931\u6216\u91CD\u590D");
  }
  const done = /* @__PURE__ */ new Set(), visiting = /* @__PURE__ */ new Set();
  function visit3(id) {
    demand(!visiting.has(id), 400, "INVALID_WORKFLOW", "\u8282\u70B9\u4F9D\u8D56\u4EA7\u751F\u5FAA\u73AF");
    if (done.has(id)) return;
    visiting.add(id);
    tasks.find((t) => t.id === id).dependencies.forEach(visit3);
    visiting.delete(id);
    done.add(id);
  }
  tasks.forEach((t) => visit3(t.id));
  const positions = {};
  for (const [key, raw] of Object.entries(object(v.positions ?? {}, "\u753B\u5E03\u4F4D\u7F6E"))) {
    const p = object(raw, "\u4F4D\u7F6E");
    demand(key.startsWith("task:") && ids.has(key.slice(5)) && ["x", "y"].every((k) => typeof p[k] === "number" && Number.isFinite(p[k]) && p[k] >= 0 && p[k] <= 1e4), 400, "INVALID_WORKFLOW", "\u753B\u5E03\u4F4D\u7F6E\u65E0\u6548");
    positions[key] = { x: p.x, y: p.y };
  }
  return { name: text(v.name, "\u540D\u79F0", 120, true), description: text(v.description, "\u63CF\u8FF0", 2e3), inputs: text(v.inputs, "\u8F93\u5165", 4e3), tags: [...new Set(array(v.tags, "\u6807\u7B7E", 12).map((t) => text(t, "\u6807\u7B7E", 40, true)))], members, tasks, positions };
}

// src/client/workflow-wizard.jsx
var steps2 = ["\u57FA\u672C\u4FE1\u606F", "\u56E2\u961F\u6210\u5458", "\u4EFB\u52A1\u8282\u70B9", "\u68C0\u67E5\u4FDD\u5B58"];
var member = () => ({ name: "", summary: "", role: "", executionPrompt: "" });
var task = (n) => ({ id: `t${n}`, subject: "", assignee: "", dependencies: [], checkpoint: false, general: { requirements: "", deliverables: "", acceptance: "" } });
function initial(resource) {
  try {
    return JSON.parse(resource.files.find((f) => f.path === "workflow.json").content);
  } catch {
    return { name: resource?.name || "", description: resource?.description || "", tags: resource?.tags || [], inputs: "", members: [], tasks: [], positions: {} };
  }
}
function WorkflowWizard({ resource, onClose, onSave }) {
  const [draft, setDraft] = (0, import_react7.useState)(() => initial(resource));
  const [step, setStep] = (0, import_react7.useState)(0), [error, setError] = (0, import_react7.useState)(""), [busy, setBusy] = (0, import_react7.useState)(false);
  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const changeMember = (i, key, value) => update({ members: draft.members.map((m, index) => index === i ? { ...m, [key]: value } : m) });
  const changeTask = (i, patch) => update({ tasks: draft.tasks.map((t, index) => index === i ? { ...t, ...patch } : t) });
  let issue = "";
  try {
    validateWorkflowTemplate(draft);
  } catch (e) {
    issue = e.message;
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const value = validateWorkflowTemplate(draft);
      if (value.tasks.some((t) => !t.general.requirements)) throw Error("\u6BCF\u4E2A\u4EFB\u52A1\u8282\u70B9\u90FD\u9700\u8981\u586B\u5199\u901A\u7528\u4EFB\u52A1\u8981\u6C42");
      await onSave({ type: "workflow", name: value.name, description: value.description, tags: value.tags, files: [{ path: "workflow.json", encoding: "utf8", content: JSON.stringify(value, null, 2) + "\n" }], metadata: { ...resource?.metadata || {}, format: "dsh-teamflow-template-v1" }, references: resource?.references || [] });
    } catch (e) {
      setError(e?.rpcError?.message || e.message || String(e));
      setBusy(false);
    }
  }
  return /* @__PURE__ */ import_react7.default.createElement(Modal, { onClose: () => !busy && onClose() }, /* @__PURE__ */ import_react7.default.createElement("section", { className: "gal-dialog gal-skill-wizard", role: "dialog", "aria-modal": "true", "aria-label": resource ? "\u7F16\u8F91 Workflow" : "\u65B0\u5EFA Workflow" }, /* @__PURE__ */ import_react7.default.createElement("header", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react7.default.createElement("h2", null, /* @__PURE__ */ import_react7.default.createElement(Glyph, { name: "workflow" }), " ", resource ? "\u7F16\u8F91" : "\u65B0\u5EFA", " Workflow"), /* @__PURE__ */ import_react7.default.createElement("button", { "aria-label": "\u5173\u95ED\u7F16\u8F91", disabled: busy, onClick: onClose }, /* @__PURE__ */ import_react7.default.createElement(Glyph, { name: "close" }))), /* @__PURE__ */ import_react7.default.createElement("nav", { className: "gal-skill-steps", "aria-label": "\u521B\u5EFA\u8FDB\u5EA6" }, steps2.map((label, i) => /* @__PURE__ */ import_react7.default.createElement("button", { key: label, "aria-current": step === i ? "step" : void 0, disabled: busy, onClick: () => setStep(i) }, /* @__PURE__ */ import_react7.default.createElement("span", null, i < step ? "\u2713" : i + 1), label))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "gal-dialog-body gal-skill-layout" }, /* @__PURE__ */ import_react7.default.createElement("main", null, /* @__PURE__ */ import_react7.default.createElement("h3", null, steps2[step]), step === 0 && /* @__PURE__ */ import_react7.default.createElement("div", { className: "gal-skill-fields" }, /* @__PURE__ */ import_react7.default.createElement("label", null, "\u540D\u79F0", /* @__PURE__ */ import_react7.default.createElement("input", { "aria-label": "\u540D\u79F0", value: draft.name, onChange: (e) => update({ name: e.target.value }) })), /* @__PURE__ */ import_react7.default.createElement("label", null, "\u63CF\u8FF0", /* @__PURE__ */ import_react7.default.createElement("textarea", { "aria-label": "\u63CF\u8FF0", value: draft.description, onChange: (e) => update({ description: e.target.value }) })), /* @__PURE__ */ import_react7.default.createElement("label", null, "\u9002\u7528\u8F93\u5165", /* @__PURE__ */ import_react7.default.createElement("textarea", { "aria-label": "\u9002\u7528\u8F93\u5165", value: draft.inputs, onChange: (e) => update({ inputs: e.target.value }) })), /* @__PURE__ */ import_react7.default.createElement("label", null, "\u6807\u7B7E", /* @__PURE__ */ import_react7.default.createElement("input", { "aria-label": "\u6807\u7B7E", value: draft.tags.join(", "), onChange: (e) => update({ tags: e.target.value.split(/[,，]/).map((x) => x.trim()).filter(Boolean) }) }))), step === 1 && /* @__PURE__ */ import_react7.default.createElement("div", { className: "gal-skill-fields" }, /* @__PURE__ */ import_react7.default.createElement("p", null, "\u6210\u5458\u540D\u79F0\u7528\u4E8E\u6307\u5B9A\u4EFB\u52A1\u8D1F\u8D23\u4EBA\uFF1B\u961F\u957F\u4F7F\u7528 captain\u3002"), draft.members.map((m, i) => /* @__PURE__ */ import_react7.default.createElement("div", { className: "gal-workflow-card", key: i }, /* @__PURE__ */ import_react7.default.createElement("button", { onClick: () => update({ members: draft.members.filter((_, n) => n !== i) }) }, "\u5220\u9664\u6210\u5458"), [["name", "\u540D\u79F0"], ["summary", "\u7B80\u4ECB"], ["role", "\u89D2\u8272"], ["executionPrompt", "\u6267\u884C\u6307\u4EE4"]].map(([key, label]) => /* @__PURE__ */ import_react7.default.createElement("label", { key }, label, /* @__PURE__ */ import_react7.default.createElement("input", { "aria-label": `\u6210\u5458${i + 1}${label}`, value: m[key], onChange: (e) => changeMember(i, key, e.target.value) }))))), /* @__PURE__ */ import_react7.default.createElement("button", { onClick: () => update({ members: [...draft.members, member()] }) }, "\u6DFB\u52A0\u6210\u5458")), step === 2 && /* @__PURE__ */ import_react7.default.createElement("div", { className: "gal-skill-fields" }, draft.tasks.map((t, i) => /* @__PURE__ */ import_react7.default.createElement("div", { className: "gal-workflow-card", key: i }, /* @__PURE__ */ import_react7.default.createElement("button", { onClick: () => update({ tasks: draft.tasks.filter((_, n) => n !== i) }) }, "\u5220\u9664\u8282\u70B9"), /* @__PURE__ */ import_react7.default.createElement("label", null, "\u8282\u70B9 ID", /* @__PURE__ */ import_react7.default.createElement("input", { "aria-label": `\u8282\u70B9${i + 1} ID`, value: t.id, onChange: (e) => changeTask(i, { id: e.target.value }) })), /* @__PURE__ */ import_react7.default.createElement("label", null, "\u540D\u79F0", /* @__PURE__ */ import_react7.default.createElement("input", { "aria-label": `\u8282\u70B9${i + 1}\u540D\u79F0`, value: t.subject, onChange: (e) => changeTask(i, { subject: e.target.value }) })), /* @__PURE__ */ import_react7.default.createElement("label", null, /* @__PURE__ */ import_react7.default.createElement("input", { type: "checkbox", checked: t.checkpoint, onChange: (e) => changeTask(i, { checkpoint: e.target.checked, assignee: e.target.checked ? "" : t.assignee }) }), "\u4EBA\u5DE5\u9A8C\u6536\u70B9"), !t.checkpoint && /* @__PURE__ */ import_react7.default.createElement("label", null, "\u8D1F\u8D23\u4EBA", /* @__PURE__ */ import_react7.default.createElement("select", { "aria-label": `\u8282\u70B9${i + 1}\u8D1F\u8D23\u4EBA`, value: t.assignee, onChange: (e) => changeTask(i, { assignee: e.target.value }) }, /* @__PURE__ */ import_react7.default.createElement("option", { value: "" }, "\u672A\u6307\u5B9A"), /* @__PURE__ */ import_react7.default.createElement("option", { value: "captain" }, "\u961F\u957F"), draft.members.map((m) => /* @__PURE__ */ import_react7.default.createElement("option", { key: m.name, value: m.name }, m.name)))), /* @__PURE__ */ import_react7.default.createElement("label", null, "\u4F9D\u8D56\u8282\u70B9", /* @__PURE__ */ import_react7.default.createElement("select", { "aria-label": `\u8282\u70B9${i + 1}\u4F9D\u8D56`, multiple: true, value: t.dependencies, onChange: (e) => changeTask(i, { dependencies: [...e.target.selectedOptions].map((o) => o.value) }) }, draft.tasks.filter((x) => x.id !== t.id).map((x) => /* @__PURE__ */ import_react7.default.createElement("option", { key: x.id, value: x.id }, x.subject || x.id)))), [["requirements", "\u901A\u7528\u4EFB\u52A1\u8981\u6C42"], ["deliverables", "\u4EA4\u4ED8\u7269"], ["acceptance", "\u9A8C\u6536\u6807\u51C6"]].map(([key, label]) => /* @__PURE__ */ import_react7.default.createElement("label", { key }, label, /* @__PURE__ */ import_react7.default.createElement("textarea", { "aria-label": `\u8282\u70B9${i + 1}${label}`, value: t.general[key], onChange: (e) => changeTask(i, { general: { ...t.general, [key]: e.target.value } }) }))))), /* @__PURE__ */ import_react7.default.createElement("button", { onClick: () => update({ tasks: [...draft.tasks, task(Math.max(0, ...draft.tasks.map((t) => Number(/^t(\d+)$/.exec(t.id)?.[1]) || 0)) + 1)] }) }, "\u6DFB\u52A0\u8282\u70B9")), step === 3 && /* @__PURE__ */ import_react7.default.createElement("div", { className: "gal-skill-fields" }, /* @__PURE__ */ import_react7.default.createElement("p", null, draft.members.length, " \u4F4D\u6210\u5458 \xB7 ", draft.tasks.length, " \u4E2A\u8282\u70B9 \xB7 ", draft.tasks.filter((t) => t.checkpoint).length, " \u4E2A\u9A8C\u6536\u70B9"), draft.tasks.map((t) => /* @__PURE__ */ import_react7.default.createElement("p", { key: t.id }, t.subject || t.id, " \u2190 ", t.dependencies.join("\u3001") || "\u8D77\u70B9")), /* @__PURE__ */ import_react7.default.createElement("p", null, "\u4FDD\u5B58\u5230 Gallery \u540E\uFF0C\u53EF\u4EE5\u4ECE\u8D44\u6E90\u8BE6\u60C5\u5B89\u88C5\u5230 TeamFlow \u6A21\u677F\u5E93\u3002"), issue && /* @__PURE__ */ import_react7.default.createElement("p", { role: "alert", className: "gal-error" }, issue)), error && /* @__PURE__ */ import_react7.default.createElement("p", { role: "alert", className: "gal-error" }, error))), /* @__PURE__ */ import_react7.default.createElement("footer", { className: "gal-dialog-footer" }, /* @__PURE__ */ import_react7.default.createElement("button", { disabled: busy, onClick: () => step ? setStep(step - 1) : onClose() }, step ? "\u4E0A\u4E00\u6B65" : "\u53D6\u6D88"), step < 3 ? /* @__PURE__ */ import_react7.default.createElement("button", { className: "gal-primary", disabled: busy, onClick: () => setStep(step + 1) }, "\u4E0B\u4E00\u6B65") : /* @__PURE__ */ import_react7.default.createElement("button", { className: "gal-primary", disabled: busy || !!issue || draft.tasks.some((t) => !t.general.requirements.trim()), onClick: save }, "\u4FDD\u5B58 Workflow"))));
}

// src/client/agent-wizard.jsx
var import_react8 = __toESM(require("react"), 1);

// node_modules/yaml/browser/dist/nodes/identity.js
var ALIAS = Symbol.for("yaml.alias");
var DOC = Symbol.for("yaml.document");
var MAP = Symbol.for("yaml.map");
var PAIR = Symbol.for("yaml.pair");
var SCALAR = Symbol.for("yaml.scalar");
var SEQ = Symbol.for("yaml.seq");
var NODE_TYPE = Symbol.for("yaml.node.type");
var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
function isCollection(node) {
  if (node && typeof node === "object")
    switch (node[NODE_TYPE]) {
      case MAP:
      case SEQ:
        return true;
    }
  return false;
}
function isNode(node) {
  if (node && typeof node === "object")
    switch (node[NODE_TYPE]) {
      case ALIAS:
      case MAP:
      case SCALAR:
      case SEQ:
        return true;
    }
  return false;
}
var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;

// node_modules/yaml/browser/dist/visit.js
var BREAK = Symbol("break visit");
var SKIP = Symbol("skip children");
var REMOVE = Symbol("remove node");
function visit(node, visitor) {
  const visitor_ = initVisitor(visitor);
  if (isDocument(node)) {
    const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
    if (cd === REMOVE)
      node.contents = null;
  } else
    visit_(null, node, visitor_, Object.freeze([]));
}
visit.BREAK = BREAK;
visit.SKIP = SKIP;
visit.REMOVE = REMOVE;
function visit_(key, node, visitor, path) {
  const ctrl = callVisitor(key, node, visitor, path);
  if (isNode(ctrl) || isPair(ctrl)) {
    replaceNode(key, path, ctrl);
    return visit_(key, ctrl, visitor, path);
  }
  if (typeof ctrl !== "symbol") {
    if (isCollection(node)) {
      path = Object.freeze(path.concat(node));
      for (let i = 0; i < node.items.length; ++i) {
        const ci = visit_(i, node.items[i], visitor, path);
        if (typeof ci === "number")
          i = ci - 1;
        else if (ci === BREAK)
          return BREAK;
        else if (ci === REMOVE) {
          node.items.splice(i, 1);
          i -= 1;
        }
      }
    } else if (isPair(node)) {
      path = Object.freeze(path.concat(node));
      const ck = visit_("key", node.key, visitor, path);
      if (ck === BREAK)
        return BREAK;
      else if (ck === REMOVE)
        node.key = null;
      const cv = visit_("value", node.value, visitor, path);
      if (cv === BREAK)
        return BREAK;
      else if (cv === REMOVE)
        node.value = null;
    }
  }
  return ctrl;
}
async function visitAsync(node, visitor) {
  const visitor_ = initVisitor(visitor);
  if (isDocument(node)) {
    const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
    if (cd === REMOVE)
      node.contents = null;
  } else
    await visitAsync_(null, node, visitor_, Object.freeze([]));
}
visitAsync.BREAK = BREAK;
visitAsync.SKIP = SKIP;
visitAsync.REMOVE = REMOVE;
async function visitAsync_(key, node, visitor, path) {
  const ctrl = await callVisitor(key, node, visitor, path);
  if (isNode(ctrl) || isPair(ctrl)) {
    replaceNode(key, path, ctrl);
    return visitAsync_(key, ctrl, visitor, path);
  }
  if (typeof ctrl !== "symbol") {
    if (isCollection(node)) {
      path = Object.freeze(path.concat(node));
      for (let i = 0; i < node.items.length; ++i) {
        const ci = await visitAsync_(i, node.items[i], visitor, path);
        if (typeof ci === "number")
          i = ci - 1;
        else if (ci === BREAK)
          return BREAK;
        else if (ci === REMOVE) {
          node.items.splice(i, 1);
          i -= 1;
        }
      }
    } else if (isPair(node)) {
      path = Object.freeze(path.concat(node));
      const ck = await visitAsync_("key", node.key, visitor, path);
      if (ck === BREAK)
        return BREAK;
      else if (ck === REMOVE)
        node.key = null;
      const cv = await visitAsync_("value", node.value, visitor, path);
      if (cv === BREAK)
        return BREAK;
      else if (cv === REMOVE)
        node.value = null;
    }
  }
  return ctrl;
}
function initVisitor(visitor) {
  if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
    return Object.assign({
      Alias: visitor.Node,
      Map: visitor.Node,
      Scalar: visitor.Node,
      Seq: visitor.Node
    }, visitor.Value && {
      Map: visitor.Value,
      Scalar: visitor.Value,
      Seq: visitor.Value
    }, visitor.Collection && {
      Map: visitor.Collection,
      Seq: visitor.Collection
    }, visitor);
  }
  return visitor;
}
function callVisitor(key, node, visitor, path) {
  if (typeof visitor === "function")
    return visitor(key, node, path);
  if (isMap(node))
    return visitor.Map?.(key, node, path);
  if (isSeq(node))
    return visitor.Seq?.(key, node, path);
  if (isPair(node))
    return visitor.Pair?.(key, node, path);
  if (isScalar(node))
    return visitor.Scalar?.(key, node, path);
  if (isAlias(node))
    return visitor.Alias?.(key, node, path);
  return void 0;
}
function replaceNode(key, path, node) {
  const parent = path[path.length - 1];
  if (isCollection(parent)) {
    parent.items[key] = node;
  } else if (isPair(parent)) {
    if (key === "key")
      parent.key = node;
    else
      parent.value = node;
  } else if (isDocument(parent)) {
    parent.contents = node;
  } else {
    const pt = isAlias(parent) ? "alias" : "scalar";
    throw new Error(`Cannot replace node with ${pt} parent`);
  }
}

// node_modules/yaml/browser/dist/doc/directives.js
var escapeChars = {
  "!": "%21",
  ",": "%2C",
  "[": "%5B",
  "]": "%5D",
  "{": "%7B",
  "}": "%7D"
};
var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
var Directives = class _Directives {
  constructor(yaml, tags) {
    this.docStart = null;
    this.docEnd = false;
    this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
    this.tags = Object.assign({}, _Directives.defaultTags, tags);
  }
  clone() {
    const copy = new _Directives(this.yaml, this.tags);
    copy.docStart = this.docStart;
    return copy;
  }
  /**
   * During parsing, get a Directives instance for the current document and
   * update the stream state according to the current version's spec.
   */
  atDocument() {
    const res = new _Directives(this.yaml, this.tags);
    switch (this.yaml.version) {
      case "1.1":
        this.atNextDocument = true;
        break;
      case "1.2":
        this.atNextDocument = false;
        this.yaml = {
          explicit: _Directives.defaultYaml.explicit,
          version: "1.2"
        };
        this.tags = Object.assign({}, _Directives.defaultTags);
        break;
    }
    return res;
  }
  /**
   * @param onError - May be called even if the action was successful
   * @returns `true` on success
   */
  add(line, onError) {
    if (this.atNextDocument) {
      this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
      this.tags = Object.assign({}, _Directives.defaultTags);
      this.atNextDocument = false;
    }
    const parts = line.trim().split(/[ \t]+/);
    const name = parts.shift();
    switch (name) {
      case "%TAG": {
        if (parts.length !== 2) {
          onError(0, "%TAG directive should contain exactly two parts");
          if (parts.length < 2)
            return false;
        }
        const [handle, prefix] = parts;
        this.tags[handle] = prefix;
        return true;
      }
      case "%YAML": {
        this.yaml.explicit = true;
        if (parts.length !== 1) {
          onError(0, "%YAML directive should contain exactly one part");
          return false;
        }
        const [version] = parts;
        if (version === "1.1" || version === "1.2") {
          this.yaml.version = version;
          return true;
        } else {
          const isValid = /^\d+\.\d+$/.test(version);
          onError(6, `Unsupported YAML version ${version}`, isValid);
          return false;
        }
      }
      default:
        onError(0, `Unknown directive ${name}`, true);
        return false;
    }
  }
  /**
   * Resolves a tag, matching handles to those defined in %TAG directives.
   *
   * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
   *   `'!local'` tag, or `null` if unresolvable.
   */
  tagName(source, onError) {
    if (source === "!")
      return "!";
    if (source[0] !== "!") {
      onError(`Not a valid tag: ${source}`);
      return null;
    }
    if (source[1] === "<") {
      const verbatim = source.slice(2, -1);
      if (verbatim === "!" || verbatim === "!!") {
        onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
        return null;
      }
      if (source[source.length - 1] !== ">")
        onError("Verbatim tags must end with a >");
      return verbatim;
    }
    const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
    if (!suffix)
      onError(`The ${source} tag has no suffix`);
    const prefix = this.tags[handle];
    if (prefix) {
      try {
        return prefix + decodeURIComponent(suffix);
      } catch (error) {
        onError(String(error));
        return null;
      }
    }
    if (handle === "!")
      return source;
    onError(`Could not resolve tag: ${source}`);
    return null;
  }
  /**
   * Given a fully resolved tag, returns its printable string form,
   * taking into account current tag prefixes and defaults.
   */
  tagString(tag) {
    for (const [handle, prefix] of Object.entries(this.tags)) {
      if (tag.startsWith(prefix))
        return handle + escapeTagName(tag.substring(prefix.length));
    }
    return tag[0] === "!" ? tag : `!<${tag}>`;
  }
  toString(doc) {
    const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
    const tagEntries = Object.entries(this.tags);
    let tagNames;
    if (doc && tagEntries.length > 0 && isNode(doc.contents)) {
      const tags = {};
      visit(doc.contents, (_key, node) => {
        if (isNode(node) && node.tag)
          tags[node.tag] = true;
      });
      tagNames = Object.keys(tags);
    } else
      tagNames = [];
    for (const [handle, prefix] of tagEntries) {
      if (handle === "!!" && prefix === "tag:yaml.org,2002:")
        continue;
      if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
        lines.push(`%TAG ${handle} ${prefix}`);
    }
    return lines.join("\n");
  }
};
Directives.defaultYaml = { explicit: false, version: "1.2" };
Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };

// node_modules/yaml/browser/dist/doc/anchors.js
function anchorIsValid(anchor) {
  if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
    const sa = JSON.stringify(anchor);
    const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
    throw new Error(msg);
  }
  return true;
}
function anchorNames(root) {
  const anchors = /* @__PURE__ */ new Set();
  visit(root, {
    Value(_key, node) {
      if (node.anchor)
        anchors.add(node.anchor);
    }
  });
  return anchors;
}
function findNewAnchor(prefix, exclude) {
  for (let i = 1; true; ++i) {
    const name = `${prefix}${i}`;
    if (!exclude.has(name))
      return name;
  }
}
function createNodeAnchors(doc, prefix) {
  const aliasObjects = [];
  const sourceObjects = /* @__PURE__ */ new Map();
  let prevAnchors = null;
  return {
    onAnchor: (source) => {
      aliasObjects.push(source);
      prevAnchors ?? (prevAnchors = anchorNames(doc));
      const anchor = findNewAnchor(prefix, prevAnchors);
      prevAnchors.add(anchor);
      return anchor;
    },
    /**
     * With circular references, the source node is only resolved after all
     * of its child nodes are. This is why anchors are set only after all of
     * the nodes have been created.
     */
    setAnchors: () => {
      for (const source of aliasObjects) {
        const ref = sourceObjects.get(source);
        if (typeof ref === "object" && ref.anchor && (isScalar(ref.node) || isCollection(ref.node))) {
          ref.node.anchor = ref.anchor;
        } else {
          const error = new Error("Failed to resolve repeated object (this should not happen)");
          error.source = source;
          throw error;
        }
      }
    },
    sourceObjects
  };
}

// node_modules/yaml/browser/dist/doc/applyReviver.js
function applyReviver(reviver, obj, key, val) {
  if (val && typeof val === "object") {
    if (Array.isArray(val)) {
      for (let i = 0, len = val.length; i < len; ++i) {
        const v0 = val[i];
        const v1 = applyReviver(reviver, val, String(i), v0);
        if (v1 === void 0)
          delete val[i];
        else if (v1 !== v0)
          val[i] = v1;
      }
    } else if (val instanceof Map) {
      for (const k of Array.from(val.keys())) {
        const v0 = val.get(k);
        const v1 = applyReviver(reviver, val, k, v0);
        if (v1 === void 0)
          val.delete(k);
        else if (v1 !== v0)
          val.set(k, v1);
      }
    } else if (val instanceof Set) {
      for (const v0 of Array.from(val)) {
        const v1 = applyReviver(reviver, val, v0, v0);
        if (v1 === void 0)
          val.delete(v0);
        else if (v1 !== v0) {
          val.delete(v0);
          val.add(v1);
        }
      }
    } else {
      for (const [k, v0] of Object.entries(val)) {
        const v1 = applyReviver(reviver, val, k, v0);
        if (v1 === void 0)
          delete val[k];
        else if (v1 !== v0)
          val[k] = v1;
      }
    }
  }
  return reviver.call(obj, key, val);
}

// node_modules/yaml/browser/dist/nodes/toJS.js
function toJS(value, arg, ctx) {
  if (Array.isArray(value))
    return value.map((v, i) => toJS(v, String(i), ctx));
  if (value && typeof value.toJSON === "function") {
    if (!ctx || !hasAnchor(value))
      return value.toJSON(arg, ctx);
    const data = { aliasCount: 0, count: 1, res: void 0 };
    ctx.anchors.set(value, data);
    ctx.onCreate = (res2) => {
      data.res = res2;
      delete ctx.onCreate;
    };
    const res = value.toJSON(arg, ctx);
    if (ctx.onCreate)
      ctx.onCreate(res);
    return res;
  }
  if (typeof value === "bigint" && !ctx?.keep)
    return Number(value);
  return value;
}

// node_modules/yaml/browser/dist/nodes/Node.js
var NodeBase = class {
  constructor(type) {
    Object.defineProperty(this, NODE_TYPE, { value: type });
  }
  /** Create a copy of this node.  */
  clone() {
    const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    if (this.range)
      copy.range = this.range.slice();
    return copy;
  }
  /** A plain JavaScript representation of this node. */
  toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
    if (!isDocument(doc))
      throw new TypeError("A document argument is required");
    const ctx = {
      anchors: /* @__PURE__ */ new Map(),
      doc,
      keep: true,
      mapAsMap: mapAsMap === true,
      mapKeyWarned: false,
      maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
    };
    const res = toJS(this, "", ctx);
    if (typeof onAnchor === "function")
      for (const { count, res: res2 } of ctx.anchors.values())
        onAnchor(res2, count);
    return typeof reviver === "function" ? applyReviver(reviver, { "": res }, "", res) : res;
  }
};

// node_modules/yaml/browser/dist/nodes/Alias.js
var Alias = class extends NodeBase {
  constructor(source) {
    super(ALIAS);
    this.source = source;
    Object.defineProperty(this, "tag", {
      set() {
        throw new Error("Alias nodes cannot have tags");
      }
    });
  }
  /**
   * Resolve the value of this alias within `doc`, finding the last
   * instance of the `source` anchor before this node.
   */
  resolve(doc, ctx) {
    if (ctx?.maxAliasCount === 0)
      throw new ReferenceError("Alias resolution is disabled");
    let nodes;
    if (ctx?.aliasResolveCache) {
      nodes = ctx.aliasResolveCache;
    } else {
      nodes = [];
      visit(doc, {
        Node: (_key, node) => {
          if (isAlias(node) || hasAnchor(node))
            nodes.push(node);
        }
      });
      if (ctx)
        ctx.aliasResolveCache = nodes;
    }
    let found = void 0;
    for (const node of nodes) {
      if (node === this)
        break;
      if (node.anchor === this.source)
        found = node;
    }
    if (found && ctx) {
      const { anchors, doc: doc2, maxAliasCount } = ctx;
      let data = anchors.get(found);
      if (!data) {
        toJS(found, null, ctx);
        data = anchors.get(found);
      }
      if (data?.res === void 0) {
        const msg = "This should not happen: Alias anchor was not resolved?";
        throw new ReferenceError(msg);
      }
      if (maxAliasCount >= 0) {
        data.count += 1;
        if (data.aliasCount === 0)
          data.aliasCount = getAliasCount(doc2, found, anchors);
        if (data.count * data.aliasCount > maxAliasCount) {
          const msg = "Excessive alias count indicates a resource exhaustion attack";
          throw new ReferenceError(msg);
        }
      }
    }
    return found;
  }
  toJSON(_arg, ctx) {
    if (!ctx)
      return { source: this.source };
    const source = this.resolve(ctx.doc, ctx);
    if (!source) {
      const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
      throw new ReferenceError(msg);
    }
    return ctx.anchors.get(source).res;
  }
  toString(ctx, _onComment, _onChompKeep) {
    const src = `*${this.source}`;
    if (ctx) {
      anchorIsValid(this.source);
      if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
        const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new Error(msg);
      }
      if (ctx.implicitKey)
        return `${src} `;
    }
    return src;
  }
};
function getAliasCount(doc, node, anchors) {
  if (isAlias(node)) {
    const source = node.resolve(doc);
    const anchor = anchors && source && anchors.get(source);
    return anchor ? anchor.count * anchor.aliasCount : 0;
  } else if (isCollection(node)) {
    let count = 0;
    for (const item of node.items) {
      const c = getAliasCount(doc, item, anchors);
      if (c > count)
        count = c;
    }
    return count;
  } else if (isPair(node)) {
    const kc = getAliasCount(doc, node.key, anchors);
    const vc = getAliasCount(doc, node.value, anchors);
    return Math.max(kc, vc);
  }
  return 1;
}

// node_modules/yaml/browser/dist/nodes/Scalar.js
var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
var Scalar = class extends NodeBase {
  constructor(value) {
    super(SCALAR);
    this.value = value;
  }
  toJSON(arg, ctx) {
    return ctx?.keep ? this.value : toJS(this.value, arg, ctx);
  }
  toString() {
    return String(this.value);
  }
};
Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
Scalar.PLAIN = "PLAIN";
Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";

// node_modules/yaml/browser/dist/doc/createNode.js
var defaultTagPrefix = "tag:yaml.org,2002:";
function findTagObject(value, tagName, tags) {
  if (tagName) {
    const match = tags.filter((t) => t.tag === tagName);
    const tagObj = match.find((t) => !t.format) ?? match[0];
    if (!tagObj)
      throw new Error(`Tag ${tagName} not found`);
    return tagObj;
  }
  return tags.find((t) => t.identify?.(value) && !t.format);
}
function createNode(value, tagName, ctx) {
  if (isDocument(value))
    value = value.contents;
  if (isNode(value))
    return value;
  if (isPair(value)) {
    const map2 = ctx.schema[MAP].createNode?.(ctx.schema, null, ctx);
    map2.items.push(value);
    return map2;
  }
  if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
    value = value.valueOf();
  }
  const { aliasDuplicateObjects, onAnchor, onTagObj, schema: schema4, sourceObjects } = ctx;
  let ref = void 0;
  if (aliasDuplicateObjects && value && typeof value === "object") {
    ref = sourceObjects.get(value);
    if (ref) {
      ref.anchor ?? (ref.anchor = onAnchor(value));
      return new Alias(ref.anchor);
    } else {
      ref = { anchor: null, node: null };
      sourceObjects.set(value, ref);
    }
  }
  if (tagName?.startsWith("!!"))
    tagName = defaultTagPrefix + tagName.slice(2);
  let tagObj = findTagObject(value, tagName, schema4.tags);
  if (!tagObj) {
    if (value && typeof value.toJSON === "function") {
      value = value.toJSON();
    }
    if (!value || typeof value !== "object") {
      const node2 = new Scalar(value);
      if (ref)
        ref.node = node2;
      return node2;
    }
    tagObj = value instanceof Map ? schema4[MAP] : Symbol.iterator in Object(value) ? schema4[SEQ] : schema4[MAP];
  }
  if (onTagObj) {
    onTagObj(tagObj);
    delete ctx.onTagObj;
  }
  const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar(value);
  if (tagName)
    node.tag = tagName;
  else if (!tagObj.default)
    node.tag = tagObj.tag;
  if (ref)
    ref.node = node;
  return node;
}

// node_modules/yaml/browser/dist/nodes/Collection.js
function collectionFromPath(schema4, path, value) {
  let v = value;
  for (let i = path.length - 1; i >= 0; --i) {
    const k = path[i];
    if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
      const a = [];
      a[k] = v;
      v = a;
    } else {
      v = /* @__PURE__ */ new Map([[k, v]]);
    }
  }
  return createNode(v, void 0, {
    aliasDuplicateObjects: false,
    keepUndefined: false,
    onAnchor: () => {
      throw new Error("This should not happen, please report a bug.");
    },
    schema: schema4,
    sourceObjects: /* @__PURE__ */ new Map()
  });
}
var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
var Collection = class extends NodeBase {
  constructor(type, schema4) {
    super(type);
    Object.defineProperty(this, "schema", {
      value: schema4,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  /**
   * Create a copy of this collection.
   *
   * @param schema - If defined, overwrites the original's schema
   */
  clone(schema4) {
    const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    if (schema4)
      copy.schema = schema4;
    copy.items = copy.items.map((it) => isNode(it) || isPair(it) ? it.clone(schema4) : it);
    if (this.range)
      copy.range = this.range.slice();
    return copy;
  }
  /**
   * Adds a value to the collection. For `!!map` and `!!omap` the value must
   * be a Pair instance or a `{ key, value }` object, which may not have a key
   * that already exists in the map.
   */
  addIn(path, value) {
    if (isEmptyPath(path))
      this.add(value);
    else {
      const [key, ...rest] = path;
      const node = this.get(key, true);
      if (isCollection(node))
        node.addIn(rest, value);
      else if (node === void 0 && this.schema)
        this.set(key, collectionFromPath(this.schema, rest, value));
      else
        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
  }
  /**
   * Removes a value from the collection.
   * @returns `true` if the item was found and removed.
   */
  deleteIn(path) {
    const [key, ...rest] = path;
    if (rest.length === 0)
      return this.delete(key);
    const node = this.get(key, true);
    if (isCollection(node))
      return node.deleteIn(rest);
    else
      throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
  }
  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(path, keepScalar) {
    const [key, ...rest] = path;
    const node = this.get(key, true);
    if (rest.length === 0)
      return !keepScalar && isScalar(node) ? node.value : node;
    else
      return isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
  }
  hasAllNullValues(allowScalar) {
    return this.items.every((node) => {
      if (!isPair(node))
        return false;
      const n = node.value;
      return n == null || allowScalar && isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
    });
  }
  /**
   * Checks if the collection includes a value with the key `key`.
   */
  hasIn(path) {
    const [key, ...rest] = path;
    if (rest.length === 0)
      return this.has(key);
    const node = this.get(key, true);
    return isCollection(node) ? node.hasIn(rest) : false;
  }
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(path, value) {
    const [key, ...rest] = path;
    if (rest.length === 0) {
      this.set(key, value);
    } else {
      const node = this.get(key, true);
      if (isCollection(node))
        node.setIn(rest, value);
      else if (node === void 0 && this.schema)
        this.set(key, collectionFromPath(this.schema, rest, value));
      else
        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
  }
};

// node_modules/yaml/browser/dist/stringify/stringifyComment.js
var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
function indentComment(comment, indent) {
  if (/^\n+$/.test(comment))
    return comment.substring(1);
  return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
}
var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;

// node_modules/yaml/browser/dist/stringify/foldFlowLines.js
var FOLD_FLOW = "flow";
var FOLD_BLOCK = "block";
var FOLD_QUOTED = "quoted";
function foldFlowLines(text2, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
  if (!lineWidth || lineWidth < 0)
    return text2;
  if (lineWidth < minContentWidth)
    minContentWidth = 0;
  const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
  if (text2.length <= endStep)
    return text2;
  const folds = [];
  const escapedFolds = {};
  let end = lineWidth - indent.length;
  if (typeof indentAtStart === "number") {
    if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
      folds.push(0);
    else
      end = lineWidth - indentAtStart;
  }
  let split = void 0;
  let prev = void 0;
  let overflow = false;
  let i = -1;
  let escStart = -1;
  let escEnd = -1;
  if (mode === FOLD_BLOCK) {
    i = consumeMoreIndentedLines(text2, i, indent.length);
    if (i !== -1)
      end = i + endStep;
  }
  for (let ch; ch = text2[i += 1]; ) {
    if (mode === FOLD_QUOTED && ch === "\\") {
      escStart = i;
      switch (text2[i + 1]) {
        case "x":
          i += 3;
          break;
        case "u":
          i += 5;
          break;
        case "U":
          i += 9;
          break;
        default:
          i += 1;
      }
      escEnd = i;
    }
    if (ch === "\n") {
      if (mode === FOLD_BLOCK)
        i = consumeMoreIndentedLines(text2, i, indent.length);
      end = i + indent.length + endStep;
      split = void 0;
    } else {
      if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
        const next = text2[i + 1];
        if (next && next !== " " && next !== "\n" && next !== "	")
          split = i;
      }
      if (i >= end) {
        if (split) {
          folds.push(split);
          end = split + endStep;
          split = void 0;
        } else if (mode === FOLD_QUOTED) {
          while (prev === " " || prev === "	") {
            prev = ch;
            ch = text2[i += 1];
            overflow = true;
          }
          const j = i > escEnd + 1 ? i - 2 : escStart - 1;
          if (escapedFolds[j])
            return text2;
          folds.push(j);
          escapedFolds[j] = true;
          end = j + endStep;
          split = void 0;
        } else {
          overflow = true;
        }
      }
    }
    prev = ch;
  }
  if (overflow && onOverflow)
    onOverflow();
  if (folds.length === 0)
    return text2;
  if (onFold)
    onFold();
  let res = text2.slice(0, folds[0]);
  for (let i2 = 0; i2 < folds.length; ++i2) {
    const fold = folds[i2];
    const end2 = folds[i2 + 1] || text2.length;
    if (fold === 0)
      res = `
${indent}${text2.slice(0, end2)}`;
    else {
      if (mode === FOLD_QUOTED && escapedFolds[fold])
        res += `${text2[fold]}\\`;
      res += `
${indent}${text2.slice(fold + 1, end2)}`;
    }
  }
  return res;
}
function consumeMoreIndentedLines(text2, i, indent) {
  let end = i;
  let start = i + 1;
  let ch = text2[start];
  while (ch === " " || ch === "	") {
    if (i < start + indent) {
      ch = text2[++i];
    } else {
      do {
        ch = text2[++i];
      } while (ch && ch !== "\n");
      end = i;
      start = i + 1;
      ch = text2[start];
    }
  }
  return end;
}

// node_modules/yaml/browser/dist/stringify/stringifyString.js
var getFoldOptions = (ctx, isBlock2) => ({
  indentAtStart: isBlock2 ? ctx.indent.length : ctx.indentAtStart,
  lineWidth: ctx.options.lineWidth,
  minContentWidth: ctx.options.minContentWidth
});
var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
function lineLengthOverLimit(str, lineWidth, indentLength) {
  if (!lineWidth || lineWidth < 0)
    return false;
  const limit = lineWidth - indentLength;
  const strLen = str.length;
  if (strLen <= limit)
    return false;
  for (let i = 0, start = 0; i < strLen; ++i) {
    if (str[i] === "\n") {
      if (i - start > limit)
        return true;
      start = i + 1;
      if (strLen - start <= limit)
        return false;
    }
  }
  return true;
}
function doubleQuotedString(value, ctx) {
  const json3 = JSON.stringify(value);
  if (ctx.options.doubleQuotedAsJSON)
    return json3;
  const { implicitKey } = ctx;
  const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
  const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
  let str = "";
  let start = 0;
  for (let i = 0, ch = json3[i]; ch; ch = json3[++i]) {
    if (ch === " " && json3[i + 1] === "\\" && json3[i + 2] === "n") {
      str += json3.slice(start, i) + "\\ ";
      i += 1;
      start = i;
      ch = "\\";
    }
    if (ch === "\\")
      switch (json3[i + 1]) {
        case "u":
          {
            str += json3.slice(start, i);
            const code = json3.substr(i + 2, 4);
            switch (code) {
              case "0000":
                str += "\\0";
                break;
              case "0007":
                str += "\\a";
                break;
              case "000b":
                str += "\\v";
                break;
              case "001b":
                str += "\\e";
                break;
              case "0085":
                str += "\\N";
                break;
              case "00a0":
                str += "\\_";
                break;
              case "2028":
                str += "\\L";
                break;
              case "2029":
                str += "\\P";
                break;
              default:
                if (code.substr(0, 2) === "00")
                  str += "\\x" + code.substr(2);
                else
                  str += json3.substr(i, 6);
            }
            i += 5;
            start = i + 1;
          }
          break;
        case "n":
          if (implicitKey || json3[i + 2] === '"' || json3.length < minMultiLineLength) {
            i += 1;
          } else {
            str += json3.slice(start, i) + "\n\n";
            while (json3[i + 2] === "\\" && json3[i + 3] === "n" && json3[i + 4] !== '"') {
              str += "\n";
              i += 2;
            }
            str += indent;
            if (json3[i + 2] === " ")
              str += "\\";
            i += 1;
            start = i + 1;
          }
          break;
        default:
          i += 1;
      }
  }
  str = start ? str + json3.slice(start) : json3;
  return implicitKey ? str : foldFlowLines(str, indent, FOLD_QUOTED, getFoldOptions(ctx, false));
}
function singleQuotedString(value, ctx) {
  if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
    return doubleQuotedString(value, ctx);
  const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
  const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
  return ctx.implicitKey ? res : foldFlowLines(res, indent, FOLD_FLOW, getFoldOptions(ctx, false));
}
function quotedString(value, ctx) {
  const { singleQuote } = ctx.options;
  let qs;
  if (singleQuote === false)
    qs = doubleQuotedString;
  else {
    const hasDouble = value.includes('"');
    const hasSingle = value.includes("'");
    if (hasDouble && !hasSingle)
      qs = singleQuotedString;
    else if (hasSingle && !hasDouble)
      qs = doubleQuotedString;
    else
      qs = singleQuote ? singleQuotedString : doubleQuotedString;
  }
  return qs(value, ctx);
}
var blockEndNewlines;
try {
  blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
} catch {
  blockEndNewlines = /\n+(?!\n|$)/g;
}
function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
  const { blockQuote, commentString, lineWidth } = ctx.options;
  if (!blockQuote || /\n[\t ]+$/.test(value)) {
    return quotedString(value, ctx);
  }
  const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
  const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.BLOCK_FOLDED ? false : type === Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
  if (!value)
    return literal ? "|\n" : ">\n";
  let chomp;
  let endStart;
  for (endStart = value.length; endStart > 0; --endStart) {
    const ch = value[endStart - 1];
    if (ch !== "\n" && ch !== "	" && ch !== " ")
      break;
  }
  let end = value.substring(endStart);
  const endNlPos = end.indexOf("\n");
  if (endNlPos === -1) {
    chomp = "-";
  } else if (value === end || endNlPos !== end.length - 1) {
    chomp = "+";
    if (onChompKeep)
      onChompKeep();
  } else {
    chomp = "";
  }
  if (end) {
    value = value.slice(0, -end.length);
    if (end[end.length - 1] === "\n")
      end = end.slice(0, -1);
    end = end.replace(blockEndNewlines, `$&${indent}`);
  }
  let startWithSpace = false;
  let startEnd;
  let startNlPos = -1;
  for (startEnd = 0; startEnd < value.length; ++startEnd) {
    const ch = value[startEnd];
    if (ch === " ")
      startWithSpace = true;
    else if (ch === "\n")
      startNlPos = startEnd;
    else
      break;
  }
  let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
  if (start) {
    value = value.substring(start.length);
    start = start.replace(/\n+/g, `$&${indent}`);
  }
  const indentSize = indent ? "2" : "1";
  let header = (startWithSpace ? indentSize : "") + chomp;
  if (comment) {
    header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
    if (onComment)
      onComment();
  }
  if (!literal) {
    const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
    let literalFallback = false;
    const foldOptions = getFoldOptions(ctx, true);
    if (blockQuote !== "folded" && type !== Scalar.BLOCK_FOLDED) {
      foldOptions.onOverflow = () => {
        literalFallback = true;
      };
    }
    const body = foldFlowLines(`${start}${foldedValue}${end}`, indent, FOLD_BLOCK, foldOptions);
    if (!literalFallback)
      return `>${header}
${indent}${body}`;
  }
  value = value.replace(/\n+/g, `$&${indent}`);
  return `|${header}
${indent}${start}${value}${end}`;
}
function plainString(item, ctx, onComment, onChompKeep) {
  const { type, value } = item;
  const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
  if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
    return quotedString(value, ctx);
  }
  if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
    return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
  }
  if (!implicitKey && !inFlow && type !== Scalar.PLAIN && value.includes("\n")) {
    return blockString(item, ctx, onComment, onChompKeep);
  }
  if (containsDocumentMarker(value)) {
    if (indent === "") {
      ctx.forceBlockIndent = true;
      return blockString(item, ctx, onComment, onChompKeep);
    } else if (implicitKey && indent === indentStep) {
      return quotedString(value, ctx);
    }
  }
  const str = value.replace(/\n+/g, `$&
${indent}`);
  if (actualString) {
    const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
    const { compat, tags } = ctx.doc.schema;
    if (tags.some(test) || compat?.some(test))
      return quotedString(value, ctx);
  }
  return implicitKey ? str : foldFlowLines(str, indent, FOLD_FLOW, getFoldOptions(ctx, false));
}
function stringifyString(item, ctx, onComment, onChompKeep) {
  const { implicitKey, inFlow } = ctx;
  const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
  let { type } = item;
  if (type !== Scalar.QUOTE_DOUBLE) {
    if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
      type = Scalar.QUOTE_DOUBLE;
  }
  const _stringify = (_type) => {
    switch (_type) {
      case Scalar.BLOCK_FOLDED:
      case Scalar.BLOCK_LITERAL:
        return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
      case Scalar.QUOTE_DOUBLE:
        return doubleQuotedString(ss.value, ctx);
      case Scalar.QUOTE_SINGLE:
        return singleQuotedString(ss.value, ctx);
      case Scalar.PLAIN:
        return plainString(ss, ctx, onComment, onChompKeep);
      default:
        return null;
    }
  };
  let res = _stringify(type);
  if (res === null) {
    const { defaultKeyType, defaultStringType } = ctx.options;
    const t = implicitKey && defaultKeyType || defaultStringType;
    res = _stringify(t);
    if (res === null)
      throw new Error(`Unsupported default string type ${t}`);
  }
  return res;
}

// node_modules/yaml/browser/dist/stringify/stringify.js
function createStringifyContext(doc, options) {
  const opt = Object.assign({
    blockQuote: true,
    commentString: stringifyComment,
    defaultKeyType: null,
    defaultStringType: "PLAIN",
    directives: null,
    doubleQuotedAsJSON: false,
    doubleQuotedMinMultiLineLength: 40,
    falseStr: "false",
    flowCollectionPadding: true,
    indentSeq: true,
    lineWidth: 80,
    minContentWidth: 20,
    nullStr: "null",
    simpleKeys: false,
    singleQuote: null,
    trailingComma: false,
    trueStr: "true",
    verifyAliasOrder: true
  }, doc.schema.toStringOptions, options);
  let inFlow;
  switch (opt.collectionStyle) {
    case "block":
      inFlow = false;
      break;
    case "flow":
      inFlow = true;
      break;
    default:
      inFlow = null;
  }
  return {
    anchors: /* @__PURE__ */ new Set(),
    doc,
    flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
    indent: "",
    indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
    inFlow,
    options: opt
  };
}
function getTagObject(tags, item) {
  if (item.tag) {
    const match = tags.filter((t) => t.tag === item.tag);
    if (match.length > 0)
      return match.find((t) => t.format === item.format) ?? match[0];
  }
  let tagObj = void 0;
  let obj;
  if (isScalar(item)) {
    obj = item.value;
    let match = tags.filter((t) => t.identify?.(obj));
    if (match.length > 1) {
      const testMatch = match.filter((t) => t.test);
      if (testMatch.length > 0)
        match = testMatch;
    }
    tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
  } else {
    obj = item;
    tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
  }
  if (!tagObj) {
    const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
    throw new Error(`Tag not resolved for ${name} value`);
  }
  return tagObj;
}
function stringifyProps(node, tagObj, { anchors, doc }) {
  if (!doc.directives)
    return "";
  const props = [];
  const anchor = (isScalar(node) || isCollection(node)) && node.anchor;
  if (anchor && anchorIsValid(anchor)) {
    anchors.add(anchor);
    props.push(`&${anchor}`);
  }
  const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
  if (tag)
    props.push(doc.directives.tagString(tag));
  return props.join(" ");
}
function stringify(item, ctx, onComment, onChompKeep) {
  if (isPair(item))
    return item.toString(ctx, onComment, onChompKeep);
  if (isAlias(item)) {
    if (ctx.doc.directives)
      return item.toString(ctx);
    if (ctx.resolvedAliases?.has(item)) {
      throw new TypeError(`Cannot stringify circular structure without alias nodes`);
    } else {
      if (ctx.resolvedAliases)
        ctx.resolvedAliases.add(item);
      else
        ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
      item = item.resolve(ctx.doc);
    }
  }
  let tagObj = void 0;
  const node = isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
  tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
  const props = stringifyProps(node, tagObj, ctx);
  if (props.length > 0)
    ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
  const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : isScalar(node) ? stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
  if (!props)
    return str;
  return isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
}

// node_modules/yaml/browser/dist/stringify/stringifyPair.js
function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
  const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
  let keyComment = isNode(key) && key.comment || null;
  if (simpleKeys) {
    if (keyComment) {
      throw new Error("With simple keys, key nodes cannot have comments");
    }
    if (isCollection(key) || !isNode(key) && typeof key === "object") {
      const msg = "With simple keys, collection cannot be used as a key value";
      throw new Error(msg);
    }
  }
  let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || isCollection(key) || (isScalar(key) ? key.type === Scalar.BLOCK_FOLDED || key.type === Scalar.BLOCK_LITERAL : typeof key === "object"));
  ctx = Object.assign({}, ctx, {
    allNullValues: false,
    implicitKey: !explicitKey && (simpleKeys || !allNullValues),
    indent: indent + indentStep
  });
  let keyCommentDone = false;
  let chompKeep = false;
  let str = stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
  if (!explicitKey && !ctx.inFlow && str.length > 1024) {
    if (simpleKeys)
      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
    explicitKey = true;
  }
  if (ctx.inFlow) {
    if (allNullValues || value == null) {
      if (keyCommentDone && onComment)
        onComment();
      return str === "" ? "?" : explicitKey ? `? ${str}` : str;
    }
  } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
    str = `? ${str}`;
    if (keyComment && !keyCommentDone) {
      str += lineComment(str, ctx.indent, commentString(keyComment));
    } else if (chompKeep && onChompKeep)
      onChompKeep();
    return str;
  }
  if (keyCommentDone)
    keyComment = null;
  if (explicitKey) {
    if (keyComment)
      str += lineComment(str, ctx.indent, commentString(keyComment));
    str = `? ${str}
${indent}:`;
  } else {
    str = `${str}:`;
    if (keyComment)
      str += lineComment(str, ctx.indent, commentString(keyComment));
  }
  let vsb, vcb, valueComment;
  if (isNode(value)) {
    vsb = !!value.spaceBefore;
    vcb = value.commentBefore;
    valueComment = value.comment;
  } else {
    vsb = false;
    vcb = null;
    valueComment = null;
    if (value && typeof value === "object")
      value = doc.createNode(value);
  }
  ctx.implicitKey = false;
  if (!explicitKey && !keyComment && isScalar(value))
    ctx.indentAtStart = str.length + 1;
  chompKeep = false;
  if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && isSeq(value) && !value.flow && !value.tag && !value.anchor) {
    ctx.indent = ctx.indent.substring(2);
  }
  let valueCommentDone = false;
  const valueStr = stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
  let ws = " ";
  if (keyComment || vsb || vcb) {
    ws = vsb ? "\n" : "";
    if (vcb) {
      const cs = commentString(vcb);
      ws += `
${indentComment(cs, ctx.indent)}`;
    }
    if (valueStr === "" && !ctx.inFlow) {
      if (ws === "\n" && valueComment)
        ws = "\n\n";
    } else {
      ws += `
${ctx.indent}`;
    }
  } else if (!explicitKey && isCollection(value)) {
    const vs0 = valueStr[0];
    const nl0 = valueStr.indexOf("\n");
    const hasNewline = nl0 !== -1;
    const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
    if (hasNewline || !flow) {
      let hasPropsLine = false;
      if (hasNewline && (vs0 === "&" || vs0 === "!")) {
        let sp0 = valueStr.indexOf(" ");
        if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
          sp0 = valueStr.indexOf(" ", sp0 + 1);
        }
        if (sp0 === -1 || nl0 < sp0)
          hasPropsLine = true;
      }
      if (!hasPropsLine)
        ws = `
${ctx.indent}`;
    }
  } else if (valueStr === "" || valueStr[0] === "\n") {
    ws = "";
  }
  str += ws + valueStr;
  if (ctx.inFlow) {
    if (valueCommentDone && onComment)
      onComment();
  } else if (valueComment && !valueCommentDone) {
    str += lineComment(str, ctx.indent, commentString(valueComment));
  } else if (chompKeep && onChompKeep) {
    onChompKeep();
  }
  return str;
}

// node_modules/yaml/browser/dist/log.js
function warn(logLevel, warning) {
  if (logLevel === "debug" || logLevel === "warn") {
    console.warn(warning);
  }
}

// node_modules/yaml/browser/dist/schema/yaml-1.1/merge.js
var MERGE_KEY = "<<";
var merge = {
  identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
  default: "key",
  tag: "tag:yaml.org,2002:merge",
  test: /^<<$/,
  resolve: () => Object.assign(new Scalar(Symbol(MERGE_KEY)), {
    addToJSMap: addMergeToJSMap
  }),
  stringify: () => MERGE_KEY
};
var isMergeKey = (ctx, key) => (merge.identify(key) || isScalar(key) && (!key.type || key.type === Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
function addMergeToJSMap(ctx, map2, value) {
  const source = resolveAliasValue(ctx, value);
  if (isSeq(source))
    for (const it of source.items)
      mergeValue(ctx, map2, it);
  else if (Array.isArray(source))
    for (const it of source)
      mergeValue(ctx, map2, it);
  else
    mergeValue(ctx, map2, source);
}
function mergeValue(ctx, map2, value) {
  const source = resolveAliasValue(ctx, value);
  if (!isMap(source))
    throw new Error("Merge sources must be maps or map aliases");
  const srcMap = source.toJSON(null, ctx, Map);
  for (const [key, value2] of srcMap) {
    if (map2 instanceof Map) {
      if (!map2.has(key))
        map2.set(key, value2);
    } else if (map2 instanceof Set) {
      map2.add(key);
    } else if (!Object.prototype.hasOwnProperty.call(map2, key)) {
      Object.defineProperty(map2, key, {
        value: value2,
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
  }
  return map2;
}
function resolveAliasValue(ctx, value) {
  return ctx && isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
}

// node_modules/yaml/browser/dist/nodes/addPairToJSMap.js
function addPairToJSMap(ctx, map2, { key, value }) {
  if (isNode(key) && key.addToJSMap)
    key.addToJSMap(ctx, map2, value);
  else if (isMergeKey(ctx, key))
    addMergeToJSMap(ctx, map2, value);
  else {
    const jsKey = toJS(key, "", ctx);
    if (map2 instanceof Map) {
      map2.set(jsKey, toJS(value, jsKey, ctx));
    } else if (map2 instanceof Set) {
      map2.add(jsKey);
    } else {
      const stringKey = stringifyKey(key, jsKey, ctx);
      const jsValue = toJS(value, stringKey, ctx);
      if (stringKey in map2)
        Object.defineProperty(map2, stringKey, {
          value: jsValue,
          writable: true,
          enumerable: true,
          configurable: true
        });
      else
        map2[stringKey] = jsValue;
    }
  }
  return map2;
}
function stringifyKey(key, jsKey, ctx) {
  if (jsKey === null)
    return "";
  if (typeof jsKey !== "object")
    return String(jsKey);
  if (isNode(key) && ctx?.doc) {
    const strCtx = createStringifyContext(ctx.doc, {});
    strCtx.anchors = /* @__PURE__ */ new Set();
    for (const node of ctx.anchors.keys())
      strCtx.anchors.add(node.anchor);
    strCtx.inFlow = true;
    strCtx.inStringifyKey = true;
    const strKey = key.toString(strCtx);
    if (!ctx.mapKeyWarned) {
      let jsonStr = JSON.stringify(strKey);
      if (jsonStr.length > 40)
        jsonStr = jsonStr.substring(0, 36) + '..."';
      warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
      ctx.mapKeyWarned = true;
    }
    return strKey;
  }
  return JSON.stringify(jsKey);
}

// node_modules/yaml/browser/dist/nodes/Pair.js
function createPair(key, value, ctx) {
  const k = createNode(key, void 0, ctx);
  const v = createNode(value, void 0, ctx);
  return new Pair(k, v);
}
var Pair = class _Pair {
  constructor(key, value = null) {
    Object.defineProperty(this, NODE_TYPE, { value: PAIR });
    this.key = key;
    this.value = value;
  }
  clone(schema4) {
    let { key, value } = this;
    if (isNode(key))
      key = key.clone(schema4);
    if (isNode(value))
      value = value.clone(schema4);
    return new _Pair(key, value);
  }
  toJSON(_, ctx) {
    const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
    return addPairToJSMap(ctx, pair, this);
  }
  toString(ctx, onComment, onChompKeep) {
    return ctx?.doc ? stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
  }
};

// node_modules/yaml/browser/dist/stringify/stringifyCollection.js
function stringifyCollection(collection, ctx, options) {
  const flow = ctx.inFlow ?? collection.flow;
  const stringify4 = flow ? stringifyFlowCollection : stringifyBlockCollection;
  return stringify4(collection, ctx, options);
}
function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
  const { indent, options: { commentString } } = ctx;
  const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
  let chompKeep = false;
  const lines = [];
  for (let i = 0; i < items.length; ++i) {
    const item = items[i];
    let comment2 = null;
    if (isNode(item)) {
      if (!chompKeep && item.spaceBefore)
        lines.push("");
      addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
      if (item.comment)
        comment2 = item.comment;
    } else if (isPair(item)) {
      const ik = isNode(item.key) ? item.key : null;
      if (ik) {
        if (!chompKeep && ik.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
      }
    }
    chompKeep = false;
    let str2 = stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
    if (comment2)
      str2 += lineComment(str2, itemIndent, commentString(comment2));
    if (chompKeep && comment2)
      chompKeep = false;
    lines.push(blockItemPrefix + str2);
  }
  let str;
  if (lines.length === 0) {
    str = flowChars.start + flowChars.end;
  } else {
    str = lines[0];
    for (let i = 1; i < lines.length; ++i) {
      const line = lines[i];
      str += line ? `
${indent}${line}` : "\n";
    }
  }
  if (comment) {
    str += "\n" + indentComment(commentString(comment), indent);
    if (onComment)
      onComment();
  } else if (chompKeep && onChompKeep)
    onChompKeep();
  return str;
}
function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
  const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
  itemIndent += indentStep;
  const itemCtx = Object.assign({}, ctx, {
    indent: itemIndent,
    inFlow: true,
    type: null
  });
  let reqNewline = false;
  let linesAtValue = 0;
  const lines = [];
  for (let i = 0; i < items.length; ++i) {
    const item = items[i];
    let comment = null;
    if (isNode(item)) {
      if (item.spaceBefore)
        lines.push("");
      addCommentBefore(ctx, lines, item.commentBefore, false);
      if (item.comment)
        comment = item.comment;
    } else if (isPair(item)) {
      const ik = isNode(item.key) ? item.key : null;
      if (ik) {
        if (ik.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, ik.commentBefore, false);
        if (ik.comment)
          reqNewline = true;
      }
      const iv = isNode(item.value) ? item.value : null;
      if (iv) {
        if (iv.comment)
          comment = iv.comment;
        if (iv.commentBefore)
          reqNewline = true;
      } else if (item.value == null && ik?.comment) {
        comment = ik.comment;
      }
    }
    if (comment)
      reqNewline = true;
    let str = stringify(item, itemCtx, () => comment = null);
    reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
    if (i < items.length - 1) {
      str += ",";
    } else if (ctx.options.trailingComma) {
      if (ctx.options.lineWidth > 0) {
        reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
      }
      if (reqNewline) {
        str += ",";
      }
    }
    if (comment)
      str += lineComment(str, itemIndent, commentString(comment));
    lines.push(str);
    linesAtValue = lines.length;
  }
  const { start, end } = flowChars;
  if (lines.length === 0) {
    return start + end;
  } else {
    if (!reqNewline) {
      const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
      reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
    }
    if (reqNewline) {
      let str = start;
      for (const line of lines)
        str += line ? `
${indentStep}${indent}${line}` : "\n";
      return `${str}
${indent}${end}`;
    } else {
      return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
    }
  }
}
function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
  if (comment && chompKeep)
    comment = comment.replace(/^\n+/, "");
  if (comment) {
    const ic = indentComment(commentString(comment), indent);
    lines.push(ic.trimStart());
  }
}

// node_modules/yaml/browser/dist/nodes/YAMLMap.js
function findPair(items, key) {
  const k = isScalar(key) ? key.value : key;
  for (const it of items) {
    if (isPair(it)) {
      if (it.key === key || it.key === k)
        return it;
      if (isScalar(it.key) && it.key.value === k)
        return it;
    }
  }
  return void 0;
}
var YAMLMap = class extends Collection {
  static get tagName() {
    return "tag:yaml.org,2002:map";
  }
  constructor(schema4) {
    super(MAP, schema4);
    this.items = [];
  }
  /**
   * A generic collection parsing method that can be extended
   * to other node classes that inherit from YAMLMap
   */
  static from(schema4, obj, ctx) {
    const { keepUndefined, replacer } = ctx;
    const map2 = new this(schema4);
    const add = (key, value) => {
      if (typeof replacer === "function")
        value = replacer.call(obj, key, value);
      else if (Array.isArray(replacer) && !replacer.includes(key))
        return;
      if (value !== void 0 || keepUndefined)
        map2.items.push(createPair(key, value, ctx));
    };
    if (obj instanceof Map) {
      for (const [key, value] of obj)
        add(key, value);
    } else if (obj && typeof obj === "object") {
      for (const key of Object.keys(obj))
        add(key, obj[key]);
    }
    if (typeof schema4.sortMapEntries === "function") {
      map2.items.sort(schema4.sortMapEntries);
    }
    return map2;
  }
  /**
   * Adds a value to the collection.
   *
   * @param overwrite - If not set `true`, using a key that is already in the
   *   collection will throw. Otherwise, overwrites the previous value.
   */
  add(pair, overwrite) {
    let _pair;
    if (isPair(pair))
      _pair = pair;
    else if (!pair || typeof pair !== "object" || !("key" in pair)) {
      _pair = new Pair(pair, pair?.value);
    } else
      _pair = new Pair(pair.key, pair.value);
    const prev = findPair(this.items, _pair.key);
    const sortEntries = this.schema?.sortMapEntries;
    if (prev) {
      if (!overwrite)
        throw new Error(`Key ${_pair.key} already set`);
      if (isScalar(prev.value) && isScalarValue(_pair.value))
        prev.value.value = _pair.value;
      else
        prev.value = _pair.value;
    } else if (sortEntries) {
      const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
      if (i === -1)
        this.items.push(_pair);
      else
        this.items.splice(i, 0, _pair);
    } else {
      this.items.push(_pair);
    }
  }
  delete(key) {
    const it = findPair(this.items, key);
    if (!it)
      return false;
    const del = this.items.splice(this.items.indexOf(it), 1);
    return del.length > 0;
  }
  get(key, keepScalar) {
    const it = findPair(this.items, key);
    const node = it?.value;
    return (!keepScalar && isScalar(node) ? node.value : node) ?? void 0;
  }
  has(key) {
    return !!findPair(this.items, key);
  }
  set(key, value) {
    this.add(new Pair(key, value), true);
  }
  /**
   * @param ctx - Conversion context, originally set in Document#toJS()
   * @param {Class} Type - If set, forces the returned collection type
   * @returns Instance of Type, Map, or Object
   */
  toJSON(_, ctx, Type) {
    const map2 = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
    if (ctx?.onCreate)
      ctx.onCreate(map2);
    for (const item of this.items)
      addPairToJSMap(ctx, map2, item);
    return map2;
  }
  toString(ctx, onComment, onChompKeep) {
    if (!ctx)
      return JSON.stringify(this);
    for (const item of this.items) {
      if (!isPair(item))
        throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
    }
    if (!ctx.allNullValues && this.hasAllNullValues(false))
      ctx = Object.assign({}, ctx, { allNullValues: true });
    return stringifyCollection(this, ctx, {
      blockItemPrefix: "",
      flowChars: { start: "{", end: "}" },
      itemIndent: ctx.indent || "",
      onChompKeep,
      onComment
    });
  }
};

// node_modules/yaml/browser/dist/schema/common/map.js
var map = {
  collection: "map",
  default: true,
  nodeClass: YAMLMap,
  tag: "tag:yaml.org,2002:map",
  resolve(map2, onError) {
    if (!isMap(map2))
      onError("Expected a mapping for this tag");
    return map2;
  },
  createNode: (schema4, obj, ctx) => YAMLMap.from(schema4, obj, ctx)
};

// node_modules/yaml/browser/dist/nodes/YAMLSeq.js
var YAMLSeq = class extends Collection {
  static get tagName() {
    return "tag:yaml.org,2002:seq";
  }
  constructor(schema4) {
    super(SEQ, schema4);
    this.items = [];
  }
  add(value) {
    this.items.push(value);
  }
  /**
   * Removes a value from the collection.
   *
   * `key` must contain a representation of an integer for this to succeed.
   * It may be wrapped in a `Scalar`.
   *
   * @returns `true` if the item was found and removed.
   */
  delete(key) {
    const idx = asItemIndex(key);
    if (typeof idx !== "number")
      return false;
    const del = this.items.splice(idx, 1);
    return del.length > 0;
  }
  get(key, keepScalar) {
    const idx = asItemIndex(key);
    if (typeof idx !== "number")
      return void 0;
    const it = this.items[idx];
    return !keepScalar && isScalar(it) ? it.value : it;
  }
  /**
   * Checks if the collection includes a value with the key `key`.
   *
   * `key` must contain a representation of an integer for this to succeed.
   * It may be wrapped in a `Scalar`.
   */
  has(key) {
    const idx = asItemIndex(key);
    return typeof idx === "number" && idx < this.items.length;
  }
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   *
   * If `key` does not contain a representation of an integer, this will throw.
   * It may be wrapped in a `Scalar`.
   */
  set(key, value) {
    const idx = asItemIndex(key);
    if (typeof idx !== "number")
      throw new Error(`Expected a valid index, not ${key}.`);
    const prev = this.items[idx];
    if (isScalar(prev) && isScalarValue(value))
      prev.value = value;
    else
      this.items[idx] = value;
  }
  toJSON(_, ctx) {
    const seq2 = [];
    if (ctx?.onCreate)
      ctx.onCreate(seq2);
    let i = 0;
    for (const item of this.items)
      seq2.push(toJS(item, String(i++), ctx));
    return seq2;
  }
  toString(ctx, onComment, onChompKeep) {
    if (!ctx)
      return JSON.stringify(this);
    return stringifyCollection(this, ctx, {
      blockItemPrefix: "- ",
      flowChars: { start: "[", end: "]" },
      itemIndent: (ctx.indent || "") + "  ",
      onChompKeep,
      onComment
    });
  }
  static from(schema4, obj, ctx) {
    const { replacer } = ctx;
    const seq2 = new this(schema4);
    if (obj && Symbol.iterator in Object(obj)) {
      let i = 0;
      for (let it of obj) {
        if (typeof replacer === "function") {
          const key = obj instanceof Set ? it : String(i++);
          it = replacer.call(obj, key, it);
        }
        seq2.items.push(createNode(it, void 0, ctx));
      }
    }
    return seq2;
  }
};
function asItemIndex(key) {
  let idx = isScalar(key) ? key.value : key;
  if (idx && typeof idx === "string")
    idx = Number(idx);
  return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
}

// node_modules/yaml/browser/dist/schema/common/seq.js
var seq = {
  collection: "seq",
  default: true,
  nodeClass: YAMLSeq,
  tag: "tag:yaml.org,2002:seq",
  resolve(seq2, onError) {
    if (!isSeq(seq2))
      onError("Expected a sequence for this tag");
    return seq2;
  },
  createNode: (schema4, obj, ctx) => YAMLSeq.from(schema4, obj, ctx)
};

// node_modules/yaml/browser/dist/schema/common/string.js
var string2 = {
  identify: (value) => typeof value === "string",
  default: true,
  tag: "tag:yaml.org,2002:str",
  resolve: (str) => str,
  stringify(item, ctx, onComment, onChompKeep) {
    ctx = Object.assign({ actualString: true }, ctx);
    return stringifyString(item, ctx, onComment, onChompKeep);
  }
};

// node_modules/yaml/browser/dist/schema/common/null.js
var nullTag = {
  identify: (value) => value == null,
  createNode: () => new Scalar(null),
  default: true,
  tag: "tag:yaml.org,2002:null",
  test: /^(?:~|[Nn]ull|NULL)?$/,
  resolve: () => new Scalar(null),
  stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
};

// node_modules/yaml/browser/dist/schema/core/bool.js
var boolTag = {
  identify: (value) => typeof value === "boolean",
  default: true,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
  resolve: (str) => new Scalar(str[0] === "t" || str[0] === "T"),
  stringify({ source, value }, ctx) {
    if (source && boolTag.test.test(source)) {
      const sv = source[0] === "t" || source[0] === "T";
      if (value === sv)
        return source;
    }
    return value ? ctx.options.trueStr : ctx.options.falseStr;
  }
};

// node_modules/yaml/browser/dist/stringify/stringifyNumber.js
function stringifyNumber({ format, minFractionDigits, tag, value }) {
  if (typeof value === "bigint")
    return String(value);
  const num = typeof value === "number" ? value : Number(value);
  if (!isFinite(num))
    return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
  let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
  if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
    let i = n.indexOf(".");
    if (i < 0) {
      i = n.length;
      n += ".";
    }
    let d = minFractionDigits - (n.length - i - 1);
    while (d-- > 0)
      n += "0";
  }
  return n;
}

// node_modules/yaml/browser/dist/schema/core/float.js
var floatNaN = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
  resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  stringify: stringifyNumber
};
var floatExp = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  format: "EXP",
  test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
  resolve: (str) => parseFloat(str),
  stringify(node) {
    const num = Number(node.value);
    return isFinite(num) ? num.toExponential() : stringifyNumber(node);
  }
};
var float = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
  resolve(str) {
    const node = new Scalar(parseFloat(str));
    const dot = str.indexOf(".");
    if (dot !== -1 && str[str.length - 1] === "0")
      node.minFractionDigits = str.length - dot - 1;
    return node;
  },
  stringify: stringifyNumber
};

// node_modules/yaml/browser/dist/schema/core/int.js
var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
function intStringify(node, radix, prefix) {
  const { value } = node;
  if (intIdentify(value) && value >= 0)
    return prefix + value.toString(radix);
  return stringifyNumber(node);
}
var intOct = {
  identify: (value) => intIdentify(value) && value >= 0,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "OCT",
  test: /^0o[0-7]+$/,
  resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
  stringify: (node) => intStringify(node, 8, "0o")
};
var int = {
  identify: intIdentify,
  default: true,
  tag: "tag:yaml.org,2002:int",
  test: /^[-+]?[0-9]+$/,
  resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
  stringify: stringifyNumber
};
var intHex = {
  identify: (value) => intIdentify(value) && value >= 0,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "HEX",
  test: /^0x[0-9a-fA-F]+$/,
  resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
  stringify: (node) => intStringify(node, 16, "0x")
};

// node_modules/yaml/browser/dist/schema/core/schema.js
var schema = [
  map,
  seq,
  string2,
  nullTag,
  boolTag,
  intOct,
  int,
  intHex,
  floatNaN,
  floatExp,
  float
];

// node_modules/yaml/browser/dist/schema/json/schema.js
function intIdentify2(value) {
  return typeof value === "bigint" || Number.isInteger(value);
}
var stringifyJSON = ({ value }) => JSON.stringify(value);
var jsonScalars = [
  {
    identify: (value) => typeof value === "string",
    default: true,
    tag: "tag:yaml.org,2002:str",
    resolve: (str) => str,
    stringify: stringifyJSON
  },
  {
    identify: (value) => value == null,
    createNode: () => new Scalar(null),
    default: true,
    tag: "tag:yaml.org,2002:null",
    test: /^null$/,
    resolve: () => null,
    stringify: stringifyJSON
  },
  {
    identify: (value) => typeof value === "boolean",
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^true$|^false$/,
    resolve: (str) => str === "true",
    stringify: stringifyJSON
  },
  {
    identify: intIdentify2,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^-?(?:0|[1-9][0-9]*)$/,
    resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
    stringify: ({ value }) => intIdentify2(value) ? value.toString() : JSON.stringify(value)
  },
  {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
    resolve: (str) => parseFloat(str),
    stringify: stringifyJSON
  }
];
var jsonError = {
  default: true,
  tag: "",
  test: /^/,
  resolve(str, onError) {
    onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
    return str;
  }
};
var schema2 = [map, seq].concat(jsonScalars, jsonError);

// node_modules/yaml/browser/dist/schema/yaml-1.1/binary.js
var binary = {
  identify: (value) => value instanceof Uint8Array,
  // Buffer inherits from Uint8Array
  default: false,
  tag: "tag:yaml.org,2002:binary",
  /**
   * Returns a Buffer in node and an Uint8Array in browsers
   *
   * To use the resulting buffer as an image, you'll want to do something like:
   *
   *   const blob = new Blob([buffer], { type: 'image/jpeg' })
   *   document.querySelector('#photo').src = URL.createObjectURL(blob)
   */
  resolve(src, onError) {
    if (typeof atob === "function") {
      const str = atob(src.replace(/[\n\r]/g, ""));
      const buffer = new Uint8Array(str.length);
      for (let i = 0; i < str.length; ++i)
        buffer[i] = str.charCodeAt(i);
      return buffer;
    } else {
      onError("This environment does not support reading binary tags; either Buffer or atob is required");
      return src;
    }
  },
  stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
    if (!value)
      return "";
    const buf = value;
    let str;
    if (typeof btoa === "function") {
      let s = "";
      for (let i = 0; i < buf.length; ++i)
        s += String.fromCharCode(buf[i]);
      str = btoa(s);
    } else {
      throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
    }
    type ?? (type = Scalar.BLOCK_LITERAL);
    if (type !== Scalar.QUOTE_DOUBLE) {
      const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
      const n = Math.ceil(str.length / lineWidth);
      const lines = new Array(n);
      for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
        lines[i] = str.substr(o, lineWidth);
      }
      str = lines.join(type === Scalar.BLOCK_LITERAL ? "\n" : " ");
    }
    return stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
  }
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/pairs.js
function resolvePairs(seq2, onError) {
  if (isSeq(seq2)) {
    for (let i = 0; i < seq2.items.length; ++i) {
      let item = seq2.items[i];
      if (isPair(item))
        continue;
      else if (isMap(item)) {
        if (item.items.length > 1)
          onError("Each pair must have its own sequence indicator");
        const pair = item.items[0] || new Pair(new Scalar(null));
        if (item.commentBefore)
          pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
        if (item.comment) {
          const cn = pair.value ?? pair.key;
          cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
        }
        item = pair;
      }
      seq2.items[i] = isPair(item) ? item : new Pair(item);
    }
  } else
    onError("Expected a sequence for this tag");
  return seq2;
}
function createPairs(schema4, iterable, ctx) {
  const { replacer } = ctx;
  const pairs2 = new YAMLSeq(schema4);
  pairs2.tag = "tag:yaml.org,2002:pairs";
  let i = 0;
  if (iterable && Symbol.iterator in Object(iterable))
    for (let it of iterable) {
      if (typeof replacer === "function")
        it = replacer.call(iterable, String(i++), it);
      let key, value;
      if (Array.isArray(it)) {
        if (it.length === 2) {
          key = it[0];
          value = it[1];
        } else
          throw new TypeError(`Expected [key, value] tuple: ${it}`);
      } else if (it && it instanceof Object) {
        const keys = Object.keys(it);
        if (keys.length === 1) {
          key = keys[0];
          value = it[key];
        } else {
          throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
        }
      } else {
        key = it;
      }
      pairs2.items.push(createPair(key, value, ctx));
    }
  return pairs2;
}
var pairs = {
  collection: "seq",
  default: false,
  tag: "tag:yaml.org,2002:pairs",
  resolve: resolvePairs,
  createNode: createPairs
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/omap.js
var YAMLOMap = class _YAMLOMap extends YAMLSeq {
  constructor() {
    super();
    this.add = YAMLMap.prototype.add.bind(this);
    this.delete = YAMLMap.prototype.delete.bind(this);
    this.get = YAMLMap.prototype.get.bind(this);
    this.has = YAMLMap.prototype.has.bind(this);
    this.set = YAMLMap.prototype.set.bind(this);
    this.tag = _YAMLOMap.tag;
  }
  /**
   * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
   * but TypeScript won't allow widening the signature of a child method.
   */
  toJSON(_, ctx) {
    if (!ctx)
      return super.toJSON(_);
    const map2 = /* @__PURE__ */ new Map();
    if (ctx?.onCreate)
      ctx.onCreate(map2);
    for (const pair of this.items) {
      let key, value;
      if (isPair(pair)) {
        key = toJS(pair.key, "", ctx);
        value = toJS(pair.value, key, ctx);
      } else {
        key = toJS(pair, "", ctx);
      }
      if (map2.has(key))
        throw new Error("Ordered maps must not include duplicate keys");
      map2.set(key, value);
    }
    return map2;
  }
  static from(schema4, iterable, ctx) {
    const pairs2 = createPairs(schema4, iterable, ctx);
    const omap2 = new this();
    omap2.items = pairs2.items;
    return omap2;
  }
};
YAMLOMap.tag = "tag:yaml.org,2002:omap";
var omap = {
  collection: "seq",
  identify: (value) => value instanceof Map,
  nodeClass: YAMLOMap,
  default: false,
  tag: "tag:yaml.org,2002:omap",
  resolve(seq2, onError) {
    const pairs2 = resolvePairs(seq2, onError);
    const seenKeys = [];
    for (const { key } of pairs2.items) {
      if (isScalar(key)) {
        if (seenKeys.includes(key.value)) {
          onError(`Ordered maps must not include duplicate keys: ${key.value}`);
        } else {
          seenKeys.push(key.value);
        }
      }
    }
    return Object.assign(new YAMLOMap(), pairs2);
  },
  createNode: (schema4, iterable, ctx) => YAMLOMap.from(schema4, iterable, ctx)
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/bool.js
function boolStringify({ value, source }, ctx) {
  const boolObj = value ? trueTag : falseTag;
  if (source && boolObj.test.test(source))
    return source;
  return value ? ctx.options.trueStr : ctx.options.falseStr;
}
var trueTag = {
  identify: (value) => value === true,
  default: true,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
  resolve: () => new Scalar(true),
  stringify: boolStringify
};
var falseTag = {
  identify: (value) => value === false,
  default: true,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
  resolve: () => new Scalar(false),
  stringify: boolStringify
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/float.js
var floatNaN2 = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
  resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  stringify: stringifyNumber
};
var floatExp2 = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  format: "EXP",
  test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
  resolve: (str) => parseFloat(str.replace(/_/g, "")),
  stringify(node) {
    const num = Number(node.value);
    return isFinite(num) ? num.toExponential() : stringifyNumber(node);
  }
};
var float2 = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
  resolve(str) {
    const node = new Scalar(parseFloat(str.replace(/_/g, "")));
    const dot = str.indexOf(".");
    if (dot !== -1) {
      const f = str.substring(dot + 1).replace(/_/g, "");
      if (f[f.length - 1] === "0")
        node.minFractionDigits = f.length;
    }
    return node;
  },
  stringify: stringifyNumber
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/int.js
var intIdentify3 = (value) => typeof value === "bigint" || Number.isInteger(value);
function intResolve2(str, offset, radix, { intAsBigInt }) {
  const sign = str[0];
  if (sign === "-" || sign === "+")
    offset += 1;
  str = str.substring(offset).replace(/_/g, "");
  if (intAsBigInt) {
    switch (radix) {
      case 2:
        str = `0b${str}`;
        break;
      case 8:
        str = `0o${str}`;
        break;
      case 16:
        str = `0x${str}`;
        break;
    }
    const n2 = BigInt(str);
    return sign === "-" ? BigInt(-1) * n2 : n2;
  }
  const n = parseInt(str, radix);
  return sign === "-" ? -1 * n : n;
}
function intStringify2(node, radix, prefix) {
  const { value } = node;
  if (intIdentify3(value)) {
    const str = value.toString(radix);
    return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
  }
  return stringifyNumber(node);
}
var intBin = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "BIN",
  test: /^[-+]?0b[0-1_]+$/,
  resolve: (str, _onError, opt) => intResolve2(str, 2, 2, opt),
  stringify: (node) => intStringify2(node, 2, "0b")
};
var intOct2 = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "OCT",
  test: /^[-+]?0[0-7_]+$/,
  resolve: (str, _onError, opt) => intResolve2(str, 1, 8, opt),
  stringify: (node) => intStringify2(node, 8, "0")
};
var int2 = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  test: /^[-+]?[0-9][0-9_]*$/,
  resolve: (str, _onError, opt) => intResolve2(str, 0, 10, opt),
  stringify: stringifyNumber
};
var intHex2 = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "HEX",
  test: /^[-+]?0x[0-9a-fA-F_]+$/,
  resolve: (str, _onError, opt) => intResolve2(str, 2, 16, opt),
  stringify: (node) => intStringify2(node, 16, "0x")
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/set.js
var YAMLSet = class _YAMLSet extends YAMLMap {
  constructor(schema4) {
    super(schema4);
    this.tag = _YAMLSet.tag;
  }
  add(key) {
    let pair;
    if (isPair(key))
      pair = key;
    else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
      pair = new Pair(key.key, null);
    else
      pair = new Pair(key, null);
    const prev = findPair(this.items, pair.key);
    if (!prev)
      this.items.push(pair);
  }
  /**
   * If `keepPair` is `true`, returns the Pair matching `key`.
   * Otherwise, returns the value of that Pair's key.
   */
  get(key, keepPair) {
    const pair = findPair(this.items, key);
    return !keepPair && isPair(pair) ? isScalar(pair.key) ? pair.key.value : pair.key : pair;
  }
  set(key, value) {
    if (typeof value !== "boolean")
      throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
    const prev = findPair(this.items, key);
    if (prev && !value) {
      this.items.splice(this.items.indexOf(prev), 1);
    } else if (!prev && value) {
      this.items.push(new Pair(key));
    }
  }
  toJSON(_, ctx) {
    return super.toJSON(_, ctx, Set);
  }
  toString(ctx, onComment, onChompKeep) {
    if (!ctx)
      return JSON.stringify(this);
    if (this.hasAllNullValues(true))
      return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
    else
      throw new Error("Set items must all have null values");
  }
  static from(schema4, iterable, ctx) {
    const { replacer } = ctx;
    const set2 = new this(schema4);
    if (iterable && Symbol.iterator in Object(iterable))
      for (let value of iterable) {
        if (typeof replacer === "function")
          value = replacer.call(iterable, value, value);
        set2.items.push(createPair(value, null, ctx));
      }
    return set2;
  }
};
YAMLSet.tag = "tag:yaml.org,2002:set";
var set = {
  collection: "map",
  identify: (value) => value instanceof Set,
  nodeClass: YAMLSet,
  default: false,
  tag: "tag:yaml.org,2002:set",
  createNode: (schema4, iterable, ctx) => YAMLSet.from(schema4, iterable, ctx),
  resolve(map2, onError) {
    if (isMap(map2)) {
      if (map2.hasAllNullValues(true))
        return Object.assign(new YAMLSet(), map2);
      else
        onError("Set items must all have null values");
    } else
      onError("Expected a mapping for this tag");
    return map2;
  }
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/timestamp.js
function parseSexagesimal(str, asBigInt) {
  const sign = str[0];
  const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
  const num = (n) => asBigInt ? BigInt(n) : Number(n);
  const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
  return sign === "-" ? num(-1) * res : res;
}
function stringifySexagesimal(node) {
  let { value } = node;
  let num = (n) => n;
  if (typeof value === "bigint")
    num = (n) => BigInt(n);
  else if (isNaN(value) || !isFinite(value))
    return stringifyNumber(node);
  let sign = "";
  if (value < 0) {
    sign = "-";
    value *= num(-1);
  }
  const _60 = num(60);
  const parts = [value % _60];
  if (value < 60) {
    parts.unshift(0);
  } else {
    value = (value - parts[0]) / _60;
    parts.unshift(value % _60);
    if (value >= 60) {
      value = (value - parts[0]) / _60;
      parts.unshift(value);
    }
  }
  return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
}
var intTime = {
  identify: (value) => typeof value === "bigint" || Number.isInteger(value),
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "TIME",
  test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
  resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
  stringify: stringifySexagesimal
};
var floatTime = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  format: "TIME",
  test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
  resolve: (str) => parseSexagesimal(str, false),
  stringify: stringifySexagesimal
};
var timestamp = {
  identify: (value) => value instanceof Date,
  default: true,
  tag: "tag:yaml.org,2002:timestamp",
  // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
  // may be omitted altogether, resulting in a date format. In such a case, the time part is
  // assumed to be 00:00:00Z (start of day, UTC).
  test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
  resolve(str) {
    const match = str.match(timestamp.test);
    if (!match)
      throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
    const [, year, month, day, hour, minute, second] = match.map(Number);
    const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
    let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
    const tz = match[8];
    if (tz && tz !== "Z") {
      let d = parseSexagesimal(tz, false);
      if (Math.abs(d) < 30)
        d *= 60;
      date -= 6e4 * d;
    }
    return new Date(date);
  },
  stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/schema.js
var schema3 = [
  map,
  seq,
  string2,
  nullTag,
  trueTag,
  falseTag,
  intBin,
  intOct2,
  int2,
  intHex2,
  floatNaN2,
  floatExp2,
  float2,
  binary,
  merge,
  omap,
  pairs,
  set,
  intTime,
  floatTime,
  timestamp
];

// node_modules/yaml/browser/dist/schema/tags.js
var schemas = /* @__PURE__ */ new Map([
  ["core", schema],
  ["failsafe", [map, seq, string2]],
  ["json", schema2],
  ["yaml11", schema3],
  ["yaml-1.1", schema3]
]);
var tagsByName = {
  binary,
  bool: boolTag,
  float,
  floatExp,
  floatNaN,
  floatTime,
  int,
  intHex,
  intOct,
  intTime,
  map,
  merge,
  null: nullTag,
  omap,
  pairs,
  seq,
  set,
  timestamp
};
var coreKnownTags = {
  "tag:yaml.org,2002:binary": binary,
  "tag:yaml.org,2002:merge": merge,
  "tag:yaml.org,2002:omap": omap,
  "tag:yaml.org,2002:pairs": pairs,
  "tag:yaml.org,2002:set": set,
  "tag:yaml.org,2002:timestamp": timestamp
};
function getTags(customTags, schemaName, addMergeTag) {
  const schemaTags = schemas.get(schemaName);
  if (schemaTags && !customTags) {
    return addMergeTag && !schemaTags.includes(merge) ? schemaTags.concat(merge) : schemaTags.slice();
  }
  let tags = schemaTags;
  if (!tags) {
    if (Array.isArray(customTags))
      tags = [];
    else {
      const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
      throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
    }
  }
  if (Array.isArray(customTags)) {
    for (const tag of customTags)
      tags = tags.concat(tag);
  } else if (typeof customTags === "function") {
    tags = customTags(tags.slice());
  }
  if (addMergeTag)
    tags = tags.concat(merge);
  return tags.reduce((tags2, tag) => {
    const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
    if (!tagObj) {
      const tagName = JSON.stringify(tag);
      const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
      throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
    }
    if (!tags2.includes(tagObj))
      tags2.push(tagObj);
    return tags2;
  }, []);
}

// node_modules/yaml/browser/dist/schema/Schema.js
var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
var Schema = class _Schema {
  constructor({ compat, customTags, merge: merge2, resolveKnownTags, schema: schema4, sortMapEntries, toStringDefaults }) {
    this.compat = Array.isArray(compat) ? getTags(compat, "compat") : compat ? getTags(null, compat) : null;
    this.name = typeof schema4 === "string" && schema4 || "core";
    this.knownTags = resolveKnownTags ? coreKnownTags : {};
    this.tags = getTags(customTags, this.name, merge2);
    this.toStringOptions = toStringDefaults ?? null;
    Object.defineProperty(this, MAP, { value: map });
    Object.defineProperty(this, SCALAR, { value: string2 });
    Object.defineProperty(this, SEQ, { value: seq });
    this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
  }
  clone() {
    const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
    copy.tags = this.tags.slice();
    return copy;
  }
};

// node_modules/yaml/browser/dist/stringify/stringifyDocument.js
function stringifyDocument(doc, options) {
  const lines = [];
  let hasDirectives = options.directives === true;
  if (options.directives !== false && doc.directives) {
    const dir = doc.directives.toString(doc);
    if (dir) {
      lines.push(dir);
      hasDirectives = true;
    } else if (doc.directives.docStart)
      hasDirectives = true;
  }
  if (hasDirectives)
    lines.push("---");
  const ctx = createStringifyContext(doc, options);
  const { commentString } = ctx.options;
  if (doc.commentBefore) {
    if (lines.length !== 1)
      lines.unshift("");
    const cs = commentString(doc.commentBefore);
    lines.unshift(indentComment(cs, ""));
  }
  let chompKeep = false;
  let contentComment = null;
  if (doc.contents) {
    if (isNode(doc.contents)) {
      if (doc.contents.spaceBefore && hasDirectives)
        lines.push("");
      if (doc.contents.commentBefore) {
        const cs = commentString(doc.contents.commentBefore);
        lines.push(indentComment(cs, ""));
      }
      ctx.forceBlockIndent = !!doc.comment;
      contentComment = doc.contents.comment;
    }
    const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
    let body = stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
    if (contentComment)
      body += lineComment(body, "", commentString(contentComment));
    if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
      lines[lines.length - 1] = `--- ${body}`;
    } else
      lines.push(body);
  } else {
    lines.push(stringify(doc.contents, ctx));
  }
  if (doc.directives?.docEnd) {
    if (doc.comment) {
      const cs = commentString(doc.comment);
      if (cs.includes("\n")) {
        lines.push("...");
        lines.push(indentComment(cs, ""));
      } else {
        lines.push(`... ${cs}`);
      }
    } else {
      lines.push("...");
    }
  } else {
    let dc = doc.comment;
    if (dc && chompKeep)
      dc = dc.replace(/^\n+/, "");
    if (dc) {
      if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
        lines.push("");
      lines.push(indentComment(commentString(dc), ""));
    }
  }
  return lines.join("\n") + "\n";
}

// node_modules/yaml/browser/dist/doc/Document.js
var Document = class _Document {
  constructor(value, replacer, options) {
    this.commentBefore = null;
    this.comment = null;
    this.errors = [];
    this.warnings = [];
    Object.defineProperty(this, NODE_TYPE, { value: DOC });
    let _replacer = null;
    if (typeof replacer === "function" || Array.isArray(replacer)) {
      _replacer = replacer;
    } else if (options === void 0 && replacer) {
      options = replacer;
      replacer = void 0;
    }
    const opt = Object.assign({
      intAsBigInt: false,
      keepSourceTokens: false,
      logLevel: "warn",
      prettyErrors: true,
      strict: true,
      stringKeys: false,
      uniqueKeys: true,
      version: "1.2"
    }, options);
    this.options = opt;
    let { version } = opt;
    if (options?._directives) {
      this.directives = options._directives.atDocument();
      if (this.directives.yaml.explicit)
        version = this.directives.yaml.version;
    } else
      this.directives = new Directives({ version });
    this.setSchema(version, options);
    this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
  }
  /**
   * Create a deep copy of this Document and its contents.
   *
   * Custom Node values that inherit from `Object` still refer to their original instances.
   */
  clone() {
    const copy = Object.create(_Document.prototype, {
      [NODE_TYPE]: { value: DOC }
    });
    copy.commentBefore = this.commentBefore;
    copy.comment = this.comment;
    copy.errors = this.errors.slice();
    copy.warnings = this.warnings.slice();
    copy.options = Object.assign({}, this.options);
    if (this.directives)
      copy.directives = this.directives.clone();
    copy.schema = this.schema.clone();
    copy.contents = isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
    if (this.range)
      copy.range = this.range.slice();
    return copy;
  }
  /** Adds a value to the document. */
  add(value) {
    if (assertCollection(this.contents))
      this.contents.add(value);
  }
  /** Adds a value to the document. */
  addIn(path, value) {
    if (assertCollection(this.contents))
      this.contents.addIn(path, value);
  }
  /**
   * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
   *
   * If `node` already has an anchor, `name` is ignored.
   * Otherwise, the `node.anchor` value will be set to `name`,
   * or if an anchor with that name is already present in the document,
   * `name` will be used as a prefix for a new unique anchor.
   * If `name` is undefined, the generated anchor will use 'a' as a prefix.
   */
  createAlias(node, name) {
    if (!node.anchor) {
      const prev = anchorNames(this);
      node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      !name || prev.has(name) ? findNewAnchor(name || "a", prev) : name;
    }
    return new Alias(node.anchor);
  }
  createNode(value, replacer, options) {
    let _replacer = void 0;
    if (typeof replacer === "function") {
      value = replacer.call({ "": value }, "", value);
      _replacer = replacer;
    } else if (Array.isArray(replacer)) {
      const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
      const asStr = replacer.filter(keyToStr).map(String);
      if (asStr.length > 0)
        replacer = replacer.concat(asStr);
      _replacer = replacer;
    } else if (options === void 0 && replacer) {
      options = replacer;
      replacer = void 0;
    }
    const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
    const { onAnchor, setAnchors, sourceObjects } = createNodeAnchors(
      this,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      anchorPrefix || "a"
    );
    const ctx = {
      aliasDuplicateObjects: aliasDuplicateObjects ?? true,
      keepUndefined: keepUndefined ?? false,
      onAnchor,
      onTagObj,
      replacer: _replacer,
      schema: this.schema,
      sourceObjects
    };
    const node = createNode(value, tag, ctx);
    if (flow && isCollection(node))
      node.flow = true;
    setAnchors();
    return node;
  }
  /**
   * Convert a key and a value into a `Pair` using the current schema,
   * recursively wrapping all values as `Scalar` or `Collection` nodes.
   */
  createPair(key, value, options = {}) {
    const k = this.createNode(key, null, options);
    const v = this.createNode(value, null, options);
    return new Pair(k, v);
  }
  /**
   * Removes a value from the document.
   * @returns `true` if the item was found and removed.
   */
  delete(key) {
    return assertCollection(this.contents) ? this.contents.delete(key) : false;
  }
  /**
   * Removes a value from the document.
   * @returns `true` if the item was found and removed.
   */
  deleteIn(path) {
    if (isEmptyPath(path)) {
      if (this.contents == null)
        return false;
      this.contents = null;
      return true;
    }
    return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
  }
  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  get(key, keepScalar) {
    return isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
  }
  /**
   * Returns item at `path`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(path, keepScalar) {
    if (isEmptyPath(path))
      return !keepScalar && isScalar(this.contents) ? this.contents.value : this.contents;
    return isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
  }
  /**
   * Checks if the document includes a value with the key `key`.
   */
  has(key) {
    return isCollection(this.contents) ? this.contents.has(key) : false;
  }
  /**
   * Checks if the document includes a value at `path`.
   */
  hasIn(path) {
    if (isEmptyPath(path))
      return this.contents !== void 0;
    return isCollection(this.contents) ? this.contents.hasIn(path) : false;
  }
  /**
   * Sets a value in this document. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  set(key, value) {
    if (this.contents == null) {
      this.contents = collectionFromPath(this.schema, [key], value);
    } else if (assertCollection(this.contents)) {
      this.contents.set(key, value);
    }
  }
  /**
   * Sets a value in this document. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(path, value) {
    if (isEmptyPath(path)) {
      this.contents = value;
    } else if (this.contents == null) {
      this.contents = collectionFromPath(this.schema, Array.from(path), value);
    } else if (assertCollection(this.contents)) {
      this.contents.setIn(path, value);
    }
  }
  /**
   * Change the YAML version and schema used by the document.
   * A `null` version disables support for directives, explicit tags, anchors, and aliases.
   * It also requires the `schema` option to be given as a `Schema` instance value.
   *
   * Overrides all previously set schema options.
   */
  setSchema(version, options = {}) {
    if (typeof version === "number")
      version = String(version);
    let opt;
    switch (version) {
      case "1.1":
        if (this.directives)
          this.directives.yaml.version = "1.1";
        else
          this.directives = new Directives({ version: "1.1" });
        opt = { resolveKnownTags: false, schema: "yaml-1.1" };
        break;
      case "1.2":
      case "next":
        if (this.directives)
          this.directives.yaml.version = version;
        else
          this.directives = new Directives({ version });
        opt = { resolveKnownTags: true, schema: "core" };
        break;
      case null:
        if (this.directives)
          delete this.directives;
        opt = null;
        break;
      default: {
        const sv = JSON.stringify(version);
        throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
      }
    }
    if (options.schema instanceof Object)
      this.schema = options.schema;
    else if (opt)
      this.schema = new Schema(Object.assign(opt, options));
    else
      throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
  }
  // json & jsonArg are only used from toJSON()
  toJS({ json: json3, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
    const ctx = {
      anchors: /* @__PURE__ */ new Map(),
      doc: this,
      keep: !json3,
      mapAsMap: mapAsMap === true,
      mapKeyWarned: false,
      maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
    };
    const res = toJS(this.contents, jsonArg ?? "", ctx);
    if (typeof onAnchor === "function")
      for (const { count, res: res2 } of ctx.anchors.values())
        onAnchor(res2, count);
    return typeof reviver === "function" ? applyReviver(reviver, { "": res }, "", res) : res;
  }
  /**
   * A JSON representation of the document `contents`.
   *
   * @param jsonArg Used by `JSON.stringify` to indicate the array index or
   *   property name.
   */
  toJSON(jsonArg, onAnchor) {
    return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
  }
  /** A YAML representation of the document. */
  toString(options = {}) {
    if (this.errors.length > 0)
      throw new Error("Document with errors cannot be stringified");
    if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
      const s = JSON.stringify(options.indent);
      throw new Error(`"indent" option must be a positive integer, not ${s}`);
    }
    return stringifyDocument(this, options);
  }
};
function assertCollection(contents) {
  if (isCollection(contents))
    return true;
  throw new Error("Expected a YAML collection as document contents");
}

// node_modules/yaml/browser/dist/errors.js
var YAMLError = class extends Error {
  constructor(name, pos, code, message) {
    super();
    this.name = name;
    this.code = code;
    this.message = message;
    this.pos = pos;
  }
};
var YAMLParseError = class extends YAMLError {
  constructor(pos, code, message) {
    super("YAMLParseError", pos, code, message);
  }
};
var YAMLWarning = class extends YAMLError {
  constructor(pos, code, message) {
    super("YAMLWarning", pos, code, message);
  }
};
var prettifyError = (src, lc) => (error) => {
  if (error.pos[0] === -1)
    return;
  error.linePos = error.pos.map((pos) => lc.linePos(pos));
  const { line, col } = error.linePos[0];
  error.message += ` at line ${line}, column ${col}`;
  let ci = col - 1;
  let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
  if (ci >= 60 && lineStr.length > 80) {
    const trimStart = Math.min(ci - 39, lineStr.length - 79);
    lineStr = "\u2026" + lineStr.substring(trimStart);
    ci -= trimStart - 1;
  }
  if (lineStr.length > 80)
    lineStr = lineStr.substring(0, 79) + "\u2026";
  if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
    let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
    if (prev.length > 80)
      prev = prev.substring(0, 79) + "\u2026\n";
    lineStr = prev + lineStr;
  }
  if (/[^ ]/.test(lineStr)) {
    let count = 1;
    const end = error.linePos[1];
    if (end?.line === line && end.col > col) {
      count = Math.max(1, Math.min(end.col - col, 80 - ci));
    }
    const pointer = " ".repeat(ci) + "^".repeat(count);
    error.message += `:

${lineStr}
${pointer}
`;
  }
};

// node_modules/yaml/browser/dist/compose/resolve-props.js
function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
  let spaceBefore = false;
  let atNewline = startOnNewline;
  let hasSpace = startOnNewline;
  let comment = "";
  let commentSep = "";
  let hasNewline = false;
  let reqSpace = false;
  let tab = null;
  let anchor = null;
  let tag = null;
  let newlineAfterProp = null;
  let comma = null;
  let found = null;
  let start = null;
  for (const token of tokens) {
    if (reqSpace) {
      if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
        onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      reqSpace = false;
    }
    if (tab) {
      if (atNewline && token.type !== "comment" && token.type !== "newline") {
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      }
      tab = null;
    }
    switch (token.type) {
      case "space":
        if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
          tab = token;
        }
        hasSpace = true;
        break;
      case "comment": {
        if (!hasSpace)
          onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
        const cb = token.source.substring(1) || " ";
        if (!comment)
          comment = cb;
        else
          comment += commentSep + cb;
        commentSep = "";
        atNewline = false;
        break;
      }
      case "newline":
        if (atNewline) {
          if (comment)
            comment += token.source;
          else if (!found || indicator !== "seq-item-ind")
            spaceBefore = true;
        } else
          commentSep += token.source;
        atNewline = true;
        hasNewline = true;
        if (anchor || tag)
          newlineAfterProp = token;
        hasSpace = true;
        break;
      case "anchor":
        if (anchor)
          onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
        if (token.source.endsWith(":"))
          onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
        anchor = token;
        start ?? (start = token.offset);
        atNewline = false;
        hasSpace = false;
        reqSpace = true;
        break;
      case "tag": {
        if (tag)
          onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
        tag = token;
        start ?? (start = token.offset);
        atNewline = false;
        hasSpace = false;
        reqSpace = true;
        break;
      }
      case indicator:
        if (anchor || tag)
          onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
        if (found)
          onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
        found = token;
        atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
        hasSpace = false;
        break;
      case "comma":
        if (flow) {
          if (comma)
            onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
          comma = token;
          atNewline = false;
          hasSpace = false;
          break;
        }
      // else fallthrough
      default:
        onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
        atNewline = false;
        hasSpace = false;
    }
  }
  const last = tokens[tokens.length - 1];
  const end = last ? last.offset + last.source.length : offset;
  if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
    onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
  }
  if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
    onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
  return {
    comma,
    found,
    spaceBefore,
    comment,
    hasNewline,
    anchor,
    tag,
    newlineAfterProp,
    end,
    start: start ?? end
  };
}

// node_modules/yaml/browser/dist/compose/util-contains-newline.js
function containsNewline(key) {
  if (!key)
    return null;
  switch (key.type) {
    case "alias":
    case "scalar":
    case "double-quoted-scalar":
    case "single-quoted-scalar":
      if (key.source.includes("\n"))
        return true;
      if (key.end) {
        for (const st of key.end)
          if (st.type === "newline")
            return true;
      }
      return false;
    case "flow-collection":
      for (const it of key.items) {
        for (const st of it.start)
          if (st.type === "newline")
            return true;
        if (it.sep) {
          for (const st of it.sep)
            if (st.type === "newline")
              return true;
        }
        if (containsNewline(it.key) || containsNewline(it.value))
          return true;
      }
      return false;
    default:
      return true;
  }
}

// node_modules/yaml/browser/dist/compose/util-flow-indent-check.js
function flowIndentCheck(indent, fc, onError) {
  if (fc?.type === "flow-collection") {
    const end = fc.end[0];
    if (end.indent === indent && (end.source === "]" || end.source === "}") && containsNewline(fc)) {
      const msg = "Flow end indicator should be more indented than parent";
      onError(end, "BAD_INDENT", msg, true);
    }
  }
}

// node_modules/yaml/browser/dist/compose/util-map-includes.js
function mapIncludes(ctx, items, search) {
  const { uniqueKeys } = ctx.options;
  if (uniqueKeys === false)
    return false;
  const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || isScalar(a) && isScalar(b) && a.value === b.value;
  return items.some((pair) => isEqual(pair.key, search));
}

// node_modules/yaml/browser/dist/compose/resolve-block-map.js
var startColMsg = "All mapping items must start at the same column";
function resolveBlockMap({ composeNode: composeNode2, composeEmptyNode: composeEmptyNode2 }, ctx, bm, onError, tag) {
  const NodeClass = tag?.nodeClass ?? YAMLMap;
  const map2 = new NodeClass(ctx.schema);
  if (ctx.atRoot)
    ctx.atRoot = false;
  let offset = bm.offset;
  let commentEnd = null;
  for (const collItem of bm.items) {
    const { start, key, sep, value } = collItem;
    const keyProps = resolveProps(start, {
      indicator: "explicit-key-ind",
      next: key ?? sep?.[0],
      offset,
      onError,
      parentIndent: bm.indent,
      startOnNewline: true
    });
    const implicitKey = !keyProps.found;
    if (implicitKey) {
      if (key) {
        if (key.type === "block-seq")
          onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
        else if ("indent" in key && key.indent !== bm.indent)
          onError(offset, "BAD_INDENT", startColMsg);
      }
      if (!keyProps.anchor && !keyProps.tag && !sep) {
        commentEnd = keyProps.end;
        if (keyProps.comment) {
          if (map2.comment)
            map2.comment += "\n" + keyProps.comment;
          else
            map2.comment = keyProps.comment;
        }
        continue;
      }
      if (keyProps.newlineAfterProp || containsNewline(key)) {
        onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
      }
    } else if (keyProps.found?.indent !== bm.indent) {
      onError(offset, "BAD_INDENT", startColMsg);
    }
    ctx.atKey = true;
    const keyStart = keyProps.end;
    const keyNode = key ? composeNode2(ctx, key, keyProps, onError) : composeEmptyNode2(ctx, keyStart, start, null, keyProps, onError);
    if (ctx.schema.compat)
      flowIndentCheck(bm.indent, key, onError);
    ctx.atKey = false;
    if (mapIncludes(ctx, map2.items, keyNode))
      onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
    const valueProps = resolveProps(sep ?? [], {
      indicator: "map-value-ind",
      next: value,
      offset: keyNode.range[2],
      onError,
      parentIndent: bm.indent,
      startOnNewline: !key || key.type === "block-scalar"
    });
    offset = valueProps.end;
    if (valueProps.found) {
      if (implicitKey) {
        if (value?.type === "block-map" && !valueProps.hasNewline)
          onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
        if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
          onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
      }
      const valueNode = value ? composeNode2(ctx, value, valueProps, onError) : composeEmptyNode2(ctx, offset, sep, null, valueProps, onError);
      if (ctx.schema.compat)
        flowIndentCheck(bm.indent, value, onError);
      offset = valueNode.range[2];
      const pair = new Pair(keyNode, valueNode);
      if (ctx.options.keepSourceTokens)
        pair.srcToken = collItem;
      map2.items.push(pair);
    } else {
      if (implicitKey)
        onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
      if (valueProps.comment) {
        if (keyNode.comment)
          keyNode.comment += "\n" + valueProps.comment;
        else
          keyNode.comment = valueProps.comment;
      }
      const pair = new Pair(keyNode);
      if (ctx.options.keepSourceTokens)
        pair.srcToken = collItem;
      map2.items.push(pair);
    }
  }
  if (commentEnd && commentEnd < offset)
    onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
  map2.range = [bm.offset, offset, commentEnd ?? offset];
  return map2;
}

// node_modules/yaml/browser/dist/compose/resolve-block-seq.js
function resolveBlockSeq({ composeNode: composeNode2, composeEmptyNode: composeEmptyNode2 }, ctx, bs, onError, tag) {
  const NodeClass = tag?.nodeClass ?? YAMLSeq;
  const seq2 = new NodeClass(ctx.schema);
  if (ctx.atRoot)
    ctx.atRoot = false;
  if (ctx.atKey)
    ctx.atKey = false;
  let offset = bs.offset;
  let commentEnd = null;
  for (const { start, value } of bs.items) {
    const props = resolveProps(start, {
      indicator: "seq-item-ind",
      next: value,
      offset,
      onError,
      parentIndent: bs.indent,
      startOnNewline: true
    });
    if (!props.found) {
      if (props.anchor || props.tag || value) {
        if (value?.type === "block-seq")
          onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
        else
          onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
      } else {
        commentEnd = props.end;
        if (props.comment)
          seq2.comment = props.comment;
        continue;
      }
    }
    const node = value ? composeNode2(ctx, value, props, onError) : composeEmptyNode2(ctx, props.end, start, null, props, onError);
    if (ctx.schema.compat)
      flowIndentCheck(bs.indent, value, onError);
    offset = node.range[2];
    seq2.items.push(node);
  }
  seq2.range = [bs.offset, offset, commentEnd ?? offset];
  return seq2;
}

// node_modules/yaml/browser/dist/compose/resolve-end.js
function resolveEnd(end, offset, reqSpace, onError) {
  let comment = "";
  if (end) {
    let hasSpace = false;
    let sep = "";
    for (const token of end) {
      const { source, type } = token;
      switch (type) {
        case "space":
          hasSpace = true;
          break;
        case "comment": {
          if (reqSpace && !hasSpace)
            onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
          const cb = source.substring(1) || " ";
          if (!comment)
            comment = cb;
          else
            comment += sep + cb;
          sep = "";
          break;
        }
        case "newline":
          if (comment)
            sep += source;
          hasSpace = true;
          break;
        default:
          onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
      }
      offset += source.length;
    }
  }
  return { comment, offset };
}

// node_modules/yaml/browser/dist/compose/resolve-flow-collection.js
var blockMsg = "Block collections are not allowed within flow collections";
var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
function resolveFlowCollection({ composeNode: composeNode2, composeEmptyNode: composeEmptyNode2 }, ctx, fc, onError, tag) {
  const isMap2 = fc.start.source === "{";
  const fcName = isMap2 ? "flow map" : "flow sequence";
  const NodeClass = tag?.nodeClass ?? (isMap2 ? YAMLMap : YAMLSeq);
  const coll = new NodeClass(ctx.schema);
  coll.flow = true;
  const atRoot = ctx.atRoot;
  if (atRoot)
    ctx.atRoot = false;
  if (ctx.atKey)
    ctx.atKey = false;
  let offset = fc.offset + fc.start.source.length;
  for (let i = 0; i < fc.items.length; ++i) {
    const collItem = fc.items[i];
    const { start, key, sep, value } = collItem;
    const props = resolveProps(start, {
      flow: fcName,
      indicator: "explicit-key-ind",
      next: key ?? sep?.[0],
      offset,
      onError,
      parentIndent: fc.indent,
      startOnNewline: false
    });
    if (!props.found) {
      if (!props.anchor && !props.tag && !sep && !value) {
        if (i === 0 && props.comma)
          onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        else if (i < fc.items.length - 1)
          onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
        if (props.comment) {
          if (coll.comment)
            coll.comment += "\n" + props.comment;
          else
            coll.comment = props.comment;
        }
        offset = props.end;
        continue;
      }
      if (!isMap2 && ctx.options.strict && containsNewline(key))
        onError(
          key,
          // checked by containsNewline()
          "MULTILINE_IMPLICIT_KEY",
          "Implicit keys of flow sequence pairs need to be on a single line"
        );
    }
    if (i === 0) {
      if (props.comma)
        onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
    } else {
      if (!props.comma)
        onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
      if (props.comment) {
        let prevItemComment = "";
        loop: for (const st of start) {
          switch (st.type) {
            case "comma":
            case "space":
              break;
            case "comment":
              prevItemComment = st.source.substring(1);
              break loop;
            default:
              break loop;
          }
        }
        if (prevItemComment) {
          let prev = coll.items[coll.items.length - 1];
          if (isPair(prev))
            prev = prev.value ?? prev.key;
          if (prev.comment)
            prev.comment += "\n" + prevItemComment;
          else
            prev.comment = prevItemComment;
          props.comment = props.comment.substring(prevItemComment.length + 1);
        }
      }
    }
    if (!isMap2 && !sep && !props.found) {
      const valueNode = value ? composeNode2(ctx, value, props, onError) : composeEmptyNode2(ctx, props.end, sep, null, props, onError);
      coll.items.push(valueNode);
      offset = valueNode.range[2];
      if (isBlock(value))
        onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
    } else {
      ctx.atKey = true;
      const keyStart = props.end;
      const keyNode = key ? composeNode2(ctx, key, props, onError) : composeEmptyNode2(ctx, keyStart, start, null, props, onError);
      if (isBlock(key))
        onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
      ctx.atKey = false;
      const valueProps = resolveProps(sep ?? [], {
        flow: fcName,
        indicator: "map-value-ind",
        next: value,
        offset: keyNode.range[2],
        onError,
        parentIndent: fc.indent,
        startOnNewline: false
      });
      if (valueProps.found) {
        if (!isMap2 && !props.found && ctx.options.strict) {
          if (sep)
            for (const st of sep) {
              if (st === valueProps.found)
                break;
              if (st.type === "newline") {
                onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                break;
              }
            }
          if (props.start < valueProps.found.offset - 1024)
            onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
        }
      } else if (value) {
        if ("source" in value && value.source?.[0] === ":")
          onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
        else
          onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
      }
      const valueNode = value ? composeNode2(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode2(ctx, valueProps.end, sep, null, valueProps, onError) : null;
      if (valueNode) {
        if (isBlock(value))
          onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
      } else if (valueProps.comment) {
        if (keyNode.comment)
          keyNode.comment += "\n" + valueProps.comment;
        else
          keyNode.comment = valueProps.comment;
      }
      const pair = new Pair(keyNode, valueNode);
      if (ctx.options.keepSourceTokens)
        pair.srcToken = collItem;
      if (isMap2) {
        const map2 = coll;
        if (mapIncludes(ctx, map2.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        map2.items.push(pair);
      } else {
        const map2 = new YAMLMap(ctx.schema);
        map2.flow = true;
        map2.items.push(pair);
        const endRange = (valueNode ?? keyNode).range;
        map2.range = [keyNode.range[0], endRange[1], endRange[2]];
        coll.items.push(map2);
      }
      offset = valueNode ? valueNode.range[2] : valueProps.end;
    }
  }
  const expectedEnd = isMap2 ? "}" : "]";
  const [ce, ...ee] = fc.end;
  let cePos = offset;
  if (ce?.source === expectedEnd)
    cePos = ce.offset + ce.source.length;
  else {
    const name = fcName[0].toUpperCase() + fcName.substring(1);
    const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
    onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
    if (ce && ce.source.length !== 1)
      ee.unshift(ce);
  }
  if (ee.length > 0) {
    const end = resolveEnd(ee, cePos, ctx.options.strict, onError);
    if (end.comment) {
      if (coll.comment)
        coll.comment += "\n" + end.comment;
      else
        coll.comment = end.comment;
    }
    coll.range = [fc.offset, cePos, end.offset];
  } else {
    coll.range = [fc.offset, cePos, cePos];
  }
  return coll;
}

// node_modules/yaml/browser/dist/compose/compose-collection.js
function resolveCollection(CN2, ctx, token, onError, tagName, tag) {
  const coll = token.type === "block-map" ? resolveBlockMap(CN2, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq(CN2, ctx, token, onError, tag) : resolveFlowCollection(CN2, ctx, token, onError, tag);
  const Coll = coll.constructor;
  if (tagName === "!" || tagName === Coll.tagName) {
    coll.tag = Coll.tagName;
    return coll;
  }
  if (tagName)
    coll.tag = tagName;
  return coll;
}
function composeCollection(CN2, ctx, token, props, onError) {
  const tagToken = props.tag;
  const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
  if (token.type === "block-seq") {
    const { anchor, newlineAfterProp: nl } = props;
    const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
    if (lastProp && (!nl || nl.offset < lastProp.offset)) {
      const message = "Missing newline after block sequence props";
      onError(lastProp, "MISSING_CHAR", message);
    }
  }
  const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
  if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.tagName && expType === "seq") {
    return resolveCollection(CN2, ctx, token, onError, tagName);
  }
  let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
  if (!tag) {
    const kt = ctx.schema.knownTags[tagName];
    if (kt?.collection === expType) {
      ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
      tag = kt;
    } else {
      if (kt) {
        onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
      } else {
        onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
      }
      return resolveCollection(CN2, ctx, token, onError, tagName);
    }
  }
  const coll = resolveCollection(CN2, ctx, token, onError, tagName, tag);
  const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
  const node = isNode(res) ? res : new Scalar(res);
  node.range = coll.range;
  node.tag = tagName;
  if (tag?.format)
    node.format = tag.format;
  return node;
}

// node_modules/yaml/browser/dist/compose/resolve-block-scalar.js
function resolveBlockScalar(ctx, scalar, onError) {
  const start = scalar.offset;
  const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
  if (!header)
    return { value: "", type: null, comment: "", range: [start, start, start] };
  const type = header.mode === ">" ? Scalar.BLOCK_FOLDED : Scalar.BLOCK_LITERAL;
  const lines = scalar.source ? splitLines(scalar.source) : [];
  let chompStart = lines.length;
  for (let i = lines.length - 1; i >= 0; --i) {
    const content = lines[i][1];
    if (content === "" || content === "\r")
      chompStart = i;
    else
      break;
  }
  if (chompStart === 0) {
    const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
    let end2 = start + header.length;
    if (scalar.source)
      end2 += scalar.source.length;
    return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
  }
  let trimIndent = scalar.indent + header.indent;
  let offset = scalar.offset + header.length;
  let contentStart = 0;
  for (let i = 0; i < chompStart; ++i) {
    const [indent, content] = lines[i];
    if (content === "" || content === "\r") {
      if (header.indent === 0 && indent.length > trimIndent)
        trimIndent = indent.length;
    } else {
      if (indent.length < trimIndent) {
        const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
        onError(offset + indent.length, "MISSING_CHAR", message);
      }
      if (header.indent === 0)
        trimIndent = indent.length;
      contentStart = i;
      if (trimIndent === 0 && !ctx.atRoot) {
        const message = "Block scalar values in collections must be indented";
        onError(offset, "BAD_INDENT", message);
      }
      break;
    }
    offset += indent.length + content.length + 1;
  }
  for (let i = lines.length - 1; i >= chompStart; --i) {
    if (lines[i][0].length > trimIndent)
      chompStart = i + 1;
  }
  let value = "";
  let sep = "";
  let prevMoreIndented = false;
  for (let i = 0; i < contentStart; ++i)
    value += lines[i][0].slice(trimIndent) + "\n";
  for (let i = contentStart; i < chompStart; ++i) {
    let [indent, content] = lines[i];
    offset += indent.length + content.length + 1;
    const crlf = content[content.length - 1] === "\r";
    if (crlf)
      content = content.slice(0, -1);
    if (content && indent.length < trimIndent) {
      const src = header.indent ? "explicit indentation indicator" : "first line";
      const message = `Block scalar lines must not be less indented than their ${src}`;
      onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
      indent = "";
    }
    if (type === Scalar.BLOCK_LITERAL) {
      value += sep + indent.slice(trimIndent) + content;
      sep = "\n";
    } else if (indent.length > trimIndent || content[0] === "	") {
      if (sep === " ")
        sep = "\n";
      else if (!prevMoreIndented && sep === "\n")
        sep = "\n\n";
      value += sep + indent.slice(trimIndent) + content;
      sep = "\n";
      prevMoreIndented = true;
    } else if (content === "") {
      if (sep === "\n")
        value += "\n";
      else
        sep = "\n";
    } else {
      value += sep + content;
      sep = " ";
      prevMoreIndented = false;
    }
  }
  switch (header.chomp) {
    case "-":
      break;
    case "+":
      for (let i = chompStart; i < lines.length; ++i)
        value += "\n" + lines[i][0].slice(trimIndent);
      if (value[value.length - 1] !== "\n")
        value += "\n";
      break;
    default:
      value += "\n";
  }
  const end = start + header.length + scalar.source.length;
  return { value, type, comment: header.comment, range: [start, end, end] };
}
function parseBlockScalarHeader({ offset, props }, strict, onError) {
  if (props[0].type !== "block-scalar-header") {
    onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
    return null;
  }
  const { source } = props[0];
  const mode = source[0];
  let indent = 0;
  let chomp = "";
  let error = -1;
  for (let i = 1; i < source.length; ++i) {
    const ch = source[i];
    if (!chomp && (ch === "-" || ch === "+"))
      chomp = ch;
    else {
      const n = Number(ch);
      if (!indent && n)
        indent = n;
      else if (error === -1)
        error = offset + i;
    }
  }
  if (error !== -1)
    onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
  let hasSpace = false;
  let comment = "";
  let length = source.length;
  for (let i = 1; i < props.length; ++i) {
    const token = props[i];
    switch (token.type) {
      case "space":
        hasSpace = true;
      // fallthrough
      case "newline":
        length += token.source.length;
        break;
      case "comment":
        if (strict && !hasSpace) {
          const message = "Comments must be separated from other tokens by white space characters";
          onError(token, "MISSING_CHAR", message);
        }
        length += token.source.length;
        comment = token.source.substring(1);
        break;
      case "error":
        onError(token, "UNEXPECTED_TOKEN", token.message);
        length += token.source.length;
        break;
      /* istanbul ignore next should not happen */
      default: {
        const message = `Unexpected token in block scalar header: ${token.type}`;
        onError(token, "UNEXPECTED_TOKEN", message);
        const ts = token.source;
        if (ts && typeof ts === "string")
          length += ts.length;
      }
    }
  }
  return { mode, indent, chomp, comment, length };
}
function splitLines(source) {
  const split = source.split(/\n( *)/);
  const first = split[0];
  const m = first.match(/^( *)/);
  const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
  const lines = [line0];
  for (let i = 1; i < split.length; i += 2)
    lines.push([split[i], split[i + 1]]);
  return lines;
}

// node_modules/yaml/browser/dist/compose/resolve-flow-scalar.js
function resolveFlowScalar(scalar, strict, onError) {
  const { offset, type, source, end } = scalar;
  let _type;
  let value;
  const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
  switch (type) {
    case "scalar":
      _type = Scalar.PLAIN;
      value = plainValue(source, _onError);
      break;
    case "single-quoted-scalar":
      _type = Scalar.QUOTE_SINGLE;
      value = singleQuotedValue(source, _onError);
      break;
    case "double-quoted-scalar":
      _type = Scalar.QUOTE_DOUBLE;
      value = doubleQuotedValue(source, _onError);
      break;
    /* istanbul ignore next should not happen */
    default:
      onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
      return {
        value: "",
        type: null,
        comment: "",
        range: [offset, offset + source.length, offset + source.length]
      };
  }
  const valueEnd = offset + source.length;
  const re = resolveEnd(end, valueEnd, strict, onError);
  return {
    value,
    type: _type,
    comment: re.comment,
    range: [offset, valueEnd, re.offset]
  };
}
function plainValue(source, onError) {
  let badChar = "";
  switch (source[0]) {
    /* istanbul ignore next should not happen */
    case "	":
      badChar = "a tab character";
      break;
    case ",":
      badChar = "flow indicator character ,";
      break;
    case "%":
      badChar = "directive indicator character %";
      break;
    case "|":
    case ">": {
      badChar = `block scalar indicator ${source[0]}`;
      break;
    }
    case "@":
    case "`": {
      badChar = `reserved character ${source[0]}`;
      break;
    }
  }
  if (badChar)
    onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
  return unfoldLines(source);
}
function singleQuotedValue(source, onError) {
  if (source[source.length - 1] !== "'" || source.length === 1)
    onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
  return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
}
function unfoldLines(source) {
  const line = /(.*?)\r?\n/sy;
  let match = line.exec(source);
  if (!match)
    return source;
  let trimEnd, trimBoth;
  try {
    trimEnd = new RegExp("(?<![ 	])[ 	]+$");
    trimBoth = new RegExp("^[ 	]+|(?<![ 	])[ 	]+$", "g");
  } catch {
    trimEnd = /[ \t]+$/;
    trimBoth = /^[ \t]+|[ \t]+$/g;
  }
  let res = match[1].replace(trimEnd, "");
  let sep = " ";
  let pos = line.lastIndex;
  while (match = line.exec(source)) {
    const lm = match[1].replace(trimBoth, "");
    if (lm === "") {
      if (sep === "\n")
        res += sep;
      else
        sep = "\n";
    } else {
      res += sep + lm;
      sep = " ";
    }
    pos = line.lastIndex;
  }
  const last = /[ \t]*(.*)/sy;
  last.lastIndex = pos;
  match = last.exec(source);
  return res + sep + (match?.[1] ?? "");
}
function doubleQuotedValue(source, onError) {
  let res = "";
  for (let i = 1; i < source.length - 1; ++i) {
    const ch = source[i];
    if (ch === "\r" && source[i + 1] === "\n")
      continue;
    if (ch === "\n") {
      const { fold, offset } = foldNewline(source, i);
      res += fold;
      i = offset;
    } else if (ch === "\\") {
      let next = source[++i];
      const cc = escapeCodes[next];
      if (cc)
        res += cc;
      else if (next === "\n") {
        next = source[i + 1];
        while (next === " " || next === "	")
          next = source[++i + 1];
      } else if (next === "\r" && source[i + 1] === "\n") {
        next = source[++i + 1];
        while (next === " " || next === "	")
          next = source[++i + 1];
      } else if (next === "x" || next === "u" || next === "U") {
        const length = next === "x" ? 2 : next === "u" ? 4 : 8;
        res += parseCharCode(source, i + 1, length, onError);
        i += length;
      } else {
        const raw = source.substr(i - 1, 2);
        onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        res += raw;
      }
    } else if (ch === " " || ch === "	") {
      const wsStart = i;
      let next = source[i + 1];
      while (next === " " || next === "	")
        next = source[++i + 1];
      if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
        res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
    } else {
      res += ch;
    }
  }
  if (source[source.length - 1] !== '"' || source.length === 1)
    onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
  return res;
}
function foldNewline(source, offset) {
  let fold = "";
  let ch = source[offset + 1];
  while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
    if (ch === "\r" && source[offset + 2] !== "\n")
      break;
    if (ch === "\n")
      fold += "\n";
    offset += 1;
    ch = source[offset + 1];
  }
  if (!fold)
    fold = " ";
  return { fold, offset };
}
var escapeCodes = {
  "0": "\0",
  // null character
  a: "\x07",
  // bell character
  b: "\b",
  // backspace
  e: "\x1B",
  // escape character
  f: "\f",
  // form feed
  n: "\n",
  // line feed
  r: "\r",
  // carriage return
  t: "	",
  // horizontal tab
  v: "\v",
  // vertical tab
  N: "\x85",
  // Unicode next line
  _: "\xA0",
  // Unicode non-breaking space
  L: "\u2028",
  // Unicode line separator
  P: "\u2029",
  // Unicode paragraph separator
  " ": " ",
  '"': '"',
  "/": "/",
  "\\": "\\",
  "	": "	"
};
function parseCharCode(source, offset, length, onError) {
  const cc = source.substr(offset, length);
  const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
  const code = ok ? parseInt(cc, 16) : NaN;
  try {
    return String.fromCodePoint(code);
  } catch {
    const raw = source.substr(offset - 2, length + 2);
    onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
    return raw;
  }
}

// node_modules/yaml/browser/dist/compose/compose-scalar.js
function composeScalar(ctx, token, tagToken, onError) {
  const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar(ctx, token, onError) : resolveFlowScalar(token, ctx.options.strict, onError);
  const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
  let tag;
  if (ctx.options.stringKeys && ctx.atKey) {
    tag = ctx.schema[SCALAR];
  } else if (tagName)
    tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
  else if (token.type === "scalar")
    tag = findScalarTagByTest(ctx, value, token, onError);
  else
    tag = ctx.schema[SCALAR];
  let scalar;
  try {
    const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
    scalar = isScalar(res) ? res : new Scalar(res);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
    scalar = new Scalar(value);
  }
  scalar.range = range;
  scalar.source = value;
  if (type)
    scalar.type = type;
  if (tagName)
    scalar.tag = tagName;
  if (tag.format)
    scalar.format = tag.format;
  if (comment)
    scalar.comment = comment;
  return scalar;
}
function findScalarTagByName(schema4, value, tagName, tagToken, onError) {
  if (tagName === "!")
    return schema4[SCALAR];
  const matchWithTest = [];
  for (const tag of schema4.tags) {
    if (!tag.collection && tag.tag === tagName) {
      if (tag.default && tag.test)
        matchWithTest.push(tag);
      else
        return tag;
    }
  }
  for (const tag of matchWithTest)
    if (tag.test?.test(value))
      return tag;
  const kt = schema4.knownTags[tagName];
  if (kt && !kt.collection) {
    schema4.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
    return kt;
  }
  onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
  return schema4[SCALAR];
}
function findScalarTagByTest({ atKey, directives, schema: schema4 }, value, token, onError) {
  const tag = schema4.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema4[SCALAR];
  if (schema4.compat) {
    const compat = schema4.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema4[SCALAR];
    if (tag.tag !== compat.tag) {
      const ts = directives.tagString(tag.tag);
      const cs = directives.tagString(compat.tag);
      const msg = `Value may be parsed as either ${ts} or ${cs}`;
      onError(token, "TAG_RESOLVE_FAILED", msg, true);
    }
  }
  return tag;
}

// node_modules/yaml/browser/dist/compose/util-empty-scalar-position.js
function emptyScalarPosition(offset, before, pos) {
  if (before) {
    pos ?? (pos = before.length);
    for (let i = pos - 1; i >= 0; --i) {
      let st = before[i];
      switch (st.type) {
        case "space":
        case "comment":
        case "newline":
          offset -= st.source.length;
          continue;
      }
      st = before[++i];
      while (st?.type === "space") {
        offset += st.source.length;
        st = before[++i];
      }
      break;
    }
  }
  return offset;
}

// node_modules/yaml/browser/dist/compose/compose-node.js
var CN = { composeNode, composeEmptyNode };
function composeNode(ctx, token, props, onError) {
  const atKey = ctx.atKey;
  const { spaceBefore, comment, anchor, tag } = props;
  let node;
  let isSrcToken = true;
  switch (token.type) {
    case "alias":
      node = composeAlias(ctx, token, onError);
      if (anchor || tag)
        onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
      break;
    case "scalar":
    case "single-quoted-scalar":
    case "double-quoted-scalar":
    case "block-scalar":
      node = composeScalar(ctx, token, tag, onError);
      if (anchor)
        node.anchor = anchor.source.substring(1);
      break;
    case "block-map":
    case "block-seq":
    case "flow-collection":
      try {
        node = composeCollection(CN, ctx, token, props, onError);
        if (anchor)
          node.anchor = anchor.source.substring(1);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        onError(token, "RESOURCE_EXHAUSTION", message);
      }
      break;
    default: {
      const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
      onError(token, "UNEXPECTED_TOKEN", message);
      isSrcToken = false;
    }
  }
  node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
  if (anchor && node.anchor === "")
    onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
  if (atKey && ctx.options.stringKeys && (!isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
    const msg = "With stringKeys, all keys must be strings";
    onError(tag ?? token, "NON_STRING_KEY", msg);
  }
  if (spaceBefore)
    node.spaceBefore = true;
  if (comment) {
    if (token.type === "scalar" && token.source === "")
      node.comment = comment;
    else
      node.commentBefore = comment;
  }
  if (ctx.options.keepSourceTokens && isSrcToken)
    node.srcToken = token;
  return node;
}
function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
  const token = {
    type: "scalar",
    offset: emptyScalarPosition(offset, before, pos),
    indent: -1,
    source: ""
  };
  const node = composeScalar(ctx, token, tag, onError);
  if (anchor) {
    node.anchor = anchor.source.substring(1);
    if (node.anchor === "")
      onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
  }
  if (spaceBefore)
    node.spaceBefore = true;
  if (comment) {
    node.comment = comment;
    node.range[2] = end;
  }
  return node;
}
function composeAlias({ options }, { offset, source, end }, onError) {
  const alias = new Alias(source.substring(1));
  if (alias.source === "")
    onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
  if (alias.source.endsWith(":"))
    onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
  const valueEnd = offset + source.length;
  const re = resolveEnd(end, valueEnd, options.strict, onError);
  alias.range = [offset, valueEnd, re.offset];
  if (re.comment)
    alias.comment = re.comment;
  return alias;
}

// node_modules/yaml/browser/dist/compose/compose-doc.js
function composeDoc(options, directives, { offset, start, value, end }, onError) {
  const opts = Object.assign({ _directives: directives }, options);
  const doc = new Document(void 0, opts);
  const ctx = {
    atKey: false,
    atRoot: true,
    directives: doc.directives,
    options: doc.options,
    schema: doc.schema
  };
  const props = resolveProps(start, {
    indicator: "doc-start",
    next: value ?? end?.[0],
    offset,
    onError,
    parentIndent: 0,
    startOnNewline: true
  });
  if (props.found) {
    doc.directives.docStart = true;
    if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
      onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
  }
  doc.contents = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
  const contentEnd = doc.contents.range[2];
  const re = resolveEnd(end, contentEnd, false, onError);
  if (re.comment)
    doc.comment = re.comment;
  doc.range = [offset, contentEnd, re.offset];
  return doc;
}

// node_modules/yaml/browser/dist/compose/composer.js
function getErrorPos(src) {
  if (typeof src === "number")
    return [src, src + 1];
  if (Array.isArray(src))
    return src.length === 2 ? src : [src[0], src[1]];
  const { offset, source } = src;
  return [offset, offset + (typeof source === "string" ? source.length : 1)];
}
function parsePrelude(prelude) {
  let comment = "";
  let atComment = false;
  let afterEmptyLine = false;
  for (let i = 0; i < prelude.length; ++i) {
    const source = prelude[i];
    switch (source[0]) {
      case "#":
        comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
        atComment = true;
        afterEmptyLine = false;
        break;
      case "%":
        if (prelude[i + 1]?.[0] !== "#")
          i += 1;
        atComment = false;
        break;
      default:
        if (!atComment)
          afterEmptyLine = true;
        atComment = false;
    }
  }
  return { comment, afterEmptyLine };
}
var Composer = class {
  constructor(options = {}) {
    this.doc = null;
    this.atDirectives = false;
    this.prelude = [];
    this.errors = [];
    this.warnings = [];
    this.onError = (source, code, message, warning) => {
      const pos = getErrorPos(source);
      if (warning)
        this.warnings.push(new YAMLWarning(pos, code, message));
      else
        this.errors.push(new YAMLParseError(pos, code, message));
    };
    this.directives = new Directives({ version: options.version || "1.2" });
    this.options = options;
  }
  decorate(doc, afterDoc) {
    const { comment, afterEmptyLine } = parsePrelude(this.prelude);
    if (comment) {
      const dc = doc.contents;
      if (afterDoc) {
        doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
      } else if (afterEmptyLine || doc.directives.docStart || !dc) {
        doc.commentBefore = comment;
      } else if (isCollection(dc) && !dc.flow && dc.items.length > 0) {
        let it = dc.items[0];
        if (isPair(it))
          it = it.key;
        const cb = it.commentBefore;
        it.commentBefore = cb ? `${comment}
${cb}` : comment;
      } else {
        const cb = dc.commentBefore;
        dc.commentBefore = cb ? `${comment}
${cb}` : comment;
      }
    }
    if (afterDoc) {
      for (let i = 0; i < this.errors.length; ++i)
        doc.errors.push(this.errors[i]);
      for (let i = 0; i < this.warnings.length; ++i)
        doc.warnings.push(this.warnings[i]);
    } else {
      doc.errors = this.errors;
      doc.warnings = this.warnings;
    }
    this.prelude = [];
    this.errors = [];
    this.warnings = [];
  }
  /**
   * Current stream status information.
   *
   * Mostly useful at the end of input for an empty stream.
   */
  streamInfo() {
    return {
      comment: parsePrelude(this.prelude).comment,
      directives: this.directives,
      errors: this.errors,
      warnings: this.warnings
    };
  }
  /**
   * Compose tokens into documents.
   *
   * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
   * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
   */
  *compose(tokens, forceDoc = false, endOffset = -1) {
    for (const token of tokens)
      yield* this.next(token);
    yield* this.end(forceDoc, endOffset);
  }
  /** Advance the composer by one CST token. */
  *next(token) {
    switch (token.type) {
      case "directive":
        this.directives.add(token.source, (offset, message, warning) => {
          const pos = getErrorPos(token);
          pos[0] += offset;
          this.onError(pos, "BAD_DIRECTIVE", message, warning);
        });
        this.prelude.push(token.source);
        this.atDirectives = true;
        break;
      case "document": {
        const doc = composeDoc(this.options, this.directives, token, this.onError);
        if (this.atDirectives && !doc.directives.docStart)
          this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
        this.decorate(doc, false);
        if (this.doc)
          yield this.doc;
        this.doc = doc;
        this.atDirectives = false;
        break;
      }
      case "byte-order-mark":
      case "space":
        break;
      case "comment":
      case "newline":
        this.prelude.push(token.source);
        break;
      case "error": {
        const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
        const error = new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
        if (this.atDirectives || !this.doc)
          this.errors.push(error);
        else
          this.doc.errors.push(error);
        break;
      }
      case "doc-end": {
        if (!this.doc) {
          const msg = "Unexpected doc-end without preceding document";
          this.errors.push(new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
          break;
        }
        this.doc.directives.docEnd = true;
        const end = resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
        this.decorate(this.doc, true);
        if (end.comment) {
          const dc = this.doc.comment;
          this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
        }
        this.doc.range[2] = end.offset;
        break;
      }
      default:
        this.errors.push(new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
    }
  }
  /**
   * Call at end of input to yield any remaining document.
   *
   * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
   * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
   */
  *end(forceDoc = false, endOffset = -1) {
    if (this.doc) {
      this.decorate(this.doc, true);
      yield this.doc;
      this.doc = null;
    } else if (forceDoc) {
      const opts = Object.assign({ _directives: this.directives }, this.options);
      const doc = new Document(void 0, opts);
      if (this.atDirectives)
        this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
      doc.range = [0, endOffset, endOffset];
      this.decorate(doc, false);
      yield doc;
    }
  }
};

// node_modules/yaml/browser/dist/parse/cst-visit.js
var BREAK2 = Symbol("break visit");
var SKIP2 = Symbol("skip children");
var REMOVE2 = Symbol("remove item");
function visit2(cst, visitor) {
  if ("type" in cst && cst.type === "document")
    cst = { start: cst.start, value: cst.value };
  _visit(Object.freeze([]), cst, visitor);
}
visit2.BREAK = BREAK2;
visit2.SKIP = SKIP2;
visit2.REMOVE = REMOVE2;
visit2.itemAtPath = (cst, path) => {
  let item = cst;
  for (const [field, index] of path) {
    const tok = item?.[field];
    if (tok && "items" in tok) {
      item = tok.items[index];
    } else
      return void 0;
  }
  return item;
};
visit2.parentCollection = (cst, path) => {
  const parent = visit2.itemAtPath(cst, path.slice(0, -1));
  const field = path[path.length - 1][0];
  const coll = parent?.[field];
  if (coll && "items" in coll)
    return coll;
  throw new Error("Parent collection not found");
};
function _visit(path, item, visitor) {
  let ctrl = visitor(item, path);
  if (typeof ctrl === "symbol")
    return ctrl;
  for (const field of ["key", "value"]) {
    const token = item[field];
    if (token && "items" in token) {
      for (let i = 0; i < token.items.length; ++i) {
        const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
        if (typeof ci === "number")
          i = ci - 1;
        else if (ci === BREAK2)
          return BREAK2;
        else if (ci === REMOVE2) {
          token.items.splice(i, 1);
          i -= 1;
        }
      }
      if (typeof ctrl === "function" && field === "key")
        ctrl = ctrl(item, path);
    }
  }
  return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
}

// node_modules/yaml/browser/dist/parse/cst.js
var BOM = "\uFEFF";
var DOCUMENT = "";
var FLOW_END = "";
var SCALAR2 = "";
function tokenType(source) {
  switch (source) {
    case BOM:
      return "byte-order-mark";
    case DOCUMENT:
      return "doc-mode";
    case FLOW_END:
      return "flow-error-end";
    case SCALAR2:
      return "scalar";
    case "---":
      return "doc-start";
    case "...":
      return "doc-end";
    case "":
    case "\n":
    case "\r\n":
      return "newline";
    case "-":
      return "seq-item-ind";
    case "?":
      return "explicit-key-ind";
    case ":":
      return "map-value-ind";
    case "{":
      return "flow-map-start";
    case "}":
      return "flow-map-end";
    case "[":
      return "flow-seq-start";
    case "]":
      return "flow-seq-end";
    case ",":
      return "comma";
  }
  switch (source[0]) {
    case " ":
    case "	":
      return "space";
    case "#":
      return "comment";
    case "%":
      return "directive-line";
    case "*":
      return "alias";
    case "&":
      return "anchor";
    case "!":
      return "tag";
    case "'":
      return "single-quoted-scalar";
    case '"':
      return "double-quoted-scalar";
    case "|":
    case ">":
      return "block-scalar-header";
  }
  return null;
}

// node_modules/yaml/browser/dist/parse/lexer.js
function isEmpty(ch) {
  switch (ch) {
    case void 0:
    case " ":
    case "\n":
    case "\r":
    case "	":
      return true;
    default:
      return false;
  }
}
var hexDigits = new Set("0123456789ABCDEFabcdef");
var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
var flowIndicatorChars = new Set(",[]{}");
var invalidAnchorChars = new Set(" ,[]{}\n\r	");
var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
var Lexer = class {
  constructor() {
    this.atEnd = false;
    this.blockScalarIndent = -1;
    this.blockScalarKeep = false;
    this.buffer = "";
    this.flowKey = false;
    this.flowLevel = 0;
    this.indentNext = 0;
    this.indentValue = 0;
    this.lineEndPos = null;
    this.next = null;
    this.pos = 0;
  }
  /**
   * Generate YAML tokens from the `source` string. If `incomplete`,
   * a part of the last line may be left as a buffer for the next call.
   *
   * @returns A generator of lexical tokens
   */
  *lex(source, incomplete = false) {
    if (source) {
      if (typeof source !== "string")
        throw TypeError("source is not a string");
      this.buffer = this.buffer ? this.buffer + source : source;
      this.lineEndPos = null;
    }
    this.atEnd = !incomplete;
    let next = this.next ?? "stream";
    while (next && (incomplete || this.hasChars(1)))
      next = yield* this.parseNext(next);
  }
  atLineEnd() {
    let i = this.pos;
    let ch = this.buffer[i];
    while (ch === " " || ch === "	")
      ch = this.buffer[++i];
    if (!ch || ch === "#" || ch === "\n")
      return true;
    if (ch === "\r")
      return this.buffer[i + 1] === "\n";
    return false;
  }
  charAt(n) {
    return this.buffer[this.pos + n];
  }
  continueScalar(offset) {
    let ch = this.buffer[offset];
    if (this.indentNext > 0) {
      let indent = 0;
      while (ch === " ")
        ch = this.buffer[++indent + offset];
      if (ch === "\r") {
        const next = this.buffer[indent + offset + 1];
        if (next === "\n" || !next && !this.atEnd)
          return offset + indent + 1;
      }
      return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
    }
    if (ch === "-" || ch === ".") {
      const dt = this.buffer.substr(offset, 3);
      if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
        return -1;
    }
    return offset;
  }
  getLine() {
    let end = this.lineEndPos;
    if (typeof end !== "number" || end !== -1 && end < this.pos) {
      end = this.buffer.indexOf("\n", this.pos);
      this.lineEndPos = end;
    }
    if (end === -1)
      return this.atEnd ? this.buffer.substring(this.pos) : null;
    if (this.buffer[end - 1] === "\r")
      end -= 1;
    return this.buffer.substring(this.pos, end);
  }
  hasChars(n) {
    return this.pos + n <= this.buffer.length;
  }
  setNext(state) {
    this.buffer = this.buffer.substring(this.pos);
    this.pos = 0;
    this.lineEndPos = null;
    this.next = state;
    return null;
  }
  peek(n) {
    return this.buffer.substr(this.pos, n);
  }
  *parseNext(next) {
    switch (next) {
      case "stream":
        return yield* this.parseStream();
      case "line-start":
        return yield* this.parseLineStart();
      case "block-start":
        return yield* this.parseBlockStart();
      case "doc":
        return yield* this.parseDocument();
      case "flow":
        return yield* this.parseFlowCollection();
      case "quoted-scalar":
        return yield* this.parseQuotedScalar();
      case "block-scalar":
        return yield* this.parseBlockScalar();
      case "plain-scalar":
        return yield* this.parsePlainScalar();
    }
  }
  *parseStream() {
    let line = this.getLine();
    if (line === null)
      return this.setNext("stream");
    if (line[0] === BOM) {
      yield* this.pushCount(1);
      line = line.substring(1);
    }
    if (line[0] === "%") {
      let dirEnd = line.length;
      let cs = line.indexOf("#");
      while (cs !== -1) {
        const ch = line[cs - 1];
        if (ch === " " || ch === "	") {
          dirEnd = cs - 1;
          break;
        } else {
          cs = line.indexOf("#", cs + 1);
        }
      }
      while (true) {
        const ch = line[dirEnd - 1];
        if (ch === " " || ch === "	")
          dirEnd -= 1;
        else
          break;
      }
      const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
      yield* this.pushCount(line.length - n);
      this.pushNewline();
      return "stream";
    }
    if (this.atLineEnd()) {
      const sp = yield* this.pushSpaces(true);
      yield* this.pushCount(line.length - sp);
      yield* this.pushNewline();
      return "stream";
    }
    yield DOCUMENT;
    return yield* this.parseLineStart();
  }
  *parseLineStart() {
    const ch = this.charAt(0);
    if (!ch && !this.atEnd)
      return this.setNext("line-start");
    if (ch === "-" || ch === ".") {
      if (!this.atEnd && !this.hasChars(4))
        return this.setNext("line-start");
      const s = this.peek(3);
      if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
        yield* this.pushCount(3);
        this.indentValue = 0;
        this.indentNext = 0;
        return s === "---" ? "doc" : "stream";
      }
    }
    this.indentValue = yield* this.pushSpaces(false);
    if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
      this.indentNext = this.indentValue;
    return yield* this.parseBlockStart();
  }
  *parseBlockStart() {
    const [ch0, ch1] = this.peek(2);
    if (!ch1 && !this.atEnd)
      return this.setNext("block-start");
    if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
      const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
      this.indentNext = this.indentValue + 1;
      this.indentValue += n;
      return "block-start";
    }
    return "doc";
  }
  *parseDocument() {
    yield* this.pushSpaces(true);
    const line = this.getLine();
    if (line === null)
      return this.setNext("doc");
    let n = yield* this.pushIndicators();
    switch (line[n]) {
      case "#":
        yield* this.pushCount(line.length - n);
      // fallthrough
      case void 0:
        yield* this.pushNewline();
        return yield* this.parseLineStart();
      case "{":
      case "[":
        yield* this.pushCount(1);
        this.flowKey = false;
        this.flowLevel = 1;
        return "flow";
      case "}":
      case "]":
        yield* this.pushCount(1);
        return "doc";
      case "*":
        yield* this.pushUntil(isNotAnchorChar);
        return "doc";
      case '"':
      case "'":
        return yield* this.parseQuotedScalar();
      case "|":
      case ">":
        n += yield* this.parseBlockScalarHeader();
        n += yield* this.pushSpaces(true);
        yield* this.pushCount(line.length - n);
        yield* this.pushNewline();
        return yield* this.parseBlockScalar();
      default:
        return yield* this.parsePlainScalar();
    }
  }
  *parseFlowCollection() {
    let nl, sp;
    let indent = -1;
    do {
      nl = yield* this.pushNewline();
      if (nl > 0) {
        sp = yield* this.pushSpaces(false);
        this.indentValue = indent = sp;
      } else {
        sp = 0;
      }
      sp += yield* this.pushSpaces(true);
    } while (nl + sp > 0);
    const line = this.getLine();
    if (line === null)
      return this.setNext("flow");
    if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
      const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
      if (!atFlowEndMarker) {
        this.flowLevel = 0;
        yield FLOW_END;
        return yield* this.parseLineStart();
      }
    }
    let n = 0;
    while (line[n] === ",") {
      n += yield* this.pushCount(1);
      n += yield* this.pushSpaces(true);
      this.flowKey = false;
    }
    n += yield* this.pushIndicators();
    switch (line[n]) {
      case void 0:
        return "flow";
      case "#":
        yield* this.pushCount(line.length - n);
        return "flow";
      case "{":
      case "[":
        yield* this.pushCount(1);
        this.flowKey = false;
        this.flowLevel += 1;
        return "flow";
      case "}":
      case "]":
        yield* this.pushCount(1);
        this.flowKey = true;
        this.flowLevel -= 1;
        return this.flowLevel ? "flow" : "doc";
      case "*":
        yield* this.pushUntil(isNotAnchorChar);
        return "flow";
      case '"':
      case "'":
        this.flowKey = true;
        return yield* this.parseQuotedScalar();
      case ":": {
        const next = this.charAt(1);
        if (this.flowKey || isEmpty(next) || next === ",") {
          this.flowKey = false;
          yield* this.pushCount(1);
          yield* this.pushSpaces(true);
          return "flow";
        }
      }
      // fallthrough
      default:
        this.flowKey = false;
        return yield* this.parsePlainScalar();
    }
  }
  *parseQuotedScalar() {
    const quote = this.charAt(0);
    let end = this.buffer.indexOf(quote, this.pos + 1);
    if (quote === "'") {
      while (end !== -1 && this.buffer[end + 1] === "'")
        end = this.buffer.indexOf("'", end + 2);
    } else {
      while (end !== -1) {
        let n = 0;
        while (this.buffer[end - 1 - n] === "\\")
          n += 1;
        if (n % 2 === 0)
          break;
        end = this.buffer.indexOf('"', end + 1);
      }
    }
    const qb = this.buffer.substring(0, end);
    let nl = qb.indexOf("\n", this.pos);
    if (nl !== -1) {
      while (nl !== -1) {
        const cs = this.continueScalar(nl + 1);
        if (cs === -1)
          break;
        nl = qb.indexOf("\n", cs);
      }
      if (nl !== -1) {
        end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
      }
    }
    if (end === -1) {
      if (!this.atEnd)
        return this.setNext("quoted-scalar");
      end = this.buffer.length;
    }
    yield* this.pushToIndex(end + 1, false);
    return this.flowLevel ? "flow" : "doc";
  }
  *parseBlockScalarHeader() {
    this.blockScalarIndent = -1;
    this.blockScalarKeep = false;
    let i = this.pos;
    while (true) {
      const ch = this.buffer[++i];
      if (ch === "+")
        this.blockScalarKeep = true;
      else if (ch > "0" && ch <= "9")
        this.blockScalarIndent = Number(ch) - 1;
      else if (ch !== "-")
        break;
    }
    return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
  }
  *parseBlockScalar() {
    let nl = this.pos - 1;
    let indent = 0;
    let ch;
    loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
      switch (ch) {
        case " ":
          indent += 1;
          break;
        case "\n":
          nl = i2;
          indent = 0;
          break;
        case "\r": {
          const next = this.buffer[i2 + 1];
          if (!next && !this.atEnd)
            return this.setNext("block-scalar");
          if (next === "\n")
            break;
        }
        // fallthrough
        default:
          break loop;
      }
    }
    if (!ch && !this.atEnd)
      return this.setNext("block-scalar");
    if (indent >= this.indentNext) {
      if (this.blockScalarIndent === -1)
        this.indentNext = indent;
      else {
        this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
      }
      do {
        const cs = this.continueScalar(nl + 1);
        if (cs === -1)
          break;
        nl = this.buffer.indexOf("\n", cs);
      } while (nl !== -1);
      if (nl === -1) {
        if (!this.atEnd)
          return this.setNext("block-scalar");
        nl = this.buffer.length;
      }
    }
    let i = nl + 1;
    ch = this.buffer[i];
    while (ch === " ")
      ch = this.buffer[++i];
    if (ch === "	") {
      while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
        ch = this.buffer[++i];
      nl = i - 1;
    } else if (!this.blockScalarKeep) {
      do {
        let i2 = nl - 1;
        let ch2 = this.buffer[i2];
        if (ch2 === "\r")
          ch2 = this.buffer[--i2];
        const lastChar = i2;
        while (ch2 === " ")
          ch2 = this.buffer[--i2];
        if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
          nl = i2;
        else
          break;
      } while (true);
    }
    yield SCALAR2;
    yield* this.pushToIndex(nl + 1, true);
    return yield* this.parseLineStart();
  }
  *parsePlainScalar() {
    const inFlow = this.flowLevel > 0;
    let end = this.pos - 1;
    let i = this.pos - 1;
    let ch;
    while (ch = this.buffer[++i]) {
      if (ch === ":") {
        const next = this.buffer[i + 1];
        if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
          break;
        end = i;
      } else if (isEmpty(ch)) {
        let next = this.buffer[i + 1];
        if (ch === "\r") {
          if (next === "\n") {
            i += 1;
            ch = "\n";
            next = this.buffer[i + 1];
          } else
            end = i;
        }
        if (next === "#" || inFlow && flowIndicatorChars.has(next))
          break;
        if (ch === "\n") {
          const cs = this.continueScalar(i + 1);
          if (cs === -1)
            break;
          i = Math.max(i, cs - 2);
        }
      } else {
        if (inFlow && flowIndicatorChars.has(ch))
          break;
        end = i;
      }
    }
    if (!ch && !this.atEnd)
      return this.setNext("plain-scalar");
    yield SCALAR2;
    yield* this.pushToIndex(end + 1, true);
    return inFlow ? "flow" : "doc";
  }
  *pushCount(n) {
    if (n > 0) {
      yield this.buffer.substr(this.pos, n);
      this.pos += n;
      return n;
    }
    return 0;
  }
  *pushToIndex(i, allowEmpty) {
    const s = this.buffer.slice(this.pos, i);
    if (s) {
      yield s;
      this.pos += s.length;
      return s.length;
    } else if (allowEmpty)
      yield "";
    return 0;
  }
  *pushIndicators() {
    let n = 0;
    loop: while (true) {
      switch (this.charAt(0)) {
        case "!":
          n += yield* this.pushTag();
          n += yield* this.pushSpaces(true);
          continue loop;
        case "&":
          n += yield* this.pushUntil(isNotAnchorChar);
          n += yield* this.pushSpaces(true);
          continue loop;
        case "-":
        // this is an error
        case "?":
        // this is an error outside flow collections
        case ":": {
          const inFlow = this.flowLevel > 0;
          const ch1 = this.charAt(1);
          if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
            if (!inFlow)
              this.indentNext = this.indentValue + 1;
            else if (this.flowKey)
              this.flowKey = false;
            n += yield* this.pushCount(1);
            n += yield* this.pushSpaces(true);
            continue loop;
          }
        }
      }
      break loop;
    }
    return n;
  }
  *pushTag() {
    if (this.charAt(1) === "<") {
      let i = this.pos + 2;
      let ch = this.buffer[i];
      while (!isEmpty(ch) && ch !== ">")
        ch = this.buffer[++i];
      return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
    } else {
      let i = this.pos + 1;
      let ch = this.buffer[i];
      while (ch) {
        if (tagChars.has(ch))
          ch = this.buffer[++i];
        else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
          ch = this.buffer[i += 3];
        } else
          break;
      }
      return yield* this.pushToIndex(i, false);
    }
  }
  *pushNewline() {
    const ch = this.buffer[this.pos];
    if (ch === "\n")
      return yield* this.pushCount(1);
    else if (ch === "\r" && this.charAt(1) === "\n")
      return yield* this.pushCount(2);
    else
      return 0;
  }
  *pushSpaces(allowTabs) {
    let i = this.pos - 1;
    let ch;
    do {
      ch = this.buffer[++i];
    } while (ch === " " || allowTabs && ch === "	");
    const n = i - this.pos;
    if (n > 0) {
      yield this.buffer.substr(this.pos, n);
      this.pos = i;
    }
    return n;
  }
  *pushUntil(test) {
    let i = this.pos;
    let ch = this.buffer[i];
    while (!test(ch))
      ch = this.buffer[++i];
    return yield* this.pushToIndex(i, false);
  }
};

// node_modules/yaml/browser/dist/parse/line-counter.js
var LineCounter = class {
  constructor() {
    this.lineStarts = [];
    this.addNewLine = (offset) => this.lineStarts.push(offset);
    this.linePos = (offset) => {
      let low = 0;
      let high = this.lineStarts.length;
      while (low < high) {
        const mid = low + high >> 1;
        if (this.lineStarts[mid] < offset)
          low = mid + 1;
        else
          high = mid;
      }
      if (this.lineStarts[low] === offset)
        return { line: low + 1, col: 1 };
      if (low === 0)
        return { line: 0, col: offset };
      const start = this.lineStarts[low - 1];
      return { line: low, col: offset - start + 1 };
    };
  }
};

// node_modules/yaml/browser/dist/parse/parser.js
function includesToken(list, type) {
  for (let i = 0; i < list.length; ++i)
    if (list[i].type === type)
      return true;
  return false;
}
function findNonEmptyIndex(list) {
  for (let i = 0; i < list.length; ++i) {
    switch (list[i].type) {
      case "space":
      case "comment":
      case "newline":
        break;
      default:
        return i;
    }
  }
  return -1;
}
function isFlowToken(token) {
  switch (token?.type) {
    case "alias":
    case "scalar":
    case "single-quoted-scalar":
    case "double-quoted-scalar":
    case "flow-collection":
      return true;
    default:
      return false;
  }
}
function getPrevProps(parent) {
  switch (parent.type) {
    case "document":
      return parent.start;
    case "block-map": {
      const it = parent.items[parent.items.length - 1];
      return it.sep ?? it.start;
    }
    case "block-seq":
      return parent.items[parent.items.length - 1].start;
    /* istanbul ignore next should not happen */
    default:
      return [];
  }
}
function getFirstKeyStartProps(prev) {
  if (prev.length === 0)
    return [];
  let i = prev.length;
  loop: while (--i >= 0) {
    switch (prev[i].type) {
      case "doc-start":
      case "explicit-key-ind":
      case "map-value-ind":
      case "seq-item-ind":
      case "newline":
        break loop;
    }
  }
  while (prev[++i]?.type === "space") {
  }
  return prev.splice(i, prev.length);
}
function arrayPushArray(target, source) {
  if (source.length < 1e5)
    Array.prototype.push.apply(target, source);
  else
    for (let i = 0; i < source.length; ++i)
      target.push(source[i]);
}
function fixFlowSeqItems(fc) {
  if (fc.start.type === "flow-seq-start") {
    for (const it of fc.items) {
      if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
        if (it.key)
          it.value = it.key;
        delete it.key;
        if (isFlowToken(it.value)) {
          if (it.value.end)
            arrayPushArray(it.value.end, it.sep);
          else
            it.value.end = it.sep;
        } else
          arrayPushArray(it.start, it.sep);
        delete it.sep;
      }
    }
  }
}
var Parser = class {
  /**
   * @param onNewLine - If defined, called separately with the start position of
   *   each new line (in `parse()`, including the start of input).
   */
  constructor(onNewLine) {
    this.atNewLine = true;
    this.atScalar = false;
    this.indent = 0;
    this.offset = 0;
    this.onKeyLine = false;
    this.stack = [];
    this.source = "";
    this.type = "";
    this.lexer = new Lexer();
    this.onNewLine = onNewLine;
  }
  /**
   * Parse `source` as a YAML stream.
   * If `incomplete`, a part of the last line may be left as a buffer for the next call.
   *
   * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
   *
   * @returns A generator of tokens representing each directive, document, and other structure.
   */
  *parse(source, incomplete = false) {
    if (this.onNewLine && this.offset === 0)
      this.onNewLine(0);
    for (const lexeme of this.lexer.lex(source, incomplete))
      yield* this.next(lexeme);
    if (!incomplete)
      yield* this.end();
  }
  /**
   * Advance the parser by the `source` of one lexical token.
   */
  *next(source) {
    this.source = source;
    if (this.atScalar) {
      this.atScalar = false;
      yield* this.step();
      this.offset += source.length;
      return;
    }
    const type = tokenType(source);
    if (!type) {
      const message = `Not a YAML token: ${source}`;
      yield* this.pop({ type: "error", offset: this.offset, message, source });
      this.offset += source.length;
    } else if (type === "scalar") {
      this.atNewLine = false;
      this.atScalar = true;
      this.type = "scalar";
    } else {
      this.type = type;
      yield* this.step();
      switch (type) {
        case "newline":
          this.atNewLine = true;
          this.indent = 0;
          if (this.onNewLine)
            this.onNewLine(this.offset + source.length);
          break;
        case "space":
          if (this.atNewLine && source[0] === " ")
            this.indent += source.length;
          break;
        case "explicit-key-ind":
        case "map-value-ind":
        case "seq-item-ind":
          if (this.atNewLine)
            this.indent += source.length;
          break;
        case "doc-mode":
        case "flow-error-end":
          return;
        default:
          this.atNewLine = false;
      }
      this.offset += source.length;
    }
  }
  /** Call at end of input to push out any remaining constructions */
  *end() {
    while (this.stack.length > 0)
      yield* this.pop();
  }
  get sourceToken() {
    const st = {
      type: this.type,
      offset: this.offset,
      indent: this.indent,
      source: this.source
    };
    return st;
  }
  *step() {
    const top = this.peek(1);
    if (this.type === "doc-end" && top?.type !== "doc-end") {
      while (this.stack.length > 0)
        yield* this.pop();
      this.stack.push({
        type: "doc-end",
        offset: this.offset,
        source: this.source
      });
      return;
    }
    if (!top)
      return yield* this.stream();
    switch (top.type) {
      case "document":
        return yield* this.document(top);
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
        return yield* this.scalar(top);
      case "block-scalar":
        return yield* this.blockScalar(top);
      case "block-map":
        return yield* this.blockMap(top);
      case "block-seq":
        return yield* this.blockSequence(top);
      case "flow-collection":
        return yield* this.flowCollection(top);
      case "doc-end":
        return yield* this.documentEnd(top);
    }
    yield* this.pop();
  }
  peek(n) {
    return this.stack[this.stack.length - n];
  }
  *pop(error) {
    const token = error ?? this.stack.pop();
    if (!token) {
      const message = "Tried to pop an empty stack";
      yield { type: "error", offset: this.offset, source: "", message };
    } else if (this.stack.length === 0) {
      yield token;
    } else {
      const top = this.peek(1);
      if (token.type === "block-scalar") {
        token.indent = "indent" in top ? top.indent : 0;
      } else if (token.type === "flow-collection" && top.type === "document") {
        token.indent = 0;
      }
      if (token.type === "flow-collection")
        fixFlowSeqItems(token);
      switch (top.type) {
        case "document":
          top.value = token;
          break;
        case "block-scalar":
          top.props.push(token);
          break;
        case "block-map": {
          const it = top.items[top.items.length - 1];
          if (it.value) {
            top.items.push({ start: [], key: token, sep: [] });
            this.onKeyLine = true;
            return;
          } else if (it.sep) {
            it.value = token;
          } else {
            Object.assign(it, { key: token, sep: [] });
            this.onKeyLine = !it.explicitKey;
            return;
          }
          break;
        }
        case "block-seq": {
          const it = top.items[top.items.length - 1];
          if (it.value)
            top.items.push({ start: [], value: token });
          else
            it.value = token;
          break;
        }
        case "flow-collection": {
          const it = top.items[top.items.length - 1];
          if (!it || it.value)
            top.items.push({ start: [], key: token, sep: [] });
          else if (it.sep)
            it.value = token;
          else
            Object.assign(it, { key: token, sep: [] });
          return;
        }
        /* istanbul ignore next should not happen */
        default:
          yield* this.pop();
          yield* this.pop(token);
      }
      if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
        const last = token.items[token.items.length - 1];
        if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
          if (top.type === "document")
            top.end = last.start;
          else
            top.items.push({ start: last.start });
          token.items.splice(-1, 1);
        }
      }
    }
  }
  *stream() {
    switch (this.type) {
      case "directive-line":
        yield { type: "directive", offset: this.offset, source: this.source };
        return;
      case "byte-order-mark":
      case "space":
      case "comment":
      case "newline":
        yield this.sourceToken;
        return;
      case "doc-mode":
      case "doc-start": {
        const doc = {
          type: "document",
          offset: this.offset,
          start: []
        };
        if (this.type === "doc-start")
          doc.start.push(this.sourceToken);
        this.stack.push(doc);
        return;
      }
    }
    yield {
      type: "error",
      offset: this.offset,
      message: `Unexpected ${this.type} token in YAML stream`,
      source: this.source
    };
  }
  *document(doc) {
    if (doc.value)
      return yield* this.lineEnd(doc);
    switch (this.type) {
      case "doc-start": {
        if (findNonEmptyIndex(doc.start) !== -1) {
          yield* this.pop();
          yield* this.step();
        } else
          doc.start.push(this.sourceToken);
        return;
      }
      case "anchor":
      case "tag":
      case "space":
      case "comment":
      case "newline":
        doc.start.push(this.sourceToken);
        return;
    }
    const bv = this.startBlockValue(doc);
    if (bv)
      this.stack.push(bv);
    else {
      yield {
        type: "error",
        offset: this.offset,
        message: `Unexpected ${this.type} token in YAML document`,
        source: this.source
      };
    }
  }
  *scalar(scalar) {
    if (this.type === "map-value-ind") {
      const prev = getPrevProps(this.peek(2));
      const start = getFirstKeyStartProps(prev);
      let sep;
      if (scalar.end) {
        sep = scalar.end;
        sep.push(this.sourceToken);
        delete scalar.end;
      } else
        sep = [this.sourceToken];
      const map2 = {
        type: "block-map",
        offset: scalar.offset,
        indent: scalar.indent,
        items: [{ start, key: scalar, sep }]
      };
      this.onKeyLine = true;
      this.stack[this.stack.length - 1] = map2;
    } else
      yield* this.lineEnd(scalar);
  }
  *blockScalar(scalar) {
    switch (this.type) {
      case "space":
      case "comment":
      case "newline":
        scalar.props.push(this.sourceToken);
        return;
      case "scalar":
        scalar.source = this.source;
        this.atNewLine = true;
        this.indent = 0;
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        yield* this.pop();
        break;
      /* istanbul ignore next should not happen */
      default:
        yield* this.pop();
        yield* this.step();
    }
  }
  *blockMap(map2) {
    const it = map2.items[map2.items.length - 1];
    switch (this.type) {
      case "newline":
        this.onKeyLine = false;
        if (it.value) {
          const end = "end" in it.value ? it.value.end : void 0;
          const last = Array.isArray(end) ? end[end.length - 1] : void 0;
          if (last?.type === "comment")
            end?.push(this.sourceToken);
          else
            map2.items.push({ start: [this.sourceToken] });
        } else if (it.sep) {
          it.sep.push(this.sourceToken);
        } else {
          it.start.push(this.sourceToken);
        }
        return;
      case "space":
      case "comment":
        if (it.value) {
          map2.items.push({ start: [this.sourceToken] });
        } else if (it.sep) {
          it.sep.push(this.sourceToken);
        } else {
          if (this.atIndentedComment(it.start, map2.indent)) {
            const prev = map2.items[map2.items.length - 2];
            const end = prev?.value?.end;
            if (Array.isArray(end)) {
              arrayPushArray(end, it.start);
              end.push(this.sourceToken);
              map2.items.pop();
              return;
            }
          }
          it.start.push(this.sourceToken);
        }
        return;
    }
    if (this.indent >= map2.indent) {
      const atMapIndent = !this.onKeyLine && this.indent === map2.indent;
      const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
      let start = [];
      if (atNextItem && it.sep && !it.value) {
        const nl = [];
        for (let i = 0; i < it.sep.length; ++i) {
          const st = it.sep[i];
          switch (st.type) {
            case "newline":
              nl.push(i);
              break;
            case "space":
              break;
            case "comment":
              if (st.indent > map2.indent)
                nl.length = 0;
              break;
            default:
              nl.length = 0;
          }
        }
        if (nl.length >= 2)
          start = it.sep.splice(nl[1]);
      }
      switch (this.type) {
        case "anchor":
        case "tag":
          if (atNextItem || it.value) {
            start.push(this.sourceToken);
            map2.items.push({ start });
            this.onKeyLine = true;
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            it.start.push(this.sourceToken);
          }
          return;
        case "explicit-key-ind":
          if (!it.sep && !it.explicitKey) {
            it.start.push(this.sourceToken);
            it.explicitKey = true;
          } else if (atNextItem || it.value) {
            start.push(this.sourceToken);
            map2.items.push({ start, explicitKey: true });
          } else {
            this.stack.push({
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken], explicitKey: true }]
            });
          }
          this.onKeyLine = true;
          return;
        case "map-value-ind":
          if (it.explicitKey) {
            if (!it.sep) {
              if (includesToken(it.start, "newline")) {
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              } else {
                const start2 = getFirstKeyStartProps(it.start);
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                });
              }
            } else if (it.value) {
              map2.items.push({ start: [], key: null, sep: [this.sourceToken] });
            } else if (includesToken(it.sep, "map-value-ind")) {
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start, key: null, sep: [this.sourceToken] }]
              });
            } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
              const start2 = getFirstKeyStartProps(it.start);
              const key = it.key;
              const sep = it.sep;
              sep.push(this.sourceToken);
              delete it.key;
              delete it.sep;
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: start2, key, sep }]
              });
            } else if (start.length > 0) {
              it.sep = it.sep.concat(start, this.sourceToken);
            } else {
              it.sep.push(this.sourceToken);
            }
          } else {
            if (!it.sep) {
              Object.assign(it, { key: null, sep: [this.sourceToken] });
            } else if (it.value || atNextItem) {
              map2.items.push({ start, key: null, sep: [this.sourceToken] });
            } else if (includesToken(it.sep, "map-value-ind")) {
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: [], key: null, sep: [this.sourceToken] }]
              });
            } else {
              it.sep.push(this.sourceToken);
            }
          }
          this.onKeyLine = true;
          return;
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar": {
          const fs = this.flowScalar(this.type);
          if (atNextItem || it.value) {
            map2.items.push({ start, key: fs, sep: [] });
            this.onKeyLine = true;
          } else if (it.sep) {
            this.stack.push(fs);
          } else {
            Object.assign(it, { key: fs, sep: [] });
            this.onKeyLine = true;
          }
          return;
        }
        default: {
          const bv = this.startBlockValue(map2);
          if (bv) {
            if (bv.type === "block-seq") {
              if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                yield* this.pop({
                  type: "error",
                  offset: this.offset,
                  message: "Unexpected block-seq-ind on same line with key",
                  source: this.source
                });
                return;
              }
            } else if (atMapIndent) {
              map2.items.push({ start });
            }
            this.stack.push(bv);
            return;
          }
        }
      }
    }
    yield* this.pop();
    yield* this.step();
  }
  *blockSequence(seq2) {
    const it = seq2.items[seq2.items.length - 1];
    switch (this.type) {
      case "newline":
        if (it.value) {
          const end = "end" in it.value ? it.value.end : void 0;
          const last = Array.isArray(end) ? end[end.length - 1] : void 0;
          if (last?.type === "comment")
            end?.push(this.sourceToken);
          else
            seq2.items.push({ start: [this.sourceToken] });
        } else
          it.start.push(this.sourceToken);
        return;
      case "space":
      case "comment":
        if (it.value)
          seq2.items.push({ start: [this.sourceToken] });
        else {
          if (this.atIndentedComment(it.start, seq2.indent)) {
            const prev = seq2.items[seq2.items.length - 2];
            const end = prev?.value?.end;
            if (Array.isArray(end)) {
              arrayPushArray(end, it.start);
              end.push(this.sourceToken);
              seq2.items.pop();
              return;
            }
          }
          it.start.push(this.sourceToken);
        }
        return;
      case "anchor":
      case "tag":
        if (it.value || this.indent <= seq2.indent)
          break;
        it.start.push(this.sourceToken);
        return;
      case "seq-item-ind":
        if (this.indent !== seq2.indent)
          break;
        if (it.value || includesToken(it.start, "seq-item-ind"))
          seq2.items.push({ start: [this.sourceToken] });
        else
          it.start.push(this.sourceToken);
        return;
    }
    if (this.indent > seq2.indent) {
      const bv = this.startBlockValue(seq2);
      if (bv) {
        this.stack.push(bv);
        return;
      }
    }
    yield* this.pop();
    yield* this.step();
  }
  *flowCollection(fc) {
    const it = fc.items[fc.items.length - 1];
    if (this.type === "flow-error-end") {
      let top;
      do {
        yield* this.pop();
        top = this.peek(1);
      } while (top?.type === "flow-collection");
    } else if (fc.end.length === 0) {
      switch (this.type) {
        case "comma":
        case "explicit-key-ind":
          if (!it || it.sep)
            fc.items.push({ start: [this.sourceToken] });
          else
            it.start.push(this.sourceToken);
          return;
        case "map-value-ind":
          if (!it || it.value)
            fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
          else if (it.sep)
            it.sep.push(this.sourceToken);
          else
            Object.assign(it, { key: null, sep: [this.sourceToken] });
          return;
        case "space":
        case "comment":
        case "newline":
        case "anchor":
        case "tag":
          if (!it || it.value)
            fc.items.push({ start: [this.sourceToken] });
          else if (it.sep)
            it.sep.push(this.sourceToken);
          else
            it.start.push(this.sourceToken);
          return;
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar": {
          const fs = this.flowScalar(this.type);
          if (!it || it.value)
            fc.items.push({ start: [], key: fs, sep: [] });
          else if (it.sep)
            this.stack.push(fs);
          else
            Object.assign(it, { key: fs, sep: [] });
          return;
        }
        case "flow-map-end":
        case "flow-seq-end":
          fc.end.push(this.sourceToken);
          return;
      }
      const bv = this.startBlockValue(fc);
      if (bv)
        this.stack.push(bv);
      else {
        yield* this.pop();
        yield* this.step();
      }
    } else {
      const parent = this.peek(2);
      if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
        yield* this.pop();
        yield* this.step();
      } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
        const prev = getPrevProps(parent);
        const start = getFirstKeyStartProps(prev);
        fixFlowSeqItems(fc);
        const sep = fc.end.splice(1, fc.end.length);
        sep.push(this.sourceToken);
        const map2 = {
          type: "block-map",
          offset: fc.offset,
          indent: fc.indent,
          items: [{ start, key: fc, sep }]
        };
        this.onKeyLine = true;
        this.stack[this.stack.length - 1] = map2;
      } else {
        yield* this.lineEnd(fc);
      }
    }
  }
  flowScalar(type) {
    if (this.onNewLine) {
      let nl = this.source.indexOf("\n") + 1;
      while (nl !== 0) {
        this.onNewLine(this.offset + nl);
        nl = this.source.indexOf("\n", nl) + 1;
      }
    }
    return {
      type,
      offset: this.offset,
      indent: this.indent,
      source: this.source
    };
  }
  startBlockValue(parent) {
    switch (this.type) {
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
        return this.flowScalar(this.type);
      case "block-scalar-header":
        return {
          type: "block-scalar",
          offset: this.offset,
          indent: this.indent,
          props: [this.sourceToken],
          source: ""
        };
      case "flow-map-start":
      case "flow-seq-start":
        return {
          type: "flow-collection",
          offset: this.offset,
          indent: this.indent,
          start: this.sourceToken,
          items: [],
          end: []
        };
      case "seq-item-ind":
        return {
          type: "block-seq",
          offset: this.offset,
          indent: this.indent,
          items: [{ start: [this.sourceToken] }]
        };
      case "explicit-key-ind": {
        this.onKeyLine = true;
        const prev = getPrevProps(parent);
        const start = getFirstKeyStartProps(prev);
        start.push(this.sourceToken);
        return {
          type: "block-map",
          offset: this.offset,
          indent: this.indent,
          items: [{ start, explicitKey: true }]
        };
      }
      case "map-value-ind": {
        this.onKeyLine = true;
        const prev = getPrevProps(parent);
        const start = getFirstKeyStartProps(prev);
        return {
          type: "block-map",
          offset: this.offset,
          indent: this.indent,
          items: [{ start, key: null, sep: [this.sourceToken] }]
        };
      }
    }
    return null;
  }
  atIndentedComment(start, indent) {
    if (this.type !== "comment")
      return false;
    if (this.indent <= indent)
      return false;
    return start.every((st) => st.type === "newline" || st.type === "space");
  }
  *documentEnd(docEnd) {
    if (this.type !== "doc-mode") {
      if (docEnd.end)
        docEnd.end.push(this.sourceToken);
      else
        docEnd.end = [this.sourceToken];
      if (this.type === "newline")
        yield* this.pop();
    }
  }
  *lineEnd(token) {
    switch (this.type) {
      case "comma":
      case "doc-start":
      case "doc-end":
      case "flow-seq-end":
      case "flow-map-end":
      case "map-value-ind":
        yield* this.pop();
        yield* this.step();
        break;
      case "newline":
        this.onKeyLine = false;
      // fallthrough
      case "space":
      case "comment":
      default:
        if (token.end)
          token.end.push(this.sourceToken);
        else
          token.end = [this.sourceToken];
        if (this.type === "newline")
          yield* this.pop();
    }
  }
};

// node_modules/yaml/browser/dist/public-api.js
function parseOptions(options) {
  const prettyErrors = options.prettyErrors !== false;
  const lineCounter = options.lineCounter || prettyErrors && new LineCounter() || null;
  return { lineCounter, prettyErrors };
}
function parseDocument(source, options = {}) {
  const { lineCounter, prettyErrors } = parseOptions(options);
  const parser = new Parser(lineCounter?.addNewLine);
  const composer = new Composer(options);
  let doc = null;
  for (const _doc of composer.compose(parser.parse(source), true, source.length)) {
    if (!doc)
      doc = _doc;
    else if (doc.options.logLevel !== "silent") {
      doc.errors.push(new YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
      break;
    }
  }
  if (prettyErrors && lineCounter) {
    doc.errors.forEach(prettifyError(source, lineCounter));
    doc.warnings.forEach(prettifyError(source, lineCounter));
  }
  return doc;
}
function stringify3(value, replacer, options) {
  let _replacer = null;
  if (typeof replacer === "function" || Array.isArray(replacer)) {
    _replacer = replacer;
  } else if (options === void 0 && replacer) {
    options = replacer;
  }
  if (typeof options === "string")
    options = options.length;
  if (typeof options === "number") {
    const indent = Math.round(options);
    options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
  }
  if (value === void 0) {
    const { keepUndefined } = options ?? replacer ?? {};
    if (!keepUndefined)
      return void 0;
  }
  if (isDocument(value) && !_replacer)
    return value.toString(options);
  return new Document(value, _replacer, options).toString(options);
}

// src/client/agent-format.mjs
var AGENT_TEMPLATE = "## \u4EFB\u52A1\u76EE\u6807\n\n## \u5904\u7406\u8FB9\u754C\n\n## \u5DE5\u4F5C\u65B9\u5F0F\u4E0E\u56DE\u62A5\u65F6\u673A\n\n## \u8F93\u51FA\u8981\u6C42\n";
function agentDocument({ slug, description, goal, boundaries, instructions }, extra = {}) {
  const frontmatter = {
    ...extra,
    name: slug.trim(),
    description: description.trim()
  };
  return `---
${stringify3(frontmatter)}---

# ${slug.trim()}

${goal.trim()}

${boundaries.trim() ? `## \u5904\u7406\u8FB9\u754C
${boundaries.trim()}

` : ""}${instructions.trim()}
`;
}
function readAgent(resource) {
  const file = resource?.files?.find((f) => f.path === "AGENT.md");
  const base = {
    slug: resource?.metadata?.agent?.slug || "",
    description: resource?.description || "",
    goal: resource?.metadata?.agent?.goal || "",
    boundaries: resource?.metadata?.agent?.boundaries || "",
    instructions: resource?.metadata?.agent?.instructions || AGENT_TEMPLATE,
    extra: {},
    error: ""
  };
  if (!file) return base;
  if (file.encoding !== "utf8")
    return { ...base, error: "AGENT.md \u5FC5\u987B\u662F UTF-8 \u6587\u672C\u3002" };
  const match = file.content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return base;
  try {
    const doc = parseDocument(match[1]);
    if (doc.errors.length) throw doc.errors[0];
    const data = doc.toJS();
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw Error("\u6587\u4EF6\u5934\u5FC5\u987B\u662F YAML \u5BF9\u8C61");
    const { name, description, ...extra } = data;
    return {
      ...base,
      slug: base.slug || name || "",
      description: base.description || description || "",
      extra
    };
  } catch (e) {
    return { ...base, error: `AGENT.md \u6587\u4EF6\u5934\u65E0\u6CD5\u89E3\u6790\uFF1A${e.message}` };
  }
}
function agentIssues({
  slug,
  name,
  description,
  goal,
  instructions,
  files,
  config,
  tags,
  error
}) {
  const issues = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 64)
    issues.push("\u82F1\u6587\u6807\u8BC6\u987B\u4E3A 1\u201364 \u4E2A\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u6216\u8FDE\u5B57\u7B26\u3002");
  if (!name.trim() || name.length > 160)
    issues.push("\u8BF7\u8F93\u5165\u663E\u793A\u540D\u79F0\uFF08\u6700\u591A 160 \u5B57\uFF09\u3002");
  if (!description.trim() || description.length > 1024)
    issues.push("\u8BF7\u8F93\u5165\u7B80\u4ECB\uFF08\u6700\u591A 1024 \u5B57\uFF09\u3002");
  if (!instructions.trim() || instructions === AGENT_TEMPLATE)
    issues.push("\u8BF7\u586B\u5199\u81EA\u5DF1\u7684\u884C\u4E3A\u6307\u5F15\u3002");
  if (tags.length > 20 || tags.some((t) => t.length > 40))
    issues.push("\u6700\u591A 20 \u4E2A\u6807\u7B7E\uFF0C\u6BCF\u4E2A\u6700\u591A 40 \u5B57\u3002");
  if (files.length > 98) issues.push("\u9644\u5C5E\u6587\u4EF6\u6700\u591A 98 \u4E2A\u3002");
  const seen = /* @__PURE__ */ new Set(["AGENT.md", "config.json"]);
  let bytes = 0;
  for (const file of files) {
    if (!/^(references|assets)\//.test(file.path) || file.path.split("/").some((x) => !x || x === "." || x === "..") || /[\\\x00-\x1f]/.test(file.path))
      issues.push(`\u6587\u4EF6\u8DEF\u5F84\u65E0\u6548\uFF1A${file.path}`);
    if (seen.has(file.path)) issues.push(`\u8DEF\u5F84\u91CD\u590D\uFF1A${file.path}`);
    seen.add(file.path);
    bytes += file.encoding === "base64" ? Math.ceil(file.content.length * 3 / 4) : new TextEncoder().encode(file.content).length;
  }
  if (bytes + new TextEncoder().encode(JSON.stringify(config) + goal + instructions).length > 5 * 1024 * 1024)
    issues.push("\u6587\u4EF6\u603B\u5927\u5C0F\u4E0D\u80FD\u8D85\u8FC7 5 MiB\u3002");
  if (error) issues.push(error);
  return [...new Set(issues)];
}

// src/client/agent-wizard.jsx
var steps3 = ["\u57FA\u672C\u4FE1\u606F", "\u884C\u4E3A\u6307\u5F15\u4E0E\u9644\u4EF6", "\u68C0\u67E5\u4FDD\u5B58"];
function AgentWizard({ resource, onClose, onSave }) {
  const [cover, setCover] = (0, import_react8.useState)(resource?.metadata?.cover ?? "");
  const [initial2] = (0, import_react8.useState)(() => readAgent(resource));
  const [step, setStep] = (0, import_react8.useState)(0), [slug, setSlug] = (0, import_react8.useState)(initial2.slug || `agent-${crypto.randomUUID().slice(0, 8)}`), [name, setName] = (0, import_react8.useState)(resource?.name || ""), [description, setDescription] = (0, import_react8.useState)(initial2.description), [instructions, setInstructions] = (0, import_react8.useState)(
    () => [
      initial2.goal && "## \u4EFB\u52A1\u76EE\u6807\n" + initial2.goal,
      initial2.boundaries && "## \u5904\u7406\u8FB9\u754C\n" + initial2.boundaries,
      initial2.instructions
    ].filter(Boolean).join("\n\n")
  ), [tags, setTags] = (0, import_react8.useState)((resource?.tags || []).join(", ")), [files, setFiles] = (0, import_react8.useState)(
    (resource?.files || []).filter(
      (f) => !["AGENT.md", "config.json"].includes(f.path)
    )
  ), [selected, setSelected] = (0, import_react8.useState)(-1), [error, setError] = (0, import_react8.useState)(""), [busy, setBusy] = (0, import_react8.useState)(false), [preview, setPreview] = (0, import_react8.useState)(false);
  const heading = (0, import_react8.useRef)(null);
  (0, import_react8.useEffect)(() => {
    heading.current?.focus();
  }, [step]);
  const parsedTags = [
    ...new Set(
      tags.split(/[,，]/).map((x) => x.trim()).filter(Boolean)
    )
  ];
  const goal = "", boundaries = "";
  const config = { ...resource?.metadata?.agent?.config || {} };
  delete config.model;
  const hasConfig = Object.keys(config).length > 0;
  const document2 = agentDocument(
    { slug, description, goal, boundaries, instructions },
    initial2.extra
  );
  const issues = agentIssues({
    slug,
    name,
    description,
    goal,
    instructions,
    files,
    config,
    tags: parsedTags,
    error: initial2.error
  });
  const identityOK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 64 && !!name.trim() && !!description.trim();
  const dutiesOK = !!instructions.trim() && instructions !== AGENT_TEMPLATE;
  async function upload(folder, list) {
    setBusy(true);
    setError("");
    try {
      const incoming = [];
      for (const file of list) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let content, encoding;
        try {
          content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
          if (content.includes("\0")) throw Error();
          encoding = "utf8";
        } catch {
          let raw = "";
          for (const b of bytes) raw += String.fromCharCode(b);
          content = btoa(raw);
          encoding = "base64";
        }
        incoming.push({ path: `${folder}/${file.name}`, encoding, content });
      }
      const next = [...files, ...incoming];
      const problem = agentIssues({
        slug,
        name,
        description,
        goal,
        instructions,
        files: next,
        config,
        tags: parsedTags
      }).find((x) => /文件|路径/.test(x));
      if (problem) throw Error(problem);
      setFiles(next);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (issues.length) return;
    setBusy(true);
    setError("");
    try {
      await onSave({
        type: "agent",
        name: name.trim(),
        description: description.trim(),
        tags: parsedTags,
        metadata: {
          ...withResourceCover(resource?.metadata, cover),
          agent: {
            ...resource?.metadata?.agent || {},
            slug: slug.trim(),
            goal,
            boundaries,
            instructions,
            model: "",
            config
          }
        },
        references: resource?.references || [],
        files: [
          { path: "AGENT.md", encoding: "utf8", content: document2 },
          ...hasConfig ? [
            {
              path: "config.json",
              encoding: "utf8",
              content: JSON.stringify(config, null, 2) + "\n"
            }
          ] : [],
          ...files
        ]
      });
    } catch (e) {
      setError(e?.rpcError?.message || e.message || String(e));
      setBusy(false);
    }
  }
  const current = files[selected];
  return /* @__PURE__ */ import_react8.default.createElement(Modal, { onClose: () => !busy && onClose() }, /* @__PURE__ */ import_react8.default.createElement(
    "section",
    {
      className: "gal-dialog gal-skill-wizard gal-agent-wizard",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": resource ? "\u7F16\u8F91 Agent" : "\u65B0\u5EFA Agent",
      tabIndex: -1
    },
    /* @__PURE__ */ import_react8.default.createElement("header", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react8.default.createElement("h2", null, /* @__PURE__ */ import_react8.default.createElement(Glyph, { name: "agent" }), " ", resource ? "\u7F16\u8F91 Agent" : "\u65B0\u5EFA Agent"), /* @__PURE__ */ import_react8.default.createElement("button", { "aria-label": "\u5173\u95ED\u7F16\u8F91", disabled: busy, onClick: onClose }, /* @__PURE__ */ import_react8.default.createElement(Glyph, { name: "close" }))),
    /* @__PURE__ */ import_react8.default.createElement("nav", { className: "gal-skill-steps gal-three-steps", "aria-label": "\u521B\u5EFA\u8FDB\u5EA6" }, steps3.map((title, i) => /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        key: title,
        "aria-current": step === i ? "step" : void 0,
        disabled: busy || i > 0 && !identityOK || i > 1 && !dutiesOK,
        onClick: () => setStep(i)
      },
      /* @__PURE__ */ import_react8.default.createElement("span", null, i < step ? "\u2713" : i + 1),
      title
    ))),
    /* @__PURE__ */ import_react8.default.createElement("div", { className: "gal-dialog-body gal-skill-layout" }, /* @__PURE__ */ import_react8.default.createElement("main", null, /* @__PURE__ */ import_react8.default.createElement("h3", { ref: heading, tabIndex: -1 }, steps3[step]), step === 0 && /* @__PURE__ */ import_react8.default.createElement(ResourceBasics, { name, onName: setName, description, onDescription: setDescription, identifier: slug, onIdentifier: setSlug, busy }), step === 1 && /* @__PURE__ */ import_react8.default.createElement("div", { className: "gal-skill-fields" }, /* @__PURE__ */ import_react8.default.createElement("p", null, "\u5199\u6E05\u804C\u8D23\u3001\u5904\u7406\u8FB9\u754C\u3001\u4F55\u65F6\u56DE\u62A5\u548C\u4EA4\u4ED8\u683C\u5F0F\u3002"), /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        "aria-pressed": preview,
        onClick: () => setPreview(!preview)
      },
      preview ? "\u7EE7\u7EED\u7F16\u8F91" : "\u9884\u89C8\u6307\u5F15"
    ), preview ? /* @__PURE__ */ import_react8.default.createElement("pre", { className: "gal-skill-preview" }, document2) : /* @__PURE__ */ import_react8.default.createElement("label", null, "\u884C\u4E3A\u6307\u5F15", /* @__PURE__ */ import_react8.default.createElement(
      "textarea",
      {
        "aria-label": "\u884C\u4E3A\u6307\u5F15",
        className: "gal-skill-code",
        rows: 10,
        value: instructions,
        onChange: (e) => setInstructions(e.target.value)
      }
    )), /* @__PURE__ */ import_react8.default.createElement("details", { className: "gal-skill-fields" }, /* @__PURE__ */ import_react8.default.createElement("summary", null, "\u9644\u5C5E\u6587\u4EF6\u4E0E\u9009\u9879 \xB7 ", files.length, " \u4E2A\u9644\u4EF6"), /* @__PURE__ */ import_react8.default.createElement("div", { className: "gal-skill-folders" }, [
      ["references", "\u53C2\u8003\u8D44\u6599"],
      ["assets", "\u7D20\u6750\u6A21\u677F"]
    ].map(([folder, title]) => /* @__PURE__ */ import_react8.default.createElement(
      "section",
      {
        className: "gal-skill-folder",
        key: folder,
        onDragOver: (e) => e.preventDefault(),
        onDrop: (e) => {
          e.preventDefault();
          upload(folder, e.dataTransfer.files);
        }
      },
      /* @__PURE__ */ import_react8.default.createElement(Glyph, { name: "folder", size: 28 }),
      /* @__PURE__ */ import_react8.default.createElement("h3", null, title),
      /* @__PURE__ */ import_react8.default.createElement("code", null, folder, "/"),
      /* @__PURE__ */ import_react8.default.createElement("label", { className: "gal-upload" }, "\u4E0A\u4F20\u6587\u4EF6", /* @__PURE__ */ import_react8.default.createElement(
        "input",
        {
          "aria-label": `\u4E0A\u4F20${title}`,
          type: "file",
          multiple: true,
          disabled: busy,
          onChange: (e) => {
            upload(folder, e.target.files);
            e.target.value = "";
          }
        }
      )),
      /* @__PURE__ */ import_react8.default.createElement(
        "button",
        {
          disabled: busy || files.length >= 98,
          onClick: () => {
            let n = 1, path;
            do {
              path = `${folder}/untitled-${n++}.md`;
            } while (files.some((f) => f.path === path));
            setFiles([
              ...files,
              { path, encoding: "utf8", content: "" }
            ]);
            setSelected(files.length);
          }
        },
        "\u65B0\u5EFA\u6587\u672C"
      ),
      /* @__PURE__ */ import_react8.default.createElement("span", null, files.filter((f) => f.path.startsWith(folder + "/")).length, " ", "\u4E2A\u6587\u4EF6")
    ))), /* @__PURE__ */ import_react8.default.createElement("div", { className: "gal-skill-attachments" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "gal-skill-filelist" }, files.map((f, i) => /* @__PURE__ */ import_react8.default.createElement("div", { key: i }, /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        onClick: () => setSelected(i),
        "aria-pressed": selected === i
      },
      /* @__PURE__ */ import_react8.default.createElement(Glyph, { name: "file" }),
      f.path
    ), /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        "aria-label": `\u5220\u9664 ${f.path}`,
        onClick: () => {
          setFiles(files.filter((_, j) => j !== i));
          setSelected(-1);
        }
      },
      /* @__PURE__ */ import_react8.default.createElement(Glyph, { name: "close" })
    )))), current && /* @__PURE__ */ import_react8.default.createElement("fieldset", { className: "gal-skill-fields" }, /* @__PURE__ */ import_react8.default.createElement("label", null, "\u6587\u4EF6\u8DEF\u5F84", /* @__PURE__ */ import_react8.default.createElement(
      "input",
      {
        "aria-label": "\u6587\u4EF6\u8DEF\u5F84",
        value: current.path,
        onChange: (e) => setFiles(
          files.map(
            (f, i) => i === selected ? { ...f, path: e.target.value } : f
          )
        )
      }
    )), current.encoding === "utf8" ? /* @__PURE__ */ import_react8.default.createElement("label", null, "\u6587\u4EF6\u5185\u5BB9", /* @__PURE__ */ import_react8.default.createElement(
      "textarea",
      {
        "aria-label": "\u6587\u4EF6\u5185\u5BB9",
        rows: 8,
        value: current.content,
        onChange: (e) => setFiles(
          files.map(
            (f, i) => i === selected ? { ...f, content: e.target.value } : f
          )
        )
      }
    )) : /* @__PURE__ */ import_react8.default.createElement("p", null, "\u4E8C\u8FDB\u5236\u9644\u4EF6\u968F\u8D44\u6E90\u4FDD\u5B58\u3002"))))), step === 2 && /* @__PURE__ */ import_react8.default.createElement("div", { className: "gal-skill-fields" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "gal-skill-summary" }, /* @__PURE__ */ import_react8.default.createElement(Glyph, { name: "agent", size: 36 }), /* @__PURE__ */ import_react8.default.createElement("h2", null, name), /* @__PURE__ */ import_react8.default.createElement("p", null, description), /* @__PURE__ */ import_react8.default.createElement("span", null, files.length + 1 + (hasConfig ? 1 : 0), " \u4E2A\u6587\u4EF6 \xB7 \u6574\u4F53\u4FDD\u5B58")), /* @__PURE__ */ import_react8.default.createElement(
      ResourceCoverPicker,
      {
        resource: {
          type: "agent",
          name,
          description,
          tags: tags.split(/[,，]/),
          cover
        },
        onChange: setCover
      }
    ), /* @__PURE__ */ import_react8.default.createElement("label", null, "\u6807\u7B7E\uFF08\u9009\u586B\uFF09", /* @__PURE__ */ import_react8.default.createElement(
      "input",
      {
        "aria-label": "\u6807\u7B7E",
        value: tags,
        onChange: (e) => setTags(e.target.value),
        placeholder: "\u4F8B\u5982\uFF1A\u7814\u7A76\uFF0C\u5206\u6790"
      }
    )), issues.length ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "gal-error", role: "alert" }, issues.map((x) => /* @__PURE__ */ import_react8.default.createElement("p", { key: x }, x))) : /* @__PURE__ */ import_react8.default.createElement("p", { className: "gal-skill-ok" }, "\u2713 \u683C\u5F0F\u68C0\u67E5\u901A\u8FC7\uFF0C\u53EF\u4EE5\u4FDD\u5B58"), /* @__PURE__ */ import_react8.default.createElement("details", null, /* @__PURE__ */ import_react8.default.createElement("summary", null, "\u67E5\u770B AGENT.md"), /* @__PURE__ */ import_react8.default.createElement("pre", { className: "gal-skill-preview" }, document2)), hasConfig && /* @__PURE__ */ import_react8.default.createElement("details", null, /* @__PURE__ */ import_react8.default.createElement("summary", null, "\u67E5\u770B config.json"), /* @__PURE__ */ import_react8.default.createElement("pre", { className: "gal-skill-preview" }, JSON.stringify(config, null, 2)))), error && /* @__PURE__ */ import_react8.default.createElement("p", { role: "alert", className: "gal-error" }, error)), /* @__PURE__ */ import_react8.default.createElement("details", { open: true, className: "gal-skill-tree" }, /* @__PURE__ */ import_react8.default.createElement("summary", null, "\u6587\u4EF6\u7ED3\u6784"), /* @__PURE__ */ import_react8.default.createElement("strong", null, /* @__PURE__ */ import_react8.default.createElement(Glyph, { name: "folder" }), " ", slug || "my-agent", "/"), /* @__PURE__ */ import_react8.default.createElement("div", null, /* @__PURE__ */ import_react8.default.createElement(Glyph, { name: "file" }), " AGENT.md"), hasConfig && /* @__PURE__ */ import_react8.default.createElement("div", null, /* @__PURE__ */ import_react8.default.createElement(Glyph, { name: "file" }), " config.json"), files.map((f, i) => /* @__PURE__ */ import_react8.default.createElement("div", { key: i }, /* @__PURE__ */ import_react8.default.createElement(Glyph, { name: "file" }), " ", f.path)))),
    /* @__PURE__ */ import_react8.default.createElement("footer", { className: "gal-skill-footer" }, /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        disabled: busy,
        onClick: step ? () => setStep(step - 1) : onClose
      },
      step ? "\u4E0A\u4E00\u6B65" : "\u53D6\u6D88"
    ), step < 2 ? /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        className: "gal-primary",
        disabled: busy || step === 0 && !identityOK || step === 1 && !dutiesOK,
        onClick: () => setStep(step + 1)
      },
      "\u4E0B\u4E00\u6B65",
      /* @__PURE__ */ import_react8.default.createElement(Glyph, { name: "arrow" })
    ) : /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        className: "gal-primary",
        disabled: busy || !!issues.length,
        onClick: save
      },
      busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58 Agent"
    ))
  ));
}

// src/client/skill-wizard.jsx
var import_react9 = __toESM(require("react"), 1);

// src/client/skill-format.mjs
var SKILL_TEMPLATE = `# \u6267\u884C\u6307\u5F15

## \u76EE\u6807
\u8BF4\u660E\u8FD9\u4E2A Skill \u8981\u5B8C\u6210\u7684\u4EFB\u52A1\u3002

## \u6B65\u9AA4
1. \u9605\u8BFB\u7528\u6237\u63D0\u4F9B\u7684\u4FE1\u606F\u3002
2. \u6309\u4EFB\u52A1\u8981\u6C42\u6267\u884C\u3002

## \u8F93\u51FA
\u8BF4\u660E\u6700\u7EC8\u7ED3\u679C\u7684\u683C\u5F0F\u4E0E\u8981\u6C42\u3002
`;
function skillDocument(name, description, body, frontmatter = {}) {
  return `---
${stringify3({ ...frontmatter, name: name.trim(), description: description.trim() })}---

${body.trim()}
`;
}
function readSkill(resource) {
  if (!resource)
    return {
      name: "",
      description: "",
      body: SKILL_TEMPLATE,
      files: [],
      frontmatter: {}
    };
  const file = resource.files.find((f) => f.path === "SKILL.md");
  let text2 = file?.content || "";
  let frontmatter = {}, error = "";
  const legacy = text2.match(
    /^---\\nname: ("(?:\\.|[^"\\])*")\\ndescription: ("(?:\\.|[^"\\])*")\\n---\\n\\n/
  );
  if (legacy) {
    frontmatter = {
      name: JSON.parse(legacy[1]),
      description: JSON.parse(legacy[2])
    };
    text2 = text2.slice(legacy[0].length).replace(/\\n$/, "");
  } else {
    const header = text2.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (header) {
      try {
        const doc = parseDocument(header[1]);
        if (doc.errors.length) throw doc.errors[0];
        frontmatter = doc.toJS();
        if (!frontmatter || typeof frontmatter !== "object" || Array.isArray(frontmatter))
          throw new Error("\u6587\u4EF6\u5934\u5FC5\u987B\u662F YAML \u5BF9\u8C61");
        text2 = text2.slice(header[0].length).replace(/^\r?\n/, "");
      } catch (e) {
        error = `SKILL.md \u6587\u4EF6\u5934\u65E0\u6CD5\u89E3\u6790\uFF1A${e.message}`;
        frontmatter = {};
      }
    }
  }
  if (file && file.encoding !== "utf8") error = "SKILL.md \u5FC5\u987B\u662F UTF-8 \u6587\u672C\u3002";
  return {
    name: typeof frontmatter.name === "string" ? frontmatter.name : resource.name,
    description: typeof frontmatter.description === "string" ? frontmatter.description : resource.description,
    body: text2,
    files: resource.files.filter((f) => f.path !== "SKILL.md"),
    frontmatter,
    error
  };
}
function skillIssues(name, description, body, files) {
  const issues = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64)
    issues.push(
      "\u540D\u79F0\u987B\u4E3A 1\u201364 \u4E2A\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u6216\u8FDE\u5B57\u7B26\uFF0C\u4E0D\u80FD\u4EE5\u8FDE\u5B57\u7B26\u5F00\u5934\u6216\u7ED3\u5C3E\u3002"
    );
  if (!description.trim() || description.length > 1024)
    issues.push("\u8BF7\u586B\u5199\u63CF\u8FF0\uFF0C\u6700\u591A 1024 \u5B57\u3002");
  if (!body.trim() || body === SKILL_TEMPLATE)
    issues.push("\u8BF7\u7F16\u5199\u4F60\u7684\u6267\u884C\u6307\u5F15\uFF0C\u66FF\u6362\u9ED8\u8BA4\u6A21\u677F\u5185\u5BB9\u3002");
  const paths2 = /* @__PURE__ */ new Set(["SKILL.md"]);
  let bytes = new TextEncoder().encode(
    skillDocument(name, description, body)
  ).length;
  for (const f of files) {
    if (!/^(scripts|references|assets)\//.test(f.path) || f.path.length > 500 || /[\\\x00-\x1f]/.test(f.path) || f.path.split("/").some((p) => !p || p === "." || p === ".."))
      issues.push(`\u6587\u4EF6\u8DEF\u5F84\u65E0\u6548\uFF1A${f.path}`);
    if (paths2.has(f.path)) issues.push(`\u6587\u4EF6\u8DEF\u5F84\u91CD\u590D\uFF1A${f.path}`);
    paths2.add(f.path);
    bytes += f.encoding === "base64" ? Math.floor(f.content.length * 3 / 4) : new TextEncoder().encode(f.content).length;
  }
  if (files.length > 99) issues.push("\u5305\u542B SKILL.md \u5728\u5185\u6700\u591A 100 \u4E2A\u6587\u4EF6\u3002");
  if (bytes > 5 * 1024 * 1024) issues.push("\u6587\u4EF6\u603B\u5927\u5C0F\u4E0D\u80FD\u8D85\u8FC7 5 MiB\u3002");
  for (const match of body.matchAll(
    /\]\((?:\.\/)?((?:scripts|references|assets)\/[^)]+)\)/g
  )) {
    let path = match[1];
    try {
      path = decodeURIComponent(path);
    } catch {
    }
    if (!paths2.has(path)) issues.push(`\u5F15\u7528\u7684\u6587\u4EF6\u4E0D\u5B58\u5728\uFF1A${path}`);
  }
  return [...new Set(issues)];
}
var ATTACHMENTS_START = "<!-- gallery:attachments:start -->";
var ATTACHMENTS_END = "<!-- gallery:attachments:end -->";
function syncSkillAttachments(body, files) {
  const clean = body.replace(
    /\n*<!-- gallery:attachments:start -->[\s\S]*?<!-- gallery:attachments:end -->/g,
    ""
  );
  if (!files.length) return clean;
  const links = files.map((file) => {
    const label = file.path.replace(/[\[\]\\]/g, "\\$&");
    const target = file.path.split("/").map(
      (part) => encodeURIComponent(part).replace(
        /[()]/g,
        (char) => char === "(" ? "%28" : "%29"
      )
    ).join("/");
    return `- [${label}](${target})`;
  });
  return `${clean.trimEnd()}

${ATTACHMENTS_START}
## \u9644\u5C5E\u6587\u4EF6

${links.join("\n")}
${ATTACHMENTS_END}`;
}

// src/client/skill-wizard.jsx
var steps4 = ["\u57FA\u672C\u4FE1\u606F", "\u7F16\u5199\u6307\u5F15", "\u68C0\u67E5\u4FDD\u5B58"];
var folders = [
  ["references", "\u53C2\u8003\u8D44\u6599", "\u6267\u884C\u65F6\u9700\u8981\u67E5\u9605\u7684\u6587\u6863", "file"],
  ["scripts", "\u8F85\u52A9\u811A\u672C", "\u6267\u884C\u4EFB\u52A1\u9700\u8981\u8FD0\u884C\u7684\u4EE3\u7801", "settings"],
  ["assets", "\u7D20\u6750\u6A21\u677F", "\u6A21\u677F\u3001\u56FE\u7247\u53CA\u5176\u4ED6\u7D20\u6750", "folder"]
];
function Preview({ text: text2 }) {
  return /* @__PURE__ */ import_react9.default.createElement("div", { className: "gal-skill-preview" }, text2.split("\n").map((line, i) => {
    if (/^### /.test(line)) return /* @__PURE__ */ import_react9.default.createElement("h4", { key: i }, line.slice(4));
    if (/^## /.test(line)) return /* @__PURE__ */ import_react9.default.createElement("h3", { key: i }, line.slice(3));
    if (/^# /.test(line)) return /* @__PURE__ */ import_react9.default.createElement("h2", { key: i }, line.slice(2));
    return /* @__PURE__ */ import_react9.default.createElement("p", { key: i }, line || "\xA0");
  }));
}
function SkillWizard({ resource, onClose, onSave }) {
  const [cover, setCover] = (0, import_react9.useState)(resource?.metadata?.cover ?? "");
  const [initial2] = (0, import_react9.useState)(() => readSkill(resource));
  const [step, setStep] = (0, import_react9.useState)(0), [name, setName] = (0, import_react9.useState)(initial2.name || `skill-${crypto.randomUUID().slice(0, 8)}`), [displayName, setDisplayName] = (0, import_react9.useState)(resource?.name || ""), [description, setDescription] = (0, import_react9.useState)(initial2.description), [body, setBody] = (0, import_react9.useState)(initial2.body), [files, setFiles] = (0, import_react9.useState)(initial2.files), [tags, setTags] = (0, import_react9.useState)((resource?.tags || []).join(", ")), [active, setActive] = (0, import_react9.useState)(-1), [preview, setPreview] = (0, import_react9.useState)(false), [error, setError] = (0, import_react9.useState)(""), [busy, setBusy] = (0, import_react9.useState)(false);
  const heading = (0, import_react9.useRef)(null);
  (0, import_react9.useEffect)(() => {
    heading.current?.focus();
  }, [step]);
  const linkedBody = syncSkillAttachments(body, files);
  const document2 = skillDocument(
    name,
    description,
    linkedBody,
    initial2.frontmatter
  );
  (0, import_react9.useEffect)(() => {
    setBody((value) => syncSkillAttachments(value, files));
  }, [files]);
  const parsedTags = [
    ...new Set(
      tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean)
    )
  ];
  const issues = [
    ...parsedTags.length > 20 ? ["\u6700\u591A\u6DFB\u52A0 20 \u4E2A\u6807\u7B7E\u3002"] : [],
    ...parsedTags.some((tag) => tag.length > 40) ? ["\u6BCF\u4E2A\u6807\u7B7E\u6700\u591A 40 \u4E2A\u5B57\u7B26\u3002"] : [],
    ...!displayName.trim() || displayName.length > 160 ? ["\u8BF7\u586B\u5199\u540D\u79F0\uFF0C\u6700\u591A 160 \u5B57\u7B26\u3002"] : [],
    ...initial2.error ? [initial2.error] : [],
    ...skillIssues(name, description, linkedBody, files)
  ];
  const basicValid = !!displayName.trim() && displayName.length <= 160 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) && name.length <= 64 && !!description.trim() && description.length <= 1024;
  const bodyValid = !!body.trim() && body !== SKILL_TEMPLATE;
  function go(next) {
    setError("");
    setStep(next);
  }
  async function upload(folder, list) {
    setBusy(true);
    setError("");
    try {
      const incoming = [];
      if (files.length + list.length > 99)
        throw new Error("\u6700\u591A\u6DFB\u52A0 99 \u4E2A\u9644\u5C5E\u6587\u4EF6\u3002");
      if ([...list].reduce((sum, f) => sum + f.size, 0) > 5 * 1024 * 1024)
        throw new Error("\u4E0A\u4F20\u6587\u4EF6\u603B\u5927\u5C0F\u4E0D\u80FD\u8D85\u8FC7 5 MiB\u3002");
      for (const file of list) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let content, encoding;
        try {
          content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
          if (content.includes("\0")) throw new Error();
          encoding = "utf8";
        } catch {
          let raw = "";
          for (const b of bytes) raw += String.fromCharCode(b);
          content = btoa(raw);
          encoding = "base64";
        }
        incoming.push({ path: `${folder}/${file.name}`, encoding, content });
      }
      const merged = [...files, ...incoming];
      const errors = skillIssues(name, description, body, merged).filter(
        (e) => !e.startsWith("\u5F15\u7528\u7684\u6587\u4EF6")
      );
      if (errors.length) throw new Error(errors.join("\n"));
      setFiles(merged);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function newFile(folder) {
    let n = 1, path;
    do {
      path = `${folder}/untitled-${n++}.${folder === "scripts" ? "py" : "md"}`;
    } while (files.some((f) => f.path === path));
    setFiles([...files, { path, encoding: "utf8", content: "" }]);
    setActive(files.length);
  }
  async function save() {
    if (issues.length) return;
    setBusy(true);
    setError("");
    try {
      await onSave({
        type: "skill",
        name: displayName.trim(),
        description: description.trim(),
        tags: parsedTags,
        metadata: withResourceCover(resource?.metadata, cover),
        references: resource?.references || [],
        files: [
          { path: "SKILL.md", encoding: "utf8", content: document2 },
          ...files
        ]
      });
    } catch (e) {
      setError(e?.rpcError?.message || e.message || String(e));
      setBusy(false);
    }
  }
  const current = files[active];
  return /* @__PURE__ */ import_react9.default.createElement(Modal, { onClose: () => !busy && onClose() }, /* @__PURE__ */ import_react9.default.createElement(
    "section",
    {
      className: "gal-dialog gal-skill-wizard",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": resource ? "\u7F16\u8F91 Skill" : "\u65B0\u5EFA Skill",
      tabIndex: -1
    },
    /* @__PURE__ */ import_react9.default.createElement("header", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react9.default.createElement("h2", null, /* @__PURE__ */ import_react9.default.createElement(Glyph, { name: "skill" }), " ", resource ? "\u7F16\u8F91 Skill" : "\u65B0\u5EFA Skill"), /* @__PURE__ */ import_react9.default.createElement("button", { "aria-label": "\u5173\u95ED\u7F16\u8F91", disabled: busy, onClick: onClose }, /* @__PURE__ */ import_react9.default.createElement(Glyph, { name: "close" }))),
    /* @__PURE__ */ import_react9.default.createElement("nav", { className: "gal-skill-steps gal-three-steps", "aria-label": "\u521B\u5EFA\u8FDB\u5EA6" }, steps4.map((title, i) => /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        key: title,
        disabled: busy || i > 0 && !basicValid || i > 1 && !bodyValid,
        "aria-current": step === i ? "step" : void 0,
        onClick: () => go(i)
      },
      /* @__PURE__ */ import_react9.default.createElement("span", null, i < step ? "\u2713" : i + 1),
      title
    ))),
    /* @__PURE__ */ import_react9.default.createElement("div", { className: "gal-dialog-body gal-skill-layout" }, /* @__PURE__ */ import_react9.default.createElement("main", null, /* @__PURE__ */ import_react9.default.createElement("h3", { ref: heading, tabIndex: -1 }, steps4[step]), step === 0 && /* @__PURE__ */ import_react9.default.createElement(ResourceBasics, { name: displayName, onName: setDisplayName, description, onDescription: setDescription, identifier: name, onIdentifier: setName, busy }), step === 1 && /* @__PURE__ */ import_react9.default.createElement("div", { className: "gal-skill-fields" }, /* @__PURE__ */ import_react9.default.createElement("p", null, "\u5199\u6E05\u9002\u7528\u573A\u666F\u3001\u6267\u884C\u6B65\u9AA4\u548C\u4EA4\u4ED8\u7ED3\u679C\uFF0C\u53EF\u4EE5\u9644\u4E0A\u8F93\u5165\u4E0E\u8F93\u51FA\u793A\u4F8B\u3002"), /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        "aria-pressed": preview,
        onClick: () => setPreview(!preview)
      },
      preview ? "\u7EE7\u7EED\u7F16\u8F91" : "\u9884\u89C8\u6B63\u6587"
    ), preview ? /* @__PURE__ */ import_react9.default.createElement(Preview, { text: body }) : /* @__PURE__ */ import_react9.default.createElement("label", null, "\u6267\u884C\u6307\u5F15", /* @__PURE__ */ import_react9.default.createElement(
      "textarea",
      {
        "aria-label": "\u6267\u884C\u6307\u5F15",
        className: "gal-skill-code",
        rows: 15,
        value: body,
        onChange: (e) => setBody(e.target.value)
      }
    )), /* @__PURE__ */ import_react9.default.createElement("details", { className: "gal-skill-fields" }, /* @__PURE__ */ import_react9.default.createElement("summary", null, "\u9644\u5C5E\u6587\u4EF6\u4E0E\u9009\u9879 \xB7 ", files.length, " \u4E2A\u9644\u4EF6"), /* @__PURE__ */ import_react9.default.createElement("div", { className: "gal-skill-folders" }, folders.map(([folder, title, hint, icon]) => /* @__PURE__ */ import_react9.default.createElement(
      "section",
      {
        key: folder,
        className: "gal-skill-folder",
        onDragOver: (e) => e.preventDefault(),
        onDrop: (e) => {
          e.preventDefault();
          if (!busy) upload(folder, e.dataTransfer.files);
        }
      },
      /* @__PURE__ */ import_react9.default.createElement(Glyph, { name: icon, size: 28 }),
      /* @__PURE__ */ import_react9.default.createElement("h3", null, title),
      /* @__PURE__ */ import_react9.default.createElement("code", null, folder, "/"),
      /* @__PURE__ */ import_react9.default.createElement("p", null, hint),
      /* @__PURE__ */ import_react9.default.createElement("label", { className: "gal-upload" }, "\u4E0A\u4F20\u6216\u62D6\u5165", /* @__PURE__ */ import_react9.default.createElement(
        "input",
        {
          "aria-label": `\u4E0A\u4F20${title}`,
          type: "file",
          multiple: true,
          disabled: busy,
          onChange: (e) => {
            upload(folder, e.target.files);
            e.target.value = "";
          }
        }
      )),
      /* @__PURE__ */ import_react9.default.createElement(
        "button",
        {
          disabled: busy || files.length >= 99,
          onClick: () => newFile(folder)
        },
        "\u65B0\u5EFA\u6587\u4EF6"
      ),
      /* @__PURE__ */ import_react9.default.createElement("span", null, files.filter((f) => f.path.startsWith(folder + "/")).length, " ", "\u4E2A\u6587\u4EF6")
    ))), /* @__PURE__ */ import_react9.default.createElement("div", { className: "gal-skill-attachments" }, files.length > 0 && /* @__PURE__ */ import_react9.default.createElement("div", { className: "gal-skill-filelist" }, files.map((f, i) => /* @__PURE__ */ import_react9.default.createElement("div", { key: i }, /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        onClick: () => setActive(i),
        "aria-pressed": active === i
      },
      /* @__PURE__ */ import_react9.default.createElement(Glyph, { name: "file" }),
      f.path
    ), /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        "aria-label": `\u5220\u9664 ${f.path}`,
        disabled: busy,
        onClick: () => {
          setFiles(files.filter((_, j) => i !== j));
          setActive(-1);
        }
      },
      /* @__PURE__ */ import_react9.default.createElement(Glyph, { name: "close" })
    )))), current && /* @__PURE__ */ import_react9.default.createElement("fieldset", { disabled: busy, className: "gal-skill-fields" }, /* @__PURE__ */ import_react9.default.createElement("label", null, "\u6587\u4EF6\u8DEF\u5F84", /* @__PURE__ */ import_react9.default.createElement(
      "input",
      {
        value: current.path,
        onChange: (e) => setFiles(
          files.map(
            (f, i) => i === active ? { ...f, path: e.target.value } : f
          )
        )
      }
    )), current.encoding === "utf8" ? /* @__PURE__ */ import_react9.default.createElement("label", null, "\u6587\u4EF6\u5185\u5BB9", /* @__PURE__ */ import_react9.default.createElement(
      "textarea",
      {
        "aria-label": "\u6587\u4EF6\u5185\u5BB9",
        rows: 8,
        value: current.content,
        onChange: (e) => setFiles(
          files.map(
            (f, i) => i === active ? { ...f, content: e.target.value } : f
          )
        )
      }
    )) : /* @__PURE__ */ import_react9.default.createElement("p", null, "\u4E8C\u8FDB\u5236\u9644\u4EF6\u5C06\u539F\u6837\u4FDD\u5B58\u3002"))))), step === 2 && /* @__PURE__ */ import_react9.default.createElement("div", { className: "gal-skill-fields" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "gal-skill-summary" }, /* @__PURE__ */ import_react9.default.createElement(Glyph, { name: "skill", size: 36 }), /* @__PURE__ */ import_react9.default.createElement("h2", null, name), /* @__PURE__ */ import_react9.default.createElement("p", null, description), /* @__PURE__ */ import_react9.default.createElement("span", null, files.length + 1, " \u4E2A\u6587\u4EF6 \xB7 \u6574\u4F53\u4FDD\u5B58")), /* @__PURE__ */ import_react9.default.createElement(
      ResourceCoverPicker,
      {
        resource: {
          type: "skill",
          name,
          description,
          tags: tags.split(/[,，]/),
          cover
        },
        onChange: setCover
      }
    ), /* @__PURE__ */ import_react9.default.createElement("label", null, "\u6807\u7B7E\uFF08\u9009\u586B\uFF09", /* @__PURE__ */ import_react9.default.createElement(
      "input",
      {
        "aria-label": "\u6807\u7B7E",
        value: tags,
        onChange: (e) => setTags(e.target.value),
        placeholder: "\u4F8B\u5982\uFF1A\u5F00\u53D1\uFF0C\u4EE3\u7801\u5BA1\u67E5"
      }
    )), /* @__PURE__ */ import_react9.default.createElement("p", null, "\u7528\u9017\u53F7\u5206\u9694\uFF0C\u6700\u591A 20 \u4E2A\u6807\u7B7E\u3002"), !!parsedTags.length && /* @__PURE__ */ import_react9.default.createElement("div", { className: "gal-tags" }, parsedTags.map((tag) => /* @__PURE__ */ import_react9.default.createElement("span", { key: tag }, tag))), issues.length ? /* @__PURE__ */ import_react9.default.createElement("div", { role: "alert", className: "gal-error" }, issues.map((x) => /* @__PURE__ */ import_react9.default.createElement("p", { key: x }, x))) : /* @__PURE__ */ import_react9.default.createElement("p", { className: "gal-skill-ok" }, "\u2713 \u683C\u5F0F\u68C0\u67E5\u901A\u8FC7\uFF0C\u53EF\u4EE5\u4FDD\u5B58"), /* @__PURE__ */ import_react9.default.createElement("details", null, /* @__PURE__ */ import_react9.default.createElement("summary", null, "\u67E5\u770B SKILL.md"), /* @__PURE__ */ import_react9.default.createElement("pre", { className: "gal-skill-preview" }, document2))), error && /* @__PURE__ */ import_react9.default.createElement("p", { role: "alert", className: "gal-error" }, error)), /* @__PURE__ */ import_react9.default.createElement("details", { open: true, className: "gal-skill-tree" }, /* @__PURE__ */ import_react9.default.createElement("summary", null, "\u6587\u4EF6\u7ED3\u6784"), /* @__PURE__ */ import_react9.default.createElement("strong", null, /* @__PURE__ */ import_react9.default.createElement(Glyph, { name: "folder" }), " ", name || "my-skill", "/"), /* @__PURE__ */ import_react9.default.createElement("div", null, /* @__PURE__ */ import_react9.default.createElement(Glyph, { name: "file" }), " SKILL.md"), folders.map(
      ([folder]) => files.some((f) => f.path.startsWith(folder + "/")) && /* @__PURE__ */ import_react9.default.createElement("div", { key: folder }, /* @__PURE__ */ import_react9.default.createElement("strong", null, /* @__PURE__ */ import_react9.default.createElement(Glyph, { name: "folder" }), " ", folder, "/"), files.filter((f) => f.path.startsWith(folder + "/")).map((f, i) => /* @__PURE__ */ import_react9.default.createElement("div", { className: "gal-skill-leaf", key: i }, /* @__PURE__ */ import_react9.default.createElement(Glyph, { name: "file" }), f.path.slice(folder.length + 1))))
    ))),
    /* @__PURE__ */ import_react9.default.createElement("footer", { className: "gal-skill-footer" }, /* @__PURE__ */ import_react9.default.createElement("button", { disabled: busy, onClick: step ? () => go(step - 1) : onClose }, step ? "\u4E0A\u4E00\u6B65" : "\u53D6\u6D88"), step < 2 ? /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        className: "gal-primary",
        disabled: busy || step === 0 && !basicValid || step === 1 && !bodyValid,
        onClick: () => go(step + 1)
      },
      "\u4E0B\u4E00\u6B65",
      /* @__PURE__ */ import_react9.default.createElement(Glyph, { name: "arrow" })
    ) : /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        className: "gal-primary",
        disabled: busy || !!issues.length,
        onClick: save
      },
      busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58 Skill"
    ))
  ));
}

// src/client/brand-icon.jsx
var import_react10 = __toESM(require("react"), 1);
function BrandIcon({ size = 20 }) {
  return /* @__PURE__ */ import_react10.default.createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "3 2.5 26 26",
      fill: "none",
      "aria-hidden": "true",
      focusable: "false"
    },
    /* @__PURE__ */ import_react10.default.createElement(
      "path",
      {
        d: "M8 12h16l1 14H7l1-14Z",
        stroke: "currentColor",
        strokeWidth: "1.8",
        strokeLinejoin: "round"
      }
    ),
    /* @__PURE__ */ import_react10.default.createElement(
      "path",
      {
        d: "M12 12V9a4 4 0 0 1 8 0v3",
        stroke: "currentColor",
        strokeWidth: "1.8",
        strokeLinecap: "round"
      }
    ),
    /* @__PURE__ */ import_react10.default.createElement("rect", { x: "11", y: "16", width: "4", height: "3", rx: ".8", fill: "currentColor" }),
    /* @__PURE__ */ import_react10.default.createElement("rect", { x: "17", y: "16", width: "4", height: "3", rx: ".8", fill: "currentColor" }),
    /* @__PURE__ */ import_react10.default.createElement("rect", { x: "11", y: "21", width: "4", height: "3", rx: ".8", fill: "currentColor" }),
    /* @__PURE__ */ import_react10.default.createElement("rect", { x: "17", y: "21", width: "4", height: "3", rx: ".8", fill: "currentColor" })
  );
}

// src/client/theme.mjs
var THEME_KEY = "dsh-gallery-theme";
var THEMES = [
  { id: "system", label: "\u8DDF\u968F\u7CFB\u7EDF", hint: "\u5F53\u524D Gallery \u5916\u89C2" },
  { id: "atelier", label: "\u58A8\u7EFF\u9EC4\u94DC", hint: "\u6DF1\u8272\u5C55\u5385" },
  { id: "paper", label: "\u6696\u7EB8", hint: "\u67D4\u548C\u6D45\u8272" },
  { id: "comic", label: "\u6F2B\u753B\u5370\u5237", hint: "\u7C97\u58A8\u5206\u955C\u4E0E\u5F69\u8272\u7F51\u70B9" },
  { id: "astral", label: "\u938F\u91D1\u661F\u7A79", hint: "\u661F\u8F68\u3001\u6D41\u661F\u4E0E\u5B9D\u77F3\u699C\u5355" },
  { id: "neon", label: "\u9713\u8679\u73BB\u7483", hint: "\u6C89\u6D78\u5F0F\u8D44\u6E90\u821E\u53F0" }
];
function loadTheme(storage) {
  try {
    const value = storage?.getItem(THEME_KEY);
    return THEMES.some((theme) => theme.id === value) ? value : "system";
  } catch {
    return "system";
  }
}
function saveTheme(storage, theme) {
  if (!THEMES.some((item) => item.id === theme)) return false;
  try {
    storage?.setItem(THEME_KEY, theme);
  } catch {
  }
  return true;
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
  return /* @__PURE__ */ import_react11.default.createElement(BrandIcon, { size });
}
function Gallery({ remote }) {
  const [theme, setTheme] = (0, import_react11.useState)(() => loadTheme(globalThis.localStorage));
  const [motionPaused, setMotionPaused] = (0, import_react11.useState)(false);
  const [themeMenu, setThemeMenu] = (0, import_react11.useState)(false);
  const themeMenuRef = (0, import_react11.useRef)(null);
  (0, import_react11.useEffect)(() => {
    if (!themeMenu) return;
    const closeOutside = (event) => {
      if (!themeMenuRef.current?.contains(event.target)) setThemeMenu(false);
    };
    const closeEscape = (event) => {
      if (event.key === "Escape") setThemeMenu(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [themeMenu]);
  const [status, setStatus] = (0, import_react11.useState)(null), [error, setError] = (0, import_react11.useState)(""), [notice, updateNotice] = (0, import_react11.useState)(null), [busy, setBusy] = (0, import_react11.useState)(false);
  function setNotice(message) {
    updateNotice(message ? { message } : null);
  }
  (0, import_react11.useEffect)(() => {
    if (!notice) return;
    const root = document.createElement("div");
    root.className = "gal gal-toast-host";
    root.dataset.theme = theme;
    const toast = document.createElement("div");
    toast.className = "gal-notice";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    const mark = document.createElement("span");
    mark.textContent = "\u2713";
    mark.setAttribute("aria-hidden", "true");
    const message = document.createElement("span");
    message.textContent = notice.message;
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "\xD7";
    close.setAttribute("aria-label", "\u5173\u95ED\u63D0\u793A");
    close.addEventListener("click", () => updateNotice(null));
    toast.append(mark, message, close);
    root.append(toast);
    document.body.append(root);
    const timer = setTimeout(() => updateNotice(null), 5e3);
    return () => {
      clearTimeout(timer);
      root.remove();
    };
  }, [notice, theme]);
  const [boards, setBoards] = (0, import_react11.useState)([]);
  const [items, setItems] = (0, import_react11.useState)([]), [total, setTotal] = (0, import_react11.useState)(0), [type, setType] = (0, import_react11.useState)(""), [scope, setScope] = (0, import_react11.useState)("all"), [q, setQ] = (0, import_react11.useState)(""), [refresh, setRefresh] = (0, import_react11.useState)(0), [offset, setOffset] = (0, import_react11.useState)(0), [loading, setLoading] = (0, import_react11.useState)(false);
  const [selected, setSelected] = (0, import_react11.useState)(null), [editor, setEditor] = (0, import_react11.useState)(null);
  const [skillWizard, setSkillWizard] = (0, import_react11.useState)(false);
  const [agentWizard, setAgentWizard] = (0, import_react11.useState)(false);
  const [mcpWizard, setMcpWizard] = (0, import_react11.useState)(false);
  const [workflowWizard, setWorkflowWizard] = (0, import_react11.useState)(false);
  const [storageSettings, setStorageSettings] = (0, import_react11.useState)(null);
  const [connectionResult, setConnectionResult] = (0, import_react11.useState)("");
  const [confirmation, setConfirmation] = (0, import_react11.useState)(null);
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
  (0, import_react11.useEffect)(() => {
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
  (0, import_react11.useEffect)(() => {
    if (!status?.ready) return;
    let live = true;
    setLoading(true);
    const timer = setTimeout(
      () => (type ? call(remote, "uiList", json2({ type, scope, q, limit: 48, offset })) : Promise.all(
        Object.keys(TYPES).map(async (key) => ({
          type: key,
          ...await call(
            remote,
            "uiList",
            json2({ type: key, q, sort: "usage", limit: 10, offset: 0 })
          )
        }))
      )).then((x) => {
        if (live) {
          if (type) {
            setItems(x.items);
            setTotal(x.total);
          } else {
            setBoards(x);
            setTotal(x.reduce((sum, board) => sum + board.total, 0));
          }
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
    return r;
  }
  function edit(r) {
    setNotice("");
    setError("");
    if (!r && !type) return;
    setSelected(null);
    if ((r?.type || type) === "skill") {
      setSkillWizard({ resource: r || null });
      return;
    }
    if ((r?.type || type) === "agent") {
      setAgentWizard({ resource: r || null });
      return;
    }
    if ((r?.type || type) === "mcp") {
      setMcpWizard({ resource: r || null });
      return;
    }
    if ((r?.type || type) === "workflow") {
      setWorkflowWizard({ resource: r || null });
      return;
    }
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
  async function removeResource(resource) {
    if (busy || !await confirmAction(
      `\u5220\u9664\u300C${resource.name}\u300D\uFF1F\u8D44\u6E90\u548C\u7D2F\u8BA1\u8C03\u7528\u8BB0\u5F55\u5C06\u88AB\u5220\u9664\uFF0C\u65E0\u6CD5\u6062\u590D\u3002`
    ))
      return;
    await run(async () => {
      await call(
        remote,
        "uiDelete",
        resource.id,
        json2({ expectedRevision: resource.revision })
      );
      setSelected(null);
      setOffset(0);
      setRefresh((x) => x + 1);
      setNotice("\u8D44\u6E90\u5DF2\u5220\u9664\u3002");
    });
  }
  const content = selected;
  const activeFile = editor?.resource.files[editor.fileIndex];
  const chooseFilter = (t) => {
    setType(t);
    setOffset(0);
  };
  return /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal", "data-theme": theme, "data-motion-paused": motionPaused }, theme === "astral" && /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-astral-sky", "aria-hidden": "true" }, /* @__PURE__ */ import_react11.default.createElement("svg", { className: "gal-astral-chart", viewBox: "0 0 540 240", fill: "none" }, /* @__PURE__ */ import_react11.default.createElement("g", { stroke: "currentColor", strokeWidth: "0.7" }, /* @__PURE__ */ import_react11.default.createElement("circle", { cx: "270", cy: "68", r: "144" }), /* @__PURE__ */ import_react11.default.createElement("circle", { cx: "270", cy: "68", r: "126", strokeDasharray: "2 5" }), /* @__PURE__ */ import_react11.default.createElement("circle", { cx: "270", cy: "68", r: "106" }), /* @__PURE__ */ import_react11.default.createElement("path", { d: "M24 68h492M270 0v224M133 0l274 136M407 0L133 136", opacity: ".45" })), /* @__PURE__ */ import_react11.default.createElement("circle", { className: "gal-astral-orbit", cx: "376", cy: "68", r: "3.5", fill: "#fff4c9" }), /* @__PURE__ */ import_react11.default.createElement("path", { d: "M270 43l5 20 20 5-20 5-5 20-5-20-20-5 20-5z", fill: "#fff1c9" })), /* @__PURE__ */ import_react11.default.createElement("span", { className: "gal-astral-meteor" }), /* @__PURE__ */ import_react11.default.createElement("span", { className: "gal-astral-meteor" }), /* @__PURE__ */ import_react11.default.createElement("span", { className: "gal-astral-meteor" })), /* @__PURE__ */ import_react11.default.createElement("header", { className: "gal-header" }, /* @__PURE__ */ import_react11.default.createElement("div", null, /* @__PURE__ */ import_react11.default.createElement("h1", null, /* @__PURE__ */ import_react11.default.createElement(BrandIcon, { size: 32 }), "Gallery", theme === "astral" && /* @__PURE__ */ import_react11.default.createElement("span", { className: "gal-astral-title" }, "\u938F\u91D1\u661F\u7A79"))), /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-header-actions" }, theme === "astral" && /* @__PURE__ */ import_react11.default.createElement(
    "button",
    {
      className: "gal-astral-motion",
      type: "button",
      onClick: () => setMotionPaused((paused) => !paused)
    },
    motionPaused ? "\u7EE7\u7EED\u52A8\u6548" : "\u6682\u505C\u52A8\u6548"
  ), /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-theme-picker", ref: themeMenuRef }, /* @__PURE__ */ import_react11.default.createElement("button", { className: "gal-icon-button", "aria-label": "\u5207\u6362\u4E3B\u9898", "aria-expanded": themeMenu, title: `\u4E3B\u9898 \xB7 ${THEMES.find((item) => item.id === theme)?.label}`, onClick: () => setThemeMenu((open) => !open) }, /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "palette", size: 20 })), themeMenu && /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-theme-menu", role: "group", "aria-label": "\u9009\u62E9\u4E3B\u9898" }, THEMES.map((item) => /* @__PURE__ */ import_react11.default.createElement("button", { key: item.id, "aria-pressed": theme === item.id, onClick: () => {
    saveTheme(globalThis.localStorage, item.id);
    setTheme(item.id);
    setThemeMenu(false);
  } }, /* @__PURE__ */ import_react11.default.createElement("span", { className: `gal-theme-swatch ${item.id}`, "aria-hidden": "true" }), /* @__PURE__ */ import_react11.default.createElement("span", null, /* @__PURE__ */ import_react11.default.createElement("strong", null, item.label), /* @__PURE__ */ import_react11.default.createElement("small", null, item.hint)), theme === item.id && /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "check", size: 16 }))))), /* @__PURE__ */ import_react11.default.createElement(
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
    /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "settings", size: 20 })
  ))), error && /* @__PURE__ */ import_react11.default.createElement("div", { role: "alert", className: "gal-alert" }, error, /* @__PURE__ */ import_react11.default.createElement("button", { "aria-label": "\u5173\u95ED\u9519\u8BEF", onClick: () => setError("") }, /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "close" }))), !status?.ready ? /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-empty" }, error ? "\u8D44\u6E90\u5E93\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u68C0\u67E5\u63D0\u793A\u540E\u5237\u65B0\u3002" : "\u6B63\u5728\u6253\u5F00\u672C\u5730\u8D44\u6E90\u5E93\u2026") : /* @__PURE__ */ import_react11.default.createElement(import_react11.default.Fragment, null, /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-toolbar" }, /* @__PURE__ */ import_react11.default.createElement("nav", { className: "gal-filters", "aria-label": "\u8D44\u6E90\u7C7B\u578B" }, /* @__PURE__ */ import_react11.default.createElement(
    "button",
    {
      className: !type ? "active" : "",
      "aria-pressed": !type,
      onClick: () => {
        setScope("all");
        chooseFilter("");
      }
    },
    /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "grid" }),
    "\u5168\u90E8"
  ), Object.entries(TYPES).map(([key, label]) => /* @__PURE__ */ import_react11.default.createElement(
    "button",
    {
      key,
      className: type === key ? "active" : "",
      "aria-pressed": type === key,
      onClick: () => chooseFilter(key)
    },
    /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: key }),
    label
  ))), /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-search-wrap" }, /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "search" }), /* @__PURE__ */ import_react11.default.createElement(
    "input",
    {
      "aria-label": "\u641C\u7D22\u8D44\u6E90",
      className: "gal-search",
      placeholder: "\u641C\u7D22\u8D44\u6E90\u3001\u7528\u6237\u540D\u6216\u6807\u7B7E\u2026",
      value: q,
      onChange: (e) => {
        setQ(e.target.value);
        setOffset(0);
      }
    }
  ))), /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-list-heading" }, /* @__PURE__ */ import_react11.default.createElement("span", null, type ? TYPES[type] : "\u8C03\u7528\u699C", " ", /* @__PURE__ */ import_react11.default.createElement("strong", null, total)), /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-list-actions" }, type && /* @__PURE__ */ import_react11.default.createElement(
    "button",
    {
      className: "gal-primary",
      disabled: busy,
      onClick: () => edit(null)
    },
    /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "plus" }),
    "\u65B0\u5EFA ",
    TYPES[type]
  ), /* @__PURE__ */ import_react11.default.createElement(
    "button",
    {
      className: "gal-icon-button",
      title: "\u5237\u65B0\u8D44\u6E90",
      "aria-label": "\u5237\u65B0",
      disabled: busy,
      onClick: () => setRefresh((x) => x + 1)
    },
    /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "refresh" })
  ))), loading ? /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-empty" }, "\u6B63\u5728\u52A0\u8F7D\u8D44\u6E90\u2026") : !type ? /* @__PURE__ */ import_react11.default.createElement(
    Leaderboards,
    {
      boards,
      busy,
      filtered: !!q,
      onOpen: (r) => run(() => load(r.id)),
      onCategory: chooseFilter
    }
  ) : items.length === 0 ? /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-empty" }, /* @__PURE__ */ import_react11.default.createElement(Icon, null), /* @__PURE__ */ import_react11.default.createElement("h3", null, q || type || scope !== "all" ? "\u6CA1\u6709\u5339\u914D\u7684\u8D44\u6E90" : "\u6682\u65E0\u8D44\u6E90"), /* @__PURE__ */ import_react11.default.createElement("p", null, q || type || scope !== "all" ? "\u8BD5\u8BD5\u5176\u4ED6\u5173\u952E\u8BCD\u6216\u5206\u7C7B\u3002" : "\u9009\u62E9\u5206\u7C7B\u540E\u65B0\u5EFA\u8D44\u6E90\u3002")) : /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-resource-grid" }, items.map((r) => /* @__PURE__ */ import_react11.default.createElement(
    "button",
    {
      key: r.id,
      className: "gal-resource-card",
      title: r.name,
      disabled: busy,
      onClick: () => run(() => load(r.id))
    },
    /* @__PURE__ */ import_react11.default.createElement(ResourceCover, { resource: r }),
    /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-resource-content" }, /* @__PURE__ */ import_react11.default.createElement("h3", null, r.name), r.description && /* @__PURE__ */ import_react11.default.createElement("p", null, r.description)),
    /* @__PURE__ */ import_react11.default.createElement(
      "p",
      {
        className: "gal-card-creator",
        title: `\u521B\u5EFA\u8005\uFF1A${r.creator?.username || "\u672A\u8BB0\u5F55"}`
      },
      /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "user", size: 15 }),
      r.creator?.username || "\u672A\u8BB0\u5F55"
    ),
    /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-tags" }, r.tags.slice(0, 2).map((t) => /* @__PURE__ */ import_react11.default.createElement("span", { key: t }, t))),
    /* @__PURE__ */ import_react11.default.createElement("footer", null, hasResourceCover(r.type) && /* @__PURE__ */ import_react11.default.createElement(
      "span",
      {
        title: "\u7D2F\u8BA1\u8C03\u7528\u6B21\u6570",
        "aria-label": `\u7D2F\u8BA1\u8C03\u7528 ${r.usageCount ?? 0} \u6B21`
      },
      /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "usage", size: 15 }),
      (r.usageCount ?? 0).toLocaleString(),
      " \u6B21"
    ), /* @__PURE__ */ import_react11.default.createElement("span", { title: "\u6587\u4EF6\u6570\u91CF" }, /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "file", size: 15 }), r.fileCount), /* @__PURE__ */ import_react11.default.createElement("span", { title: "\u66F4\u65B0\u65F6\u95F4" }, /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "clock", size: 15 }), new Date(r.updatedAt).toLocaleDateString()))
  ))), type && total > 48 && /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-pagination" }, /* @__PURE__ */ import_react11.default.createElement(
    "button",
    {
      disabled: !offset,
      onClick: () => setOffset((x) => Math.max(0, x - 48))
    },
    "\u4E0A\u4E00\u9875"
  ), /* @__PURE__ */ import_react11.default.createElement("span", null, Math.floor(offset / 48) + 1, " / ", Math.ceil(total / 48)), /* @__PURE__ */ import_react11.default.createElement(
    "button",
    {
      disabled: offset + 48 >= total,
      onClick: () => setOffset((x) => x + 48)
    },
    "\u4E0B\u4E00\u9875"
  ))), workflowWizard && /* @__PURE__ */ import_react11.default.createElement(WorkflowWizard, { resource: workflowWizard.resource, onClose: async () => {
    if (await confirmAction("\u653E\u5F03\u5C1A\u672A\u4FDD\u5B58\u7684 Workflow\uFF1F")) setWorkflowWizard(false);
  }, onSave: async (resource) => {
    const existing = workflowWizard.resource;
    await (existing ? call(remote, "uiUpdate", existing.id, json2({ resource, expectedRevision: existing.revision })) : call(remote, "uiCreate", json2(resource)));
    setSelected(null);
    setWorkflowWizard(false);
    setRefresh((x) => x + 1);
    setNotice("Workflow \u5DF2\u4FDD\u5B58\u3002");
  } }), mcpWizard && /* @__PURE__ */ import_react11.default.createElement(
    McpWizard,
    {
      resource: mcpWizard.resource,
      onClose: async () => {
        if (await confirmAction("\u653E\u5F03\u5C1A\u672A\u4FDD\u5B58\u7684 MCP\uFF1F"))
          setMcpWizard(false);
      },
      onCheck: (config) => call(remote, "uiCheckMcp", json2(config)),
      onSave: async (resource) => {
        const existing = mcpWizard.resource;
        await (existing ? call(
          remote,
          "uiUpdate",
          existing.id,
          json2({ resource, expectedRevision: existing.revision })
        ) : call(remote, "uiCreate", json2(resource)));
        setSelected(null);
        setMcpWizard(false);
        setRefresh((x) => x + 1);
        setNotice("MCP \u5DF2\u4FDD\u5B58\u3002");
      }
    }
  ), agentWizard && /* @__PURE__ */ import_react11.default.createElement(
    AgentWizard,
    {
      resource: agentWizard.resource,
      onClose: async () => {
        if (await confirmAction("\u653E\u5F03\u5C1A\u672A\u4FDD\u5B58\u7684 Agent\uFF1F"))
          setAgentWizard(false);
      },
      onSave: async (resource) => {
        const existing = agentWizard.resource;
        await (existing ? call(
          remote,
          "uiUpdate",
          existing.id,
          json2({ resource, expectedRevision: existing.revision })
        ) : call(remote, "uiCreate", json2(resource)));
        setSelected(null);
        setAgentWizard(false);
        setRefresh((x) => x + 1);
        setNotice("Agent \u5DF2\u4FDD\u5B58\u3002");
      }
    }
  ), skillWizard && /* @__PURE__ */ import_react11.default.createElement(
    SkillWizard,
    {
      resource: skillWizard.resource,
      onClose: async () => {
        if (await confirmAction("\u653E\u5F03\u5C1A\u672A\u4FDD\u5B58\u7684 Skill\uFF1F"))
          setSkillWizard(false);
      },
      onSave: async (resource) => {
        const existing = skillWizard.resource;
        await (existing ? call(
          remote,
          "uiUpdate",
          existing.id,
          json2({ resource, expectedRevision: existing.revision })
        ) : call(remote, "uiCreate", json2(resource)));
        setSelected(null);
        setSkillWizard(false);
        setRefresh((x) => x + 1);
        setNotice("Skill \u5DF2\u4FDD\u5B58\u3002");
      }
    }
  ), selected && !editor && !skillWizard && !agentWizard && !mcpWizard && !workflowWizard && /* @__PURE__ */ import_react11.default.createElement(Modal, { onClose: () => !busy && setSelected(null) }, /* @__PURE__ */ import_react11.default.createElement(
    "section",
    {
      tabIndex: -1,
      className: "gal-dialog gal-detail",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "\u8D44\u6E90\u8BE6\u60C5"
    },
    /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react11.default.createElement("div", null, /* @__PURE__ */ import_react11.default.createElement("span", { className: "gal-pill " + selected.type }, /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: selected.type, size: 16 }), TYPES[selected.type]), /* @__PURE__ */ import_react11.default.createElement("h2", null, content.name), /* @__PURE__ */ import_react11.default.createElement("p", null, "\u521B\u5EFA\u8005\uFF1A", content.creator?.username || "\u672A\u8BB0\u5F55"), /* @__PURE__ */ import_react11.default.createElement("p", null, "\u66F4\u65B0\u4E8E ", when(selected.updatedAt))), /* @__PURE__ */ import_react11.default.createElement(
      "button",
      {
        disabled: busy,
        "aria-label": "\u5173\u95ED\u8BE6\u60C5",
        onClick: () => setSelected(null)
      },
      /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "close" })
    )),
    hasResourceCover(content.type) && /* @__PURE__ */ import_react11.default.createElement(ResourceCover, { resource: content }),
    /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-detail-actions" }, selected.type === "workflow" && selected.files.some((f) => f.path === "workflow.json") && /* @__PURE__ */ import_react11.default.createElement("button", { disabled: busy, onClick: () => run(async () => {
      const result = await call(remote, "uiPublishWorkflow", selected.id);
      setNotice(`\u5DF2\u5B89\u88C5\u5230 TeamFlow\uFF1A${result.name} v${result.version}`);
    }) }, /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "workflow" }), "\u5B89\u88C5\u5230 TeamFlow"), selected.canEdit && /* @__PURE__ */ import_react11.default.createElement("button", { disabled: busy, onClick: () => edit(selected) }, /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "edit" }), "\u7F16\u8F91\u8D44\u6E90"), /* @__PURE__ */ import_react11.default.createElement(
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
      /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "download" }),
      "\u4E0B\u8F7D\u8D44\u6E90"
    ), selected.canDelete && /* @__PURE__ */ import_react11.default.createElement(
      "button",
      {
        className: "gal-delete",
        disabled: busy,
        onClick: () => removeResource(selected)
      },
      /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "trash" }),
      "\u5220\u9664\u8D44\u6E90"
    )),
    /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-dialog-body" }, error && /* @__PURE__ */ import_react11.default.createElement("p", { role: "alert", className: "gal-error" }, error), hasResourceCover(content.type) && /* @__PURE__ */ import_react11.default.createElement("p", { className: "gal-usage-total" }, /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "usage" }), " \u7D2F\u8BA1\u8C03\u7528\u6B21\u6570", " ", /* @__PURE__ */ import_react11.default.createElement("strong", null, (content.usageCount ?? 0).toLocaleString()), " ", "\u6B21"), content.type === "mcp" && /* @__PURE__ */ import_react11.default.createElement("p", null, content.metadata?.mcpVerification?.checkedAt ? "\u5DF2\u901A\u8FC7\u8FDE\u63A5\u68C0\u67E5" : "\u672A\u9A8C\u8BC1\u8FDE\u63A5"), /* @__PURE__ */ import_react11.default.createElement("p", { className: "gal-description" }, content.description || "\u6682\u65E0\u63CF\u8FF0"), /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-tags" }, content.tags.map((t) => /* @__PURE__ */ import_react11.default.createElement("span", { key: t }, t))), content.files.map((f) => /* @__PURE__ */ import_react11.default.createElement("details", { className: "gal-file", key: f.path }, /* @__PURE__ */ import_react11.default.createElement("summary", null, /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "file", size: 16 }), " ", f.path, /* @__PURE__ */ import_react11.default.createElement("span", null, f.bytes ?? new Blob([f.content]).size, " B")), f.encoding === "utf8" ? /* @__PURE__ */ import_react11.default.createElement("pre", null, f.content) : /* @__PURE__ */ import_react11.default.createElement("p", null, "\u4E8C\u8FDB\u5236\u9644\u4EF6\u5305\u542B\u5728\u4E0B\u8F7D\u7684\u8D44\u6E90\u5305\u4E2D\u3002"))))
  )), editor && /* @__PURE__ */ import_react11.default.createElement(Modal, { onClose: closeEditor }, /* @__PURE__ */ import_react11.default.createElement(
    "section",
    {
      tabIndex: -1,
      className: "gal-dialog gal-editor",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": editor.id ? "\u7F16\u8F91\u8D44\u6E90" : "\u65B0\u5EFA\u8D44\u6E90"
    },
    /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react11.default.createElement("div", null, /* @__PURE__ */ import_react11.default.createElement("h2", null, editor.id ? "\u7F16\u8F91" : "\u65B0\u5EFA", " ", TYPES[editor.resource.type])), /* @__PURE__ */ import_react11.default.createElement(
      "button",
      {
        "aria-label": "\u5173\u95ED\u7F16\u8F91",
        onClick: closeEditor,
        disabled: busy
      },
      /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "close" })
    )),
    /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-dialog-body" }, /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-form-row" }, /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-type-field" }, /* @__PURE__ */ import_react11.default.createElement("span", null, "\u7C7B\u578B"), /* @__PURE__ */ import_react11.default.createElement("span", { className: "gal-editor-type" }, /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: editor.resource.type }), TYPES[editor.resource.type])), /* @__PURE__ */ import_react11.default.createElement("label", { className: "gal-grow" }, "\u8D44\u6E90\u540D\u79F0", /* @__PURE__ */ import_react11.default.createElement(
      "input",
      {
        value: editor.resource.name,
        maxLength: 160,
        onChange: (e) => field("name", e.target.value),
        placeholder: "\u8F93\u5165\u8D44\u6E90\u540D\u79F0"
      }
    ))), /* @__PURE__ */ import_react11.default.createElement("label", null, "\u63CF\u8FF0", /* @__PURE__ */ import_react11.default.createElement(
      "textarea",
      {
        rows: 3,
        value: editor.resource.description,
        onChange: (e) => field("description", e.target.value),
        placeholder: "\u8D44\u6E90\u63CF\u8FF0\uFF08\u9009\u586B\uFF09",
        maxLength: 1e4
      }
    )), /* @__PURE__ */ import_react11.default.createElement("label", null, "\u6807\u7B7E", /* @__PURE__ */ import_react11.default.createElement(
      "input",
      {
        value: editor.tags,
        onChange: (e) => change("tags", e.target.value),
        placeholder: "\u6807\u7B7E\uFF0C\u7528\u9017\u53F7\u5206\u9694"
      }
    )), /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-file-toolbar" }, /* @__PURE__ */ import_react11.default.createElement("h3", null, "\u8D44\u6E90\u6587\u4EF6 ", /* @__PURE__ */ import_react11.default.createElement("small", null, editor.resource.files.length, " / 100")), /* @__PURE__ */ import_react11.default.createElement("div", null, /* @__PURE__ */ import_react11.default.createElement("label", { className: "gal-upload" }, /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "upload" }), "\u4E0A\u4F20\u6587\u4EF6", /* @__PURE__ */ import_react11.default.createElement(
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
    )), /* @__PURE__ */ import_react11.default.createElement("label", { className: "gal-upload" }, /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "folder" }), "\u4E0A\u4F20\u6587\u4EF6\u5939", /* @__PURE__ */ import_react11.default.createElement(
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
    )))), editor.importError && /* @__PURE__ */ import_react11.default.createElement("p", { className: "gal-error" }, editor.importError), /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-add-file" }, /* @__PURE__ */ import_react11.default.createElement(
      "input",
      {
        "aria-label": "\u65B0\u6587\u4EF6\u8DEF\u5F84",
        placeholder: "\u65B0\u6587\u4EF6\u8DEF\u5F84\uFF0C\u4F8B\u5982 SKILL.md",
        value: editor.newPath,
        onChange: (e) => change("newPath", e.target.value)
      }
    ), /* @__PURE__ */ import_react11.default.createElement(
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
    )), /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-file-editor" }, /* @__PURE__ */ import_react11.default.createElement("nav", null, editor.resource.files.map((f, i) => /* @__PURE__ */ import_react11.default.createElement(
      "button",
      {
        className: i === editor.fileIndex ? "active" : "",
        key: f.path,
        onClick: () => change("fileIndex", i)
      },
      f.path
    )), !editor.resource.files.length && /* @__PURE__ */ import_react11.default.createElement("p", null, "\u53EF\u4E0A\u4F20\u5DF2\u6709\u6587\u4EF6\uFF0C\u4E5F\u53EF\u76F4\u63A5\u521B\u5EFA\u6587\u672C\u6587\u4EF6\u3002")), /* @__PURE__ */ import_react11.default.createElement("div", null, activeFile ? /* @__PURE__ */ import_react11.default.createElement(import_react11.default.Fragment, null, /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-code-head" }, /* @__PURE__ */ import_react11.default.createElement("span", null, activeFile.path), /* @__PURE__ */ import_react11.default.createElement(
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
    )), activeFile.encoding === "utf8" ? /* @__PURE__ */ import_react11.default.createElement(
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
    ) : /* @__PURE__ */ import_react11.default.createElement("p", null, "\u4E8C\u8FDB\u5236\u6587\u4EF6\u5DF2\u4E0A\u4F20\uFF0C\u53EF\u79FB\u9664\u540E\u91CD\u65B0\u4E0A\u4F20\u66FF\u6362\u3002")) : /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-code-placeholder" }, "\u9009\u62E9\u6587\u4EF6\u4EE5\u67E5\u770B\u6216\u7F16\u8F91")))),
    /* @__PURE__ */ import_react11.default.createElement("footer", { className: "gal-dialog-footer" }, /* @__PURE__ */ import_react11.default.createElement("button", { disabled: busy, onClick: closeEditor }, "\u53D6\u6D88"), /* @__PURE__ */ import_react11.default.createElement(
      "button",
      {
        className: "gal-primary",
        disabled: busy,
        onClick: () => run(save)
      },
      busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u8D44\u6E90"
    ))
  )), storageSettings && /* @__PURE__ */ import_react11.default.createElement(Modal, { onClose: closeStorage }, /* @__PURE__ */ import_react11.default.createElement(
    "section",
    {
      tabIndex: -1,
      className: "gal-dialog gal-storage",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "gal-storage-title"
    },
    /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react11.default.createElement("h2", { id: "gal-storage-title" }, storageSettings.configured ? "\u8D44\u6E90\u5E93\u5B58\u50A8" : "\u9009\u62E9\u8D44\u6E90\u5E93\u5B58\u50A8"), /* @__PURE__ */ import_react11.default.createElement(
      "button",
      {
        "aria-label": "\u5173\u95ED\u5B58\u50A8\u8BBE\u7F6E",
        disabled: busy,
        onClick: closeStorage
      },
      /* @__PURE__ */ import_react11.default.createElement(Glyph, { name: "close" })
    )),
    /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-dialog-body" }, /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-storage-providers" }, storageSettings.providers.map((provider) => /* @__PURE__ */ import_react11.default.createElement(
      "div",
      {
        key: provider.type,
        className: provider.available ? "active" : ""
      },
      /* @__PURE__ */ import_react11.default.createElement("strong", null, provider.name),
      /* @__PURE__ */ import_react11.default.createElement("span", null, provider.available ? "\u53EF\u7528" : "\u540E\u7EED\u63A5\u5165")
    ))), /* @__PURE__ */ import_react11.default.createElement("label", { className: "gal-username-setting" }, "\u7528\u6237\u540D", /* @__PURE__ */ import_react11.default.createElement(
      "input",
      {
        value: storageSettings.username || "",
        maxLength: 80,
        placeholder: "\u65B0\u8D44\u6E90\u7684\u521B\u5EFA\u8005\u540D\u79F0",
        onChange: (e) => setStorageSettings((x) => ({
          ...x,
          username: e.target.value
        }))
      }
    )), /* @__PURE__ */ import_react11.default.createElement(
      "button",
      {
        disabled: busy || !storageSettings.username?.trim(),
        onClick: () => run(async () => {
          const storage = await call(
            remote,
            "uiSetUsername",
            json2({ username: storageSettings.username })
          );
          setStorageSettings(storage);
          setStatus((x) => ({ ...x, storage }));
          setConnectionResult("\u7528\u6237\u540D\u5DF2\u4FDD\u5B58\uFF0C\u7528\u4E8E\u4E4B\u540E\u521B\u5EFA\u7684\u8D44\u6E90\u3002");
        })
      },
      "\u4FDD\u5B58\u7528\u6237\u540D"
    ), connectionResult && /* @__PURE__ */ import_react11.default.createElement("p", { role: "status" }, connectionResult), error && /* @__PURE__ */ import_react11.default.createElement("p", { role: "alert" }, error)),
    /* @__PURE__ */ import_react11.default.createElement("footer", { className: "gal-dialog-footer" }, /* @__PURE__ */ import_react11.default.createElement("span", { className: "gal-local" }, "v0.15.1"), /* @__PURE__ */ import_react11.default.createElement(
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
    ), /* @__PURE__ */ import_react11.default.createElement(
      "button",
      {
        className: "gal-primary",
        disabled: busy,
        onClick: closeStorage
      },
      busy ? "\u5904\u7406\u4E2D\u2026" : "\u5B8C\u6210"
    ))
  )), confirmation && /* @__PURE__ */ import_react11.default.createElement(Modal, { confirmation: true, onClose: () => answerConfirmation(false) }, /* @__PURE__ */ import_react11.default.createElement(
    "section",
    {
      tabIndex: -1,
      className: "gal-dialog gal-small",
      role: "alertdialog",
      "aria-modal": "true",
      "aria-label": "\u786E\u8BA4\u64CD\u4F5C"
    },
    /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react11.default.createElement("h2", null, "\u786E\u8BA4\u64CD\u4F5C")),
    /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-dialog-body" }, /* @__PURE__ */ import_react11.default.createElement("p", null, confirmation.message)),
    /* @__PURE__ */ import_react11.default.createElement("div", { className: "gal-dialog-footer" }, /* @__PURE__ */ import_react11.default.createElement("button", { autoFocus: true, onClick: () => answerConfirmation(false) }, "\u53D6\u6D88"), /* @__PURE__ */ import_react11.default.createElement(
      "button",
      {
        className: "gal-primary",
        onClick: () => answerConfirmation(true)
      },
      "\u786E\u8BA4"
    ))
  )));
}
var inject = ["remote", "slots", "locale", "inputTriggers"];
async function apply(ctx) {
  await ctx.remote.$mount(REMOTE);
  const remote = ctx.get("remote.gallery");
  ctx.effect(
    () => ctx.inputTriggers.registerSource(createGalleryTrigger(remote, Icon))
  );
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

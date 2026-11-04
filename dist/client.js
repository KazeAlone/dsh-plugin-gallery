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
var import_react = __toESM(require("react"), 1);

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
  uiEnroll: ["payload"],
  uiClearIdentity: []
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
var styles_default = '.gal {\n  --g-bg: #faf9f6;\n  --g-card: #fff;\n  --g-ink: #262d2b;\n  --g-muted: #757c77;\n  --g-line: #e4e7e0;\n  --g-accent: #28694d;\n  box-sizing: border-box;\n  width: 100%;\n  min-height: 100%;\n  overflow: auto;\n  background: var(--g-bg);\n  color: var(--g-ink);\n  padding: 36px 40px;\n  font:\n    14px/1.6 -apple-system,\n    BlinkMacSystemFont,\n    "Segoe UI",\n    sans-serif;\n}\n.gal * {\n  box-sizing: border-box;\n}\n.gal button,\n.gal input,\n.gal textarea,\n.gal select {\n  font: inherit;\n}\n.gal button {\n  cursor: pointer;\n  border: 1px solid var(--g-line);\n  border-radius: 8px;\n  padding: 8px 13px;\n  background: #fff;\n  color: var(--g-ink);\n  transition:\n    border-color 0.15s,\n    background 0.15s;\n}\n.gal button:hover {\n  border-color: #99b4a2;\n  background: #f4f8f3;\n}\n.gal button:disabled {\n  opacity: 0.5;\n  cursor: default;\n}\n.gal button:focus-visible,\n.gal input:focus-visible,\n.gal textarea:focus-visible,\n.gal select:focus-visible {\n  outline: 2px solid #609c7a;\n  outline-offset: 2px;\n}\n.gal button.gal-primary {\n  background: var(--g-accent);\n  border-color: var(--g-accent);\n  color: white;\n}\n.gal button.gal-primary:hover {\n  background: #1c543b;\n}\n.gal h1,\n.gal h2,\n.gal h3,\n.gal p {\n  margin: 0;\n}\n.gal h1 {\n  font-size: 30px;\n  letter-spacing: -1px;\n  font-weight: 650;\n  margin: 8px 0;\n}\n.gal h2 {\n  font-size: 22px;\n  font-weight: 630;\n}\n.gal h3 {\n  font-size: 16px;\n  font-weight: 620;\n}\n.gal-header {\n  display: flex;\n  justify-content: space-between;\n  gap: 24px;\n  align-items: center;\n  margin-bottom: 32px;\n}\n.gal-eyebrow {\n  font-size: 10px;\n  font-weight: 700;\n  letter-spacing: 1.8px;\n  color: var(--g-accent);\n}\n.gal-eyebrow span {\n  margin-left: 12px;\n  letter-spacing: 0.5px;\n  font-size: 9px;\n  border: 1px solid #dbe3d6;\n  border-radius: 4px;\n  padding: 2px 6px;\n  color: var(--g-muted);\n}\n.gal-header p {\n  color: var(--g-muted);\n}\n.gal-header-actions {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n.gal-type-grid {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 14px;\n  margin-bottom: 30px;\n}\n.gal button.gal-type-card {\n  text-align: left;\n  position: relative;\n  padding: 20px;\n  background: var(--g-card);\n  display: grid;\n  grid-template-columns: 36px 1fr;\n  gap: 3px 12px;\n  align-items: center;\n  border-radius: 12px;\n}\n.gal-type-card.active {\n  box-shadow: 0 0 0 1px var(--g-accent);\n  border-color: var(--g-accent);\n}\n.gal-type-card strong {\n  font-size: 15px;\n}\n.gal-type-card small {\n  font-size: 11px;\n  color: var(--g-muted);\n  grid-column: 2;\n  white-space: nowrap;\n}\n.gal-type-card b {\n  position: absolute;\n  right: 13px;\n  top: 10px;\n  font-weight: 400;\n  color: #acb3ad;\n}\n.gal-type-icon {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 36px;\n  height: 36px;\n  border-radius: 10px;\n  font-size: 21px;\n  grid-row: span 2;\n}\n.gal .skill {\n  color: #316b4f;\n  background: #eaf2e7;\n}\n.gal .agent {\n  color: #5c5d99;\n  background: #eeedf8;\n}\n.gal .mcp {\n  color: #a07936;\n  background: #faf1df;\n}\n.gal .workflow {\n  color: #517c96;\n  background: #e9f1f6;\n}\n.gal-toolbar {\n  display: flex;\n  justify-content: space-between;\n  gap: 16px;\n  border-bottom: 1px solid var(--g-line);\n  align-items: center;\n  padding-bottom: 16px;\n}\n.gal-scopes {\n  display: flex;\n  gap: 7px;\n  align-items: center;\n  flex-wrap: wrap;\n}\n.gal-scopes button {\n  border: 0;\n  background: transparent;\n  color: var(--g-muted);\n  padding: 7px 12px;\n}\n.gal-scopes button.active {\n  background: #e9efe5;\n  color: #285a40;\n  font-weight: 600;\n}\n.gal input,\n.gal textarea,\n.gal select {\n  width: 100%;\n  min-width: 0;\n  border: 1px solid var(--g-line);\n  background: #fff;\n  color: var(--g-ink);\n  border-radius: 7px;\n  padding: 9px 11px;\n}\n.gal textarea {\n  resize: vertical;\n}\n.gal input.gal-search {\n  max-width: 300px;\n  background: #fff;\n}\n.gal-list-heading {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin: 22px 0 15px;\n  color: var(--g-muted);\n  font-size: 12px;\n}\n.gal-list-heading strong {\n  color: var(--g-ink);\n  margin-left: 7px;\n  font-weight: 500;\n}\n.gal-list-heading button {\n  border: 0;\n  background: none;\n  font-size: 12px;\n  padding: 4px 8px;\n}\n.gal-resource-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));\n  gap: 16px;\n}\n.gal button.gal-resource-card {\n  background: #fff;\n  padding: 20px;\n  text-align: left;\n  display: flex;\n  flex-direction: column;\n  min-height: 220px;\n  border-radius: 12px;\n}\n.gal-resource-card:hover {\n  box-shadow: 0 5px 20px #24392408;\n}\n.gal-card-top {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 15px;\n  gap: 10px;\n}\n.gal-pill {\n  display: inline-block;\n  border-radius: 5px;\n  font-size: 10px;\n  letter-spacing: 0.4px;\n  font-weight: 650;\n  padding: 3px 8px;\n}\n.gal-version {\n  font-size: 10px;\n  color: var(--g-muted);\n}\n.gal-resource-card h3 {\n  word-break: break-word;\n  margin-bottom: 7px;\n}\n.gal-resource-card > p {\n  font-size: 12px;\n  color: var(--g-muted);\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  line-height: 1.8;\n}\n.gal-tags {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 5px;\n  margin: 12px 0;\n}\n.gal-tags span {\n  font-size: 10px;\n  color: #7a8276;\n  background: #f4f5ef;\n  border-radius: 4px;\n  padding: 2px 7px;\n}\n.gal-resource-card footer {\n  border-top: 1px solid #f0f1eb;\n  margin-top: auto;\n  padding-top: 13px;\n  width: 100%;\n  display: flex;\n  justify-content: space-between;\n  font-size: 10px;\n  color: #8b9189;\n}\n.gal-empty {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  flex-direction: column;\n  gap: 14px;\n  min-height: 250px;\n  padding: 40px 20px;\n  text-align: center;\n  color: var(--g-muted);\n}\n.gal-empty h3 {\n  color: var(--g-ink);\n  margin-top: 8px;\n}\n.gal-empty p {\n  max-width: 380px;\n  font-size: 13px;\n}\n.gal-bottom {\n  display: flex;\n  justify-content: space-between;\n  gap: 20px;\n  color: #949a91;\n  font-size: 10px;\n  padding: 32px 0 5px;\n}\n.gal-pagination {\n  display: flex;\n  gap: 20px;\n  align-items: center;\n  justify-content: center;\n  padding: 24px;\n}\n.gal-alert,\n.gal-notice {\n  border-radius: 8px;\n  padding: 12px 16px;\n  margin-bottom: 20px;\n  display: flex;\n  justify-content: space-between;\n  gap: 12px;\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n  position: relative;\n  z-index: 40;\n}\n.gal-alert {\n  color: #943e36;\n  background: #fff0eb;\n  border: 1px solid #e8c9bf;\n}\n.gal-notice {\n  background: #edf5e9;\n  border: 1px solid #d4e4ca;\n  color: #3b6441;\n}\n.gal-alert button,\n.gal-notice button {\n  padding: 0 6px;\n  border: 0;\n  background: none;\n  align-self: flex-start;\n}\n.gal-onboarding {\n  max-width: 500px;\n  margin: 45px auto;\n  padding: 35px;\n  background: white;\n  border: 1px solid var(--g-line);\n  border-radius: 16px;\n}\n.gal-large-icon {\n  color: var(--g-accent);\n  margin-bottom: 15px;\n}\n.gal-onboarding > p {\n  color: var(--g-muted);\n  margin: 12px 0 22px;\n}\n.gal label {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  margin-bottom: 15px;\n  font-size: 12px;\n  font-weight: 500;\n}\n.gal-overlay {\n  position: fixed;\n  inset: 0;\n  background: #1a282344;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 24px;\n  z-index: 30;\n  backdrop-filter: blur(3px);\n}\n.gal-dialog {\n  background: var(--g-bg);\n  border: 1px solid #d7dfd2;\n  border-radius: 15px;\n  box-shadow: 0 24px 90px #14291d2b;\n  width: min(850px, 100%);\n  max-height: 90vh;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n.gal-dialog-head {\n  padding: 24px 28px;\n  display: flex;\n  justify-content: space-between;\n  gap: 15px;\n  border-bottom: 1px solid var(--g-line);\n  flex-shrink: 0;\n}\n.gal-dialog-head h2 {\n  margin-top: 5px;\n  overflow-wrap: anywhere;\n}\n.gal-dialog-head p {\n  color: var(--g-muted);\n  font-size: 12px;\n  margin-top: 5px;\n}\n.gal-dialog-head > button {\n  border: 0;\n  background: none;\n  padding: 3px 7px;\n  align-self: flex-start;\n  font-size: 22px;\n}\n.gal-dialog-body {\n  padding: 22px 28px;\n  overflow: auto;\n  min-height: 0;\n}\n.gal-dialog-footer {\n  border-top: 1px solid var(--g-line);\n  padding: 16px 28px;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 12px;\n  background: #fff;\n  flex-shrink: 0;\n}\n.gal-dialog-footer > span {\n  font-size: 11px;\n  color: var(--g-muted);\n}\n.gal-form-row {\n  display: flex;\n  gap: 15px;\n  align-items: flex-end;\n}\n.gal-form-row > label {\n  flex: 1;\n}\n.gal-form-row > label.gal-grow {\n  flex: 3;\n}\n.gal-form-row > button {\n  margin-bottom: 15px;\n  white-space: nowrap;\n}\n.gal-file-toolbar {\n  display: flex;\n  justify-content: space-between;\n  gap: 10px;\n  align-items: center;\n  margin: 20px 0 12px;\n}\n.gal-file-toolbar h3 {\n  font-size: 13px;\n}\n.gal-file-toolbar small {\n  font-size: 10px;\n  color: var(--g-muted);\n  font-weight: 400;\n  margin-left: 8px;\n}\n.gal-file-toolbar > div {\n  display: flex;\n  gap: 7px;\n}\n.gal label.gal-upload {\n  display: block;\n  cursor: pointer;\n  font-size: 11px;\n  border: 1px solid var(--g-line);\n  padding: 6px 10px;\n  border-radius: 6px;\n  background: #fff;\n  margin: 0;\n}\n.gal-upload input {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  opacity: 0;\n  pointer-events: none;\n}\n.gal-add-file {\n  display: flex;\n  gap: 7px;\n  margin-bottom: 12px;\n}\n.gal-add-file button {\n  font-size: 11px;\n  white-space: nowrap;\n}\n.gal-file-editor {\n  display: grid;\n  grid-template-columns: 180px 1fr;\n  min-height: 250px;\n  border: 1px solid var(--g-line);\n  border-radius: 8px;\n  background: #fff;\n  overflow: hidden;\n}\n.gal-file-editor nav {\n  border-right: 1px solid var(--g-line);\n  background: #f6f7f2;\n  padding: 7px;\n  overflow: auto;\n}\n.gal-file-editor nav button {\n  display: block;\n  width: 100%;\n  border: 0;\n  background: none;\n  padding: 7px;\n  text-align: left;\n  font-size: 11px;\n  overflow-wrap: anywhere;\n}\n.gal-file-editor nav button.active {\n  background: #e4ecdd;\n  color: #285b3c;\n}\n.gal-file-editor nav p {\n  padding: 12px;\n  font-size: 12px;\n  color: var(--g-muted);\n}\n.gal-file-editor > div {\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n}\n.gal-code-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 6px 10px;\n  border-bottom: 1px solid var(--g-line);\n  gap: 10px;\n}\n.gal-code-head span {\n  font:\n    11px/1.5 ui-monospace,\n    monospace;\n  overflow-wrap: anywhere;\n}\n.gal-code-head button {\n  border: 0;\n  background: none;\n  padding: 3px;\n  font-size: 10px;\n  color: #93625b;\n}\n.gal-file-editor textarea {\n  font:\n    12px/1.8 ui-monospace,\n    SFMono-Regular,\n    monospace;\n  min-height: 240px;\n  flex: 1;\n  border: 0;\n  border-radius: 0;\n  tab-size: 2;\n}\n.gal-code-placeholder {\n  padding: 25px;\n  font-size: 12px;\n  color: var(--g-muted);\n}\n.gal-advanced {\n  margin-top: 20px;\n  font-size: 12px;\n}\n.gal-advanced summary {\n  cursor: pointer;\n  margin-bottom: 14px;\n  color: var(--g-accent);\n}\n.gal-advanced textarea {\n  font-family: ui-monospace, monospace;\n  font-size: 11px;\n}\n.gal-hint {\n  font-size: 11px;\n  color: var(--g-muted);\n  padding: 10px 0;\n}\n.gal-error {\n  color: #a24436 !important;\n  font-size: 12px;\n}\n.gal-detail-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  padding: 15px 28px 5px;\n}\n.gal-detail-actions button {\n  font-size: 11px;\n}\n.gal-detail-tabs {\n  padding: 10px 28px 14px;\n  border-bottom: 1px solid var(--g-line);\n}\n.gal-description {\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n  font-size: 13px;\n}\n.gal-file {\n  background: #fff;\n  border: 1px solid var(--g-line);\n  border-radius: 7px;\n  margin: 12px 0;\n  overflow: hidden;\n}\n.gal-file summary {\n  cursor: pointer;\n  padding: 10px 13px;\n  font-size: 12px;\n  overflow-wrap: anywhere;\n}\n.gal-file summary span {\n  float: right;\n  font-size: 10px;\n  color: var(--g-muted);\n  margin-left: 10px;\n}\n.gal pre {\n  font:\n    11px/1.8 ui-monospace,\n    monospace;\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n  padding: 15px;\n  border-top: 1px solid var(--g-line);\n  margin: 0;\n  max-height: 350px;\n  overflow: auto;\n}\n.gal-file > p {\n  padding: 15px;\n  font-size: 12px;\n}\n.gal-publish-bar {\n  display: flex;\n  gap: 10px;\n  padding: 16px 28px;\n  border-top: 1px solid var(--g-line);\n  background: white;\n  flex-shrink: 0;\n}\n.gal-publish-bar button {\n  white-space: nowrap;\n}\n.gal-history {\n  display: flex;\n  justify-content: space-between;\n  gap: 20px;\n  align-items: flex-start;\n  padding: 16px 0;\n  border-bottom: 1px solid var(--g-line);\n}\n.gal-history small {\n  margin-left: 14px;\n  color: var(--g-muted);\n  font-size: 10px;\n}\n.gal-history p {\n  margin-top: 5px;\n  font-size: 12px;\n}\n.gal-history code {\n  font-size: 10px;\n  color: #8d958a;\n}\n.gal-history > div:last-child {\n  display: flex;\n  gap: 5px;\n  flex-wrap: wrap;\n}\n.gal-history button {\n  font-size: 10px;\n  padding: 6px 8px;\n}\n.gal label.gal-reference {\n  padding: 12px 28px 0;\n  margin: 0;\n  font-size: 11px;\n}\n.gal-reference textarea {\n  font:\n    10px/1.5 ui-monospace,\n    monospace;\n  resize: none;\n}\n.gal-small {\n  max-width: 500px;\n}\n@media (prefers-color-scheme: dark) {\n  .gal {\n    --g-bg: #202622;\n    --g-card: #272e28;\n    --g-ink: #e2e7de;\n    --g-muted: #a2ad9d;\n    --g-line: #3c473b;\n    --g-accent: #518764;\n  }\n  .gal button,\n  .gal input,\n  .gal textarea,\n  .gal select,\n  .gal-onboarding,\n  .gal button.gal-resource-card,\n  .gal button.gal-type-card,\n  .gal-file,\n  .gal-dialog-footer,\n  .gal-publish-bar {\n    background: var(--g-card);\n    color: var(--g-ink);\n  }\n  .gal button:hover {\n    background: #334134;\n  }\n  .gal-file-editor,\n  .gal-code-head {\n    background: #252d26;\n  }\n  .gal-file-editor nav {\n    background: #202a22;\n  }\n  .gal-scopes button.active,\n  .gal-file-editor nav button.active {\n    background: #354b35;\n    color: #c7ddbb;\n  }\n  .gal-tags span {\n    background: #354032;\n    color: #b3c0a7;\n  }\n  .gal-resource-card footer {\n    border-color: var(--g-line);\n  }\n}\n@media (max-width: 900px) {\n  .gal {\n    padding: 25px 24px;\n  }\n  .gal-header {\n    align-items: flex-start;\n    flex-direction: column;\n    gap: 17px;\n  }\n  .gal-header-actions {\n    width: 100%;\n  }\n  .gal-type-grid {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n  .gal-resource-grid {\n    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));\n  }\n  .gal-toolbar {\n    align-items: flex-start;\n    flex-direction: column;\n  }\n  .gal input.gal-search {\n    max-width: none;\n  }\n  .gal-header h1 {\n    font-size: 27px;\n  }\n  .gal-overlay {\n    padding: 12px;\n  }\n  .gal-dialog {\n    max-height: 95vh;\n  }\n  .gal-dialog-head,\n  .gal-dialog-body {\n    padding: 20px;\n  }\n  .gal-dialog-footer,\n  .gal-publish-bar {\n    padding: 14px 20px;\n  }\n  .gal-file-editor {\n    grid-template-columns: 130px 1fr;\n  }\n  .gal-bottom {\n    flex-direction: column;\n    gap: 5px;\n  }\n}\n@media (max-width: 480px) {\n  .gal {\n    padding: 22px 16px;\n  }\n  .gal button.gal-type-card {\n    padding: 14px;\n    gap: 3px 8px;\n    grid-template-columns: 30px 1fr;\n  }\n  .gal-type-icon {\n    width: 30px;\n    height: 30px;\n    font-size: 18px;\n  }\n  .gal-type-card small {\n    font-size: 9px;\n  }\n  .gal-type-grid {\n    gap: 10px;\n  }\n  .gal-resource-grid {\n    grid-template-columns: 1fr;\n  }\n  .gal-scopes button {\n    font-size: 12px;\n    padding: 6px 10px;\n  }\n  .gal-form-row {\n    flex-wrap: wrap;\n    gap: 10px;\n  }\n  .gal-form-row > label.gal-grow {\n    flex: 1 1 100%;\n  }\n  .gal-file-editor {\n    grid-template-columns: 1fr;\n  }\n  .gal-file-editor nav {\n    border-right: 0;\n    border-bottom: 1px solid var(--g-line);\n    max-height: 120px;\n  }\n  .gal-file-editor textarea {\n    min-height: 180px;\n  }\n  .gal-publish-bar {\n    flex-wrap: wrap;\n  }\n  .gal-publish-bar button {\n    width: 100%;\n  }\n  .gal-history {\n    flex-direction: column;\n    gap: 10px;\n  }\n  .gal-dialog-head h2 {\n    font-size: 20px;\n  }\n  .gal-file-toolbar {\n    align-items: flex-start;\n    flex-direction: column;\n  }\n  .gal-header-actions button {\n    font-size: 12px;\n  }\n}\n\n.gal-confirm-overlay {\n  z-index: 60;\n}\n\n.gal-local {\n  font-size: 12px;\n  color: var(--g-muted);\n  margin-right: 10px;\n}\n\n.gal-identity {\n  position: relative;\n  margin: 48px auto;\n  max-width: 580px;\n  width: 100%;\n}\n.gal-identity form {\n  display: flex;\n  flex-direction: column;\n  gap: 18px;\n}\n.gal-identity label {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  font-size: 13px;\n}\n.gal-identity input {\n  width: 100%;\n}\n.gal-identity .gal-primary {\n  align-self: flex-start;\n}\n';

// src/client/index.jsx
var NS = "dsh-gallery";
var TYPES = { skill: "Skill", agent: "Agent", mcp: "MCP", workflow: "Workflow" };
var ICONS = { skill: "\u2726", agent: "\u25C9", mcp: "\u2318", workflow: "\u2301" };
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
function Icon() {
  return /* @__PURE__ */ import_react.default.createElement(
    "svg",
    {
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.6"
    },
    /* @__PURE__ */ import_react.default.createElement("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1.5" }),
    /* @__PURE__ */ import_react.default.createElement("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1.5" }),
    /* @__PURE__ */ import_react.default.createElement("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1.5" }),
    /* @__PURE__ */ import_react.default.createElement("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1.5" })
  );
}
function Gallery({ remote }) {
  const [status, setStatus] = (0, import_react.useState)(null), [error, setError] = (0, import_react.useState)(""), [notice, setNotice] = (0, import_react.useState)(""), [busy, setBusy] = (0, import_react.useState)(false);
  const [items, setItems] = (0, import_react.useState)([]), [total, setTotal] = (0, import_react.useState)(0), [type, setType] = (0, import_react.useState)(""), [scope, setScope] = (0, import_react.useState)("all"), [q, setQ] = (0, import_react.useState)(""), [refresh, setRefresh] = (0, import_react.useState)(0), [offset, setOffset] = (0, import_react.useState)(0), [loading, setLoading] = (0, import_react.useState)(false);
  const [selected, setSelected] = (0, import_react.useState)(null), [editor, setEditor] = (0, import_react.useState)(null);
  const [reference, setReference] = (0, import_react.useState)("");
  const [identityForm, setIdentityForm] = (0, import_react.useState)({
    displayName: "",
    code: "",
    serverUrl: "http://127.0.0.1:4318"
  });
  const [confirmation, setConfirmation] = (0, import_react.useState)(null);
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
  (0, import_react.useEffect)(() => {
    let live = true;
    call(remote, "uiStatus").then((x) => {
      if (live) {
        setStatus(x);
        setIdentityForm((f) => ({ ...f, serverUrl: x.url }));
      }
    }).catch((e) => {
      if (live) setError(fail(e));
    });
    return () => {
      live = false;
    };
  }, []);
  (0, import_react.useEffect)(() => {
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
  }, [status?.ready, type, scope, q, offset, refresh]);
  async function load(id) {
    const r = await call(remote, "uiGet", id);
    setSelected(r);
    setReference("");
    return r;
  }
  function edit(r) {
    setNotice("");
    setError("");
    const d = r || blank();
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
    setNotice("\u8D44\u6E90\u5DF2\u4FDD\u5B58\uFF0C\u56E2\u961F\u6210\u5458\u73B0\u5728\u53EF\u4EE5\u4F7F\u7528\u3002");
  }
  const content = selected;
  const activeFile = editor?.resource.files[editor.fileIndex];
  const chooseFilter = (t) => {
    setType(t);
    setOffset(0);
  };
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "gal" }, /* @__PURE__ */ import_react.default.createElement("header", { className: "gal-header" }, /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-eyebrow" }, "RESOURCE LIBRARY ", /* @__PURE__ */ import_react.default.createElement("span", null, "PREVIEW \xB7 0.3")), /* @__PURE__ */ import_react.default.createElement("h1", null, "\u8D44\u6E90 Gallery"), /* @__PURE__ */ import_react.default.createElement("p", null, "\u6536\u96C6\u53EF\u590D\u7528\u8D44\u6E90\uFF0C\u8BA9\u6BCF\u6B21\u7F16\u6392\u90FD\u6709\u79EF\u7D2F\u3002")), /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-header-actions" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "gal-local" }, status?.identity?.displayName || "\u5171\u4EAB\u8D44\u6E90\u5E93"), status?.ready && /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      disabled: busy,
      onClick: () => run(async () => {
        if (await confirmAction(
          "\u9000\u51FA\u5F53\u524D\u8EAB\u4EFD\uFF1F\u91CD\u65B0\u63A5\u5165\u9700\u8981\u7EF4\u62A4\u8005\u63D0\u4F9B\u7684\u63A5\u5165\u7801\u3002"
        )) {
          setStatus(await call(remote, "uiClearIdentity"));
          setSelected(null);
          setEditor(null);
          setItems([]);
        }
      })
    },
    "\u9000\u51FA\u8EAB\u4EFD"
  ), /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      className: "gal-primary",
      disabled: !status?.ready,
      onClick: () => edit(null)
    },
    "\uFF0B \u65B0\u5EFA\u8D44\u6E90"
  ))), error && /* @__PURE__ */ import_react.default.createElement("div", { role: "alert", className: "gal-alert" }, error, /* @__PURE__ */ import_react.default.createElement("button", { "aria-label": "\u5173\u95ED\u9519\u8BEF", onClick: () => setError("") }, "\xD7")), notice && /* @__PURE__ */ import_react.default.createElement("div", { role: "status", className: "gal-notice" }, notice, /* @__PURE__ */ import_react.default.createElement("button", { "aria-label": "\u5173\u95ED\u63D0\u793A", onClick: () => setNotice("") }, "\xD7")), !status?.ready ? /* @__PURE__ */ import_react.default.createElement(
    "section",
    {
      className: "gal-identity gal-dialog",
      "aria-label": "\u63A5\u5165\u5171\u4EAB\u8D44\u6E90\u5E93"
    },
    /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("h2", null, "\u63A5\u5165\u5171\u4EAB\u8D44\u6E90\u5E93"), /* @__PURE__ */ import_react.default.createElement("p", null, status?.developmentAuth ? "\u5F00\u53D1\u6A21\u5F0F\uFF1A\u586B\u5199\u59D3\u540D\u5373\u53EF\u8FDB\u5165\uFF0C\u65E0\u9700\u63A5\u5165\u7801\u3002" : "\u586B\u5199\u59D3\u540D\u548C\u7EF4\u62A4\u8005\u63D0\u4F9B\u7684\u4E00\u6B21\u6027\u63A5\u5165\u7801\u3002"))),
    !status ? /* @__PURE__ */ import_react.default.createElement("p", { className: "gal-hint" }, "\u6B63\u5728\u68C0\u67E5\u8EAB\u4EFD\u2026") : /* @__PURE__ */ import_react.default.createElement(
      "form",
      {
        className: "gal-dialog-body",
        onSubmit: (e) => {
          e.preventDefault();
          run(async () => {
            const next = await call(
              remote,
              "uiEnroll",
              json2(identityForm)
            );
            setStatus(next);
            setIdentityForm((f) => ({ ...f, code: "" }));
            setRefresh((x) => x + 1);
          });
        }
      },
      status.error && /* @__PURE__ */ import_react.default.createElement("p", { role: "alert", className: "gal-hint" }, status.error),
      /* @__PURE__ */ import_react.default.createElement("label", null, "\u5171\u4EAB\u670D\u52A1\u5730\u5740", /* @__PURE__ */ import_react.default.createElement(
        "input",
        {
          required: true,
          "aria-label": "\u5171\u4EAB\u670D\u52A1\u5730\u5740",
          value: identityForm.serverUrl,
          disabled: status.serverLocked || busy,
          onChange: (e) => setIdentityForm((f) => ({
            ...f,
            serverUrl: e.target.value
          }))
        }
      )),
      /* @__PURE__ */ import_react.default.createElement("label", null, "\u59D3\u540D", /* @__PURE__ */ import_react.default.createElement(
        "input",
        {
          required: true,
          maxLength: 100,
          autoComplete: "name",
          "aria-label": "\u59D3\u540D",
          value: identityForm.displayName,
          onChange: (e) => setIdentityForm((f) => ({
            ...f,
            displayName: e.target.value
          }))
        }
      )),
      !status.developmentAuth && /* @__PURE__ */ import_react.default.createElement("label", null, "\u4E00\u6B21\u6027\u63A5\u5165\u7801", /* @__PURE__ */ import_react.default.createElement(
        "input",
        {
          required: true,
          type: "password",
          autoComplete: "off",
          "aria-label": "\u4E00\u6B21\u6027\u63A5\u5165\u7801",
          value: identityForm.code,
          onChange: (e) => setIdentityForm((f) => ({ ...f, code: e.target.value }))
        }
      )),
      /* @__PURE__ */ import_react.default.createElement("p", { className: "gal-hint" }, "\u8D44\u6E90\u4FDD\u5B58\u5373\u5171\u4EAB\uFF1B\u53EA\u6709\u4E0A\u4F20\u8005\u53EF\u4EE5\u7F16\u8F91\u3002\u8EAB\u4EFD\u9A8C\u8BC1\u540E\u4F1A\u4FDD\u5B58\u5728\u8FD9\u53F0\u7535\u8111\u4E0A\u3002"),
      /* @__PURE__ */ import_react.default.createElement("button", { className: "gal-primary", disabled: busy, type: "submit" }, busy ? "\u9A8C\u8BC1\u4E2D\u2026" : "\u9A8C\u8BC1\u8EAB\u4EFD\u5E76\u8FDB\u5165")
    )
  ) : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-type-grid" }, Object.entries(TYPES).map(([key, label]) => /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      key,
      className: "gal-type-card " + (type === key ? "active" : ""),
      onClick: () => chooseFilter(type === key ? "" : key)
    },
    /* @__PURE__ */ import_react.default.createElement("span", { className: "gal-type-icon " + key }, ICONS[key]),
    /* @__PURE__ */ import_react.default.createElement("strong", null, label),
    /* @__PURE__ */ import_react.default.createElement("small", null, {
      skill: "\u6280\u80FD\u4E0E\u53C2\u8003\u8D44\u6599",
      agent: "\u89D2\u8272\u4E0E\u80FD\u529B\u5B9A\u4E49",
      mcp: "\u5DE5\u5177\u670D\u52A1\u4E0E\u8FDE\u63A5",
      workflow: "\u4EFB\u52A1\u7F16\u6392\u6A21\u677F"
    }[key]),
    /* @__PURE__ */ import_react.default.createElement("b", null, "\u2197")
  ))), /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-toolbar" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-scopes" }, /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      className: scope === "all" ? "active" : "",
      onClick: () => {
        setScope("all");
        setOffset(0);
      }
    },
    "\u5168\u90E8\u8D44\u6E90"
  ), /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      className: scope === "mine" ? "active" : "",
      onClick: () => {
        setScope("mine");
        setOffset(0);
      }
    },
    "\u6211\u7684\u8D44\u6E90"
  )), /* @__PURE__ */ import_react.default.createElement(
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
  )), /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-list-heading" }, /* @__PURE__ */ import_react.default.createElement("span", null, type ? TYPES[type] : "\u8D44\u6E90", " ", /* @__PURE__ */ import_react.default.createElement("strong", null, total)), /* @__PURE__ */ import_react.default.createElement("div", null, type && /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => chooseFilter("") }, "\u6E05\u9664\u5206\u7C7B \xD7"), /* @__PURE__ */ import_react.default.createElement("button", { disabled: busy, onClick: () => setRefresh((x) => x + 1) }, "\u5237\u65B0 \u21BB"))), loading ? /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-empty" }, "\u6B63\u5728\u52A0\u8F7D\u8D44\u6E90\u2026") : items.length === 0 ? /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-empty" }, /* @__PURE__ */ import_react.default.createElement(Icon, null), /* @__PURE__ */ import_react.default.createElement("h3", null, q || type || scope !== "all" ? "\u6CA1\u6709\u5339\u914D\u7684\u8D44\u6E90" : "\u8D44\u6E90\uFF0C\u4ECE\u7B2C\u4E00\u4EFD\u79EF\u7D2F\u5F00\u59CB"), /* @__PURE__ */ import_react.default.createElement("p", null, q || type || scope !== "all" ? "\u8BD5\u8BD5\u5176\u4ED6\u5173\u952E\u8BCD\u6216\u5206\u7C7B\u3002" : "\u4E0A\u4F20\u5DF2\u6709\u7684 Skill\u3001Agent \u63CF\u8FF0\u3001MCP \u914D\u7F6E\u6216 Workflow \u6A21\u677F\u3002"), /* @__PURE__ */ import_react.default.createElement("button", { className: "gal-primary", onClick: () => edit(null) }, "\u521B\u5EFA / \u4E0A\u4F20\u8D44\u6E90")) : /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-resource-grid" }, items.map((r) => /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      key: r.id,
      className: "gal-resource-card",
      onClick: () => run(() => load(r.id))
    },
    /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-card-top" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "gal-pill " + r.type }, TYPES[r.type]), /* @__PURE__ */ import_react.default.createElement("span", { className: "gal-version" }, r.owner?.displayName || "\u5F52\u5C5E\u5F85\u786E\u8BA4")),
    /* @__PURE__ */ import_react.default.createElement("h3", null, r.name),
    /* @__PURE__ */ import_react.default.createElement("p", null, r.description || "\u6682\u65E0\u63CF\u8FF0"),
    /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-tags" }, r.tags.slice(0, 4).map((t) => /* @__PURE__ */ import_react.default.createElement("span", { key: t }, t))),
    /* @__PURE__ */ import_react.default.createElement("footer", null, /* @__PURE__ */ import_react.default.createElement("span", null, r.fileCount, " \u4E2A\u6587\u4EF6"), /* @__PURE__ */ import_react.default.createElement("span", null, new Date(r.updatedAt).toLocaleDateString()))
  ))), total > 48 && /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-pagination" }, /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      disabled: !offset,
      onClick: () => setOffset((x) => Math.max(0, x - 48))
    },
    "\u4E0A\u4E00\u9875"
  ), /* @__PURE__ */ import_react.default.createElement("span", null, Math.floor(offset / 48) + 1, " / ", Math.ceil(total / 48)), /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      disabled: offset + 48 >= total,
      onClick: () => setOffset((x) => x + 48)
    },
    "\u4E0B\u4E00\u9875"
  )), /* @__PURE__ */ import_react.default.createElement("footer", { className: "gal-bottom" }, /* @__PURE__ */ import_react.default.createElement("span", null, "\u56E2\u961F\u5171\u4EAB \xB7 \u4FDD\u5B58\u540E\u5373\u53EF\u4F7F\u7528"), /* @__PURE__ */ import_react.default.createElement("span", null, "Skill \xB7 Agent \xB7 MCP \xB7 Workflow"))), selected && !editor && /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-overlay" }, /* @__PURE__ */ import_react.default.createElement(
    "section",
    {
      className: "gal-dialog gal-detail",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "\u8D44\u6E90\u8BE6\u60C5"
    },
    /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("span", { className: "gal-pill " + selected.type }, TYPES[selected.type]), /* @__PURE__ */ import_react.default.createElement("h2", null, content.name), /* @__PURE__ */ import_react.default.createElement("p", null, selected.owner?.displayName || "\u5F52\u5C5E\u5F85\u786E\u8BA4", " \xB7 \u66F4\u65B0\u4E8E", " ", when(selected.updatedAt))), /* @__PURE__ */ import_react.default.createElement("button", { "aria-label": "\u5173\u95ED\u8BE6\u60C5", onClick: () => setSelected(null) }, "\xD7")),
    /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-detail-actions" }, selected.canEdit && /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => edit(selected) }, "\u7F16\u8F91\u8D44\u6E90"), /* @__PURE__ */ import_react.default.createElement(
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
              source: { id: selected.id, digest: selected.digest }
            },
            null,
            2
          )
        )
      },
      "\u4E0B\u8F7D\u8D44\u6E90"
    ), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        onClick: () => setReference(
          json2({ id: selected.id, digest: selected.digest }, null, 2)
        )
      },
      "\u83B7\u53D6\u5F15\u7528"
    )),
    reference && /* @__PURE__ */ import_react.default.createElement("label", { className: "gal-reference" }, "\u4F9B\u7F16\u6392\u63D2\u4EF6\u4F7F\u7528\u7684\u8D44\u6E90\u5F15\u7528", /* @__PURE__ */ import_react.default.createElement("textarea", { readOnly: true, rows: 4, value: reference }), /* @__PURE__ */ import_react.default.createElement("small", null, "\u6458\u8981\u7528\u4E8E\u68C0\u6D4B\u5185\u5BB9\u53D8\u5316\u3002\u7F16\u6392\u8FD0\u884C\u65F6\u53EF\u4FDD\u5B58\u5185\u5BB9\u5FEB\u7167\u3002")),
    /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-dialog-body" }, !selected.canEdit && /* @__PURE__ */ import_react.default.createElement("p", { className: "gal-hint" }, selected.owner ? "\u7531\u5176\u4ED6\u6210\u5458\u4E0A\u4F20\uFF0C\u53EF\u67E5\u770B\u3001\u4E0B\u8F7D\u548C\u5F15\u7528\u3002" : "\u65E7\u8D44\u6E90\u5F52\u5C5E\u5F85\u7EF4\u62A4\u8005\u786E\u8BA4\uFF0C\u5F53\u524D\u4EC5\u53EF\u67E5\u770B\u548C\u4F7F\u7528\u3002"), /* @__PURE__ */ import_react.default.createElement("p", { className: "gal-description" }, content.description || "\u6682\u65E0\u63CF\u8FF0"), /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-tags" }, content.tags.map((t) => /* @__PURE__ */ import_react.default.createElement("span", { key: t }, t))), content.files.map((f) => /* @__PURE__ */ import_react.default.createElement("details", { className: "gal-file", key: f.path }, /* @__PURE__ */ import_react.default.createElement("summary", null, f.path, /* @__PURE__ */ import_react.default.createElement("span", null, f.bytes ?? new Blob([f.content]).size, " B")), f.encoding === "utf8" ? /* @__PURE__ */ import_react.default.createElement("pre", null, f.content) : /* @__PURE__ */ import_react.default.createElement("p", null, "\u4E8C\u8FDB\u5236\u9644\u4EF6\u5305\u542B\u5728\u4E0B\u8F7D\u7684\u8D44\u6E90\u5305\u4E2D\u3002"))), /* @__PURE__ */ import_react.default.createElement("details", { className: "gal-file" }, /* @__PURE__ */ import_react.default.createElement("summary", null, "\u5143\u6570\u636E\u4E0E\u4F9D\u8D56"), /* @__PURE__ */ import_react.default.createElement("pre", null, json2(
      {
        metadata: content.metadata,
        references: content.references
      },
      null,
      2
    ))))
  )), editor && /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-overlay" }, /* @__PURE__ */ import_react.default.createElement(
    "section",
    {
      className: "gal-dialog gal-editor",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": editor.id ? "\u7F16\u8F91\u8D44\u6E90" : "\u65B0\u5EFA\u8D44\u6E90"
    },
    /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-eyebrow" }, "RESOURCE EDITOR"), /* @__PURE__ */ import_react.default.createElement("h2", null, editor.id ? "\u7F16\u8F91\u8D44\u6E90" : "\u521B\u5EFA\u8D44\u6E90"), /* @__PURE__ */ import_react.default.createElement("p", null, "\u652F\u6301\u4E0A\u4F20\u6587\u4EF6\u3001\u6587\u4EF6\u5939\u6216 Gallery \u5BFC\u51FA\u7684 JSON \u8D44\u6E90\u5305\u3002")), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        "aria-label": "\u5173\u95ED\u7F16\u8F91",
        onClick: async () => {
          if (await confirmAction("\u653E\u5F03\u5C1A\u672A\u4FDD\u5B58\u7684\u4FEE\u6539\uFF1F"))
            setEditor(null);
        }
      },
      "\xD7"
    )),
    /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-dialog-body" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-form-row" }, /* @__PURE__ */ import_react.default.createElement("label", null, "\u7C7B\u578B", /* @__PURE__ */ import_react.default.createElement(
      "select",
      {
        disabled: Boolean(editor.id),
        value: editor.resource.type,
        onChange: (e) => field("type", e.target.value)
      },
      Object.entries(TYPES).map(([key, label]) => /* @__PURE__ */ import_react.default.createElement("option", { key, value: key }, label))
    )), /* @__PURE__ */ import_react.default.createElement("label", { className: "gal-grow" }, "\u8D44\u6E90\u540D\u79F0", /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        value: editor.resource.name,
        maxLength: 160,
        onChange: (e) => field("name", e.target.value),
        placeholder: "\u4F8B\u5982\uFF1A\u4EE3\u7801\u5BA1\u67E5 Skill"
      }
    ))), /* @__PURE__ */ import_react.default.createElement("label", null, "\u63CF\u8FF0", /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        rows: 3,
        value: editor.resource.description,
        onChange: (e) => field("description", e.target.value),
        placeholder: "\u8BF4\u660E\u7528\u9014\u3001\u9002\u7528\u573A\u666F\u548C\u4F7F\u7528\u65B9\u6CD5",
        maxLength: 1e4
      }
    )), /* @__PURE__ */ import_react.default.createElement("label", null, "\u6807\u7B7E", /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        value: editor.tags,
        onChange: (e) => change("tags", e.target.value),
        placeholder: "\u4F7F\u7528\u9017\u53F7\u5206\u9694\uFF0C\u4F8B\u5982\uFF1A\u7814\u53D1, \u5BA1\u67E5, Python"
      }
    )), /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-file-toolbar" }, /* @__PURE__ */ import_react.default.createElement("h3", null, "\u8D44\u6E90\u6587\u4EF6 ", /* @__PURE__ */ import_react.default.createElement("small", null, editor.resource.files.length, " / 100")), /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("label", { className: "gal-upload" }, "\u4E0A\u4F20\u6587\u4EF6", /* @__PURE__ */ import_react.default.createElement(
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
    )), /* @__PURE__ */ import_react.default.createElement("label", { className: "gal-upload" }, "\u4E0A\u4F20\u6587\u4EF6\u5939", /* @__PURE__ */ import_react.default.createElement(
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
    )))), editor.importError && /* @__PURE__ */ import_react.default.createElement("p", { className: "gal-error" }, editor.importError), /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-add-file" }, /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        "aria-label": "\u65B0\u6587\u4EF6\u8DEF\u5F84",
        placeholder: "\u65B0\u6587\u4EF6\u8DEF\u5F84\uFF0C\u4F8B\u5982 SKILL.md",
        value: editor.newPath,
        onChange: (e) => change("newPath", e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement(
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
    )), /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-file-editor" }, /* @__PURE__ */ import_react.default.createElement("nav", null, editor.resource.files.map((f, i) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        className: i === editor.fileIndex ? "active" : "",
        key: f.path,
        onClick: () => change("fileIndex", i)
      },
      f.path
    )), !editor.resource.files.length && /* @__PURE__ */ import_react.default.createElement("p", null, "\u53EF\u4E0A\u4F20\u5DF2\u6709\u6587\u4EF6\uFF0C\u4E5F\u53EF\u76F4\u63A5\u521B\u5EFA\u6587\u672C\u6587\u4EF6\u3002")), /* @__PURE__ */ import_react.default.createElement("div", null, activeFile ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-code-head" }, /* @__PURE__ */ import_react.default.createElement("span", null, activeFile.path), /* @__PURE__ */ import_react.default.createElement(
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
    )), activeFile.encoding === "utf8" ? /* @__PURE__ */ import_react.default.createElement(
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
    ) : /* @__PURE__ */ import_react.default.createElement("p", null, "\u4E8C\u8FDB\u5236\u6587\u4EF6\u5DF2\u4E0A\u4F20\uFF0C\u53EF\u79FB\u9664\u540E\u91CD\u65B0\u4E0A\u4F20\u66FF\u6362\u3002")) : /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-code-placeholder" }, "\u9009\u62E9\u6587\u4EF6\u4EE5\u67E5\u770B\u6216\u7F16\u8F91"))), /* @__PURE__ */ import_react.default.createElement("details", { className: "gal-advanced" }, /* @__PURE__ */ import_react.default.createElement("summary", null, "\u5143\u6570\u636E\u4E0E\u8D44\u6E90\u5F15\u7528"), /* @__PURE__ */ import_react.default.createElement("label", null, "\u5143\u6570\u636E\uFF08JSON \u5BF9\u8C61\uFF09", /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        rows: 5,
        value: editor.metadata,
        onChange: (e) => change("metadata", e.target.value),
        spellCheck: "false"
      }
    )), /* @__PURE__ */ import_react.default.createElement("label", null, "\u8D44\u6E90\u4F9D\u8D56\uFF08JSON \u6570\u7EC4\uFF0C\u4F8B\u5982", " ", '[{"id":"\u8D44\u6E90ID","digest":"SHA-256"}]', "\uFF09", /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        rows: 5,
        value: editor.references,
        onChange: (e) => change("references", e.target.value),
        spellCheck: "false"
      }
    )), /* @__PURE__ */ import_react.default.createElement("p", { className: "gal-hint" }, "MCP \u6587\u4EF6\u4FDD\u5B58\u73AF\u5883\u53D8\u91CF\u540D\u79F0\u4E0E\u914D\u7F6E\u6A21\u677F\uFF1B\u8FD0\u884C\u51ED\u636E\u7531\u4F7F\u7528\u65B9\u914D\u7F6E\u3002"))),
    /* @__PURE__ */ import_react.default.createElement("footer", { className: "gal-dialog-footer" }, /* @__PURE__ */ import_react.default.createElement("span", null, "\u4FDD\u5B58\u540E\u7ACB\u5373\u5171\u4EAB\uFF0C\u53EA\u6709\u4F60\u53EF\u4EE5\u7F16\u8F91"), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        className: "gal-primary",
        disabled: busy,
        onClick: () => run(save)
      },
      busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u5E76\u5171\u4EAB"
    ))
  )), confirmation && /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-overlay gal-confirm-overlay" }, /* @__PURE__ */ import_react.default.createElement(
    "section",
    {
      className: "gal-dialog gal-small",
      role: "alertdialog",
      "aria-modal": "true",
      "aria-label": "\u786E\u8BA4\u64CD\u4F5C"
    },
    /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-dialog-head" }, /* @__PURE__ */ import_react.default.createElement("h2", null, "\u786E\u8BA4\u64CD\u4F5C")),
    /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-dialog-body" }, /* @__PURE__ */ import_react.default.createElement("p", null, confirmation.message)),
    /* @__PURE__ */ import_react.default.createElement("div", { className: "gal-dialog-footer" }, /* @__PURE__ */ import_react.default.createElement("button", { autoFocus: true, onClick: () => answerConfirmation(false) }, "\u53D6\u6D88\u64CD\u4F5C"), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        className: "gal-primary",
        onClick: () => answerConfirmation(true)
      },
      "\u786E\u8BA4\u64CD\u4F5C"
    ))
  )));
}
var inject = ["remote", "slots", "locale"];
async function apply(ctx) {
  await ctx.remote.$mount(REMOTE);
  const remote = ctx.get("remote.gallery");
  ctx.effect(
    () => ctx.locale.register(NS, {
      zh: { title: "\u8D44\u6E90 Gallery" },
      en: { title: "Resource Gallery" }
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
        label: () => "\u8D44\u6E90 Gallery"
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

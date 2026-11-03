import { build } from "esbuild";
await build({
  entryPoints: ["src/client/index.jsx"],
  outfile: "dist/client.js",
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2022",
  external: ["react"],
  loader: { ".css": "text" },
  banner: {
    js: 'window.__ModuleLoader__.load({id:"dsh-plugin-gallery",factory:(require)=>{var module={exports:{}};var exports=module.exports;',
  },
  footer: { js: "return module.exports;}});" },
  legalComments: "none",
});
console.log("Built Gallery client");

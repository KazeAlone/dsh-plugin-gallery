import { readdirSync, statSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const walk = (p) =>
  readdirSync(p).flatMap((n) => {
    const x = `${p}/${n}`;
    return statSync(x).isDirectory() ? walk(x) : [x];
  });
for (const p of [...walk("src"), ...walk("scripts")].filter((p) =>
  p.endsWith(".mjs"),
))
  execFileSync(process.execPath, ["--check", p], { stdio: "inherit" });
const p = JSON.parse(readFileSync("package.json"));
if (
  !p.dsh.bundle ||
  !readFileSync("dist/client.js", "utf8").includes("__ModuleLoader__")
)
  throw new Error("Missing bundle metadata/client build");
console.log("Syntax and packaged client checks passed");

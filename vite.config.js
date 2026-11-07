import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

function offlineShell() {
  let root;
  let publicDir;
  return {
    name: "chordly-offline-shell",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      root = config.root;
      publicDir = config.publicDir;
    },
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const template = readFileSync(resolve(root, "public/sw.js"), "utf8");
        const files = new Map(
          Object.values(bundle).map((file) => [
            file.fileName,
            file.type === "chunk" ? file.code : file.source,
          ]),
        );
        for (const file of readdirSync(publicDir, {
          recursive: true,
          withFileTypes: true,
        })) {
          if (!file.isFile() || file.name === "sw.js") continue;
          const path = resolve(file.parentPath, file.name);
          files.set(path.slice(publicDir.length + 1), readFileSync(path));
        }
        const entries = [...files].sort(([a], [b]) => a.localeCompare(b));
        const hash = createHash("sha256").update(template);
        for (const [name, contents] of entries)
          hash.update(name).update(contents);
        const source = template
          .replace("__BUILD_HASH__", hash.digest("hex").slice(0, 16))
          .replace(
            "/* precache */ []",
            JSON.stringify(entries.map(([name]) => `/${name}`)),
          );
        this.emitFile({ type: "asset", fileName: "sw.js", source });
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), offlineShell()],
});

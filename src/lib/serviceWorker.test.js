import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import config from "../../vite.config.js";

const template = readFileSync(
  new URL("../../public/sw.js", import.meta.url),
  "utf8",
);
const shell = ["/index.html", "/assets/app-123.js", "/assets/app-123.css"];
const cacheName = "chordly-shell-test";

function worker({
  installError,
  network = async () => new Response("online"),
} = {}) {
  const handlers = {};
  const stores = new Map();
  const deleted = [];
  let skipped = false;
  let claimed = false;
  const key = (request) =>
    typeof request === "string" ? request : new URL(request.url).pathname;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(paths) {
          if (installError) throw installError;
          for (const path of paths) store.set(path, new Response(path));
        },
        async match(request) {
          return store.get(key(request))?.clone();
        },
      };
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name) {
      deleted.push(name);
      return stores.delete(name);
    },
  };
  runInNewContext(
    template
      .replace("__BUILD_HASH__", "test")
      .replace("/* precache */ []", JSON.stringify(shell)),
    {
      URL,
      Response,
      caches,
      fetch: network,
      self: {
        location: { origin: "https://app.test" },
        addEventListener: (name, handler) => {
          handlers[name] = handler;
        },
        async skipWaiting() {
          skipped = true;
        },
        clients: {
          async claim() {
            claimed = true;
          },
        },
      },
    },
  );
  return {
    stores,
    deleted,
    get skipped() {
      return skipped;
    },
    get claimed() {
      return claimed;
    },
    lifecycle(name) {
      let pending;
      handlers[name]({
        waitUntil(promise) {
          pending = promise;
        },
      });
      assert.ok(pending, `${name} work must be attached to event lifetime`);
      return pending;
    },
    request(path, mode = "cors", method = "GET") {
      let response;
      handlers.fetch({
        request: { url: new URL(path, "https://app.test").href, mode, method },
        respondWith(promise) {
          response = promise;
        },
      });
      return response;
    },
  };
}

test("first installation precaches JavaScript and CSS before activating", async () => {
  const app = worker({
    network: async () => {
      throw new Error("offline");
    },
  });
  const installation = app.lifecycle("install");
  assert.equal(app.skipped, false);
  await installation;
  assert.equal(app.skipped, true);
  for (const path of shell)
    assert.equal(
      await (
        await app.request(path, path.endsWith("html") ? "navigate" : "cors")
      ).text(),
      path,
    );
});

test("an incomplete installation rejects and never asks to activate", async () => {
  const app = worker({ installError: new Error("missing JavaScript chunk") });
  await assert.rejects(app.lifecycle("install"), /missing JavaScript chunk/);
  assert.equal(app.skipped, false);
});

test("activation deletes only obsolete Chordly shell caches", async () => {
  const app = worker();
  await app.lifecycle("install");
  for (const name of ["chordly-v1", "chordly-shell-old", "another-app"])
    app.stores.set(name, new Map());
  await app.lifecycle("activate");
  assert.deepEqual(app.deleted.sort(), ["chordly-shell-old", "chordly-v1"]);
  assert.equal(app.stores.has(cacheName), true);
  assert.equal(app.stores.has("another-app"), true);
  assert.equal(app.claimed, true);
});

for (const status of [404, 503]) {
  test(`navigation falls back to the complete shell on HTTP ${status}`, async () => {
    const app = worker({
      network: async () => new Response("failure", { status }),
    });
    await app.lifecycle("install");
    assert.equal(
      await (await app.request("/tabs/song", "navigate")).text(),
      "/index.html",
    );
  });
}

test("online navigation never replaces the cached HTML with a different build", async () => {
  const app = worker();
  await app.lifecycle("install");
  assert.equal(
    await (await app.request("/tabs/song", "navigate")).text(),
    "online",
  );
  assert.equal(
    await app.stores.get(cacheName).get("/index.html").text(),
    "/index.html",
  );
});

test("Firebase and other external requests, posts and unknown routes are untouched", () => {
  const app = worker();
  assert.equal(
    app.request("https://firestore.googleapis.com/documents"),
    undefined,
  );
  assert.equal(
    app.request("https://identitytoolkit.googleapis.com/accounts"),
    undefined,
  );
  assert.equal(app.request("/api/save", "cors", "POST"), undefined);
  assert.equal(app.request("/api/read"), undefined);
});

test("Vite emits a complete manifest and a deterministic content version", () => {
  const root = mkdtempSync(join(tmpdir(), "chordly-shell-"));
  try {
    const publicDir = join(root, "public");
    mkdirSync(publicDir);
    writeFileSync(join(publicDir, "sw.js"), template);
    writeFileSync(join(publicDir, "icon.svg"), "icon");
    const plugin = config.plugins.find(
      (entry) => entry.name === "chordly-offline-shell",
    );
    plugin.configResolved({ root, publicDir });
    const emit = (code) => {
      let emitted;
      plugin.generateBundle.handler.call(
        {
          emitFile(asset) {
            emitted = asset;
          },
        },
        {},
        {
          html: {
            type: "asset",
            fileName: "index.html",
            source: "<html>app</html>",
          },
          js: { type: "chunk", fileName: "assets/app-123.js", code },
          css: {
            type: "asset",
            fileName: "assets/app-123.css",
            source: "body{}",
          },
        },
      );
      return emitted;
    };
    const first = emit("app()");
    assert.equal(first.fileName, "sw.js");
    assert.equal(first.source.includes("__BUILD_HASH__"), false);
    assert.equal(first.source.includes("/* precache */"), false);
    for (const path of [...shell, "/icon.svg"])
      assert.ok(first.source.includes(JSON.stringify(path)));
    assert.equal(emit("app()").source, first.source);
    assert.notEqual(emit("updatedApp()").source, first.source);
    writeFileSync(join(publicDir, "icon.svg"), "changed icon");
    assert.notEqual(emit("app()").source, first.source);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

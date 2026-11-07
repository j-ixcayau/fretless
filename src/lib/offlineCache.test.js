import test from "node:test";
import assert from "node:assert/strict";
import { clearLegacyOfflineCache } from "./offlineCache.js";

function setup(overrides = {}) {
  const calls = [];
  return {
    calls,
    options: {
      waitForWrites: async () => calls.push("synced"),
      terminate: async () => calls.push("terminated"),
      clearPersistence: async () => calls.push("cleared"),
      report: (message) => calls.push(message),
      reload: () => calls.push("reloaded"),
      ...overrides,
    },
  };
}

test("cleanup waits for current edits, terminates, clears and reloads", async () => {
  const { calls, options } = setup();
  await clearLegacyOfflineCache(options);
  assert.deepEqual(calls, [
    "synced",
    "terminated",
    "cleared",
    "Saved offline data cleared.",
    "reloaded",
  ]);
});

test("unsettled offline writes prevent deletion and leave Firestore running", async () => {
  const { calls, options } = setup({
    waitForWrites: () => new Promise(() => {}),
    timeoutMs: 1,
  });
  await assert.rejects(clearLegacyOfflineCache(options), /still syncing/);
  assert.deepEqual(calls, []);
});

test("blocked cache cleanup reports other tabs and reloads terminated Firestore", async () => {
  const { calls, options } = setup({
    clearPersistence: async () => {
      throw new Error("failed-precondition");
    },
  });
  await clearLegacyOfflineCache(options);
  assert.equal(calls[0], "synced");
  assert.equal(calls[1], "terminated");
  assert.match(calls[2], /Close other Chordly tabs/);
  assert.equal(calls[3], "reloaded");
});

test("failed writes never terminate or delete the cache", async () => {
  const { calls, options } = setup({
    waitForWrites: async () => {
      throw new Error("permission-denied");
    },
  });
  await assert.rejects(clearLegacyOfflineCache(options), /permission-denied/);
  assert.deepEqual(calls, []);
});

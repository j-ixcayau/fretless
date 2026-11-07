import test from "node:test";
import assert from "node:assert/strict";
import { sessionCredential } from "./sessionCredential.js";

const accountA = { uid: "account-a", key: "account-a-key" };

test("switching accounts removes the previous account's API key", () => {
  const next = sessionCredential(accountA, {
    type: "accountChanged",
    uid: "account-b",
  });
  assert.equal(next.key, "");
  assert.equal(next.uid, "account-b");
  const staleSave = sessionCredential(next, {
    type: "save",
    uid: "account-a",
    key: "stale-key",
  });
  assert.equal(staleSave.key, "");
});

test("logout clears the key even if the same account signs back in", () => {
  const loggedOut = sessionCredential(accountA, { type: "clear" });
  assert.equal(loggedOut.key, "");
  assert.equal(
    sessionCredential(loggedOut, {
      type: "save",
      uid: "account-a",
      key: "late-save",
    }).key,
    "",
  );
  assert.equal(
    sessionCredential(loggedOut, {
      type: "accountChanged",
      uid: "account-a",
    }).key,
    "",
  );
});

test("token refresh retains the current account key without persisting it", () => {
  assert.equal(
    sessionCredential(accountA, {
      type: "accountChanged",
      uid: "account-a",
    }).key,
    "account-a-key",
  );
});

test("a current signed-in account can replace or remove its session key", () => {
  assert.equal(
    sessionCredential(accountA, {
      type: "save",
      uid: "account-a",
      key: "  replacement  ",
    }).key,
    "replacement",
  );
  assert.equal(
    sessionCredential(accountA, {
      type: "save",
      uid: "account-a",
      key: "",
    }).key,
    "",
  );
});

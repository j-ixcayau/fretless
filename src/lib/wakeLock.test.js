import test from "node:test";
import assert from "node:assert/strict";
import { keepScreenAwake } from "./wakeLock.js";

function screen() {
  const visibility = new EventTarget();
  visibility.visibilityState = "visible";
  const locks = [];
  const wakeLock = {
    async request(type) {
      assert.equal(type, "screen");
      const lock = new EventTarget();
      lock.released = false;
      lock.release = async () => {
        lock.released = true;
        lock.dispatchEvent(new Event("release"));
      };
      locks.push(lock);
      return lock;
    },
  };
  return { visibility, locks, wakeLock };
}

test("play mode requests screen wake lock and releases it on exit", async () => {
  const { visibility, locks, wakeLock } = screen();
  const stop = keepScreenAwake(wakeLock, visibility);
  await Promise.resolve();
  assert.equal(locks.length, 1);
  stop();
  assert.equal(locks[0].released, true);
  visibility.dispatchEvent(new Event("visibilitychange"));
  assert.equal(locks.length, 1);
});

test("returning to a visible app reacquires a browser-released lock", async () => {
  const { visibility, locks, wakeLock } = screen();
  const stop = keepScreenAwake(wakeLock, visibility);
  await Promise.resolve();
  visibility.visibilityState = "hidden";
  await locks[0].release();
  visibility.dispatchEvent(new Event("visibilitychange"));
  assert.equal(locks.length, 1);
  visibility.visibilityState = "visible";
  visibility.dispatchEvent(new Event("visibilitychange"));
  await Promise.resolve();
  assert.equal(locks.length, 2);
  stop();
});

test("a request finishing after play mode exits is released", async () => {
  const { visibility, wakeLock, locks } = screen();
  const acquired = await wakeLock.request("screen");
  let finish;
  const stop = keepScreenAwake(
    {
      request: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    },
    visibility,
  );
  stop();
  finish(acquired);
  await Promise.resolve();
  assert.equal(locks[0].released, true);
});

test("unsupported or rejected wake locks do not interrupt play mode", async () => {
  const { visibility } = screen();
  assert.doesNotThrow(() => keepScreenAwake(undefined, visibility)());
  const stop = keepScreenAwake(
    {
      request: async () => {
        throw new Error("NotAllowedError");
      },
    },
    visibility,
  );
  await Promise.resolve();
  assert.doesNotThrow(stop);
});

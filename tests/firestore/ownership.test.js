import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

let env;
before(async () => {
  assert.ok(
    process.env.FIRESTORE_EMULATOR_HOST,
    "Run with npm run test:rules; never connect these tests to production",
  );
  env = await initializeTestEnvironment({
    projectId: "demo-chordly",
    firestore: {
      rules: readFileSync(
        new URL("../../firestore.rules", import.meta.url),
        "utf8",
      ),
    },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
});
after(async () => {
  await env?.cleanup();
});

const song = () => ({
  title: "Song",
  content: "[C]Words",
  duration: "180",
  tags: ["practice"],
  created_at: serverTimestamp(),
});
const setlist = () => ({
  name: "Sunday",
  tabs: ["song"],
  created_at: serverTimestamp(),
});
const userDb = (uid) => env.authenticatedContext(uid).firestore();

for (const [kind, fixture] of [
  ["tabs", song],
  ["setlists", setlist],
]) {
  test(`${kind}: owner can create, read, query, update and delete`, async () => {
    const db = userDb("owner");
    const ref = doc(db, `users/owner/${kind}/item`);
    await assertSucceeds(setDoc(ref, fixture()));
    assert.equal((await assertSucceeds(getDoc(ref))).exists(), true);
    assert.equal(
      (
        await assertSucceeds(
          getDocs(
            query(
              collection(db, `users/owner/${kind}`),
              orderBy("created_at", "desc"),
            ),
          ),
        )
      ).size,
      1,
    );
    await assertSucceeds(updateDoc(ref, { updated_at: serverTimestamp() }));
    await assertSucceeds(deleteDoc(ref));
  });
  test(`${kind}: anonymous and another account cannot read, query or write`, async () => {
    await setDoc(doc(userDb("owner"), `users/owner/${kind}/item`), fixture());
    for (const db of [
      env.unauthenticatedContext().firestore(),
      userDb("other"),
    ]) {
      const ref = doc(db, `users/owner/${kind}/item`);
      await assertFails(getDoc(ref));
      await assertFails(getDocs(collection(db, `users/owner/${kind}`)));
      await assertFails(setDoc(doc(db, `users/owner/${kind}/new`), fixture()));
      await assertFails(updateDoc(ref, { updated_at: serverTimestamp() }));
      await assertFails(deleteDoc(ref));
    }
  });
}

test("other paths and nested documents are denied even to their named owner", async () => {
  const db = userDb("owner");
  for (const path of [
    "users/owner",
    "public/item",
    "users/owner/tabs/song/private/item",
  ]) {
    await assertFails(setDoc(doc(db, path), { title: "Unexpected" }));
    await assertFails(getDoc(doc(db, path)));
  }
});

test("a batch with an unauthorized write rejects every write atomically", async () => {
  const db = userDb("owner");
  const ownRef = doc(db, "users/owner/tabs/new");
  const batch = writeBatch(db);
  batch.set(ownRef, song());
  batch.set(doc(db, "users/other/tabs/new"), song());
  await assertFails(batch.commit());
  assert.equal((await getDoc(ownRef)).exists(), false);
});

test("song schemas reject malformed and unexpected fields", async () => {
  const ref = doc(userDb("owner"), "users/owner/tabs/song");
  const invalid = [
    { title: "", content: "" },
    { title: "Song" },
    { title: "Song", content: 42 },
    { ...song(), ownerId: "other" },
    { ...song(), tags: "tag" },
    { ...song(), tags: Array(31).fill("tag") },
    { ...song(), artist: {} },
    { ...song(), content: "x".repeat(200001) },
    { ...song(), duration: "86401" },
    { ...song(), duration: "3:00" },
    { ...song(), duration: -1 },
    { ...song(), updated_at: "today" },
  ];
  for (const data of invalid) await assertFails(setDoc(ref, data));
  await assertSucceeds(
    setDoc(ref, { title: "Draft", content: "", duration: "" }),
  );
  await assertSucceeds(
    updateDoc(ref, { duration: 86400, last_played_at: serverTimestamp() }),
  );
  await assertFails(updateDoc(ref, { content: false }));
});

test("setlist schemas reject malformed and unexpected fields", async () => {
  const ref = doc(userDb("owner"), "users/owner/setlists/list");
  for (const data of [
    { name: "", tabs: [] },
    { name: "Set" },
    { name: "Set", tabs: {} },
    { name: "Set", tabs: [], userId: "other" },
    { name: "Set", tabs: Array(1001).fill("song") },
    { name: "Set", tabs: [], created_at: 1 },
  ])
    await assertFails(setDoc(ref, data));
  await assertSucceeds(setDoc(ref, { name: "Empty", tabs: [] }));
  await assertFails(updateDoc(ref, { name: 1 }));
});

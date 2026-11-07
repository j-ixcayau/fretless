export async function clearLegacyOfflineCache({
  waitForWrites,
  terminate,
  clearPersistence,
  report,
  reload,
  timeoutMs = 10000,
}) {
  let timeout;
  try {
    await Promise.race([
      waitForWrites(),
      new Promise((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new Error("Edits are still syncing. Reconnect and try again."),
            ),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }

  try {
    await terminate();
    await clearPersistence();
    report("Saved offline data cleared.");
  } catch {
    report(
      "Offline data could not be cleared. Close other Chordly tabs and try again.",
    );
  } finally {
    reload();
  }
}

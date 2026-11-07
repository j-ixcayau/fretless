export function keepScreenAwake(wakeLock, visibility) {
  if (!wakeLock?.request) return () => {};
  let active = true;
  let pending = false;
  let lock = null;

  const request = async () => {
    if (!active || pending || lock || visibility.visibilityState !== "visible")
      return;
    pending = true;
    try {
      const acquired = await wakeLock.request("screen");
      if (!active || visibility.visibilityState !== "visible") {
        await acquired.release();
        return;
      }
      lock = acquired;
      acquired.addEventListener(
        "release",
        () => {
          if (lock === acquired) lock = null;
        },
        { once: true },
      );
    } catch {
      // Unsupported policies and low battery must not interrupt playing.
    } finally {
      pending = false;
    }
  };

  visibility.addEventListener("visibilitychange", request);
  request();
  return () => {
    active = false;
    visibility.removeEventListener("visibilitychange", request);
    lock?.release().catch(() => {});
  };
}

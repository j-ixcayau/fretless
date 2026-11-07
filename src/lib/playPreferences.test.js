import test from "node:test";
import assert from "node:assert/strict";
import {
  CHART_FONT_SIZE_KEY,
  readChartFontSize,
  saveChartFontSize,
} from "./playPreferences.js";

function storage(initial = null) {
  const values = new Map(
    initial === null ? [] : [[CHART_FONT_SIZE_KEY, initial]],
  );
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("font size survives a fresh chart load using the same device storage", () => {
  const device = storage();
  assert.equal(readChartFontSize(device), 18);
  saveChartFontSize(26, device);
  assert.equal(readChartFontSize(device), 26);
  saveChartFontSize(22, device);
  assert.equal(device.getItem("chordly.chart-font-size.v1"), "22");
});

test("corrupt and nonnumeric preferences use a readable default", () => {
  for (const value of ["broken", "null", '"22"', "{}", "[]", "true", ""]) {
    assert.equal(readChartFontSize(storage(value)), 18, value);
  }
});

test("saved sizes stay within supported readable limits", () => {
  assert.equal(readChartFontSize(storage("1")), 12);
  assert.equal(readChartFontSize(storage("100")), 40);
  assert.equal(readChartFontSize(storage("22.7")), 23);
  const device = storage();
  saveChartFontSize(99, device);
  assert.equal(readChartFontSize(device), 40);
});

test("blocked storage never prevents reading a chart or changing its size", () => {
  const denied = {
    getItem() {
      throw new Error("SecurityError");
    },
    setItem() {
      throw new Error("QuotaExceededError");
    },
  };
  assert.equal(readChartFontSize(denied), 18);
  assert.doesNotThrow(() => saveChartFontSize(24, denied));
});

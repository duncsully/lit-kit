import { isSignal } from "../src/utils.ts";
import { Signal, signal, computed } from "@lit-labs/preact-signals";
import { state, memo } from "../src/signals.ts";

test("isSignal correctly identifies Signal instances", () => {
  const baseSignal = new Signal(42);
  const writableSignal = signal(42);
  const computedSignal = computed(() => writableSignal.value * 2);
  const stateSignal = state(42);
  const memoSignal = memo(() => stateSignal.value * 2);
  const notSignal = {};
  const notSignalFunction = () => {};

  expect(isSignal(baseSignal)).toBe(true);
  expect(isSignal(writableSignal)).toBe(true);
  expect(isSignal(computedSignal)).toBe(true);
  expect(isSignal(stateSignal)).toBe(true);
  expect(isSignal(memoSignal)).toBe(true);
  expect(isSignal(notSignal)).toBe(false);
  expect(isSignal(notSignalFunction)).toBe(false);
});

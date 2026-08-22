import { describe, expect, test } from "vite-plus/test";
import { memo, state } from "../src/signals.ts";
import { Signal, Computed } from "@lit-labs/preact-signals";

describe("state", () => {
  test("initial value is set correctly", () => {
    const s = state(0);
    expect(s()).toBe(0);
  });

  test("get works", () => {
    const s = state(0);
    expect(s.get()).toBe(0);
  });

  test("set works", () => {
    const s = state(0);
    s.set(5);
    expect(s()).toBe(5);
  });

  test("reset works", () => {
    const s = state(0);
    s.set(5);
    s.reset();
    expect(s()).toBe(0);
  });

  test("update works", () => {
    const s = state(0);
    s.update((value) => value + 5);
    expect(s()).toBe(5);
  });

  test("edit works", () => {
    const s = state(0);
    s.edit(5);
    expect(s()).toBe(5);

    s.edit((current) => current + 5);
    expect(s()).toBe(10);

    s.edit();
    expect(s()).toBe(0);
  });

  test("it counts as instance of Preact Signal", () => {
    const s = state(0);
    expect(s).toBeInstanceOf(Signal);
  });
});

describe("memo", () => {
  test("memoized value is returned", () => {
    const fn = () => 42;
    const memoized = memo(fn);
    expect(memoized()).toBe(42);
  });

  test("memoized value is cached", () => {
    let count = 0;
    const fn = () => {
      count++;
      return count;
    };
    const memoized = memo(fn);
    expect(memoized()).toBe(1);
    expect(memoized()).toBe(1);
  });

  test("it counts as instance of Preact Computed", () => {
    const memoized = memo(() => 42);
    expect(memoized).toBeInstanceOf(Computed);
  });
});

import { describe, expect, test, vi } from "vite-plus/test";
import { memo, state, watch } from "../src/signals.ts";
import { Signal } from "@lit-labs/signals";

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

  test("it counts as instance of Signal.State", () => {
    const s = state(0);
    expect(s).toBeInstanceOf(Signal.State);
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

  test("it counts as instance of Signal.Computed", () => {
    const memoized = memo(() => 42);
    expect(memoized).toBeInstanceOf(Signal.Computed);
  });
});

describe("watch", () => {
  test("calls immediately", () => {
    const callback = vi.fn();
    watch(callback);
    expect(callback).toHaveBeenCalled();
  });

  test("reruns on signal changes", async () => {
    const s = state(0);
    const callback = vi.fn(() => {
      s();
    });
    const stop = watch(callback);
    callback.mockClear();
    s.set(1);
    await Promise.resolve();
    expect(callback).toHaveBeenCalled();
    stop();
  });

  test("cleanup works", async () => {
    const s = state(0);
    const cleanup = vi.fn();
    const callback = vi.fn(() => {
      s();
      return cleanup;
    });
    const stop = watch(callback);
    s.set(1);
    await Promise.resolve();

    expect(callback).toHaveBeenCalled();
    expect(cleanup).toHaveBeenCalled();

    cleanup.mockClear();
    callback.mockClear();

    stop();

    expect(cleanup).toHaveBeenCalled();

    s.set(2);

    expect(callback).not.toHaveBeenCalled();
  });
});

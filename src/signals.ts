import { Signal } from "@lit-labs/signals";
import { bindAllMethods } from "./utils.ts";

export class State<T> extends Signal.State<T> {
  constructor(
    private _initialValue: T,
    options?: Signal.Options<T>,
  ) {
    super(_initialValue, options);

    bindAllMethods(this);
  }

  /**
   * Gets the current value tracking by default. Pass false to untrack.
   * @param [track=true] Whether to track this signal
   * @returns
   */
  get(track = true) {
    return track ? super.get() : Signal.subtle.untrack(() => super.get());
  }
  set(value: T) {
    super.set(value);
    return value;
  }
  /**
   * Resets the signal to its initial value.
   */
  reset() {
    return this.set(this._initialValue);
  }
  /**
   * Calls the provided update function with the current value and then updates the
   * value with the result.
   * @param updater
   * @returns
   */
  update(updater: (value: T) => T) {
    const newValue = updater(this.get());
    return this.set(newValue);
  }
  /**
   * If no value is provided, resets the signal to its initial value. If the value
   * is a function, it will be called with the current value and then the result
   * will be set as the new value. Else the new value will be set directly.
   * @param args
   * @returns
   */
  edit(...args: [] | [T] | [(value: T) => T]): T {
    if (args.length === 0) {
      return this.reset();
    }
    const newValue = args[0];
    return newValue instanceof Function ? this.update(newValue) : this.set(newValue);
  }
}

export class Memo<T> extends Signal.Computed<T> {
  constructor(getter: () => T, options?: Signal.Options<T>) {
    super(getter, options);

    bindAllMethods(this);
  }

  /**
   * Gets the current value tracking by default. Pass false to untrack.
   * @param [track=true] Whether to track this signal
   * @returns
   */
  get(track = true) {
    return track ? super.get() : Signal.subtle.untrack(() => super.get());
  }
}

type CallableSignal<T extends { get(...args: any[]): any }> = T & {
  (...args: Parameters<T["get"]>): ReturnType<T["get"]>;
};

/**
 * Creates a proxy for a signal that allows it to be called like a function to get its value.
 * @param sig
 * @returns
 */
function signalProxy<T extends { get(...args: any[]): any }>(sig: T) {
  const func = function () {};
  Object.setPrototypeOf(func, Object.getPrototypeOf(sig));
  return new Proxy(func, {
    get(_, prop) {
      return Reflect.get(sig, prop, sig);
    },
    apply(_, __, args) {
      return sig.get.call(sig, ...args);
    },
  }) as unknown as CallableSignal<T>;
}

/**
 * Creates a state signal with various mutation methods. Calls get method when called as function.
 * @param initialValue
 * @param options
 * @returns
 * @example
 * ```ts
 * const count = state(0);
 * count.set(1); // or count.edit(1);
 * count.update((c) => c + 1); // or count.edit((c) => c + 1);
 * count.reset(); // or count.edit();
 * console.log(count()); // or count.get();
 * count(false) // untracked
 * ```
 */
export function state<T>(initialValue: T, options?: Signal.Options<T>) {
  return signalProxy(new State(initialValue, options));
}

/**
 * Creates a computed signal. Calls get method when called as function.
 * @param fn
 * @param options
 * @returns
 * @example
 * ```ts
 * const count = state(1);
 * const doubled = memo(() => count() * 2);
 * console.log(doubled()); // or doubled.get();
 * doubled(false) // untracked
 * ```
 */
export function memo<T>(fn: () => T, options?: Signal.Options<T>) {
  return signalProxy(new Memo(fn, options));
}

let needsProcessing = false;

const watcher = new Signal.subtle.Watcher(() => {
  if (!needsProcessing) {
    needsProcessing = true;
    queueMicrotask(processPendingEffects);
  }
});

function processPendingEffects() {
  needsProcessing = false;

  watcher.getPending().forEach((sub) => sub.get());
  watcher.watch();
}

export type Effect = () => void | (() => void);

/**
 * Runs the effect, reruns if any tracked signals change, and optionally runs a cleanup function,
 * if returned by the effect, before the next run and when the watcher is stopped.
 * @param effect
 * @returns A stop function
 * @example
 * ```ts
 * const value = state(0);
 * const stop = watch(() => {
 *   console.log("Value is", value());
 *   return () => console.log("Cleanup");
 * });
 * stop();
 * ```
 */
export function watch(effect: Effect) {
  let cleanup: (() => void) | void;
  const computed = new Signal.Computed(
    () => {
      cleanup?.();
      cleanup = effect();
      return cleanup;
    },
    { equals: () => false },
  );

  watcher.watch(computed);
  computed.get();

  return () => {
    cleanup?.();
    watcher.unwatch(computed);
  };
}

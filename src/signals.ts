import { bindAllMethods } from "./utils.ts";
import { Signal, Computed, type SignalOptions } from "@lit-labs/preact-signals";

export class State<T> extends Signal<T> {
  constructor(
    private _initialValue: T,
    options?: SignalOptions<T>,
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
    return track ? super.value : super.peek();
  }
  set(value: T) {
    super.value = value;
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

export class Memo<T> extends Computed<T> {
  constructor(getter: () => T, options?: SignalOptions<T>) {
    super(getter, options);

    bindAllMethods(this);
  }

  /**
   * Gets the current value tracking by default. Pass false to untrack.
   * @param [track=true] Whether to track this signal
   * @returns
   */
  get(track = true) {
    return track ? super.value : super.peek();
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
    set(_, prop, value) {
      return Reflect.set(sig, prop, value);
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
export function state<T>(initialValue: T, options?: SignalOptions<T>) {
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
export function memo<T>(fn: () => T, options?: SignalOptions<T>) {
  return signalProxy(new Memo(fn, options));
}

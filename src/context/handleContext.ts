import type { Context, ContextRequestEvent, UnknownContext } from "./protocol.ts";
import type { Signal } from "../signals.ts";
import { isSignal } from "../utils.ts";

/**
 * Returns an event listener for the given context, providing the given value. If the value is a signal,
 * it will unwrap the value and subscribe the callback to signal changes.
 * @param context
 * @param value
 * @returns
 */
export const handleContext = <T, K>(context: Context<T, K>, value: K | Signal<K>) =>
  ((e: ContextRequestEvent<UnknownContext>) => {
    if (e?.context !== context) return;

    e.stopImmediatePropagation();
    if (e.subscribe) {
      const [cbValue, unsubscribe] = isSignal(value)
        ? [value.peek(), value.subscribe((newValue) => e.callback(newValue, () => unsubscribe()))]
        : [value, () => {}]; // Provide a no-op unsubscribe function for non-signal values
      e.callback(cbValue, unsubscribe);
      return;
    }
    e.callback(isSignal(value) ? value.peek() : value);
  }) as EventListener;

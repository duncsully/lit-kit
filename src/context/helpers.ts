import type { Signal } from "../signals.ts";
import { useContext } from "./requestContextsDirective.ts";
import { createContext } from "./protocol.ts";
import { provide } from "./provideDirective.ts";

/**
 * Creates a context with a default value and optional key.
 * @param defaultValue The default value to use if no provider is found.
 * @param [key] The key for the context. If not provided, a unique symbol will be used.
 * @returns An object containing the context key, a provide function, and a use function.
 */
export const context = <Key, Value>(defaultValue: Value, key?: Key) => {
  const context = createContext<Value>(key ?? Symbol("context-key"));
  const wrappedProvide = (value: Value | Signal<Value>) => provide(context, value);
  const wrappedUseContext = () => useContext(context, defaultValue);
  return {
    key: context,
    provide: wrappedProvide,
    use: wrappedUseContext,
  };
};

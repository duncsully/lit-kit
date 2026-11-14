import { Signal } from "@lit-labs/preact-signals";

export function bindAllMethods<T extends object>(obj: T): T {
  let currentProto = Object.getPrototypeOf(obj);

  // Stop climbing when hitting Object.prototype
  while (currentProto && currentProto !== Object.prototype) {
    const propertyNames = Object.getOwnPropertyNames(currentProto);

    for (const name of propertyNames) {
      // Skip constructor and already-bound instance overrides
      if (name === "constructor" || obj.hasOwnProperty(name)) {
        continue;
      }

      const descriptor = Object.getOwnPropertyDescriptor(currentProto, name);
      if (descriptor && typeof descriptor.value === "function") {
        (obj as any)[name] = descriptor.value.bind(obj);
      }
    }

    // Move up to the parent prototype
    currentProto = Object.getPrototypeOf(currentProto);
  }

  return obj;
}

/**
 * Checks if the given object is a Signal.
 *
 * Wrapper because instanceof check isn't ideal and will hopefully be replaced with a more robust solution in the future.
 */
export function isSignal(obj: any): obj is Signal<any> {
  return obj instanceof Signal;
}

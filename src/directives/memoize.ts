import { Directive, type PartInfo, PartType, directive } from "lit-html/async-directive.js";
import { Signal, watch, computed, batch } from "@lit-labs/preact-signals";
import type { TemplateFunction } from "../types.ts";
import { Memo, State } from "../signals.ts";

export class MemoizeDirective extends Directive {
  static signalCache = new WeakMap<Function, Signal<any>>();
  constructor(partInfo: PartInfo) {
    super(partInfo);
    this.isEvent = partInfo.type === PartType.EVENT;
  }

  isEvent: boolean;

  render<T>(func: (...args: any[]) => T) {
    if (typeof func !== "function") {
      return func;
    }

    // For event listeners, wrap in batch and return the wrapped function
    if (this.isEvent) {
      return (...args: any[]) => batch(() => func(...args));
    }

    // For non-event functions, wrap in a memo/signal
    if (!MemoizeDirective.signalCache.has(func)) {
      MemoizeDirective.signalCache.set(func, computed(func as () => unknown));
    }
    return watch(MemoizeDirective.signalCache.get(func)!) as T;
  }
}
/**
 * A directive that:
 * - For event listeners: wraps them in batch() to batch signal updates
 * - For non-event functions: transforms them into a ComputedSignal and wraps
 *   with watch directive
 *
 * Intended to be used with `withAutoMemos` to automatically wrap functions
 * without manually using the directive.
 */
export const memoize = directive(MemoizeDirective);

/**
 * Wraps a template literal tag function to automatically transform functions
 * into watched memos or batched event listeners
 * @param fn The template literal tag function to wrap.
 * @returns A new template literal tag function with automatic function transformation.
 */
export function withAutoMemos<T extends TemplateFunction>(fn: T) {
  return (strings: TemplateStringsArray, ...values: any[]) => {
    const forwardValues = values.map((value) => {
      if (typeof value === "function" && !(value instanceof State || value instanceof Memo)) {
        return memoize(value);
      }
      return value;
    });

    return fn(strings, ...forwardValues);
  };
}

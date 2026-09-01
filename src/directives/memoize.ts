import { Directive, type PartInfo, PartType, directive } from "lit-html/async-directive.js";
import { Signal, watch, computed } from "@lit-labs/preact-signals";
import type { TemplateFunction } from "../types.ts";
import { Memo, State } from "../signals.ts";

export class MemoizeDirective extends Directive {
  static signalCache = new WeakMap<Function, Signal<any>>();
  constructor(partInfo: PartInfo) {
    super(partInfo);
    this.isEvent = partInfo.type === PartType.EVENT;
  }

  isEvent: boolean;

  render<T>(func: () => T) {
    if (this.isEvent) {
      return func;
    }

    if (!MemoizeDirective.signalCache.has(func)) {
      MemoizeDirective.signalCache.set(func, computed(func as () => unknown));
    }
    return watch(MemoizeDirective.signalCache.get(func)!) as T;
  }
}
/**
 * A directive that transforms nonevent functions into a ComputedSignal before being passed off
 * to the watch directive. Intended to be used with `withAutoMemos` to automatically wrap functions
 * without manually using the directive.
 */
export const memoize = directive(MemoizeDirective);

/**
 * Wraps a template literal tag function to automatically transform functions into watched memos
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

import { batch } from "@lit-labs/preact-signals";
import { directive, Directive, PartType, type PartInfo } from "lit-html/directive.js";
import type { TemplateFunction } from "./types.ts";

export class BatchDirective extends Directive {
  constructor(partInfo: PartInfo) {
    super(partInfo);
    this.isEvent = partInfo.type === PartType.EVENT;
  }

  isEvent: boolean;

  render<T extends (...args: any[]) => any>(fn: T) {
    return this.isEvent ? (...args: Parameters<T>) => batch(() => fn(...args)) : fn;
  }
}

/**
 * A directive that wraps event listeners in a batch update. This is intended to be used with
 * `withAutoBatch` to automatically batch updates for event listeners without manually using
 * the directive.
 */
export const batchEvent = directive(BatchDirective);

export function withAutoBatch<T extends TemplateFunction>(fn: T) {
  return (strings: TemplateStringsArray, ...values: any[]) => {
    const forwardValues = values.map((value) => {
      if (typeof value === "function") {
        return batchEvent(value);
      }
      return value;
    });

    return fn(strings, ...forwardValues);
  };
}

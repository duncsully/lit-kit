import { noChange } from "lit-html";
import { AsyncDirective, directive } from "lit-html/async-directive.js";
import { effect as unboundEffect } from "@lit-labs/preact-signals";
import type { TemplateFunction } from "../types.ts";

export type Effect = () => void | (() => void);

export class EffectDirective extends AsyncDirective {
  cleanups: (() => void)[] = [];
  effects: (() => (() => void) | void)[] = [];

  render(...effects: Effect[]) {
    this.effects = effects;
    this.runEffects();
    return noChange;
  }

  protected runEffects() {
    this.cleanups = [];
    this.effects.forEach((effectCb) => {
      const cleanup = unboundEffect(effectCb);
      if (cleanup) {
        this.cleanups.push(cleanup);
      }
    });
  }

  protected reconnected(): void {
    this.runEffects();
  }

  protected disconnected(): void {
    this.cleanups.forEach(Reflect.apply);
  }
}

/**
 * Runs the passed effects when the parent element is rendered, and calls the
 * returned cleanup function when the parent element is removed from the DOM.
 */
export const effects = directive(EffectDirective);

const effectFns: Effect[] = [];
export const effect = (effectFn: Effect) => {
  effectFns.push(effectFn);
};

/**
 * Wraps a template literal tag function to automatically apply effects added with
 * `effect`.
 * @param fn The template literal tag function to wrap.
 * @returns A new template literal tag function with automatic effect application.
 */
export function withEffects<T extends TemplateFunction>(fn: T) {
  return (strings: TemplateStringsArray, ...values: any[]) => {
    if (effectFns.length) {
      return fn`${effects(...effectFns.splice(0))}${fn(strings, ...values)}`;
    }
    return fn(strings, ...values);
  };
}

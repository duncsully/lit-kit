import { noChange, type ChildPart } from "lit-html";
import { AsyncDirective, directive, type ElementPart } from "lit-html/async-directive.js";
import type { TemplateFunction } from "../types.ts";
import {
  ContextRequestEvent,
  type Context,
  type ContextType,
  type UnknownContext,
} from "./protocol.ts";
import { State, state, type ReadonlyState } from "../signals.ts";

type ContextSignalPair<T extends UnknownContext> = [T, State<ContextType<T>>];

export class RequestContextsDirective extends AsyncDirective {
  cleanups = new Set<() => void>();
  element: Element | undefined = undefined;
  pairs: ContextSignalPair<UnknownContext>[] = [];

  update(part: ChildPart | ElementPart, ...[pairs]: [ContextSignalPair<UnknownContext>[]]) {
    this.element = "element" in part ? part.element : (part.parentNode as Element);
    this.pairs = pairs;
    return this.render(...pairs);
  }

  render(..._pairs: ContextSignalPair<UnknownContext>[]) {
    this.makeRequests();
    return noChange;
  }

  protected makeRequests() {
    if (!this.element) {
      console.warn("RequestContextsDirective: element is not defined");
      return;
    }
    this.pairs.forEach(([context, signal]) => {
      const request = new ContextRequestEvent(
        context,
        (value, unsubscribe) => {
          signal.value = value;
          // TODO: Might want to unsubscribe from previous subscriptions if it changed?
          if (unsubscribe) this.cleanups.add(unsubscribe);
        },
        true,
      );
      this.element!.dispatchEvent(request);
    });
  }

  protected reconnected(): void {
    this.makeRequests();
  }

  protected disconnected(): void {
    this.cleanups.forEach((cleanup) => cleanup());
  }
}

/**
 * Requests contexts, subscribing to them, setting their values in the provided signals when the parent element is rendered, and calls the
 * context unsubscribe functions when the parent element is removed from the DOM.
 *
 * Uses the [Context Protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md) to send a context-request
 * event from where this directive is used (on the parent element if rendered as a child part)
 */
export const requestContexts = directive(RequestContextsDirective);

const pairs: ContextSignalPair<UnknownContext>[] = [];

/**
 * Returns a signal that will be updated with the value of the requested context.
 *
 * Note: The context request is attached to the next immediately created template. If the template is not rendered,
 * the context request will not be sent and the signal will not be updated.
 *
 * @param context The context to request.
 * @returns A readonly signal that will be updated with the value of the requested context.
 *
 * @example
 * ```ts
 * const myContext = createContext<string>('key');
 *
 * const MyComponent = () => {
 *  const myContextSignal = useContext(myContext);
 *  return html`${myContextSignal}`
 * }
 * ```
 */
export const useContext = <Key, Value, Default extends Value | undefined>(
  context: Context<Key, Value>,
  defaultValue?: Default,
) => {
  const signal = state(defaultValue);
  pairs.push([context, signal]);
  return signal as ReadonlyState<Default>;
};

/**
 * Wraps a template literal tag function to automatically request contexts added with
 * `useContext`.
 * @param fn The template literal tag function to wrap.
 * @returns A new template literal tag function with automatic effect application.
 */
export function withUseContext<T extends TemplateFunction>(fn: T) {
  return (strings: TemplateStringsArray, ...values: any[]) => {
    if (pairs.length) {
      return fn`${requestContexts(...pairs.splice(0))}${fn(strings, ...values)}`;
    }
    return fn(strings, ...values);
  };
}

import { AsyncDirective, directive, PartType, type ElementPart } from "lit-html/async-directive.js";
import { noChange } from "lit-html";
import type { Context } from "./protocol.ts";
import type { Signal } from "../signals.ts";
import { handleContext } from "./handleContext.ts";

export class ProvideDirective extends AsyncDirective {
  constructor(partInfo: any) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error("The provide directive can only be used on element parts.");
    }
  }
  update(part: ElementPart, [context, value]: Parameters<typeof this.render>) {
    this.handler = handleContext(context, value);
    if (this.isConnected) {
      this.element = part.element;
      part.element.addEventListener("context-request", this.handler);
    }
    return this.render(context, value);
  }
  render<T, K>(_context: Context<T, K>, _value: K | Signal<K>) {
    return noChange;
  }

  reconnected() {
    if (this.element && this.handler) {
      this.element.addEventListener("context-request", this.handler);
    }
  }
  disconnected() {
    if (this.element && this.handler) {
      this.element.removeEventListener("context-request", this.handler);
    }
  }

  element?: Element;
  handler?: EventListener;
}

/**
 * Provides a context value to descendant elements that request it using the [Context Protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md).
 * The directive should be used on an element part.
 *
 * @example
 * ```ts
 * const myContext = createContext<string>("my-context");
 *
 * html`
 *  <div ${provide(myContext, 'primitive value')}></div>
 * `
 *
 * const myState = state('state value');
 * html`
 *  <!-- Will unwrap the signal value and provide it as the context value -->
 *  <div ${provide(myContext, myState)}></div>
 * `
 * ```
 */
export const provide = directive(ProvideDirective);

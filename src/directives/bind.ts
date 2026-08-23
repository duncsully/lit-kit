import { Signal, watch } from "@lit-labs/preact-signals";
import { type BooleanAttributePart, type AttributePart, noChange } from "lit-html";
import {
  PartType,
  type PropertyPart,
  directive,
  type PartInfo,
  Directive,
} from "lit-html/directive.js";

export class BindDirective extends Directive {
  constructor(partInfo: PartInfo) {
    if (
      !([PartType.ATTRIBUTE, PartType.BOOLEAN_ATTRIBUTE, PartType.PROPERTY] as PartType[]).includes(
        partInfo.type,
      )
    ) {
      throw new Error("bind can only be used for attributes, boolean attributes, and properties.");
    }
    super(partInfo);
  }

  event = "";
  handler: (e: Event) => void = () => {};

  render<T>(signal: Signal<T>, event = "input") {
    this.event = event;
    return watch(signal) as T;
  }

  update<T>(
    part: PropertyPart | AttributePart | BooleanAttributePart,
    [signal, event = "input"]: [Signal<T>, string | undefined],
  ) {
    if (event !== this.event) {
      const el = part.element;
      el.removeEventListener(this.event, this.handler);

      const property = part.name;

      this.handler = (e: Event) => {
        signal.value = (e.target as HTMLElement)?.[property as keyof HTMLElement] as T;
      };
      el.addEventListener(event, this.handler);

      return this.render(signal, event);
    }

    return noChange;
  }
}

/**
 * Binds a signal to an element's property or attribute. Defaults to input event, but
 * can be changed by passing a second argument matching the event name (without 'on').
 */
export const bind = directive(BindDirective);

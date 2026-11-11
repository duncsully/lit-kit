import { nothing, type TemplateResult } from "lit-html";
import { watch, Signal, computed } from "@lit-labs/preact-signals";
import { getAllContextValues, withBulkProvide } from "../context.ts";

/**
 * A directive that conditionally renders a template based on a signal or boolean-returning function.
 * @param condition
 * @param then
 * @param otherwise
 * @returns
 */
export function when(
  condition: (() => boolean) | Signal<boolean>,
  then: () => TemplateResult,
  otherwise: () => TemplateResult | typeof nothing = () => nothing,
) {
  const isSignal = condition instanceof Signal;
  const signal = isSignal ? condition : computed(condition);

  const contextValuesMap = getAllContextValues();

  const template = computed(
    withBulkProvide(contextValuesMap, () => (signal.value ? then() : otherwise())),
  );

  return watch(template) as TemplateResult | ReturnType<typeof otherwise>;
}

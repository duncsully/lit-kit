import { expect, test, vi } from "vite-plus/test";
import { effect, withEffects } from "../../src/directives/effects.ts";
import { html as coreHtml, render } from "lit-html";

test("withEffects should apply effects to the template", async () => {
  const html = withEffects(coreHtml);
  const cleanup = vi.fn();
  const cb = vi.fn(() => cleanup);
  const component = () => {
    effect(cb);
    return html`<p>hi</p>`;
  };
  render(component(), window.document.body);

  expect(cb).toHaveBeenCalled();

  render(html``, window.document.body);

  expect(cleanup).toHaveBeenCalled();
});

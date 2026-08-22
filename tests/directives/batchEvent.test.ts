import { expect, test, vi } from "vite-plus/test";
import { html as coreHtml, render } from "lit-html";
import { withAutoBatch } from "../../src/directives/batchEvent.ts";
import { memo, state } from "../../src/signals.ts";
import { userEvent } from "@testing-library/user-event";
import { getByText } from "@testing-library/dom";

test("withAutoBatch should wrap event handlers in batch", async () => {
  const user = userEvent.setup();
  const html = withAutoBatch(coreHtml);
  const width = state(2);
  const height = state(6);
  const area = memo(() => width() * height());
  const subscriber = vi.fn();
  area.subscribe(subscriber);
  subscriber.mockClear();

  const component = () =>
    html`<button
      @click=${() => {
        width.set(3);
        height.set(4);
      }}
    >
      Click me
    </button>`;
  render(component(), window.document.body);
  await user.click(getByText(window.document.body, "Click me"));

  expect(subscriber).not.toHaveBeenCalled();
});

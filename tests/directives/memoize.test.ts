import { expect, test } from "vite-plus/test";
import { html as coreHtml, render } from "lit-html";
import { screen } from "@testing-library/dom";
import { userEvent } from "@testing-library/user-event";
import { withAutoMemos } from "../../src/directives/memoize.ts";
import { state } from "../../src/signals.ts";

test("withAutoMemos should wrap functions in memos and watch them", async () => {
  const html = withAutoMemos(coreHtml);
  const value = state("hi");
  const component = () => html`<p>${() => value()}</p>`;
  render(component(), window.document.body);

  expect(screen.getByText("hi")).toBeInTheDocument();

  value.set("hello");
  await Promise.resolve();

  expect(screen.getByText("hello")).toBeInTheDocument();
});

test("withAutoMemos works with signal getters", async () => {
  const html = withAutoMemos(coreHtml);
  const value = state("hi");
  const component = () => html`<p>${value.get}</p>`;
  render(component(), window.document.body);

  expect(screen.getByText("hi")).toBeInTheDocument();

  value.set("hello");
  await Promise.resolve();

  expect(screen.getByText("hello")).toBeInTheDocument();
});

test("withAutoMemos should wrap event handlers in batch", async () => {
  const html = withAutoMemos(coreHtml);
  const subscriber = vi.fn();
  const value = state(0);
  value.subscribe(subscriber);
  subscriber.mockClear();
  const component = () =>
    html`<button
      @click=${() => {
        value.update((v) => v + 1);
        value.update((v) => v + 1);
        value.update((v) => v + 1);
      }}
    >
      Click me
    </button>`;
  render(component(), window.document.body);

  await userEvent.click(screen.getByText("Click me"));

  expect(subscriber).toHaveBeenCalledExactlyOnceWith(3);
  expect(value()).toBe(3);
});

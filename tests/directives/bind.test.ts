import { beforeEach, expect, it } from "vite-plus/test";
import { state } from "../../src/signals.ts";
import { render } from "lit-html";
import { html } from "../../src/html.ts";
import { bind } from "../../src/directives/bind.ts";
import { getByRole } from "@testing-library/dom";
import { userEvent, type UserEvent } from "@testing-library/user-event";

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

it("should extend watch directive behavior", async () => {
  const name = state("Dave");
  render(html`<input type="text" .value=${bind(name)} />`, window.document.body);
  const el = getByRole(window.document.body, "textbox") as HTMLInputElement;

  expect(el.value).toBe("Dave");

  name.set("David");

  await Promise.resolve();

  expect(el.value).toBe("David");
});

it("should update the signal when provided event is fired", async () => {
  const isCool = state(false);
  render(
    html`<p><input type="checkbox" .checked=${bind(isCool, "change")} /></p>`,
    window.document.body,
  );

  const el = getByRole(window.document.body, "checkbox") as HTMLInputElement;

  expect(el.checked).toBe(false);

  await user.click(el);

  expect(isCool()).toBe(true);
});

it("defaults to input event", async () => {
  const name = state("Dave");
  render(html`<input type="text" .value=${bind(name)} />`, window.document.body);

  const el = getByRole(window.document.body, "textbox");

  await user.clear(el);
  await user.type(el, "David");

  expect(name()).toBe("David");
});

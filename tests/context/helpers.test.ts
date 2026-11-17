import { render } from "vitest-browser-lit";
import { context } from "../../src/context/helpers.ts";
import { html } from "../../src/index.ts";

test("context creates a context API with default value", () => {
  const defaultValue = "default-value";
  const api = context(defaultValue);
  const { key, provide, use: useContext } = api;

  expect(key).toBeDefined();

  const signal = useContext();
  render(html`<div></div>`);
  expect(signal.value).toBe(defaultValue);

  const signal2 = useContext();
  const child = html``;
  render(html`<div ${provide("provider-value")}>${child}</div>`);
  expect(signal2.value).toBe("provider-value");
});

test("context creates a context API with default value and custom key", () => {
  const defaultValue = "default-value";
  const key = "custom-key";
  const api = context(defaultValue, key);
  const { key: contextKey, provide, use: useContext } = api;

  expect(contextKey).toBe(key);

  const signal = useContext();
  render(html`<div></div>`);
  expect(signal.value).toBe(defaultValue);

  const signal2 = useContext();
  const child = html``;
  render(html`<div ${provide("provider-value")}>${child}</div>`);
  expect(signal2.value).toBe("provider-value");
});

import { expect, test } from "vite-plus/test";
import { html as coreHtml, render } from "lit-html";
import { screen } from "@testing-library/dom";
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

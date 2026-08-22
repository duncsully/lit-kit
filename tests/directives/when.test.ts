import { html, render } from "lit-html";
import { screen } from "@testing-library/dom";
import { when } from "../../src/directives/when.ts";
import { state } from "../../src/signals.ts";

test("when directive renders first template when condition is true", () => {
  const condition = () => true;
  const then = () => html`<p>Condition is true</p>`;
  const otherwise = () => html`<p>Condition is false</p>`;

  render(html`${when(condition, then, otherwise)}`, window.document.body);
  expect(screen.getByText("Condition is true")).toBeInTheDocument();
});

test("when directive renders nothing when condition is false and no otherwise template is provided", () => {
  const condition = () => false;
  const then = () => html`<p>Condition is true</p>`;

  render(html`${when(condition, then)}`, window.document.body);
  expect(screen.queryByText("Condition is true")).not.toBeInTheDocument();
});

test("when directive renders second template when condition is false", () => {
  const condition = () => false;
  const then = () => html`<p>Condition is true</p>`;
  const otherwise = () => html`<p>Condition is false</p>`;

  render(html`${when(condition, then, otherwise)}`, window.document.body);
  expect(screen.getByText("Condition is false")).toBeInTheDocument();
});

test("when directive watches changes", () => {
  const value = state(false);
  const then = () => html`<p>Condition is true</p>`;
  const otherwise = () => html`<p>Condition is false</p>`;

  render(html`${when(value, then, otherwise)}`, window.document.body);
  expect(screen.getByText("Condition is false")).toBeInTheDocument();

  value.set(true);
  expect(screen.getByText("Condition is true")).toBeInTheDocument();
});

import { render } from "vitest-browser-lit";
import { html } from "../src/html.ts";
import { Router } from "../src/router.ts";
import { state } from "../src/signals.ts";
import { userEvent } from "@testing-library/user-event";
import { context } from "../src/context.ts";

describe("Router", () => {
  it("should render the correct route and handle navigation", async () => {
    const result = render(
      Router({
        "/": () => html`<p>Home</p>`,
        "/about": () => html`<p>About</p>`,
        "*": () => html`<p>Not Found</p>`,
      }),
    );
    await expect.element(result.getByText("Home")).toBeVisible();
    navigation.navigate("/about");
    await expect.element(result.getByText("About")).toBeVisible();
    navigation.navigate("/non-existent");
    await expect.element(result.getByText("Not Found")).toBeVisible();
  });

  it("should pass params as signals and update when they change", async () => {
    const result = render(
      Router({
        "/user/:id": ({ id }) => html`<p>User ID: ${id}</p>`,
      }),
    );
    navigation.navigate("/user/123");
    await expect.element(result.getByText("User ID: 123")).toBeVisible();
    navigation.navigate("/user/456");
    await expect.element(result.getByText("User ID: 456")).toBeVisible();
  });

  it("should not rerender when navigating to the same route", async () => {
    let renderCount = 0;
    render(
      Router({
        "*": () => {
          renderCount++;
          return html`<p>Home</p>`;
        },
      }),
    );
    navigation.navigate("/hello");
    navigation.navigate("/goodbye");
    expect(renderCount).toBe(1);
  });

  it("maintains focus when navigating to the same route", async () => {
    const result = render(
      Router({
        "*": () => html`<input />`,
      }),
    );
    const homeElement = result.getByRole("textbox");
    await homeElement.fill("h");
    navigation.navigate("/neat");
    await expect.element(homeElement).toHaveFocus();
    // Type "i" after navigating to the same route to check if focus is maintained
    // at end of input
    await userEvent.keyboard("i");
    await expect.element(homeElement).toHaveValue("hi");
  });

  it("can accept an arbitrary path signal", async () => {
    const path = state("/different");
    const result = render(
      Router(path, {
        "/": () => html`<p>Home</p>`,
        "/different": () => html`<p>Different</p>`,
        "*": () => html`<p>Not Found</p>`,
      }),
    );
    await expect.element(result.getByText("Different")).toBeVisible();
    path.value = "/non-existent";
    await expect.element(result.getByText("Not Found")).toBeVisible();
  });

  it("sorts routes by specificity automatically", async () => {
    const result = render(
      Router({
        "*": () => html`<p>Not Found</p>`,
        "/user/:id": ({ id }) => html`<p>User ID: ${id}</p>`,
        "/user/settings": () => html`<p>User Settings</p>`,
      }),
    );
    navigation.navigate("/user/settings");
    await expect.element(result.getByText("User Settings")).toBeVisible();
    navigation.navigate("/user/123");
    await expect.element(result.getByText("User ID: 123")).toBeVisible();
  });

  it("can be nested", async () => {
    const result = render(
      Router({
        "/user/*": (props) =>
          Router(props[0], {
            ":id": ({ id }) => html`<p>${id}</p>`,
          }),
      }),
    );
    navigation.navigate("/user/123");
    await expect.element(result.getByText("123")).toBeVisible();
  });

  it("reprovides context values", async () => {
    const activeRoute = state("/");
    const c = context<string>("default");
    const result = render(
      c.provide("different", () =>
        Router({
          "/": html`<p>Does not matter</p>`,
          "*": () => html`<p>${c.current}</p>`,
        }),
      ),
    );
    activeRoute.value = "/other";
    await expect.element(result.getByText("different")).toBeVisible();
  });
});

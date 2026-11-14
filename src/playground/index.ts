import { when } from "../directives/when.ts";
import { state, memo, effect, html, context } from "../index.ts";
import { render } from "lit-html";
import { urlState } from "../utilitySignals.ts";
import { bind } from "../directives/bind.ts";
import { Router } from "../router.ts";

// This is a mess of my personal testing, not at all intended to demonstrate best practices
// or even recommended usage

const isDarkTheme = state(false);
const isDarkThemeContext = context(isDarkTheme);

const MyComponent = () => {
  const count = urlState("count", 0);
  const doubled = memo(() => count() * 2);
  effect(() => {
    console.log(`Doubled is now ${doubled()}`);

    return () => console.log("Running effect cleanup");
  });

  const isDarkTheme = state(true);
  using _ = isDarkThemeContext.provideForScope(isDarkTheme);

  const showRouting = state(true);

  const height = state(2);
  const width = state(5);
  const area = memo(() => width() * height());
  effect(() => {
    console.log(`Area is now ${area()}`);
  });
  const swapDimensions = () => ([width.value, height.value] = [height(), width()]);
  return html`
    <label>
      Width
      <input type="number" .value=${bind(width)} />
    </label>
    <label>
      Height
      <input type="number" .value=${bind(height)} />
    </label>
    <p>Area: ${area}</p>
    <button @click=${swapDimensions}>Swap Dimensions</button>
    <label>
      Count:
      <input
        type="number"
        .value=${count}
        @input=${(e: InputEvent) => count.set(Number((e.target as HTMLInputElement).value) || 0)}
      />
    </label>
    <button @click=${() => count.update((current) => current + 1)}>Increment</button>
    <button @click=${() => count.reset()}>Reset</button>
    <p>Doubled: ${doubled}</p>
    <p>Quadrupled: ${() => doubled() * 2}</p>
    <p>
      ${when(
        () => count() > 5,
        () => html`Count is greater than 5 ${Nested()}`,
        () => html`Count is 5 or less`,
      )}
    </p>
    <label>
      Dark theme:
      <input type="checkbox" .checked=${bind(isDarkTheme, "change")} />
    </label>
    ${Nested()}
    <div>
      <button @click=${() => showRouting.update((v) => !v)}>Toggle Routing</button>
    </div>
    ${when(
      showRouting,
      () =>
        html`<div>
          <a href="/">Home</a>
          <a href="/theme">Theme</a>
          <a href="/nested">Nested</a>
          <a href="/non-existent">Non-existent</a>
          ${Router({
            "/": () => html`Home`,
            "/theme": Nested,
            "/nested/*?": ({ 0: rest }) => {
              const count = state(0);

              return html` <button @click=${() => count.update((c) => c + 1)}>
                  Count: ${count}
                </button>
                ${Router(rest, {
                  "": () =>
                    html`<p>Nested Home</p>
                      <input
                        placeholder="Go to..."
                        @keydown=${(e: KeyboardEvent) => {
                          if (e.key === "Enter") {
                            const input = e.target as HTMLInputElement;
                            const value = input.value;
                            if (value) {
                              navigation.navigate(`/nested/${value}`);
                            }
                          }
                        }}
                      />`,
                  ":id": ({ id }) => html`<p>Nested Detail for ${id}</p>`,
                })}`;
            },
            "*": () => html`Not Found`,
          })}
        </div>`,
    )}
  `;
};

function Nested() {
  const isDarkTheme = isDarkThemeContext.current;
  return html`Nested content with theme: ${() => (isDarkTheme() ? "dark" : "light")}`;
}

render(MyComponent(), document.body);

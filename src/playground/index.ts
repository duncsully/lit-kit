import { when } from "../directives/when.ts";
import { state, memo, effect, html, context } from "../index.ts";
import { render } from "lit-html";
import { urlState } from "../utilitySignals.ts";
import { bind } from "../directives/bind.ts";

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
  return html`
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
        () => html`Count is greater than 5`,
        () => html`Count is 5 or less`,
      )}
    </p>
    <label>
      Dark theme:
      <input type="checkbox" .checked=${bind(isDarkTheme, "change")} />
    </label>
    ${Nested()}
  `;
};

function Nested() {
  const isDarkTheme = isDarkThemeContext.current;
  return html`Nested content with theme: ${() => (isDarkTheme() ? "dark" : "light")}`;
}

render(MyComponent(), document.body);

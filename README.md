# lit-kit

To be candid, this is a personal project to use in other personal projects but I still feel compelled to provide a readme in the off chance someone else reads this and perhaps is even intrigued.

For context, I first tried to reverse engineer my own signals implementation with nubbins. solit-html was my toy project to refine my signals implementation for use with lit-html. With the possibility of a standard signals implementation on the way (currently using Preact signals because they are more mature and feature-rich) and some time spent using solit-html in apps, I decided to make this a more production-ready library to serve my future projects. That said, still very much in progress.

## Overview

A set of utilities for working with lit-html and signals as a compositional UI library without making web components with lit-element. This allows you to define function "components" that don't actually exist in the same sense that React components do, as they're just functions that set up signals and templates that react to signal updates. Its mental model is similar to SolidJS.

```javascript
import { state, memo, effect, html } from "lit-kit";
import { render } from "lit-html";

const MyComponent = () => {
  const count = state(0);
  const doubled = memo(() => count() * 2);

  effect(() => {
    console.log(`Doubled is now ${doubled()}`);

    return () => console.log("Running effect cleanup");
  });

  return html`
    <label>
      Count:
      <input type="number" .value=${count} @input=${(e) => count.set(e.target.value || 0)} />
    </label>
    <button @click=${() => count.update((current) => current + 1)}>Increment</button>
    <button @click=${() => count.reset()}>Reset</button>
    <p>Doubled: ${doubled}</p>
    <p>Quadrupled: ${() => doubled() * 2}</p>
  `;
};

render(MyComponent(), document.body);
```

## Compared to React

| Aspect                 | React                                                      | lit-kit                                                             |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| Mental model           | UI function of state, components rerender on state changes | DOM changes tied directly to signal updates, components render once |
| Components             | Long-lived, lifecycle tied to instance                     | Ephemeral, lifecycle tied to templates                              |
| Templating             | primarily JSX                                              | lit-html templates                                                  |
| State                  | primitive values managed by hooks                          | signals (state, memo, urlState)                                     |
| Effects                | useEffect with dependency array, tied to component         | effect tracks signals, tied to template                             |
| Hooks                  | must follow rules, e.g. can't be conditionally called      | no special rules, can be composed freely                            |
| Should **you** use it? | yeah probably                                              | I dunno but I'm gonna anyway                                        |

## Features

### Signals

lit-kit provides two core signal types: `state` and `memo`. These wrap `signal` and `computed` respectively with additional functionality. You're free to use Preact's signals directly alongside these.

`State` extends Preact's `Signal` class.

```ts
const count = state(0);

// Can still use Preact's Signal API directly
count.value; // Returns value and tracks signal
count.peek(); // Returns value without tracking signal
count.value = 1; // Set to a new value

count.get(); // Returns value and tracks signal, i.e. like count.value
count.get(false); // Returns value without tracking signal, i.e. like count.peek()
count(); // The signal itself can be called as a function to use its get method
count(false);

count.set(5); // Set to a new value
count.update((current) => current + 1); // Update based on current value
count.reset(); // Reset to initial value
count.edit(5); // Edit can be used to do all three depending on the argument
count.edit((current) => current + 1);
count.edit();
```

`urlState` Can be used to keep a signal in sync with a URL search parameter. This is handy for preserving state in bookmarks and/or sharing links, such as for a specific set of search results. When the template using the URL state is removed from the DOM, the search param is deleted as well.

```ts
// Will initialize with the value of "page" in the search params, else default to 1
const page = urlState("page", 1);

page.set(2); // Will update the URL search param to ?page=2
```

`Memo` extends Preact's `Computed` class.

```ts
const doubled = memo(() => count() * 2);

// Can still use Preact's Computed API directly
doubled.value; // Returns value and tracks signal
doubled.peek(); // Returns value without tracking signal

doubled.get(); // Returns value and tracks signal, i.e. like doubled.value
doubled.get(false); // Returns value without tracking signal, i.e. like doubled.peek()
doubled(); // The signal itself can be called as a function to use its get method
doubled(false);
```

### Templates

lit-kit provides an `html` template tagging function with additional features compared to the standard `html` from lit-html.

Signals or their `.get` method references can be used directly in templates to track their values.

Functions in template values are automatically wrapped in memos and tracked, or batched if they are event handlers.

```ts
import { html } from "lit-kit";

const count = state(1);

const template = html`
  <!-- This will track count without creating a memo -->
  <p>${count.get}</p>
  <!-- This creates a memo -->
  <p>${() => count() * 2}</p>
`;

// Batched event handlers

const width = state(2);
const height = state(4);
const area = memo(() => width() * height());

const templateWithEventHandler = html`
  <!-- area's subscribers won't be updated since after the batch its value is still the same -->
  <button @click=${() => ([width.value, height.value] = [height(), width()])}>Swap</button>
`;
```

### Effects

`effect` ties an effect to a template, running the effect when the template mounts and whenever a signal tracked inside it updates. If a cleanup function is returned, it will be called before re-running the effect and when the template dismounts. Note that since "components" don't actually exist, the `effect` function simply binds them to the next immediate template.

```ts
import { html } from "lit-kit";

const count = state(1);

effect(() => {
  console.log(`Count is now ${count()}`);

  return () => console.log("Cleaning up!");
});

// All calls of the `effect` function will be bound to this template
const effectedTemplate = html``;
// Only effects called after `effectedTemplate` will be bound to this template
const noneffectedTemplate = html``;
// You can also manually bind functions as effects via the effects directive
const manualEffectsTemplate = html`<p ${effects(someFunction, anotherFunction)}></p>`;
```

### Directives

`bind` - Binds a signal to an element's property.

```ts
const count = state(1);

// Changes to this input will update the signal, defaults to input event
const countTemplate = html`<input .value=${bind(count)} />`;

const isCool = state(false);

// Optionally you can specify a different event
const isCoolTemplate = html`<input type="checkbox" .checked=${bind(isCool, "change")} />`;
```

`when` - Conditionally renders a template based on a signal's value. Similar to lit-html's `when` directive, but accepts a signal or function as the first argument instead of a boolean.

```ts
const isVisible = state(true);

const template = html` ${when(isVisible, () => html`<p>Visible</p>`)} `;

const score = state(8);
const resultTemplate = html`
  ${when(
    () => score() > 5, // You can also pass a function that returns a boolean
    () => html`You passed!`, // True case
    () => html`You failed!`, // False case
  )}
`;
```

### Context

Context allows you to share state and values between components without prop-drilling. lit-kit provides a simple `context` function for creating and using context values.

```ts
import { context } from "lit-kit/context";

const myContext = context("default value");

// Provides a value that never changes
const staticProvider = html`<div ${myContext.provide("static value")}></div>`;

// Providing a signal will provide the signal's value and subscribe context requesters to
// changes to the state automatically
const myContextState = state("initial value");
const stateProvider = html`<div ${myContext.provide(myContextState)}></div>`;

const Requester = () => {
  // Regardless of whether provided a static value or a signal, use() will return a signal with the current context value
  const localContextState = myContext.use();
  return html`<p>${localContextState}</p>`;
};
```

Under the hood context implements the [Context Protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md) for interoperability. As long as the same keys are used and with expected values, context values can be provided to and consumed from other libraries that implement the protocol.

```ts
// Optionally you can provide a custom key, such as if you imported the context from another library
const notMyContext = context("default value", "custom-key");

// You can also use the unbound API directly instead of the `context` helper.
const myContext = createContext("key"); // No default value

// Provides a value that never changes
const staticProvider = html`<div ${provide(myContext, "static value")}></div>`;

const contextState = state("initial value");
// Providing a signal will provide the signal's value and subscribe context requesters to
// changes to that signal
const stateProvider = html`<div ${provide(myContext, contextState)}`;
// This will update contest requesters
contextState.set("new value");

const Requester = () => {
  const localContextState = useContext(myContext, "default value");
  return html`<p>${localContextState}</p>`;
};
```

### Router

lit-kit provides a rudimentary router component for handling client-side routing. It accepts an object mapping route patterns to component functions. It leverages the [URLPattern API](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) to match routes, the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) to intercept navigation events (while a Router is mounted), and signals to render routes only when the active route changes. Changes to the URL will automatically trigger the router to update the active route and route params.

You can also specify a signal to use instead of the browser's URL for determining the active route. This allows you to, for example, render tab content based on state or nest routers that check the remaining path segments from a parent route.

```ts
import { Router } from "lit-kit";
import { render } from "lit-html";

render(
  Router({
    "/": Home,
    "/user/*?": (params) =>
      Router(params[0], {
        "": UsersList,
        ":id": ({ id }) => UserDetail(id),
        me: MyProfile,
      }),
    "/about": About,
    "*": NotFound,
  }),
  document.body,
);
```

## Development

lit-kit uses the [Vite+](https://viteplus.dev/) toolchain.

- Install dependencies:

```bash
vp install
```

- Run the unit tests:

```bash
vp test
```

- Run the dev server:

```bash
vp dev
```

- Build the library:

```bash
vp pack
```

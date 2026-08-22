# lit-kit

TODO: Expand on readme

A set of utilities for working with lit-html and signals as a compositional UI library without lit-element.

Basically, solit-html was my toy project to refine my own signals implementation for use with lit-html. With the possibility of a standard signals implementation on the way (currently using Preact signals because they are more mature and feature-rich) and some time spent using solit-html in apps, I decided to make this a more production-ready library to serve my future projects. That said, still very much in progress. I am only adding things as I need them personally.

## Usage

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
      <input
        type="number"
        .value=${count}
        @input=${(e) => count.set(Number(e.target.value) || 0)}
      />
    </label>
    <button @click=${() => count.update((current) => current + 1)}>Increment</button>
    <button @click=${() => count.reset()}>Reset</button>
    <p>Doubled: ${doubled}</p>
    <p>Quadrupled: ${() => doubled() * 2}</p>
  `;
};

render(MyComponent(), document.body);
```

## Development

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

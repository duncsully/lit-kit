# TODO

- Make urlState cleanup more robust when multiple templates use it*
- Use context in router again?
- Forward context for all memos?$
- Store?
- Readme
- JSDoc the heck out of everything

*I intended only a single component to use these at a time, or at least to have them shared with context if absolutely necessary. But it would be problematic if multiple components used the same key simultaneously. So I should probably add extra logic tracking how many urlState instances are using each key and clean up accordingly.

$My context implementation being based on call stacks has limitations but it's the only way I know to keep it synchronous whereas moving it to the DOM would make it async. So in order to properly forward contexts, I capture them at the creation of functions intended to dynamically render content, like Router and the `when` directive, and then I reprovide them when rendering the content. However this leaves out memos and effects that get processed as directives outside of the initial render call stack. The main use case is if someone doesn't use these sanctioned dynamic rendering functions to dynamically render component functions that try to access context. They won't know any better but will get the wrong context.

Alternatively, I could just accept the async DOM route. It would make for a much more convenient provider directive, and I could also adopt the web component context convention. The values would likely be forced to become signals because directives are still processed after the initial render call stack, meaning they can't synchronously capture the context at the time of component creation.

Also, if like `effect` the consume function attaches a directive to the next template to fire the event from, then the directive is technically attached to the parent element of this template, which very likely could be the provider element. So we'd have to allow and assume that if the same element is the consumer and provider, it wants its own provided value, not an ancestor's.

```ts
const something = context("defaultValue"); // Wraps it to be memo(() => "defaultValue")

const Provider = () => html` <div ${something.provide("newValue")}>${Consumer}</div> `; // Likewise, wraps

const Consumer = () => {
  const value = something.use(); // Would initially be 'defaultValue' and then 'newValue' after directives run
  // And also it would end up using Provider's div as the event source
  return html`<div>${value}</div>`;
};
```

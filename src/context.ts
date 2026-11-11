class Context<T> {
  /**
   * Contexts with nondefault values being provided so that they can be captured
   * and provided to new scopes when needed. Default values will be provided when
   * no other value is provided, so there is no need to re-provide them.
   */
  private static activeContexts: Set<Context<any>> = new Set();
  static getAllContextValues() {
    const values: Map<Context<any>, any> = new Map();
    this.activeContexts.forEach((context) => {
      values.set(context, context.current);
    });
    return values;
  }
  static bulkProvide<K>(contextValuesMap: Map<Context<any>, any>, cb: () => K): K {
    contextValuesMap.forEach((value, context) => {
      context.stack.push(value);
    });
    try {
      return cb();
    } finally {
      contextValuesMap.forEach((_, context) => {
        if (context.stack.length > 1) {
          context.stack.pop();
        }
      });
    }
  }

  constructor(defaultValue: T) {
    this.stack.push(defaultValue);
  }

  private stack: T[] = [];

  [Symbol.dispose](): void {
    this.removeFromStack();
  }

  /**
   * Provides a new value for the context for the scope of the `using` variable.
   * @param value The new value to provide.
   * @returns The context instance.
   * @example
   * ```ts
   * using _ = myContext.provide("new value");
   * ```
   */
  provideForScope(value: T): this {
    this.addToStack(value);
    return this;
  }

  /**
   * Provides a value for the context for the duration of the callback.
   * @param value The new value to provide.
   * @param cb The callback to execute with the new context value.
   * @returns The result of the callback.
   * @example
   * ```ts
   * myContext.provide("new value", () => html`Stuff`)
   * ```
   */
  provide<K>(value: T, cb: () => K): K {
    this.addToStack(value);
    const result = cb();
    this.removeFromStack();
    return result;
  }

  /**
   * The current value of the context.
   *
   * Note that this should only be read in the main body of a template function ("component")
   * and not a memo, effect, or event handler. If you need the value in one of those, save it
   * to a local variable in the main body and use that.
   *
   * @example
   * ```ts
   * const myContext = context(state("value"));
   * const MyComponent = () => {
   *   const contextValue = myContext.current; // Save to local variable
   *
   *   return html`${() => contextValue().toLowerCase()}`; // Then reference the local variable
   * }
   * ```
   */
  get current(): T {
    return this.stack.at(-1)!;
  }

  private addToStack(value: T) {
    this.stack.push(value);
    Context.activeContexts.add(this);
  }

  private removeFromStack() {
    if (this.stack.length > 1) {
      this.stack.pop();
      if (this.stack.length === 1) {
        Context.activeContexts.delete(this);
      }
    }
  }
}

/**
 * Creates a context
 * @param defaultValue
 * @returns
 */
export const context = <T>(defaultValue: T) => new Context<T>(defaultValue);

// Internal helpers
// Because context depends on call stacks, any components/directives that dynamically render
// templates will need to capture context values at the time they are rendered so they can
// forward them along when rendering new content.
export const getAllContextValues = Context.getAllContextValues.bind(Context);
export const bulkProvide = Context.bulkProvide.bind(Context);
export const withBulkProvide =
  <T>(values: Map<Context<any>, any>, cb: () => T) =>
  () =>
    bulkProvide(values, cb);

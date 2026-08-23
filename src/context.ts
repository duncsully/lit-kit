class Context<T> {
  constructor(defaultValue: T) {
    this.stack.push(defaultValue);
  }
  private stack: T[] = [];

  [Symbol.dispose](): void {
    // Always keep the default value
    if (this.stack.length > 1) {
      this.stack.pop();
    }
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
    this.stack.push(value);
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
    this.stack.push(value);
    const result = cb();
    this.stack.pop();
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
}

/**
 * Creates a context
 * @param defaultValue
 * @returns
 */
export const context = <T>(defaultValue: T) => new Context<T>(defaultValue);

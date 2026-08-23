import { context } from "../src/context.ts";

test("context provides default value", () => {
  const myContext = context("default");
  expect(myContext.current).toBe("default");
});

test("context.provideForScope puts new value on stack", () => {
  const myContext = context("default");
  myContext.provideForScope("new value");
  expect(myContext.current).toBe("new value");
});

test("assigning a using variable on context.provideForScope will pop the context value after disposal", () => {
  const myContext = context("default");
  {
    using _ = myContext.provideForScope("new value");
    expect(myContext.current).toBe("new value");
  }
  expect(myContext.current).toBe("default");
});

test("context.provide provides value for callback and returns result", () => {
  const myContext = context("default");
  const result = myContext.provide("new value", () => {
    return myContext.current;
  });
  expect(result).toBe("new value");
  expect(myContext.current).toBe("default");
});

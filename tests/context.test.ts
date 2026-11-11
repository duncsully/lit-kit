import { bulkProvide, context, getAllContextValues } from "../src/context.ts";

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

test("getAllContextValues returns map of active context values", () => {
  const myContext = context("default");
  const anotherContext = context("another");
  myContext.provideForScope("new value");
  const values = getAllContextValues();
  expect(values.get(myContext)).toBe("new value");
  // anotherContext is still providing default value, so it is not considered active
  expect(values.get(anotherContext)).toBeUndefined();
});

test("bulkProvide provides multiple context values", () => {
  const myContext = context("default");
  const anotherContext = context("another");
  const values = new Map();
  values.set(myContext, "new value");
  values.set(anotherContext, "another value");

  bulkProvide(values, () => {
    expect(myContext.current).toBe("new value");
    expect(anotherContext.current).toBe("another value");
  });
  expect(myContext.current).toBe("default");
  expect(anotherContext.current).toBe("another");
});

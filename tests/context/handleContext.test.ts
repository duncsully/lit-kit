import { html } from "lit-html";
import { handleContext } from "../../src/context/handleContext.ts";
import { render } from "vitest-browser-lit";
import { ContextRequestEvent, createContext } from "../../src/context/protocol.ts";
import { ref } from "lit-html/directives/ref.js";
import { state } from "../../src/signals.ts";

const testContext = createContext("test");

test("handleContext creates handler for context-request events for primitive value with subscribe: false", async () => {
  const callback = vi.fn();
  await new Promise((resolve) => {
    render(
      html`<div
        @context-request=${handleContext(testContext, "value")}
        ${ref((el) => {
          const request = new ContextRequestEvent(testContext, callback);
          el?.dispatchEvent(request);
          expect(callback).toHaveBeenCalledWith("value");
          resolve(undefined);
        })}
      ></div>`,
    );
  });
});

test("handleContext creates handler for context-requet events for primitive value with subscribe: true", async () => {
  const callback = vi.fn();
  await new Promise((resolve) => {
    render(
      html`<div
        @context-request=${handleContext(testContext, "value")}
        ${ref((el) => {
          const request = new ContextRequestEvent(testContext, callback, true);
          el?.dispatchEvent(request);
          expect(callback).toHaveBeenCalledWith("value", expect.any(Function));
          resolve(undefined);
        })}
      ></div>`,
    );
  });
});

test("handleContext creates handler for context-request events for signal value with subscribe: false", async () => {
  const callback = vi.fn();
  await new Promise((resolve) => {
    const signal = state("value");
    render(
      html`<div
        @context-request=${handleContext(testContext, signal)}
        ${ref((el) => {
          const request = new ContextRequestEvent(testContext, callback);
          el?.dispatchEvent(request);
          expect(callback).toHaveBeenCalledWith("value");
          callback.mockClear();
          signal.value = "new value";
          expect(callback).not.toHaveBeenCalled();
          resolve(undefined);
        })}
      ></div>`,
    );
  });
});

test("handlesContext creates handler for context-request events for signal value with subscribe: true", async () => {
  let unsubscribe: () => void;
  const callback = vi.fn((_, unsub) => {
    unsubscribe = unsub;
  });
  await new Promise((resolve) => {
    const signal = state("value");
    render(
      html`<div
        @context-request=${handleContext(testContext, signal)}
        ${ref((el) => {
          const request = new ContextRequestEvent(testContext, callback, true);
          el?.dispatchEvent(request);
          // Initial callback should have been called with the current signal value
          expect(callback).toHaveBeenCalledWith("value", unsubscribe);

          // Signal change should trigger the callback with the new value
          callback.mockClear();
          signal.value = "new value";
          expect(callback).toHaveBeenCalledWith("new value", unsubscribe);

          // Unsubscribe should stop further callback invocations
          expect(unsubscribe).toBeDefined();
          unsubscribe();
          callback.mockClear();
          signal.value = "another new value";
          expect(callback).not.toHaveBeenCalled();
          resolve(undefined);
        })}
      ></div>`,
    );
  });
});

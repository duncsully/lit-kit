import { html } from "lit-html";
import { render } from "vitest-browser-lit";
import { ref } from "lit-html/directives/ref.js";
import { ContextRequestEvent, createContext } from "../../src/context/protocol.ts";
import { provide } from "../../src/context/provideDirective.ts";

const testContext = createContext("test");

test("provide directive attaches context-request handler", async () => {
  const callback = vi.fn();
  await new Promise((resolve) => {
    render(
      html`<div
        ${provide(testContext, "value")}
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

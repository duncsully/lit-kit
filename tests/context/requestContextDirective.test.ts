import { html as coreHtml } from "lit-html";
import { render } from "vitest-browser-lit";
import {
  requestContexts,
  useContext,
  withUseContext,
} from "../../src/context/requestContextsDirective.ts";
import { ContextRequestEvent, createContext, type Context } from "../../src/context/protocol.ts";
import { state } from "../../src/signals.ts";

const testContext = createContext<string>("test");

test("requestContexts directive requests and subscribes to contexts", async () => {
  await new Promise((resolve) => {
    const signal = state("value");
    render(
      coreHtml`<div
        @context-request=${(e: ContextRequestEvent<Context<unknown, unknown>>) => {
          expect(e.context).toBe(testContext);
          e.callback("test 1", () => {});
          expect(signal(false)).toBe("test 1");
          e.callback("test 2", () => {});
          expect(signal(false)).toBe("test 2");
          resolve(undefined);
        }}
        ${requestContexts([testContext, signal])}
      ></div>`,
    );
  });
});

// TODO: This test could definitely be improved
test("useContext and withUseContext retrieves the provided context value", async () => {
  let callback: (value: unknown, unsubscribe?: () => void) => void;

  await new Promise((resolve) => {
    const html = withUseContext(coreHtml);
    const component = () => {
      const signal = useContext(testContext);
      return html`<div>${signal}</div>`;
    };
    const result = render(
      html`<div
        @context-request=${(e: ContextRequestEvent<Context<unknown, unknown>>) => {
          expect(e.context).toBe(testContext);
          callback = e.callback;
          callback("test", () => {});
          resolve(undefined);
        }}
      >
        ${component()}
      </div>`,
    );
    expect(result.getByText("test").element()).toBeInTheDocument();

    callback("test 2", () => {});

    expect(result.getByText("test 2").element()).toBeInTheDocument();
  });
});

test("useContext uses provided default value if no provider is present", async () => {
  const html = withUseContext(coreHtml);
  const defaultValue = "default";
  const signal = useContext(testContext, defaultValue);
  render(html``);
  expect(signal(false)).toBe(defaultValue);
});

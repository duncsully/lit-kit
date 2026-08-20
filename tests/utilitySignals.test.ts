import { beforeEach, describe, expect, it } from "vite-plus/test";
import { urlState } from "../src/utilitySignals.ts";
import { html } from "../src/html.ts";
import { nothing, render } from "lit-html";

describe("utilSignals", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });
  describe("urlState", () => {
    it("should initialize state from URL parameters", () => {
      window.history.replaceState({}, "", "/?testKey=%22initialValue%22");
      const value = urlState("testKey", "defaultValue");
      expect(value()).toBe("initialValue");
    });

    it("should use default value if URL parameter is absent", () => {
      const value = urlState("testKey", "defaultValue");
      expect(value()).toBe("defaultValue");
    });

    it("should use default value if URL parameter is invalid JSON", () => {
      window.history.replaceState({}, "", "/?testKey=invalidJSON");
      const value = urlState("testKey", "defaultValue");
      expect(value()).toBe("defaultValue");
    });

    it("should update URL parameters when state changes", () => {
      const component = () => {
        const value = urlState("testKey", "defaultValue");
        value.set("newValue");
        return html``;
      };
      render(component(), document.body);

      expect(window.location.search).toBe("?testKey=%22newValue%22");
    });

    it("should handle multiple keys independently", () => {
      const component = () => {
        const value1 = urlState("key1", "value1");
        const value2 = urlState("key2", "value2");

        value1.set("newValue1");
        value2.set("newValue2");
        return html``;
      };
      render(component(), document.body);

      expect(window.location.search).toContain("key1=%22newValue1%22");
      expect(window.location.search).toContain("key2=%22newValue2%22");
    });

    it("should cleanup after template unmounts by default", () => {
      const component = () => {
        urlState("key", "default");
        return html``;
      };
      render(component(), document.body);

      expect(window.location.search).toContain("key=%22default%22");

      render(nothing, document.body);

      expect(window.location.search).not.toContain("key=%22default%22");
    });
  });
});

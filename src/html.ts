import { html as coreHtml } from "lit-html";
import { withAutoMemos } from "./directives/memoize.ts";
import { withWatch } from "@lit-labs/preact-signals";
import { withEffects } from "./directives/effects.ts";
import { withAutoBatch } from "./directives/batchEvent.ts";

/**
 * A template literal tag that automatically applies several directives:
 * - `withWatch` to automatically read signals and update the DOM when they change
 * - `withAutoMemos` to transform functions into watched memos
 * - `withAutoBatch` to batch updates for event listeners
 * - `withEffects` to apply effects and tie them to template life cycles
 */
export const html = withWatch(withAutoMemos(withAutoBatch(withEffects(coreHtml))));

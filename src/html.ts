import { html as coreHtml } from "lit-html";
import { withAutoMemos } from "./directives/memoize.ts";
import { withWatch } from "@lit-labs/preact-signals";
import { withEffects } from "./directives/effects.ts";

/**
 * A template literal tag that automatically applies several directives:
 * - `withEffects` to apply effects and tie them to template life cycles
 * - `withAutoMemos` to transform functions into watched memos and batch event listeners
 * - `withWatch` to automatically read signals and update the DOM when they change
 */
export const html = withWatch(withAutoMemos(withEffects(coreHtml)));

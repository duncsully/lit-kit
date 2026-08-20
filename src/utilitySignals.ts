import { effect } from "./html.ts";
import { state } from "./signals.ts";

/**
 * Creates a state signal synchronized with URL search parameters. Intended to be used inside of
 * a template-returning function ("component"), automatically removes the search parameter when the
 * template unmounts.
 * @param key The URL parameter key
 * @param defaultValue The default value if the URL search parameter is not set or invalid
 * @returns A state signal
 * @example
 * ```ts
 * const search = urlState('search', '')
 * ```
 */
export const urlState = <T>(key: string, defaultValue: T) => {
  const params = new URLSearchParams(window.location.search);
  let parsedValue: T;
  try {
    parsedValue = JSON.parse(params.get(key) || "") as T;
  } catch {
    parsedValue = defaultValue;
  }
  const sig = state(parsedValue);

  effect(() => {
    // Use the current URLSearchParams to avoid overwriting other params
    const params = new URLSearchParams(window.location.search);
    params.set(key, JSON.stringify(sig()));
    window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
  });

  // Cleanup only on dismount
  effect(() => () => {
    const params = new URLSearchParams(window.location.search);
    params.delete(key);
    window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
  });

  return sig;
};

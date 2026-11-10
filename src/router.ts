import { nothing, type HTMLTemplateResult } from "lit-html";
import { Memo, memo, state, type ReadonlyState } from "./signals.ts";
import { html } from "./html.ts";
import { effect } from "./directives/effects.ts";
import { cache } from "lit-html/directives/cache.js";

/**
 * Router component for choosing a route based on an active path. Defaults to using the current browser path.
 *
 * Takes an object of keys representing the path to match, and values representing the component to render.
 *
 * Uses [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API)
 * to handle path matching. Passes the groups from the match to the component as an object
 * of readonly signals.
 *
 * Uses [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API)
 * to handle client-side navigation. Use anchor elements as normal and navigation.navigate()
 * for programmatic navigation.
 *
 * You can optionally pass a different signal, e.g. the wildcard segment `0`, to match against
 * as the first argument, passing the object of route definitions as the second argument.
 *
 * @example
 *
 * ```ts
 * Router({
 *   '/': Home,
 *   '/user/*?': (params) =>
 *     Router(params[0], {
 *       '': UsersList,
 *       ':id': ({ id }) => UserDetail(id),
 *       'me': MyProfile,
 *     }),
 *  '/about': About,
 *  '*': NotFound,
 * })
 * ```
 *
 * @param [path] The path to match against. Defaults to the current browser path.
 * @param routeMap An object of keys representing the path to match, and values representing the component to render.
 * @returns The component whose path matches the provided path called with the matched parameters.
 */
export function Router<T extends RouteMap<K>, K>(
  path: ReadonlyState<string | undefined>,
  routeMap: T,
): HTMLTemplateResult;
export function Router<T extends RouteMap<K>, K>(routeMap: T): HTMLTemplateResult;
export function Router<T extends RouteMap<K>, K>(
  pathOrRouteMap: T | ReadonlyState<string | undefined>,
  routeMap: T = pathOrRouteMap as T,
) {
  const path = typeof pathOrRouteMap === "function" ? pathOrRouteMap : setupRouting();
  const sortedRoutes = toSortedRoutes(Object.keys(routeMap));

  const activeRoute = memo(
    () =>
      sortedRoutes.find((p) => {
        const pattern = new URLPattern({ pathname: p });
        return pattern.test({ pathname: path() });
      }) as keyof typeof routeMap & string,
  );

  // We want a static object created per component render (i.e. it shouldn't
  // be recreated if the active route doesn't change), but the params
  // themselves should be reactive to changes in the compared path.
  const createParams = () => {
    const pattern = new URLPattern({ pathname: activeRoute(false) });
    const match = memo(() => pattern.exec({ pathname: path() }));
    const groups = match(false)?.pathname.groups ?? {};

    return Object.keys(groups).reduce<Record<string, Memo<string | undefined>>>((acc, key) => {
      acc[key] = memo(() => {
        return match()?.pathname.groups?.[key] ?? "";
      });
      return acc;
    }, {});
  };

  return html`${() => cache(routeMap[activeRoute()]?.(createParams()) ?? nothing)}`;
}

const currentPath = state(window.location.pathname);

const setupRouting = () => {
  currentPath.set(window.location.pathname);

  const handleNavigate = (e: NavigateEvent) => {
    if (!e.canIntercept || e.hashChange || e.downloadRequest) return;

    const url = new URL(e.destination.url);

    e.intercept({
      focusReset: "manual",
      async handler() {
        const transition = document.startViewTransition(() => currentPath.set(url.pathname));
        transition.ready.catch(() => {});
        transition.finished.catch(() => {});
      },
    });
  };

  effect(() => {
    navigation.addEventListener("navigate", handleNavigate);
    return () => {
      navigation.removeEventListener("navigate", handleNavigate);
    };
  });

  return currentPath;
};

const isStaticSegment = (segment: string) => !segment.startsWith(":") && !segment.startsWith("*");

const compareSegments = (a: string[], b: string[], index = 0) => {
  if (index === a.length) {
    return b.at(-1)!.length - a.at(-1)!.length;
  }
  const aSegmentStatic = isStaticSegment(a[index] ?? "");
  const bSegmentStatic = isStaticSegment(b[index] ?? "");

  if (aSegmentStatic === bSegmentStatic) {
    return compareSegments(a, b, index + 1);
  }
  return aSegmentStatic ? -1 : 1;
};

const toSortedRoutes = (routes: string[]) =>
  routes.toSorted((a, b) => {
    const aParts = a.split("/");
    const bParts = b.split("/");
    if (aParts.length !== bParts.length) {
      return bParts.length - aParts.length;
    }
    return compareSegments(aParts, bParts);
  });

type ParamIfRequired<T> = T extends `${string}?` ? never : T;
type ParamIfOptional<T> = T extends `${infer Param}?` ? Param : never;

// type for extracting params from path
type PathParams<T extends string | number | symbol> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? ParamIfRequired<Param> | PathParams<Rest>
    : T extends `${string}:${infer Param}`
      ? ParamIfRequired<Param>
      : never;

type OptionalPathParams<T extends string | number | symbol> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? ParamIfOptional<Param> | OptionalPathParams<Rest>
    : T extends `${string}:${infer Param}`
      ? ParamIfOptional<Param>
      : never;

// type for checking if path has a wildcard
type HasWildcard<T extends string | number | symbol> = T extends `${string}*${string}`
  ? true
  : false;

// type for checking if wildcard is optional (has ?)
type IsOptionalWildcard<T extends string | number | symbol> = T extends `${string}*?${string}`
  ? true
  : false;

type ParamMap<T extends string> = {
  [K in PathParams<T>]: ReadonlyState<string>;
} & {
  [K in OptionalPathParams<T>]: ReadonlyState<string | undefined>;
} & (HasWildcard<T> extends true
    ? IsOptionalWildcard<T> extends true
      ? { 0: ReadonlyState<string | undefined> }
      : { 0: ReadonlyState<string> }
    : {});

type RouteMap<T> = {
  [K in keyof T & string]: T[K] extends (props: ParamMap<K>) => HTMLTemplateResult
    ? (props: ParamMap<K>) => HTMLTemplateResult
    : never;
};

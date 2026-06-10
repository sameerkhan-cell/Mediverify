import { createFileRoute } from "@tanstack/react-router";

/**
 * Shim for `createAPIFileRoute` — delegates to the standard TanStack Router
 * `createFileRoute` so the generated route tree can call `.update()` on the
 * exported `Route`.  Any `GET / POST / …` handler config is stored in the
 * route options and picked up by TanStack Start's server-side handler
 * resolution at runtime.
 */
export const createAPIFileRoute = (path: string) => (config: any) => {
    const { GET, POST, PUT, DELETE, PATCH, ...rest } = config;
    const handlers = { GET, POST, PUT, DELETE, PATCH };

    return createFileRoute(path)({
        ...rest,
        server: {
            handlers
        }
    });
};

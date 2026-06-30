// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

if (typeof process !== "undefined" && typeof process.on === "function") {
  process.on("uncaughtException", (error) => record(error));
  process.on("unhandledRejection", (reason) => record(reason));
}

// Intercept console.error to capture errors swallowed by the framework's internal try-catches
const originalConsoleError = console.error;
console.error = function (...args) {
  for (const arg of args) {
    if (arg instanceof Error) {
      record(arg);
      break;
    } else if (arg && typeof arg === "object" && ("message" in arg || "stack" in arg)) {
      const err = new Error((arg as any).message || "Object error");
      err.stack = (arg as any).stack;
      record(err);
      break;
    } else if (typeof arg === "string" && (arg.includes("Error") || arg.includes("stack") || arg.includes("at "))) {
      record(new Error(arg));
      break;
    }
  }
  originalConsoleError.apply(console, args);
};

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}

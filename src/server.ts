import "./server/load-env";
import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => {
        console.log("Successfully imported server-entry");
        return ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry));
      }
    ).catch(err => {
      console.error("Failed to import server-entry:", err);
      throw err;
    });
  }
  return serverEntryPromise;
}

function brandedErrorResponse(error?: any): Response {
  const errorMessage = error?.message || String(error || "Unknown Error");
  const errorStack = error?.stack || "No stack trace available";
  const debugHtml = `
    ${renderErrorPage()}
    <!-- DEBUG INFO -->
    <div style="max-width: 60rem; margin: 2rem auto; padding: 2rem; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 0.75rem; font-family: monospace; color: #9f1239; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <h3 style="margin-top:0;font-size:1.1rem;">🛠️ Server entry crash details</h3>
      <p><strong>Message:</strong> ${errorMessage}</p>
      <pre style="white-space: pre-wrap; font-size: 0.85rem; background: #fff; padding: 1rem; border-radius: 0.375rem; border: 1px solid #ffe4e6; overflow-x: auto;">${errorStack}</pre>
    </div>
  `;
  return new Response(debugHtml, {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse(error);
    }
  },
};

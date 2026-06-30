import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error: any) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      const code = (error as any).statusCode;
      if (code !== 500) {
        throw error;
      }
    }
    console.error("SSR ERROR CAPTURED:", error);
    
    // Render error details to help with debugging
    const errorMessage = error?.message || String(error);
    const errorStack = error?.stack || "No stack trace available";
    const debugHtml = `
      ${renderErrorPage()}
      <!-- DEBUG INFO -->
      <div style="max-width: 60rem; margin: 2rem auto; padding: 2rem; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 0.75rem; font-family: monospace; color: #9f1239; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h3 style="margin-top:0;font-size:1.1rem;">🛠️ SSR Rendering Error Details</h3>
        <p><strong>Message:</strong> ${errorMessage}</p>
        <pre style="white-space: pre-wrap; font-size: 0.85rem; background: #fff; padding: 1rem; border-radius: 0.375rem; border: 1px solid #ffe4e6; overflow-x: auto;">${errorStack}</pre>
      </div>
    `;

    return new Response(debugHtml, {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));

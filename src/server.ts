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
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

/**
 * A dropped connection is not an application error. It happens when the client
 * navigates away or, in dev, when Vite re-optimizes dependencies and reloads
 * the page mid-request. We must not render the branded error page for these.
 */
export function isBenignAbort(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; name?: unknown; message?: unknown; cause?: unknown };
  if (candidate.code === "ECONNRESET" || candidate.code === "ECONNABORTED") return true;
  if (candidate.name === "AbortError") return true;
  if (typeof candidate.message === "string" && /\babort(ed)?\b/i.test(candidate.message)) {
    return true;
  }
  return candidate.cause ? isBenignAbort(candidate.cause) : false;
}

/** 499 Client Closed Request: a quiet response for a disconnected client. */
function quietAbortResponse(): Response {
  return new Response(null, { status: 499 });
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  const captured = consumeLastCapturedError();
  // Swallowed *and* caused by a client disconnect (e.g. a dev dep re-optimize
  // reload): stay quiet instead of showing a spurious "didn't load" page.
  if (isBenignAbort(captured)) return quietAbortResponse();

  console.error(captured ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      if (isBenignAbort(error)) return quietAbortResponse();
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

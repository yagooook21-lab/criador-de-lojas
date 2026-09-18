import type { Plugin } from "vite";
import { loadEnv } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import https from "https";
import { URL as NodeURL } from "url";

// Bypass Supabase RLS during dev/preview by letting the server run the INSERT
// with the service_role key. Keeps the secret off the browser bundle.
export function createOrderMiddleware(): Plugin {
  let url = "";
  let serviceKey = "";

  const postToSupabase = (payload: any): Promise<{ status: number; body: string }> => {
    return new Promise((resolve, reject) => {
      try {
        const target = new NodeURL(`${url}/rest/v1/orders?select=*`);
        const bodyStr = JSON.stringify(payload);
        const req = https.request(
          {
            hostname: target.hostname,
            port: target.port || 443,
            path: `${target.pathname}${target.search}`,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(bodyStr),
              "apikey": serviceKey,
              "Authorization": `Bearer ${serviceKey}`,
              "Prefer": "return=representation"
            }
          },
          (response) => {
            const chunks: Buffer[] = [];
            response.on("data", (c) => chunks.push(c));
            response.on("end", () => {
              resolve({ status: response.statusCode || 500, body: Buffer.concat(chunks).toString("utf8") });
            });
            response.on("error", reject);
          }
        );
        req.on("error", reject);
        req.write(bodyStr);
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  };

  const handle = async (req: IncomingMessage, res: ServerResponse) => {
    if (!url || !serviceKey) {
      console.error("[create-order-middleware] Missing env. VITE_SUPABASE_URL=", !!url, "SUPABASE_SERVICE_ROLE_KEY=", !!serviceKey);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Middleware not configured: missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }));
      return;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const body = Buffer.concat(chunks).toString("utf8");
    let payload: any = {};
    try { payload = body ? JSON.parse(body) : {}; } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }

    try {
      const upstream = await postToSupabase(payload);
      if (upstream.status >= 400) {
        console.error("[create-order-middleware] Supabase rejected insert:", upstream.status, upstream.body);
      } else {
        console.log("[create-order-middleware] order created:", payload.order_number);
      }
      res.statusCode = upstream.status;
      res.setHeader("Content-Type", "application/json");
      res.end(upstream.body);
    } catch (err: any) {
      console.error("[create-order-middleware] Upstream request failed:", err?.message, err?.code);
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err?.message || "Upstream failure", code: err?.code }));
    }
  };

  const attach = (middlewares: any) => {
    middlewares.use("/api/create-order", (req: IncomingMessage, res: ServerResponse, next: () => void) => {
      if (req.method !== "POST") return next();
      handle(req, res).catch((e) => {
        console.error("[create-order-middleware] Handler crash:", e);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Middleware crash", detail: String(e?.message || e) }));
      });
    });
  };

  return {
    name: "create-order-middleware",
    configResolved(resolved) {
      const env = loadEnv(resolved.mode, resolved.root, "");
      url = env.VITE_SUPABASE_URL || "";
      serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
      if (!url || !serviceKey) {
        console.warn("[create-order-middleware] env not fully loaded. VITE_SUPABASE_URL present:", !!url, "SUPABASE_SERVICE_ROLE_KEY present:", !!serviceKey);
      } else {
        console.log("[create-order-middleware] Ready. Target:", url);
      }
    },
    configureServer(server) {
      attach(server.middlewares);
    },
    configurePreviewServer(server) {
      attach(server.middlewares);
    }
  };
}

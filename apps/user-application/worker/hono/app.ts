import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/worker/trpc/router";
import { createContext } from "@/worker/trpc/context";
import { getAuth } from "@repo/data-ops/auth";

export const App = new Hono<{
  Bindings: ServiceBindings;
  Variables: { userId: string };
}>();

// Helper function to get auth instance
const getAuthInstance = (env: Env) => {
  return getAuth(
    {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    {
      stripeWebhookSecret: "",

      plans: [
        {
          name: "basic",
          priceId: "price_1RvS02H6EGTW00SMlvMrSm9g",
        },
        {
          name: "pro",
          priceId: "price_1RvS4TH6EGTW00SMZwjNB8s8",
        },
        {
          name: "enterprise",
          priceId: "price_1RvSCKH6EGTW00SMS6dLGxKp",
        },
      ],
    },
  );
};

// Auth middleware
const authMiddleware = createMiddleware(async (c, next) => {
  const auth = getAuthInstance(c.env);

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.text("Unauthorized", 401);
  }
  const userId = session.user.id;
  c.set("userId", userId);

  await next();
});

App.all("/trpc/*", authMiddleware, (c) => {
  const userId = c.get("userId");
  return fetchRequestHandler({
    endpoint: "/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () =>
      createContext({
        req: c.req.raw,
        env: c.env,
        workerCtx: c.executionCtx,
        userId,
      }),
  });
});

App.get("/click-socket", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const headers = new Headers(c.req.raw.headers);
  headers.set("account-id", userId);
  const proxiedRequest = new Request(c.req.raw, { headers });
  return c.env.BACKEND_SERVICE.fetch(proxiedRequest);
});

App.on(["POST", "GET"], "/api/auth/*", async (c) => {
  const auth = getAuthInstance(c.env);
  console.log("Auth event", c.req.url);
  return await auth.handler(c.req.raw);
});

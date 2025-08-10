import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db/database";
import { account, session, user, verification } from "./drizzle-out/schema";

let auth: ReturnType<typeof betterAuth>;

export function createBetterAuth(
  database: NonNullable<Parameters<typeof betterAuth>[0]>["database"],
) {
  return betterAuth({
    database,
    socialProviders: {
        google: {
            clientId: "",
            clientSecret: ""
        }
    }
  });
}

export function getAuth() {
  if (auth) return auth;

  auth = createBetterAuth(
    drizzleAdapter(getDb(), {
      provider: "sqlite",
      schema: {
        user,
        account,
        verification,
        session
      }
    }),
  );
  return auth;
}
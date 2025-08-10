import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { getDb } from "./db/database";

let auth: ReturnType<typeof betterAuth>;

export function createBetterAuth(
  database: NonNullable<Parameters<typeof betterAuth>[0]>["database"],
) {
  return betterAuth({
    database,
    plugins: [organization()],
  });
}

export function getAuth() {
  if (auth) return auth;

  auth = createBetterAuth(
    drizzleAdapter(getDb(), {
      provider: "sqlite",
    }),
  );
  return auth;
}

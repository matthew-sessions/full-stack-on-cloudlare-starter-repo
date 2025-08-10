import { createBetterAuth } from "@/auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";


export const auth = createBetterAuth(drizzleAdapter(
  {},
  {
    provider: "sqlite"
  }
))
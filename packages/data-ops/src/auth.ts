import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db/database";
import {
  account,
  session,
  subscription,
  user,
  verification,
} from "./drizzle-out/auth-schema";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";

type StripeConfig = {
  stripeWebhookSecret: string;
  plans: any[];
};

let auth: ReturnType<typeof betterAuth>;

const stripeClient = new Stripe(
  "sk_test_51RuhmbH6EGTW00SMnx5SGkUXfmJ3E0ooZFkyPoSDIFDOWA0sTCkt2X3OzCiXDOsTxLcKLZj6KYPXcLUqeRBOtqpe00d7QQnJqh",
  {
    apiVersion: "2025-07-30.basil",
  },
);

export function createBetterAuth(
  database: NonNullable<Parameters<typeof betterAuth>[0]>["database"],
  stripeConfig?: StripeConfig,
  google?: { clientId: string; clientSecret: string },
): ReturnType<typeof betterAuth> {
  return betterAuth({
    database,
    emailAndPassword: {
      enabled: false,
    },
    socialProviders: {
      google: {
        clientId: google?.clientId ?? "",
        clientSecret: google?.clientSecret ?? "",
      },
    },
    plugins: [
      // Cast to avoid versioned type incompatibilities between better-auth and the stripe plugin
      stripe({
        stripeClient,
        stripeWebhookSecret:
          stripeConfig?.stripeWebhookSecret ??
          process.env.STRIPE_WEBHOOK_SECRET!,
        createCustomerOnSignUp: true,

        subscription: {
          enabled: true,
          plans: stripeConfig?.plans ?? [],
        },
      }),
    ],
  });
}

export function getAuth(
  google: { clientId: string; clientSecret: string },
  stripe: StripeConfig,
): ReturnType<typeof betterAuth> {
  if (auth) return auth;

  auth = createBetterAuth(
    drizzleAdapter(getDb(), {
      provider: "sqlite",
      schema: {
        user,
        session,
        account,
        verification,
        subscription,
      },
    }),
    stripe,
    google,
  );
  return auth;
}

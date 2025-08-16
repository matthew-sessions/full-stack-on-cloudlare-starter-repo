
import { useState, useEffect } from "react";
import { authClient } from "@/components/auth/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import { CancelSubscriptionDialog } from "./cancel-subscription-dialog";

const plans = [
  {
    name: "Basic",
    price: 9,
    description: "Perfect for individuals getting started",
    features: [
      "Up to 100 links",
      "Basic analytics",
      "Email support",
      "Custom domains (1)",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: 25,
    description: "Great for growing businesses",
    features: [
      "Unlimited links",
      "Advanced analytics",
      "Priority support",
      "Custom domains (5)",
      "Team collaboration",
      "API access",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: 259,
    description: "For large organizations",
    features: [
      "Everything in Pro",
      "Dedicated support",
      "Custom integrations",
      "Unlimited domains",
      "Advanced security",
      "SSO integration",
    ],
    popular: false,
  },
];

interface Subscription {
  id: string;
  plan: string;
  status: string;
  referenceId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  periodStart?: Date;
  periodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  seats?: number;
  trialStart?: Date;
  trialEnd?: Date;
  limits?: Record<string, number>;
}

export function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const { data } = await authClient.subscription.list();
      console.log(data)
      setSubscriptions(data || []);
    } catch (error) {
      console.error("Failed to load subscriptions:", error);
    }
  };

  const handleUpgrade = async (plan: (typeof plans)[0]) => {
    setLoading(plan.name);

    try {
      const result = await authClient.subscription.upgrade({
        plan: plan.name.toLowerCase(),
        returnUrl: `${window.location.origin}/app/upgrade`,
        disableRedirect: false,
        subscriptionId: activeSubscription?.stripeSubscriptionId,
        successUrl: `${window.location.origin}/app/upgrade`,
        cancelUrl: `${window.location.origin}/app/upgrade`,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to start upgrade process");
      } else if (result.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.data.url;
      }
    } catch (error) {
      console.error("Upgrade failed:", error);
      toast.error("Failed to start upgrade process");
    } finally {
      setLoading(null);
    }
  };

  const activeSubscription = subscriptions.find(
    (sub) => sub.status === "active" || sub.status === "trialing",
  );

  return (
    <div className="flex w-full min-w-0">
      <main className="flex-1 min-w-0">
        <div className="container mx-auto p-6 space-y-8 max-w-6xl">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Choose Your Plan
            </h1>
            <p className="text-xl text-muted-foreground">
              Upgrade to unlock powerful features and grow your business
            </p>

            {activeSubscription && (
              <div className="flex justify-center gap-2">
                <Badge variant="outline" className="px-4 py-2">
                  Current plan: {activeSubscription.plan} (
                  {activeSubscription.status})
                </Badge>
                {activeSubscription.cancelAtPeriodEnd && (
                  <Badge variant="destructive" className="px-4 py-2">
                    Canceling at period end
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {plans.map((plan) => {
              const isCurrentPlan =
                activeSubscription?.plan === plan.name.toLowerCase();
              return (
                <Card
                  key={plan.name}
                  className={`relative flex-1 ${
                    isCurrentPlan
                      ? "border-green-500 shadow-lg ring-2 ring-green-200"
                      : plan.popular
                        ? "border-primary shadow-lg scale-105"
                        : ""
                  }`}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="px-4 py-1 bg-green-500">
                        <Check className="w-3 h-3 mr-1" />
                        Current Plan
                      </Badge>
                    </div>
                  )}
                  {plan.popular && !isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="px-4 py-1 bg-primary">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {plan.description}
                    </CardDescription>

                    <div className="py-4">
                      <div className="text-4xl font-bold">${plan.price}</div>
                      <div className="text-sm text-muted-foreground">
                        per month
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <Separator />

                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-4">
                      {isCurrentPlan ? (
                        <div className="space-y-2">
                          {activeSubscription?.cancelAtPeriodEnd && (
                            <div className="text-center">
                              <Badge variant="destructive" className="text-xs">
                                Canceling at period end
                              </Badge>
                            </div>
                          )}
                          <CancelSubscriptionDialog
                            subscription={activeSubscription}
                            onCanceled={loadSubscriptions}
                          >
                            <Button
                              className="w-full"
                              variant="outline"
                              disabled={loading !== null}
                            >
                              {activeSubscription?.cancelAtPeriodEnd
                                ? "Manage Subscription"
                                : "Current Plan"}
                            </Button>
                          </CancelSubscriptionDialog>
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          variant={plan.popular ? "default" : "outline"}
                          onClick={() => handleUpgrade(plan)}
                          disabled={loading !== null}
                        >
                          {loading === plan.name ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                              Processing...
                            </div>
                          ) : activeSubscription ? (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Change to {plan.name}
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Get {plan.name}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
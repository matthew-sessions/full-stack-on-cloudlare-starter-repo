import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/components/auth/client";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowUpRight } from "lucide-react";

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
  priceId?: string;
}

export function SubscriptionStatusSidebar() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data } = await authClient.subscription.list();
      const activeSubscription = data?.find(
        (sub: Subscription) =>
          sub.status === "active" || sub.status === "trialing",
      );
      setSubscription(activeSubscription || null);
    } catch (error) {
      console.error("Failed to load subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    navigate({ to: "/app/upgrade" });
  };

  if (loading) {
    return (
      <div className="mx-2 mb-2 p-3 rounded-lg border bg-card animate-pulse">
        <div className="h-3 bg-muted rounded w-16 mb-1"></div>
        <div className="h-2 bg-muted rounded w-12"></div>
      </div>
    );
  }

  return (
    <div className="mx-2 mb-2">
      {subscription ? (
        <div className="p-3 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-medium capitalize">
                {subscription.plan}
              </span>
            </div>
            {subscription.cancelAtPeriodEnd && (
              <span className="text-xs text-destructive font-medium">
                Ending
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-6 text-xs justify-start p-0 font-normal text-muted-foreground hover:text-foreground"
            onClick={handleUpgradeClick}
          >
            Manage subscription
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start p-3 h-auto rounded-lg border bg-card hover:bg-accent"
          onClick={handleUpgradeClick}
        >
          <div className="flex items-center gap-1.5 w-full">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">Upgrade to Pro</div>
              <div className="text-xs text-muted-foreground">
                Unlock premium features
              </div>
            </div>
            <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
          </div>
        </Button>
      )}
    </div>
  );
}

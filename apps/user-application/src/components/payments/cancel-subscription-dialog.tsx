import { useState } from "react";
import { authClient } from "@/components/auth/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, RotateCcw } from "lucide-react";
import { toast } from "sonner";

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

interface CancelSubscriptionDialogProps {
  subscription: Subscription;
  children: React.ReactNode;
  onCanceled?: () => void;
}

export function CancelSubscriptionDialog({
  subscription,
  children,
  onCanceled,
}: CancelSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);

    try {
      const result = await authClient.subscription.cancel({
        returnUrl: `${window.location.origin}/app/upgrade`,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to cancel subscription");
      } else {
        toast.success("Redirecting to billing portal to cancel subscription");
        setOpen(false);
        onCanceled?.();
      }
    } catch (error) {
      console.error("Cancel failed:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleResubscribe = async () => {
    setLoading(true);

    try {
      const result = await authClient.subscription.restore();

      if (result.error) {
        toast.error(result.error.message || "Failed to restore subscription");
      } else {
        toast.success("Subscription restored successfully!");
        setOpen(false);
        onCanceled?.();
      }
    } catch (error) {
      console.error("Restore failed:", error);
      toast.error("Failed to restore subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {subscription.cancelAtPeriodEnd
              ? "Restore Subscription"
              : "Cancel Subscription"}
          </DialogTitle>
          <DialogDescription>
            {subscription.cancelAtPeriodEnd
              ? `Your ${subscription.plan} subscription is set to cancel at the end of the billing period. Would you like to restore it?`
              : `Are you sure you want to cancel your ${subscription.plan} subscription?`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm">
              {subscription.cancelAtPeriodEnd ? (
                <>
                  <p className="font-medium">What happens when you restore:</p>
                  <ul className="mt-2 text-muted-foreground space-y-1">
                    <li>• Your subscription will continue automatically</li>
                    <li>• You'll be charged at the next billing cycle</li>
                    <li>• All premium features remain active</li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="font-medium">What happens when you cancel:</p>
                  <ul className="mt-2 text-muted-foreground space-y-1">
                    <li>
                      • You'll keep access until your current billing period
                      ends
                    </li>
                    <li>• Your subscription will not renew automatically</li>
                    <li>• You can reactivate anytime before the period ends</li>
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              {subscription.cancelAtPeriodEnd
                ? "Keep Canceled"
                : "Keep Subscription"}
            </Button>
            {subscription.cancelAtPeriodEnd ? (
              <Button
                variant="default"
                onClick={handleResubscribe}
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restore Subscription
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleCancel}
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  "Cancel Subscription"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

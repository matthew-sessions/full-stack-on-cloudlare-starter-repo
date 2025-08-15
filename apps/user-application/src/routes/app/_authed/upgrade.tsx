import { createFileRoute } from "@tanstack/react-router";
import { UpgradePage } from "@/components/payments/upgrade-page";

export const Route = createFileRoute("/app/_authed/upgrade")({
  component: RouteComponent,
});

function RouteComponent() {
  return <UpgradePage />;
}
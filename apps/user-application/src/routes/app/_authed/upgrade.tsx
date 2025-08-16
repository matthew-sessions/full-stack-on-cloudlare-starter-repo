import { UpgradePage } from '@/components/payments'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/_authed/upgrade')({
  component: RouteComponent,
})

function RouteComponent() {
  return <UpgradePage />
}

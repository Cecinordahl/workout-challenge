import { Heart, HeartHandshake, Ribbon, type LucideProps } from 'lucide-react'

// Campaign config names its icon as a string; only icons listed here are
// bundled, and anything else falls back to a heart.
const ICONS = { Heart, HeartHandshake, Ribbon }

export function CampaignIcon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Heart
  return <Icon aria-hidden="true" {...props} />
}

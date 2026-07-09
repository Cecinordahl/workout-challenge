import { Loader2 } from 'lucide-react'

export function FullScreenSpinner() {
  return (
    <div className="flex min-h-svh items-center justify-center" role="status">
      <Loader2
        className="text-muted-foreground size-6 animate-spin"
        aria-hidden="true"
      />
      <span className="sr-only">Loading</span>
    </div>
  )
}

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function App() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>WorkoutChallenge</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-sm">
            Scaffolding smoke test — Tailwind, shadcn/ui, and dark mode are
            wired up.
          </p>
          <Button>It works</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default App

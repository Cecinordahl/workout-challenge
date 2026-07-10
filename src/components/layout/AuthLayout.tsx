import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-semibold tracking-tight">
          WorkoutChallenge
        </h1>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          Turn a running goal into a personalized day-by-day plan that builds
          you up without burning you out.
        </p>
        <Outlet />
      </div>
    </div>
  )
}

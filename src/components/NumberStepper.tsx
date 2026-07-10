import { Minus, Plus } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface NumberStepperProps {
  id?: string
  value: number
  onChange: (value: number) => void
  step: number
  min?: number
  max?: number
}

function clamp(value: number, min?: number, max?: number): number {
  let result = value
  if (min !== undefined) result = Math.max(min, result)
  if (max !== undefined) result = Math.min(max, result)
  return result
}

export function NumberStepper({
  id,
  value,
  onChange,
  step,
  min,
  max,
}: NumberStepperProps) {
  function handleStepUp() {
    const next = Math.floor(value / step) * step + step
    onChange(clamp(Math.round(next * 100) / 100, min, max))
  }

  function handleStepDown() {
    const next = Math.ceil(value / step) * step - step
    onChange(clamp(Math.round(next * 100) / 100, min, max))
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const parsed = Number.parseFloat(event.target.value)
    if (!Number.isNaN(parsed)) onChange(clamp(parsed, min, max))
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={handleStepDown}
        aria-label="Decrease"
      >
        <Minus className="size-3" />
      </Button>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={handleInputChange}
        className="text-center"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={handleStepUp}
        aria-label="Increase"
      >
        <Plus className="size-3" />
      </Button>
    </div>
  )
}

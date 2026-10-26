import { ChevronDown, ExternalLink } from 'lucide-react'
import { useId, useState } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { CampaignStatistic } from '@/features/meaningful/domain/types'
import { CampaignFormatService } from '@/features/meaningful/services/CampaignFormatService'

interface StatisticOptionProps {
  statistic: CampaignStatistic
  selected: boolean
  disabled?: boolean
}

/** A selectable statistic (radio) with an expandable source-and-context panel. */
export function StatisticOption({
  statistic,
  selected,
  disabled,
}: StatisticOptionProps) {
  const [expanded, setExpanded] = useState(false)
  const inputId = useId()
  const detailsId = useId()
  const range = CampaignFormatService.statisticRange(statistic.value)
  const headline = CampaignFormatService.statisticHeadline(statistic)

  return (
    <div
      className={cn(
        'rounded-xl p-4 ring-1 transition-colors',
        selected ? 'ring-primary bg-muted/40 ring-2' : 'ring-foreground/10',
      )}
    >
      <div className="flex items-start gap-3">
        <RadioGroupItem
          value={statistic.id}
          id={inputId}
          disabled={disabled}
          className="mt-1"
        />
        <Label htmlFor={inputId} className="block flex-1 cursor-pointer">
          <span className="block">
            <span className="text-lg font-semibold tracking-tight">
              {headline.value}
            </span>
            {headline.unit && (
              <span className="text-muted-foreground ml-1.5 text-sm font-normal">
                {headline.unit}
              </span>
            )}
          </span>
          <span className="block text-sm leading-snug font-normal">
            {statistic.statement}
          </span>
          <span className="text-muted-foreground mt-1 block text-xs font-normal">
            {statistic.sourceOrg} · {statistic.period} · {statistic.geography}
          </span>
        </Label>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls={detailsId}
        className="text-muted-foreground hover:text-foreground mt-2 ml-7 inline-flex items-center gap-1 text-xs font-medium"
      >
        {expanded ? 'Hide context' : 'Context & source'}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-3 transition-transform',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {expanded && (
        <div id={detailsId} className="mt-3 ml-7 space-y-3 text-sm">
          <p>{statistic.context}</p>
          <dl className="text-muted-foreground grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt>Who</dt>
            <dd>{statistic.population}</dd>
            <dt>Where</dt>
            <dd>{statistic.geography}</dd>
            <dt>When</dt>
            <dd>{statistic.period}</dd>
            {range && (
              <>
                <dt>Estimate</dt>
                <dd>{range}</dd>
              </>
            )}
          </dl>
          <p className="text-muted-foreground text-xs">
            {statistic.goalMappingNote}
          </p>
          <a
            href={statistic.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4"
          >
            Source: {statistic.sourceOrg}
            <ExternalLink aria-hidden="true" className="size-3" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          {statistic.lastVerified && (
            <p className="text-muted-foreground text-xs">
              {CampaignFormatService.verifiedLabel(statistic.lastVerified)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

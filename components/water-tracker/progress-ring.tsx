'use client'

import { useId } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMl } from './format'

const SIZE = 240
const STROKE = 16
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type ProgressRingProps = {
  total: number
  goal: number
  isLoading: boolean
}

export function ProgressRing({ total, goal, isLoading }: ProgressRingProps) {
  const gradientId = useId()
  const ratio = Math.min(total / goal, 1)
  const percent = Math.round((total / goal) * 100)
  const isComplete = total >= goal
  const remaining = Math.max(goal - total, 0)

  return (
    <div
      role="progressbar"
      aria-label="Выпито воды за сегодня"
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={Math.min(total, goal)}
      aria-valuetext={`${formatMl(total)} из ${formatMl(goal)} мл`}
      aria-busy={isLoading}
      className="relative mx-auto size-60"
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="size-full -rotate-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop
              offset="0%"
              stopColor={isComplete ? 'var(--success)' : 'var(--water)'}
              stopOpacity="0.55"
            />
            <stop
              offset="100%"
              stopColor={isComplete ? 'var(--success)' : 'var(--water)'}
            />
          </linearGradient>
        </defs>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-muted"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          stroke={`url(#${gradientId})`}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
          className={cn(
            'transition-[stroke-dashoffset] duration-700 ease-out',
            isLoading && 'animate-pulse',
          )}
          style={{ opacity: ratio === 0 ? 0 : 1 }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {isComplete ? (
          <span className="mb-1 flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
            <Check className="size-3.5" aria-hidden="true" />
            Цель выполнена
          </span>
        ) : (
          <span className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Сегодня
          </span>
        )}
        <p className="flex items-baseline gap-1.5 tabular-nums" aria-live="polite">
          <span className="text-5xl font-extrabold tracking-tight">
            {formatMl(total)}
          </span>
          <span className="text-lg font-semibold text-muted-foreground">мл</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
          из {formatMl(goal)} мл · {percent}%
        </p>
        <p className="mt-2 flex h-5 items-center gap-1.5 text-xs font-medium text-water">
          {isLoading ? (
            <>
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
              Сохраняем...
            </>
          ) : isComplete ? null : (
            <>Осталось {formatMl(remaining)} мл</>
          )}
        </p>
      </div>
    </div>
  )
}

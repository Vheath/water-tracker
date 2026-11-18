'use client'

import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const QUICK_AMOUNTS = [250, 500, 750] as const

type QuickAddProps = {
  isLoading: boolean
  pendingAmount: number | null
  onAdd: (amount: number) => void
}

export function QuickAdd({ isLoading, pendingAmount, onAdd }: QuickAddProps) {
  return (
    <section aria-labelledby="quick-add-title" className="space-y-3">
      <h2
        id="quick-add-title"
        className="text-sm font-semibold text-muted-foreground"
      >
        Быстро добавить
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {QUICK_AMOUNTS.map((amount) => {
          const isPending = isLoading && pendingAmount === amount
          return (
            <Button
              key={amount}
              type="button"
              variant="outline"
              disabled={isLoading}
              aria-busy={isPending}
              aria-label={`Добавить ${amount} мл`}
              onClick={() => onAdd(amount)}
              className={cn(
                'h-16 flex-col gap-0 rounded-2xl border-border bg-card text-base transition-colors',
                'hover:border-water/50 hover:bg-water-soft hover:text-foreground',
                'disabled:opacity-40',
                isPending && 'border-water/60 bg-water-soft opacity-100',
              )}
            >
              {isPending ? (
                <LoaderCircle
                  className="size-5 animate-spin text-water"
                  aria-hidden="true"
                />
              ) : (
                <>
                  <span className="text-lg font-bold tabular-nums">
                    +{amount}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    мл
                  </span>
                </>
              )}
            </Button>
          )
        })}
      </div>
    </section>
  )
}

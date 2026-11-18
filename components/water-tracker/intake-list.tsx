'use client'

import { Droplet, LoaderCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMl, formatTime } from './format'

export type IntakeEntry = {
  id: string
  amount: number
  at: Date
}

type IntakeListProps = {
  entries: IntakeEntry[]
  isLoading: boolean
  pendingAmount: number | null
  pendingDeleteId: string | null
  onRemove: (id: string) => void
}

export function IntakeList({
  entries,
  isLoading,
  pendingAmount,
  pendingDeleteId,
  onRemove,
}: IntakeListProps) {
  const isEmpty = entries.length === 0 && pendingAmount === null

  return (
    <section aria-labelledby="history-title" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2
          id="history-title"
          className="text-sm font-semibold text-muted-foreground"
        >
          Выпито сегодня
        </h2>
        {entries.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            Записей: {entries.length}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-water-soft text-water">
            <Droplet className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium">Пока ничего не выпито</p>
          <p className="text-sm text-muted-foreground">
            Добавьте первый стакан воды выше
          </p>
        </div>
      ) : (
        <ul className="max-h-60 divide-y divide-border overflow-y-auto rounded-2xl border border-border bg-card">
          {pendingAmount !== null && (
            <li
              aria-busy="true"
              className="flex items-center gap-3 bg-water-soft px-4 py-3"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-card text-water">
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              </span>
              <span className="flex-1 text-sm font-semibold tabular-nums">
                +{formatMl(pendingAmount)} мл
              </span>
              <span className="text-xs text-muted-foreground">Сохраняем...</span>
            </li>
          )}
          {entries.map((entry) => {
            const isRemoving = pendingDeleteId === entry.id
            return (
              <li
                key={entry.id}
                className="flex items-center gap-3 px-4 py-3 data-[removing=true]:opacity-50"
                data-removing={isRemoving}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-water-soft text-water">
                  <Droplet className="size-4" aria-hidden="true" />
                </span>
                <span className="flex-1 text-sm font-semibold tabular-nums">
                  {formatMl(entry.amount)} мл
                </span>
                <time
                  dateTime={entry.at.toISOString()}
                  suppressHydrationWarning
                  className="text-sm text-muted-foreground tabular-nums"
                >
                  {formatTime(entry.at)}
                </time>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isLoading}
                  aria-label={`Удалить запись ${formatMl(entry.amount)} мл в ${formatTime(entry.at)}`}
                  onClick={() => onRemove(entry.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  {isRemoving ? (
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Trash2 className="size-4" aria-hidden="true" />
                  )}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

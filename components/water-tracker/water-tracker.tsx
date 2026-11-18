'use client'

import { useId, useRef, useState } from 'react'
import { Droplets, Settings } from 'lucide-react'
import type { IntakeRecord, WaterState } from '@/lib/water-state'
import { addWaterRequest, removeWaterRequest, saveGoalRequest } from './api'
import { CustomAddForm } from './custom-add-form'
import { ErrorBanner } from './error-banner'
import { formatMl } from './format'
import { GoalSettings } from './goal-settings'
import { IntakeList, type IntakeEntry } from './intake-list'
import { ProgressRing } from './progress-ring'
import { QuickAdd } from './quick-add'

type Pending =
  | { type: 'add'; source: 'quick' | 'custom'; amount: number }
  | { type: 'remove'; id: string }
  | { type: 'goal'; value: number }

const toEntry = (record: IntakeRecord): IntakeEntry => {
  const at = new Date(record.at)
  return {
    id: record.id,
    amount: record.amount,
    at: Number.isNaN(at.getTime()) ? new Date() : at,
  }
}

export function WaterTracker({ initialState }: { initialState: WaterState }) {
  const [entries, setEntries] = useState<IntakeEntry[]>(() =>
    initialState.entries.map(toEntry),
  )
  const [pending, setPending] = useState<Pending | null>(null)
  const [goal, setGoal] = useState(initialState.goal)
  const [error, setError] = useState<string | null>(
    initialState.loadError ?? null,
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsId = useId()
  const settingsButtonRef = useRef<HTMLButtonElement>(null)

  const closeSettings = () => {
    setSettingsOpen(false)
    settingsButtonRef.current?.focus()
  }

  const isLoading = pending !== null
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0)

  const runAction = async (action: Pending, task: () => Promise<void>) => {
    if (isLoading) return
    setError(null)
    setPending(action)
    try {
      await task()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить запрос.')
    } finally {
      setPending(null)
    }
  }

  const saveGoal = (value: number) =>
    runAction({ type: 'goal', value }, async () => {
      await saveGoalRequest(value)
      setGoal(value)
      closeSettings()
    })

  const addWater = (amount: number, source: 'quick' | 'custom') =>
    runAction({ type: 'add', source, amount }, async () => {
      const record = await addWaterRequest(amount, source)
      setEntries((prev) => [toEntry(record), ...prev])
    })

  const removeEntry = (id: string) =>
    runAction({ type: 'remove', id }, async () => {
      await removeWaterRequest(id)
      setEntries((prev) => prev.filter((entry) => entry.id !== id))
    })

  const pendingAdd = pending?.type === 'add' ? pending : null

  return (
    <div className="w-full max-w-md space-y-8 rounded-3xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur sm:p-8">
      <header className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-water-soft text-water">
          <Droplets className="size-5" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-tight">Трекер воды</h1>
          <p className="text-sm text-muted-foreground">
            Дневная норма: {formatMl(goal)} мл
          </p>
        </div>
        <button
          ref={settingsButtonRef}
          type="button"
          disabled={isLoading}
          aria-expanded={settingsOpen}
          aria-controls={settingsId}
          aria-label="Настройки дневной нормы"
          onClick={() => setSettingsOpen((open) => !open)}
          className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-4 focus-visible:ring-water/30 disabled:cursor-not-allowed disabled:opacity-40 aria-expanded:border-water aria-expanded:text-water"
        >
          <Settings className="size-5" aria-hidden="true" />
        </button>
      </header>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {settingsOpen && (
        <GoalSettings
          id={settingsId}
          goal={goal}
          isLoading={isLoading}
          isPending={pending?.type === 'goal'}
          onSave={saveGoal}
          onCancel={closeSettings}
        />
      )}

      <ProgressRing total={total} goal={goal} isLoading={isLoading} />

      <QuickAdd
        isLoading={isLoading}
        pendingAmount={pendingAdd?.source === 'quick' ? pendingAdd.amount : null}
        onAdd={(amount) => addWater(amount, 'quick')}
      />

      <CustomAddForm
        isLoading={isLoading}
        isPending={pendingAdd?.source === 'custom'}
        onAdd={(amount) => addWater(amount, 'custom')}
      />

      <IntakeList
        entries={entries}
        isLoading={isLoading}
        pendingAmount={pendingAdd?.amount ?? null}
        pendingDeleteId={pending?.type === 'remove' ? pending.id : null}
        onRemove={removeEntry}
      />
    </div>
  )
}

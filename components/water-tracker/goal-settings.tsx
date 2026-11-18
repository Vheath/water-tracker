'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatMl } from './format'

export const MIN_GOAL_ML = 500
export const MAX_GOAL_ML = 6000
const GOAL_PRESETS = [1500, 2000, 2500, 3000]

type GoalSettingsProps = {
  id: string
  goal: number
  isLoading: boolean
  isPending: boolean
  onSave: (goal: number) => Promise<void>
  onCancel: () => void
}

export function GoalSettings({
  id,
  goal,
  isLoading,
  isPending,
  onSave,
  onCancel,
}: GoalSettingsProps) {
  const inputId = useId()
  const hintId = useId()
  const errorId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(String(goal))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const validate = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return 'Введите дневную норму в миллилитрах'
    if (!/^\d+$/.test(trimmed)) return 'Используйте только цифры'
    const amount = Number(trimmed)
    if (amount < MIN_GOAL_ML) return `Минимум — ${formatMl(MIN_GOAL_ML)} мл`
    if (amount > MAX_GOAL_ML) return `Максимум — ${formatMl(MAX_GOAL_ML)} мл`
    return null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoading) return
    const validationError = validate(value)
    if (validationError) {
      setError(validationError)
      inputRef.current?.focus()
      return
    }
    setError(null)
    await onSave(Number(value.trim()))
  }

  const selectedPreset = GOAL_PRESETS.find((preset) => String(preset) === value.trim())

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !isLoading) onCancel()
      }}
      className="space-y-4 rounded-2xl border border-border bg-background/40 p-4"
    >
      <div className="space-y-1">
        <h2 id={`${id}-title`} className="text-sm font-semibold">
          Дневная норма воды
        </h2>
        <p className="text-sm text-muted-foreground">
          Выберите готовый вариант или задайте свою цель.
        </p>
      </div>

      <div
        role="group"
        aria-label="Готовые варианты нормы"
        className="grid grid-cols-4 gap-2"
      >
        {GOAL_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={isLoading}
            aria-pressed={selectedPreset === preset}
            onClick={() => {
              setValue(String(preset))
              setError(null)
            }}
            className={cn(
              'h-10 rounded-xl border text-sm font-semibold tabular-nums outline-none transition-colors',
              'focus-visible:ring-4 focus-visible:ring-water/30',
              'disabled:cursor-not-allowed disabled:opacity-40',
              selectedPreset === preset
                ? 'border-water bg-water-soft text-water'
                : 'border-border bg-card text-foreground hover:border-water/50',
            )}
          >
            {formatMl(preset)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <label htmlFor={inputId} className="sr-only">
          Своя дневная норма, мл
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Своя норма"
            value={value}
            disabled={isLoading}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : hintId}
            onChange={(event) => {
              setValue(event.target.value)
              if (error) setError(null)
            }}
            className={cn(
              'h-12 w-full rounded-2xl border border-input bg-card pl-4 pr-12 text-base font-medium tabular-nums outline-none transition-[border-color,box-shadow]',
              'placeholder:font-normal placeholder:text-muted-foreground',
              'focus-visible:border-water focus-visible:ring-4 focus-visible:ring-water/25',
              'disabled:cursor-not-allowed disabled:opacity-40',
              error &&
                'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25',
            )}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-muted-foreground"
          >
            мл
          </span>
        </div>
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <p id={hintId} className="text-sm text-muted-foreground">
            От {formatMl(MIN_GOAL_ML)} до {formatMl(MAX_GOAL_ML)} мл в день
          </p>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onCancel}
            className="h-11 flex-1 rounded-2xl text-base font-semibold focus-visible:ring-4 focus-visible:ring-water/30 disabled:opacity-40"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            aria-busy={isPending}
            className="h-11 flex-1 rounded-2xl bg-water text-base font-semibold text-background hover:bg-water/85 focus-visible:ring-4 focus-visible:ring-water/30 disabled:opacity-40"
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}
            Сохранить
          </Button>
        </div>
      </form>
    </section>
  )
}

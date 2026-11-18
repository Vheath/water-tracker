'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { LoaderCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MAX_CUSTOM_AMOUNT = 1500

type CustomAddFormProps = {
  isLoading: boolean
  isPending: boolean
  onAdd: (amount: number) => Promise<void>
}

export function CustomAddForm({
  isLoading,
  isPending,
  onAdd,
}: CustomAddFormProps) {
  const inputId = useId()
  const hintId = useId()
  const errorId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const shouldRefocus = useRef(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && shouldRefocus.current) {
      shouldRefocus.current = false
      inputRef.current?.focus()
    }
  }, [isLoading])

  const validate = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return 'Введите объем в миллилитрах'
    if (!/^\d+$/.test(trimmed)) return 'Используйте только цифры'
    const amount = Number(trimmed)
    if (amount < 1) return 'Объем должен быть больше нуля'
    if (amount > MAX_CUSTOM_AMOUNT) {
      return `За раз можно добавить не более ${MAX_CUSTOM_AMOUNT} мл`
    }
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
    shouldRefocus.current = true
    await onAdd(Number(value.trim()))
    setValue('')
  }

  return (
    <section aria-labelledby="custom-add-title" className="space-y-3">
      <h2
        id="custom-add-title"
        className="text-sm font-semibold text-muted-foreground"
      >
        Другой объем
      </h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-2">
        <label htmlFor={inputId} className="sr-only">
          Свой объем, мл
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Свой объем"
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
          <Button
            type="submit"
            disabled={isLoading}
            aria-busy={isPending}
            className="h-12 rounded-2xl bg-water px-5 text-base font-semibold text-background hover:bg-water/85 focus-visible:ring-4 focus-visible:ring-water/30 disabled:opacity-40"
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
            Добавить
          </Button>
        </div>
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <p id={hintId} className="text-sm text-muted-foreground">
            От 1 до {MAX_CUSTOM_AMOUNT} мл за один раз
          </p>
        )}
      </form>
    </section>
  )
}

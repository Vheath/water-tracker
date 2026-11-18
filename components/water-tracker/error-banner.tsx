import { CircleAlert, X } from 'lucide-react'

type ErrorBannerProps = {
  message: string
  onDismiss: () => void
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="flex-1 leading-snug">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Закрыть сообщение об ошибке"
        className="rounded-md p-0.5 outline-none transition-colors hover:text-foreground focus-visible:ring-4 focus-visible:ring-destructive/30"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

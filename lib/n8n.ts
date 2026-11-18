import { NextResponse } from 'next/server'

const BASE_URL = (
  process.env.N8N_WEBHOOK_BASE_URL ?? 'https://n8n-itmo.cyrweb.ru/webhook'
).replace(/\/$/, '')

const REQUEST_TIMEOUT_MS = 10_000

export const N8N_HOOKS = {
  addWater: 'add-water',
  removeWater: 'remove-water',
  setGoal: 'set-goal',
  getState: 'get-state',
} as const

type N8nHook = (typeof N8N_HOOKS)[keyof typeof N8N_HOOKS]

export class N8nError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'N8nError'
  }
}

export function callN8n<T extends object = Record<string, never>>(
  hook: N8nHook,
  payload: Record<string, unknown>,
): Promise<T> {
  return requestN8n<T>(hook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function readN8n<T extends object = Record<string, never>>(
  hook: N8nHook,
): Promise<T> {
  return requestN8n<T>(hook, { method: 'GET' })
}

async function requestN8n<T extends object>(
  hook: N8nHook,
  init: RequestInit,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/${hook}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    throw new N8nError('n8n не отвечает. Проверьте адрес и доступность сервера.')
  }

  if (response.status === 404) {
    throw new N8nError(
      'Webhook n8n не найден. Убедитесь, что воркфлоу активирован (Active), а путь вебхука совпадает.',
    )
  }
  if (!response.ok) {
    throw new N8nError(`n8n вернул ошибку (${response.status}).`)
  }

  const text = await response.text()
  try {
    const parsed: unknown = JSON.parse(text)
    // n8n may answer with an array of items; the first one carries the data.
    const data = Array.isArray(parsed) ? parsed[0] : parsed
    return (data && typeof data === 'object' ? data : {}) as T
  } catch {
    return {} as T
  }
}

export function errorResponse(error: unknown) {
  const message =
    error instanceof N8nError ? error.message : 'Не удалось выполнить запрос.'
  return NextResponse.json({ error: message }, { status: 502 })
}

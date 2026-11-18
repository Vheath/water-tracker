import type { IntakeRecord } from '@/lib/water-state'

async function request<T>(url: string, init: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    throw new Error('Нет соединения с сервером.')
  }

  const data = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null

  if (!response.ok || !data) {
    throw new Error(data?.error ?? 'Не удалось выполнить запрос.')
  }
  return data
}

export const addWaterRequest = (amount: number, source: 'quick' | 'custom') =>
  request<IntakeRecord>('/api/water', {
    method: 'POST',
    body: JSON.stringify({ amount, source }),
  })

export const removeWaterRequest = (id: string) =>
  request<{ ok: true }>(`/api/water/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })

export const saveGoalRequest = (goal: number) =>
  request<{ goal: number }>('/api/goal', {
    method: 'PUT',
    body: JSON.stringify({ goal }),
  })

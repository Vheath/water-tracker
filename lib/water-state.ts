import { N8N_HOOKS, N8nError, readN8n } from '@/lib/n8n'

export const DEFAULT_GOAL_ML = 2000

const TIME_ZONE = process.env.N8N_TIMEZONE ?? 'Europe/Moscow'

export type IntakeRecord = {
  id: string
  amount: number
  at: string
}

export type WaterState = {
  goal: number
  entries: IntakeRecord[]
  loadError?: string
}

type RawEntry = {
  id?: string | number
  amount?: number | string
  at?: string
  createdAt?: string
}

type RawState = {
  goal?: number | string | null
  entries?: Array<RawEntry | { json?: RawEntry }>
}

const dayKey = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date)

// n8n returns raw items ({ json: {...}, pairedItem }) when the workflow does not
// reshape them, so accept both wrapped and plain entries.
function toRecord(raw: RawEntry | { json?: RawEntry }): IntakeRecord | null {
  const item: RawEntry = 'json' in raw && raw.json ? raw.json : (raw as RawEntry)
  const amount = Number(item.amount)
  const at = new Date(item.at ?? item.createdAt ?? '')
  if (!Number.isFinite(amount) || amount <= 0 || Number.isNaN(at.getTime())) {
    return null
  }
  return { id: String(item.id ?? at.getTime()), amount, at: at.toISOString() }
}

export async function loadWaterState(): Promise<WaterState> {
  try {
    const raw = await readN8n<RawState>(N8N_HOOKS.getState)

    const goal = Number(raw.goal)
    const today = dayKey(new Date())

    const entries = (raw.entries ?? [])
      .map(toRecord)
      .filter((entry): entry is IntakeRecord => entry !== null)
      .filter((entry) => dayKey(new Date(entry.at)) === today)
      .sort((a, b) => b.at.localeCompare(a.at))

    return {
      goal: Number.isFinite(goal) && goal > 0 ? goal : DEFAULT_GOAL_ML,
      entries,
    }
  } catch (error) {
    return {
      goal: DEFAULT_GOAL_ML,
      entries: [],
      loadError:
        error instanceof N8nError
          ? error.message
          : 'Не удалось загрузить данные из n8n.',
    }
  }
}

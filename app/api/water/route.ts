import { NextResponse } from 'next/server'
import { N8N_HOOKS, callN8n, errorResponse } from '@/lib/n8n'

const MAX_AMOUNT_ML = 1500

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    amount?: unknown
    source?: unknown
  } | null

  const amount = body?.amount
  if (
    typeof amount !== 'number' ||
    !Number.isInteger(amount) ||
    amount < 1 ||
    amount > MAX_AMOUNT_ML
  ) {
    return NextResponse.json(
      { error: `Объем должен быть от 1 до ${MAX_AMOUNT_ML} мл.` },
      { status: 400 },
    )
  }

  const source = body?.source === 'custom' ? 'custom' : 'quick'
  const at = new Date().toISOString()

  try {
    const result = await callN8n<{ id?: string | number; at?: string }>(
      N8N_HOOKS.addWater,
      { amount, source, at },
    )
    // n8n may return a non-ISO date string (e.g. "Wed Nov 18 2026 17:43:13 GMT+0300").
    const parsedAt = result.at ? new Date(result.at) : null
    return NextResponse.json({
      id: result.id !== undefined ? String(result.id) : crypto.randomUUID(),
      amount,
      at: parsedAt && !Number.isNaN(parsedAt.getTime()) ? parsedAt.toISOString() : at,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

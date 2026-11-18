import { NextResponse } from 'next/server'
import { N8N_HOOKS, callN8n, errorResponse } from '@/lib/n8n'

const MIN_GOAL_ML = 500
const MAX_GOAL_ML = 6000

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    goal?: unknown
  } | null

  const goal = body?.goal
  if (
    typeof goal !== 'number' ||
    !Number.isInteger(goal) ||
    goal < MIN_GOAL_ML ||
    goal > MAX_GOAL_ML
  ) {
    return NextResponse.json(
      { error: `Норма должна быть от ${MIN_GOAL_ML} до ${MAX_GOAL_ML} мл.` },
      { status: 400 },
    )
  }

  try {
    await callN8n(N8N_HOOKS.setGoal, { goal })
    return NextResponse.json({ goal })
  } catch (error) {
    return errorResponse(error)
  }
}

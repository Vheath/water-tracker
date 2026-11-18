import { NextResponse } from 'next/server'
import { N8N_HOOKS, callN8n, errorResponse } from '@/lib/n8n'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    await callN8n(N8N_HOOKS.removeWater, { id })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}

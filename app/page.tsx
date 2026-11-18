import { WaterTracker } from '@/components/water-tracker/water-tracker'
import { loadWaterState } from '@/lib/water-state'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const initialState = await loadWaterState()

  return (
    <main className="flex min-h-dvh items-start justify-center bg-[radial-gradient(60rem_30rem_at_50%_-10%,var(--water-soft),transparent)] px-4 py-8 sm:items-center sm:py-12">
      <WaterTracker initialState={initialState} />
    </main>
  )
}

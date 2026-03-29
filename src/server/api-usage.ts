import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { apiUsageLogs } from '../db/schema'
import { desc, sql } from 'drizzle-orm'

// Gemini 3.1 Pro pricing (per million tokens)
// Prompt < 200K tokens: $2/1M input, $12/1M output
// Prompt > 200K tokens: $4/1M input, $18/1M output
function calculateGeminiCostCents(inputTokens: number, outputTokens: number): number {
  const inputRate = inputTokens > 200_000 ? 4 : 2
  const outputRate = inputTokens > 200_000 ? 18 : 12
  const inputCost = (inputTokens / 1_000_000) * inputRate * 100
  const outputCost = (outputTokens / 1_000_000) * outputRate * 100
  return Math.round(inputCost + outputCost)
}

export async function logApiUsage(params: {
  service: string
  endpoint: string
  model?: string
  inputTokens?: number
  outputTokens?: number
  durationMs?: number
  listingId?: string
}) {
  const inputTokens = params.inputTokens ?? 0
  const outputTokens = params.outputTokens ?? 0
  const totalTokens = inputTokens + outputTokens

  let costCents = 0
  if (params.service === 'gemini') {
    costCents = calculateGeminiCostCents(inputTokens, outputTokens)
  }

  await db.insert(apiUsageLogs).values({
    service: params.service,
    endpoint: params.endpoint,
    model: params.model ?? null,
    inputTokens,
    outputTokens,
    totalTokens,
    costCents,
    durationMs: params.durationMs ?? 0,
    listingId: params.listingId,
  })
}

export const getApiUsageStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    // Summary stats
    const [summary] = await db
      .select({
        totalCalls: sql<number>`count(*)::int`,
        totalInputTokens: sql<number>`coalesce(sum(${apiUsageLogs.inputTokens}), 0)::int`,
        totalOutputTokens: sql<number>`coalesce(sum(${apiUsageLogs.outputTokens}), 0)::int`,
        totalTokens: sql<number>`coalesce(sum(${apiUsageLogs.totalTokens}), 0)::int`,
        totalCostCents: sql<number>`coalesce(sum(${apiUsageLogs.costCents}), 0)::int`,
        avgDurationMs: sql<number>`coalesce(avg(${apiUsageLogs.durationMs}), 0)::int`,
      })
      .from(apiUsageLogs)

    // Per-service breakdown
    const byService = await db
      .select({
        service: apiUsageLogs.service,
        calls: sql<number>`count(*)::int`,
        inputTokens: sql<number>`coalesce(sum(${apiUsageLogs.inputTokens}), 0)::int`,
        outputTokens: sql<number>`coalesce(sum(${apiUsageLogs.outputTokens}), 0)::int`,
        totalTokens: sql<number>`coalesce(sum(${apiUsageLogs.totalTokens}), 0)::int`,
        costCents: sql<number>`coalesce(sum(${apiUsageLogs.costCents}), 0)::int`,
        avgDurationMs: sql<number>`coalesce(avg(${apiUsageLogs.durationMs}), 0)::int`,
      })
      .from(apiUsageLogs)
      .groupBy(apiUsageLogs.service)

    // Recent calls
    const recentCalls = await db
      .select()
      .from(apiUsageLogs)
      .orderBy(desc(apiUsageLogs.createdAt))
      .limit(50)

    return {
      summary: summary!,
      byService,
      recentCalls,
    }
  },
)

import { createFileRoute } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getApiUsageStats } from '@/server/api-usage'
import { Activity, Zap, DollarSign, Clock } from 'lucide-react'

export const Route = createFileRoute('/debug')({
  loader: () => getApiUsageStats(),
  component: DebugPage,
})

function DebugPage() {
  const { summary, byService, recentCalls } = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Usage</h1>
        <p className="text-sm text-muted-foreground">
          Debug statistics for API calls and token usage
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCalls}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalTokens.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.totalInputTokens.toLocaleString()} in / {summary.totalOutputTokens.toLocaleString()} out
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(summary.totalCostCents / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.avgDurationMs > 0
                ? `${(summary.avgDurationMs / 1000).toFixed(1)}s`
                : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-service breakdown */}
      {byService.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>By Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Service</th>
                    <th className="pb-2 font-medium text-right">Calls</th>
                    <th className="pb-2 font-medium text-right">Input Tokens</th>
                    <th className="pb-2 font-medium text-right">Output Tokens</th>
                    <th className="pb-2 font-medium text-right">Cost</th>
                    <th className="pb-2 font-medium text-right">Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {byService.map((row) => (
                    <tr key={row.service} className="border-b last:border-0">
                      <td className="py-2">
                        <Badge variant="outline">{row.service}</Badge>
                      </td>
                      <td className="py-2 text-right">{row.calls}</td>
                      <td className="py-2 text-right">{row.inputTokens.toLocaleString()}</td>
                      <td className="py-2 text-right">{row.outputTokens.toLocaleString()}</td>
                      <td className="py-2 text-right">${(row.costCents / 100).toFixed(2)}</td>
                      <td className="py-2 text-right">{(row.avgDurationMs / 1000).toFixed(1)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent calls log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Calls</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCalls.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No API calls recorded yet. Run an AI analysis to see data here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Service</th>
                    <th className="pb-2 font-medium">Model</th>
                    <th className="pb-2 font-medium">Endpoint</th>
                    <th className="pb-2 font-medium">Listing</th>
                    <th className="pb-2 font-medium text-right">Tokens</th>
                    <th className="pb-2 font-medium text-right">Cost</th>
                    <th className="pb-2 font-medium text-right">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCalls.map((call) => (
                    <tr key={call.id} className="border-b last:border-0">
                      <td className="py-2 text-xs text-muted-foreground">
                        {new Date(call.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2">
                        <Badge variant="outline" className="text-xs">
                          {call.service}
                        </Badge>
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {call.model ?? '—'}
                      </td>
                      <td className="py-2">{call.endpoint}</td>
                      <td className="py-2 text-xs text-muted-foreground font-mono">
                        {call.listingId ? call.listingId.slice(0, 8) : '—'}
                      </td>
                      <td className="py-2 text-right">
                        {call.totalTokens.toLocaleString()}
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({call.inputTokens.toLocaleString()}/{call.outputTokens.toLocaleString()})
                        </span>
                      </td>
                      <td className="py-2 text-right">${(call.costCents / 100).toFixed(4)}</td>
                      <td className="py-2 text-right">{(call.durationMs / 1000).toFixed(1)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

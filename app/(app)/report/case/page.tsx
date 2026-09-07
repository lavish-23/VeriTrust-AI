'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScoreGauge } from '@/components/app/score-gauge'
import { MediaIcon } from '@/components/app/media-bits'
import { PageHeader } from '@/components/app/page-header'
import { cn, formatLocalDateTime } from '@/lib/utils'

type Verdict = 'authentic' | 'suspicious' | 'deepfake'

const verdictMap: Record<Verdict, { text: string; color: string; badge: string }> = {
  authentic: { text: 'Likely Genuine', color: 'text-success', badge: 'bg-success/10 text-success border-success/30' },
  suspicious: { text: 'Suspicious Content', color: 'text-warning', badge: 'bg-warning/10 text-warning border-warning/30' },
  deepfake: { text: 'Likely Deepfake', color: 'text-destructive', badge: 'bg-destructive/10 text-destructive border-destructive/30' },
}

interface CaseScan {
  scanId: string
  fileName: string
  fileType: string
  score: number
  verdict: Verdict
  createdAt: string
}

interface TimestampEntry {
  fileName: string
  scanId: string
  timestamp: string
}

interface CaseData {
  caseId: string
  createdAt: string
  scans: CaseScan[]
  unifiedScore: number
  caseVerdict: Verdict
  consistency: string
  divergence: number
  timestampComparison: { entries: TimestampEntry[]; spanHours: number } | null
}

function CaseReportContent() {
  const params = useSearchParams()
  const router = useRouter()
  const caseId = params.get('caseId')

  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!caseId) {
      setError('Missing case ID')
      setLoading(false)
      return
    }

    async function loadCase() {
      try {
        const res = await fetch(`/api/cases/${encodeURIComponent(caseId as string)}`, {
          credentials: 'include',
          cache: 'no-store',
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          setError(data.message || 'Case not found')
          return
        }
        setCaseData(data.case)
      } catch (err) {
        console.error(err)
        setError('Error fetching case')
      } finally {
        setLoading(false)
      }
    }

    loadCase()
  }, [caseId])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Case Unavailable</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{error}</p>
        <Button className="mt-5" onClick={() => router.push('/scan/upload')}>
          Run New Verification
        </Button>
      </div>
    )
  }

  const verdictInfo = verdictMap[caseData.caseVerdict]
  const isConsistent = caseData.consistency === 'Consistent'

  return (
    <div className="space-y-6">
      <div className="border-b border-border/50 pb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/history')} className="mb-3">
          <ArrowLeft className="mr-1.5 size-4" />
          Back to History
        </Button>
        <PageHeader
          title="Cross-Modal Case Report"
          description={`Correlated authenticity analysis across ${caseData.scans.length} related files.`}
        />
      </div>

      <main className="mx-auto max-w-4xl space-y-6">
        {/* File cards */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Layers className="size-4 text-primary" />
            Files in This Case
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {caseData.scans.map((s) => {
              const info = verdictMap[s.verdict] || verdictMap.authentic
              return (
                <div
                  key={s.scanId}
                  className="glass flex items-center justify-between gap-3 rounded-2xl border border-border/60 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary/80">
                      <MediaIcon type={s.fileType} className="size-4.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{s.fileName}</p>
                      <p className="font-mono text-xs text-muted-foreground">{s.scanId}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', info.badge)}>
                      {s.score}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-primary"
                      onClick={() => router.push(`/report?scanId=${s.scanId}`)}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Cross-Modal Correlation */}
        <section className="glass rounded-3xl border border-border/60 p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold">Cross-Modal Correlation</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={cn('rounded-xl p-4', isConsistent ? 'bg-success/10' : 'bg-warning/10')}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Signal Consistency</p>
              <p className={cn('mt-1.5 flex items-center gap-2 text-sm font-semibold', isConsistent ? 'text-success' : 'text-warning')}>
                {isConsistent ? <ShieldCheck className="size-4" /> : <ShieldAlert className="size-4" />}
                {caseData.consistency}
              </p>
            </div>
            <div className="rounded-xl bg-secondary/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Score Divergence</p>
              <p className="mt-1.5 text-sm font-semibold text-foreground">
                {caseData.divergence === 0 ? 'None (single file or identical scores)' : `${caseData.divergence} points across case files`}
              </p>
            </div>
          </div>

          {caseData.timestampComparison && (
            <div className="mt-5 border-t border-border/40 pt-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Clock className="size-3.5" />
                Declared Timestamps (from file metadata)
              </p>
              <div className="space-y-1.5">
                {caseData.timestampComparison.entries.map((e) => (
                  <div key={e.scanId} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-xs">
                    <span className="truncate font-medium text-foreground">{e.fileName}</span>
                    <span className="font-mono text-muted-foreground">{formatLocalDateTime(e.timestamp)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Timestamps span {caseData.timestampComparison.spanHours} hours across these files — informational only, not scored.
              </p>
            </div>
          )}
        </section>

        {/* Unified case score */}
        <section className="glass rounded-3xl border border-border/60 p-8 text-center shadow-xl">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Unified Case Score</p>
          <div className="mt-4 flex justify-center">
            <ScoreGauge score={caseData.unifiedScore} size={180} />
          </div>
          <h2 className={cn('mt-3 text-xl font-semibold', verdictInfo.color)}>{verdictInfo.text}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Combines {caseData.scans.length} file score{caseData.scans.length === 1 ? '' : 's'}
            {caseData.divergence > 0 ? `, adjusted for ${caseData.divergence}-point divergence across the case` : ''}.
          </p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => router.push('/scan/upload')} className="flex-1">
            Scan Another File
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="outline" onClick={() => router.push('/history')} className="flex-1">
            View Scan History
          </Button>
        </div>
      </main>
    </div>
  )
}

export default function CaseReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <CaseReportContent />
    </Suspense>
  )
}

'use client'

import { useEffect, useRef, useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Download,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Eye,
  ArrowLeft,
  Calendar,
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  Check,
  Clock,
  Microscope,
  BarChart3,
  Hash,
  Copy,
  Sparkles,
  Gauge,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ScoreGauge } from '@/components/app/score-gauge'
import { MediaIcon } from '@/components/app/media-bits'
import { PageHeader } from '@/components/app/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { mediaLabels } from '@/lib/mock-data'
import { cn, formatLocalDateTime } from '@/lib/utils'

type Verdict = 'authentic' | 'suspicious' | 'deepfake'
type RiskLevel = 'Low' | 'Medium' | 'High'

interface AnalysisCard {
  key: string
  label: string
  detail: string
  ok: boolean
}

interface EvidenceStats {
  examined: number
  anomalies: number
  passed: number
  total: number
}

interface RiskRow {
  category: string
  risk: RiskLevel
  status: string
}

interface Scan {
  scanId: string
  fileName: string
  fileType: string
  mimeType?: string
  fileSize?: number
  status: string
  score?: number
  verdict?: Verdict
  threat?: string
  action?: string
  analysisCards: AnalysisCard[]
  visualArtifacts?: {
    ela_map?: string
    fft_spectrum?: string
  }
  analysisDurationMs?: number
  evidence?: EvidenceStats
  breakdown?: Record<string, number>
  explanation?: string[]
  riskAssessment?: RiskRow[]
  overallRisk?: RiskLevel
  fileMeta?: Record<string, any>
  sha256?: string
  filePreview?: string | null
  audioWaveform?: number[] | null
  createdAt: string
}

const verdictMap: Record<Verdict, { text: string; color: string; badge: string }> = {
  authentic: {
    text: 'Likely Genuine',
    color: 'text-success',
    badge: 'bg-success/10 text-success border-success/30',
  },
  suspicious: {
    text: 'Suspicious Content',
    color: 'text-warning',
    badge: 'bg-warning/10 text-warning border-warning/30',
  },
  deepfake: {
    text: 'Likely Deepfake',
    color: 'text-destructive',
    badge: 'bg-destructive/10 text-destructive border-destructive/30',
  },
}

const riskColor: Record<RiskLevel, string> = {
  Low: 'text-success',
  Medium: 'text-warning',
  High: 'text-destructive',
}

const riskBadge: Record<RiskLevel, string> = {
  Low: 'bg-success/10 text-success border-success/30',
  Medium: 'bg-warning/10 text-warning border-warning/30',
  High: 'bg-destructive/10 text-destructive border-destructive/30',
}

const verdictOptions = [
  { value: 'all', label: 'All Verdicts', color: 'bg-muted-foreground' },
  { value: 'authentic', label: 'Authentic Only', color: 'bg-emerald-500' },
  { value: 'suspicious', label: 'Suspicious Only', color: 'bg-amber-500' },
  { value: 'deepfake', label: 'Deepfakes Only', color: 'bg-rose-500' },
]

const analysisTypeLabels: Record<string, string> = {
  document: 'Document Forensics',
  image: 'Image Forensics',
  video: 'Video Forensics',
  audio: 'Audio Forensics',
}

function integrityLabelFromPercent(pct: number): string {
  if (pct >= 85) return 'Verified'
  if (pct >= 60) return 'Mostly Verified'
  return 'Flagged'
}

function findBreakdownValue(breakdown: Record<string, number> | undefined, keywords: string[]): number | null {
  if (!breakdown) return null
  for (const [key, val] of Object.entries(breakdown)) {
    if (keywords.some((kw) => key.toLowerCase().includes(kw))) return val
  }
  return null
}

function getKeyMetrics(scan: Scan) {
  const aiRow = scan.riskAssessment?.find((r) => r.category.toLowerCase().includes('ai generation'))
  const manipulationRisk: RiskLevel = scan.overallRisk || 'Medium'
  const aiGenRisk: RiskLevel = aiRow
    ? aiRow.risk
    : scan.verdict === 'authentic'
      ? 'Low'
      : scan.verdict === 'suspicious'
        ? 'Medium'
        : 'High'

  const metadataPct = findBreakdownValue(scan.breakdown, ['metadata', 'sensor', 'exif', 'spectral'])
  const structuralPct = findBreakdownValue(scan.breakdown, ['structural', 'container', 'splicing', 'compression'])

  return [
    { label: 'Manipulation Risk', value: manipulationRisk, tone: riskColor[manipulationRisk] },
    { label: 'AI Generation Risk', value: aiGenRisk, tone: riskColor[aiGenRisk] },
    {
      label: 'Metadata Integrity',
      value: metadataPct !== null ? integrityLabelFromPercent(metadataPct) : '—',
      tone: metadataPct !== null && metadataPct < 60 ? 'text-destructive' : 'text-success',
    },
    {
      label: 'Structural Integrity',
      value: structuralPct !== null ? integrityLabelFromPercent(structuralPct) : '—',
      tone: structuralPct !== null && structuralPct < 60 ? 'text-destructive' : 'text-success',
    },
  ]
}

function formatDuration(ms?: number): string {
  if (!ms || ms <= 0) return '—'
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function ReportContent() {
  const params = useSearchParams()
  const router = useRouter()
  const selectedId = params.get('scanId') || params.get('id')
  const shouldAutoDownload = params.get('download') === '1'
  const autoDownloadTriggered = useRef(false)

  const [scans, setScans] = useState<any[]>([])
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [verdictFilter, setVerdictFilter] = useState<string>('all')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        if (selectedId) {
          const response = await fetch(`/api/scans/${encodeURIComponent(selectedId)}`, {
            credentials: 'include',
            cache: 'no-store',
          })
          const data = await response.json()

          if (!response.ok || !data.success || !data.scan) {
            setError(data?.message || 'Scan not found or still processing')
            setSelectedScan(null)
          } else {
            setSelectedScan(data.scan)
          }
        } else {
          setSelectedScan(null)
          const response = await fetch('/api/scans/history', {
            credentials: 'include',
            cache: 'no-store',
          })
          const data = await response.json()
          if (!response.ok) {
            setError(data.error || 'Failed to fetch detection reports')
          } else {
            setScans(data.scans || [])
          }
        }
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Error fetching data')
        setSelectedScan(null)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedId])

  useEffect(() => {
    autoDownloadTriggered.current = false
  }, [selectedId])

  useEffect(() => {
    if (shouldAutoDownload && selectedScan && !loading && !autoDownloadTriggered.current) {
      autoDownloadTriggered.current = true
      const timer = setTimeout(() => window.print(), 300)
      return () => clearTimeout(timer)
    }
  }, [shouldAutoDownload, selectedScan, loading])

  const stats = useMemo(() => {
    return {
      total: scans.length,
      authentic: scans.filter((s) => s.verdict === 'authentic').length,
      suspicious: scans.filter((s) => s.verdict === 'suspicious').length,
      deepfake: scans.filter((s) => s.verdict === 'deepfake').length,
    }
  }, [scans])

  const filteredScans = useMemo(() => {
    return scans.filter((s) => {
      const nameVal = s.name || s.fileName || ''
      const idVal = s.id || s.scanId || ''
      const matchName =
        nameVal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idVal.toLowerCase().includes(searchQuery.toLowerCase())
      const matchVerdict = verdictFilter === 'all' || s.verdict === verdictFilter
      return matchName && matchVerdict
    })
  }, [scans, searchQuery, verdictFilter])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading detection report...</p>
        </div>
      </div>
    )
  }

  if (!selectedId) {
    return (
      <div className="space-y-6">
        <div className="border-b border-border/50 pb-6">
          <PageHeader
            title="Detection Reports"
            description="Archive of all authenticity reports generated for your uploaded media."
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Total Reports</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-success/25 bg-success/5 p-4 shadow-sm">
            <p className="text-xs font-medium text-success">Likely Authentic</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-success">{stats.authentic}</p>
          </div>
          <div className="rounded-2xl border border-warning/25 bg-warning/5 p-4 shadow-sm">
            <p className="text-xs font-medium text-warning">Suspicious</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-warning">{stats.suspicious}</p>
          </div>
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 shadow-sm">
            <p className="text-xs font-medium text-destructive">Deepfakes Flagged</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-destructive">{stats.deepfake}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-secondary/15 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by filename or SCN-ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border/60 bg-background/60 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex h-9 items-center justify-between gap-2.5 rounded-xl border border-border/60 bg-background/70 px-3.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md transition-all hover:border-primary/50 hover:bg-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      verdictOptions.find((o) => o.value === verdictFilter)?.color
                    )}
                  />
                  <span>
                    {verdictOptions.find((o) => o.value === verdictFilter)?.label}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    'size-3.5 text-muted-foreground transition-transform duration-200',
                    isDropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute left-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-border/80 bg-popover/95 p-1 text-popover-foreground shadow-2xl backdrop-blur-xl">
                    {verdictOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setVerdictFilter(opt.value)
                          setIsDropdownOpen(false)
                        }}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors hover:bg-accent/60',
                          verdictFilter === opt.value
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn('size-2 rounded-full', opt.color)} />
                          <span>{opt.label}</span>
                        </div>
                        {verdictFilter === opt.value && <Check className="size-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 self-end rounded-xl border border-border/60 bg-background/60 p-1 sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                viewMode === 'grid' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                viewMode === 'table' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>

        {filteredScans.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-16 text-center">
            <FileText className="size-10 text-muted-foreground/50" />
            <h3 className="mt-3 text-sm font-semibold">No matching reports found</h3>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredScans.map((s) => {
              const verdictConf =
                verdictMap[s.verdict as Verdict] || {
                  text: 'Unknown',
                  color: 'text-muted-foreground',
                  badge: 'bg-secondary text-muted-foreground border-border',
                }

              const scanTitle = s.name || s.fileName || 'Unnamed Scan'
              const scanIdentifier = s.id || s.scanId || ''
              const mediaType = s.type || s.fileType || 'image'
              const scanDate = formatLocalDateTime(s.date || s.createdAt)

              return (
                <div
                  key={scanIdentifier}
                  className="group flex flex-col justify-between rounded-2xl border border-border/60 bg-card/40 p-5 transition-all hover:border-primary/40 hover:bg-card/70"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-secondary/80">
                        <MediaIcon type={mediaType} className="size-4.5 text-muted-foreground" />
                      </div>
                      <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize', verdictConf.badge)}>
                        {s.verdict}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h3 className="truncate font-semibold text-foreground">{scanTitle}</h3>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{scanIdentifier}</p>
                    </div>

                    <div className="mt-5 space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Authenticity Score</span>
                        <span className={cn('tabular-nums font-bold', s.score >= 70 ? 'text-success' : s.score >= 45 ? 'text-warning' : 'text-destructive')}>
                          {s.score}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/70">
                        <div
                          className={cn('h-full rounded-full transition-all', s.score >= 70 ? 'bg-success' : s.score >= 45 ? 'bg-warning' : 'bg-destructive')}
                          style={{ width: `${s.score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-3.5">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="size-3" />
                      {scanDate}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 px-3 text-xs font-medium text-primary"
                      onClick={() => router.push(`/report?scanId=${scanIdentifier}`)}
                    >
                      <Eye className="size-3.5" />
                      Inspect
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/40">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 bg-secondary/20 hover:bg-transparent">
                  <TableHead className="py-3.5">File</TableHead>
                  <TableHead className="py-3.5">Type</TableHead>
                  <TableHead className="py-3.5">Score</TableHead>
                  <TableHead className="py-3.5">Verdict</TableHead>
                  <TableHead className="hidden py-3.5 sm:table-cell">Date</TableHead>
                  <TableHead className="py-3.5 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {filteredScans.map((s) => {
                  const scanTitle = s.name || s.fileName || 'Unnamed Scan'
                  const scanIdentifier = s.id || s.scanId || ''
                  const mediaType = s.type || s.fileType || 'image'
                  const scanDate = formatLocalDateTime(s.date || s.createdAt)

                  return (
                    <TableRow key={scanIdentifier} className="hover:bg-secondary/20">
                      <TableCell>
                        <p className="max-w-[220px] truncate font-medium text-foreground">{scanTitle}</p>
                        <p className="font-mono text-xs text-muted-foreground">{scanIdentifier}</p>
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <MediaIcon type={mediaType} className="size-3.5" />
                          {mediaLabels[mediaType as keyof typeof mediaLabels] || mediaType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn('font-semibold tabular-nums', s.score >= 70 ? 'text-success' : s.score >= 45 ? 'text-warning' : 'text-destructive')}>
                          {s.score}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize', verdictMap[s.verdict as Verdict]?.badge || '')}>
                          {s.verdict}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                        {scanDate}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs font-medium"
                          onClick={() => router.push(`/report?scanId=${scanIdentifier}`)}
                        >
                          <Eye className="mr-1 size-3" />
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    )
  }

  if (error || !selectedScan) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-3">
          <AlertTriangle className="size-7" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Report Unavailable</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {error || `Scan ID '${selectedId}' was not found in database.`}
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" onClick={() => router.push('/scan/upload')}>
            Run New Verification
          </Button>
          <Button onClick={() => router.push('/report')}>
            All Reports
          </Button>
        </div>
      </div>
    )
  }

  const verdict = selectedScan.verdict
  const verdictInfo = verdict
    ? verdictMap[verdict]
    : { text: 'Under Analysis', color: 'text-muted-foreground', badge: '' }
  const overallRisk = selectedScan.overallRisk || 'Medium'
  const keyMetrics = getKeyMetrics(selectedScan)
  const explanationLines = selectedScan.explanation || []
  const closingLine = explanationLines[explanationLines.length - 1]
  const explanationBullets = explanationLines.slice(0, -1)
  const evidence = selectedScan.evidence
  const breakdown = selectedScan.breakdown || {}
  const riskRows = selectedScan.riskAssessment || []
  const fileMeta = selectedScan.fileMeta || {}
  const fullHash = selectedScan.sha256

  const handleCopyHash = async () => {
    if (!fullHash) return
    try {
      await navigator.clipboard.writeText(fullHash)
      toast.success('SHA-256 hash copied')
    } catch {
      toast.error('Unable to copy hash')
    }
  }

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 portrait; margin: 0.8cm; }
          *, *::before, *::after { box-sizing: border-box !important; }
          html, body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          aside, header, nav, footer, button, [role="dialog"], [data-sonner-toaster], .toaster, .print-hide {
            display: none !important;
          }
          .glass, .rounded-2xl, .rounded-3xl {
            background: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            color: #0f172a !important;
            break-inside: avoid !important;
          }
          p, span, h2, h3 { color: #0f172a !important; }
          .text-muted-foreground { color: #475569 !important; }
          section { break-inside: avoid !important; margin-bottom: 0.6rem !important; }
          img { max-width: 100% !important; break-inside: avoid !important; }
        }
      `}} />

      <div className="flex items-center justify-between border-b border-border/50 pb-4 print-hide">
        <Button variant="ghost" size="sm" onClick={() => router.push('/report')}>
          <ArrowLeft className="mr-1.5 size-4" />
          All Reports
        </Button>

        <Button
          size="sm"
          className="gradient-brand text-primary-foreground"
          onClick={() => {
            window.print()
            toast.success('Preparing PDF report...')
          }}
        >
          <Download className="mr-1.5 size-4" />
          Download PDF
        </Button>
      </div>

      <main className="mx-auto max-w-4xl space-y-6 print:m-0 print:p-0 print:space-y-3">

        {/* 1. Report Header */}
        <section className="glass rounded-3xl border border-border/60 p-6 shadow-lg print:p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="size-4 text-primary" />
            VeriTrust-AI — Digital Authenticity Report
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">File Name</p>
              <p className="mt-0.5 truncate font-medium text-foreground">{selectedScan.fileName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">File Type</p>
              <p className="mt-0.5 font-medium capitalize text-foreground">{selectedScan.fileType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Scan ID</p>
              <p className="mt-0.5 font-mono font-medium text-foreground">{selectedScan.scanId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Scan Date &amp; Time</p>
              <p className="mt-0.5 font-medium text-foreground">{formatLocalDateTime(selectedScan.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Scan Duration</p>
              <p className="mt-0.5 flex items-center gap-1 font-medium text-foreground">
                <Clock className="size-3 text-muted-foreground" />
                {formatDuration(selectedScan.analysisDurationMs)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Analysis Type</p>
              <p className="mt-0.5 font-medium text-foreground">
                {analysisTypeLabels[selectedScan.fileType] || 'Media Forensics'}
              </p>
            </div>
          </div>
          <p className="mt-4 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
            Report generated by VeriTrust-AI
          </p>
        </section>

        {/* 2. Overall Authenticity Result */}
        <section className="glass rounded-3xl border border-border/60 p-8 text-center shadow-xl print:p-4">
          <div className="flex justify-center">
            <ScoreGauge score={selectedScan.score ?? 0} size={200} />
          </div>

          <h2 className={cn('mt-4 text-2xl font-semibold', verdictInfo.color)}>
            {verdictInfo.text}
          </h2>

          {closingLine && (
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {closingLine}
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
            {keyMetrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{m.label}</p>
                <p className={cn('mt-1 text-sm font-bold', m.tone)}>{m.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. AI Analysis Results — rendered directly from the scan's own real cards, no padding */}
        <section>
          <h2 className="mb-4 text-lg font-semibold print:mb-2">AI Analysis Results</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:gap-2">
            {selectedScan.analysisCards.map((card) => (
              <div
                key={card.key}
                className={cn(
                  'glass flex items-start gap-3 rounded-2xl border p-4 print:p-2.5',
                  card.ok ? 'border-success/25 bg-success/5' : 'border-destructive/25 bg-destructive/5'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg print:size-6',
                    card.ok ? 'bg-success/15' : 'bg-destructive/15'
                  )}
                >
                  {card.ok ? (
                    <CheckCircle2 className="size-4 text-success" />
                  ) : (
                    <AlertTriangle className="size-4 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{card.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{card.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Spatial Visualizations (images only) */}
        {selectedScan.visualArtifacts &&
          (selectedScan.visualArtifacts.ela_map || selectedScan.visualArtifacts.fft_spectrum) && (
            <section className="glass rounded-3xl border border-border/60 p-6 shadow-lg space-y-4 print:p-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="size-4 text-primary" />
                  <h2 className="text-lg font-semibold">Forensic Spatial Visualizations</h2>
                </div>
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Algorithmic Decomposition
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 print:gap-3">
                {selectedScan.visualArtifacts.ela_map && (
                  <div className="flex flex-col space-y-2 rounded-2xl border border-border/60 bg-secondary/20 p-4 print:p-2.5">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-semibold text-foreground">Error Level Analysis (ELA)</span>
                      <span className="text-muted-foreground">Compression Gradient</span>
                    </div>
                    <div className="h-56 w-full overflow-hidden rounded-xl border border-border/60 bg-black flex items-center justify-center">
                      <img
                        src={selectedScan.visualArtifacts.ela_map}
                        alt="ELA Map"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Uniform surface darkness denotes single-capture compression. Glowing boundaries expose modifications.
                    </p>
                  </div>
                )}

                {selectedScan.visualArtifacts.fft_spectrum && (
                  <div className="flex flex-col space-y-2 rounded-2xl border border-border/60 bg-secondary/20 p-4 print:p-2.5">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-semibold text-foreground">2D Fourier Transform (FFT)</span>
                      <span className="text-muted-foreground">Spatial Frequency</span>
                    </div>
                    <div className="h-56 w-full overflow-hidden rounded-xl border border-border/60 bg-black flex items-center justify-center">
                      <img
                        src={selectedScan.visualArtifacts.fft_spectrum}
                        alt="FFT Spectrum"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Smooth radial decay denotes optical sensor physics. Geometric spikes expose generative artifacts.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

        {/* 4. Forensic Evidence */}
        {evidence && (
          <section className="glass rounded-3xl border border-border/60 p-6 shadow-lg print:p-4">
            <div className="mb-4 flex items-center gap-2">
              <Microscope className="size-4 text-primary" />
              <h2 className="text-lg font-semibold">Forensic Evidence</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-secondary/40 p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{evidence.examined}</p>
                <p className="mt-1 text-xs text-muted-foreground">Evidence Examined</p>
              </div>
              <div className="rounded-xl bg-secondary/40 p-4 text-center">
                <p className={cn('text-2xl font-bold', evidence.anomalies > 0 ? 'text-destructive' : 'text-success')}>
                  {evidence.anomalies}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Anomalies Detected</p>
              </div>
              <div className="rounded-xl bg-secondary/40 p-4 text-center">
                <p className="text-2xl font-bold text-success">{evidence.passed}/{evidence.total}</p>
                <p className="mt-1 text-xs text-muted-foreground">Integrity Checks Passed</p>
              </div>
            </div>
            <p className="mt-4 text-xs font-medium text-muted-foreground">What was examined:</p>
            <ul className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
              {selectedScan.analysisCards.map((c) => (
                <li key={c.key} className="flex items-center gap-1.5">
                  <Check className="size-3 text-primary" />
                  {c.label}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 5. Threat / Risk Assessment */}
        <section className="glass rounded-3xl border border-border/60 p-6 shadow-lg print:p-4">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Threat / Risk Assessment</h2>
            <span className={cn('rounded-full border px-3 py-1 text-xs font-bold', riskBadge[overallRisk])}>
              Overall Risk: {overallRisk.toUpperCase()}
            </span>
          </div>

          {riskRows.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-border/50">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Threat Category</th>
                    <th className="px-4 py-2.5">Risk</th>
                    <th className="px-4 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {riskRows.map((row) => (
                    <tr key={row.category}>
                      <td className="px-4 py-2.5 font-medium text-foreground">{row.category}</td>
                      <td className={cn('px-4 py-2.5 font-semibold', riskColor[row.risk])}>{row.risk}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-medium">
                          {row.status === 'Clear' ? (
                            <ShieldCheck className="size-3.5 text-success" />
                          ) : (
                            <ShieldAlert className="size-3.5 text-warning" />
                          )}
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-secondary/40 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Possible Threat</p>
                <p className="mt-1.5 text-sm font-semibold">{selectedScan.threat || 'None Detected'}</p>
              </div>
              <div className="rounded-xl bg-secondary/40 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recommended Action</p>
                <p className="mt-1.5 text-sm font-semibold">{selectedScan.action || 'Content Appears Safe'}</p>
              </div>
            </div>
          )}
        </section>

        {/* 6. AI Explanation */}
        {explanationBullets.length > 0 && (
          <section className="glass rounded-3xl border border-border/60 p-6 shadow-lg print:p-4">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h2 className="text-lg font-semibold">Why did VeriTrust-AI give this score?</h2>
            </div>
            <ul className="space-y-2 text-sm">
              {explanationBullets.map((line, i) => (
                <li key={i} className="text-foreground">{line}</li>
              ))}
            </ul>
            {closingLine && (
              <p className="mt-4 border-t border-border/40 pt-3 text-sm font-medium text-foreground">{closingLine}</p>
            )}
          </section>
        )}

        {/* 7. Authenticity Breakdown */}
        {Object.keys(breakdown).length > 0 && (
          <section className="glass rounded-3xl border border-border/60 p-6 shadow-lg print:p-4">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              <h2 className="text-lg font-semibold">Authenticity Breakdown</h2>
            </div>
            <div className="space-y-3.5">
              {Object.entries(breakdown).map(([label, pct]) => (
                <div key={label}>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-foreground">{label}</span>
                    <span className={cn('tabular-nums font-bold', pct >= 70 ? 'text-success' : pct >= 45 ? 'text-warning' : 'text-destructive')}>
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary/60">
                    <div
                      className={cn('h-full rounded-full', pct >= 70 ? 'bg-success' : pct >= 45 ? 'bg-warning' : 'bg-destructive')}
                      style={{ width: `${clampPct(pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. File Preview */}
        <section className="glass rounded-3xl border border-border/60 p-6 shadow-lg print:p-4">
          <h2 className="mb-4 text-lg font-semibold">Analyzed File</h2>
          <div className="flex flex-col items-center gap-3">
            {selectedScan.fileType === 'image' && selectedScan.filePreview && (
              <img src={selectedScan.filePreview} alt={selectedScan.fileName} className="max-h-80 rounded-xl border border-border/60 object-contain" />
            )}
            {selectedScan.fileType === 'document' && selectedScan.filePreview && (
              <iframe src={selectedScan.filePreview} className="h-80 w-full rounded-xl border border-border/60 bg-white" title="PDF preview" />
            )}
            {selectedScan.fileType === 'video' && selectedScan.filePreview && (
              <div className="relative">
                <img src={selectedScan.filePreview} alt="Video thumbnail" className="max-h-80 rounded-xl border border-border/60 object-contain" />
                <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
                  First-frame preview
                </span>
              </div>
            )}
            {selectedScan.fileType === 'audio' && selectedScan.audioWaveform && selectedScan.audioWaveform.length > 0 && (
              <div className="flex h-24 w-full items-end justify-center gap-0.5 rounded-xl border border-border/60 bg-secondary/20 p-3">
                {selectedScan.audioWaveform.map((v, i) => (
                  <div
                    key={i}
                    className="w-full rounded-sm bg-primary/70"
                    style={{ height: `${Math.max(4, clampPct(v))}%` }}
                  />
                ))}
              </div>
            )}
            {!selectedScan.filePreview && !selectedScan.audioWaveform && (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <FileText className="size-8" />
                <p className="text-xs">No preview available for this file</p>
              </div>
            )}
            <p className="font-medium text-foreground">{selectedScan.fileName}</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {fileMeta.pageCount !== undefined && <span>Pages: {fileMeta.pageCount}</span>}
              {fileMeta.width !== undefined && <span>Dimensions: {fileMeta.width}×{fileMeta.height}</span>}
              {fileMeta.resolution && <span>Resolution: {fileMeta.resolution}</span>}
              {fileMeta.durationSec !== undefined && fileMeta.durationSec > 0 && <span>Duration: {fileMeta.durationSec}s</span>}
              <span>Size: {formatBytes(selectedScan.fileSize)}</span>
              {(fileMeta.format || fileMeta.pdfVersion || fileMeta.containerType) && (
                <span>Format: {fileMeta.format || fileMeta.pdfVersion || fileMeta.containerType}</span>
              )}
            </div>
          </div>
        </section>

        {/* 9. File Integrity */}
        {fullHash && (
          <section className="glass rounded-3xl border border-border/60 p-6 shadow-lg print:p-4">
            <div className="mb-4 flex items-center gap-2">
              <Hash className="size-4 text-primary" />
              <h2 className="text-lg font-semibold">File Integrity</h2>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-secondary/40 p-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">SHA-256 Hash</p>
                  <p className="mt-0.5 truncate font-mono text-xs text-foreground">{fullHash}</p>
                </div>
                <button
                  onClick={handleCopyHash}
                  className="ml-3 shrink-0 rounded-lg border border-border/60 p-2 text-muted-foreground hover:text-foreground print-hide"
                  aria-label="Copy hash"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground">File Size</p>
                  <p className="mt-0.5 font-medium text-foreground">{formatBytes(selectedScan.fileSize)}</p>
                </div>
                <div className="rounded-xl bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground">MIME Type</p>
                  <p className="mt-0.5 truncate font-medium text-foreground">{selectedScan.mimeType || '—'}</p>
                </div>
                <div className="rounded-xl bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground">Hash Status</p>
                  <p className="mt-0.5 flex items-center gap-1 font-medium text-success">
                    <CheckCircle2 className="size-3.5" /> Verified
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 10. Final Verdict */}
        <section className={cn('rounded-3xl border p-8 text-center shadow-xl print:p-4', riskBadge[overallRisk])}>
          <p className="text-xs font-bold uppercase tracking-widest">Final Verdict</p>
          <h2 className={cn('mt-2 text-3xl font-bold', verdictInfo.color)}>{verdictInfo.text}</h2>
          <p className="mt-1 text-lg font-semibold text-foreground">Authenticity Score: {selectedScan.score ?? 0}%</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            {closingLine || 'Analysis complete based on the available forensic signals.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Gauge className="size-4" />
            <span className="text-sm font-bold">Risk Level: {overallRisk.toUpperCase()}</span>
          </div>
        </section>

        {/* 11. Report Actions */}
        <div className="print-hide">
          <Button
            className="w-full gradient-brand text-primary-foreground"
            onClick={() => {
              window.print()
              toast.success('Preparing PDF report...')
            }}
          >
            <Download className="size-4" />
            Download PDF
          </Button>
        </div>
      </main>
    </div>
  )
}

function clampPct(v: number): number {
  return Math.max(0, Math.min(100, v))
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  )
}

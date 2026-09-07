'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Download,
  Eye,
  Loader2,
  ChevronDown,
  Check,
  FileImage,
  Video,
  Mic,
  FileText,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/app/page-header'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { mediaLabels, verdictLabels } from '@/lib/mock-data'
import type { MediaType, Verdict, ScanRecord } from '@/lib/mock-data'
import { cn, formatLocalDateTime } from '@/lib/utils'

const mediaOptions: { label: string; value: '' | MediaType; icon: any }[] = [
  { label: 'All Types', value: '', icon: Layers },
  { label: 'Image', value: 'image', icon: FileImage },
  { label: 'Video', value: 'video', icon: Video },
  { label: 'Audio', value: 'audio', icon: Mic },
  { label: 'Document', value: 'document', icon: FileText },
  { label: 'Cross-Modal', value: 'cross-modal', icon: Layers },
]

const verdictOptions: { label: string; value: '' | Verdict; color: string }[] = [
  { label: 'All Verdicts', value: '', color: 'bg-muted-foreground' },
  { label: 'Genuine', value: 'authentic', color: 'bg-emerald-500' },
  { label: 'Suspicious', value: 'suspicious', color: 'bg-amber-500' },
  { label: 'Deepfake', value: 'deepfake', color: 'bg-rose-500' },
]

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | MediaType>('')
  const [verdictFilter, setVerdictFilter] = useState<'' | Verdict>('')

  // Custom Dropdown Open States
  const [isTypeOpen, setIsTypeOpen] = useState(false)
  const [isVerdictOpen, setIsVerdictOpen] = useState(false)

  useEffect(() => {
    async function loadScans() {
      try {
        const res = await fetch('/api/scans/history')
        if (res.ok) {
          const data = await res.json()
          setScans(data.scans || [])
        } else {
          toast.error('Failed to load scan history')
        }
      } catch (err) {
        console.error('Error loading scans:', err)
        toast.error('Network error loading scans')
      } finally {
        setLoading(false)
      }
    }

    loadScans()
  }, [])

  const filtered = useMemo(() => {
    return scans.filter((r) => {
      const matchName = r.name.toLowerCase().includes(query.toLowerCase())
      const matchType = typeFilter ? r.type === typeFilter : true
      const matchVerdict = verdictFilter ? r.verdict === verdictFilter : true
      return matchName && matchType && matchVerdict
    })
  }, [scans, query, typeFilter, verdictFilter])

  const selectedType = mediaOptions.find((o) => o.value === typeFilter) || mediaOptions[0]
  const selectedVerdict = verdictOptions.find((o) => o.value === verdictFilter) || verdictOptions[0]
  const TypeIcon = selectedType.icon

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scan History"
        description="Browse and filter all your past verifications."
      />

      {/* Filters */}
      <Card className="glass-panel">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by filename..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-border/60 bg-secondary/30 py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="flex items-center gap-2.5">
              {/* Type Filter Custom Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsTypeOpen(!isTypeOpen)
                    setIsVerdictOpen(false)
                  }}
                  className="inline-flex h-9 items-center justify-between gap-2.5 rounded-xl border border-border/60 bg-background/70 px-3.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md transition-all hover:border-primary/50 hover:bg-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <div className="flex items-center gap-2">
                    <TypeIcon className="size-3.5 text-muted-foreground" />
                    <span>{selectedType.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'size-3.5 text-muted-foreground transition-transform duration-200',
                      isTypeOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isTypeOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsTypeOpen(false)}
                    />
                    <div className="absolute left-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-border/80 bg-popover/95 p-1 text-popover-foreground shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95">
                      {mediaOptions.map((opt) => {
                        const Icon = opt.icon
                        const isSelected = typeFilter === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setTypeFilter(opt.value)
                              setIsTypeOpen(false)
                            }}
                            className={cn(
                              'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors hover:bg-accent/60',
                              isSelected
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="size-3.5 text-muted-foreground" />
                              <span>{opt.label}</span>
                            </div>
                            {isSelected && <Check className="size-3.5 text-primary" />}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Verdict Filter Custom Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsVerdictOpen(!isVerdictOpen)
                    setIsTypeOpen(false)
                  }}
                  className="inline-flex h-9 items-center justify-between gap-2.5 rounded-xl border border-border/60 bg-background/70 px-3.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md transition-all hover:border-primary/50 hover:bg-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('size-2 rounded-full', selectedVerdict.color)} />
                    <span>{selectedVerdict.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'size-3.5 text-muted-foreground transition-transform duration-200',
                      isVerdictOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isVerdictOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsVerdictOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-border/80 bg-popover/95 p-1 text-popover-foreground shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95">
                      {verdictOptions.map((opt) => {
                        const isSelected = verdictFilter === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setVerdictFilter(opt.value)
                              setIsVerdictOpen(false)
                            }}
                            className={cn(
                              'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors hover:bg-accent/60',
                              isSelected
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn('size-2 rounded-full', opt.color)} />
                              <span>{opt.label}</span>
                            </div>
                            {isSelected && <Check className="size-3.5 text-primary" />}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Count */}
              <p className="mb-4 text-xs font-medium text-muted-foreground">
                Showing{' '}
                <span className="text-foreground">{filtered.length}</span> of{' '}
                <span className="text-foreground">{scans.length}</span> scans
              </p>

              {filtered.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        <th className="pb-3 pr-4">File</th>
                        <th className="pb-3 pr-4 hidden sm:table-cell">Type</th>
                        <th className="pb-3 pr-4">Score</th>
                        <th className="pb-3 pr-4">Verdict</th>
                        <th className="pb-3 pr-4 hidden md:table-cell">Date</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filtered.map((r) => (
                        <tr key={r.id} className="group">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-foreground truncate max-w-[180px]">
                              {r.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{r.id}</p>
                            {r.caseId && (
                              <Link
                                href={`/report/case?caseId=${r.caseId}`}
                                className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                              >
                                <Layers className="size-3" />
                                Part of a case
                              </Link>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground capitalize hidden sm:table-cell">
                            {mediaLabels[r.type]}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={cn(
                                'font-semibold tabular-nums',
                                r.score >= 70
                                  ? 'text-success'
                                  : r.score >= 45
                                    ? 'text-warning'
                                    : 'text-destructive'
                              )}
                            >
                              {r.score}%
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                                r.verdict === 'authentic'
                                  ? 'bg-success/12 text-success border-success/25'
                                  : r.verdict === 'deepfake'
                                    ? 'bg-destructive/12 text-destructive border-destructive/25'
                                    : 'bg-warning/12 text-warning border-warning/25'
                              )}
                            >
                              <span className="size-1.5 rounded-full bg-current" />
                              {verdictLabels[r.verdict]}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                            {formatLocalDateTime(r.date)}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                render={<Link href={`/report?id=${r.id}`} />}
                              >
                                <Eye className="size-3.5" />
                                <span className="hidden sm:inline">View</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                render={<Link href={`/report?id=${r.id}&download=1`} />}
                              >
                                <Download className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <Search className="mx-auto size-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm font-medium text-muted-foreground">No results found</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
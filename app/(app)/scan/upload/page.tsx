'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  UploadCloud,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Eye,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  FolderPlus,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn, formatLocalDateTime } from '@/lib/utils'

interface RecentScan {
  scanId?: string
  id?: string
  fileName?: string
  name?: string
  fileType?: string
  type?: string
  score: number
  verdict: 'authentic' | 'suspicious' | 'deepfake'
  threat: string
  date: string
}

interface JustVerified {
  scanId: string
  fileName: string
  score: number
  verdict: 'authentic' | 'suspicious' | 'deepfake'
}

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [recentReports, setRecentReports] = useState<RecentScan[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  // A case groups this session's files so a "Verify Another File" pass can be
  // linked into one correlated case report — generated once per page session,
  // and only surfaced to the user once a second file is actually added.
  const [caseId] = useState(() => crypto.randomUUID())
  const [caseScanIds, setCaseScanIds] = useState<string[]>([])
  const [justVerified, setJustVerified] = useState<JustVerified | null>(null)

  useEffect(() => {
    async function loadRecentHistory() {
      try {
        const res = await fetch('/api/scans/history', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data.scans && Array.isArray(data.scans)) {
            setRecentReports(data.scans.slice(0, 8))
          }
        }
      } catch (err) {
        console.error('Failed to load recent history:', err)
      } finally {
        setLoadingHistory(false)
      }
    }
    loadRecentHistory()
  }, [])

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleVerifyAnother = () => {
    setFile(null)
    setJustVerified(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleVerify = async () => {
    if (!file) {
      toast.error('Please upload a file first.')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('caseId', caseId)

    try {
      const response = await fetch('/api/scans/upload', {
        method: 'POST',
        body: formData,
      })

      const responseText = await response.text()
      let data: any
      try {
        data = JSON.parse(responseText)
      } catch {
        throw new Error(
          `Server returned HTTP ${response.status}: ${responseText || 'Empty response'}`
        )
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Verification analysis failed.')
      }

      toast.success('Analysis complete!')
      setCaseScanIds((prev) => [...prev, data.scanId])
      setJustVerified({
        scanId: data.scanId,
        fileName: file.name,
        score: data.scan?.score ?? 0,
        verdict: data.scan?.verdict ?? 'authentic',
      })
    } catch (err: any) {
      toast.error(err.message || 'Error processing file.')
      console.error('Verification error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleViewReport = () => {
    if (caseScanIds.length >= 2) {
      router.push(`/report/case?caseId=${caseId}`)
    } else if (justVerified) {
      router.push(`/report?scanId=${justVerified.scanId}`)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">New Verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a file to run a full AI authenticity and forensic signal analysis.
        </p>
      </div>

      {justVerified ? (
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-success/30 bg-success/5 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-success/15 text-success">
            <CheckCircle2 className="size-8" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">File verified ✓</p>
            <p className="mt-1 text-sm text-muted-foreground">{justVerified.fileName}</p>
            <p className="mt-2 text-sm">
              Score:{' '}
              <span
                className={cn(
                  'font-bold',
                  justVerified.score >= 70 ? 'text-emerald-500' : justVerified.score >= 45 ? 'text-amber-500' : 'text-rose-500'
                )}
              >
                {justVerified.score}%
              </span>
              {' · '}
              <span className="capitalize font-medium">{justVerified.verdict}</span>
            </p>
          </div>

          {caseScanIds.length >= 2 && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <Layers className="size-3.5" />
              {caseScanIds.length} files linked in this case
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="outline" onClick={handleVerifyAnother} className="min-w-[220px]">
              <FolderPlus className="size-4" />
              Add Related File to This Case
            </Button>
            <Button size="lg" onClick={handleViewReport} className="gradient-brand min-w-[220px] text-primary-foreground">
              <Eye className="size-4" />
              {caseScanIds.length >= 2 ? 'View Case Report' : 'View Report'}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'group relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/70 bg-card/20 p-8 text-center transition-all hover:border-primary/50 hover:bg-card/40',
              file && 'border-primary/60 bg-primary/5'
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf"
            />

            <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary/80 text-primary transition-transform group-hover:scale-105">
              <UploadCloud className="size-8" />
            </div>

            {file ? (
              <div className="mt-4 space-y-1">
                <p className="text-base font-semibold text-foreground">{file.name}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {file.type || 'FILE'} · {(file.size / 1024).toFixed(1)} KB
                </p>
                <p className="pt-2 text-xs font-medium text-emerald-500">
                  File selected — click Verify Authenticity to continue
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Drop your media file here, or <span className="text-primary underline">browse</span>
                </p>
                <p className="text-xs text-muted-foreground">Supports JPEG, PNG, MP4, WAV, MP3, and PDF</p>
                {caseScanIds.length > 0 && (
                  <p className="pt-1 flex items-center justify-center gap-1.5 text-xs font-medium text-primary">
                    <Layers className="size-3.5" />
                    Adding to case — {caseScanIds.length} file{caseScanIds.length === 1 ? '' : 's'} already verified
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-secondary/30 px-2.5 py-1 text-xs text-muted-foreground">
                <ImageIcon className="size-3.5" /> Image
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-secondary/30 px-2.5 py-1 text-xs text-muted-foreground">
                <Video className="size-3.5" /> Video
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-secondary/30 px-2.5 py-1 text-xs text-muted-foreground">
                <Music className="size-3.5" /> Audio
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-secondary/30 px-2.5 py-1 text-xs text-muted-foreground">
                <FileText className="size-3.5" /> PDF
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Button
              size="lg"
              onClick={handleVerify}
              disabled={!file || isUploading}
              className="gradient-brand min-w-[260px] text-primary-foreground font-semibold shadow-md"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  <span>Analyzing Neural Signals...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Verify Authenticity</span>
                  <ArrowRight className="size-4" />
                </div>
              )}
            </Button>

            {file && !isUploading && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleVerifyAnother}
                className="min-w-[200px]"
              >
                <RotateCcw className="size-3.5" />
                Verify Another File
              </Button>
            )}
          </div>
        </>
      )}

      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <h2 className="text-lg font-semibold text-foreground">Recent Reports</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/report')}
            className="text-xs text-primary"
          >
            View all →
          </Button>
        </div>

        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : recentReports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 py-10 text-center text-xs text-muted-foreground">
            No verification reports found yet. Run your first scan above!
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/30">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 bg-secondary/20 text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Verdict</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {recentReports.map((item, idx) => {
                  const uniqueKey = item.scanId || item.id || `recent-scan-${idx}`
                  const displayName = item.fileName || item.name || 'Unnamed Scan'
                  const displayId = item.scanId || item.id || ''
                  const displayType = (item.fileType || item.type || 'image').toLowerCase()

                  return (
                    <tr key={uniqueKey} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground max-w-[200px] truncate">
                          {displayName}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{displayId}</p>
                      </td>
                      <td className="px-4 py-3 capitalize text-xs text-muted-foreground">
                        {displayType}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'font-bold tabular-nums',
                            item.score >= 70
                              ? 'text-emerald-500'
                              : item.score >= 45
                              ? 'text-amber-500'
                              : 'text-rose-500'
                          )}
                        >
                          {item.score}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
                            item.verdict === 'authentic'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                              : item.verdict === 'suspicious'
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                              : 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                          )}
                        >
                          {item.verdict}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                        {formatLocalDateTime(item.date)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/report?scanId=${displayId}`)}
                          className="h-8 text-xs text-primary"
                        >
                          <Eye className="mr-1 size-3.5" />
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
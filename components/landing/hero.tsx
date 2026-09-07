'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck, Zap, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { UploadBox } from '@/components/upload-box'
import { DualBar } from '@/components/charts/charts'

const TRIAL_KEY = 'veritrust_free_trial_used'

const GREEN = 'oklch(0.7 0.16 155)'
const AMBER = 'oklch(0.78 0.15 75)'
const RED = 'oklch(0.62 0.22 20)'

const trustStats = [
  { value: '99.3%', label: 'Detection accuracy' },
  { value: '<2s', label: 'Average verdict time' },
  { value: '10M+', label: 'Files verified' },
  { value: 'SOC 2', label: 'Certified' },
]

function verdictMeta(score: number) {
  if (score >= 70) return { label: 'Likely Genuine', color: GREEN }
  if (score >= 45) return { label: 'Uncertain — Review Recommended', color: AMBER }
  return { label: 'Likely Deepfake', color: RED }
}

export function Hero() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<{ score: number; fileName: string } | null>(null)
  const [trialUsed, setTrialUsed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(TRIAL_KEY)) {
        setTrialUsed(true)
      }
    } catch {
      // localStorage unavailable — fail open, no gate
    }
  }, [])

  const goToPricing = () => router.push('/pricing')

  const handleVerify = async () => {
    if (!file) return
    setVerifying(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/scans/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Verification failed. Please try again.')
      }

      setResult({ score: data.scan.score, fileName: file.name })

      try {
        localStorage.setItem(TRIAL_KEY, '1')
      } catch {
        // ignore — worst case the free trial isn't gated this session
      }
      setTrialUsed(true)
    } catch (error: any) {
      console.error('Landing verify failed:', error)
      toast.error(error.message || 'Unable to verify this file right now.')
    } finally {
      setVerifying(false)
    }
  }

  const verdict = result ? verdictMeta(result.score) : null

  return (
    <section className="hero-section relative overflow-hidden pt-28 pb-20">

      {/* ── Premium background layers ── */}
      {/* Grid pattern */}
      <div className="hero-grid pointer-events-none absolute inset-0 -z-10" />
      {/* Blue radial — top center */}
      <div className="pointer-events-none absolute -z-10 left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_top,oklch(0.62_0.19_264/30%),transparent_65%)] blur-[1px]" />
      {/* Purple glow — bottom left */}
      <div className="pointer-events-none absolute -z-10 -left-32 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.58_0.2_292/22%),transparent_65%)] blur-[2px]" />
      {/* Blue accent — bottom right */}
      <div className="pointer-events-none absolute -z-10 -right-24 bottom-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,oklch(0.62_0.19_264/18%),transparent_65%)] blur-[2px]" />
      {/* Subtle particles */}
      <div className="hero-particles pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 text-center">

        {/* Badge */}
        <div className="hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          AI-Powered Digital Trust Verification
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-[64px]">
          Is this content{' '}
          <span className="relative inline-block">
            <span className="text-gradient">real or fake?</span>
            <span className="hero-underline" />
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground md:text-xl">
          Upload any image, video, audio or document and get an{' '}
          <span className="font-semibold text-foreground">AI authenticity verdict in seconds</span>
          {' '}— before you trust, share or act on it.
        </p>

        {/* Trust stats row */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3">
          {trustStats.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="text-xl font-bold text-foreground">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {result && verdict ? (
          /* ── Inline result panel ── */
          <div className="mt-10 w-full rounded-2xl border border-border/60 bg-secondary/20 p-6">
            <p className="truncate text-sm font-medium text-muted-foreground">{result.fileName}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: verdict.color }}>
              {verdict.label}
            </p>
            <div className="mt-4">
              <DualBar
                data={[{ label: 'Result', Genuine: result.score, Deepfake: 100 - result.score }]}
                xKey="label"
                height={200}
                keys={[
                  { key: 'Genuine', color: GREEN, name: 'Genuine' },
                  { key: 'Deepfake', color: RED, name: 'Deepfake' },
                ]}
              />
            </div>
          </div>
        ) : (
          /* Upload box */
          <div className="mt-10 w-full">
            <UploadBox
              onFileSelect={setFile}
              className="min-h-[240px] w-full"
              locked={trialUsed}
              onLockedClick={goToPricing}
            />
          </div>
        )}

        {/* CTA */}
        {trialUsed ? (
          <div className="mt-5 w-full">
            <Button
              size="lg"
              className="gradient-brand w-full py-6 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-shadow hover:shadow-primary/40"
              onClick={goToPricing}
            >
              <Lock className="size-5" />
              Upgrade to Verify More Files
              <ArrowRight className="size-5" />
            </Button>
          </div>
        ) : (
          <div className="mt-5 w-full">
            <Button
              size="lg"
              className="gradient-brand w-full py-6 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-shadow hover:shadow-primary/40"
              onClick={handleVerify}
              disabled={!file || verifying}
            >
              {verifying ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ShieldCheck className="size-5" />
              )}
              {verifying ? 'Analyzing...' : 'Verify Authenticity Now'}
              {!verifying && <ArrowRight className="size-5" />}
            </Button>
            {!file && (
              <p className="mt-2 text-xs text-muted-foreground">
                Drop or choose a file above — your first scan is free
              </p>
            )}
          </div>
        )}

        {/* Privacy Guarantee */}
        <div className="mt-4 w-full">
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left backdrop-blur-sm">
            <span className="mt-0.5 text-base leading-none">🔒</span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Privacy Guarantee —</span>{' '}
              Your files are encrypted in transit and at rest, analyzed securely, and a preview is retained with your verification record for audit purposes.
            </p>
          </div>
        </div>

        {/* Perks */}
        <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {[
            { icon: CheckCircle2, text: '1 Free Verification' },
            { icon: Zap, text: 'Results in under 2s' },
            { icon: Lock, text: 'Encrypted & Secure Storage' },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Icon className="size-4 shrink-0 text-success" />
              {text}
            </span>
          ))}
        </div>

      </div>
    </section>
  )
}

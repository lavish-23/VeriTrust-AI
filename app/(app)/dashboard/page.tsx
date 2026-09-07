'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import {
  ArrowRight,
  CheckCircle2,
  History,
  Download,
  Crown,
  UploadCloud,
  ShieldCheck,
  Zap,
  Lock,
  Globe,
  Infinity as InfinityIcon,
  Layers,
  Video,
  Sparkles,
  FileText,
  Rocket,
  KeyRound,
  BadgeCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { FREE_SCAN_LIMIT } from '@/lib/plan'

const highlights = [
  { icon: Zap, label: 'Instant AI Analysis', desc: 'Results in seconds across all media types' },
  { icon: Lock, label: 'Tamper Detection', desc: 'Catches deepfakes, clones & metadata edits' },
  { icon: Globe, label: 'Cross-Modal Checks', desc: 'Verifies image, video, audio & documents' },
  { icon: ShieldCheck, label: 'Trust Score', desc: 'Clear authenticity score you can act on' },
]

const premiumFeatures = [
  { icon: InfinityIcon, label: 'Unlimited Verifications', desc: 'No cap on how many files you scan' },
  { icon: Layers, label: 'Cross-Modal Detection', desc: 'Correlate signals across image, video, audio & docs' },
  { icon: Video, label: 'Video & Audio Support', desc: 'Full deepfake & voice-clone analysis, not just images' },
  { icon: Sparkles, label: 'Detailed AI Explanations', desc: 'See exactly why a file was flagged' },
  { icon: FileText, label: 'Downloadable PDF Reports', desc: 'Share verifiable, audit-ready reports' },
  { icon: History, label: 'Scan History (90 Days)', desc: 'Look back further than the free tier' },
  { icon: Rocket, label: 'Priority Processing', desc: 'Faster queue times on every scan' },
  { icon: KeyRound, label: 'API Access', desc: 'Integrate VeriTrust checks into your own systems' },
  { icon: BadgeCheck, label: 'SOC 2 Aligned', desc: 'Enterprise-grade security & compliance posture' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [isPremium, setIsPremium] = useState(false)
  const [scanCount, setScanCount] = useState(0)

  useEffect(() => {
    async function loadUser() {
      try {
        const userRes = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        })
        const userData = await userRes.json()
        if (userRes.ok && userData.success) {
          setFirstName(userData.user.firstName)
          setIsPremium(!!userData.user.isPremium)
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      }

      try {
        const scansRes = await fetch('/api/scans/history', {
          credentials: 'include',
          cache: 'no-store',
        })
        if (scansRes.ok) {
          const scansData = await scansRes.json()
          setScanCount((scansData.scans || []).length)
        }
      } catch (error) {
        console.error('Failed to load scan count:', error)
      }
    }

    loadUser()
  }, [])

  const freeRemaining = Math.max(0, FREE_SCAN_LIMIT - scanCount)

  const handleDownloadReports = () => {
    if (!isPremium) {
      toast.error('Downloadable reports are a Premium feature.')
      router.push('/pricing')
      return
    }
    router.push('/history')
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName || 'there'} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify another file with AI-powered Digital Trust Verification.
        </p>
      </motion.div>

      {/* Hero + Subscription row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }} className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Left: rotating logo + about section */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center gap-6 rounded-2xl border border-border/60 bg-secondary/20 px-6 py-10 text-center">

          {/* 3-D rotating shield */}
          <div className="relative flex items-center justify-center" style={{ perspective: '600px' }}>
            {/* Outer glow ring */}
            <motion.div
              animate={{ rotateY: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative"
            >
              {/* Back face glow */}
              <div
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/40 to-accent/40 blur-xl"
                style={{ transform: 'translateZ(-20px) scale(1.15)' }}
              />

              {/* Main shield tile */}
              <div
                className="relative grid size-28 place-items-center rounded-3xl shadow-2xl shadow-primary/30"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.62 0.19 264), oklch(0.58 0.2 292))',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Shine highlight */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-3xl"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 55%)',
                  }}
                />
                <ShieldCheck className="size-14 text-white drop-shadow-lg" strokeWidth={1.6} />
              </div>
            </motion.div>

            {/* Orbiting dot */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              className="absolute"
              style={{ width: 140, height: 140 }}
            >
              <div className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_10px] shadow-primary" />
            </motion.div>

            {/* Counter-orbiting dot */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
              className="absolute"
              style={{ width: 160, height: 160 }}
            >
              <div className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-accent/80 shadow-[0_0_8px] shadow-accent" />
            </motion.div>
          </div>

          {/* About text */}
          <div className="max-w-lg space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              VeriTrust <span className="text-gradient">AI</span>
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              VeriTrust AI is your AI-powered Digital Trust Platform. Upload any image, video, audio
              clip, PDF or document and our cross-modal AI engine will scan for deepfakes, synthetic
              generation artifacts, metadata tampering and voice cloning — delivering a clear
              Authenticity Score in seconds.
            </p>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-left">
              {highlights.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-secondary/40 p-3"
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                    <Icon className="size-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{label}</p>
                    <p className="text-[11px] leading-snug text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Subscription + Quick Actions */}
        <div className="space-y-4">
          {/* Subscription Card */}
          <Card className="glass-panel">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Crown className={cn('size-4', isPremium ? 'text-warning' : 'text-muted-foreground')} />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold',
                  isPremium ? 'bg-warning/15 text-warning' : 'bg-secondary text-muted-foreground',
                )}
              >
                {isPremium ? '✦ Premium' : 'Free'}
              </span>

              {isPremium ? (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    'Unlimited Verifications',
                    'API Access Enabled',
                    'Priority Processing',
                    'Downloadable Reports',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Remaining free verifications</p>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold text-foreground">{freeRemaining}</span>
                      <span className="mb-1 text-sm text-muted-foreground">/ {FREE_SCAN_LIMIT}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(freeRemaining / FREE_SCAN_LIMIT) * 100}%`,
                          animation: 'progress-fill 1.2s cubic-bezier(0.22,1,0.36,1) 0.4s both',
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    className="gradient-brand w-full text-primary-foreground"
                    render={<Link href="/pricing" />}
                  >
                    <Crown className="size-4" />
                    Upgrade to Premium
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/scan/upload"
                className="group flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/40 p-3 transition-colors hover:border-primary/40 hover:bg-secondary/70"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UploadCloud className="size-4" />
                </div>
                <span className="text-sm font-medium">Verify New File</span>
                <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/history"
                className="group flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/40 p-3 transition-colors hover:border-primary/40 hover:bg-secondary/70"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <History className="size-4" />
                </div>
                <span className="text-sm font-medium">View History</span>
                <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                onClick={handleDownloadReports}
                className="group flex w-full items-center gap-3 rounded-lg border border-border/60 bg-secondary/40 p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary/70"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {isPremium ? <Download className="size-4" /> : <Lock className="size-4" />}
                </div>
                <span className="text-sm font-medium">Download Previous Reports</span>
                <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Premium Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.2 }}
      >
        <Card className="glass-panel">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="size-4 text-warning" />
              {isPremium ? 'Your Premium Features' : 'Premium Features'}
            </CardTitle>
            {!isPremium && (
              <Button variant="ghost" size="sm" render={<Link href="/pricing" />}>
                View Plans
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {premiumFeatures.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/40 p-3.5"
                >
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {!isPremium && (
              <Button
                className="gradient-brand mt-5 w-full text-primary-foreground"
                render={<Link href="/pricing" />}
              >
                <Crown className="size-4" />
                Upgrade to Premium
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
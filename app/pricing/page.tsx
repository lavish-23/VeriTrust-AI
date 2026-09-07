'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Zap } from 'lucide-react'
import { SiteNav } from '@/components/landing/site-nav'
import { SiteFooter } from '@/components/landing/site-footer'
import { Button } from '@/components/ui/button'

const freePlan = {
  name: 'Free',
  price: '₹0',
  period: 'month',
  badge: 'Free',
  features: [
    '1 Free Verification',
    'Basic Authenticity Score',
    'Limited Report',
    'Image & Document support',
  ],
  cta: 'Start Free',
  ctaHref: '/signup',
  highlight: false,
}

const premiumPlan = {
  name: 'Premium',
  price: '₹299',
  period: 'month',
  badge: 'Most Popular',
  features: [
    'Unlimited Verifications',
    'Cross-Modal Detection',
    'Detailed AI Explanations',
    'Downloadable PDF Reports',
    'Scan History (90 days)',
    'Priority Processing',
    'API Access',
    'Video & Audio support',
    'SOC 2 aligned',
  ],
  cta: 'Get Premium',
  highlight: true,
}

export default function PricingPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(false)

  async function handleGetPremium() {
    setCheckingAuth(true)
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      if (res.ok) {
        router.push('/payment')
      } else {
        router.push('/signup?plan=premium')
      }
    } catch {
      router.push('/signup?plan=premium')
    } finally {
      setCheckingAuth(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />

      <main className="flex-1 pt-24 pb-24">
        {/* Background */}
        <div className="pointer-events-none absolute inset-x-0 top-24 -z-10 h-[400px] overflow-hidden">
          <div className="mx-auto h-full max-w-4xl">
            <div className="absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-[100px]" />
            <div className="absolute left-1/4 top-20 h-40 w-64 rounded-full bg-accent/10 blur-[80px]" />
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 md:px-6">
          {/* Header */}
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Zap className="size-3.5 text-accent" />
              Simple Pricing
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              Simple, Transparent{' '}
              <span className="text-gradient">Pricing</span>
            </h1>
            <p className="mt-4 mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Start for free with one verification, then upgrade to Premium for unlimited access
              to all features and media types.
            </p>
          </div>

          {/* Plans */}
          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
            {/* Free plan */}
            <div className="glass rounded-3xl border border-border/60 p-8">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex rounded-full border border-border/60 bg-secondary/60 px-3 py-0.5 text-xs font-semibold text-muted-foreground">
                    {freePlan.badge}
                  </span>
                  <h2 className="mt-3 text-xl font-semibold text-foreground">{freePlan.name}</h2>
                </div>
              </div>
              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-bold text-foreground">{freePlan.price}</span>
                <span className="mb-1 text-sm text-muted-foreground">/{freePlan.period}</span>
              </div>

              <ul className="mt-7 space-y-3">
                {freePlan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant="outline"
                size="lg"
                className="mt-8 w-full"
                render={<Link href={freePlan.ctaHref} />}
              >
                {freePlan.cta}
              </Button>
            </div>

            {/* Premium plan */}
            <div className="relative rounded-3xl p-px shadow-2xl shadow-primary/20">
              {/* Gradient border */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/60 via-accent/40 to-primary/30" />
              <div className="glass-strong relative rounded-3xl p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="gradient-brand inline-flex rounded-full px-3 py-0.5 text-xs font-semibold text-primary-foreground shadow shadow-primary/20">
                      {premiumPlan.badge}
                    </span>
                    <h2 className="mt-3 text-xl font-semibold text-foreground">{premiumPlan.name}</h2>
                  </div>
                </div>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-4xl font-bold text-foreground">{premiumPlan.price}</span>
                  <span className="mb-1 text-sm text-muted-foreground">/{premiumPlan.period}</span>
                </div>

                {/* Glow ring */}
                <div className="pointer-events-none absolute -inset-[1px] rounded-3xl opacity-0 ring-2 ring-primary/30 ring-offset-2 ring-offset-background" />

                <ul className="mt-7 space-y-3">
                  {premiumPlan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  className="gradient-brand mt-8 w-full text-primary-foreground"
                  onClick={handleGetPremium}
                  disabled={checkingAuth}
                >
                  {checkingAuth && <Loader2 className="size-4 animate-spin" />}
                  {premiumPlan.cta}
                </Button>
              </div>
            </div>
          </div>

          {/* Trust note */}
          <p className="mt-10 text-center text-sm text-muted-foreground">
            All plans include a 30-day money-back guarantee. No contracts. Cancel anytime.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

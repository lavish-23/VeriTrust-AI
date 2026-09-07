'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ImageUp, Loader2, ScanLine, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const PREMIUM_AMOUNT = 299

interface AccountUser {
  firstName: string
  lastName: string
  email: string
}

export default function PaymentPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<AccountUser | null>(null)

  const [receipt, setReceipt] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
        const data = await res.json()
        if (!res.ok || !data.success) {
          router.replace('/login?next=/payment')
          return
        }
        setUser(data.user)
      } catch {
        router.replace('/login?next=/payment')
        return
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!receipt) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(receipt)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [receipt])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setReceipt(f)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!receipt) {
      toast.error('Upload a screenshot of your payment receipt first')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('receipt', receipt)

      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Could not confirm payment. Please try again.')
        return
      }

      toast.success('Payment received — welcome to Premium!')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Payment failed:', error)
      toast.error('Unable to connect to the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-semibold tracking-tight">Upgrade to Premium</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Scan the QR code to pay, then upload your receipt to unlock Premium.
      </p>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Paying as</p>
          <p className="text-xs text-muted-foreground">
            {user ? `${user.firstName} ${user.lastName} · ${user.email}` : '—'}
          </p>
        </div>
        <p className="text-lg font-bold text-foreground">₹{PREMIUM_AMOUNT}</p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-secondary/20 p-5">
        <img
          src="/payment-qr.jpeg"
          alt="Scan to pay QR code"
          className="size-48 rounded-lg border border-border/60 bg-white object-contain p-2"
        />
        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <ScanLine className="size-4 text-primary" />
          Scan &amp; Pay ₹{PREMIUM_AMOUNT}
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Use any UPI app to scan this code and complete the payment, then upload your receipt below.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="receipt">Payment receipt</Label>
          <label
            htmlFor="receipt"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-secondary/20 px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-secondary/40"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Receipt preview" className="max-h-40 rounded-lg object-contain" />
            ) : (
              <>
                <ImageUp className="size-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload a screenshot of your payment confirmation
                </span>
              </>
            )}
            <input
              id="receipt"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          {receipt && (
            <p className="flex items-center gap-1.5 text-xs text-success">
              <CheckCircle2 className="size-3.5" />
              {receipt.name}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={submitting || !receipt}
          className="w-full gradient-brand text-primary-foreground"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}
          {submitting ? 'Confirming...' : "I've Paid — Unlock Premium"}
        </Button>
      </form>
    </AuthShell>
  )
}

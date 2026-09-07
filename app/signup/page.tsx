'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth/auth-shell'
import { GoogleButton } from '@/components/auth/google-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const intendedPlan = searchParams.get('plan')

  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    organization: '',
    email: '',
    password: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { id, value } = e.target

    setForm((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || 'Unable to create account')
        return
      }

      toast.success('Account created successfully!')

      router.push(intendedPlan === 'premium' ? '/payment' : '/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Signup request failed:', error)

      toast.error('Unable to connect to the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-semibold tracking-tight">
        Create your account
      </h1>

      <p className="mt-1.5 text-sm text-muted-foreground">
        Start verifying digital content in minutes.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>

            <Input
              id="firstName"
              placeholder="First name"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>

            <Input
              id="lastName"
              placeholder="Last name"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="organization">Organization</Label>

          <Input
            id="organization"
            placeholder="Your organization"
            value={form.organization}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>

          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>

          <Input
            id="password"
            type="password"
            placeholder="Create a strong password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full gradient-brand text-primary-foreground"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        OR
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton label="Sign up with Google" />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>

      <div className="mt-4 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to home
        </Link>
      </div>
    </AuthShell>
  )
}
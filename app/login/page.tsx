'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth/auth-shell'
import { GoogleButton } from '@/components/auth/google-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()

  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || 'Invalid email or password')
        return
      }

      toast.success(`Welcome back, ${data.user.firstName}!`)

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Login request failed:', error)

      toast.error(
        'Unable to connect to the server. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-semibold tracking-tight">
        Sign in
      </h1>

      <p className="mt-1.5 text-sm text-muted-foreground">
        Access your verification workspace.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Gmail</Label>

          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">
              Password
            </Label>

            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <Input
              id="password"
              type={show ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />

            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={
                show
                  ? 'Hide password'
                  : 'Show password'
              }
            >
              {show ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full gradient-brand text-primary-foreground"
        >
          {loading && (
            <Loader2 className="size-4 animate-spin" />
          )}

          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />

        OR

        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton label="Sign in with Google" />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-primary hover:underline"
        >
          Create one
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
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Menu,
  Bell,
  Plus,
  Key,
  LogOut,
  Loader2,
  User as UserIcon,
  Crown,
  History,
  Building2,
  CheckCircle2,
} from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

type User = {
  id: string
  firstName: string
  lastName: string
  organization?: string
  email: string
  provider?: 'credentials' | 'google'
  isPremium?: boolean
}

export function AppTopbar({ onMenu }: { onMenu?: () => void }) {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setUser(data.user)
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      } finally {
        setLoadingUser(false)
      }
    }

    loadUser()
  }, [])

  async function handleLogout() {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        router.replace('/login')
        router.refresh()
      } else {
        console.error('Logout failed')
        setLoggingOut(false)
      }
    } catch (error) {
      console.error('Logout request failed:', error)
      setLoggingOut(false)
    }
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '--'

  const fullName = user
    ? `${user.firstName} ${user.lastName}`
    : 'Loading...'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl md:px-6">
      <button
        onClick={onMenu}
        className="rounded-md p-2 text-muted-foreground hover:bg-secondary lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          className="gradient-brand hidden text-primary-foreground sm:inline-flex"
          render={<Link href="/scan/upload" />}
        >
          <Plus className="size-4" />
          New Verification
        </Button>

        <button
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
        </button>

        {/* Profile Pill & Dropdown Info Card */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2.5 rounded-xl border border-transparent p-1.5 pr-3 transition-all hover:border-border/60 hover:bg-secondary/50 focus:outline-none"
            disabled={loadingUser}
          >
            <Avatar className="size-8.5 ring-2 ring-primary/20">
              <AvatarFallback className="gradient-brand text-xs font-semibold text-primary-foreground">
                {loadingUser ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  initials
                )}
              </AvatarFallback>
            </Avatar>

            <div className="hidden text-left leading-tight sm:block">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                {fullName}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.organization || 'VeriTrust'}
              </p>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-72 p-2 shadow-2xl backdrop-blur-2xl">
            {/* User Info Header Block */}
            <div className="p-2 font-normal">
              <div className="flex items-center gap-3">
                <Avatar className="size-11 ring-2 ring-primary/30">
                  <AvatarFallback className="gradient-brand text-sm font-bold text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-foreground">
                      {fullName}
                    </p>
                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email || 'No email registered'}
                  </p>
                </div>
              </div>

              {/* Status / Plan Badges */}
              <div className="mt-3 flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="size-3.5" />
                  <span className="truncate max-w-[100px]">
                    {user?.organization || 'VeriTrust'}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning">
                  <Crown className="size-3" />
                  {user?.isPremium ? 'Premium' : 'Free Plan'}
                </span>
              </div>
            </div>

            <DropdownMenuSeparator className="my-1.5" />

            {/* Nav Items */}
            <DropdownMenuItem
              render={<Link href="/profile" className="flex w-full items-center gap-2.5 cursor-pointer" />}
            >
              <UserIcon className="size-4 text-muted-foreground" />
              <span>User Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              render={<Link href="/history" className="flex w-full items-center gap-2.5 cursor-pointer" />}
            >
              <History className="size-4 text-muted-foreground" />
              <span>Scan History</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              render={<Link href="/pricing" className="flex w-full items-center gap-2.5 cursor-pointer" />}
            >
              <Crown className="size-4 text-warning" />
              <span>Subscription &amp; Plans</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              render={<Link href="/api" className="flex w-full items-center gap-2.5 cursor-pointer" />}
            >
              <Key className="size-4 text-muted-foreground" />
              <span>Developer API</span>
              <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                API Key
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1.5" />

            {/* Logout Action */}
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full cursor-pointer items-center gap-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              {loggingOut ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              <span className="font-medium">
                {loggingOut ? 'Signing out...' : 'Sign Out'}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
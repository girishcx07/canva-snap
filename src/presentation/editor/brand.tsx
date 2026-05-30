'use client'

// Canva Snap brand logo. Interactive (hover) gradient mark + wordmark, links home.

import { ZapIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export function BrandLogo({
  href = '/',
  showText = true,
  className,
}: {
  href?: string
  showText?: boolean
  className?: string
}) {
  return (
    <a
      href={href}
      className={cn('group flex items-center gap-2 font-semibold', className)}
      title="Canva Snap"
    >
      <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-6">
        <ZapIcon className="size-4" fill="currentColor" />
      </span>
      {showText && (
        <span className="text-sm tracking-tight">
          Canva<span className="text-violet-500">Snap</span>
        </span>
      )}
    </a>
  )
}

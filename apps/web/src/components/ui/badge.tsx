import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-white/20 px-2.5 py-0.5 text-[10px] tracking-[0.18em] text-white/70 uppercase',
        className,
      )}
      {...props}
    />
  )
}

import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/40',
        className,
      )}
      {...props}
    />
  )
}

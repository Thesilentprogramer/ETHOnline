import { cva, type VariantProps } from 'class-variance-authority'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const fieldStyles = cva('w-full text-sm outline-none', {
  variants: {
    tone: {
      dark: 'border border-[var(--rule)] bg-white text-[var(--fg)] placeholder:text-[var(--fg-faint)] focus:border-[var(--fg)]',
      light: 'border border-[var(--rule)] bg-white text-[var(--fg)] placeholder:text-[var(--fg-faint)] focus:border-[var(--fg)]',
    },
  },
  defaultVariants: { tone: 'light' },
})

export function Input({
  className,
  tone,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & VariantProps<typeof fieldStyles>) {
  return <input className={cn('h-10 rounded-xl px-3', fieldStyles({ tone }), className)} {...props} />
}

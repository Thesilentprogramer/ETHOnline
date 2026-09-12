import { cva, type VariantProps } from 'class-variance-authority'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const fieldStyles = cva('w-full text-sm outline-none', {
  variants: {
    tone: {
      dark: 'border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-white/40',
      light: 'border border-[#161410]/10 bg-white text-[#161410] placeholder:text-[#161410]/30 focus:border-[#161410]/25',
    },
  },
  defaultVariants: { tone: 'dark' },
})

export function Input({
  className,
  tone,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & VariantProps<typeof fieldStyles>) {
  return <input className={cn('h-10 rounded-xl px-3', fieldStyles({ tone }), className)} {...props} />
}

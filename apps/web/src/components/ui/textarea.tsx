import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { fieldStyles } from '@/components/ui/input'

export function Textarea({
  className,
  tone,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { tone?: 'dark' | 'light' }) {
  return (
    <textarea
      className={cn('min-h-28 resize-none rounded-xl bg-transparent', fieldStyles({ tone }), className)}
      {...props}
    />
  )
}

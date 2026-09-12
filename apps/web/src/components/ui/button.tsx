import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'press inline-flex items-center justify-center gap-2 rounded-full font-medium text-sm tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'btn-default bg-white text-black',
        outline: 'btn-outline liquid-glass border-0 bg-white/5 text-white',
        ghost: 'btn-ghost bg-transparent text-white/80',
        light: 'btn-light bg-[#161410] text-[#f6f4ef]',
        lightOutline: 'btn-light-outline border border-[#161410]/15 bg-transparent text-[#161410]',
      },
      size: {
        default: 'px-8 py-3.5',
        lg: 'px-8 py-3.5',
        sm: 'px-5 py-2 text-xs',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

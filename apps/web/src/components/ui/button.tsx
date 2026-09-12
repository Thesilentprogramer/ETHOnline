import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-medium text-sm tracking-wide transition-all duration-300 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-white text-black hover:bg-white/90 button-glow',
        outline: 'liquid-glass border-0 bg-white/5 text-white hover:bg-white/10',
        ghost: 'bg-transparent text-white/80 hover:text-white',
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

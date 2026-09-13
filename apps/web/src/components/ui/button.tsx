import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva('press font-medium focus-visible:outline-none disabled:pointer-events-none', {
  variants: {
    variant: {
      default: 'pill',
      outline: 'paper-btn',
      ghost: 'ghost-btn',
      light: 'pill',
      lightOutline: 'paper-btn',
    },
    size: {
      default: '',
      lg: 'pill-lg',
      sm: '',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

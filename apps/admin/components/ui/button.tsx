import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@white-label/ui'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-base text-label font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white shadow-sm hover:bg-primary-hover active:scale-[0.98]',
        secondary:
          'bg-surface text-text-primary border border-border hover:bg-hover active:scale-[0.98] dark:bg-[#111111] dark:border-[#2A2A2A] dark:hover:bg-[#1A1A1A]',
        ghost:
          'text-text-primary hover:bg-hover active:scale-[0.98] dark:hover:bg-[#111111]',
        outline:
          'border border-border bg-transparent text-text-primary hover:bg-hover active:scale-[0.98] dark:border-[#2A2A2A] dark:hover:bg-[#111111]',
        destructive:
          'bg-error text-white shadow-sm hover:bg-error-hover active:scale-[0.98]',
        success:
          'bg-success text-white shadow-sm hover:bg-success-hover active:scale-[0.98]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-base px-3 text-small',
        lg: 'h-11 rounded-base px-6 text-body',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

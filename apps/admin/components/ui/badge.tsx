import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@white-label/ui'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-small font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-white',
        secondary:
          'border-transparent bg-surface text-text-primary dark:bg-surface-2',
        outline:
          'text-text-primary border-border bg-transparent hover:bg-hover',
        success:
          'border-transparent bg-success-light text-success dark:bg-success/20 dark:text-success',
        error:
          'border-transparent bg-error-light text-error dark:bg-error/20 dark:text-error',
        warning:
          'border-transparent bg-warning-light text-warning dark:bg-warning/20 dark:text-warning',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

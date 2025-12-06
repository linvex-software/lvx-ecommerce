import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@white-label/ui'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-gray-900 text-white shadow hover:bg-gray-800',
        secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200',
        outline: 'text-gray-950 border-gray-200',
        success: 'border-transparent bg-emerald-100 text-emerald-700',
        destructive: 'border-transparent bg-rose-100 text-rose-700'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }


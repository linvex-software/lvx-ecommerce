import * as React from 'react'
import { cn } from '@white-label/ui'

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6', className)}
        {...props}
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-title-xl font-bold tracking-tight text-text-primary">{title}</h1>
          {description && (
            <p className="text-body text-text-secondary">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )
  }
)
PageHeader.displayName = 'PageHeader'

export { PageHeader }

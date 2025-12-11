import * as React from 'react'
import { cn } from '@white-label/ui'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-base border bg-input-background px-4 py-3 text-body text-text-primary',
          'placeholder:text-text-tertiary',
          'ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:text-text-tertiary',
          'resize-none transition-colors duration-200',
          // Dark mode
          'dark:bg-[#101010] dark:border-[#2A2A2A] dark:hover:border-[#3A3A3A] dark:focus-visible:border-[#3B82F6]',
          // States
          error
            ? 'border-error focus-visible:ring-error'
            : 'border-input-border hover:border-border-hover focus-visible:border-input-border-focus',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition h-10 px-4 py-2',
  {
    variants: {
      variant: {
        default: 'bg-black text-white',
        outline: 'border border-gray-300 bg-white text-black'
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3',
        lg: 'h-12 px-6'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}


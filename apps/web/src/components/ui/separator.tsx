import { cn } from '@/lib/utils'

interface SeparatorProps {
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function Separator({ className, orientation = 'horizontal' }: SeparatorProps) {
  return (
    <div
      className={cn(
        'border-border',
        orientation === 'horizontal' ? 'h-px w-full border-t' : 'w-px h-full border-l',
        className
      )}
    />
  )
} 
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

const toastStyles: Record<ToastType, string> = {
  success: `
    bg-green-500/12 border-green-500/25 text-green-800
    dark:bg-green-500/15 dark:border-green-500/30 dark:text-green-300
    shadow-[0_4px_20px_rgba(34,197,94,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]
  `,
  error: `
    bg-red-500/12 border-red-500/25 text-red-800
    dark:bg-red-500/15 dark:border-red-500/30 dark:text-red-300
    shadow-[0_4px_20px_rgba(239,68,68,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]
  `,
  info: `
    bg-blue-500/12 border-blue-500/25 text-blue-800
    dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-300
    shadow-[0_4px_20px_rgba(59,130,246,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]
  `,
  warning: `
    bg-amber-500/12 border-amber-500/25 text-amber-800
    dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300
    shadow-[0_4px_20px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]
  `,
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />,
  error: <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />,
  info: <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />,
}

export function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full sm:max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border',
            'backdrop-blur-xl backdrop-saturate-[180%]',
            'animate-in slide-in-from-right duration-300',
            toastStyles[toast.type]
          )}
        >
          {toastIcons[toast.type]}
          <span className="flex-1 text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}


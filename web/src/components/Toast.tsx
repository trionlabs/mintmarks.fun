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
    bg-green-500/10 border-green-500/20 text-green-700
    dark:text-green-400
  `,
  error: `
    bg-red-500/10 border-red-500/20 text-red-700
    dark:text-red-400
  `,
  info: `
    bg-blue-500/10 border-blue-500/20 text-blue-700
    dark:text-blue-400
  `,
  warning: `
    bg-yellow-500/10 border-yellow-500/20 text-yellow-700
    dark:text-yellow-400
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
            'flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm shadow-lg',
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


import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/contexts/ToastContext'
import { Sparkles, Info } from 'lucide-react'

export function Home() {
  const { showToast } = useToast()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: 'var(--page-badge-bg)',
            border: '1px solid var(--page-border-color)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <Sparkles className="h-4 w-4 text-[var(--Controls-Selected)]" />
          <span className="text-sm font-medium" style={{ color: 'var(--page-text-primary)' }}>
            Own Your Commitments
          </span>
        </div>
        <h1 
          className="text-4xl sm:text-5xl md:text-6xl font-bold"
          style={{ color: 'var(--page-text-primary)' }}
        >
          Marks of Your Life.{' '}
          <span style={{ color: 'var(--Controls-Selected)' }}>Unlocked.</span>
        </h1>
        <p 
          className="text-lg max-w-2xl mx-auto"
          style={{ color: 'var(--page-text-secondary)' }}
        >
          Transform your email event confirmations into verified NFT collectibles using zero-knowledge proofs.
        </p>
      </div>

      {/* Buttons Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
          <CardDescription>All button styles available in the design system</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button onClick={() => showToast('Default button clicked!', 'success')}>
            Default
          </Button>
          <Button variant="outline" onClick={() => showToast('Outline button!', 'info')}>
            Outline
          </Button>
          <Button variant="ghost" onClick={() => showToast('Ghost button!', 'info')}>
            Ghost
          </Button>
          <Button variant="secondary" onClick={() => showToast('Secondary!', 'info')}>
            Secondary
          </Button>
          <Button variant="destructive" onClick={() => showToast('Destructive action!', 'error')}>
            Destructive
          </Button>
          <Button variant="link">Link</Button>
        </CardContent>
      </Card>

      {/* Cards Demo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="default">
          <CardHeader>
            <CardTitle>Default Card</CardTitle>
            <CardDescription>With glassmorphic blur effect</CardDescription>
          </CardHeader>
          <CardContent>
            <p style={{ color: 'var(--page-text-secondary)' }}>
              This card uses the default glassmorphic styling.
            </p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Glass Card</CardTitle>
            <CardDescription>Alternative glass style</CardDescription>
          </CardHeader>
          <CardContent>
            <p style={{ color: 'var(--page-text-secondary)' }}>
              A different take on the glassmorphic design.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Demo */}
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Default Alert</AlertTitle>
          <AlertDescription>
            This is a default alert with glassmorphic styling.
          </AlertDescription>
        </Alert>

        <Alert variant="success">
          <Info className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            Your action was completed successfully.
          </AlertDescription>
        </Alert>

        <Alert variant="warning">
          <Info className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Please review this information carefully.
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Something went wrong. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}


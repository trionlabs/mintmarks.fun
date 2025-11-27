import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export function CreateMark() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <Card>
        <CardHeader>
          <CardTitle>Create Your Mark</CardTitle>
          <CardDescription>Select an email to create a verified NFT</CardDescription>
        </CardHeader>
        <CardContent>
          <p style={{ color: 'var(--page-text-muted)' }}>
            Coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}


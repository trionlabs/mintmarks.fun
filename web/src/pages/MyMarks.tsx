import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export function MyMarks() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <Card>
        <CardHeader>
          <CardTitle>My Marks</CardTitle>
          <CardDescription>Your verified NFT collection</CardDescription>
        </CardHeader>
        <CardContent>
          <p style={{ color: 'var(--page-text-muted)' }}>
            No marks yet. Create your first one!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}


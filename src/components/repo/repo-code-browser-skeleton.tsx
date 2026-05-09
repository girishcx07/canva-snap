import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const treeLineWidths = ['h-4 w-28', 'h-4 w-36', 'h-4 w-20']
const codeLineWidths = [
  'h-4 w-11/12',
  'h-4 w-8/12',
  'h-4 w-10/12',
  'h-4 w-6/12',
]

export function RepoCodeBrowserSkeleton() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 text-card-foreground">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Skeleton className="size-5 rounded-sm" />
              <Skeleton className="h-7 w-64 max-w-full" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-full max-w-2xl" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-7 w-20" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <Skeleton className="h-8 w-full" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-14 w-24" />
            <Skeleton className="h-14 w-24" />
            <Skeleton className="h-14 w-24" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <Card size="sm" className="lg:max-h-[calc(100svh-2rem)]">
          <CardHeader>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {Array.from({ length: 11 }, (_, index) => (
              <div key={index} className="flex h-8 items-center gap-2 px-2">
                <Skeleton className="size-3 rounded-sm" />
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton
                  className={treeLineWidths[index % treeLineWidths.length]}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-1">
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-28" />
            </div>
            <div className="overflow-hidden rounded-lg border">
              <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex flex-col gap-2 p-3">
                {Array.from({ length: 12 }, (_, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3"
                  >
                    <Skeleton className="h-4 w-8 justify-self-end" />
                    <Skeleton
                      className={codeLineWidths[index % codeLineWidths.length]}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

'use client'

// Presentations dashboard (home). Reuses the shadcn dashboard-01 shell
// (sidebar + header) with presentation-focused content: a gallery of decks
// plus quick create.

import { PencilRulerIcon, PlayIcon, PlusIcon } from 'lucide-react'

import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { createSampleProject } from '../sample-project'
import { SlideThumbnail } from '../editor/slide-navigator'

export function Dashboard() {
  const decks = [createSampleProject()]

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Presentations" value={String(decks.length)} />
            <Stat
              label="Total slides"
              value={String(decks.reduce((n, d) => n + d.slides.length, 0))}
            />
            <Stat label="Exports ready" value="HTML" />
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Your presentations</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {decks.map((deck) => (
                <Card key={deck.id} className="overflow-hidden pt-0">
                  <div className="flex justify-center border-b bg-muted/30 p-2">
                    <SlideThumbnail
                      project={deck}
                      slide={deck.slides[0]}
                      width={300}
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{deck.name}</CardTitle>
                    <CardDescription>{deck.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button size="sm" variant="outline" render={<a href="/editor" />}>
                      <PencilRulerIcon data-icon="inline-start" />
                      Edit
                    </Button>
                    <Button size="sm" render={<a href={`/present/${deck.id}`} />}>
                      <PlayIcon data-icon="inline-start" />
                      Present
                    </Button>
                  </CardContent>
                </Card>
              ))}

              <a
                href="/editor"
                className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground transition-colors hover:bg-muted/40"
              >
                <PlusIcon className="size-6" />
                <span className="text-sm font-medium">New presentation</span>
              </a>
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}

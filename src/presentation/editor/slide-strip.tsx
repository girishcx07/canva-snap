'use client'

// Bottom slide strip (Canva-style): horizontal thumbnails with selection,
// drag-to-reorder, duplicate, delete and add.

import { useState } from 'react'
import { CopyIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { SlideThumbnail } from './slide-navigator'
import type { EditorStore } from '../store'
import { useEditorStore } from '../store'

export function SlideStrip({ store }: { store: EditorStore }) {
  const project = useEditorStore(store, (s) => s.project)
  const currentSlideId = useEditorStore(store, (s) => s.currentSlideId)
  const [dragId, setDragId] = useState<string | null>(null)

  return (
    <div className="flex h-36 shrink-0 items-center gap-3 overflow-x-auto border-t bg-background px-3">
      {project.slides.map((slide, i) => (
        <div
          key={slide.id}
          draggable
          onDragStart={() => setDragId(slide.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragId && dragId !== slide.id) store.reorderSlide(dragId, i)
            setDragId(null)
          }}
          className="group/slide relative flex shrink-0 flex-col items-center gap-1"
        >
          <span className="text-[10px] text-muted-foreground">{i + 1}</span>
          <button
            onClick={() => store.selectSlide(slide.id)}
            className={cn(
              'overflow-hidden rounded-md border transition-colors',
              slide.id === currentSlideId
                ? 'border-primary ring-2 ring-primary'
                : 'border-border hover:border-primary/50',
            )}
          >
            <SlideThumbnail project={project} slide={slide} width={150} />
          </button>
          <div className="absolute top-4 right-1 hidden gap-0.5 group-hover/slide:flex">
            <Mini onClick={() => store.duplicateSlide(slide.id)} title="Duplicate">
              <CopyIcon />
            </Mini>
            <Mini onClick={() => store.deleteSlide(slide.id)} title="Delete">
              <Trash2Icon />
            </Mini>
          </div>
        </div>
      ))}

      <button
        onClick={() => store.addSlide()}
        className="grid h-[84px] w-[150px] shrink-0 place-items-center rounded-md border border-dashed text-muted-foreground hover:bg-muted/50"
        title="Add slide"
      >
        <PlusIcon className="size-5" />
      </button>
    </div>
  )
}

function Mini({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
}) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="grid size-5 place-items-center rounded bg-background/90 text-muted-foreground shadow-sm hover:text-foreground [&_svg]:size-3"
    >
      {children}
    </button>
  )
}

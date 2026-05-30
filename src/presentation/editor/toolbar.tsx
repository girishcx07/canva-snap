'use client'

// Top toolbar: project name, history, add slide, present, and export.

import { useState } from 'react'
import { DownloadIcon, PlayIcon, Redo2Icon, Undo2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import { BrandLogo } from './brand'
import {
  getExporter,
  listExporters,
  type ExportFormat,
} from '../export'
import type { EditorStore } from '../store'
import { useEditorStore } from '../store'

export function Toolbar({ store }: { store: EditorStore }) {
  const project = useEditorStore(store, (s) => s.project)
  const [exportOpen, setExportOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function runExport(format: ExportFormat) {
    setExportOpen(false)
    const exporter = getExporter(format)
    if (!exporter) return
    try {
      const result = await exporter.export(project, { scope: 'all-slides' })
      if (result.blob) {
        const url = URL.createObjectURL(result.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        a.click()
        URL.revokeObjectURL(url)
      }
      setStatus(`Exported ${format.toUpperCase()}`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Export failed')
    }
    setTimeout(() => setStatus(null), 3000)
  }

  return (
    <header className="relative flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3">
      <div className="flex items-center gap-1">
        <BrandLogo />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <Button size="icon-sm" variant="ghost" onClick={store.undo} disabled={!store.canUndo()}>
          <Undo2Icon />
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={store.redo} disabled={!store.canRedo()}>
          <Redo2Icon />
        </Button>
      </div>

      <input
        className="absolute left-1/2 w-64 -translate-x-1/2 rounded-md bg-transparent px-2 py-1 text-center text-sm font-medium outline-none hover:bg-muted focus:bg-muted"
        value={project.name}
        onChange={(e) => store.patchProject({ name: e.target.value })}
      />

      <div className="ml-auto flex items-center gap-2">
        {status && <span className="text-xs text-muted-foreground">{status}</span>}

        <div className="relative">
          <Button size="sm" variant="outline" onClick={() => setExportOpen((v) => !v)}>
            <DownloadIcon data-icon="inline-start" />
            Export
          </Button>
          {exportOpen && (
            <div className="absolute right-0 z-20 mt-1 flex w-40 flex-col rounded-lg border bg-popover p-1 shadow-md">
              {listExporters().map((exp) => (
                <button
                  key={exp.format}
                  disabled={!exp.available}
                  onClick={() => runExport(exp.format)}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                >
                  {exp.label}
                  {!exp.available && <span className="text-[10px] text-muted-foreground">soon</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button size="sm" render={<a href={`/present/${project.id}`} />}>
          <PlayIcon data-icon="inline-start" />
          Present
        </Button>
      </div>
    </header>
  )
}

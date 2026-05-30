// Export architecture. A single Exporter abstraction backs every target format
// (PNG / PDF / GIF / MP4 / HTML). Implementations are pluggable and registered
// here; the editor only talks to the registry, so renderers can be swapped or
// moved to a worker/server later without changing call sites.

import type { Project } from '../types'

export type ExportFormat = 'png' | 'pdf' | 'gif' | 'mp4' | 'html'

export type ExportScope = 'current-slide' | 'all-slides'

export type ExportOptions = {
  scope: ExportScope
  currentSlideId?: string
  scale?: number
  fps?: number
  quality?: number
}

export type ExportResult = {
  format: ExportFormat
  filename: string
  mimeType: string
  blob?: Blob
}

export type ExporterCapabilities = {
  animated: boolean
  multiSlide: boolean
}

export interface Exporter {
  format: ExportFormat
  label: string
  mimeType: string
  capabilities: ExporterCapabilities
  export(project: Project, options: ExportOptions): Promise<ExportResult>
}

export class ExportNotImplementedError extends Error {
  format: ExportFormat
  constructor(format: ExportFormat) {
    super(`The ${format.toUpperCase()} exporter is not implemented yet.`)
    this.name = 'ExportNotImplementedError'
    this.format = format
  }
}

const exporters = new Map<ExportFormat, Exporter>()

export function registerExporter(exporter: Exporter): void {
  exporters.set(exporter.format, exporter)
}

export function getExporter(format: ExportFormat): Exporter | undefined {
  return exporters.get(format)
}

export function listExporters(): Exporter[] {
  return [...exporters.values()]
}

// --- HTML exporter: a real, dependency-free baseline ------------------------
// Produces a self-contained document embedding the serialized project, which a
// standalone player bundle can hydrate. Proves the abstraction end-to-end.

registerExporter({
  format: 'html',
  label: 'HTML',
  mimeType: 'text/html',
  capabilities: { animated: true, multiSlide: true },
  async export(project) {
    const json = JSON.stringify(project)
    const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(project.name)}</title></head>
<body>
<div id="deck"></div>
<script type="application/json" id="project">${json.replace(/</g, '\\u003c')}</script>
<!-- Mount the presentation player bundle against #deck using #project. -->
</body>
</html>`
    return {
      format: 'html',
      filename: `${slug(project.name)}.html`,
      mimeType: 'text/html',
      blob: new Blob([html], { type: 'text/html' }),
    }
  },
})

// --- Raster / vector / video exporters: staged behind the same interface ----
// These intentionally fail loudly until their pipelines (canvas rasterizer,
// PDF writer, frame encoder) are implemented, rather than shipping a fake.

function staged(
  format: ExportFormat,
  label: string,
  mimeType: string,
  capabilities: ExporterCapabilities,
): Exporter {
  return {
    format,
    label,
    mimeType,
    capabilities,
    async export() {
      throw new ExportNotImplementedError(format)
    },
  }
}

registerExporter(staged('png', 'PNG', 'image/png', { animated: false, multiSlide: false }))
registerExporter(staged('pdf', 'PDF', 'application/pdf', { animated: false, multiSlide: true }))
registerExporter(staged('gif', 'GIF', 'image/gif', { animated: true, multiSlide: true }))
registerExporter(staged('mp4', 'MP4', 'video/mp4', { animated: true, multiSlide: true }))

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'presentation'
}

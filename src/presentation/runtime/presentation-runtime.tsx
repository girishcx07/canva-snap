'use client'

// Client entry for the presentation runtime route. Loads the edited project
// from storage (so it reflects editor changes), falling back to the bundled
// sample. Loading happens after mount to avoid a hydration mismatch.

import { useEffect, useState } from 'react'

import { createSampleProject } from '../sample-project'
import { loadProject } from '../storage'
import type { Project } from '../types'
import { Player } from './player'

export function PresentationRuntime({ projectId }: { projectId?: string }) {
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    const id = projectId ?? 'sample'
    setProject(loadProject(id) ?? createSampleProject())
  }, [projectId])

  if (!project) return null
  return (
    <Player
      project={project}
      onExit={() => {
        window.location.href = '/editor'
      }}
    />
  )
}

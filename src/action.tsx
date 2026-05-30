'use server'

// Server action surface (kept as the integration point for future server-side
// features such as AI slide/animation generation). The framework's action
// pipeline stays demonstrated without any demo data fetching.

export type SlideIdea = {
  title: string
  bullets: string[]
}

export async function generateSlideOutline(formData: FormData): Promise<SlideIdea> {
  const topic = String(formData.get('topic') ?? '').trim() || 'Untitled'
  // Placeholder for an AI provider call. Returns a deterministic outline today.
  return {
    title: topic,
    bullets: [
      `Why ${topic} matters`,
      `How ${topic} works`,
      `${topic} in practice`,
    ],
  }
}

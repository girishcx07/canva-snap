'use client'

// Shared, non-interactive slide thumbnail. Renders a slide's layers scaled down
// to a target pixel width. Used by the bottom slide strip and the dashboard.

import { LayerView } from '../registry'
import type { Project, Slide } from '../types'

export function SlideThumbnail({
  project,
  slide,
  width,
}: {
  project: Project
  slide: Slide
  width: number
}) {
  const scale = width / project.width
  return (
    <div
      className="overflow-hidden"
      style={{
        width,
        height: project.height * scale,
        background: slide.background,
        position: 'relative',
      }}
    >
      <div
        style={{
          width: project.width,
          height: project.height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
        }}
      >
        {slide.layers.map((layer) =>
          layer.hidden ? null : (
            <div
              key={layer.id}
              className="absolute"
              style={{
                left: layer.transform.x,
                top: layer.transform.y,
                width: layer.transform.width,
                height: layer.transform.height,
                opacity: layer.transform.opacity,
                transform: `rotate(${layer.transform.rotation}deg) scale(${layer.transform.scale})`,
              }}
            >
              <LayerView layer={layer} mode="present" />
            </div>
          ),
        )}
      </div>
    </div>
  )
}

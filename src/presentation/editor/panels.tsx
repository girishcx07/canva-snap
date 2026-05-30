"use client";

// Secondary-panel contents for the Canva-style sidebar. Asset libraries are
// external and keyless: Iconify (icons) and Openverse (images). Results are
// cached per query; clicking inserts a centered layer on the current slide.

import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

import { SlideThumbnail } from "./slide-navigator";

import {
  ANIMATION_CATEGORIES,
  createAnimationInstance,
  frameToCss,
  getPreset,
  presetsByCategory,
  sampleKeyframes,
} from "../engine/animation";
import { createCenteredLayer } from "../registry";
import { useEditorStore, type EditorStore } from "../store";
import { findLayer, uid } from "../doc";
import { TRIGGERS } from "../engine/events";
import { TEMPLATES } from "../templates";
import {
  listSavedTemplates,
  saveTemplate,
  type SavedTemplate,
} from "../storage";

type PanelProps = { store: EditorStore };

type DropPayload = {
  type: string;
  data?: Record<string, unknown>;
  iconify?: string;
};

function dragProps(payload: DropPayload) {
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) =>
      e.dataTransfer.setData("application/x-deck-element", JSON.stringify(payload)),
  };
}

function insert(
  store: EditorStore,
  type: string,
  patch?: Parameters<typeof createCenteredLayer>[2],
) {
  const layer = createCenteredLayer(type, store.getState().project, patch);
  if (layer) store.addLayer(layer);
}

function AddButton({
  label,
  onClick,
  payload,
}: {
  label: string;
  onClick: () => void;
  payload?: DropPayload;
}) {
  return (
    <button
      onClick={onClick}
      {...(payload ? dragProps(payload) : {})}
      className="cursor-grab rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted active:cursor-grabbing"
    >
      {label}
    </button>
  );
}

export function TextPanel({ store }: PanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <AddButton
        label="Add a heading"
        payload={{ type: "heading", data: { text: "Heading" } }}
        onClick={() => insert(store, "heading", { data: { text: "Heading" } })}
      />
      <AddButton
        label="Add a subheading"
        payload={{ type: "heading", data: { text: "Subheading" } }}
        onClick={() =>
          insert(store, "heading", {
            data: { text: "Subheading" },
            style: { fontSize: 32, fontWeight: 600 },
          })
        }
      />
      <AddButton
        label="Add body text"
        payload={{ type: "text", data: { text: "Body text" } }}
        onClick={() => insert(store, "text", { data: { text: "Body text" } })}
      />
    </div>
  );
}

export function CodePanel({ store }: PanelProps) {
  const items: { type: string; label: string; preview: React.ReactNode }[] = [
    {
      type: "code",
      label: "Code",
      preview: (
        <div className="flex flex-col gap-1 p-2">
          <span className="h-1 w-3/4 rounded bg-sky-400/70" />
          <span className="h-1 w-1/2 rounded bg-foreground/30" />
          <span className="h-1 w-2/3 rounded bg-foreground/30" />
        </div>
      ),
    },
    {
      type: "browser",
      label: "Browser",
      preview: (
        <div className="flex flex-col">
          <div className="flex items-center gap-0.5 border-b bg-muted px-1.5 py-1">
            <span className="size-1.5 rounded-full bg-[#ff5f57]" />
            <span className="size-1.5 rounded-full bg-[#febc2e]" />
            <span className="size-1.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="h-7 bg-background" />
        </div>
      ),
    },
    {
      type: "file-tree",
      label: "File tree",
      preview: (
        <div className="flex flex-col gap-1 p-2 text-[8px]">
          <span className="h-1 w-2/3 rounded bg-sky-400/70" />
          <span className="ml-2 h-1 w-1/2 rounded bg-foreground/30" />
          <span className="ml-2 h-1 w-1/2 rounded bg-foreground/30" />
        </div>
      ),
    },
    {
      type: "sandbox",
      label: "Sandbox",
      preview: (
        <div className="flex flex-col">
          <div className="h-2 bg-muted" />
          <div className="grid h-9 place-items-center bg-white text-[8px] text-slate-500">preview</div>
        </div>
      ),
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((it) => (
        <button
          key={it.type}
          {...dragProps({ type: it.type })}
          onClick={() => insert(store, it.type)}
          className="flex cursor-grab flex-col gap-1 rounded-lg border p-1.5 text-left hover:border-primary active:cursor-grabbing"
        >
          <div className="h-12 overflow-hidden rounded border bg-muted/30">{it.preview}</div>
          <span className="px-0.5 text-xs font-medium">{it.label}</span>
        </button>
      ))}
    </div>
  );
}

export function ShapesPanel({ store }: PanelProps) {
  const shapes = [
    { label: "Rectangle", shape: "rect" },
    { label: "Rounded", shape: "rounded" },
    { label: "Circle", shape: "circle" },
    { label: "Pill", shape: "pill" },
    { label: "Triangle", shape: "triangle" },
    { label: "Diamond", shape: "diamond" },
    { label: "Star", shape: "star" },
    { label: "Line", shape: "line" },
  ];
  const preview: Record<string, React.CSSProperties> = {
    rect: { borderRadius: 2 },
    rounded: { borderRadius: 10 },
    circle: { borderRadius: "50%" },
    pill: { borderRadius: 9999, height: 20 },
    triangle: { clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" },
    diamond: { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
    star: {
      clipPath:
        "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
    },
    line: { height: 4, borderRadius: 9999 },
  };
  return (
    <div className="grid grid-cols-3 gap-2">
      {shapes.map((s) => (
        <button
          key={s.shape}
          title={s.label}
          {...dragProps({ type: "shape", data: { shape: s.shape } })}
          onClick={() => insert(store, "shape", { data: { shape: s.shape } })}
          className="flex aspect-square cursor-grab items-center justify-center rounded-lg border hover:bg-muted active:cursor-grabbing"
        >
          <span className="size-8 bg-foreground/70" style={preview[s.shape]} />
        </button>
      ))}
    </div>
  );
}

export function AnimationsPanel({ store }: PanelProps) {
  const project = useEditorStore(store, (s) => s.project);
  const currentSlideId = useEditorStore(store, (s) => s.currentSlideId);
  const selected = useEditorStore(store, (s) => s.selectedLayerIds);
  const slide =
    project.slides.find((s) => s.id === currentSlideId) ?? project.slides[0];
  const layer = selected[0] ? findLayer(slide.layers, selected[0]) : undefined;

  if (!layer) {
    return (
      <p className="px-1 text-sm text-muted-foreground">
        Select an element to add animations.
      </p>
    );
  }
  const target = layer;

  // One animation per category: adding replaces any existing one in it.
  function apply(presetId: string, category: string) {
    const kept = target.animations.filter(
      (a) => getPreset(a.presetId)?.category !== category,
    );
    store.patchLayer(target.id, {
      animations: [...kept, createAnimationInstance(presetId)],
    });
  }

  function clear(category: string) {
    store.patchLayer(target.id, {
      animations: target.animations.filter(
        (a) => getPreset(a.presetId)?.category !== category,
      ),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {ANIMATION_CATEGORIES.map((category) => {
        const current = target.animations.find(
          (a) => getPreset(a.presetId)?.category === category,
        );
        return (
          <div key={category} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium capitalize">{category}</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => clear(category)}
                className={
                  "rounded-lg border px-2 py-3 text-xs hover:bg-muted " +
                  (!current ? "border-primary bg-primary/10 text-primary" : "")
                }
              >
                None
              </button>
              {presetsByCategory(category).map((preset) => (
                <PresetCard
                  key={preset.id}
                  presetId={preset.id}
                  label={preset.name}
                  active={current?.presetId === preset.id}
                  onClick={() => apply(preset.id, category)}
                  onHover={() => store.previewAnimation(target.id, preset.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Preset tile with a Canva-style hover preview (plays the animation on a dot).
function PresetCard({
  presetId,
  label,
  active,
  onClick,
  onHover,
}: {
  presetId: string;
  label: string;
  active: boolean;
  onClick: () => void;
  onHover?: () => void;
}) {
  const dot = useRef<HTMLSpanElement>(null);
  function preview() {
    onHover?.();
    const p = getPreset(presetId);
    if (!p || !dot.current) return;
    const frames = [0, 0.25, 0.5, 0.75, 1].map((o) => {
      const css = frameToCss(sampleKeyframes(p.keyframes, o));
      return { offset: o, transform: css.transform, opacity: css.opacity };
    });
    dot.current.animate(frames, {
      duration: p.defaultDurationMs,
      easing: "ease",
    });
  }
  return (
    <button
      onClick={onClick}
      onMouseEnter={preview}
      className={
        "flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs hover:bg-muted " +
        (active ? "border-primary bg-primary/10 text-primary" : "")
      }
    >
      <span className="grid h-6 w-full place-items-center overflow-hidden">
        <span ref={dot} className="size-3 rounded-sm bg-primary" />
      </span>
      {label}
    </button>
  );
}

export function TemplatesPanel({ store }: PanelProps) {
  const previews = useMemo(
    () => TEMPLATES.map((t) => ({ t, project: t.build() })),
    [],
  );
  const [saved, setSaved] = useState<SavedTemplate[]>([]);
  useEffect(() => setSaved(listSavedTemplates()), []);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Applying a template replaces the current deck.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {previews.map(({ t, project }) => (
          <button
            key={t.id}
            onClick={() => store.replaceProject(t.build())}
            className="flex flex-col gap-1 rounded-lg border p-1.5 text-left hover:border-primary"
          >
            <div className="overflow-hidden rounded border bg-muted/30">
              <SlideThumbnail
                project={project}
                slide={project.slides[0]}
                width={140}
              />
            </div>
            <span className="px-0.5 text-xs font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
          Your templates
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={() => {
          const p = store.getState().project;
          setSaved(saveTemplate(p.name || "Template", structuredClone(p)));
        }}
        className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
      >
        + Save current deck as template
      </button>

      {saved.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">
          No saved templates yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {saved.map((s) => (
            <button
              key={s.id}
              onClick={() => store.replaceProject(structuredClone(s.project))}
              className="flex flex-col gap-1 rounded-lg border p-1.5 text-left hover:border-primary"
            >
              <div className="overflow-hidden rounded border bg-muted/30">
                <SlideThumbnail
                  project={s.project}
                  slide={s.project.slides[0]}
                  width={140}
                />
              </div>
              <span className="truncate px-0.5 text-xs font-medium">
                {s.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Iconify (icons) -------------------------------------------------------

const iconCache = new Map<string, string[]>();

export function IconsPanel({ store }: PanelProps) {
  const [q, setQ] = useState("arrow");
  const [icons, setIcons] = useState<string[]>([]);

  useEffect(() => {
    const query = q.trim();
    if (!query) return setIcons([]);
    if (iconCache.has(query)) return setIcons(iconCache.get(query)!);
    const id = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=72`,
        );
        const j = (await r.json()) as { icons?: string[] };
        iconCache.set(query, j.icons ?? []);
        setIcons(j.icons ?? []);
      } catch {
        setIcons([]);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  async function add(name: string) {
    try {
      const svg = await (
        await fetch(`https://api.iconify.design/${name.replace(":", "/")}.svg`)
      ).text();
      insert(store, "svg", {
        data: { markup: svg },
        transform: { width: 120, height: 120 },
      });
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <SearchField value={q} onChange={setQ} placeholder="Search icons" />
      {icons.length === 0 && (
        <p className="px-1 text-xs text-muted-foreground">
          Type to search thousands of open-source icons.
        </p>
      )}
      <div className="grid grid-cols-5 gap-1 overflow-auto">
        {icons.map((name) => (
          <button
            key={name}
            title={name}
            {...dragProps({ type: "svg", iconify: name, data: {} })}
            onClick={() => add(name)}
            className="grid aspect-square cursor-grab place-items-center rounded-md border bg-muted/40 p-1.5 hover:bg-muted active:cursor-grabbing"
          >
            <img
              src={`https://api.iconify.design/${name.replace(":", "/")}.svg`}
              alt=""
              loading="lazy"
              className="size-full dark:invert"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Openverse (images) ----------------------------------------------------

type OpenverseImage = {
  id: string;
  url: string;
  thumbnail?: string;
  title?: string;
};
const imageCache = new Map<string, OpenverseImage[]>();

export function ImagesPanel({ store }: PanelProps) {
  const [q, setQ] = useState("");
  const [imgs, setImgs] = useState<OpenverseImage[]>([]);

  useEffect(() => {
    const query = q.trim();
    if (!query) return setImgs([]);
    if (imageCache.has(query)) return setImgs(imageCache.get(query)!);
    const id = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=20`,
        );
        const j = (await r.json()) as { results?: OpenverseImage[] };
        imageCache.set(query, j.results ?? []);
        setImgs(j.results ?? []);
      } catch {
        setImgs([]);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <SearchField value={q} onChange={setQ} placeholder="Search images" />
      {imgs.length === 0 && (
        <p className="px-1 text-xs text-muted-foreground">
          Search free images from Openverse.
        </p>
      )}
      <div className="grid grid-cols-2 gap-1.5 overflow-auto">
        {imgs.map((img) => (
          <button
            key={img.id}
            title={img.title}
            {...dragProps({ type: "image", data: { src: img.url, alt: img.title ?? "" } })}
            onClick={() =>
              insert(store, "image", {
                data: { src: img.url, alt: img.title ?? "" },
                transform: { width: 360, height: 240 },
              })
            }
            className="cursor-grab overflow-hidden rounded-md border hover:opacity-90 active:cursor-grabbing"
          >
            <img
              src={img.thumbnail ?? img.url}
              alt=""
              loading="lazy"
              className="h-20 w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <SearchIcon className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="h-8 pl-7"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

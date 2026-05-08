# rsc-example

This app starts from the Vite RSC template and layers shadcn/ui on top with the requested preset:

```sh
pnpm dlx shadcn@latest init --preset bciyuW6C --base base --template vite --pointer
```

The demo uses free public APIs to show the main React server feature boundaries:

- SSR: `src/root.tsx` fetches GitHub repo data and `src/framework/entry.ssr.tsx` streams it as HTML.
- RSC: `src/server-data.ts` fetches JSONPlaceholder todos inside the server component tree.
- Client: `src/components/demo/client-api-panel.tsx` hydrates a client island and fetches JSONPlaceholder users in the browser.
- Server actions: `src/action.tsx` keeps the starter counter and adds an Agify form action.
- Routing: `src/routes.ts` defines the app route table used by SSR status, RSC payloads, and client navigation.

## Run

```sh
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5173/`.

Useful endpoints:

- `/_.rsc` shows the RSC Flight payload.
- `/ssr`, `/rsc`, `/client`, `/actions`, and `/runtime` are route-specific demos.
- Add `_.rsc` to a route path for its Flight payload, for example `/rsc_.rsc`.
- `/?__nojs` renders the progressive server action path without hydration.

## Build

```sh
pnpm build
pnpm preview
```

## Stack

- Vite 8 with `@vitejs/plugin-rsc`
- React 19
- shadcn/ui Base UI components
- Tailwind CSS v4

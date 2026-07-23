---
title: "Why You Should Try Nano Kit"
description: "Four honest reasons to try Nano Kit, a lightweight state management ecosystem: performance, bundle size, first-class DI, and a unified architecture."
date: 2026-07-23
cover: ./cover.jpg
tags:
  - state-management
  - signals
  - bundling
---

I've spent the last couple of years building [Nano Kit](https://nano-kit.js.org) — a lightweight, modular state management ecosystem for modern web apps: [signals-based stores](https://nano-kit.js.org/store/), a [router](https://nano-kit.js.org/router/), [data fetching](https://nano-kit.js.org/query/), [i18n](https://nano-kit.js.org/intl/), and [SSR support](https://nano-kit.js.org/ssr/), all built on the same tiny reactive core.

It recently hit [1.0](https://github.com/TrigenSoftware/nano_kit/releases/tag/v1.0.0), and in this post I want to give you four honest reasons to try it.

## 1. It's fast

At the heart of Nano Kit is a push-pull reactivity system based on the algorithm from [alien-signals](https://github.com/stackblitz/alien-signals) — one of the fastest signal implementations in the JavaScript ecosystem.

I didn't use alien-signals directly, though. Nano Kit needed things it doesn't provide, so I built a dedicated fork called [Agera](https://github.com/TrigenSoftware/nano_kit/tree/main/packages/agera):

- **Signal lifecycles** — you can listen to signal activation and deactivation, which powers Nano Kit's mountable stores (run setup logic on first listener, clean up on last).
- **Real tree-shaking** — Agera is designed so that only the code you use ends up in your bundle; alien-signals is not well tree-shakable.

The result keeps almost all of alien-signals' raw speed. Here is how `@nano_kit/store` compares to other popular state management libraries in a [reactivity benchmark](https://github.com/TrigenSoftware/nano_kit/tree/main/packages/benchmarks/effect.js):

| Library | Latency avg (ns) | Throughput avg (ops/s) |
|---------|------------------|------------------------|
| alien-signals | 294.00 ± 2.24% | 3,559,763 |
| **@nano_kit/store** | **303.55 ± 0.75%** | **3,365,816** |
| svelte/store | 428.58 ± 0.61% | 2,479,118 |
| rxjs | 454.74 ± 0.07% | 2,250,397 |
| nanostores | 1,373.2 ± 5.96% | 952,399 |
| mobx | 3,474.7 ± 1.86% | 306,094 |
| valtio | 5,041.3 ± 11.46% | 254,109 |
| jotai | 9,454.6 ± 16.45% | 157,853 |
| effector | 24,885 ± 11.78% | 62,744 |
| @reatom/core | 59,430 ± 15.61% | 22,741 |

*Benchmark was run on AMD Ryzen 5 PRO 3400G with Node.js v24.14.1*

That's ~3.5× faster than nanostores and an order of magnitude faster than most atomic state managers — while shipping lifecycles and mountable stores on top.

## 2. It's small

Nano Kit exists largely because of [Nano Stores](https://github.com/nanostores/nanostores). I love its philosophy: atomic stores, mountable resources, logic moved out of components, and an obsessive focus on bundle size. Nano Kit keeps those principles and fixes the pain points I kept hitting — performance overhead, DX rough edges, and SSR issues.

Size stayed a first-class constraint the whole way:

- `@nano_kit/store` is **~2 kB** (minified & brotlied) with zero dependencies.
- Every package is designed API-first for **tree-shaking** — features are exported functions you compose (`mountable()`, `cacheTime()`, `mutations()`, …), not options on a monolithic class. If you don't import it, you don't ship it.
- Size budgets are enforced in CI with [size-limit](https://github.com/ai/size-limit), so it can't silently regress.

Yes, Nano Kit ends up slightly bigger than Nano Stores — it does a lot more. But compare a real app: here are bundle sizes for the same [weather app](https://github.com/TrigenSoftware/nano_kit/tree/main/examples/weather) implemented with different stacks:

| Stack | Raw Size | Gzipped Size |
|-------|----------|--------------|
| React + Nano Stores | 206.77 kB | 65.90 kB |
| React + **Nano Kit** | **211.32 kB** | **67.25 kB** |
| React + **Nano Kit + DI** | **212.49 kB** | **67.60 kB** |
| React + Reatom | 228.16 kB | 73.00 kB |
| React + TanStack Query | 232.63 kB | 72.42 kB |

*Bundled with Vite 8*

Both stacks include a store and a query layer, so this is an apples-to-apples comparison: ~1.3 kB gzipped over Nano Stores buys you the faster reactivity core, [typed cache keys](https://nano-kit.js.org/query/core-concepts/#cache-keys), and SSR support — and it's still smaller than the popular alternatives.

## 3. Dependency Injection is in its DNA

Most state managers treat DI as an afterthought or a userland pattern. In Nano Kit, DI is a [first-class citizen of the core package](https://nano-kit.js.org/store/core-concepts/#dependency-injection) — and it changes how you architect apps.

You define stores as injectable functions, and everything they depend on — the API transport, navigation, [cookies](https://nano-kit.js.org/ssr/cookies/) — arrives through `inject()`:

```ts
function EventsList$() {
  const api = inject(ApiService$)
  /* ... stores built on top of the injected transport */
}
```

This gives you three big wins:

- **Testing without mocking frameworks.** A test builds an `InjectionContext` with a mock transport and virtual navigation, and the store under test never knows the difference. No network stubs, no `vi.mock`, no module-level hacks — the store graph inside the context is fully isolated: its own query client, its own transport, its own navigation.

  ```ts
  const context = new InjectionContext([
    provide(LocationNavigation$, virtualNavigation('/', routes)),
    provide(ApiService$, new MockApiService())
  ])
  const { $events } = inject(EventsList$, context)
  ```

- **Storybook for free.** The same `provide(...)` lines in a decorator give every story realistic data with no backend running. A story can build its own context to show an empty state, another an error state.

  ```tsx
  const context = new InjectionContext([
    provide(LocationNavigation$, virtualNavigation('/', routes)),
    provide(ApiService$, new MockApiService())
  ])
  const meta = {
    component: EventsList,
    decorators: [
      Story => (
        <InjectionContextProvider
          context={context}
        >
          <Story />
        </InjectionContextProvider>
      )
    ]
  }
  ```
- **Safe SSR.** Each request gets its own injection context, so signal instances are isolated per request — no state leaking between users, which is a classic footgun for module-level stores.

And because the DI layer is tree-shakeable like everything else, apps that skip it pay nothing — the weather example above shows the full DI setup costing ~0.35 kB gzipped.

## 4. One ecosystem, one reactive core

This is the reason that ties everything together. The [router](https://nano-kit.js.org/router/), [query](https://nano-kit.js.org/query/), and [intl](https://nano-kit.js.org/intl/) packages aren't neighbors that happen to share a README — they're built *on* [`@nano_kit/store`](https://nano-kit.js.org/store/). If you already use the stores, most of the code those packages need is already in your bundle.

Compare this to a typical React Router + Redux + React Query stack. Great tools, but strangers to each other: each has its own internal machinery and its own weight, and you end up writing glue code in components to synchronize them. With Nano Kit, they integrate at the store level:

```ts
import { browserNavigation, searchParams, searchParam } from '@nano_kit/router'
import { client, queryKey } from '@nano_kit/query'

/* Router: URL search param as a signal */
const [$location, navigation] = browserNavigation({ /* routes */ })
const $page = searchParam(searchParams($location), 'page', v => (v ? Number(v) : 1))

/* Query: the page signal is a query parameter */
const { query } = client()
const [$episodes] = query(queryKey('episodes'), [$page], page =>
  fetch(`/api/episodes?page=${page}`).then(r => r.json())
)

/* Changing the URL updates $page and automatically triggers a refetch */
navigation.push('/episodes?page=2')
```

No effects wiring the router to the fetcher, no glue code in components. And since your logic lives entirely in the store layer, components stay pure — and the UI layer becomes swappable. Nano Kit ships adapters for React, Preact, and Svelte (plus Next.js and SvelteKit integrations), and the store code doesn't change between them.

The shared-core approach shows up in bundle sizes too. Here are frontend bundles for SSR implementations of the same [Rick and Morty app](https://github.com/TrigenSoftware/nano_kit/tree/main/examples/rick-and-morty):

| Stack | Raw Size | Gzipped Size | Raw Size `/characters` page |
|-------|----------|--------------|------------------------------|
| React + **Nano Kit SSR** | **236.62 kB** | **78.01 kB** | **223.87 kB** |
| React + TanStack Start | 374.95 kB | 117.43 kB | 364.59 kB |
| Next.js Pages Router + Nano Kit | 509.29 kB | 161.25 kB | 367.60 kB |
| Next.js App Router + Nano Kit | 946.14 kB | 292.69 kB | 470.21 kB |

*Bundled with Vite 8 / Next.js 16*

A fully server-rendered app with routing, data fetching, and hydration — at two-thirds the size of TanStack Start and a quarter of Next.js App Router. And if you'd rather compare the JS actually loaded on a page than the whole build output, the story holds: the `/characters` page ships ~60% of TanStack Start's JS and less than half of Next.js App Router's.

## Try it

If any of this resonates — an atomic store that's actually fast, a query layer with typed cache keys, DI that makes tests and Storybook trivial, and an ecosystem where the pieces were designed for each other:

- 📚 [Documentation](https://nano-kit.js.org) — start with the [introduction](https://nano-kit.js.org/getting-started/)
- 🎓 [Tutorial](https://nano-kit.js.org/tutorial/) — build an event board app step by step, from first store to SSR and testing
- 🛸 [Examples](https://nano-kit.js.org/examples/) — complete apps showing the whole kit in action
- ⭐ [GitHub](https://github.com/TrigenSoftware/nano_kit) — stars appreciated

No need to commit to anything: spin it up in a sandbox or a side project and see how it feels. If the ideas click, the rest of the kit will be there when you need it. Give it a try!

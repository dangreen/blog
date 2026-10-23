---
title: "Why You Should Try Nanoviews"
description: "Nanoviews 1.0 is out: a 4 kB UI library that builds real DOM once and lets signals update it in place. Four reasons to try it."
date: 2026-10-23
cover: ./cover.jpg
tags:
  - signals
  - bundling
  - ui
---

For the last three years, I've been building [Nanoviews](https://nanoviews.js.org), a small UI library on the same signals core as [Nano Kit](https://nano-kit.js.org). A view is a tree of plain function calls that builds real DOM nodes once, and the signals bound into it update those nodes in place: no JSX, no virtual DOM, no re-renders.

If you read my [post about Nano Kit 2.0](https://dangreen.blog/post/nano-kit-2-devtools-for-your-signals/), you've already seen Nanoviews at work: the DevTools panel from that post is a Nanoviews app.

Nanoviews just hit [1.0](https://github.com/TrigenSoftware/nanoviews/releases/tag/v1.0.0), and in this post I want to give you four reasons to try it. The quickest way to get a feel for it is the [weather example on StackBlitz](https://stackblitz.com/github/TrigenSoftware/nanoviews/tree/main/examples/weather/nano_kit?file=src/App.ts).

## 1. It's just functions and real DOM

Each HTML element has a factory named after its tag: attributes go in the first call, children in the second. A component is a function wrapped in `component$`, and its render runs once. Here's a whole todo list:

```ts
import { signal, length } from 'nanoviews/store'
import { form, input, ul, li, p, mount, component$, for_ } from 'nanoviews'

const Todos = component$(() => {
  const $todos = signal(['Release 1.0'])
  const $draft = signal('')

  return (
    form({
      onSubmit(event) {
        event.preventDefault()
        $todos(todos => [...todos, $draft()])
        $draft('')
      }
    })(
      input({
        placeholder: 'What next?',
        value: $draft
      }),
      ul()(
        for_($todos)(
          $todo => li()(
            $todo
          )
        )
      ),
      p()(
        'Total: ', length($todos)
      )
    )
  )
})

mount(Todos, document.querySelector('#app')!)
```

Typing writes `$draft`, submitting writes `$todos`, and only the nodes bound to them change: `for_` adds one `li`, and the counter's text node updates. The render never runs again, so there's nothing to memoize and no dependency arrays to keep in sync.

There's no compiler and no JSX transform either: views are plain JavaScript that runs as written, so you don't even need a build step. Here's a complete page that imports Nanoviews straight from a CDN:

```html
<div id="app"></div>
<script type="module">
  import { signal } from 'https://esm.sh/nanoviews@1/store'
  import { button, component$, mount } from 'https://esm.sh/nanoviews@1'

  const Counter = component$(() => {
    const $count = signal(0)

    return (
      button({
        onClick() {
          $count(count => count + 1)
        }
      })(
        'count is ', $count
      )
    )
  })

  mount(Counter, document.querySelector('#app'))
</script>
```

With TypeScript, every element, attribute, event and child is typed, so a misspelled attribute is a type error.

## 2. It's small

Nanoviews is around 4 kB gzipped for what a typical app imports, and a bit over 7 kB with every export, signals included. Every element, block and helper is a separate export, so you only ship what you use.

Here's what that means for a real app: the same [weather app](https://nanoviews.js.org/examples/weather/) built on different stacks.

| Stack | Raw Size | Gzipped Size |
|-------|----------|--------------|
| **Nanoviews + Nano Kit** | **27.98 kB** | **10.36 kB** |
| Solid + Nano Stores | 36.41 kB | 13.55 kB |
| Svelte + Nano Kit | 61.74 kB | 23.12 kB |
| React + Nano Kit | 211.39 kB | 66.49 kB |
| React + TanStack Query | 232.56 kB | 71.56 kB |

*The sum of the minified JS chunks that `vite build` emits for the browser. All rows were built with Vite 8 on the same day in October 2026.*

The gap holds for bigger apps. The [Rick and Morty encyclopedia](https://nanoviews.js.org/examples/rick-and-morty/), with routing and data fetching, is 17.75 kB gzipped with Nanoviews, 36.20 kB with Svelte and 73.70 kB with React, all three on the Nano Kit query and router, and 102.34 kB with React, TanStack Query and TanStack Router.

## 3. It's fast

Building the DOM once and updating it in place keeps the work small. Here's a [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) run from October 2026:

| Library | Duration | Memory |
|---------|----------|--------|
| Vue Vapor 3.6.0-rc.5 | 1.02 | 1.27 |
| Solid 1.9.3 | 1.02 | 1.01 |
| Svelte 5.42.1 | 1.07 | 1.14 |
| **Nanoviews 1.0** | **1.11** | **1.05** |
| Vue 3.5.39 | 1.18 | 1.47 |
| Preact 11 + Signals | 1.27 | 2.93 |
| Angular 22 (signals, zoneless) | 1.27 | 1.80 |
| React 19.2 | 1.36 | 2.03 |

*Geometric means of the slowdowns, each result divided by the fastest one in its test, so lower is better. Full results are on the [Nanoviews site](https://nanoviews.js.org/getting-started/#performance).*

Vue Vapor, Solid and Svelte are a little faster, but all three compile your templates or JSX. Nanoviews gets within 10% of them with plain function calls and no compiler of its own, it's ahead of Vue, Preact, Angular and React, and it uses the least memory after page load of anything in the table.

## 4. It comes with Nano Kit

Nanoviews gets its reactivity from the Nano Kit core, so everything built on that core binds into a view as it is: a query result, a URL parameter, a translated message or a value from `localStorage`, with no adapter in between.

```ts
import { localStored } from '@nano_kit/platform-web'
import { button, component$ } from 'nanoviews'

const $theme = localStored('theme', 'light')

const ThemeSwitch = component$(() => (
  button({
    onClick() {
      $theme(theme => theme === 'light' ? 'dark' : 'light')
    }
  })(
    'Theme: ', $theme
  )
))
```

That's how the Nano Kit DevTools panel is built: its stores are plain `@nano_kit/store`, and its views are Nanoviews. The rest of the toolbox is there too:

- [@nanoviews/router](https://nanoviews.js.org/router/) adds pages, nested layouts, code splitting, links and head management on top of `@nano_kit/router`.
- [Testing Library](https://nanoviews.js.org/testing/) and [Storybook](https://nanoviews.js.org/storybook/) have Nanoviews packages of their own.
- [Agent skills](https://nanoviews.js.org/getting-started/agent-skills/) teach your coding agent the API.

Server-side rendering isn't there yet: it's the next feature on the list. Until then, Nanoviews renders in the browser, which is all a single-page app or a widget needs.

## Try it

- 📚 [Documentation](https://nanoviews.js.org): start with the [introduction](https://nanoviews.js.org/getting-started/)
- ⚡ [Weather example on StackBlitz](https://stackblitz.com/github/TrigenSoftware/nanoviews/tree/main/examples/weather/nano_kit?file=src/App.ts): a complete app to poke at
- 🛸 [Examples](https://nanoviews.js.org/examples/): the Nano Kit example apps, built with Nanoviews
- ⭐ [GitHub](https://github.com/TrigenSoftware/nanoviews): stars appreciated

Spin it up in a sandbox or use it for a widget where every kilobyte counts, and see how it feels. Give it a try!

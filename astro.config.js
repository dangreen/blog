import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import mdx from '@astrojs/mdx'
import pagefind from 'astro-pagefind'
import tailwindcss from '@tailwindcss/vite'
import expressiveCode from 'astro-expressive-code'

export default defineConfig({
  site: 'https://dangreen.blog',
  integrations: [
    expressiveCode({
      useDarkModeMediaQuery: false,
      themeCssSelector: theme => (theme.type === 'dark' ? '.dark' : '.light'),
      themes: ['github-dark-default', 'github-light-default'],
      styleOverrides: {
        borderWidth: '1px',
        frames: {
          frameBoxShadowCssValue: 'none'
        }
      }
    }),
    sitemap(),
    mdx(),
    pagefind()
  ],
  vite: {
    plugins: [tailwindcss()]
  }
})

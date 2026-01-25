import type { APIContext } from 'astro'
import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import { selectPublished } from '~/utils'
import { Site } from '~/constants'

export async function GET(context: APIContext) {
  const posts = await selectPublished(getCollection('posts'))

  return rss({
    title: Site.Title,
    description: Site.Description,
    site: context.url.origin,
    items: posts.map(item => ({
      title: item.data.title,
      description: item.data.description,
      pubDate: item.data.date,
      link: `/${item.collection.replace(/s$/, '')}/${item.id}/`
    }))
  })
}

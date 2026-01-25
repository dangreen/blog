/* eslint-disable @typescript-eslint/no-magic-numbers */
import {
  type ClassValue,
  clsx
} from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Palette } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function stringToHash(string: string) {
  let hash = 0

  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i)

    hash = (hash << 5) - hash + char
    hash |= 0
  }

  return hash
}

export function getTagColor(tag: string) {
  const hash = stringToHash(tag)
  const index = hash % Palette.length
  const color = Palette.at(index)!

  return {
    light: `background-color: ${color.light.bg}; color: ${color.light.text};`,
    dark: `background-color: ${color.dark.bg}; color: ${color.dark.text};`
  }
}

export function readingTime(html: string) {
  const textOnly = html.replace(/<[^>]+>/g, '')
  const wordCount = textOnly.split(/\s+/).length
  const readingTimeMinutes = (wordCount / 200 + 1).toFixed()

  return readingTimeMinutes
}

interface Entity {
  data: {
    draft?: boolean | undefined
    date: Date
    tags?: string[] | undefined
    translation?: string | undefined
  }
}

function filterPublished<T extends Entity>(items: T[], translation = false) {
  return items
    .filter(item => !item.data.draft && (translation || !item.data.translation))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}

export async function selectPublished<T extends Entity>(items: T[] | Promise<T[]>) {
  return filterPublished(await items)
}

export async function selectPublishedAndTranslations<T extends Entity>(items: T[] | Promise<T[]>) {
  const published = filterPublished(await items, true)

  return published.reduce<[T[], T[]]>((acc, item) => {
    if (item.data.translation) {
      acc[1].push(item)
    } else {
      acc[0].push(item)
    }

    return acc
  }, [[], []])
}

export function selectTags<T extends Entity>(items: T[]) {
  return [...new Set(items.flatMap(item => item.data.tags || []))].sort()
}

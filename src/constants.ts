const now = /* @__PURE__ */ new Date()
const DECEMBER = 11
const JANUARY = 0
const WEEK_BEFORE_NEW_YEAR_START = 24
const WEEK_AFTER_NEW_YEAR_END = 7
const EMOJIS = ['💚', '🍀', '🌲', '☘️', '🌿', '🥑', '🌱', '🌳', '🥝', '🍏', '🟢', '🍋‍🟩', '🐉', '🦖']

function getRandomEmoji() {
  let emoji = ''

  if (
    (now.getMonth() === DECEMBER && now.getDate() >= WEEK_BEFORE_NEW_YEAR_START)
    || (now.getMonth() === JANUARY && now.getDate() <= WEEK_AFTER_NEW_YEAR_END)
  ) {
    emoji = '🎄'
  } else {
    emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]!
  }

  return emoji
}

export const Site = {
  Title: `dangreen's blog ${/* @__PURE__ */ getRandomEmoji()}`,
  Description: 'A blog about web development and programming.'
}

export const Giscus = {
  repo: 'trevortylerlee/astro-micro',
  repoId: 'R_kgDOL_6l9Q',
  category: 'Announcements',
  categoryId: 'DIC_kwDOL_6l9c4Cfk55'
}

export const Palette = [
  {
    light: {
      bg: 'oklch(90% 0.05 240)',
      text: 'oklch(40% 0.15 240)'
    },
    dark: {
      bg: 'oklch(35% 0.10 240)',
      text: 'oklch(85% 0.10 240)'
    }
  },
  {
    light: {
      bg: 'oklch(92% 0.06 280)',
      text: 'oklch(40% 0.18 280)'
    },
    dark: {
      bg: 'oklch(35% 0.12 280)',
      text: 'oklch(88% 0.08 280)'
    }
  },
  {
    light: {
      bg: 'oklch(93% 0.06 150)',
      text: 'oklch(35% 0.12 150)'
    },
    dark: {
      bg: 'oklch(32% 0.10 150)',
      text: 'oklch(85% 0.10 150)'
    }
  },
  {
    light: {
      bg: 'oklch(92% 0.05 25)',
      text: 'oklch(45% 0.15 25)'
    },
    dark: {
      bg: 'oklch(35% 0.12 25)',
      text: 'oklch(85% 0.10 25)'
    }
  },
  {
    light: {
      bg: 'oklch(93% 0.05 50)',
      text: 'oklch(40% 0.15 50)'
    },
    dark: {
      bg: 'oklch(35% 0.10 50)',
      text: 'oklch(85% 0.10 50)'
    }
  },
  {
    light: {
      bg: 'oklch(94% 0.06 85)',
      text: 'oklch(35% 0.12 85)'
    },

    dark: {
      bg: 'oklch(32% 0.10 85)',
      text: 'oklch(90% 0.10 85)'
    }
  },
  {
    light: {
      bg: 'oklch(92% 0.05 190)',
      text: 'oklch(35% 0.12 190)'
    },
    dark: {
      bg: 'oklch(32% 0.08 190)',
      text: 'oklch(85% 0.10 190)'
    }
  },
  {
    light: {
      bg: 'oklch(93% 0.05 340)',
      text: 'oklch(40% 0.15 340)'
    },
    dark: {
      bg: 'oklch(35% 0.12 340)',
      text: 'oklch(85% 0.10 340)'
    }
  }
]

const { classList } = document.documentElement

export function resolveThemeValue(themeValue: string | undefined) {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (themeValue) {
    case 'light':
    case 'dark':
      return themeValue
    case 'system':
    default:
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
}

export function toggleTheme(dark: boolean) {
  if (dark) {
    classList.add('dark')
    classList.remove('light')
  } else {
    classList.remove('dark')
    classList.add('light')
  }
}

export function getThemeValue(): string {
  return localStorage.getItem('theme') || 'system'
}

export function observeTheme(observer: (theme: string) => void) {
  let wasDark = classList.contains('dark')
  const mo = new MutationObserver((mutations) => {
    if (!mutations.some(mutation => mutation.attributeName === 'class')) {
      return
    }

    const isDark = classList.contains('dark')

    if (isDark && !wasDark) {
      observer('dark')
    } else if (!isDark && wasDark) {
      observer('light')
    }

    wasDark = isDark
  })

  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
}

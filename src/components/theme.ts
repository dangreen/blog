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
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function getThemeValue(): string {
  return localStorage.getItem('theme') || 'system'
}

export function observeTheme(observer: (theme: string) => void) {
  const documentElement = document.documentElement
  let wasPresent = documentElement.classList.contains('dark')
  const mo = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName !== 'class') {
        return
      }

      const isPresent = documentElement.classList.contains('dark')

      if (isPresent && !wasPresent) {
        observer('dark')
      } else if (!isPresent && wasPresent) {
        observer('light')
      }

      wasPresent = isPresent
    })
  })

  mo.observe(documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
}

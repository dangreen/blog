import { globalIgnores } from 'eslint/config'
import astroConfig from 'eslint-plugin-astro'
import baseConfig from '@trigen/eslint-config'
import bundlerConfig from '@trigen/eslint-config/bundler'
import tsTypeCheckedConfig from '@trigen/eslint-config/typescript-type-checked'
import reactConfig from '@trigen/eslint-config/react'
import env from '@trigen/eslint-config/env'

export default [
  globalIgnores(['**/dist/', '**/.astro/']),
  ...baseConfig,
  ...bundlerConfig,
  ...tsTypeCheckedConfig,
  ...reactConfig.map(config => ({
    ...config,
    ...config.files
      ? {
        files: ['**/*.astro', ...config.files]
      }
      : {}
  })),
  env.browser,
  env.node,
  {
    files: ['!**/*.astro'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    files: ['**/*.astro'],
    settings: {
      react: {
        version: '99.99.99'
      }
    },
    rules: {
      'react/no-unknown-property': 'off',
      'react/jsx-key': 'off',
      '@stylistic/jsx-one-expression-per-line': 'off',
      'react/no-unescaped-entities': 'off',
      'import/unambiguous': 'off',
      'react/style-prop-object': 'off',
      'react/jsx-no-undef': 'off',
      '@stylistic/jsx-pascal-case': 'off'
    }
  },
  ...astroConfig.configs.recommended // ,
  // ...astroConfig.configs['jsx-a11y-strict']
]

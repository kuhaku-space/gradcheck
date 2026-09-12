import { useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'
const storageKey = 'gradcheck-theme'

function readTheme(): Theme {
  try {
    const value = localStorage.getItem(storageKey)
    if (value === 'light' || value === 'dark') return value
  } catch {
    // 保存できない環境でもテーマを切り替えられるようにする。
  }
  return 'system'
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    : theme
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = resolveTheme(theme)
}

// React の初回描画前に保存済みのテーマを適用する。
applyTheme(readTheme())

export function ThemeSelector() {
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(theme))

  useEffect(() => {
    applyTheme(theme)
    setResolvedTheme(resolveTheme(theme))
    try {
      localStorage.setItem(storageKey, theme)
    } catch {
      // ストレージが使えない場合はこの画面内だけで設定を保持する。
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (theme === 'system') {
        applyTheme(theme)
        setResolvedTheme(resolveTheme(theme))
      }
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
  const label = `${nextTheme === 'light' ? 'ライト' : 'ダーク'}モードに切り替える`

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={label}
      title={label}
      onClick={() => setTheme(nextTheme)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {resolvedTheme === 'dark' ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </>
        ) : (
          <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
        )}
      </svg>
    </button>
  )
}

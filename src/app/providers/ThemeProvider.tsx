import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from '@/app/providers/ThemeContext'

const STORAGE_KEY = 'workout-challenge-theme'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

// Applied once at module load (before the first paint settles), so the
// class is already correct by the time React mounts — avoiding a flash of
// the wrong theme that a useEffect-only approach would cause.
const initialTheme = getInitialTheme()
document.documentElement.classList.toggle('dark', initialTheme === 'dark')

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

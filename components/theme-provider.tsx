"use client"

import * as React from "react"
 
type Theme = "light" | "dark" | "system"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
  suppressHydrationWarning?: boolean
}

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return ctx
}

const THEME_VALUES = ["light", "dark", "system"] as const

function isTheme(value: string): value is Theme {
  return THEME_VALUES.includes(value as Theme)
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  attribute = "class",
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light")

  React.useEffect(() => {
    const stored = window.localStorage.getItem(storageKey)
    if (stored && isTheme(stored)) {
      setThemeState(stored)
    }
  }, [storageKey])

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")

    const applyTheme = () => {
      const systemResolved = media.matches ? "dark" : "light"
      const nextResolved =
        theme === "system"
          ? enableSystem
            ? systemResolved
            : "light"
          : theme

      setResolvedTheme(nextResolved)

      const root = document.documentElement
      if (attribute === "class") {
        root.classList.remove("light", "dark")
        root.classList.add(nextResolved)
      } else {
        root.setAttribute(attribute, nextResolved)
      }
    }

    const handleChange = () => {
      if (theme === "system") {
        applyTheme()
      }
    }

    applyTheme()
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [attribute, enableSystem, theme])

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme)
      window.localStorage.setItem(storageKey, nextTheme)
    },
    [storageKey]
  )

  const contextValue = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [resolvedTheme, setTheme, theme]
  )

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

'use client';
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeEffect() {
  const { theme, resolvedTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Ensure component is mounted before accessing DOM
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get the actual current theme with proper fallbacks
  const getCurrentTheme = () => {
    if (!mounted) return 'light' // Default fallback

    // Priority: resolvedTheme > theme > systemTheme > document class > localStorage > default
    if (resolvedTheme) return resolvedTheme
    if (theme && theme !== 'system') return theme
    if (systemTheme) return systemTheme

    // Check document class as fallback
    if (typeof document !== 'undefined') {
      if (document.documentElement.classList.contains('dark')) return 'dark'
      if (document.documentElement.classList.contains('light')) return 'light'
    }

    // Check localStorage as last resort
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme')
      if (stored && stored !== 'system') return stored
    }

    return 'light' // Final fallback
  }

  const updateThemeColor = (currentTheme: string) => {
    // Enhanced color scheme with subtle gradients for better visual appeal
    const isDark = currentTheme === 'dark'
    const themeColor = isDark ? '#000000' : '#ffffff'
    const statusBarStyle = isDark ? 'black-translucent' : 'default'

    // Update theme-color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', themeColor)
    }

    // Update msapplication-TileColor meta tag
    const tileColorMeta = document.querySelector('meta[name="msapplication-TileColor"]')
    if (tileColorMeta) {
      tileColorMeta.setAttribute('content', themeColor)
    }

    // Update apple-mobile-web-app-status-bar-style for iOS
    const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (statusBarMeta) {
      statusBarMeta.setAttribute('content', statusBarStyle)
    }

    // Force browser to recognize the change
    document.documentElement.style.setProperty('--theme-color', themeColor)

    // Trigger a reflow to ensure changes are applied
    void document.documentElement.offsetHeight
  }

  // Initial theme setup with multiple attempts
  useEffect(() => {
    if (!mounted) return

    let attempts = 0
    const maxAttempts = 10

    const initializeTheme = () => {
      const currentTheme = getCurrentTheme()

      // Only proceed if we have a valid theme or reached max attempts
      if (currentTheme && currentTheme !== 'system' || attempts >= maxAttempts) {
        updateThemeColor(currentTheme)
        setIsInitialized(true)
        return
      }

      attempts++
      // Retry with exponential backoff
      setTimeout(initializeTheme, Math.min(100 * Math.pow(2, attempts), 1000))
    }

    initializeTheme()
  }, [mounted])

  // Handle theme changes after initialization
  useEffect(() => {
    if (!mounted || !isInitialized) return

    const currentTheme = getCurrentTheme()
    updateThemeColor(currentTheme)
  }, [theme, resolvedTheme, systemTheme, mounted, isInitialized])

  // Listen for manual theme changes and system theme changes
  useEffect(() => {
    if (!mounted) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue || 'light'
        updateThemeColor(newTheme === 'system' ? getCurrentTheme() : newTheme)
      }
    }

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system' || !theme) {
        updateThemeColor(e.matches ? 'dark' : 'light')
      }
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', handleSystemThemeChange)

    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [mounted, theme])

  // Force update on page visibility change (handles PWA resume)
  useEffect(() => {
    if (!mounted) return

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Small delay to ensure theme is properly loaded
        setTimeout(() => {
          const currentTheme = getCurrentTheme()
          updateThemeColor(currentTheme)
        }, 50)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [mounted])

  return null
}

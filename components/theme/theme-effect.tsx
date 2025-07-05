'use client';
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeEffect() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before accessing DOM
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const updateThemeColor = () => {
      // Use resolvedTheme for more reliable theme detection
      const currentTheme = resolvedTheme || theme
      const color = currentTheme === 'dark' ? '#000000' : '#ffffff'

      // Update theme-color meta tag
      const themeColorMeta = document.querySelector('meta[name="theme-color"]')
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', color)
      }

      // Update msapplication-TileColor meta tag
      const tileColorMeta = document.querySelector('meta[name="msapplication-TileColor"]')
      if (tileColorMeta) {
        tileColorMeta.setAttribute('content', color)
      }

      // Also update apple-mobile-web-app-status-bar-style for better iOS support
      const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
      if (statusBarMeta) {
        statusBarMeta.setAttribute('content', currentTheme === 'dark' ? 'black-translucent' : 'default')
      }

      // Force a repaint to ensure changes take effect
      document.documentElement.style.setProperty('--theme-color', color)
    }

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(updateThemeColor, 100)

    // Also update immediately
    updateThemeColor()

    return () => clearTimeout(timeoutId)
  }, [theme, resolvedTheme, mounted])

  // Listen for storage events to sync across tabs
  useEffect(() => {
    if (!mounted) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue
        const color = newTheme === 'dark' ? '#000000' : '#ffffff'

        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
        document.querySelector('meta[name="msapplication-TileColor"]')?.setAttribute('content', color)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [mounted])

  return null
}

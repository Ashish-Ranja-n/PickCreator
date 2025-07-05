'use client';
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function ThemeEffect() {
  const { theme, resolvedTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Ensure component is mounted before accessing DOM
  useEffect(() => {
    setMounted(true)

    // Early restoration from sessionStorage before theme provider initializes
    const earlyRestore = () => {
      const cachedColor = sessionStorage.getItem('current-theme-color')
      const cachedStyle = sessionStorage.getItem('current-status-bar-style')

      if (cachedColor && cachedStyle) {
        const themeColorMeta = document.querySelector('meta[name="theme-color"]')
        if (themeColorMeta) themeColorMeta.setAttribute('content', cachedColor)

        const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
        if (statusBarMeta) statusBarMeta.setAttribute('content', cachedStyle)

        document.documentElement.style.setProperty('--theme-color', cachedColor)
      }
    }

    earlyRestore()
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
    // Enhanced color scheme with subtle shades for better visual appeal
    const isDark = currentTheme === 'dark'
    // Use subtle shades instead of pure black/white
    const themeColor = isDark ? '#0a0a0a' : '#fafafa' // Very dark gray / Very light gray
    const statusBarStyle = isDark ? 'black-translucent' : 'default'

    // Store theme in sessionStorage for immediate access
    sessionStorage.setItem('current-theme-color', themeColor)
    sessionStorage.setItem('current-status-bar-style', statusBarStyle)

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

    // Update viewport meta tag theme-color for better PWA support
    const viewportMeta = document.querySelector('meta[name="viewport"]')
    if (viewportMeta) {
      const content = viewportMeta.getAttribute('content') || ''
      const updatedContent = content.replace(/theme-color=[^,]*,?/g, '').trim()
      viewportMeta.setAttribute('content', `${updatedContent}, theme-color=${themeColor}`.replace(/^,\s*/, ''))
    }

    // Force browser to recognize the change
    document.documentElement.style.setProperty('--theme-color', themeColor)

    // Multiple aggressive updates to ensure persistence
    const forceUpdate = () => {
      document.documentElement.style.setProperty('--theme-color', themeColor)

      // Re-update meta tags
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', themeColor)

      const statusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
      if (statusMeta) statusMeta.setAttribute('content', statusBarStyle)
    }

    // Immediate update
    forceUpdate()

    // Delayed updates to ensure persistence
    setTimeout(forceUpdate, 10)
    setTimeout(forceUpdate, 50)
    setTimeout(forceUpdate, 100)

    // Trigger a reflow to ensure changes are applied
    void document.documentElement.offsetHeight
  }

  // Initial theme setup with multiple attempts and immediate update
  useEffect(() => {
    if (!mounted) return

    // Immediate update for faster response
    const currentTheme = getCurrentTheme()
    updateThemeColor(currentTheme)

    let attempts = 0
    const maxAttempts = 5 // Reduced attempts for faster initialization

    const initializeTheme = () => {
      const currentTheme = getCurrentTheme()

      // Only proceed if we have a valid theme or reached max attempts
      if (currentTheme && currentTheme !== 'system' || attempts >= maxAttempts) {
        updateThemeColor(currentTheme)
        return
      }

      attempts++
      // Retry with shorter intervals for better responsiveness
      setTimeout(initializeTheme, Math.min(50 * Math.pow(1.5, attempts), 500))
    }

    // Small delay to allow theme provider to initialize
    setTimeout(initializeTheme, 10)
  }, [mounted])

  // Handle theme changes after initialization with immediate response
  useEffect(() => {
    if (!mounted) return

    const currentTheme = getCurrentTheme()
    updateThemeColor(currentTheme)

    // Additional update after a short delay to ensure persistence
    const timeoutId = setTimeout(() => {
      updateThemeColor(currentTheme)
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [theme, resolvedTheme, systemTheme, mounted])

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

  // Handle page navigation - this fixes the status bar reset issue
  useEffect(() => {
    if (!mounted) return

    // Restore theme immediately on page navigation
    const restoreTheme = () => {
      const currentTheme = getCurrentTheme()

      // Try to get cached values first for immediate restoration
      const cachedColor = sessionStorage.getItem('current-theme-color')
      const cachedStyle = sessionStorage.getItem('current-status-bar-style')

      if (cachedColor && cachedStyle) {
        // Immediate restoration from cache
        const themeColorMeta = document.querySelector('meta[name="theme-color"]')
        if (themeColorMeta) themeColorMeta.setAttribute('content', cachedColor)

        const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
        if (statusBarMeta) statusBarMeta.setAttribute('content', cachedStyle)

        document.documentElement.style.setProperty('--theme-color', cachedColor)
      }

      // Then do the full update
      updateThemeColor(currentTheme)
    }

    // Restore immediately on page change
    restoreTheme()
  }, [pathname, mounted])

  // Watch for meta tag changes and restore theme if needed
  useEffect(() => {
    if (!mounted) return

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target instanceof HTMLMetaElement) {
          const meta = mutation.target
          if (meta.name === 'theme-color' || meta.name === 'apple-mobile-web-app-status-bar-style') {
            const cachedColor = sessionStorage.getItem('current-theme-color')
            const cachedStyle = sessionStorage.getItem('current-status-bar-style')

            // If the meta tag was reset to default values, restore our theme
            if ((cachedColor && meta.name === 'theme-color' && meta.content === '#fafafa' && cachedColor !== '#fafafa') ||
                (cachedStyle && meta.name === 'apple-mobile-web-app-status-bar-style' && meta.content === 'default' && cachedStyle !== 'default')) {
              setTimeout(() => {
                const currentTheme = getCurrentTheme()
                updateThemeColor(currentTheme)
              }, 10)
            }
          }
        }
      })
    })

    observer.observe(document.head, {
      attributes: true,
      attributeFilter: ['content'],
      subtree: true
    })

    return () => observer.disconnect()
  }, [mounted])

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

'use client';
import { useTheme } from "next-themes"
import { useEffect } from "react"

export function ThemeEffect() {
  const { theme } = useTheme()

  useEffect(() => {
    const updateThemeColor = () => {
      const color = theme === 'dark' ? '#000000' : '#ffffff'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
      document.querySelector('meta[name="msapplication-TileColor"]')?.setAttribute('content', color)
    }

    updateThemeColor()
  }, [theme])

  return null
}

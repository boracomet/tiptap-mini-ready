import * as React from "react"

const readIsDarkMode = () => {
  const root = document.documentElement

  if (root.classList.contains("dark")) return true

  const dataTheme = root.getAttribute("data-theme")
  if (dataTheme === "dark") return true
  if (dataTheme === "light") return false

  const colorScheme = root.style.colorScheme
  if (colorScheme === "dark") return true
  if (colorScheme === "light") return false

  if (root.classList.contains("light")) return false

  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof document === "undefined") return false
    return readIsDarkMode()
  })

  React.useEffect(() => {
    const sync = () => setIsDarkMode(readIsDarkMode())
    sync()

    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    })

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", sync)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener("change", sync)
    }
  }, [])

  return isDarkMode
}

export default useTheme

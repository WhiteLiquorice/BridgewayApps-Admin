import { createContext, useContext, useMemo } from 'react'
import { useAuth } from './AuthContext'

const LayoutThemeContext = createContext(null)

const VALID_THEMES = ['modern', 'executive', 'minimal', 'classic']

const THEME_CONFIGS = {
  modern:    { navStyle: 'sidebar',      contentStyle: 'cards',  density: 'normal',  borderStyle: 'rounded' },
  executive: { navStyle: 'topbar',       contentStyle: 'tables', density: 'dense',   borderStyle: 'sharp' },
  minimal:   { navStyle: 'slim-sidebar', contentStyle: 'flat',   density: 'spacious', borderStyle: 'none' },
  classic:   { navStyle: 'tabs',         contentStyle: 'grid',   density: 'compact',  borderStyle: 'subtle' },
}

export function LayoutThemeProvider({ children }) {
  const { org } = useAuth()
  const layoutTheme = VALID_THEMES.includes(org?.layout_theme) ? org.layout_theme : 'modern'
  const themeConfig = useMemo(() => THEME_CONFIGS[layoutTheme], [layoutTheme])

  return (
    <LayoutThemeContext.Provider value={{ layoutTheme, themeConfig }}>
      {children}
    </LayoutThemeContext.Provider>
  )
}

export function useLayoutTheme() { return useContext(LayoutThemeContext) }

import { useLayoutTheme } from '../../context/LayoutThemeContext'

const SURFACE_STYLES = {
  modern:    'bg-gray-900 border border-gray-800 rounded-xl',
  executive: 'bg-gray-900 border border-gray-700 rounded',
  minimal:   'border-t border-gray-800/40 pt-6',
  classic:   'bg-gray-900 border border-gray-700 rounded-md shadow-sm',
}

export default function Surface({ children, className = '', padding = 'p-6' }) {
  const { layoutTheme } = useLayoutTheme()
  const base = SURFACE_STYLES[layoutTheme] || SURFACE_STYLES.modern
  return (
    <div className={`${base} ${padding} ${className}`}>
      {children}
    </div>
  )
}

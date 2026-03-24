import { useLayoutTheme } from '../context/LayoutThemeContext'
import ModernLayout from './layouts/ModernLayout'
import ExecutiveLayout from './layouts/ExecutiveLayout'
import MinimalLayout from './layouts/MinimalLayout'
import ClassicLayout from './layouts/ClassicLayout'

const LAYOUTS = {
  modern: ModernLayout,
  executive: ExecutiveLayout,
  minimal: MinimalLayout,
  classic: ClassicLayout,
}

export default function Layout() {
  const { layoutTheme } = useLayoutTheme()
  const LayoutComponent = LAYOUTS[layoutTheme] || ModernLayout
  return <LayoutComponent />
}

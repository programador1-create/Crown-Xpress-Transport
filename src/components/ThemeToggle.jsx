import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-crown-gold" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-crown-gold" />
      )}
    </button>
  )
}

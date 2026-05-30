import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-md transition-all ${theme === 'light' ? 'bg-white dark:bg-gray-700 shadow-sm text-yellow-500' : 'text-gray-500'}`}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-500' : 'text-gray-500'}`}
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-md transition-all ${theme === 'system' ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-500' : 'text-gray-500'}`}
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ThemeToggle;
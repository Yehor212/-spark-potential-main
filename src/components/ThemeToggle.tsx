import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('kopimaster_theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('kopimaster_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className={cn(
        'relative h-10 w-10 rounded-full overflow-hidden',
        'bg-gradient-to-br transition-all duration-500',
        theme === 'dark'
          ? 'from-indigo-900 via-purple-900 to-slate-900 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
          : 'from-amber-200 via-orange-300 to-yellow-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]',
        className
      )}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Stars for dark mode */}
      <AnimatePresence>
        {theme === 'dark' && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: i * 0.05 }}
                className="absolute h-1 w-1 bg-white rounded-full"
                style={{
                  top: `${15 + Math.random() * 50}%`,
                  left: `${15 + Math.random() * 50}%`,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Sun rays for light mode */}
      <AnimatePresence>
        {theme === 'light' && (
          <motion.div
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 0.3, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            className="absolute inset-0"
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 h-0.5 w-3 bg-orange-500 rounded-full origin-left"
                style={{
                  transform: `rotate(${i * 45}deg) translateX(10px)`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Moon/Sun icon */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{
          rotate: theme === 'dark' ? 0 : 360,
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <AnimatePresence mode="wait">
          {theme === 'dark' ? (
            <motion.div
              key="moon"
              initial={{ y: -20, opacity: 0, rotate: -30 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 20, opacity: 0, rotate: 30 }}
              transition={{ duration: 0.3 }}
            >
              <Moon className="h-5 w-5 text-purple-200" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ y: 20, opacity: 0, rotate: 30 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -20, opacity: 0, rotate: -30 }}
              transition={{ duration: 0.3 }}
            >
              <Sun className="h-5 w-5 text-amber-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Cloud for light mode */}
      <AnimatePresence>
        {theme === 'light' && (
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            className="absolute bottom-1 right-1 h-3 w-5 bg-white/60 rounded-full"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

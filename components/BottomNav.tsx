'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, Upload, GraduationCap, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/dashboard', label: 'Library', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload', icon: Upload, center: true },
  { href: '/exam', label: 'Exam', icon: GraduationCap },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800/80">
      <div className="flex items-end justify-around h-[60px] max-w-lg mx-auto px-1">
        {links.map(({ href, label, icon: Icon, exact, center }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/');

          if (center) {
            return (
              <Link key={href} href={href} className="flex-1 flex justify-center">
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  className="relative -mt-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #E6B566 0%, #D4994A 100%)' }}
                >
                  <Icon size={22} className="text-[#2C1810]" />
                  <span className="absolute inset-0 rounded-2xl ring-2 ring-white/30" />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative py-1.5 min-h-[44px] active:opacity-70 transition-opacity"
            >
              {/* Active top line — CSS only, no layoutId (avoids lag) */}
              <div
                className={cn(
                  'absolute top-0 left-3 right-3 h-[2.5px] rounded-b-full transition-all duration-200',
                  active ? 'bg-primary dark:bg-primary-300 opacity-100' : 'opacity-0'
                )}
              />
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.8}
                className={cn(
                  'transition-colors duration-150',
                  active ? 'text-primary dark:text-primary-300' : 'text-gray-400 dark:text-gray-500'
                )}
              />
              <span
                className={cn(
                  'text-[10px] leading-none font-sans font-medium transition-colors duration-150',
                  active ? 'text-primary dark:text-primary-300' : 'text-gray-400 dark:text-gray-500 opacity-80'
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
}

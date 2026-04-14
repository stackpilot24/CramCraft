'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Upload, LayoutDashboard, Brain, GraduationCap, Home, BarChart3, LogOut, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/store/useStudyStore';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/dashboard', label: 'Library', icon: LayoutDashboard },
  { href: '/exam', label: 'Exam', icon: GraduationCap },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/upload', label: 'Upload', icon: Upload },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isDark, toggle } = useThemeStore();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1A0E09]/40 dark:border-[#1A0E09]/80 bg-[#2C1810]/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 duration-200">
            <Brain size={17} className="text-[#2C1810]" />
          </div>
          <span className="font-serif text-lg sm:text-xl text-[#FDF6EC] hidden sm:block">
            CramCraft
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium font-sans transition-colors duration-150',
                  active
                    ? 'text-primary'
                    : 'text-[#FDF6EC]/60 hover:text-[#FDF6EC] hover:bg-white/10'
                )}
              >
                <Icon size={15} />
                <span className="hidden md:block">{label}</span>
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-xl bg-primary/15"
                    transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                  />
                )}
              </Link>
            );
          })}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="ml-1 p-2 rounded-xl text-[#FDF6EC]/60 hover:text-[#FDF6EC] hover:bg-white/10 transition-colors duration-150"
            aria-label="Toggle dark mode"
          >
            <motion.div
              key={isDark ? 'dark' : 'light'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.18 }}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </motion.div>
          </button>

          {/* Auth button */}
          {status === 'loading' ? (
            <div className="ml-1 w-8 h-8 rounded-full bg-white/10 animate-pulse" />
          ) : session ? (
            <div className="ml-1 flex items-center gap-1.5">
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? 'User'}
                  width={30}
                  height={30}
                  className="rounded-full ring-2 ring-primary/40"
                />
              ) : (
                <div className="w-[30px] h-[30px] rounded-full bg-primary flex items-center justify-center text-[#2C1810] text-xs font-bold font-sans">
                  {(session.user?.name ?? session.user?.email ?? 'U')[0].toUpperCase()}
                </div>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-1.5 rounded-lg text-[#FDF6EC]/50 hover:text-[#FDF6EC] hover:bg-white/10 transition-colors duration-150"
                aria-label="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-600 text-[#2C1810] text-xs font-medium font-sans transition-colors duration-150"
            >
              <LogIn size={13} />
              <span className="hidden sm:block">Sign in</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

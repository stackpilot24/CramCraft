import Link from 'next/link';
import {
  Upload,
  Sparkles,
  Brain,
  GraduationCap,
  ArrowRight,
  LayoutDashboard,
  Zap,
  BookOpen,
} from 'lucide-react';

// Pure Server Component — no 'use client', no Framer Motion, no API calls.
// Renders instantly on first request and is cached by Next.js.

const features = [
  {
    icon: Upload,
    title: 'Drop any file',
    desc: 'PDF or PPTX, up to 100 MB.',
    color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    delay: 'delay-[400ms]',
  },
  {
    icon: Sparkles,
    title: 'Smart revision sheets',
    desc: 'AI-generated visual study aids with icons & tables.',
    color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    delay: 'delay-[480ms]',
  },
  {
    icon: Brain,
    title: 'Spaced repetition',
    desc: 'SM-2 algorithm schedules reviews at the perfect time.',
    color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    delay: 'delay-[560ms]',
  },
  {
    icon: GraduationCap,
    title: 'Exam prep',
    desc: 'Curated Q&A ranked by importance for your exam.',
    color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    delay: 'delay-[640ms]',
  },
];

const quickLinks = [
  { href: '/dashboard', label: 'Library', icon: LayoutDashboard, delay: 'delay-[700ms]' },
  { href: '/study/all', label: 'Study due cards', icon: Zap, delay: 'delay-[760ms]' },
  { href: '/exam', label: 'Exam prep', icon: GraduationCap, delay: 'delay-[820ms]' },
  { href: '/stats', label: 'Stats', icon: BookOpen, delay: 'delay-[880ms]' },
];

export default function HomePage() {
  return (
    <div className="min-h-[85vh] flex flex-col">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-14 sm:py-20">
        {/* Badge */}
        <div className="animate-fade-up delay-[0ms] mb-5">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 dark:bg-primary/15 border border-primary/20 text-sm font-medium text-primary dark:text-primary-300 font-sans">
            <Sparkles size={13} />
            AI-powered spaced repetition
          </span>
        </div>

        {/* Heading */}
        <h1 className="animate-fade-up delay-[80ms] text-4xl sm:text-6xl font-serif text-gray-900 dark:text-gray-100 leading-tight mb-5 max-w-2xl">
          Turn any PDF or PPTX into{' '}
          <span className="text-primary dark:text-primary-300">mastery</span>
        </h1>

        {/* Subheading */}
        <p className="animate-fade-up delay-[160ms] text-base sm:text-lg text-gray-500 dark:text-gray-400 font-sans max-w-xl mb-10 leading-relaxed">
          Drop a lecture slide or textbook chapter. Get back AI-generated revision sheets
          and flashcards. Ace your exams with science-backed spaced repetition.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-[240ms] flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/upload"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-primary hover:bg-primary-700 text-[#2C1810] font-medium font-sans text-base transition-colors duration-200 shadow-sm w-full sm:w-auto"
          >
            <Upload size={18} />
            Upload PDF or PPTX
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-primary/40 hover:text-primary dark:hover:text-primary-300 font-medium font-sans text-base transition-colors duration-200 w-full sm:w-auto"
          >
            <LayoutDashboard size={17} />
            Go to Library
          </Link>
        </div>
      </section>

      {/* ── Feature cards ────────────────────────────────── */}
      <section className="pb-10 sm:pb-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`animate-fade-up ${f.delay} bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 shadow-card border border-gray-100 dark:border-gray-700 hover:border-primary/20 dark:hover:border-primary/20 hover:-translate-y-1 transition-all duration-200`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${f.color}`}>
                  <Icon size={18} />
                </div>
                <h3 className="font-serif text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-1 leading-snug">
                  {f.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-sans leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Quick links ───────────────────────────────────── */}
      <section className="pb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {quickLinks.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`animate-fade-up ${l.delay} inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:border-primary/40 hover:text-primary dark:hover:text-primary-300 transition-colors duration-150 font-sans`}
            >
              <Icon size={14} />
              {l.label}
            </Link>
          );
        })}
      </section>
    </div>
  );
}

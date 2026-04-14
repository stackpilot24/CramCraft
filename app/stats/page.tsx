'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Flame,
  Trophy,
  CalendarDays,
  BookOpen,
  TrendingUp,
  Home,
  Star,
  BarChart3,
} from 'lucide-react';
import { MasteryRing } from '@/components/MasteryChart';
import type { Deck, StreakData, StudyStats } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface StatsResponse {
  streak: StreakData;
  history: StudyStats[];
}

function buildHeatmapDays(history: StudyStats[]) {
  const map = new Map(history.map((s) => [s.date, s.cards_studied]));
  const days: { date: string; count: number; label: string; isToday: boolean; dayOfWeek: number; month: number; day: number }[] = [];
  const now = new Date();
  const todayKey = now.toISOString().split('T')[0];

  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({
      date: key,
      count: map.get(key) ?? 0,
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      isToday: key === todayKey,
      dayOfWeek: d.getDay(), // 0=Sun
      month: d.getMonth(),
      day: d.getDate(),
    });
  }
  return days;
}

function heatColor(count: number, isDark: boolean) {
  if (count === 0) return isDark ? '#3D2B1F' : '#E8D5C4';
  if (count <= 5)  return '#F5C85A';
  if (count <= 15) return '#E6B566';
  if (count <= 30) return '#D4994A';
  return '#B87D35';
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<{ label: string; count: number } | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    Promise.all([
      fetch('/api/stats').then((r) => r.json()),
      fetch('/api/decks').then((r) => r.json()),
    ]).then(([statsData, decksData]) => {
      setStats(statsData);
      setDecks(decksData ?? []);
    }).finally(() => setLoading(false));

    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5 animate-pulse">
        <div className="h-8 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="h-40 w-full bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        <div className="h-48 w-full bg-gray-100 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  const streak = stats?.streak;
  const history = stats?.history ?? [];
  const heatmap = buildHeatmapDays(history);
  const totalCardsAllTime = history.reduce((s, d) => s + d.cards_studied, 0);
  const avgMastery =
    decks.length > 0
      ? Math.round(decks.reduce((s, d) => s + d.mastery_percentage, 0) / decks.length)
      : 0;
  const sortedDecks = [...decks].sort((a, b) => b.mastery_percentage - a.mastery_percentage);
  // Build week columns (Sun→Sat per column)
  const weeks: typeof heatmap[] = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    weeks.push(heatmap.slice(i, i + 7));
  }

  // Month labels: show month name above first day-cell of each month in the grid
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthLabels: { weekIdx: number; name: string }[] = [];
  weeks.forEach((week, wi) => {
    week.forEach((day) => {
      if (day.day === 1 || (wi === 0 && day === week[0])) {
        // Show month label at first week that contains this month's 1st day
        if (!monthLabels.find((m) => m.weekIdx === wi)) {
          monthLabels.push({ weekIdx: wi, name: MONTHS[day.month] });
        }
      }
    });
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary dark:hover:text-primary-300 font-sans mb-2 transition-colors"
        >
          <Home size={12} />
          Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <BarChart3 size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-serif text-gray-900 dark:text-gray-100">Your Progress</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-sans">Study history and mastery overview</p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: Flame,
            color: 'text-orange-500',
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            label: 'Current streak',
            value: `${streak?.currentStreak ?? 0}d`,
          },
          {
            icon: Star,
            color: 'text-amber-500',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            label: 'Longest streak',
            value: `${streak?.longestStreak ?? 0}d`,
          },
          {
            icon: CalendarDays,
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            label: 'Days studied',
            value: streak?.totalDaysStudied ?? 0,
          },
          {
            icon: TrendingUp,
            color: 'text-green-500',
            bg: 'bg-green-50 dark:bg-green-900/20',
            label: 'Cards reviewed',
            value: totalCardsAllTime,
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-card flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                <Icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-xl font-serif text-gray-900 dark:text-gray-100">{s.value}</p>
                <p className="text-xs text-gray-500 font-sans">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity heatmap */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CalendarDays size={17} className="text-primary dark:text-primary-300" />
            Activity — last 90 days
          </h2>
          {hoveredDay && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-sans bg-gray-50 dark:bg-gray-700/60 px-2 py-0.5 rounded-lg">
              {hoveredDay.label} · <strong className="text-gray-800 dark:text-gray-100">{hoveredDay.count} cards</strong>
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          {/* Month labels row */}
          <div className="flex gap-[3px] mb-1 ml-[26px]">
            {weeks.map((_, wi) => {
              const label = monthLabels.find((m) => m.weekIdx === wi);
              return (
                <div key={wi} className="w-[18px] flex-shrink-0 text-[9px] font-sans text-gray-400 dark:text-gray-500 leading-none">
                  {label?.name ?? ''}
                </div>
              );
            })}
          </div>

          {/* Grid: day-of-week labels + week columns */}
          <div className="flex gap-[3px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-[3px]">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="w-[18px] h-[18px] flex items-center justify-center text-[9px] font-sans text-gray-400 dark:text-gray-500">
                  {i % 2 === 1 ? d : ''}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <div
                    key={day.date}
                    className="w-[18px] h-[18px] rounded-[3px] cursor-default transition-transform hover:scale-110 relative"
                    style={{
                      background: heatColor(day.count, isDark),
                      outline: day.isToday ? '2px solid #E6B566' : 'none',
                      outlineOffset: '1px',
                    }}
                    onMouseEnter={() => setHoveredDay({ label: day.label, count: day.count })}
                    onMouseLeave={() => setHoveredDay(null)}
                    title={`${day.label}: ${day.count} cards`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-4 text-[10px] text-gray-400 font-sans">
          <span>Less</span>
          {['#E8D5C4', '#F5C85A', '#E6B566', '#D4994A', '#B87D35'].map((c, i) => (
            <div key={i} className="w-[14px] h-[14px] rounded-[3px]" style={{ background: c }} />
          ))}
          <span>More</span>
          <span className="ml-auto flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-[2px] border-2 border-primary" />
            Today
          </span>
        </div>
      </div>

      {/* Today's activity */}
      {(streak?.todayCount ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary/8 dark:bg-primary/15 border border-primary/20 dark:border-primary/30 rounded-2xl p-4 flex items-center gap-3"
        >
          <Flame size={20} className="text-primary dark:text-primary-300 flex-shrink-0" />
          <p className="text-sm font-sans text-primary dark:text-primary-300">
            You've reviewed <strong>{streak?.todayCount}</strong> card{streak!.todayCount !== 1 ? 's' : ''} today.
            {(streak?.currentStreak ?? 0) > 1 && ` ${streak!.currentStreak}-day streak — keep it up!`}
          </p>
        </motion.div>
      )}

      {/* Per-deck mastery */}
      {decks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <Trophy size={17} className="text-amber-500" />
            <h2 className="font-serif text-gray-900 dark:text-gray-100">
              Mastery by deck
            </h2>
            <span className="ml-auto text-xs text-gray-400 font-sans">{avgMastery}% avg</span>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {sortedDecks.map((deck) => {
              const pct = Math.round(deck.mastery_percentage);
              const barColor =
                pct >= 80
                  ? 'bg-green-500'
                  : pct >= 50
                  ? 'bg-amber-500'
                  : pct >= 20
                  ? 'bg-orange-500'
                  : 'bg-red-400';

              return (
                <Link key={deck.id} href={`/deck/${deck.id}`}>
                  <div className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                    <MasteryRing percentage={pct} size={44} strokeWidth={5} label="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-serif text-gray-900 dark:text-gray-100 truncate">
                        {deck.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${barColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 font-sans flex-shrink-0 w-9 text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400 font-sans">{deck.card_count} cards</p>
                      {(deck.due_count ?? 0) > 0 && (
                        <p className="text-xs text-primary dark:text-primary-300 font-sans font-medium">
                          {deck.due_count} due
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {decks.length === 0 && (
        <div className="text-center py-16">
          <BookOpen size={40} className="text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-sans text-sm">
            No study data yet.{' '}
            <Link href="/upload" className="text-primary dark:text-primary-300 hover:underline">
              Upload your first PDF
            </Link>{' '}
            to get started.
          </p>
        </div>
      )}
    </motion.div>
  );
}

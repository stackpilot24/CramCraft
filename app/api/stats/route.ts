import { NextResponse } from 'next/server';
import { getStudyStats } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import type { StudyStats, StreakData } from '@/lib/types';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const stats = await getStudyStats(userId) as unknown as StudyStats[];

    const today = new Date().toISOString().split('T')[0];
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const totalDaysStudied = stats.length;
    let todayCount = 0;

    const dateSet = new Set(stats.map((s) => s.date));

    if (dateSet.has(today)) {
      todayCount = stats.find((s) => s.date === today)?.cards_studied ?? 0;
    }

    const checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dateSet.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const sortedDates = Array.from(dateSet).sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        tempStreak = diffDays === 1 ? tempStreak + 1 : 1;
        longestStreak = Math.max(longestStreak, tempStreak);
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    const streakData: StreakData = { currentStreak, longestStreak, totalDaysStudied, todayCount };

    return NextResponse.json({ streak: streakData, history: stats.slice(0, 30) });
  } catch (error) {
    console.error('[GET /api/stats]', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    const prevPath = prevPathRef.current;

    if (currentPath === prevPath) return;
    prevPathRef.current = currentPath;

    // New navigation started — show bar and animate
    setVisible(true);
    setProgress(20);

    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 85;
        }
        return p + 8;
      });
    }, 120);

    // Complete after a short delay (page has loaded)
    const completeTimer = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(completeTimer);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full transition-all duration-200 ease-out rounded-r-full"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #E6B566, #C77DFF)',
          boxShadow: '0 0 8px rgba(230, 181, 102, 0.6)',
        }}
      />
    </div>
  );
}

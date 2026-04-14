import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import NextTopLoader from 'nextjs-toploader';
import Providers from './providers';

export const metadata: Metadata = {
  title: {
    default: 'CramCraft — Smart Flashcard Engine',
    template: '%s | CramCraft',
  },
  description:
    'Turn any PDF or PPTX into a smart, practice-ready deck of flashcards with AI and spaced repetition.',
  keywords: ['flashcards', 'spaced repetition', 'PDF', 'AI', 'learning', 'study'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-background dark:bg-gray-950 min-h-screen flex flex-col">
        <Providers>
          {/* Shows immediately on every navigation click — no delay */}
          <NextTopLoader
            color="#E6B566"
            initialPosition={0.15}
            crawlSpeed={180}
            height={3}
            crawl
            showSpinner={false}
            easing="ease"
            speed={220}
            shadow="0 0 10px #E6B566,0 0 5px #C77DFF"
          />
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 pt-3 pb-20 sm:pb-8 flex-1 w-full">{children}</main>
          <footer className="hidden sm:block border-t border-gray-100 dark:border-gray-800 py-6 mt-8">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500 font-sans">
              <span>© {new Date().getFullYear()} CramCraft — Learn smarter, not harder.</span>
              <span>SM-2 spaced repetition · Free to use · Private by default</span>
            </div>
          </footer>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}

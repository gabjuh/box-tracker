import './globals.css';

import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import { SearchProvider } from '@/contexts/SearchContext';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Box Tracker',
  description: 'Track your moving boxes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 min-h-screen`}>
        <SearchProvider>
          <Navbar />
          <main className="container mx-auto p-4">
            {children}
          </main>
        </SearchProvider>
      </body>
    </html>
  )
}
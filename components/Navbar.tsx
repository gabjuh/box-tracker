'use client'

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import QRScannerModal from './QRScannerModal';
import { useSearch } from '@/contexts/SearchContext';

export default function Navbar() {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const { searchTerm, setSearchTerm, triggerRefresh, isRefreshing } = useSearch();
  const pathname = usePathname();
  const router = useRouter();

  // Only show search on home page
  const showSearch = pathname === '/';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-blue-600 dark:bg-blue-800 text-white shadow-md">
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">
              <Link href="/">Box Tracker</Link>
            </h1>
            
            {/* Search Input - Only on home page */}
            {showSearch && (
              <div className="flex-1 max-w-md mx-6">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search boxes, items, keywords..."
                    className="w-full py-2 px-4 pr-10 text-sm border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              {/* Refresh Button - Only on home page */}
              {showSearch && (
                <button
                  onClick={triggerRefresh}
                  disabled={isRefreshing}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                    isRefreshing 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-400'
                  }`}
                  title={isRefreshing ? "Loading..." : "Refresh"}
                >
                  {isRefreshing ? (
                    <svg 
                      className="animate-spin" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                  ) : (
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="23 4 23 10 17 10"/>
                      <polyline points="1 20 1 14 7 14"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                  )}
                </button>
              )}
              
              <button
                onClick={() => setIsQRScannerOpen(true)}
                className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
                title="Scan QR Code"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="5" height="5"/>
                  <rect x="16" y="3" width="5" height="5"/>
                  <rect x="3" y="16" width="5" height="5"/>
                  <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                  <path d="M21 21v.01"/>
                  <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                  <path d="M3 12h.01"/>
                  <path d="M12 3h.01"/>
                  <path d="M12 16v.01"/>
                  <path d="M16 12h1"/>
                  <path d="M21 12v.01"/>
                  <path d="M12 21v-1"/>
                </svg>
              </button>
              
              <Link
                href="/add"
                className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors text-xl font-bold"
                title="Add New Box"
              >
                +
              </Link>

              <Link
                href="/settings"
                className="flex items-center justify-center w-10 h-10 bg-gray-500 hover:bg-gray-400 rounded-lg transition-colors"
                title="Settings"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m17-4a4 4 0 0 0-8 0m8 8a4 4 0 0 0-8 0"/>
                </svg>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-10 h-10 bg-red-500 hover:bg-red-400 rounded-lg transition-colors"
                title="Logout"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <QRScannerModal 
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
      />
    </>
  );
}
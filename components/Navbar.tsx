'use client'

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import QRScannerModal from './QRScannerModal';
import { useSearch } from '@/contexts/SearchContext';

export default function Navbar() {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { searchTerm, setSearchTerm, triggerRefresh, isRefreshing } = useSearch();
  const pathname = usePathname();
  const router = useRouter();

  // Only show search on home page
  const showSearch = pathname === '/';

  // Hide navigation buttons on login page
  const isLoggedIn = pathname !== '/login';

  const clearSearch = () => {
    setSearchTerm('');
  };

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
      <nav className="sticky top-0 left-0 right-0 z-50 bg-blue-600 dark:bg-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold flex-shrink-0">
              <Link href="/" className="hover:text-blue-200 transition-colors">
                Box Tracker
              </Link>
            </h1>

            {/* Mobile Search - Only on home page, between logo and burger */}
            {showSearch && (
              <div className="md:hidden flex-1 mx-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Suchen..."
                    className="w-full py-2 px-3 pr-16 text-sm rounded-lg border-2 border-blue-300 focus:ring-2 focus:ring-white focus:border-white bg-white text-gray-900 placeholder-gray-600"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    {searchTerm && (
                      <button
                        onClick={clearSearch}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Suche löschen"
                      >
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Search - Only on home page and desktop */}
            {showSearch && (
              <div className="hidden md:flex flex-1 max-w-lg mx-8">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Kartons, Inhalte, Schlagwörter suchen..."
                    className="w-full py-2 px-4 pr-20 text-sm rounded-lg border-2 border-blue-300 focus:ring-2 focus:ring-white focus:border-white bg-white text-gray-900 placeholder-gray-600"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    {searchTerm && (
                      <button
                        onClick={clearSearch}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Suche löschen"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              {/* Public Moving Button - Always visible */}
              <Link
                href="/moving"
                className="flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-400 rounded-lg transition-colors"
                title="Umzugs-Hub"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16,3 19,7 19,13 16,13"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </Link>

              {isLoggedIn && (
                <>
                  {/* Desktop Navigation */}
                  <div className="hidden md:flex items-center space-x-3">
                  {showSearch && (
                    <button
                      onClick={triggerRefresh}
                      disabled={isRefreshing}
                      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                        isRefreshing
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-400'
                      }`}
                      title={isRefreshing ? "Aktualisiere..." : "Datenbank Aktualisieren"}
                    >
                      {isRefreshing ? (
                        <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M21 12a9 9 0 11-6.219-8.56"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
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
                    title="QR Code Scannen"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
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
                    title="Neuen Karton Hinzufügen"
                  >
                    +
                  </Link>

                  <Link
                    href="/map"
                    className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
                    title="Wohnungsplan"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 .553-.894L9 2l6 3 5.447-2.724A1 1 0 0 1 21 3.382v10.764a1 1 0 0 1-.553.894L15 18l-6-3z"/>
                      <polyline points="9,2 9,18"/>
                      <polyline points="15,5 15,18"/>
                    </svg>
                  </Link>

                  <Link
                    href="/settings"
                    className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
                    title="Einstellungen"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6m0 6v6M9.69 1.69l3.3 3.3m0 13.84l3.3 3.3M5.64 5.64l3.3 3.3m7.84 0l3.3-3.3M1.69 9.69l3.3 3.3m13.84 0l3.3-3.3M5.64 18.36l3.3-3.3m7.84 0l3.3 3.3"/>
                    </svg>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
                    title="Abmelden"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </>
            )}
          </div>


          {/* Mobile Dropdown Menu */}
          {isLoggedIn && isMobileMenuOpen && (
            <div className="md:hidden bg-blue-700 dark:bg-blue-900 rounded-lg mb-4 shadow-lg">
              <div className="py-2 pb-4 space-y-1">
                {showSearch && (
                  <button
                    onClick={() => {
                      triggerRefresh();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={isRefreshing}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-blue-600 dark:hover:bg-blue-800 transition-colors ${
                      isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isRefreshing ? (
                      <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10"/>
                        <polyline points="1 20 1 14 7 14"/>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                      </svg>
                    )}
                    <span className="font-medium">
                      {isRefreshing ? 'Datenbank Aktualisieren...' : 'Datenbank Aktualisieren'}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsQRScannerOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-blue-600 dark:hover:bg-blue-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
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
                  <span className="font-medium">QR Code Scannen</span>
                </button>

                <Link
                  href="/add"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-blue-600 dark:hover:bg-blue-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M12 5v14m7-7H5"/>
                  </svg>
                  <span className="font-medium">Neuen Karton Hinzufügen</span>
                </Link>

                <Link
                  href="/map"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-blue-600 dark:hover:bg-blue-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 .553-.894L9 2l6 3 5.447-2.724A1 1 0 0 1 21 3.382v10.764a1 1 0 0 1-.553.894L15 18l-6-3z"/>
                    <polyline points="9,2 9,18"/>
                    <polyline points="15,5 15,18"/>
                  </svg>
                  <span className="font-medium">Wohnungsplan</span>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-blue-600 dark:hover:bg-blue-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6M9.69 1.69l3.3 3.3m0 13.84l3.3 3.3M5.64 5.64l3.3 3.3m7.84 0l3.3-3.3M1.69 9.69l3.3 3.3m13.84 0l3.3-3.3M5.64 18.36l3.3-3.3m7.84 0l3.3 3.3"/>
                  </svg>
                  <span className="font-medium">Einstellungen</span>
                </Link>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-blue-600 dark:hover:bg-blue-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span className="font-medium">Abmelden</span>
                </button>
              </div>
            </div>
          )}
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
'use client'

import { useState } from 'react';
import QRScannerModal from '@/components/QRScannerModal';
import ScanResultModal from '@/components/ScanResultModal';
import type { Box } from '@/types';

export default function MovingPage() {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isScanResultOpen, setIsScanResultOpen] = useState(false);
  const [scannedBoxData, setScannedBoxData] = useState<{
    boxNumber: string;
    roomName?: string;
    weight?: number;
    items: string;
  } | null>(null);

  const handleQRScanSuccess = async (scannedValue: string) => {
    try {
      // Close QR scanner
      setIsQRScannerOpen(false);

      // Fetch box data based on scanned value (assuming it's a box number)
      const response = await fetch(`/api/boxes?search=${encodeURIComponent(scannedValue)}`);
      const boxes: Box[] = await response.json();

      // Find the matching box
      const matchingBox = boxes.find(box => box.boxNumber === scannedValue);

      if (matchingBox) {
        setScannedBoxData({
          boxNumber: matchingBox.boxNumber,
          roomName: undefined, // Will be added to database later
          weight: undefined, // Will be added to database later
          items: matchingBox.items
        });
        setIsScanResultOpen(true);
      } else {
        alert('Karton nicht in Datenbank gefunden');
      }
    } catch (error) {
      console.error('Error fetching box data:', error);
      alert('Fehler beim Laden der Karton-Informationen');
    }
  };

  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 flex flex-col">
        <div className="max-w-4xl mx-auto p-8 flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Umzugs-Hub</h1>

            {/* Quick Information Paragraphs */}
            <div className="space-y-4 mb-8 text-gray-600 dark:text-gray-300">
              <p className="text-lg leading-relaxed">
                <span className="font-semibold text-blue-600 dark:text-blue-400">Standort-Tracking:</span>
                {" "}Scannen Sie QR-Codes auf Ihren Umzugskartons, um sofort den Zielraum in Ihrem neuen Zuhause zu sehen.
                Interaktive Karten zeigen genau, wohin jeder Karton gehört und machen das Auspacken mühelos und organisiert.
              </p>

              <p className="text-lg leading-relaxed">
                <span className="font-semibold text-green-600 dark:text-green-400">Gewichts-Information:</span>
                {" "}Erhalten Sie sofortigen Zugriff auf Gewichtsinformationen nach dem Scannen.
                Wissen Sie, wie schwer jeder Karton ist, bevor Sie ihn anheben - für bessere Planung
                und Verletzungsvermeidung durch richtige Hebetechnik.
              </p>
            </div>
          </div>

          {/* Unified Scan Code Button - Centered */}
          <div className="flex justify-center">
            <button
              onClick={() => setIsQRScannerOpen(true)}
              className="flex flex-col items-center justify-center p-8 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-lg min-w-64"
            >
              <div className="flex items-center mb-4">
                {/* QR Code Icon */}
                <svg className="w-12 h-12 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                {/* Location Icon */}
                <svg className="w-10 h-10 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {/* Weight Icon */}
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <span className="text-2xl font-bold">Code Einscannen</span>
            </button>
          </div>
        </div>
      </div>

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScanSuccess}
      />

      <ScanResultModal
        isOpen={isScanResultOpen}
        onClose={() => {
          setIsScanResultOpen(false);
          setScannedBoxData(null);
        }}
        boxData={scannedBoxData}
      />
    </>
  );
}
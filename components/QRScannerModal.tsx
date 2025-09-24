'use client'

import QrScanner from 'qr-scanner';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan?: (scannedValue: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [lastScanTime, setLastScanTime] = useState(0);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [boxInfo, setBoxInfo] = useState<{ boxNumber: string; exists: boolean } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setError('');
      setBoxInfo(null);
      
      if (!videoRef.current) {
        setError('Video element not ready');
        return;
      }

      // Enhanced browser compatibility checks
      console.log('Checking camera support...');
      console.log('navigator.mediaDevices:', !!navigator.mediaDevices);
      console.log('getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
      console.log('User agent:', navigator.userAgent);

      if (!navigator.mediaDevices) {
        setError('MediaDevices API not supported. Try using HTTPS or a modern browser.');
        return;
      }

      if (!navigator.mediaDevices.getUserMedia) {
        setError('Camera access not supported by this browser. Please use Chrome, Firefox, or Safari.');
        return;
      }

      // Check if we're on HTTP (not localhost) which doesn't allow camera access
      if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        setError('Camera requires HTTPS connection (except on localhost)');
        return;
      }

      console.log('Requesting camera permission...');
      
      // Try different camera configurations
      let stream;
      const videoConfigs = [
        // First try: environment camera (back camera on mobile)
        {
          video: { 
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        },
        // Second try: any camera
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        },
        // Third try: basic video only
        { video: true }
      ];

      for (let i = 0; i < videoConfigs.length; i++) {
        try {
          console.log(`Trying camera config ${i + 1}:`, videoConfigs[i]);
          stream = await navigator.mediaDevices.getUserMedia(videoConfigs[i]);
          console.log('Camera access granted');
          break;
        } catch (configErr: any) {
          console.log(`Config ${i + 1} failed:`, configErr.message);
          if (i === videoConfigs.length - 1) {
            throw configErr; // Re-throw the last error
          }
        }
      }

      if (!stream) {
        throw new Error('Failed to access camera with all configurations');
      }

      videoRef.current.srcObject = stream;
      
      await new Promise((resolve, reject) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = resolve;
          videoRef.current.onerror = reject;
          // Set a timeout to prevent hanging
          setTimeout(() => reject(new Error('Video load timeout')), 10000);
        } else {
          reject(new Error('Video element not available'));
        }
      });

      console.log('Video loaded, creating QR Scanner...');

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleQRCodeDetected(result.data),
        {
          onDecodeError: (err) => {
            // Only log decode errors in development
            if (process.env.NODE_ENV === 'development') {
              console.debug('QR decode error (normal):', err.message);
            }
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
        }
      );

      await qrScannerRef.current.start();
      setIsScanning(true);
      console.log('QR Scanner started successfully');

    } catch (err: any) {
      console.error('Camera error:', err);
      
      let errorMessage = 'Unknown camera error';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please click "Allow" when prompted and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device. Please ensure you have a working camera.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported by this browser. Please use Chrome, Firefox, or Safari.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application. Please close other camera apps and try again.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not meet the required specifications. Trying fallback...';
        // Try again with basic video
        setTimeout(() => startScanning(), 1000);
        return;
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Camera took too long to load. Please try again.';
      } else {
        errorMessage = `Camera error: ${err.message}. Please try refreshing the page.`;
      }
      
      setError(errorMessage);
    }
  };

  const handleQRCodeDetected = async (qrText: string) => {
    const now = Date.now();
    
    // If we're already navigating, ignore new scans
    if (isNavigating) {
      return;
    }
    
    // Prevent scanning the same code too frequently
    if (qrText === lastScannedCode && now - lastScanTime < 3000) {
      return;
    }
    
    console.log('QR Code detected:', qrText);
    setLastScanTime(now);
    setLastScannedCode(qrText);
    setError('');
    
    // Stop the scanner immediately to prevent further detections
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      setIsScanning(false);
    }

    const boxNumber = qrText.trim();
    
    try {
      // Check if box exists in database
      const response = await fetch(`/api/boxes?search=${encodeURIComponent(boxNumber)}`);
      
      if (response.ok) {
        const boxes = await response.json();
        const existingBox = boxes.find((box: any) => box.boxNumber === boxNumber);
        
        setBoxInfo({
          boxNumber,
          exists: !!existingBox
        });

        // Start navigation process
        setIsNavigating(true);

        // Auto-navigate after 3 seconds
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          stopScanning();

          // If onScan callback is provided, use it instead of navigation
          if (onScan) {
            onScan(boxNumber);
            return;
          }

          // Default behavior: navigate to edit/add page
          onClose();
          if (existingBox) {
            // Box exists - go to edit mode
            router.push(`/edit/${existingBox.id}`);
          } else {
            // Box doesn't exist - go to add mode with pre-filled box number
            router.push(`/add?boxNumber=${encodeURIComponent(boxNumber)}`);
          }
        }, 3000);
        
      } else {
        setError('Failed to check box in database');
        setTimeout(() => setError(''), 3000);
        // Restart scanning on error
        setTimeout(() => startScanning(), 1000);
      }
    } catch (err) {
      setError('Database connection error');
      setTimeout(() => setError(''), 3000);
      console.error('Database error:', err);
      // Restart scanning on error
      setTimeout(() => startScanning(), 1000);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    
    setIsScanning(false);
    setBoxInfo(null);
    setLastScannedCode(null);
    setIsNavigating(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-75" onClick={handleClose} />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">QR Code Scanner</h2>
            <button 
              onClick={handleClose}
              className="text-white hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>
          <div className="text-sm opacity-90 mt-1">
            {isScanning ? '📹 Scanning for QR codes...' : '❌ Camera Off'}
          </div>
        </div>

        {/* Camera Container */}
        <div className="relative bg-black" style={{ height: '400px' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          {!isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <h3 className="text-lg font-semibold mb-2">Camera Off</h3>
                <p className="opacity-80">Starting camera...</p>
              </div>
            </div>
          )}
        </div>

        {/* Content Panel */}
        <div className="p-4">
          {error && (
            <div className="mb-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded animate-pulse">
              ⚠️ {error}
            </div>
          )}

          {boxInfo && (
            <div className="mb-4">
              {/* Big Success Message - Overlays the camera */}
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mx-4 max-w-sm w-full text-center shadow-2xl border-4 border-green-500 animate-pulse">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    QR Code Detected!
                  </h3>
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                    Box #{boxInfo.boxNumber}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-6">
                    {boxInfo.exists ? (
                      <>📝 Box exists - Opening edit mode...</>
                    ) : (
                      <>📦 New box - Opening creation form...</>
                    )}
                  </div>
                  
                  {/* Loading Spinner */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Redirecting...
                  </div>
                </div>
              </div>
            </div>
          )}

          {isScanning && !boxInfo && (
            <div className="text-center text-gray-600 dark:text-gray-400">
              <p>📱 Point your camera at a QR code</p>
              <p className="text-sm mt-1">The scanner will automatically detect and read it</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
          <button 
            onClick={handleClose}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close Scanner
          </button>
        </div>
      </div>
      
      <style jsx>{`
        /* QR Scanner highlight styles */
        .relative svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10;
        }

        .relative svg .scan-region-highlight {
          stroke: #00ff88;
          stroke-width: 3px;
          stroke-dasharray: 12,6;
          fill: none;
          opacity: 0.8;
          animation: pulse-border 2s ease-in-out infinite;
        }

        .relative svg .code-outline-highlight {
          stroke: #ff4757;
          stroke-width: 4px;
          stroke-dasharray: 8,4;
          fill: rgba(255, 71, 87, 0.1);
          opacity: 0.9;
          animation: pulse-outline 1.5s ease-in-out infinite;
        }

        @keyframes pulse-border {
          0%, 100% {
            opacity: 0.6;
            stroke-width: 3px;
          }
          50% {
            opacity: 1;
            stroke-width: 4px;
          }
        }

        @keyframes pulse-outline {
          0%, 100% {
            opacity: 0.7;
            stroke-width: 4px;
          }
          50% {
            opacity: 1;
            stroke-width: 5px;
          }
        }
      `}</style>
    </div>
  );
}
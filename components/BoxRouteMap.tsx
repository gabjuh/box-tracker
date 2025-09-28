'use client';

import { useRef, useEffect, useState } from 'react';
import { Room, EntrancePoint } from '@/types/map';
import { MapRenderer } from '@/lib/mapRenderer';
import { MapAnimationEngine } from '@/lib/mapAnimation';
import { useMapData } from '@/hooks/useMapData';

interface BoxRouteMapProps {
  targetRoomId: string;
  autoPlay?: boolean;
  className?: string;
}

export default function BoxRouteMap({ targetRoomId, autoPlay = true, className = '' }: BoxRouteMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapImageRef = useRef<HTMLImageElement>(null);
  const animationRef = useRef({ shouldStop: false });

  const [isAnimating, setIsAnimating] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const { rooms, entrancePoint, loading } = useMapData();

  // Find the target room
  const targetRoom = rooms.find(room => room.id === targetRoomId);

  const startAnimation = () => {
    const canvas = canvasRef.current;
    const mapImage = mapImageRef.current;
    if (!canvas || !mapImage || !targetRoom) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const onAnimationComplete = () => {
      setIsAnimating(false);
    };

    const animate = MapAnimationEngine.createPathAnimation(
      targetRoom,
      entrancePoint,
      ctx,
      canvas,
      mapImage,
      animationRef,
      false, // Don't repeat
      onAnimationComplete
    );

    setIsAnimating(true);
    animationRef.current.shouldStop = false;
    animate();
  };

  const stopAnimation = () => {
    animationRef.current.shouldStop = true;
    setIsAnimating(false);
  };

  // Draw static map with destination room
  useEffect(() => {
    const canvas = canvasRef.current;
    const mapImage = mapImageRef.current;
    if (!canvas || !mapImage || loading || !targetRoom) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawStaticMap = () => {
      MapRenderer.clearCanvas(ctx, canvas, mapImage);

      // Draw entrance point
      MapRenderer.drawEntrance(ctx, entrancePoint);

      // Draw target room
      MapRenderer.drawSelectedRoom(ctx, targetRoom);
    };

    drawStaticMap();
    mapImage.onload = drawStaticMap;
    if (mapImage.complete) drawStaticMap();
  }, [rooms, entrancePoint, targetRoom, loading]);

  // Auto-play animation when component mounts
  useEffect(() => {
    if (autoPlay && targetRoom && !loading) {
      // Small delay to ensure map is drawn first
      const timer = setTimeout(() => {
        startAnimation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, targetRoom, loading]);

  if (loading) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Karte wird geladen...</p>
      </div>
    );
  }

  if (!targetRoom) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center ${className}`}>
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-gray-600 dark:text-gray-300">
          Raum nicht gefunden
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Der Zielraum wurde nicht in der Karte gefunden
        </p>
      </div>
    );
  }

  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Room Info Header */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Zielort: {targetRoom.name}
            </h4>
          </div>

          {/* Animation Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowControls(!showControls)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Animation Controls Panel */}
        {showControls && (
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
            <div className="flex items-center space-x-3">
              <button
                onClick={startAnimation}
                disabled={isAnimating}
                className="flex items-center px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-sm rounded transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Route zeigen
              </button>

              {isAnimating && (
                <button
                  onClick={stopAnimation}
                  className="flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10l6 6m0-6l-6 6" />
                  </svg>
                  Stoppen
                </button>
              )}

              {isAnimating && (
                <span className="text-sm text-blue-600 dark:text-blue-400 animate-pulse">
                  Route wird angezeigt...
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Map Canvas */}
      <div className="relative">
        <img
          ref={mapImageRef}
          src="/map/map.png"
          alt="Apartment Floor Plan"
          className="hidden"
        />
        <canvas
          ref={canvasRef}
          width={1200}
          height={600}
          className="w-full h-auto border-0"
        />
      </div>
    </div>
  );
}
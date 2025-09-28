'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Room, EntrancePoint, RecordingMode, MapCoordinates } from '@/types/map';
import { MapRenderer } from '@/lib/mapRenderer';

export interface MapCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
  getMapImage: () => HTMLImageElement | null;
}

interface MapCanvasProps {
  rooms: Room[];
  entrancePoint: EntrancePoint;
  selectedRoom: string | null;
  isAnimating: boolean;
  showAllRooms: boolean;
  recordingMode: RecordingMode;
  selectedCoords: MapCoordinates | null;
  pathRecordingRoom: string | null;
  recordingPath: MapCoordinates[];
  loading: boolean;
  onMouseMove: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  onClick: (event: React.MouseEvent<HTMLCanvasElement>) => void;
}

const MapCanvas = forwardRef<MapCanvasRef, MapCanvasProps>(({
  rooms,
  entrancePoint,
  selectedRoom,
  isAnimating,
  showAllRooms,
  recordingMode,
  selectedCoords,
  pathRecordingRoom,
  recordingPath,
  loading,
  onMouseMove,
  onClick
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapImageRef = useRef<HTMLImageElement>(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    getMapImage: () => mapImageRef.current
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const mapImage = mapImageRef.current;
    if (!canvas || !mapImage || loading) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawMap = () => {
      MapRenderer.clearCanvas(ctx, canvas, mapImage);

      // Draw entrance point
      MapRenderer.drawEntrance(ctx, entrancePoint);

      // Show room points based on toggle or selection
      if (showAllRooms && !isAnimating) {
        MapRenderer.drawAllRooms(ctx, rooms, selectedRoom);
      } else if (selectedRoom && !isAnimating) {
        const selectedRoomData = rooms.find(r => r.id === selectedRoom);
        if (selectedRoomData) {
          MapRenderer.drawSelectedRoom(ctx, selectedRoomData);
        }
      }

      // Draw recording indicators
      MapRenderer.drawRecordingIndicators(ctx, selectedCoords, recordingMode);

      // Draw path recording
      if (recordingMode === 'path' && pathRecordingRoom) {
        const recordingRoom = rooms.find(r => r.id === pathRecordingRoom);
        if (recordingRoom) {
          MapRenderer.drawPathRecording(ctx, entrancePoint, recordingRoom, recordingPath);
        }
      }
    };

    drawMap();

    mapImage.onload = drawMap;
    if (mapImage.complete) drawMap();
  }, [
    rooms,
    entrancePoint,
    selectedRoom,
    isAnimating,
    showAllRooms,
    recordingMode,
    selectedCoords,
    pathRecordingRoom,
    recordingPath,
    loading
  ]);

  return (
    <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
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
        onMouseMove={onMouseMove}
        onClick={onClick}
        className="w-full h-auto border border-gray-300 dark:border-gray-600 cursor-crosshair"
      />
    </div>
  );
});

MapCanvas.displayName = 'MapCanvas';

export default MapCanvas;
'use client';

import { useState, useRef, useEffect } from 'react';
import { Room, RecordingMode, MapCoordinates, AnimationState } from '@/types/map';
import { MapAnimationEngine } from '@/lib/mapAnimation';
import { useMapData } from '@/hooks/useMapData';

// Components
import MapControls from './map/MapControls';
import CoordinateDisplay from './map/CoordinateDisplay';
import MapCanvas, { MapCanvasRef } from './map/MapCanvas';
import NavigationTest from './map/NavigationTest';

export default function InteractiveMap() {
  // Map data
  const {
    rooms,
    entrancePoint,
    loading,
    saveRoom,
    saveEntrance,
    savePath,
    deleteRoom,
    deleteAllRooms
  } = useMapData();

  // UI state
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [repeatAnimation, setRepeatAnimation] = useState(false);

  // Recording state
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('none');
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<MapCoordinates | null>(null);
  const [pathRecordingRoom, setPathRecordingRoom] = useState<string | null>(null);
  const [recordingPath, setRecordingPath] = useState<MapCoordinates[]>([]);

  // Mouse interaction
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [showCoords, setShowCoords] = useState(false);

  // Animation control
  const animationRef = useRef<AnimationState>({ shouldStop: false });
  const mapCanvasRef = useRef<MapCanvasRef>(null);

  // Canvas coordinate conversion
  const getCanvasCoords = (event: React.MouseEvent<HTMLCanvasElement>): MapCoordinates => {
    const canvas = mapCanvasRef.current?.getCanvas();
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.round((event.clientX - rect.left) * scaleX),
      y: Math.round((event.clientY - rect.top) * scaleY)
    };
  };

  // Mouse event handlers
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(event);
    setMouseCoords(coords);
    setShowCoords(recordingMode !== 'none');
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (recordingMode === 'none') return;

    const coords = getCanvasCoords(event);

    if (recordingMode === 'room' || recordingMode === 'entrance') {
      setSelectedCoords(coords);
    } else if (recordingMode === 'path' && pathRecordingRoom) {
      setRecordingPath(prev => [...prev, coords]);
    }
  };

  // Recording handlers
  const handleStartRoomRecording = () => {
    if (!newRoomName.trim()) {
      alert('Please enter a room name');
      return;
    }
    setRecordingMode('room');
    setSelectedCoords(null);
  };

  const handleSaveRecordedRoom = async () => {
    if (!selectedCoords || !newRoomName.trim()) return;

    const success = await saveRoom(newRoomName, selectedCoords.x, selectedCoords.y);
    if (success) {
      setRecordingMode('none');
      setNewRoomName('');
      setSelectedCoords(null);
    }
  };

  const handleStartEntranceRecording = () => {
    setRecordingMode('entrance');
    setSelectedCoords(null);
  };

  const handleSaveRecordedEntrance = async () => {
    if (!selectedCoords) return;

    const success = await saveEntrance(selectedCoords.x, selectedCoords.y);
    if (success) {
      setRecordingMode('none');
      setSelectedCoords(null);
    }
  };

  const handleStartPathRecording = (roomId: string) => {
    setPathRecordingRoom(roomId);
    setRecordingMode('path');
    setRecordingPath([]);
  };

  const handleSaveRecordedPath = async () => {
    if (!pathRecordingRoom || recordingPath.length === 0) return;

    const success = await savePath(pathRecordingRoom, recordingPath);
    if (success) {
      setRecordingMode('none');
      setPathRecordingRoom(null);
      setRecordingPath([]);
    }
  };

  const handleClearPath = () => {
    setRecordingPath([]);
  };

  const handleCancelRecording = () => {
    setRecordingMode('none');
    setSelectedCoords(null);
    setNewRoomName('');
    setPathRecordingRoom(null);
    setRecordingPath([]);
  };

  // Animation handlers
  const handleRoomSelect = (roomId: string) => {
    if (isAnimating) return;

    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    setSelectedRoom(roomId);

    const canvas = mapCanvasRef.current?.getCanvas();
    const mapImage = mapCanvasRef.current?.getMapImage();
    if (!canvas || !mapImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const onAnimationComplete = () => {
      setIsAnimating(false);
      setSelectedRoom(null);
    };

    const animate = MapAnimationEngine.createPathAnimation(
      room,
      entrancePoint,
      ctx,
      canvas,
      mapImage,
      animationRef,
      repeatAnimation,
      onAnimationComplete
    );

    setIsAnimating(true);
    animationRef.current.shouldStop = false;
    animate();
  };

  const handleDeleteRoom = async (roomId: string) => {
    const success = await deleteRoom(roomId);
    if (success && selectedRoom === roomId) {
      setSelectedRoom(null);
    }
  };

  const handleDeleteAllRooms = async () => {
    await deleteAllRooms();
    setSelectedRoom(null);
  };

  // Stop animation when repeat checkbox is unchecked
  useEffect(() => {
    if (!repeatAnimation) {
      animationRef.current.shouldStop = true;
    }
  }, [repeatAnimation]);

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Interactive Map Editor</h1>

        {/* Desktop Layout: Side by side controls and info */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column: Controls (takes 3 columns on xl screens) */}
          <div className="xl:col-span-3 space-y-6">
            {/* Recording Controls */}
            <MapControls
              recordingMode={recordingMode}
              newRoomName={newRoomName}
              setNewRoomName={setNewRoomName}
              onStartRoomRecording={handleStartRoomRecording}
              onStartEntranceRecording={handleStartEntranceRecording}
              onStartPathRecording={handleStartPathRecording}
              onSaveRecordedRoom={handleSaveRecordedRoom}
              onSaveRecordedEntrance={handleSaveRecordedEntrance}
              onSaveRecordedPath={handleSaveRecordedPath}
              onClearPath={handleClearPath}
              onCancelRecording={handleCancelRecording}
              selectedCoords={selectedCoords}
              pathRecordingRoom={pathRecordingRoom}
              recordingPath={recordingPath}
              rooms={rooms}
            />

            {/* Coordinate Display */}
            <CoordinateDisplay
              showCoords={showCoords}
              mouseCoords={mouseCoords}
              selectedCoords={selectedCoords}
            />

            {/* Map Canvas */}
            <MapCanvas
              ref={mapCanvasRef}
              rooms={rooms}
              entrancePoint={entrancePoint}
              selectedRoom={selectedRoom}
              isAnimating={isAnimating}
              showAllRooms={showAllRooms}
              recordingMode={recordingMode}
              selectedCoords={selectedCoords}
              pathRecordingRoom={pathRecordingRoom}
              recordingPath={recordingPath}
              loading={loading}
              onMouseMove={handleMouseMove}
              onClick={handleCanvasClick}
            />
          </div>

          {/* Right Column: Navigation and Info (takes 1 column on xl screens) */}
          <div className="xl:col-span-1 space-y-6">
            {/* Navigation Test */}
            <NavigationTest
              rooms={rooms}
              selectedRoom={selectedRoom}
              isAnimating={isAnimating}
              showAllRooms={showAllRooms}
              repeatAnimation={repeatAnimation}
              onRoomSelect={handleRoomSelect}
              onToggleShowAll={setShowAllRooms}
              onToggleRepeat={setRepeatAnimation}
              onDeleteRoom={handleDeleteRoom}
              onDeleteAllRooms={handleDeleteAllRooms}
            />

            {/* Help Information */}
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Quick Guide</h3>
              <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <p>• Use recording tools to add rooms, set entrance, and record paths</p>
                <p>• Test navigation by clicking room buttons to see animated paths</p>
                <p>• All data is saved to the database automatically</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
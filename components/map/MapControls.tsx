'use client';

import { RecordingMode } from '@/types/map';

interface MapControlsProps {
  recordingMode: RecordingMode;
  newRoomName: string;
  setNewRoomName: (name: string) => void;
  onStartRoomRecording: () => void;
  onStartEntranceRecording: () => void;
  onStartPathRecording: (roomId: string) => void;
  onSaveRecordedRoom: () => void;
  onSaveRecordedEntrance: () => void;
  onSaveRecordedPath: () => void;
  onClearPath: () => void;
  onCancelRecording: () => void;
  selectedCoords: { x: number; y: number } | null;
  pathRecordingRoom: string | null;
  recordingPath: { x: number; y: number }[];
  rooms: Array<{ id: string; name: string; center: { x: number; y: number }; path: { x: number; y: number }[] }>;
}

export default function MapControls({
  recordingMode,
  newRoomName,
  setNewRoomName,
  onStartRoomRecording,
  onStartEntranceRecording,
  onStartPathRecording,
  onSaveRecordedRoom,
  onSaveRecordedEntrance,
  onSaveRecordedPath,
  onClearPath,
  onCancelRecording,
  selectedCoords,
  pathRecordingRoom,
  recordingPath,
  rooms
}: MapControlsProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Map Recording Tools</h3>

      {recordingMode === 'none' ? (
        <div className="space-y-4">
          {/* Responsive Layout: Stack on smaller screens, row on larger */}
          <div className="grid grid-cols-1 gap-4">
            {/* Add Room - Full width on mobile */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Add New Room</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  onClick={onStartRoomRecording}
                  className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors whitespace-nowrap"
                >
                  ➕ Add Room
                </button>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Record Entrance */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Set Entrance</label>
                <button
                  onClick={onStartEntranceRecording}
                  className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
                >
                  🚪 Set Entrance Point
                </button>
              </div>

              {/* Record Path */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Record Path</label>
                <select
                  onChange={(e) => e.target.value && onStartPathRecording(e.target.value)}
                  value=""
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">🛤️ Record Path for...</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          {recordingMode === 'room' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">➕</span>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Recording Room: &quot;{newRoomName}&quot;</h4>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                Click on the map to set the center point for this room
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onSaveRecordedRoom}
                  disabled={!selectedCoords}
                  className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium transition-colors"
                >
                  ✓ Save Room
                </button>
                <button
                  onClick={onCancelRecording}
                  className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors"
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          )}

          {recordingMode === 'entrance' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🚪</span>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Recording Entrance Point</h4>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                Click on the map to set the entrance point
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onSaveRecordedEntrance}
                  disabled={!selectedCoords}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium transition-colors"
                >
                  ✓ Save Entrance
                </button>
                <button
                  onClick={onCancelRecording}
                  className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors"
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          )}

          {recordingMode === 'path' && pathRecordingRoom && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🛤️</span>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Recording Path for &quot;{rooms.find(r => r.id === pathRecordingRoom)?.name}&quot;
                </h4>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                Click on the map to add waypoints ({recordingPath.length} points recorded)
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onSaveRecordedPath}
                  disabled={recordingPath.length === 0}
                  className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium transition-colors"
                >
                  ✓ Save Path ({recordingPath.length} points)
                </button>
                <button
                  onClick={onClearPath}
                  className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium transition-colors"
                >
                  🔄 Clear Points
                </button>
                <button
                  onClick={onCancelRecording}
                  className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors"
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
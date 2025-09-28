'use client';

import { Room } from '@/types/map';

interface NavigationTestProps {
  rooms: Room[];
  selectedRoom: string | null;
  isAnimating: boolean;
  showAllRooms: boolean;
  repeatAnimation: boolean;
  onRoomSelect: (roomId: string) => void;
  onToggleShowAll: (show: boolean) => void;
  onToggleRepeat: (repeat: boolean) => void;
  onDeleteRoom: (roomId: string) => void;
  onDeleteAllRooms: () => void;
}

export default function NavigationTest({
  rooms,
  selectedRoom,
  isAnimating,
  showAllRooms,
  repeatAnimation,
  onRoomSelect,
  onToggleShowAll,
  onToggleRepeat,
  onDeleteRoom,
  onDeleteAllRooms
}: NavigationTestProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">🧭 Navigation Test</h3>

        {/* Settings Controls - Under the title */}
        <div className="flex flex-col gap-2 text-sm mb-4">
          <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={showAllRooms}
              onChange={(e) => onToggleShowAll(e.target.checked)}
              className="rounded"
            />
            Show all rooms
          </label>
          <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={repeatAnimation}
              onChange={(e) => onToggleRepeat(e.target.checked)}
              className="rounded"
            />
            Repeat animation
          </label>
        </div>
      </div>

      {rooms.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Click a room to test navigation:</h4>
          <div className="grid grid-cols-1 gap-2">
            {rooms.map(room => (
              <div key={room.id} className="flex items-center gap-2">
                <button
                  onClick={() => onRoomSelect(room.id)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-colors text-left ${
                    selectedRoom === room.id && isAnimating
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <span className="mr-2">🏠</span>
                  {room.name}
                </button>
                <button
                  onClick={() => onDeleteRoom(room.id)}
                  disabled={isAnimating}
                  className="px-2 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg disabled:opacity-50 transition-colors"
                  title="Delete room"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          {/* Delete All Button - Under the room list */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={onDeleteAllRooms}
              className="w-full px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
            >
              🗑️ Delete All Rooms
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🏠</div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No rooms recorded yet. Use the recording tools to add rooms and their navigation paths.
          </p>
        </div>
      )}
    </div>
  );
}
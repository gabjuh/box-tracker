import { useState, useEffect } from 'react';
import { Room, EntrancePoint } from '@/types/map';
import { MapApi } from '@/lib/mapApi';

export function useMapData() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [entrancePoint, setEntrancePoint] = useState<EntrancePoint>({ x: 370, y: 400 });
  const [loading, setLoading] = useState(true);

  const loadMapData = async () => {
    try {
      setLoading(true);

      const [roomsData, entranceData] = await Promise.allSettled([
        MapApi.loadRooms(),
        MapApi.loadEntrance()
      ]);

      if (roomsData.status === 'fulfilled') {
        setRooms(roomsData.value);
      }

      if (entranceData.status === 'fulfilled') {
        setEntrancePoint(entranceData.value);
      }
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRoom = async (
    name: string,
    centerX: number,
    centerY: number,
    pathPoints: { x: number; y: number }[] = []
  ): Promise<boolean> => {
    try {
      const newRoom = await MapApi.saveRoom(name, centerX, centerY, pathPoints);
      setRooms(prev => [...prev, newRoom]);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'ROOM_EXISTS') {
        const overwrite = confirm(
          `A room named "${name}" already exists. Do you want to overwrite it?\n\n` +
          `Click OK to overwrite the existing room.\n` +
          `Click Cancel to keep the current recording and change the name.`
        );

        if (overwrite) {
          const existingRoom = rooms.find(room => room.name.toLowerCase() === name.toLowerCase());
          if (existingRoom) {
            try {
              const updatedRoom = await MapApi.updateRoom(existingRoom.id, name, centerX, centerY, pathPoints);
              setRooms(prev => prev.map(room =>
                room.id === existingRoom.id ? updatedRoom : room
              ));
              return true;
            } catch (updateError) {
              alert(`Error updating room: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
              return false;
            }
          }
        }
      } else {
        alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      return false;
    }
  };

  const saveEntrance = async (x: number, y: number): Promise<boolean> => {
    try {
      const entranceData = await MapApi.saveEntrance(x, y);
      setEntrancePoint(entranceData);
      return true;
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const savePath = async (roomId: string, pathPoints: { x: number; y: number }[]): Promise<boolean> => {
    try {
      // Get the room center as the final destination
      const room = rooms.find(r => r.id === roomId);
      if (!room) return false;

      // Add room center as final point if it's not already there
      let finalPath = [...pathPoints];
      const lastPoint = finalPath[finalPath.length - 1];
      const roomCenter = room.center;

      // Check if the last point is already the room center (within 10 pixels tolerance)
      const isLastPointRoomCenter = lastPoint &&
        Math.abs(lastPoint.x - roomCenter.x) <= 10 &&
        Math.abs(lastPoint.y - roomCenter.y) <= 10;

      if (!isLastPointRoomCenter) {
        finalPath.push(roomCenter);
      }

      await MapApi.savePath(roomId, finalPath);

      // Update local room data
      setRooms(prev => prev.map(r =>
        r.id === roomId
          ? { ...r, path: finalPath }
          : r
      ));
      return true;
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const deleteRoom = async (roomId: string): Promise<boolean> => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return false;

    const confirmDelete = confirm(`Are you sure you want to delete the room "${room.name}"?\n\nThis action cannot be undone.`);
    if (!confirmDelete) return false;

    try {
      await MapApi.deleteRoom(roomId);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      return true;
    } catch (error) {
      alert(`Error deleting room: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const deleteAllRooms = async (): Promise<void> => {
    if (rooms.length === 0) return;

    const confirmDeleteAll = confirm(
      `Are you sure you want to delete ALL ${rooms.length} rooms?\n\n` +
      `This will remove all rooms and their navigation paths.\n` +
      `This action cannot be undone.`
    );
    if (!confirmDeleteAll) return;

    try {
      await Promise.all(rooms.map(room => MapApi.deleteRoom(room.id)));
      setRooms([]);
      alert('All rooms deleted successfully');
    } catch (error) {
      alert('Error deleting rooms. Some rooms may not have been deleted.');
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  return {
    rooms,
    entrancePoint,
    loading,
    saveRoom,
    saveEntrance,
    savePath,
    deleteRoom,
    deleteAllRooms
  };
}
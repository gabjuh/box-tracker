import { Room, EntrancePoint } from '@/types/map';

export class MapApi {
  static async loadRooms(): Promise<Room[]> {
    const response = await fetch('/api/map/rooms');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to load rooms');
  }

  static async loadEntrance(): Promise<EntrancePoint> {
    const response = await fetch('/api/map/entrance');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to load entrance');
  }

  static async saveRoom(
    name: string,
    centerX: number,
    centerY: number,
    pathPoints: { x: number; y: number }[] = []
  ): Promise<Room> {
    const response = await fetch('/api/map/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        centerX,
        centerY,
        pathPoints
      })
    });

    if (response.ok) {
      return await response.json();
    } else if (response.status === 409) {
      throw new Error('ROOM_EXISTS');
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save room');
    }
  }

  static async updateRoom(
    roomId: string,
    name: string,
    centerX: number,
    centerY: number,
    pathPoints: { x: number; y: number }[] = []
  ): Promise<Room> {
    const response = await fetch(`/api/map/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        centerX,
        centerY,
        pathPoints
      })
    });

    if (response.ok) {
      return await response.json();
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update room');
    }
  }

  static async deleteRoom(roomId: string): Promise<void> {
    const response = await fetch(`/api/map/rooms/${roomId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete room');
    }
  }

  static async saveEntrance(x: number, y: number): Promise<EntrancePoint> {
    const response = await fetch('/api/map/entrance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y })
    });

    if (response.ok) {
      return await response.json();
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save entrance');
    }
  }

  static async savePath(roomId: string, pathPoints: { x: number; y: number }[]): Promise<void> {
    const response = await fetch(`/api/map/rooms/${roomId}/path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathPoints })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save path');
    }
  }
}
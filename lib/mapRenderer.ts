import { EntrancePoint, MapCoordinates, RecordingMode, Room } from '@/types/map';

export class MapRenderer {
  static drawEntrance(
    ctx: CanvasRenderingContext2D,
    entrance: EntrancePoint
  ): void {
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(entrance.x, entrance.y, 8, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Du bist hier', entrance.x, entrance.y - 15);
  }

  static drawRoomPoint(
    ctx: CanvasRenderingContext2D,
    room: Room,
    isSelected = false,
    fontSize = 20
  ): void {
    ctx.fillStyle = isSelected ? '#ef4444' : '#3b82f6';
    ctx.beginPath();
    ctx.arc(room.center.x, room.center.y, 8, 0, 2 * Math.PI);
    ctx.fill();

    this.drawRoomLabel(ctx, room, isSelected ? '#ef4444' : '#3b82f6', fontSize);
  }

  static drawRoomLabel(
    ctx: CanvasRenderingContext2D,
    room: Room,
    color: string,
    fontSize = 16
  ): void {
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';

    // Measure text for background sizing
    const textMetrics = ctx.measureText(room.name);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;
    const padding = fontSize > 16 ? 8 : 6;

    // Draw background rectangle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(
      room.center.x - textWidth / 2 - padding,
      room.center.y - 30 - textHeight / 2 - padding,
      textWidth + padding * 2,
      textHeight + padding * 2
    );

    // Draw text
    ctx.fillStyle = color;
    ctx.fillText(room.name, room.center.x, room.center.y - 24);
  }

  static drawAllRooms(
    ctx: CanvasRenderingContext2D,
    rooms: Room[],
    selectedRoom?: string
  ): void {
    rooms.forEach(room => {
      const isSelected = selectedRoom === room.id;
      this.drawRoomPoint(ctx, room, isSelected, 16);
    });
  }

  static drawSelectedRoom(
    ctx: CanvasRenderingContext2D,
    room: Room
  ): void {
    this.drawRoomPoint(ctx, room, true, 20);
  }

  static drawRecordingIndicators(
    ctx: CanvasRenderingContext2D,
    selectedCoords: MapCoordinates | null,
    recordingMode: RecordingMode
  ): void {
    if (!selectedCoords || (recordingMode !== 'room' && recordingMode !== 'entrance')) return;

    ctx.fillStyle = recordingMode === 'entrance' ? '#3b82f6' : '#ef4444';
    ctx.beginPath();
    ctx.arc(selectedCoords.x, selectedCoords.y, 8, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(selectedCoords.x, selectedCoords.y, 10, 0, 2 * Math.PI);
    ctx.stroke();
  }

  static drawPathRecording(
    ctx: CanvasRenderingContext2D,
    entrance: EntrancePoint,
    room: Room,
    recordingPath: MapCoordinates[]
  ): void {
    // Show the destination room center point
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(room.center.x, room.center.y, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Draw room name with background
    this.drawRoomLabel(ctx, room, '#ef4444', 16);

    // Draw path if we have recorded points
    if (recordingPath.length > 0) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(entrance.x, entrance.y);

      // Draw to all recorded points
      recordingPath.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });

      // Draw line to room center (final destination)
      ctx.lineTo(room.center.x, room.center.y);
      ctx.stroke();

      // Draw recorded waypoints
      recordingPath.forEach((point, index) => {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Draw point number
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((index + 1).toString(), point.x, point.y + 4);
      });

      // Draw final destination marker
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(room.center.x, room.center.y, 12, 0, 2 * Math.PI);
      ctx.stroke();
    } else {
      // Show preview line from entrance to room center when no waypoints yet
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(entrance.x, entrance.y);
      ctx.lineTo(room.center.x, room.center.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  static clearCanvas(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    mapImage: HTMLImageElement
  ): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
  }
}
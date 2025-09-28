'use client';

import { useEffect, useRef, useState } from 'react';

interface Room {
  id: string;
  name: string;
  center: { x: number; y: number };
  path: { x: number; y: number }[];
}

interface EntrancePoint {
  x: number;
  y: number;
}

type RecordingMode = 'none' | 'room' | 'entrance' | 'path';

export default function InteractiveMap() {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [entrancePoint, setEntrancePoint] = useState<EntrancePoint>({ x: 370, y: 400 });
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [showCoords, setShowCoords] = useState(false);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('none');
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ x: number; y: number } | null>(null);
  const [pathRecordingRoom, setPathRecordingRoom] = useState<string | null>(null);
  const [recordingPath, setRecordingPath] = useState<{ x: number; y: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [repeatAnimation, setRepeatAnimation] = useState(false);
  const animationRef = useRef<{ shouldStop: boolean }>({ shouldStop: false });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapImageRef = useRef<HTMLImageElement>(null);


  // Load data from API
  const loadMapData = async () => {
    try {
      setLoading(true);

      // Load rooms
      const roomsResponse = await fetch('/api/map/rooms');
      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        setRooms(roomsData);
      }

      // Load entrance point
      const entranceResponse = await fetch('/api/map/entrance');
      if (entranceResponse.ok) {
        const entranceData = await entranceResponse.json();
        setEntrancePoint(entranceData);
      }
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save room to database
  const saveRoom = async (name: string, centerX: number, centerY: number, pathPoints: { x: number; y: number }[] = []) => {
    try {
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
        const newRoom = await response.json();
        setRooms(prev => [...prev, newRoom]);
        return true;
      } else if (response.status === 409) {
        // Room already exists - ask user what to do
        const overwrite = confirm(
          `A room named "${name}" already exists. Do you want to overwrite it?\n\n` +
          `Click OK to overwrite the existing room.\n` +
          `Click Cancel to keep the current recording and change the name.`
        );

        if (overwrite) {
          // Find existing room ID and update it
          const existingRoom = rooms.find(room => room.name.toLowerCase() === name.toLowerCase());
          if (existingRoom) {
            const updateResponse = await fetch(`/api/map/rooms/${existingRoom.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name,
                centerX,
                centerY,
                pathPoints
              })
            });

            if (updateResponse.ok) {
              const updatedRoom = await updateResponse.json();
              setRooms(prev => prev.map(room =>
                room.id === existingRoom.id ? updatedRoom : room
              ));
              return true;
            } else {
              const error = await updateResponse.json();
              alert(`Error updating room: ${error.error}`);
              return false;
            }
          }
        } else {
          // User chose not to overwrite - keep recording mode active so they can change the name
          return false;
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return false;
      }
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Error saving room');
      return false;
    }
  };

  // Save entrance to database
  const saveEntrance = async (x: number, y: number) => {
    try {
      const response = await fetch('/api/map/entrance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y })
      });

      if (response.ok) {
        const entranceData = await response.json();
        setEntrancePoint(entranceData);
        return true;
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return false;
      }
    } catch (error) {
      console.error('Error saving entrance:', error);
      alert('Error saving entrance');
      return false;
    }
  };

  // Save path to database
  const savePath = async (roomId: string, pathPoints: { x: number; y: number }[]) => {
    try {
      const response = await fetch(`/api/map/rooms/${roomId}/path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathPoints })
      });

      if (response.ok) {
        // Update local room data
        setRooms(prev => prev.map(room =>
          room.id === roomId
            ? { ...room, path: pathPoints }
            : room
        ));
        return true;
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return false;
      }
    } catch (error) {
      console.error('Error saving path:', error);
      alert('Error saving path');
      return false;
    }
  };

  // Get mouse coordinates relative to canvas
  const getCanvasCoords = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.round((event.clientX - rect.left) * scaleX),
      y: Math.round((event.clientY - rect.top) * scaleY)
    };
  };

  // Handle mouse move
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(event);
    setMouseCoords(coords);
    setShowCoords(recordingMode !== 'none');
  };

  // Handle mouse click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (recordingMode === 'none') return;

    const coords = getCanvasCoords(event);

    if (recordingMode === 'room' || recordingMode === 'entrance') {
      setSelectedCoords(coords);
    } else if (recordingMode === 'path' && pathRecordingRoom) {
      setRecordingPath(prev => [...prev, coords]);
    }
  };

  // Start recording room
  const startRoomRecording = () => {
    if (!newRoomName.trim()) {
      alert('Please enter a room name');
      return;
    }
    setRecordingMode('room');
    setSelectedCoords(null);
  };

  // Save recorded room
  const saveRecordedRoom = async () => {
    if (!selectedCoords || !newRoomName.trim()) return;

    const success = await saveRoom(newRoomName, selectedCoords.x, selectedCoords.y);
    if (success) {
      setRecordingMode('none');
      setNewRoomName('');
      setSelectedCoords(null);
    }
  };

  // Start entrance recording
  const startEntranceRecording = () => {
    setRecordingMode('entrance');
    setSelectedCoords(null);
  };

  // Save recorded entrance
  const saveRecordedEntrance = async () => {
    if (!selectedCoords) return;

    const success = await saveEntrance(selectedCoords.x, selectedCoords.y);
    if (success) {
      setRecordingMode('none');
      setSelectedCoords(null);
    }
  };

  // Start path recording
  const startPathRecording = (roomId: string) => {
    setPathRecordingRoom(roomId);
    setRecordingMode('path');
    setRecordingPath([]);
  };

  // Save recorded path
  const saveRecordedPath = async () => {
    if (!pathRecordingRoom || recordingPath.length === 0) return;

    // Get the room center as the final destination
    const room = rooms.find(r => r.id === pathRecordingRoom);
    if (!room) return;

    // Add room center as final point if it's not already there
    let finalPath = [...recordingPath];
    const lastPoint = finalPath[finalPath.length - 1];
    const roomCenter = room.center;

    // Check if the last point is already the room center (within 10 pixels tolerance)
    const isLastPointRoomCenter = lastPoint &&
      Math.abs(lastPoint.x - roomCenter.x) <= 10 &&
      Math.abs(lastPoint.y - roomCenter.y) <= 10;

    if (!isLastPointRoomCenter) {
      finalPath.push(roomCenter);
    }

    const success = await savePath(pathRecordingRoom, finalPath);
    if (success) {
      setRecordingMode('none');
      setPathRecordingRoom(null);
      setRecordingPath([]);
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    setRecordingMode('none');
    setSelectedCoords(null);
    setNewRoomName('');
    setPathRecordingRoom(null);
    setRecordingPath([]);
  };

  // Delete room from database
  const deleteRoom = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const confirmDelete = confirm(`Are you sure you want to delete the room "${room.name}"?\n\nThis action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/map/rooms/${roomId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setRooms(prev => prev.filter(r => r.id !== roomId));
        if (selectedRoom === roomId) {
          setSelectedRoom(null);
        }
        return true;
      } else {
        const error = await response.json();
        alert(`Error deleting room: ${error.error}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Error deleting room');
      return false;
    }
  };

  // Delete all rooms from database
  const deleteAllRooms = async () => {
    if (rooms.length === 0) return;

    const confirmDeleteAll = confirm(
      `Are you sure you want to delete ALL ${rooms.length} rooms?\n\n` +
      `This will remove all rooms and their navigation paths.\n` +
      `This action cannot be undone.`
    );
    if (!confirmDeleteAll) return;

    try {
      const deletePromises = rooms.map(room =>
        fetch(`/api/map/rooms/${room.id}`, { method: 'DELETE' })
      );

      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter(response => !response.ok);

      if (failedDeletes.length === 0) {
        setRooms([]);
        setSelectedRoom(null);
        alert('All rooms deleted successfully');
      } else {
        alert(`Failed to delete ${failedDeletes.length} rooms. Please try again.`);
      }
    } catch (error) {
      console.error('Error deleting all rooms:', error);
      alert('Error deleting rooms');
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  // Stop animation when repeat checkbox is unchecked
  useEffect(() => {
    if (!repeatAnimation) {
      animationRef.current.shouldStop = true;
    }
  }, [repeatAnimation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const mapImage = mapImageRef.current;
    if (!canvas || !mapImage || loading) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawMap = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

      // Draw entrance point
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(entrancePoint.x, entrancePoint.y, 8, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Du bist hier', entrancePoint.x, entrancePoint.y - 15);

      // Show room points based on toggle or selection
      if (showAllRooms && !isAnimating) {
        // Show all rooms
        rooms.forEach(room => {
          const isSelected = selectedRoom === room.id;
          ctx.fillStyle = isSelected ? '#ef4444' : '#3b82f6';
          ctx.beginPath();
          ctx.arc(room.center.x, room.center.y, 6, 0, 2 * Math.PI);
          ctx.fill();

          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';

          // Measure text for background sizing
          const textMetrics = ctx.measureText(room.name);
          const textWidth = textMetrics.width;
          const textHeight = 16;
          const padding = 6;

          // Draw background rectangle
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(
            room.center.x - textWidth / 2 - padding,
            room.center.y - 12 - textHeight / 2 - padding,
            textWidth + padding * 2,
            textHeight + padding * 2
          );

          // Draw text
          ctx.fillStyle = isSelected ? '#ef4444' : '#3b82f6';
          ctx.fillText(room.name, room.center.x, room.center.y - 12);
        });
      } else if (selectedRoom && !isAnimating) {
        // Show only selected room
        const selectedRoomData = rooms.find(r => r.id === selectedRoom);
        if (selectedRoomData) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(selectedRoomData.center.x, selectedRoomData.center.y, 6, 0, 2 * Math.PI);
          ctx.fill();

          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';

          // Measure text for background sizing
          const textMetrics = ctx.measureText(selectedRoomData.name);
          const textWidth = textMetrics.width;
          const textHeight = 20;
          const padding = 8;

          // Draw background rectangle
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(
            selectedRoomData.center.x - textWidth / 2 - padding,
            selectedRoomData.center.y - 12 - textHeight / 2 - padding,
            textWidth + padding * 2,
            textHeight + padding * 2
          );

          // Draw text
          ctx.fillStyle = '#ef4444';
          ctx.fillText(selectedRoomData.name, selectedRoomData.center.x, selectedRoomData.center.y - 12);
        }
      }

      // Draw recording indicators
      if (selectedCoords && (recordingMode === 'room' || recordingMode === 'entrance')) {
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

      // Draw path recording points
      if (recordingMode === 'path' && pathRecordingRoom) {
        const recordingRoom = rooms.find(r => r.id === pathRecordingRoom);
        if (recordingRoom) {
          // Show the destination room center point
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(recordingRoom.center.x, recordingRoom.center.y, 8, 0, 2 * Math.PI);
          ctx.fill();

          // Draw room name with background
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          const textMetrics = ctx.measureText(recordingRoom.name);
          const textWidth = textMetrics.width;
          const textHeight = 16;
          const padding = 6;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(
            recordingRoom.center.x - textWidth / 2 - padding,
            recordingRoom.center.y - 20 - textHeight / 2 - padding,
            textWidth + padding * 2,
            textHeight + padding * 2
          );

          ctx.fillStyle = '#ef4444';
          ctx.fillText(recordingRoom.name, recordingRoom.center.x, recordingRoom.center.y - 20);

          // Draw path if we have recorded points
          if (recordingPath.length > 0) {
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(entrancePoint.x, entrancePoint.y);

            // Draw to all recorded points
            recordingPath.forEach(point => {
              ctx.lineTo(point.x, point.y);
            });

            // Draw line to room center (final destination)
            ctx.lineTo(recordingRoom.center.x, recordingRoom.center.y);
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
            ctx.arc(recordingRoom.center.x, recordingRoom.center.y, 12, 0, 2 * Math.PI);
            ctx.stroke();
          } else {
            // Show preview line from entrance to room center when no waypoints yet
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(entrancePoint.x, entrancePoint.y);
            ctx.lineTo(recordingRoom.center.x, recordingRoom.center.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
    };

    const animatePath = (room: Room) => {
      if (isAnimating) return;
      setIsAnimating(true);
      animationRef.current.shouldStop = false;

      // Build complete path including entrance point
      const completePath = [entrancePoint, ...room.path];

      // Create smooth path with curved corners
      const smoothPath = [];
      const cornerRadius = 20; // Radius for corner smoothing

      for (let i = 0; i < completePath.length; i++) {
        const curr = completePath[i];
        const prev = completePath[i - 1];
        const next = completePath[i + 1];

        if (i === 0) {
          // First point - start normally
          smoothPath.push({ type: 'move', x: curr.x, y: curr.y });
        } else if (i === completePath.length - 1) {
          // Last point - end normally
          smoothPath.push({ type: 'line', x: curr.x, y: curr.y });
        } else {
          // Middle point - create curved corner
          const prevVec = { x: curr.x - prev.x, y: curr.y - prev.y };
          const nextVec = { x: next.x - curr.x, y: next.y - curr.y };

          const prevLen = Math.sqrt(prevVec.x * prevVec.x + prevVec.y * prevVec.y);
          const nextLen = Math.sqrt(nextVec.x * nextVec.x + nextVec.y * nextVec.y);

          // Normalize vectors
          prevVec.x /= prevLen;
          prevVec.y /= prevLen;
          nextVec.x /= nextLen;
          nextVec.y /= nextLen;

          // Calculate corner points
          const radius = Math.min(cornerRadius, prevLen / 2, nextLen / 2);
          const cornerStart = {
            x: curr.x - prevVec.x * radius,
            y: curr.y - prevVec.y * radius
          };
          const cornerEnd = {
            x: curr.x + nextVec.x * radius,
            y: curr.y + nextVec.y * radius
          };

          // Add line to corner start, then curve to corner end
          smoothPath.push({ type: 'line', x: cornerStart.x, y: cornerStart.y });
          smoothPath.push({
            type: 'curve',
            cpx: curr.x,
            cpy: curr.y,
            x: cornerEnd.x,
            y: cornerEnd.y
          });
        }
      }

      // Calculate total path length for consistent speed
      let totalDistance = 0;
      const segmentLengths: number[] = [];

      for (let i = 1; i < smoothPath.length; i++) {
        const prev = smoothPath[i - 1];
        const curr = smoothPath[i];

        let distance = 0;
        if (curr.type === 'line') {
          distance = Math.sqrt(
            Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
          );
        } else if (curr.type === 'curve') {
          // Approximate curve length using multiple points
          const steps = 10;
          let curveDistance = 0;
          for (let step = 0; step < steps; step++) {
            const t1 = step / steps;
            const t2 = (step + 1) / steps;

            const p1x = Math.pow(1 - t1, 2) * prev.x + 2 * (1 - t1) * t1 * curr.cpx + Math.pow(t1, 2) * curr.x;
            const p1y = Math.pow(1 - t1, 2) * prev.y + 2 * (1 - t1) * t1 * curr.cpy + Math.pow(t1, 2) * curr.y;
            const p2x = Math.pow(1 - t2, 2) * prev.x + 2 * (1 - t2) * t2 * curr.cpx + Math.pow(t2, 2) * curr.x;
            const p2y = Math.pow(1 - t2, 2) * prev.y + 2 * (1 - t2) * t2 * curr.cpy + Math.pow(t2, 2) * curr.y;

            curveDistance += Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
          }
          distance = curveDistance;
        }

        segmentLengths.push(distance);
        totalDistance += distance;
      }

      // Animation parameters
      const animationDuration = 2000; // 2 seconds total
      let startTime = Date.now();

      // Ease-in-out function
      const easeInOut = (t: number) => {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      };

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const rawProgress = Math.min(elapsed / animationDuration, 1);
        const easedProgress = easeInOut(rawProgress);
        const currentDistance = totalDistance * easedProgress;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

        // Draw the path progressively
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 4;
        ctx.setLineDash([]);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(entrancePoint.x, entrancePoint.y);

        // Draw the smooth path progressively
        let accumulatedDistance = 0;

        for (let i = 0; i < segmentLengths.length; i++) {
          const segmentStart = accumulatedDistance;
          const segmentEnd = accumulatedDistance + segmentLengths[i];
          const pathSegment = smoothPath[i + 1]; // +1 because smoothPath[0] is 'move'

          if (currentDistance >= segmentEnd) {
            // Complete this segment
            if (pathSegment.type === 'line') {
              ctx.lineTo(pathSegment.x, pathSegment.y);
            } else if (pathSegment.type === 'curve') {
              ctx.quadraticCurveTo(pathSegment.cpx, pathSegment.cpy, pathSegment.x, pathSegment.y);
            }
          } else if (currentDistance > segmentStart) {
            // Partial segment
            const segmentProgress = (currentDistance - segmentStart) / segmentLengths[i];
            const prevSegment = smoothPath[i];

            if (pathSegment.type === 'line') {
              const currentX = prevSegment.x + (pathSegment.x - prevSegment.x) * segmentProgress;
              const currentY = prevSegment.y + (pathSegment.y - prevSegment.y) * segmentProgress;
              ctx.lineTo(currentX, currentY);
            } else if (pathSegment.type === 'curve') {
              // Draw partial quadratic curve by subdividing the curve
              const t = segmentProgress;

              // Use De Casteljau's algorithm to subdivide the curve at parameter t
              const p0 = { x: prevSegment.x, y: prevSegment.y };
              const p1 = { x: pathSegment.cpx, y: pathSegment.cpy };
              const p2 = { x: pathSegment.x, y: pathSegment.y };

              // First subdivision level
              const p01 = { x: p0.x + t * (p1.x - p0.x), y: p0.y + t * (p1.y - p0.y) };
              const p12 = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };

              // Second subdivision level (final point)
              const p012 = { x: p01.x + t * (p12.x - p01.x), y: p01.y + t * (p12.y - p01.y) };

              // Draw the partial curve using the subdivided control point
              ctx.quadraticCurveTo(p01.x, p01.y, p012.x, p012.y);
            }
            break;
          } else {
            break;
          }

          accumulatedDistance += segmentLengths[i];
        }

        ctx.stroke();

        // Draw entrance point
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(entrancePoint.x, entrancePoint.y, 8, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Du bist hier', entrancePoint.x, entrancePoint.y - 15);

        // Only draw the destination room point and name when animation is complete
        if (rawProgress >= 1) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(room.center.x, room.center.y, 6, 0, 2 * Math.PI);
          ctx.fill();

          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';

          // Measure text for background sizing
          const textMetrics = ctx.measureText(room.name);
          const textWidth = textMetrics.width;
          const textHeight = 20;
          const padding = 8;

          // Draw background rectangle
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(
            room.center.x - textWidth / 2 - padding,
            room.center.y - 12 - textHeight / 2 - padding,
            textWidth + padding * 2,
            textHeight + padding * 2
          );

          // Draw text
          ctx.fillStyle = '#ef4444';
          ctx.fillText(room.name, room.center.x, room.center.y - 12);
        }

        if (rawProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          if (repeatAnimation && !animationRef.current.shouldStop) {
            // Restart animation if repeat is enabled and not stopped
            setTimeout(() => {
              if (!animationRef.current.shouldStop) {
                startTime = Date.now(); // Reset start time for new animation
                animate();
              } else {
                setIsAnimating(false);
                setSelectedRoom(null);
                drawMap();
              }
            }, 500); // Brief pause before repeating
          } else {
            setTimeout(() => {
              setIsAnimating(false);
              setSelectedRoom(null); // Clear selection after animation
              drawMap();
            }, 1000);
          }
        }
      };

      animate();
    };

    if (selectedRoom) {
      const room = rooms.find(r => r.id === selectedRoom);
      if (room) {
        animatePath(room);
      }
    } else {
      drawMap();
    }

    mapImage.onload = drawMap;
    if (mapImage.complete) drawMap();
  }, [selectedRoom, isAnimating, rooms, entrancePoint, selectedCoords, recordingMode, recordingPath, loading, showAllRooms, pathRecordingRoom, repeatAnimation]);

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
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Interactive Map Editor</h2>

      {/* Recording Controls */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Map Recording Tools</h3>

        {recordingMode === 'none' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Add Room */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <button
                onClick={startRoomRecording}
                className="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add Room
              </button>
            </div>

            {/* Record Entrance */}
            <button
              onClick={startEntranceRecording}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Set Entrance Point
            </button>

            {/* Record Path dropdown */}
            <select
              onChange={(e) => e.target.value && startPathRecording(e.target.value)}
              value=""
              className="px-3 py-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Record Path for...</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-3">
            {recordingMode === 'room' && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Click on the map to set the center point for &quot;{newRoomName}&quot;
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={saveRecordedRoom}
                    disabled={!selectedCoords}
                    className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    Save Room
                  </button>
                  <button
                    onClick={cancelRecording}
                    className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {recordingMode === 'entrance' && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Click on the map to set the entrance point
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={saveRecordedEntrance}
                    disabled={!selectedCoords}
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    Save Entrance
                  </button>
                  <button
                    onClick={cancelRecording}
                    className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {recordingMode === 'path' && pathRecordingRoom && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Click on the map to add waypoints for &quot;{rooms.find(r => r.id === pathRecordingRoom)?.name}&quot;
                  ({recordingPath.length} points recorded)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={saveRecordedPath}
                    disabled={recordingPath.length === 0}
                    className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    Save Path ({recordingPath.length} points)
                  </button>
                  <button
                    onClick={() => setRecordingPath([])}
                    className="px-4 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Clear Points
                  </button>
                  <button
                    onClick={cancelRecording}
                    className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Coordinate Display */}
      {showCoords && (
        <div className="mb-4 p-2 bg-blue-100 dark:bg-blue-900 rounded text-sm">
          Mouse coordinates: X: {mouseCoords.x}, Y: {mouseCoords.y}
          {selectedCoords && (
            <span className="ml-4 font-semibold">
              Selected: X: {selectedCoords.x}, Y: {selectedCoords.y}
            </span>
          )}
        </div>
      )}

      {/* Map Canvas */}
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
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          className="w-full h-auto border border-gray-300 dark:border-gray-600 cursor-crosshair"
        />
      </div>

      {/* Test Navigation */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Test Navigation:</h3>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={showAllRooms}
                onChange={(e) => setShowAllRooms(e.target.checked)}
                className="rounded"
              />
              Show all rooms
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={repeatAnimation}
                onChange={(e) => setRepeatAnimation(e.target.checked)}
                className="rounded"
              />
              Repeat animation
            </label>
            {rooms.length > 0 && (
              <button
                onClick={deleteAllRooms}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete All
              </button>
            )}
          </div>
        </div>

        {rooms.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {rooms.map(room => (
              <div key={room.id} className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedRoom(room.id)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    selectedRoom === room.id && isAnimating
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900'
                  }`}
                >
                  {room.name}
                </button>
                <button
                  onClick={() => deleteRoom(room.id)}
                  disabled={isAnimating}
                  className="px-2 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900 rounded disabled:opacity-50"
                  title="Delete room"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No rooms recorded yet. Use the recording tools above to add rooms and their navigation paths.
          </p>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>• Use recording tools above to add rooms, set entrance, and record paths</p>
        <p>• Test navigation by clicking room buttons to see animated paths</p>
        <p>• All data is saved to the database automatically</p>
      </div>
    </div>
  );
}
'use client';

interface CoordinateDisplayProps {
  showCoords: boolean;
  mouseCoords: { x: number; y: number };
  selectedCoords: { x: number; y: number } | null;
}

export default function CoordinateDisplay({
  showCoords,
  mouseCoords,
  selectedCoords
}: CoordinateDisplayProps) {
  if (!showCoords) return null;

  return (
    <div className="mb-4 p-2 bg-blue-100 dark:bg-blue-900 rounded text-sm">
      Mouse coordinates: X: {mouseCoords.x}, Y: {mouseCoords.y}
      {selectedCoords && (
        <span className="ml-4 font-semibold">
          Selected: X: {selectedCoords.x}, Y: {selectedCoords.y}
        </span>
      )}
    </div>
  );
}
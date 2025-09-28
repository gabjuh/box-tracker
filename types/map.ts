export interface Room {
  id: string;
  name: string;
  center: { x: number; y: number };
  path: { x: number; y: number }[];
}

export interface EntrancePoint {
  x: number;
  y: number;
}

export type RecordingMode = 'none' | 'room' | 'entrance' | 'path';

export interface MapCoordinates {
  x: number;
  y: number;
}

export interface PathSegment {
  type: 'move' | 'line' | 'curve';
  x: number;
  y: number;
  cpx?: number;
  cpy?: number;
}

export interface AnimationState {
  shouldStop: boolean;
}
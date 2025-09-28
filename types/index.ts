export interface Box {
  id: number
  boxNumber: string
  images: string | null // JSON string array of image paths
  items: string
  keywords: string
  zielraum: string | null // Target room ID (references MapRoom.roomId)
  weight: number | null // Weight in kg (e.g., 5.45)
  mainImageIndex: number
  createdAt: string
}
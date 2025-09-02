export interface Box {
  id: number
  boxNumber: string
  images: string | null // JSON string array of image paths
  items: string
  keywords: string
  createdAt: string
}
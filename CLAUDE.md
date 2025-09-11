# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Box Tracker is a Next.js application for tracking moving boxes and their contents. It allows users to create, search, and manage boxes with images, items lists, and keywords for easy organization during moves.

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build with Turbopack
npm run build

# Start production server
npm start

# Linting
npm run lint

# Database backup
npm run backup-db

# Optimize existing uploaded images
npm run optimize-images
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS 4
- **Image Processing**: Sharp for automatic optimization
- **File Uploads**: Multer for handling multipart form data
- **TypeScript**: Full TypeScript support

### Database Schema
The application uses a single `Box` model with these fields:
- `id`: Auto-incrementing primary key
- `boxNumber`: Unique string identifier
- `images`: JSON string array of image paths (nullable)
- `items`: String containing box contents
- `keywords`: Comma-separated keywords for search
- `createdAt`/`updatedAt`: Timestamps

### Key Directories

- `app/`: Next.js App Router pages and API routes
  - `api/boxes/`: REST API endpoints for box CRUD operations
  - `add/`: Form for creating new boxes
  - `edit/[id]/`: Dynamic route for editing boxes
- `components/`: Reusable React components
  - `BoxCard.tsx`: Box display component with image carousel
  - `ImageManager.tsx`: Handles image uploads and previews
  - `PaginationControls.tsx`: Search result pagination
- `lib/`: Utility libraries
  - `prisma.ts`: Database client configuration
  - `imageOptimizer.ts`: Automatic image compression and optimization
- `prisma/`: Database schema and migrations
- `scripts/`: Utility scripts for maintenance tasks
- `types/`: TypeScript type definitions

### Image Optimization System
The application automatically optimizes uploaded images:
- Target size: <100KB per image
- Max dimensions: 1200x1200px
- Quality: 85%
- Supported formats: JPEG, PNG, WebP, GIF
- Uses Sharp library for processing
- Automatic optimization on upload via `ImageOptimizer` class

### API Architecture
- RESTful API using Next.js API routes
- GET `/api/boxes`: List/search boxes with optional search parameter
- POST `/api/boxes`: Create new box with image upload
- GET/PUT/DELETE `/api/boxes/[id]`: Individual box operations
- FormData handling for file uploads with automatic optimization

### Search and Pagination
- Client-side search across box numbers, items, and keywords
- Configurable page sizes (12, 24, 48, or "All")
- Sort by creation date (ascending/descending)
- Real-time filtering as user types

### Deployment Features
- Docker support with production and simple configurations
- Standalone Next.js output for containerization
- Backup and restore scripts for data management
- Nginx configuration for reverse proxy setup
- Support for Raspberry Pi deployment via dedicated scripts

### Environment Configuration
Uses environment variables for:
- Database URL (defaults to local SQLite)
- Production vs development settings
- Backup configuration for remote sync

## Testing

No test framework is currently configured. When adding tests, check the existing codebase patterns first.
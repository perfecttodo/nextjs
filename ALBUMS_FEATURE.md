# Albums Feature

## Overview

The Albums feature allows users to organize their audio files into collections. Each album belongs to a specific category and optionally to a group, providing a structured way to organize audio content.

## Features

### Album Management
- **Create Albums**: Users can create new albums with names and descriptions
- **Category Association**: Every album must belong to a specific category
- **Group Association**: Albums can optionally belong to a group (personal or shared)
- **Unique Naming**: Album names are unique per user within the same category

### Audio File Organization
- **Album Assignment**: Audio files can be assigned to specific albums
- **Default Album**: If no album is selected, audio files are marked as "Single" (individual files)
- **Album Filtering**: Albums are filtered by category and group selection

### User Experience
- **Dynamic Loading**: Albums are loaded based on selected category and group
- **Inline Creation**: Users can create new albums directly from the audio creation form
- **Visual Feedback**: Clear indication of album ownership and group association

## Database Schema

### Album Model
```prisma
model Album {
  id          String     @id @default(uuid())
  name        String
  description String?
  color       String?    // Hex color for UI display
  ownerId     String
  owner       User       @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  groupId     String?    // Optional group association
  group       Group?     @relation(fields: [groupId], references: [id])
  categoryId  String     // Required category association
  category    Category   @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  episodes  Episode[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@unique([name, ownerId]) // Allow same name for different owners
  @@index([ownerId])
  @@index([groupId])
  @@index([categoryId])
}
```

### Updated Episode Model
```prisma
model Episode {
  // ... existing fields ...
  albumId       String?     // Add album relationship
  album         Album?      @relation(fields: [albumId], references: [id])
  // ... existing fields ...
}
```

## API Endpoints

### GET /api/episode/albums
Fetches albums for a user based on category and optional group.

**Query Parameters:**
- `categoryId` (required): The category ID to filter albums
- `ownerId` (required): The user ID who owns the albums
- `groupId` (optional): The group ID to filter albums

**Response:**
```json
{
  "albums": [
    {
      "id": "uuid",
      "name": "Album Name",
      "description": "Album Description",
      "color": "#FF0000",
      "ownerId": "user-id",
      "groupId": "group-id",
      "categoryId": "category-id",
      "group": { "id": "group-id", "name": "Group Name" },
      "category": { "id": "category-id", "name": "Category Name" },
      "_count": { "episodes": 5 },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/episode/albums
Creates a new album.

**Request Body:**
```json
{
  "name": "Album Name",
  "description": "Album Description",
  "categoryId": "category-id",
  "groupId": "group-id",
  "ownerId": "user-id"
}
```

**Response:**
Returns the created album with full details.

## Frontend Components

### AlbumSelector
The main component for managing albums in the audio creation form.

**Features:**
- Displays existing albums filtered by category and group
- Provides option to create new albums inline
- Shows "Single" option for individual audio files
- Handles album selection and creation

**Props:**
- `selectedAlbumId`: Currently selected album ID
- `selectedCategoryId`: Selected category ID
- `selectedGroupId`: Selected group ID
- `onAlbumChange`: Callback for album selection changes
- `ownerId`: Current user ID

### Integration Points
The Albums feature is integrated into all audio creation methods:
- **AudioUpload**: File uploads with album assignment
- **AudioRecorder**: Recorded audio with album assignment
- **FFmpegAudioRecorder**: Advanced recordings with album assignment
- **UrlAudio**: URL-based audio with album assignment

## Usage Flow

1. **User selects a category** in the audio creation form
2. **AlbumSelector loads** existing albums for that category and user
3. **User can either:**
   - Select an existing album
   - Create a new album inline
   - Choose "Single" for individual audio files
4. **Audio file is created** with the selected album association
5. **Album is automatically created** if user creates a new one during audio creation

## Benefits

- **Better Organization**: Users can group related audio files together
- **Improved Discovery**: Albums provide context and grouping for audio content
- **Flexible Structure**: Albums can be personal or shared within groups
- **Seamless Integration**: Album creation is integrated into the existing audio workflow
- **Category Alignment**: Albums respect the existing category structure

## Future Enhancements

- **Album Cover Images**: Visual representation for albums
- **Album Playlists**: Sequential playback of album tracks
- **Album Sharing**: Public/private album visibility
- **Album Analytics**: Usage statistics and insights
- **Bulk Operations**: Move multiple audio files between albums

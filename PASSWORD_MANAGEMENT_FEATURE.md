# Password Management Feature

## Overview
This feature allows users to manage their login passwords, including:
- Setting a password for OAuth accounts (GitHub/Google)
- Changing passwords for existing local accounts
- Secure password validation and hashing

## Features

### For OAuth Users (GitHub/Google)
- Users can set a password to enable email/password login
- No current password required when setting initial password
- After setting a password, users can use either OAuth or email/password login

### For Local Users
- Users can change their existing password
- Current password verification required for security
- Password must be at least 6 characters long

## Implementation Details

### API Endpoint
- **Route**: `/api/profile/password`
- **Method**: `PUT`
- **Authentication**: Required (session-based)

### Request Body
```json
{
  "currentPassword": "string (optional for OAuth users)",
  "newPassword": "string (required, min 6 chars)",
  "confirmPassword": "string (required, must match newPassword)"
}
```

### Security Features
- Password hashing using bcryptjs (12 rounds)
- Current password verification for existing passwords
- Input validation and sanitization
- Session-based authentication

### UI Components
- Password management section in user profile
- Dynamic form based on user type (OAuth vs Local)
- Real-time validation feedback
- Success/error message display

## Database Schema
The feature uses the existing `password` field in the `User` model:
```prisma
model User {
  id        String        @id
  email     String        @unique
  name      String?
  password  String?       // For email/password auth
  githubId  String?       @unique // For GitHub OAuth
  // ... other fields
}
```

## Usage Examples

### Setting Password for OAuth User
1. User logs in with GitHub/Google
2. Navigates to Profile page
3. Clicks "Set Password" button
4. Enters new password and confirmation
5. Password is set and user can now use email/password login

### Changing Password for Local User
1. User logs in with email/password
2. Navigates to Profile page
3. Clicks "Change Password" button
4. Enters current password, new password, and confirmation
5. Password is updated

## Error Handling
- Invalid current password
- Password confirmation mismatch
- Password too short (< 6 characters)
- Missing required fields
- Server errors

## Security Considerations
- Passwords are hashed using bcryptjs
- Current password verification prevents unauthorized changes
- Session-based authentication ensures user ownership
- Input validation prevents common attacks

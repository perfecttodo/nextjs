# Authentication Setup Guide

This project now supports multiple authentication methods:
- Google OAuth
- GitHub OAuth  
- Email/Password

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github-callback

# Public GitHub OAuth (for client-side)
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
NEXT_PUBLIC_GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github-callback

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/your_database"
```

## Setup Steps

### 1. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set authorized redirect URIs to `http://localhost:3000/api/auth/google-login`
6. Copy Client ID and Client Secret to your `.env.local`

### 2. GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Application name and Homepage URL
4. Set Authorization callback URL to `http://localhost:3000/api/auth/github-callback`
5. Copy Client ID and Client Secret to your `.env.local`

### 3. Database Setup
1. Run the Prisma migration to add new user fields:
   ```bash
   npx prisma migrate dev --name add_auth_fields
   ```

### 4. Install Dependencies
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

## Usage

### Sign Up Page
- Route: `/auth/signup`
- Supports email/password registration
- Includes Google and GitHub OAuth buttons

### Sign In Page  
- Route: `/auth/signin`
- Supports email/password authentication
- Includes Google and GitHub OAuth buttons

### Authentication Status
- Use `AuthNav` component to show login/logout links
- Check auth status with `/api/auth/me` endpoint

### Protected Routes
- Use `getSessionUser()` from `@/lib/session` to check authentication
- Redirect unauthenticated users to sign in page

## Security Features

- Passwords are hashed using bcryptjs
- JWT tokens are httpOnly cookies
- OAuth tokens are handled server-side only
- Session expiration after 7 days
- Secure cookie settings for production

## File Structure

```
src/app/
├── auth/
│   ├── signin/page.tsx          # Sign in page
│   └── signup/page.tsx          # Sign up page
├── api/auth/
│   ├── signin/route.ts          # Email/password sign in
│   ├── signup/route.ts          # Email/password sign up
│   ├── google-login/route.ts    # Google OAuth
│   ├── github-callback/route.ts # GitHub OAuth callback
│   ├── me/route.ts              # Check auth status
│   └── logout/route.ts          # Logout
└── components/
    ├── GoogleLoginButton.tsx    # Google OAuth button
    ├── GitHubLoginButton.tsx    # GitHub OAuth button
    └── AuthNav.tsx              # Authentication navigation
```

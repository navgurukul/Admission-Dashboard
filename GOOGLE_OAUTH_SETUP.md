# Google OAuth Setup for Admission Dashboard

## Prerequisites
- Supabase project with authentication enabled
- Google Cloud Console project

## Step 1: Configure Google OAuth in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application" as the application type
   - Add authorized redirect URIs:
     - `https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for local development)
5. Note down your Client ID and Client Secret

## Step 2: Configure Google OAuth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" in the list and click "Edit"
4. Enable Google authentication by toggling the switch
5. Enter your Google OAuth credentials:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
6. Save the configuration

## Step 3: Update Redirect URLs

Make sure your redirect URLs are properly configured:

### For Production:
- `https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback`
- `https://yourdomain.com/`

### For Development:
- `http://localhost:3000/`
- `http://localhost:5173/` (if using Vite default port)

## Step 4: Test the Integration

1. Start your development server
2. Navigate to the login page
3. Click "Continue with Google"
4. You should be redirected to Google's OAuth consent screen
5. After successful authentication, you'll be redirected back to your app
6. Check the browser console for user information logs

## Features Implemented

✅ **Google Sign-In Button**: Added a styled Google sign-in button with the official Google logo

✅ **OAuth Flow**: Implemented complete OAuth flow using Supabase's `signInWithOAuth` method

✅ **User Information Extraction**: Automatically extracts and stores:
- User's full name
- Email address
- Profile picture (avatar)
- Authentication provider (Google)

✅ **User Profile Display**: Updated sidebar to show:
- User's name from Google account
- Profile picture (if available)
- Email address
- Authentication method indicator

✅ **Session Management**: Proper session handling with automatic redirects

✅ **Error Handling**: Comprehensive error handling for OAuth failures

✅ **Loading States**: Loading indicators during authentication process

## User Information Available

After Google login, the following information is available:

```javascript
{
  id: "user-uuid",
  email: "user@gmail.com",
  name: "John Doe",
  avatar: "https://lh3.googleusercontent.com/...",
  provider: "google"
}
```

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error**:
   - Make sure your redirect URIs are exactly matched in both Google Console and Supabase
   - Check for trailing slashes and protocol (http vs https)

2. **"Client ID not found" error**:
   - Verify your Google OAuth Client ID is correct
   - Ensure the Google+ API is enabled in your Google Cloud project

3. **User not redirected after login**:
   - Check the `redirectTo` URL in the OAuth configuration
   - Verify your app's routing is working correctly

4. **User information not displaying**:
   - Check browser console for any errors
   - Verify localStorage is accessible
   - Check if the user metadata is being properly extracted

## Security Notes

- Never expose your Google OAuth Client Secret in client-side code
- Always use HTTPS in production
- Implement proper session management
- Consider implementing additional security measures like domain verification

## Next Steps

You can now:
1. Customize the user interface further
2. Add role-based access control based on Google account information
3. Implement additional OAuth providers (GitHub, Microsoft, etc.)
4. Add user profile management features 
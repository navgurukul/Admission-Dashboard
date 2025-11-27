# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar API integration for automatic Meet scheduling.

## Prerequisites

- Google Cloud Console Account
- Your Google Cloud Client ID (already configured): `203783247002-0mludsk4hhfttgehkb35mclfslhgps12.apps.googleusercontent.com`

## Setup Steps

### 1. Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one if needed)
3. Navigate to **APIs & Services** > **Library**
4. Search for "Google Calendar API"
5. Click on "Google Calendar API" and click **Enable**

### 2. Create API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the generated API Key
4. (Optional but recommended) Click on "Restrict Key" and add these restrictions:
   - **Application restrictions**: Select "HTTP referrers" and add your domain
   - **API restrictions**: Select "Restrict key" and choose "Google Calendar API"

### 3. Configure OAuth 2.0 Client ID

Your Client ID is already configured, but ensure these settings:

1. Go to **APIs & Services** > **Credentials**
2. Find your OAuth 2.0 Client ID: `203783247002-0mludsk4hhfttgehkb35mclfslhgps12.apps.googleusercontent.com`
3. Click on it to edit
4. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (for development)
   - Your production domain (e.g., `https://yourdomain.com`)
5. Under **Authorized redirect URIs**, add:
   - `http://localhost:5173` (for development)
   - Your production domain

### 4. Configure Environment Variables

1. Create a `.env` file in the root directory:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your API Key:

   ```env
   VITE_GOOGLE_CLIENT_ID=203783247002-0mludsk4hhfttgehkb35mclfslhgps12.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=your_actual_api_key_here
   ```

3. Replace `your_actual_api_key_here` with the API Key you created in Step 2

### 5. Test the Integration

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Navigate to the slot booking page
3. Select a date and time slot
4. Click "Book Selected Slot & Schedule Meet"
5. You'll be prompted to sign in with Google (first time only)
6. After signing in, a Google Calendar event will be created with a Meet link
7. The Meet link will be displayed on the booked slot details page

## Features

- **Automatic Google Meet Creation**: When a slot is booked, a Google Meet link is automatically generated
- **Calendar Event**: Creates a calendar event in the user's Google Calendar
- **Email Notifications**: Attendees receive email notifications with the Meet link
- **Reminders**: Automatic reminders (24 hours before via email, 30 minutes before via popup)
- **Event Cancellation**: When a slot is rescheduled, the calendar event is automatically deleted

## Troubleshooting

### Error: "The API key doesn't exist"

- Make sure you've added the API key in the `.env` file
- Restart the development server after adding environment variables

### Error: "Access blocked: This app's request is invalid"

- Check that your OAuth Client ID is properly configured
- Ensure authorized JavaScript origins and redirect URIs are added
- Make sure the Google Calendar API is enabled in your project

### Error: "Sign-in failed"

- Clear browser cache and cookies
- Try signing in with a different browser
- Check that your Google account has Calendar access enabled

### Google Meet link not appearing

- Ensure the user has granted Calendar permissions
- Check browser console for any errors
- Verify that conferenceDataVersion parameter is set to 1 in the API call

## Security Notes

- **Never commit** your `.env` file to version control
- The `.env.example` file is provided as a template only
- Restrict your API key to specific domains in production
- Regularly rotate your API keys for security

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Create Google Meet with Calendar API](https://developers.google.com/calendar/api/guides/create-events#conferencing)

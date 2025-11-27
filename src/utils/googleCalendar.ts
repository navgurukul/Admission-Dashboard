// Modern Google Calendar Integration using Google Identity Services (GIS)

const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "203783247002-amrp0mkp58jna7mhcf368vcn0ilnq7hd.apps.googleusercontent.com";
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

interface EventDetails {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  attendeeEmail: string;
  studentName: string;
}

// Store the access token
let accessToken: string | null = null;
let tokenClient: any = null;

// Initialize Google Identity Services
export const initClient = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // Check if API_KEY is configured
    if (!API_KEY || API_KEY === "") {
      reject(
        new Error(
          "Google API Key is not configured. Please add VITE_GOOGLE_API_KEY in .env file.",
        ),
      );
      return;
    }

    try {
      // Load Google Identity Services script
      if (typeof window === "undefined") {
        reject(new Error("Window object not available"));
        return;
      }

      // Check if google is already loaded
      if ((window as any).google) {
        // console.log("Google Identity Services already loaded");
        initTokenClient();
        resolve(true);
        return;
      }

      // Load the Google Identity Services script
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // console.log("Google Identity Services loaded successfully");
        initTokenClient();
        resolve(true);
      };
      script.onerror = (error) => {
        // console.error("Failed to load Google Identity Services:", error);
        reject(new Error("Failed to load Google Identity Services"));
      };
      document.head.appendChild(script);
    } catch (error) {
      // console.error("Error initializing Google Identity Services:", error);
      reject(error);
    }
  });
};

// Initialize the token client for OAuth
const initTokenClient = () => {
  try {
    const google = (window as any).google;
    if (!google) {
      throw new Error("Google Identity Services not loaded");
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.error) {
          // console.error("Token client error:", response);
          throw new Error(response.error);
        }
        accessToken = response.access_token;
        // console.log("Access token received successfully");
      },
    });

    // console.log("Token client initialized successfully");
  } catch (error) {
    // console.error("Error initializing token client:", error);
    throw error;
  }
};

// Request access token (triggers sign-in popup)
export const signIn = async (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      if (!tokenClient) {
        throw new Error(
          "Token client not initialized. Please refresh the page.",
        );
      }

      // console.log("Requesting access token...");

      // Set up callback for token response
      tokenClient.callback = (response: any) => {
        if (response.error) {
          console.error("Sign-in error:", response);
          reject(
            new Error(
              response.error_description ||
                response.error ||
                "Failed to sign in",
            ),
          );
          return;
        }

        accessToken = response.access_token;
        // console.log("Sign-in successful, access token received");
        resolve(true);
      };

      // Request access token - this opens the popup
      tokenClient.requestAccessToken({ prompt: "select_account" });
    } catch (error: any) {
      console.error("Error during sign-in:", error);
      reject(error);
    }
  });
};

// Check if user is signed in
export const isSignedIn = (): boolean => {
  return (
    accessToken !== null && accessToken !== undefined && accessToken !== ""
  );
};

// Sign out
export const signOut = async (): Promise<boolean> => {
  try {
    if (accessToken) {
      // Revoke the token
      const google = (window as any).google;
      if (google && google.accounts.oauth2) {
        google.accounts.oauth2.revoke(accessToken, () => {
          // console.log("Token revoked");
        });
      }
      accessToken = null;
    }
    // console.log("Signed out successfully");
    return true;
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Create calendar event with Google Meet link
export const createCalendarEvent = async (eventDetails: {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  attendeeEmail: string;
  studentName: string;
  attendees?: string[]; //for multiple attendees
}) => {
  try {
    if (!accessToken) {
      throw new Error("Not authenticated. Please sign in first.");
    }

    // Build attendees list
    const attendeesList = eventDetails.attendees || [
      eventDetails.attendeeEmail,
    ];
    const uniqueAttendees = [...new Set(attendeesList.filter(Boolean))];

    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.startDateTime,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: eventDetails.endDateTime,
        timeZone: "Asia/Kolkata",
      },
      attendees: uniqueAttendees.map((email) => ({ email })), // Add all attendees
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 },
        ],
      },
    };

    // console.log("Creating calendar event...");

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Calendar API error:", errorData);
      throw new Error(
        errorData.error?.message || "Failed to create calendar event",
      );
    }

    const result = await response.json();
    // console.log("Calendar event created successfully:", result.id);

    return {
      success: true,
      eventId: result.id,
      meetLink: result.hangoutLink,
      htmlLink: result.htmlLink,
    };
  } catch (error: any) {
    console.error("Error creating calendar event:", error);
    throw error;
  }
};

// Delete calendar event
export const deleteCalendarEvent = async (eventId: string) => {
  try {
    if (!accessToken) {
      throw new Error("Not authenticated. Please sign in first.");
    }

    // console.log("Deleting calendar event:", eventId);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Calendar API error:", errorData);
      throw new Error(
        errorData.error?.message || "Failed to delete calendar event",
      );
    }

    // console.log("Calendar event deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    throw error;
  }
};

// Format date and time for calendar
export const formatDateTimeForCalendar = (
  date: string,
  time: string,
): string => {
  return `${date}T${time}:00+05:30`;
};

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  Video,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTests } from "../../utils/TestContext";
import { useStudent } from "../../utils/StudentContext";
import {
  initClient,
  signIn,
  isSignedIn,
  createCalendarEvent,
  deleteCalendarEvent,
  formatDateTimeForCalendar,
} from "../../utils/googleCalendar";
import { 
  getSlotByDate, 
  scheduleInterview,
  updateScheduledInterview,
  getCompleteStudentData
} from "@/utils/api";

// ================== Types ==================
interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  interviewer_id: number;
  interviewer_email: string;
  interviewer_name?: string;
  is_booked: boolean;
  status: string;
}

interface SlotData {
  id: number | null;
  from: string;
  to: string;
  is_cancelled: boolean;
  on_date?: string;
  start_time?: string;
  end_time_expected?: string;
  student_name?: string;
  topic_name?: string;
  calendar_event_id?: string;
  meet_link?: string;
  interviewer_email?: string;
  interviewer_name?: string;
  scheduled_interview_id?: number; // ID of the scheduled interview record
  slot_type?: "LR" | "CFR"; // Learning Round or Culture Fit Round
}

// ================== Component ==================
const SlotBooking: React.FC = () => {
  // ---------- Context ----------
  const { student } = useStudent();
  const { tests, updateSlot } = useTests();
  const { id: testIdParam } = useParams<{ id: string }>();
  const testId = Number(testIdParam);
  const location = useLocation();

  // Get slot_type from navigation state
  const slotType = location.state?.slot_type as "LR" | "CFR" | undefined;

  // Get student ID from localStorage (only ID needed for API calls)
  const studentIdStr = localStorage.getItem("studentId");
  const studentId = studentIdStr ? parseInt(studentIdStr) : null;

  const test = tests.find((t) => t.id === testId);

  // ---------- State ----------
  const [loading, setLoading] = useState(true);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [slot, setSlot] = useState<SlotData>({
    from: "",
    to: "",
    id: null,
    is_cancelled: true,
  });
  const [newSlot, setNewSlot] = useState<SlotData>({
    from: "",
    to: "",
    id: null,
    is_cancelled: true,
  });
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default to tomorrow
    return d;
  });
  const [timings, setTimings] = useState<TimeSlot[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<
    "success" | "error" | "info"
  >("success");
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [isBookingInProgress, setIsBookingInProgress] = useState(false);
  const [showSignInHelper, setShowSignInHelper] = useState(false);

  const navigate = useNavigate();

  // ---------- Utilities ----------
  const formatDate = (date: Date): string => date.toISOString().split("T")[0];

  const formatTime = (timeString: string): string => {
    const [hour, minute] = timeString.split(":");
    const time = new Date();
    time.setHours(parseInt(hour), parseInt(minute));
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDisplayDate = (date: Date): string =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const showNotificationMessage = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  // ✅ Load timings from API for the selected date
  const fetchTimings = async (dateObj: Date) => {
    try {
      const dateStr = formatDate(dateObj);
      
      const response: any = await getSlotByDate(dateStr, slotType || "LR");
      console.log("Fetched timings response:", response);
      
      // Handle different response formats
      const items = Array.isArray(response) 
        ? response 
        : (response as any)?.data || [];

      // Filter only available (not booked) slots
      const availableSlots: TimeSlot[] = items
        .filter((s: any) => !s.is_booked && s.status?.toLowerCase() === 'available')
        .map((s: any) => ({
          id: s.id,
          start_time: s.start_time,
          end_time: s.end_time,
          interviewer_id: s.created_by || s.interviewer_id,
          interviewer_email: s.user_email,
          interviewer_name: s.user_name,
          is_booked: s.is_booked || false,
          status: s.status || 'available',
        }));

      setTimings(availableSlots);
      console.log("Available slots for", dateStr, ":", availableSlots);
    } catch (err: any) {
      console.error("Failed to load timings:", err);
      showNotificationMessage(
        err.message || "Failed to load available slots", 
        "error"
      );
      setTimings([]);
    }
  };

  // Refetch timings and clear selected slot when date changes
  useEffect(() => {
    fetchTimings(selectedDate);
    // Only clear slot selection if not in rescheduling mode
    if (!isRescheduling) {
      setSlot({ from: "", to: "", id: null, is_cancelled: true });
    } else {
      // Clear new slot selection when date changes during reschedule
      setNewSlot({ from: "", to: "", id: null, is_cancelled: true });
    }
    // eslint-disable-next-line
  }, [selectedDate]);

  // ---------- Google Calendar Integration ----------
  const handleGoogleSignIn = async () => {
    try {
      setIsBookingInProgress(true);
      setShowSignInHelper(true);

      if (!isSignedIn()) {
        showNotificationMessage(
          "Opening Google Sign-in popup... Please allow popups if blocked.",
          "info"
        );
        await signIn();
        setIsGoogleSignedIn(true);
        setShowSignInHelper(false);
        showNotificationMessage("Google Sign-in successful!", "success");
      }
      return true;
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      setShowSignInHelper(false);

      // Better error messages
      let errorMessage = "Failed to sign in with Google. Please try again.";

      if (error.message && error.message.includes("popup")) {
        errorMessage =
          "Sign-in popup was closed. Please click the button again and complete the sign-in.";
      } else if (error.message && error.message.includes("access_denied")) {
        errorMessage =
          "Access denied. Please grant calendar permissions to continue.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      showNotificationMessage(errorMessage, "error");
      return false;
    } finally {
      setIsBookingInProgress(false);
    }
  };

  const scheduleGoogleMeet = async (bookedSlotData: SlotData) => {
    try {
      const startDateTime = formatDateTimeForCalendar(
        bookedSlotData.on_date!,
        bookedSlotData.start_time!
      );
      const endDateTime = formatDateTimeForCalendar(
        bookedSlotData.on_date!,
        bookedSlotData.end_time_expected!
      );

      // Use both student and interviewer emails
      const attendees = [
        bookedSlotData.interviewer_email || "",
        currentStudent?.email || ""
      ].filter(Boolean);

      const eventDetails = {
        summary: `${bookedSlotData.topic_name} - Interview`,
        description: `Interview scheduled for ${bookedSlotData.student_name}\nTopic: ${bookedSlotData.topic_name}\nInterviewer: ${bookedSlotData.interviewer_name || bookedSlotData.interviewer_email}\nStudent Email: ${currentStudent?.email || ""}`,
        startDateTime,
        endDateTime,
        attendeeEmail: bookedSlotData.interviewer_email || "", // Primary attendee
        studentName: bookedSlotData.student_name!,
        attendees: attendees, //  Add all attendees
      };

      const result = await createCalendarEvent(eventDetails);
      console.log("Calendar event created:", result);
      return result;
    } catch (error) {
      console.error("Error creating calendar event:", error);
      throw error;
    }
  };

  //  Slot Actions - Complete API Integration
  const handleSlotBooking = async () => {
    console.log("Booking attempt - slot:", slot, "currentStudent:", currentStudent, "test:", test);
    console.log("Available timings:", timings);
    console.log("studentId:", studentId);
    
    if (!slot.id) {
      showNotificationMessage("Please select a slot to book", "error");
      return;
    }

    if (!currentStudent || !currentStudent.email) {
      showNotificationMessage(
        "Student information not found. Please login again.", 
        "error"
      );
      return;
    }

    if (!test) {
      showNotificationMessage(
        "Test information not found. Please refresh the page.", 
        "error"
      );
      return;
    }

    if (!studentId || isNaN(studentId)) {
      showNotificationMessage(
        "Student ID not found. Please login again.", 
        "error"
      );
      return;
    }

    try {
      setIsBookingInProgress(true);

      // Check Google sign-in
      if (!isSignedIn()) {
        const signInSuccess = await handleGoogleSignIn();
        console.log("Google sign-in success:", signInSuccess);
        if (!signInSuccess) {
          return;
        }
        // Update the signed-in state
        setIsGoogleSignedIn(true);
      }

      // Find selected slot details
      const selectedSlotDetails = timings.find(t => t.id === slot.id);
      console.log("Selected slot details:", selectedSlotDetails);
      
      if (!selectedSlotDetails) {
        showNotificationMessage("Selected slot not found", "error");
        return;
      }

      //  Validate emails
      if (!selectedSlotDetails.interviewer_email) {
        console.error("Interviewer email missing for slot:", selectedSlotDetails);
        showNotificationMessage("Interviewer email not found", "error");
        return;
      }

      if (!currentStudent || !currentStudent.email) {
        showNotificationMessage("Student email not found. Please login again.", "error");
        return;
      }

      const bookedSlot: SlotData = {
        ...slot,
        is_cancelled: false,
        on_date: formatDate(selectedDate),
        start_time: selectedSlotDetails.start_time,
        end_time_expected: selectedSlotDetails.end_time,
        student_name: `${currentStudent.firstName} ${currentStudent.lastName}`,
        topic_name: test.name,
        interviewer_email: selectedSlotDetails.interviewer_email,
        interviewer_name: selectedSlotDetails.interviewer_name,
        // slot_type: slotType, // Add slot type from navigation
      };

      // Create Google Calendar event
      showNotificationMessage("Creating Google Meet...", "info");
      const calendarResult = await scheduleGoogleMeet(bookedSlot);
      console.log("Google Calendar result:", calendarResult);

      if (!calendarResult.meetLink) {
        showNotificationMessage("Failed to create Google Meet link", "error");
        return;
      }

      // Add calendar event details
      bookedSlot.calendar_event_id = calendarResult.eventId;
      bookedSlot.meet_link = calendarResult.meetLink;

      //  Build backend payload with validated data
      const backendPayload = {
        student_id: studentId,
        slot_id: slot.id,
        title: `${bookedSlot.topic_name} - Interview`,
        description: `Interview for ${bookedSlot.student_name}. Topic: ${bookedSlot.topic_name}. Interviewer: ${bookedSlot.interviewer_name || bookedSlot.interviewer_email}. Student: ${currentStudent.email}`,
        meeting_link: bookedSlot.meet_link,
        google_event_id: bookedSlot.calendar_event_id,
        created_by: "Student" as const,
        slot_type: slotType || "LR", // Add slot_type to backend payload
      };

      console.log("Backend payload for scheduling interview:", backendPayload);

      //  Save to backend
      showNotificationMessage("Saving slot to server...", "info");
      const scheduleResponse = await scheduleInterview(backendPayload);
      console.log("Slot booked successfully:", scheduleResponse);

      // Store the scheduled interview ID from response
      if (scheduleResponse?.data?.id) {
        bookedSlot.scheduled_interview_id = scheduleResponse.data.id;
      } else if (scheduleResponse?.id) {
        bookedSlot.scheduled_interview_id = scheduleResponse.id;
      }

      // Update local state
      setSlot(bookedSlot);
      localStorage.setItem(`bookedSlot_${testId}`, JSON.stringify(bookedSlot));
      
      updateSlot(testId, {
        status: "Booked",
        scheduledTime: `${bookedSlot.on_date} ${bookedSlot.start_time}`,
      });

      showNotificationMessage(
        "✅ Slot Booked! Google Meet link sent to your email.", 
        "success"
      );

      fetchTimings(selectedDate);

    } catch (error: any) {
      console.error("Booking error:", error);
      
      let errorMessage = "Failed to book slot. Please try again.";
      
      if (error.message?.includes("calendar")) {
        errorMessage = "Failed to create Google Meet. Check calendar permissions.";
      } else if (error.message?.includes("API")) {
        errorMessage = "Failed to save booking. Please contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotificationMessage(errorMessage, "error");
    } finally {
      setIsBookingInProgress(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!test) return;
    
    if (!slot.scheduled_interview_id) {
      showNotificationMessage(
        "Cannot cancel: Interview ID not found. Please contact support.", 
        "error"
      );
      return;
    }

    // Enter rescheduling mode
    setIsRescheduling(true);
    showNotificationMessage(
      "Select a new time slot to reschedule your interview", 
      "info"
    );
  };

  const handleRescheduleConfirm = async () => {
    if (!newSlot.id || !slot.scheduled_interview_id || !currentStudent || !test) {
      if (!newSlot.id) {
        showNotificationMessage("Please select a new time slot", "error");
      } else if (!slot.scheduled_interview_id) {
        showNotificationMessage("Interview ID not found. Please contact support.", "error");
      } else {
        showNotificationMessage("Missing required information", "error");
      }
      return;
    }

    try {
      setIsBookingInProgress(true);

      // Check Google sign-in - only sign in if not already signed in
      if (!isSignedIn()) {
        const signInSuccess = await handleGoogleSignIn();
        console.log("Google sign-in success:", signInSuccess);
        if (!signInSuccess) {
          return;
        }
        // Update the signed-in state
        setIsGoogleSignedIn(true);
      }

      // Find new slot details
      const newSlotDetails = timings.find(t => t.id === newSlot.id);
      if (!newSlotDetails) {
        showNotificationMessage("New slot not found", "error");
        return;
      }

      // Validate emails
      if (!newSlotDetails.interviewer_email) {
        showNotificationMessage("Interviewer email not found", "error");
        return;
      }

      if (!currentStudent || !currentStudent.email) {
        showNotificationMessage("Student email not found. Please login again.", "error");
        return;
      }

      // Delete old calendar event
      if (slot.calendar_event_id) {
        try {
          await deleteCalendarEvent(slot.calendar_event_id);
          showNotificationMessage("Old Google Meet deleted", "info");
        } catch (error) {
          console.error("Error deleting old calendar event:", error);
          // Continue even if deletion fails
        }
      }

      // Create new Google Calendar event
      showNotificationMessage("Creating new Google Meet...", "info");
      const newBookedSlot: SlotData = {
        ...newSlot,
        is_cancelled: false,
        on_date: formatDate(selectedDate),
        start_time: newSlotDetails.start_time,
        end_time_expected: newSlotDetails.end_time,
        student_name: `${currentStudent.firstName} ${currentStudent.lastName}`,
        topic_name: test.name,
        interviewer_email: newSlotDetails.interviewer_email,
        interviewer_name: newSlotDetails.interviewer_name,
      };

      const calendarResult = await scheduleGoogleMeet(newBookedSlot);
      console.log("New Google Calendar result:", calendarResult);

      if (!calendarResult.meetLink) {
        throw new Error("Failed to create Google Meet link");
      }

      newBookedSlot.calendar_event_id = calendarResult.eventId;
      newBookedSlot.meet_link = calendarResult.meetLink;

      // Call reschedule API with old scheduled_interview_id and new slot_id
      const reschedulePayload = {
        slot_id: newSlot.id, // New slot ID
        title: `${newBookedSlot.topic_name} - Interview (Rescheduled)`,
        description: `Rescheduled interview for ${newBookedSlot.student_name}. Topic: ${newBookedSlot.topic_name}. Interviewer: ${newBookedSlot.interviewer_name || newBookedSlot.interviewer_email}. Student: ${currentStudent.email}`,
        meeting_link: newBookedSlot.meet_link,
        google_event_id: newBookedSlot.calendar_event_id,
      };

      console.log("Rescheduling with:", {
        scheduledInterviewId: slot.scheduled_interview_id,
        payload: reschedulePayload
      });

      const rescheduleResponse = await updateScheduledInterview(
        slot.scheduled_interview_id, // Old scheduled interview ID
        reschedulePayload
      );

      console.log("Reschedule response:", rescheduleResponse);

      // Store new scheduled interview ID if returned
      if (rescheduleResponse?.data?.id) {
        newBookedSlot.scheduled_interview_id = rescheduleResponse.data.id;
      } else if (rescheduleResponse?.id) {
        newBookedSlot.scheduled_interview_id = rescheduleResponse.id;
      } else {
        // Keep the old ID if no new one returned
        newBookedSlot.scheduled_interview_id = slot.scheduled_interview_id;
      }

      // Update local state
      setSlot(newBookedSlot);
      setNewSlot({ from: "", to: "", id: null, is_cancelled: true });
      setIsRescheduling(false);
      localStorage.setItem(`bookedSlot_${testId}`, JSON.stringify(newBookedSlot));
      
      updateSlot(testId, {
        status: "Booked",
        scheduledTime: `${newBookedSlot.on_date} ${newBookedSlot.start_time}`,
      });

      showNotificationMessage(
        "✅ Interview Rescheduled Successfully! New Google Meet link sent.", 
        "success"
      );

      fetchTimings(selectedDate);

    } catch (error: any) {
      console.error("Rescheduling error:", error);
      showNotificationMessage(
        error.message || "Error rescheduling slot. Please try again.",
        "error"
      );
    } finally {
      setIsBookingInProgress(false);
    }
  };

  const handleCancelReschedule = () => {
    setIsRescheduling(false);
    setNewSlot({ from: "", to: "", id: null, is_cancelled: true });
    showNotificationMessage("Rescheduling cancelled", "info");
  };

  const handleNavigationOnStudentPage = () => navigate("/students/final-result");

  const loadSlotFromLocalStorage = () => {
    const storedSlot = localStorage.getItem(`bookedSlot_${testId}`);
    if (storedSlot) {
      try {
        setSlot(JSON.parse(storedSlot));
      } catch {
        setSlot({ from: "", to: "", id: null, is_cancelled: true });
      }
    } else {
      setSlot({ from: "", to: "", id: null, is_cancelled: true });
    }
  };

  // ---------- Effects ----------
  // Fetch student data from API
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setStudentLoading(true);
        
        // Try to get email from localStorage user object
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const email = user.email;
          
          if (email) {
            console.log("Fetching student data for email:", email);
            const response = await getCompleteStudentData(email);
            
            if (response.success && response.data.student) {
              const studentData = response.data.student;
              console.log("Student data fetched from API:", studentData);
              
              setCurrentStudent({
                firstName: studentData.first_name || studentData.firstName || '',
                lastName: studentData.last_name || studentData.lastName || '',
                email: studentData.email || '',
                ...studentData
              });
            }
          } else {
            console.error("No email found in user data");
          }
        } else {
          console.error("No user data in localStorage");
        }
      } catch (error) {
        console.error("Failed to fetch student data:", error);
      } finally {
        setStudentLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize Google API Client
        await initClient();

        // Check if user is already signed in
        if (isSignedIn()) {
          setIsGoogleSignedIn(true);
        }

        loadSlotFromLocalStorage();
      } catch (error: any) {
        console.error("Initialization error:", error);
        const errorMessage =
          error.message ||
          "Failed to initialize Google Calendar. Please check console for details.";
        showNotificationMessage(errorMessage, "error");
      } finally {
        setLoading(false);
      }
    };

    initialize();
    window.addEventListener("storage", loadSlotFromLocalStorage);
    return () =>
      window.removeEventListener("storage", loadSlotFromLocalStorage);
    // eslint-disable-next-line
  }, [testId]);

  // ---------- Conditions ----------
  if (loading || studentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-500 to-red-500 py-8 px-4">
      {/* Notification */}
      {showNotification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            notificationType === "success"
              ? "bg-green-500"
              : notificationType === "error"
              ? "bg-red-500"
              : "bg-blue-500"
          } text-white max-w-md`}
        >
          <div className="flex items-center space-x-2">
            {notificationType === "success" && (
              <CheckCircle className="w-5 h-5" />
            )}
            {notificationType === "error" && <XCircle className="w-5 h-5" />}
            {notificationType === "info" && <Calendar className="w-5 h-5" />}
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}

      {/* Sign-in Helper Modal */}
      {showSignInHelper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 animate-fade-in">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="w-16 h-16 text-orange-600 animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Sign in with Google
              </h3>
              <p className="text-gray-600 mb-4">
                A popup window should have opened for Google sign-in.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Popup blocked?</strong>
                  <br />
                  Please allow popups for this site and try again.
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Grant calendar permissions to schedule your interview.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {slot.is_cancelled || isRescheduling ? (
          // ---------- Booking Section ----------
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-orange-400 px-8 py-6 text-white">
              <h1 className="text-3xl font-bold mb-2">
                {isRescheduling ? "Reschedule Interview Slot" : "Book Interview Slot"}
                {slotType && (
                  <span className="ml-3 text-2xl">
                    ({slotType === "LR" ? "Learning Round" : "Culture Fit Round"})
                  </span>
                )}
              </h1>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span className="text-lg">
                  {currentStudent?.firstName || ''} {currentStudent?.lastName || ''}
                </span>
              </div>
              <p className="text-sm mt-1 opacity-90">{currentStudent?.email || ''}</p>
              {isRescheduling && (
                <div className="mt-3 bg-orange-500 bg-opacity-50 rounded-lg p-3">
                  <p className="text-sm font-semibold">
                    📅 Current Slot: {slot.on_date && formatDisplayDate(new Date(slot.on_date))} at {slot.start_time && formatTime(slot.start_time)}
                  </p>
                  <p className="text-xs mt-1">Select a new time slot below to reschedule</p>
                </div>
              )}
            </div>

            <div className="p-8">
              {/* Date Picker */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-orange-600" />
                  Select Date
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={formatDate(selectedDate)}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    min={formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000))}
                    max={formatDate(
                      new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
                    )}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Selected Date:</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {formatDisplayDate(selectedDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-6 h-6 mr-2 text-orange-600" />
                  Available Time Slots
                </h3>
                {timings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {timings.map((timing) => (
                      <button
                        key={timing.id}
                        onClick={() => {
                          if (isRescheduling) {
                            setNewSlot({ 
                              id: timing.id, 
                              from: timing.start_time, 
                              to: timing.end_time, 
                              is_cancelled: true,
                              interviewer_email: timing.interviewer_email,
                              interviewer_name: timing.interviewer_name,
                            });
                          } else {
                            setSlot({ 
                              id: timing.id, 
                              from: timing.start_time, 
                              to: timing.end_time, 
                              is_cancelled: true,
                              interviewer_email: timing.interviewer_email,
                              interviewer_name: timing.interviewer_name,
                            });
                          }
                        }}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          (isRescheduling ? newSlot.id : slot.id) === timing.id
                            ? "border-orange-500 bg-orange-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="text-center">
                          <p className="font-semibold text-gray-800">
                            {formatTime(timing.start_time)} - {formatTime(timing.end_time)}
                          </p>
                          {/* <p className="text-xs text-gray-500 mt-2">
                            {timing.interviewer_name || timing.interviewer_email}
                          </p> */}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-base">
                      No slots available for this date.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Please select another date.
                    </p>
                  </div>
                )}
              </div>

              {/* Selected Slot Info */}
              {(slot.id || newSlot.id) && (
                <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    {isRescheduling ? "New Slot Selected:" : "Selected Slot:"}
                  </h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>📅 Date: {formatDisplayDate(selectedDate)}</p>
                    <p>🕐 Time: {formatTime(isRescheduling ? newSlot.from : slot.from)} - {formatTime(isRescheduling ? newSlot.to : slot.to)}</p>
                  </div>
                </div>
              )}

              {/* Google Sign-in Status */}
              {!isGoogleSignedIn && (slot.id || newSlot.id) && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Video className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 mb-1">
                        Google Meet Setup Required
                      </h4>
                      <p className="text-sm text-yellow-700 mb-2">
                        You'll need to sign in with Google to automatically
                        create a Meet link for your interview.
                      </p>
                      <p className="text-xs text-yellow-600">
                        ℹ️ A popup will open for sign-in when you click "Book Slot"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isGoogleSignedIn && (slot.id || newSlot.id) && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-700">
                      ✓ Google account connected. Meet link will be created automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* Booking/Rescheduling Buttons */}
              {isRescheduling ? (
                <div className="flex gap-4">
                  <button
                    onClick={handleCancelReschedule}
                    disabled={isBookingInProgress}
                    className="flex-1 py-4 px-6 rounded-lg font-semibold text-lg transition-all bg-gray-300 text-gray-700 hover:bg-gray-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRescheduleConfirm}
                    disabled={!newSlot.id || isBookingInProgress}
                    className={`flex-1 py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                      !newSlot.id || isBookingInProgress
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600 to-green-400 text-white hover:from-green-700 hover:to-green-500 shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {isBookingInProgress ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Rescheduling...
                      </span>
                    ) : newSlot.id ? (
                      "Confirm Reschedule"
                    ) : (
                      "Select New Time Slot"
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSlotBooking}
                  disabled={!slot.id || isBookingInProgress}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                    !slot.id || isBookingInProgress
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-600 to-orange-400 text-white hover:from-orange-700 hover:to-orange-500 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {isBookingInProgress ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Booking...
                    </span>
                  ) : slot.id ? (
                    "Book Selected Slot & Schedule Meet"
                  ) : (
                    "Select a Time Slot"
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          // ---------- Booked Details Section ----------
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-green-500 px-8 py-6 text-white">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <CheckCircle className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Interview Slot Booked</h1>
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Slot Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Student Name</p>
                    <p className="text-lg font-semibold">{slot.student_name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Topic</p>
                    <p className="text-lg font-semibold">{slot.topic_name}</p>
                  </div>

                  {slot.interviewer_name && (
                    <div>
                      <p className="text-sm text-gray-500">Interviewer</p>
                      <p className="text-lg font-semibold">{slot.interviewer_name}</p>
                      <p className="text-sm text-gray-500">{slot.interviewer_email}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="text-lg font-semibold">
                      {slot.on_date && formatDisplayDate(new Date(slot.on_date))}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="text-lg font-semibold">
                      {slot.start_time &&
                        slot.end_time_expected &&
                        `${formatTime(slot.start_time)} - ${formatTime(
                          slot.end_time_expected
                        )}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Google Meet Link */}
              {slot.meet_link && (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-6">
                  <div className="flex items-center mb-3">
                    <Video className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="text-xl font-semibold text-gray-800">
                      Google Meet Link
                    </h3>
                  </div>
                  <a
                    href={slot.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    <Video className="w-5 h-5 mr-2" />
                    Join Google Meet
                  </a>
                  <p className="text-sm text-gray-600 mt-3">
                    📧 Meeting link has been sent to your email and the interviewer's email.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleDeleteSlot}
                  disabled={isBookingInProgress}
                  className="flex-1 py-3 px-8 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {isBookingInProgress ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cancelling...
                    </span>
                  ) : (
                    "Reschedule Slot"
                  )}
                </button>

                <button
                  onClick={handleNavigationOnStudentPage}
                  className="flex-1 py-3 px-8 bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold rounded-lg hover:from-green-500 hover:to-green-600 transition-all shadow-md hover:shadow-lg"
                >
                  View Results
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotBooking;

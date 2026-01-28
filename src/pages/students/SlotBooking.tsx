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
import { useLanguage } from "@/routes/LaunguageContext";
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
  cancelScheduledInterview,
  getCompleteStudentData,
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

// ================== Language Content ==================
const languageContent = {
  english: {
    bookingTitle: "Book Interview Slot",
    rescheduleTitle: "Reschedule Interview Slot",
    learningRound: "Learning Round",
    cultureFitRound: "Culture Fit Round",
    currentSlot: "Current Slot:",
    selectNewSlot: "Select a new time slot below to reschedule",
    selectDate: "Select Date",
    selectedDate: "Selected Date:",
    availableTimeSlots: "Available Time Slots",
    noSlotsAvailable: "No slots available for this date.",
    selectAnotherDate: "Please select another date.",
    newSlotSelected: "New Slot Selected:",
    selectedSlot: "Selected Slot:",
    date: "Date:",
    time: "Time:",
    googleMeetRequired: "Google Meet Setup Required",
    signInDescription: "You'll need to sign in with Google to automatically create a Meet link for your interview.",
    popupInfo: "A popup will open for sign-in when you click \"Book Slot\"",
    accountConnected: "Google account connected. Meet link will be created automatically.",
    cancel: "Cancel",
    confirmReschedule: "Confirm Reschedule",
    rescheduling: "Rescheduling...",
    selectNewTimeSlot: "Select New Time Slot",
    booking: "Booking...",
    bookSelectedSlot: "Book Selected Slot & Schedule Meet",
    selectTimeSlot: "Select a Time Slot",
    interviewSlotBooked: "Interview Slot Booked",
    slotDetails: "Slot Details",
    studentName: "Student Name",
    topic: "Topic",
    interviewer: "Interviewer",
    googleMeetLink: "Google Meet Link",
    joinGoogleMeet: "Join Google Meet",
    meetLinkSent: "Meeting link has been sent to your email and the interviewer's email.",
    rescheduleSlot: "Reschedule Slot",
    processing: "Processing...",
    cancelSlot: "Cancel Slot",
    viewResults: "View Results",
    cancelInterviewSlot: "Cancel Interview Slot",
    cancelConfirmation: "Are you sure you want to cancel your scheduled interview? This action cannot be undone.",
    reasonForCancellation: "Reason for Cancellation",
    reasonPlaceholder: "Please provide a reason for cancelling your interview...",
    goBack: "Go Back",
    confirmCancel: "Confirm Cancel",
    cancelling: "Cancelling...",
    loadingStudentData: "Loading student data...",
    signInWithGoogle: "Sign in with Google",
    popupOpening: "A popup window should have opened for Google sign-in.",
    popupBlocked: "Popup blocked?",
    allowPopups: "Please allow popups for this site and try again.",
    grantPermissions: "Grant calendar permissions to schedule your interview.",
  },
  hindi: {
    bookingTitle: "इंटरव्यू स्लॉट बुक करें",
    rescheduleTitle: "इंटरव्यू स्लॉट पुनर्निर्धारित करें",
    learningRound: "लर्निंग राउंड",
    cultureFitRound: "कल्चर फिट राउंड",
    currentSlot: "वर्तमान स्लॉट:",
    selectNewSlot: "पुनर्निर्धारित करने के लिए नीचे एक नया समय स्लॉट चुनें",
    selectDate: "तारीख चुनें",
    selectedDate: "चयनित तारीख:",
    availableTimeSlots: "उपलब्ध समय स्लॉट",
    noSlotsAvailable: "इस तारीख के लिए कोई स्लॉट उपलब्ध नहीं है।",
    selectAnotherDate: "कृपया दूसरी तारीख चुनें।",
    newSlotSelected: "नया स्लॉट चयनित:",
    selectedSlot: "चयनित स्लॉट:",
    date: "तारीख:",
    time: "समय:",
    googleMeetRequired: "Google Meet सेटअप आवश्यक",
    signInDescription: "आपके इंटरव्यू के लिए स्वचालित रूप से Meet लिंक बनाने के लिए आपको Google से साइन इन करना होगा।",
    popupInfo: "जब आप \"Book Slot\" पर क्लिक करेंगे तो साइन-इन के लिए एक पॉपअप खुलेगा",
    accountConnected: "Google खाता कनेक्ट हो गया है। Meet लिंक स्वचालित रूप से बनाया जाएगा।",
    cancel: "रद्द करें",
    confirmReschedule: "पुनर्निर्धारण की पुष्टि करें",
    rescheduling: "पुनर्निर्धारण हो रहा है...",
    selectNewTimeSlot: "नया समय स्लॉट चुनें",
    booking: "बुकिंग हो रही है...",
    bookSelectedSlot: "चयनित स्लॉट बुक करें और Meet शेड्यूल करें",
    selectTimeSlot: "समय स्लॉट चुनें",
    interviewSlotBooked: "इंटरव्यू स्लॉट बुक हो गया",
    slotDetails: "स्लॉट विवरण",
    studentName: "छात्र का नाम",
    topic: "विषय",
    interviewer: "साक्षात्कारकर्ता",
    googleMeetLink: "Google Meet लिंक",
    joinGoogleMeet: "Google Meet में शामिल हों",
    meetLinkSent: "मीटिंग लिंक आपके ईमेल और साक्षात्कारकर्ता के ईमेल पर भेज दिया गया है।",
    rescheduleSlot: "स्लॉट पुनर्निर्धारित करें",
    processing: "प्रोसेसिंग...",
    cancelSlot: "स्लॉट रद्द करें",
    viewResults: "परिणाम देखें",
    cancelInterviewSlot: "इंटरव्यू स्लॉट रद्द करें",
    cancelConfirmation: "क्या आप वाकई अपना निर्धारित इंटरव्यू रद्द करना चाहते हैं? इस कार्यवाही को पूर्ववत नहीं किया जा सकता।",
    reasonForCancellation: "रद्द करने का कारण",
    reasonPlaceholder: "कृपया अपना इंटरव्यू रद्द करने का कारण बताएं...",
    goBack: "वापस जाएं",
    confirmCancel: "रद्द करने की पुष्टि करें",
    cancelling: "रद्द हो रहा है...",
    loadingStudentData: "छात्र डेटा लोड हो रहा है...",
    signInWithGoogle: "Google से साइन इन करें",
    popupOpening: "Google साइन-इन के लिए एक पॉपअप विंडो खुलनी चाहिए थी।",
    popupBlocked: "पॉपअप ब्लॉक हो गया?",
    allowPopups: "कृपया इस साइट के लिए पॉपअप की अनुमति दें और पुनः प्रयास करें।",
    grantPermissions: "अपना इंटरव्यू शेड्यूल करने के लिए कैलेंडर अनुमतियाँ प्रदान करें।",
  },
  marathi: {
    bookingTitle: "मुलाखत स्लॉट बुक करा",
    rescheduleTitle: "मुलाखत स्लॉट पुनर्निर्धारित करा",
    learningRound: "लर्निंग राउंड",
    cultureFitRound: "कल्चर फिट राउंड",
    currentSlot: "सध्याचा स्लॉट:",
    selectNewSlot: "पुनर्निर्धारित करण्यासाठी खाली नवीन वेळ स्लॉट निवडा",
    selectDate: "तारीख निवडा",
    selectedDate: "निवडलेली तारीख:",
    availableTimeSlots: "उपलब्ध वेळ स्लॉट",
    noSlotsAvailable: "या तारखेसाठी कोणतेही स्लॉट उपलब्ध नाहीत.",
    selectAnotherDate: "कृपया दुसरी तारीख निवडा.",
    newSlotSelected: "नवीन स्लॉट निवडला:",
    selectedSlot: "निवडलेला स्लॉट:",
    date: "तारीख:",
    time: "वेळ:",
    googleMeetRequired: "Google Meet सेटअप आवश्यक",
    signInDescription: "तुमच्या मुलाखतीसाठी स्वयंचलितपणे Meet लिंक तयार करण्यासाठी तुम्हाला Google सह साइन इन करणे आवश्यक आहे.",
    popupInfo: "जेव्हा तुम्ही \"Book Slot\" वर क्लिक कराल तेव्हा साइन-इनसाठी पॉपअप उघडेल",
    accountConnected: "Google खाते कनेक्ट झाले आहे. Meet लिंक स्वयंचलितपणे तयार केली जाईल.",
    cancel: "रद्द करा",
    confirmReschedule: "पुनर्निर्धारणाची पुष्टी करा",
    rescheduling: "पुनर्निर्धारण होत आहे...",
    selectNewTimeSlot: "नवीन वेळ स्लॉट निवडा",
    booking: "बुकिंग होत आहे...",
    bookSelectedSlot: "निवडलेला स्लॉट बुक करा आणि Meet शेड्यूल करा",
    selectTimeSlot: "वेळ स्लॉट निवडा",
    interviewSlotBooked: "मुलाखत स्लॉट बुक झाला",
    slotDetails: "स्लॉट तपशील",
    studentName: "विद्यार्थ्याचे नाव",
    topic: "विषय",
    interviewer: "मुलाखतकार",
    googleMeetLink: "Google Meet लिंक",
    joinGoogleMeet: "Google Meet मध्ये सामील व्हा",
    meetLinkSent: "मीटिंग लिंक तुमच्या ईमेल आणि मुलाखतकाराच्या ईमेलवर पाठवली गेली आहे.",
    rescheduleSlot: "स्लॉट पुनर्निर्धारित करा",
    processing: "प्रक्रिया होत आहे...",
    cancelSlot: "स्लॉट रद्द करा",
    viewResults: "परिणाम पहा",
    cancelInterviewSlot: "मुलाखत स्लॉट रद्द करा",
    cancelConfirmation: "तुम्हाला खात्री आहे की तुम्ही तुमची निर्धारित मुलाखत रद्द करू इच्छिता? ही क्रिया पूर्ववत केली जाऊ शकत नाही.",
    reasonForCancellation: "रद्द करण्याचे कारण",
    reasonPlaceholder: "कृपया तुमची मुलाखत रद्द करण्याचे कारण द्या...",
    goBack: "परत जा",
    confirmCancel: "रद्द करण्याची पुष्टी करा",
    cancelling: "रद्द होत आहे...",
    loadingStudentData: "विद्यार्थी डेटा लोड होत आहे...",
    signInWithGoogle: "Google सह साइन इन करा",
    popupOpening: "Google साइन-इनसाठी पॉपअप विंडो उघडली गेली असावी.",
    popupBlocked: "पॉपअप ब्लॉक झाला?",
    allowPopups: "कृपया या साइटसाठी पॉपअप्सना परवानगी द्या आणि पुन्हा प्रयत्न करा.",
    grantPermissions: "तुमची मुलाखत शेड्यूल करण्यासाठी कॅलेंडर परवानग्या द्या.",
  },
};

// ================== Component ==================
const SlotBooking: React.FC = () => {
  // ---------- Context ----------
  const { student } = useStudent();
  const { tests, updateSlot } = useTests();
  const { selectedLanguage } = useLanguage();
  const { id: testIdParam } = useParams<{ id: string }>();
  const testId = Number(testIdParam);
  const location = useLocation();

  // Get language content
  const content = languageContent[selectedLanguage] || languageContent.english;

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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

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
    type: "success" | "error" | "info",
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
      // console.log("Fetched timings response:", response);

      // Handle different response formats
      const items = Array.isArray(response)
        ? response
        : (response as any)?.data || [];

      // Filter only available (not booked) slots
      const availableSlots: TimeSlot[] = items
        .filter(
          (s: any) => !s.is_booked && s.status?.toLowerCase() === "available",
        )
        .map((s: any) => ({
          id: s.id,
          start_time: s.start_time,
          end_time: s.end_time,
          interviewer_id: s.created_by || s.interviewer_id,
          interviewer_email: s.user_email,
          interviewer_name: s.user_name,
          is_booked: s.is_booked || false,
          status: s.status || "available",
        }));

      setTimings(availableSlots);
      // console.log("Available slots for", dateStr, ":", availableSlots);
    } catch (err: any) {
      console.error("Failed to load timings:", err);
      showNotificationMessage(
        err.message || "Failed to load available slots",
        "error",
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
     
  }, [selectedDate]);

  // ---------- Google Calendar Integration ----------
  const handleGoogleSignIn = async () => {
    try {
      setIsBookingInProgress(true);
      setShowSignInHelper(true);

      if (!isSignedIn()) {
        showNotificationMessage(
          "Opening Google Sign-in popup... Please allow popups if blocked.",
          "info",
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
        bookedSlotData.start_time!,
      );
      const endDateTime = formatDateTimeForCalendar(
        bookedSlotData.on_date!,
        bookedSlotData.end_time_expected!,
      );

      // Use both student and interviewer emails
      const attendees = [
        bookedSlotData.interviewer_email || "",
        currentStudent?.email || "",
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
      // console.log("Calendar event created:", result);
      return result;
    } catch (error) {
      console.error("Error creating calendar event:", error);
      throw error;
    }
  };

  //  Slot Actions - Complete API Integration
  const handleSlotBooking = async () => {
    // console.log(
    //   "Booking attempt - slot:",
    //   slot,
    //   "currentStudent:",
    //   currentStudent,
    //   "test:",
    //   test,
    // );
    // console.log("Available timings:", timings);
    // console.log("studentId:", studentId);

    if (!slot.id) {
      showNotificationMessage("Please select a slot to book", "error");
      return;
    }

    if (!currentStudent || !currentStudent.email) {
      showNotificationMessage(
        "Student information not found. Please login again.",
        "error",
      );
      return;
    }

    if (!test) {
      showNotificationMessage(
        "Test information not found. Please refresh the page.",
        "error",
      );
      return;
    }

    if (!studentId || isNaN(studentId)) {
      showNotificationMessage(
        "Student ID not found. Please login again.",
        "error",
      );
      return;
    }

    try {
      setIsBookingInProgress(true);

      // Check Google sign-in
      if (!isSignedIn()) {
        const signInSuccess = await handleGoogleSignIn();
        // console.log("Google sign-in success:", signInSuccess);
        if (!signInSuccess) {
          return;
        }
        // Update the signed-in state
        setIsGoogleSignedIn(true);
      }

      // Find selected slot details
      const selectedSlotDetails = timings.find((t) => t.id === slot.id);
      // console.log("Selected slot details:", selectedSlotDetails);

      if (!selectedSlotDetails) {
        showNotificationMessage("Selected slot not found", "error");
        return;
      }

      //  Validate emails
      if (!selectedSlotDetails.interviewer_email) {
        console.error(
          "Interviewer email missing for slot:",
          selectedSlotDetails,
        );
        showNotificationMessage("Interviewer email not found", "error");
        return;
      }

      if (!currentStudent || !currentStudent.email) {
        showNotificationMessage(
          "Student email not found. Please login again.",
          "error",
        );
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
      // console.log("Google Calendar result:", calendarResult);

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

      // console.log("Backend payload for scheduling interview:", backendPayload);

      //  Save to backend
      showNotificationMessage("Saving slot to server...", "info");
      const scheduleResponse = await scheduleInterview(backendPayload);
      // console.log("Slot booked successfully:", scheduleResponse);

      // Store the scheduled interview ID from response
      if (scheduleResponse?.data?.id) {
        bookedSlot.scheduled_interview_id = scheduleResponse.data.id;
      } else if (scheduleResponse?.id) {
        bookedSlot.scheduled_interview_id = scheduleResponse.id;
      }

      // Update local state (no localStorage dependency)
      setSlot(bookedSlot);

      updateSlot(testId, {
        status: "Booked",
        scheduledTime: `${bookedSlot.on_date} ${bookedSlot.start_time}`,
      });

      showNotificationMessage(
        "Slot Booked! Google Meet link sent to your email.",
        "success",
      );

      fetchTimings(selectedDate);
    } catch (error: any) {
      console.error("Booking error:", error);

      let errorMessage = "Failed to book slot. Please try again.";

      if (error.message?.includes("calendar")) {
        errorMessage =
          "Failed to create Google Meet. Check calendar permissions.";
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
        "error",
      );
      return;
    }

    // Enter rescheduling mode
    setIsRescheduling(true);
    showNotificationMessage(
      "Select a new time slot to reschedule your interview",
      "info",
    );
  };

  const handleCancelSlot = async () => {
    if (!slot.scheduled_interview_id) {
      showNotificationMessage(
        "Cannot cancel: Interview ID not found. Please contact support.",
        "error",
      );
      return;
    }

    if (!cancelReason.trim()) {
      showNotificationMessage("Please provide a reason for cancellation", "error");
      return;
    }

    try {
      setIsCancelling(true);

      // Delete Google Calendar event if exists
      if (slot.calendar_event_id) {
        try {
          // Ensure user is signed in to Google before deleting calendar event
          if (!isSignedIn()) {
            showNotificationMessage("Signing in to Google to delete calendar event...", "info");
            const signInSuccess = await handleGoogleSignIn();
            if (!signInSuccess) {
              showNotificationMessage("Could not sign in to Google. Calendar event may not be deleted.", "error");
            }
          }
          
          if (isSignedIn()) {
            // console.log("Deleting calendar event ID:", slot.calendar_event_id);
            showNotificationMessage("Removing event from Google Calendar...", "info");
            await deleteCalendarEvent(slot.calendar_event_id);
            // console.log("Google Calendar event deleted successfully");
          }
        } catch (error) {
          console.error("Error deleting calendar event:", error);
          showNotificationMessage("Warning: Could not remove event from calendar. Proceeding with cancellation...", "info");
          // Continue even if deletion fails
        }
      }

      // Call cancel API with reason
      await cancelScheduledInterview(slot.scheduled_interview_id, cancelReason.trim());

      // Clear local state (no localStorage dependency)
      setSlot({ from: "", to: "", id: null, is_cancelled: true });

      updateSlot(testId, {
        status: "Cancelled",
        scheduledTime: undefined,
      });

      setShowCancelModal(false);
      setCancelReason("");
      showNotificationMessage("Interview slot cancelled and removed from calendar!", "success");

      // Navigate back to results page
      setTimeout(() => {
        navigate("/students/final-result");
      }, 2000);
    } catch (error: any) {
      console.error("Cancel error:", error);
      showNotificationMessage(
        error.message || "Failed to cancel slot. Please try again.",
        "error",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRescheduleConfirm = async () => {
    if (
      !newSlot.id ||
      !slot.scheduled_interview_id ||
      !currentStudent ||
      !test
    ) {
      if (!newSlot.id) {
        showNotificationMessage("Please select a new time slot", "error");
      } else if (!slot.scheduled_interview_id) {
        showNotificationMessage(
          "Interview ID not found. Please contact support.",
          "error",
        );
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
        // console.log("Google sign-in success:", signInSuccess);
        if (!signInSuccess) {
          return;
        }
        // Update the signed-in state
        setIsGoogleSignedIn(true);
      }

      // Find new slot details
      const newSlotDetails = timings.find((t) => t.id === newSlot.id);
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
        showNotificationMessage(
          "Student email not found. Please login again.",
          "error",
        );
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
      // console.log("New Google Calendar result:", calendarResult);

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

      // console.log("Rescheduling with:", {
      //   scheduledInterviewId: slot.scheduled_interview_id,
      //   payload: reschedulePayload,
      // });

      const rescheduleResponse = await updateScheduledInterview(
        slot.scheduled_interview_id, // Old scheduled interview ID
        reschedulePayload,
      );

      // console.log("Reschedule response:", rescheduleResponse);

      // Store new scheduled interview ID if returned
      if (rescheduleResponse?.data?.id) {
        newBookedSlot.scheduled_interview_id = rescheduleResponse.data.id;
      } else if (rescheduleResponse?.id) {
        newBookedSlot.scheduled_interview_id = rescheduleResponse.id;
      } else {
        // Keep the old ID if no new one returned
        newBookedSlot.scheduled_interview_id = slot.scheduled_interview_id;
      }

      // Update local state (no localStorage dependency)
      setSlot(newBookedSlot);
      setNewSlot({ from: "", to: "", id: null, is_cancelled: true });
      setIsRescheduling(false);

      updateSlot(testId, {
        status: "Booked",
        scheduledTime: `${newBookedSlot.on_date} ${newBookedSlot.start_time}`,
      });

      showNotificationMessage(
        "Interview Rescheduled Successfully! New Google Meet link sent.",
        "success",
      );

      fetchTimings(selectedDate);
    } catch (error: any) {
      console.error("Rescheduling error:", error);
      showNotificationMessage(
        error.message || "Error rescheduling slot. Please try again.",
        "error",
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

  const handleNavigationOnStudentPage = () =>
    navigate("/students/final-result");

  // ---------- Effects ----------
  // Fetch student data and existing booking from API
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setStudentLoading(true);

        // Try to get email from localStorage user object
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          const email = user.email;

          if (email) {
            // console.log("Fetching student data for email:", email);
            const response = await getCompleteStudentData(email);

            if (response.success && response.data.student) {
              const studentData = response.data.student;
              // console.log("Student data fetched from API:", studentData);

              setCurrentStudent({
                firstName:
                  studentData.first_name || studentData.firstName || "",
                lastName: studentData.last_name || studentData.lastName || "",
                email: studentData.email || "",
                ...studentData,
              });

              // Check for existing booked slots from API based on slotType
              const schedules = slotType === "CFR" 
                ? response.data.interview_schedules_cfr || []
                : response.data.interview_schedules_lr || [];

              // Calculate attempt number from testId
              // LR: testId = 200 + index, so attempt = testId - 200 + 1 (or 200 for first placeholder)
              // CFR: testId = 300 + index, so attempt = testId - 300 + 1 (or 300 for first placeholder)
              let attemptNumber = 1;
              if (slotType === "LR") {
                // testId 2 is the first placeholder, 200+ are from interview_learner_round
                attemptNumber = testId === 2 ? 1 : testId - 200 + 1;
              } else if (slotType === "CFR") {
                // testId 3 is the first placeholder, 300+ are from interview_cultural_fit_round
                attemptNumber = testId === 3 ? 1 : testId - 300 + 1;
              }

              // console.log("Looking for schedule matching attempt:", attemptNumber, "testId:", testId);

              // Find schedule matching this specific attempt number by title
              const roundName = slotType === "CFR" ? "Cultural Fit Round" : "Learning Round";
              
              const matchingSchedule = schedules
                .filter((s: any) => {
                  const title = s.title || "";
                  const status = String(s.status || "").toLowerCase();
                  
                  // Skip cancelled schedules
                  if (status === "cancelled") return false;
                  
                  if (attemptNumber === 1) {
                    // For attempt 1, match titles without "(Attempt X)" or with "(Attempt 1)"
                    const hasAttemptNumber = /\(Attempt \d+\)/i.test(title);
                    if (!hasAttemptNumber && title.includes(roundName)) return true;
                    if (/\(Attempt 1\)/i.test(title)) return true;
                    return false;
                  } else {
                    // For attempt N, match titles with "(Attempt N)"
                    const attemptPattern = new RegExp(`\\(Attempt ${attemptNumber}\\)`, "i");
                    return attemptPattern.test(title);
                  }
                })
                // Take the last (most recent) matching schedule
                .slice(-1)[0];

              // console.log("Matching schedule found:", matchingSchedule);

              if (matchingSchedule) {
                const scheduleStatus = String(matchingSchedule.status || "").toLowerCase();

                // If status is "booked" or similar (not cancelled), show booked view
                if (scheduleStatus !== "cancelled" && scheduleStatus !== "expired") {
                  setSlot({
                    id: matchingSchedule.slot_id,
                    from: matchingSchedule.start_time,
                    to: matchingSchedule.end_time,
                    is_cancelled: false,
                    on_date: matchingSchedule.date,
                    start_time: matchingSchedule.start_time,
                    end_time_expected: matchingSchedule.end_time,
                    student_name: `${studentData.first_name || ""} ${studentData.last_name || ""}`,
                    topic_name: slotType === "CFR" ? "Cultural Fit Round" : "Learning Round",
                    calendar_event_id: matchingSchedule.google_event_id,
                    meet_link: matchingSchedule.meeting_link,
                    interviewer_email: matchingSchedule.slot_details?.user_email || "",
                    interviewer_name: matchingSchedule.slot_details?.user_name || "",
                    scheduled_interview_id: matchingSchedule.schedule_id,
                    slot_type: slotType,
                  });
                  // console.log("Slot set from API - showing booked view for attempt:", attemptNumber);
                } else {
                  // Cancelled or expired - show booking view
                  setSlot({ from: "", to: "", id: null, is_cancelled: true });
                  // console.log("Slot is cancelled/expired - showing booking view");
                }
              } else {
                // No existing schedules - show booking view
                setSlot({ from: "", to: "", id: null, is_cancelled: true });
                // console.log("No existing schedules - showing booking view");
              }
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
  }, [slotType]);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize Google API Client
        await initClient();

        // Check if user is already signed in
        if (isSignedIn()) {
          setIsGoogleSignedIn(true);
        }
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
  }, [testId]);

  // ---------- Conditions ----------
  if (loading || studentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{content.loadingStudentData}</p>
        </div>
      </div>
    );
  }

  // ---------- UI ----------
  return (
    <div className="min-h-screen student-bg-gradient py-8 px-4">
      {/* Notification */}
      {showNotification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg z-50 transition-all duration-300 ${
            notificationType === "success"
              ? "bg-[hsl(var(--status-active))] border-[hsl(var(--status-active))] shadow-lg"
              : notificationType === "error"
                ? "bg-destructive border-destructive shadow-lg"
                : "bg-primary border-primary shadow-lg"
          } text-primary-foreground max-w-md border-2`}
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
          <div className="bg-card rounded-xl shadow-2xl p-8 max-w-md mx-4 border-2 border-primary/20">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                {content.signInWithGoogle}
              </h3>
              <p className="text-muted-foreground mb-4">
                {content.popupOpening}
              </p>
              <div className="bg-accent border-2 border-primary/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-accent-foreground">
                  <strong>{content.popupBlocked}</strong>
                  <br />
                  {content.allowPopups}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {content.grantPermissions}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {slot.is_cancelled || isRescheduling ? (
          // ---------- Booking Section ----------
          <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
            {/* Header */}
            <div className="bg-primary px-8 py-6 text-primary-foreground shadow-md">
              <h1 className="text-3xl font-bold mb-2">
                {isRescheduling
                  ? content.rescheduleTitle
                  : content.bookingTitle}
                {slotType && (
                  <span className="ml-3 text-2xl">
                    (
                    {slotType === "LR" ? content.learningRound : content.cultureFitRound}
                    )
                  </span>
                )}
              </h1>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span className="text-lg">
                  {currentStudent?.firstName || ""}{" "}
                  {currentStudent?.lastName || ""}
                </span>
              </div>
              <p className="text-sm mt-1 opacity-90">
                {currentStudent?.email || ""}
              </p>
              {isRescheduling && (
                <div className="mt-3 bg-primary-foreground/10 rounded-lg p-3 border border-primary-foreground/20">
                  <p className="text-sm font-semibold">
                    📅 {content.currentSlot}{" "}
                    {slot.on_date && formatDisplayDate(new Date(slot.on_date))}{" "}
                    at {slot.start_time && formatTime(slot.start_time)}
                  </p>
                  <p className="text-xs mt-1">
                    {content.selectNewSlot}
                  </p>
                </div>
              )}
            </div>

            <div className="p-8">
              {/* Date Picker */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-primary" />
                  {content.selectDate}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={formatDate(selectedDate)}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    min={formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000))}
                    max={formatDate(
                      new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                    )}
                    className="w-full p-3 border-2 border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-all"
                  />
                  <div className="bg-accent p-3 rounded-lg border-2 border-primary/20">
                    <p className="text-sm text-muted-foreground">{content.selectedDate}</p>
                    <p className="text-lg font-semibold text-primary">
                      {formatDisplayDate(selectedDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                  <Clock className="w-6 h-6 mr-2 text-primary" />
                  {content.availableTimeSlots}
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
                            ? "border-primary bg-accent shadow-md scale-105"
                            : "border-border bg-card hover:border-primary hover:shadow-md hover:scale-102"
                        }`}
                      >
                        <div className="text-center">
                          <p className="font-semibold text-foreground">
                            {formatTime(timing.start_time)} -{" "}
                            {formatTime(timing.end_time)}
                          </p>
                          {/* <p className="text-xs text-gray-500 mt-2">
                            {timing.interviewer_name || timing.interviewer_email}
                          </p> */}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted border border-border rounded-lg p-8 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-foreground text-base">
                      {content.noSlotsAvailable}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {content.selectAnotherDate}
                    </p>
                  </div>
                )}
              </div>

              {/* Selected Slot Info */}
              {((isRescheduling && newSlot.id) || (!isRescheduling && slot.id && slot.is_cancelled)) && (
                <div className="mb-6 bg-accent border-2 border-primary rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-accent-foreground mb-2">
                    {isRescheduling ? content.newSlotSelected : content.selectedSlot}
                  </h4>
                  <div className="text-sm text-accent-foreground space-y-1">
                    <p>📅 {content.date} {formatDisplayDate(selectedDate)}</p>
                    <p>
                      🕐 {content.time}{" "}
                      {formatTime(isRescheduling ? newSlot.from : slot.from)} -{" "}
                      {formatTime(isRescheduling ? newSlot.to : slot.to)}
                    </p>
                  </div>
                </div>
              )}

              {/* Google Sign-in Status */}
              {!isGoogleSignedIn && (slot.id || newSlot.id) && (
                <div className="mb-6 bg-accent border-2 border-primary/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Video className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-accent-foreground mb-1">
                        {content.googleMeetRequired}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {content.signInDescription}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ℹ️ {content.popupInfo}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* {isGoogleSignedIn && (slot.id || newSlot.id) && (
                <div className="mb-6 bg-accent border-2 border-[hsl(var(--primary))] rounded-lg p-4 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--primary))]" />
                    <p className="text-sm text-accent-foreground">
                      {content.accountConnected}
                    </p>
                  </div>
                </div>
              )} */}

              {/* Booking/Rescheduling Buttons */}
              {isRescheduling ? (
                <div className="flex gap-4">
                  <button
                    onClick={handleCancelReschedule}
                    disabled={isBookingInProgress}
                    className="flex-1 py-4 px-6 rounded-lg font-semibold text-lg transition-all bg-secondary-purple-light hover:bg-secondary-purple/20 text-secondary-purple disabled:opacity-50 border-2 border-secondary-purple shadow-sm hover:shadow-md"
                  >
                    {content.cancel}
                  </button>
                  <button
                    onClick={handleRescheduleConfirm}
                    disabled={!newSlot.id || isBookingInProgress}
                    className={`flex-1 py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                      !newSlot.id || isBookingInProgress
                        ? "bg-muted text-muted-foreground cursor-not-allowed border-2 border-border"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl border-2 border-primary"
                    }`}
                  >
                    {isBookingInProgress ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {content.rescheduling}
                      </span>
                    ) : newSlot.id ? (
                      content.confirmReschedule
                    ) : (
                      content.selectNewTimeSlot
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSlotBooking}
                  disabled={!slot.id || isBookingInProgress}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                    !slot.id || isBookingInProgress
                      ? "bg-muted text-muted-foreground cursor-not-allowed border-2 border-border"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl border-2 border-primary"
                  }`}
                >
                  {isBookingInProgress ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {content.booking}
                    </span>
                  ) : slot.id ? (
                    content.bookSelectedSlot
                  ) : (
                    content.selectTimeSlot
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          // ---------- Booked Details Section ----------
          <div className="bg-card rounded-xl shadow-2xl overflow-hidden border border-border">
            <div className="bg-primary px-8 py-6 text-primary-foreground shadow-md">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <CheckCircle className="w-8 h-8" />
                <h1 className="text-3xl font-bold">{content.interviewSlotBooked}</h1>
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                {content.slotDetails}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{content.studentName}</p>
                    <p className="text-lg font-semibold text-foreground">{slot.student_name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">{content.topic}</p>
                    <p className="text-lg font-semibold text-foreground">{slot.topic_name}</p>
                  </div>

                  {slot.interviewer_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">{content.interviewer}</p>
                      <p className="text-lg font-semibold text-foreground">
                        {slot.interviewer_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {slot.interviewer_email}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{content.date.replace(':', '')}</p>
                    <p className="text-lg font-semibold text-foreground">
                      {slot.on_date &&
                        formatDisplayDate(new Date(slot.on_date))}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">{content.time.replace(':', '')}</p>
                    <p className="text-lg font-semibold text-foreground">
                      {slot.start_time &&
                        slot.end_time_expected &&
                        `${formatTime(slot.start_time)} - ${formatTime(
                          slot.end_time_expected,
                        )}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Google Meet Link */}
              {slot.meet_link && (
                <div className="bg-accent border-2 border-primary rounded-lg p-6 mb-6 shadow-md">
                  <div className="flex items-center mb-3">
                    <Video className="w-6 h-6 text-primary mr-2" />
                    <h3 className="text-xl font-semibold text-foreground">
                      {content.googleMeetLink}
                    </h3>
                  </div>
                  <a
                    href={slot.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl border-2 border-primary hover:scale-105"
                  >
                    <Video className="w-5 h-5 mr-2" />
                    {content.joinGoogleMeet}
                  </a>
                  <p className="text-sm text-muted-foreground mt-3">
                    {content.meetLinkSent}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleDeleteSlot}
                  disabled={isBookingInProgress || isCancelling}
                  className="flex-1 py-3 px-6 bg-primary-light hover:bg-primary/20 text-primary font-semibold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed border-2 border-primary hover:scale-105"
                >
                  {isBookingInProgress ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {content.processing}
                    </span>
                  ) : (
                    content.rescheduleSlot
                  )}
                </button>

                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={isBookingInProgress || isCancelling}
                  className="flex-1 py-3 px-6 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed border-2 border-destructive hover:scale-105"
                >
                  <span className="flex items-center justify-center">
                    <XCircle className="w-4 h-4 mr-2" />
                    {content.cancelSlot}
                  </span>
                </button>

                <button
                  onClick={handleNavigationOnStudentPage}
                  className="flex-1 py-3 px-6 bg-secondary-purple-light hover:bg-secondary-purple/20 text-secondary-purple font-semibold rounded-lg transition-all shadow-sm hover:shadow-md border-2 border-secondary-purple hover:scale-105"
                >
                  {content.viewResults}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Slot Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6 border-2 border-destructive/30 animate-scale-in">
              <div className="flex items-center mb-4">
                <div className="bg-destructive/10 rounded-full p-2 mr-3">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{content.cancelInterviewSlot}</h2>
              </div>

              <p className="text-muted-foreground mb-4">
                {content.cancelConfirmation}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {content.reasonForCancellation} <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={content.reasonPlaceholder}
                  className="w-full p-3 border-2 border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-destructive focus:border-destructive resize-none transition-all"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason("");
                  }}
                  disabled={isCancelling}
                  className="flex-1 py-3 px-4 bg-secondary-purple-light hover:bg-secondary-purple/20 text-secondary-purple font-semibold rounded-lg transition-all disabled:opacity-50 border-2 border-secondary-purple hover:scale-105 disabled:hover:scale-100"
                >
                  {content.goBack}
                </button>
                <button
                  onClick={handleCancelSlot}
                  disabled={isCancelling || !cancelReason.trim()}
                  className={`flex-1 py-3 px-4 font-semibold rounded-lg transition-all border-2 ${
                    isCancelling || !cancelReason.trim()
                      ? "bg-muted text-muted-foreground cursor-not-allowed border-border opacity-60"
                      : "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive hover:scale-105 shadow-md hover:shadow-lg"
                  }`}
                >
                  {isCancelling ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {content.cancelling}
                    </span>
                  ) : (
                    content.confirmCancel
                  )}
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

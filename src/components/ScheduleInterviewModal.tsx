import { useState, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Calendar,
  Clock,
  User,
  Mail,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getStudentById,
  searchStudentsApi,
  getCurrentUser,
} from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { useEffect } from "react";
import { ContextualHelpWidget } from "@/components/onboarding/ContextualHelpWidget";
// import demoVideoInterview from "@/assets/demo-video-interview.mp4";

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotData: {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    interviewer_email?: string;
    interviewer_name?: string;
  } | null;
  allAvailableSlots?: Array<{
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    slot_type?: string;
    interviewer_email?: string;
    interviewer_name?: string;
    user_email?: string;
    user_name?: string;
    is_booked: boolean;
    status?: string;
  }>;
  isDirectScheduleMode?: boolean;
  onSchedule: (
    slotId: number,
    studentId: number,
    studentEmail: string,
    studentName: string,
    interviewerEmail: string,
    interviewerName: string,
    date: string,
    startTime: string,
    endTime: string,
    topicName: string,
    adminEmail: string,
    adminName: string
  ) => Promise<void>;
  isLoading: boolean;
  initialStudentId?: string;
  initialStudentEmail?: string;
  initialStudentName?: string;
  isRescheduleMode?: boolean; // Flag to indicate if we're rescheduling
  helpVariant?: "created-slots" | "applicant";
}

export const ScheduleInterviewModal = ({
  isOpen,
  onClose,
  slotData,
  allAvailableSlots = [],
  isDirectScheduleMode = false,
  onSchedule,
  isLoading,
  initialStudentId,
  initialStudentEmail,
  initialStudentName,
  isRescheduleMode = false,
  helpVariant = "created-slots",
}: ScheduleInterviewModalProps) => {
  const [studentId, setStudentId] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [studentLookupMethod, setStudentLookupMethod] = useState<"email" | "phone">("email");
  const [studentName, setStudentName] = useState("");
  const [topicName, setTopicName] = useState("");
  const [interviewerEmail, setInterviewerEmail] = useState("");
  const [interviewerName, setInterviewerName] = useState("");
  const [schedulerEmail, setSchedulerEmail] = useState("");
  const [schedulerName, setSchedulerName] = useState("");
  const [isFetchingStudent, setIsFetchingStudent] = useState(false);
  const [studentDataFetched, setStudentDataFetched] = useState(false);
  const [completeStudentData, setCompleteStudentData] = useState<any>(null);
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const studentSelectionRequestRef = useRef(0);
  const { toast } = useToast();

  // New states for date and slot selection
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  // Auto-fetch student data when modal opens with initial data
  useEffect(() => {
    const autoFetchStudentData = async () => {
      // Only run when modal opens AND we have initial student data
      if (!isOpen) {
        // Reset all fields when modal closes
        setStudentId("");
        setStudentEmail("");
        setStudentPhone("");
        setStudentLookupMethod("email");
        setStudentName("");
        setStudentDataFetched(false);
        setCompleteStudentData(null);
        setStudentSearchResults([]);
        setSelectedDate("");
        setSelectedSlotId(null);
        setTopicName("");
        setIsFetchingStudent(false);
        return;
      }

      // Applicant details already contain the canonical student ID. Use it as the
      // lookup key for this flow; email is only retained for the calendar invite.
      if (initialStudentId) {
        // console.log("Auto-fetching student data for ID:", initialStudentId);
        
        // Set initial values immediately
        setStudentId(initialStudentId);
        setStudentEmail(initialStudentEmail);
        if (initialStudentName) {
          setStudentName(initialStudentName);
        }
        
        // Automatically fetch student data by ID so a stale/missing email cannot
        // resolve the wrong applicant.
        setIsFetchingStudent(true);
        try {
          const response = await getStudentById(initialStudentId);
          // console.log("Student data fetched:", response);
          
          // Normalize the response - handle both axios.data and nested data.data structures
          const responseData = (response as any)?.data ?? response;
          const payload = responseData?.data ?? responseData;
          const studentData = payload?.student ?? payload;
          
          // Update with fetched data
          const studentId = studentData.student_id || studentData.id;
          const fullName =
            studentData.full_name ||
            studentData.name ||
            `${studentData.first_name || ""} ${studentData.last_name || ""}`.trim();
          
          if (studentId) {
            setStudentId(String(studentId));
            setStudentEmail(studentData.email || initialStudentEmail || "");
            setStudentName(fullName);
            setCompleteStudentData(payload);
            setStudentDataFetched(true);
            // console.log("Student data set successfully:", fullName);
          } else {
            console.warn("No student ID found in response");
            setStudentDataFetched(false);
          }
        } catch (error) {
          console.error("Failed to fetch student data:", error);
          // Do not allow booking when the ID lookup failed.
          setStudentDataFetched(false);
        } finally {
          setIsFetchingStudent(false);
        }
      } else {
        // console.log("Auto-fetch conditions not met - missing student ID or email:", { isOpen, initialStudentId, initialStudentEmail, initialStudentName });
      }
    };

    autoFetchStudentData();
  }, [isOpen, initialStudentId, initialStudentEmail, initialStudentName]);

  // Default interviewer email and topic name based on slot data
  useEffect(() => {
    if (isOpen) {
      const user = getCurrentUser();

      // Priority: 1. Slot data user_email/user_name (from slot), 2. interviewer_email/name, 3. Current user
      const defaultInterviewerEmail =
        (slotData as any)?.user_email || 
        slotData?.interviewer_email || 
        user?.email || "";
      const defaultInterviewerName =
        (slotData as any)?.user_name || 
        slotData?.interviewer_name || 
        user?.name || "";

      // Always update interviewer details when slot changes
      setInterviewerEmail(defaultInterviewerEmail);
      setInterviewerName(defaultInterviewerName);

      // Auto-fill scheduler details from current user
      setSchedulerEmail(user?.email || "");
      setSchedulerName(user?.name || "");

      // Auto-fill topic based on slot type if slotData is provided (normal mode)
      if (slotData && !isDirectScheduleMode) {
        const slotType = (slotData as any).slot_type;
        if (slotType === "LR") {
          setTopicName("Learning Round");
        } else if (slotType === "CFR") {
          setTopicName("Cultural Fit Round");
        }
      }
    }
  }, [isOpen, slotData, isDirectScheduleMode]);

  const getStudentDisplayName = (student: any) =>
    student.full_name ||
    student.name ||
    `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
    "Unnamed student";

  const handleSelectStudent = async (student: any) => {
    const selectedStudentId = student.student_id || student.id;
    if (!selectedStudentId) return;

    const selectionRequestId = ++studentSelectionRequestRef.current;

    setStudentId(String(selectedStudentId));
    setStudentEmail(student.email || "");
    setStudentPhone(student.phone_number || student.phone || "");
    setStudentName(getStudentDisplayName(student));
    setStudentSearchResults([]);
    setStudentDataFetched(false);
    setCompleteStudentData(null);
    setIsFetchingStudent(true);

    try {
      // Always load the selected row by its unique student ID. Looking up by
      // phone/email here can return the first matching student when duplicates
      // exist, which would overwrite the selected result with the wrong data.
      const response = await getStudentById(String(selectedStudentId));
      if (selectionRequestId !== studentSelectionRequestRef.current) return;

      const responseData = (response as any)?.data ?? response;
      const payload = responseData?.data ?? responseData ?? student;
      const selectedStudent = payload?.student ?? payload;
      const fetchedStudentId = selectedStudent?.student_id || selectedStudent?.id;
      const fetchedName = getStudentDisplayName(selectedStudent);

      setStudentId(String(fetchedStudentId || selectedStudentId));
      setStudentEmail(selectedStudent?.email || student.email || "");
      setStudentPhone(
        selectedStudent?.phone_number ||
          selectedStudent?.phone ||
          student.phone_number ||
          student.phone ||
          ""
      );
      setStudentName(fetchedName !== "Unnamed student" ? fetchedName : getStudentDisplayName(student));
      setCompleteStudentData(payload);
      setStudentDataFetched(true);
    } catch (error) {
      if (selectionRequestId !== studentSelectionRequestRef.current) return;
      console.error("Failed to load selected student details:", error);
      setCompleteStudentData(null);
      toast({
        title: "Student Details Unavailable",
        description: "Could not load the selected student's interview history. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (selectionRequestId === studentSelectionRequestRef.current) {
        setIsFetchingStudent(false);
      }
    }
  };

  // Search students by either email or phone using the common search endpoint.
  const handleFetchStudent = useCallback(async () => {
    const lookupValue = studentLookupMethod === "email" ? studentEmail.trim() : studentPhone.trim();

    if (studentLookupMethod === "email" && (!lookupValue || !lookupValue.includes("@"))) {
      toast({
        title: "⚠️ Invalid Email",
        description: "Please enter a valid email address",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (studentLookupMethod === "phone" && !lookupValue) {
      toast({
        title: "⚠️ Invalid Phone",
        description: "Please enter a valid phone number",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    setIsFetchingStudent(true);
    try {
      const response = await searchStudentsApi(lookupValue);
      const results = Array.isArray(response)
        ? response
        : (response as any)?.data || (response as any)?.students || [];

      if (results.length > 0) {
        setStudentSearchResults(results);
        toast({
          title: "✅ Students Found",
          description: `${results.length} matching student${results.length === 1 ? "" : "s"} found. Select one to continue.`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
      } else {
        throw new Error("No students found for this search");
      }
    } catch (error: any) {
      console.error("Error fetching student:", error);
      toast({
        title: "Student Not Found",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className:
          "border-destructive/50 bg-destructive text-destructive-foreground",
      });
      setStudentId("");
      setStudentName("");
      setCompleteStudentData(null);
      setStudentDataFetched(false);
      setStudentSearchResults([]);
    } finally {
      setIsFetchingStudent(false);
    }
  }, [studentEmail, studentPhone, studentLookupMethod, toast]);

  // Reset student data when email changes
  const handleEmailChange = (email: string) => {
    setStudentEmail(email);
    setStudentSearchResults([]);
    if (studentDataFetched) {
      setStudentId("");
      setStudentName("");
      setCompleteStudentData(null);
      setStudentDataFetched(false);
    }
  };

  const handlePhoneChange = (phone: string) => {
    setStudentPhone(phone);
    setStudentSearchResults([]);
    if (studentDataFetched) {
      setStudentId("");
      setStudentName("");
      setStudentEmail("");
      setCompleteStudentData(null);
      setStudentDataFetched(false);
    }
  };

  const handleLookupMethodChange = (method: "email" | "phone") => {
    setStudentLookupMethod(method);
    setStudentEmail("");
    setStudentPhone("");
    setStudentId("");
    setStudentName("");
    setCompleteStudentData(null);
    setStudentDataFetched(false);
    setStudentSearchResults([]);
  };

  // Helper function to check interview round status
  const getInterviewRoundStatus = () => {
    if (!completeStudentData || !studentDataFetched) {
      return null;
    }

    const lrSchedules = (completeStudentData.interview_schedules_lr || []).filter((s: any) => !s.is_archived);
    const cfrSchedules = (completeStudentData.interview_schedules_cfr || []).filter((s: any) => !s.is_archived);
    const lrRounds = (completeStudentData.interview_learner_round || []).filter((r: any) => !r.is_archived);
    const cfrRounds = (completeStudentData.interview_cultural_fit_round || []).filter((r: any) => !r.is_archived);
    const examSessions = (completeStudentData.exam_sessions || []).filter((e: any) => !e.is_archived);

    // Screening must have a real, active exam result with a passing status.
    // A missing exam session or an empty/non-passing record is not eligible.
    const hasPassedScreening = examSessions.some(
      (exam: any) =>
        typeof exam.status === "string" &&
        exam.status.toLowerCase().includes("pass")
    );

    // console.log(hasPassedScreening);
    // Filter schedules by status - only consider "scheduled" or "booked" status as active
    // Exclude "rescheduled", "cancelled", "completed", etc.
    const activeLRSchedules = lrSchedules.filter(
      (schedule: any) => {
        const status = schedule.status?.toLowerCase() || "";
        return status && !["cancelled", "completed", "expired"].includes(status);
      }
    );
    const activeCFRSchedules = cfrSchedules.filter(
      (schedule: any) => {
        const status = schedule.status?.toLowerCase() || "";
        return status && !["cancelled", "completed", "expired"].includes(status);
      }
    );

    // Check if student has passed LR round
    const hasPassedLR = lrRounds.some((round: any) =>
      round.learning_round_status?.toLowerCase().includes("pass")
    );

    // Check if student has passed CFR round
    const hasPassedCFR = cfrRounds.some((round: any) =>
      round.cultural_fit_round_status?.toLowerCase().includes("pass")
    );

    // Determine the current slot type from slotData or selected slot
    const currentSlot = isDirectScheduleMode
      ? allAvailableSlots.find((s) => s.id === selectedSlotId)
      : slotData;

    const slotType = currentSlot ? (currentSlot as any).slot_type : null;

    // Check for LR round
    if (slotType === "LR") {
      // First check if student has passed screening test
      if (!hasPassedScreening) {
        return {
          canBook: false,
          message: "Student must pass screening test before LR slot booking",
          type: "warning",
        };
      }
      // Always block if student has already passed LR (even in reschedule mode)
      if (hasPassedLR) {
        return {
          canBook: false,
          message: "Student has already passed LR round",
          type: "info",
        };
      }
      // Skip "already scheduled" check if in reschedule mode
      if (!isRescheduleMode && activeLRSchedules.length > 0) {
        return {
          canBook: false,
          message: "Student already has LR interview scheduled",
          type: "warning",
        };
      }
      if (lrRounds.length > 0) {
        // Has attempted LR but not passed - allow rebooking
        return {
          canBook: true,
          message: "Student is eligible for LR slot booking (reattempt)",
          type: "success",
        };
      }
      return {
        canBook: true,
        message: "Student is eligible for LR slot booking",
        type: "success",
      };
    }

    // Check for CFR round
    if (slotType === "CFR") {
      // First check if student has passed screening test
      if (!hasPassedScreening) {
        return {
          canBook: false,
          message:
            "Student must pass screening or Learning round before CFR slot booking",
          type: "warning",
        };
      }

      // Check if LR is passed before allowing CFR booking
      if (!hasPassedLR) {
        return {
          canBook: false,
          message: "Student must pass screening or Learning round before CFR slot booking",
          type: "warning",
        };
      }

      // Always block if student has already passed CFR (even in reschedule mode)
      if (hasPassedCFR) {
        return {
          canBook: false,
          message: "Student has already passed CFR round",
          type: "info",
        };
      }

      // Skip "already scheduled" check if in reschedule mode
      if (!isRescheduleMode && activeCFRSchedules.length > 0) {
        return {
          canBook: false,
          message: "Student already has CFR interview scheduled",
          type: "warning",
        };
      }

      if (cfrRounds.length > 0) {
        // Has attempted CFR but not passed - allow rebooking
        return {
          canBook: true,
          message: "Student is eligible for CFR slot booking (reattempt)",
          type: "success",
        };
      }
      return {
        canBook: true,
        message: "Student is eligible for CFR slot booking",
        type: "success",
      };
    }

    return null;
  };

  const interviewStatus = getInterviewRoundStatus();

  // Get unique dates from available slots (only Available status and future dates)
  // IMPORTANT: Must be before early return to follow Rules of Hooks
  const availableDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day

    return Array.from(
      new Set(
        allAvailableSlots
          .filter((s) => {
            const slotDate = new Date(s.date);
            slotDate.setHours(0, 0, 0, 0);
            // Filter: not booked, has "Available" status, and is today or future date
            return !s.is_booked && 
                   s.status === "Available"
          })
          .map((s) => s.date)
      )
    ).sort();
  }, [allAvailableSlots]);

  // Get slots for selected date (only Available status)
  // IMPORTANT: Must be before early return to follow Rules of Hooks
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    
    return allAvailableSlots.filter(
      (s) => s.date === selectedDate && 
             !s.is_booked && 
             s.status === "Available"
    );
  }, [selectedDate, allAvailableSlots]);

  const helpTitle =
    helpVariant === "applicant" ? "Applicant Interview Scheduling" : "Created Slot Scheduling";

  const scheduleInterviewGuideSteps = [
    {
      id: "schedule-interview-title",
      target: '[data-onboarding="schedule-interview-title"]',
      text:
        helpVariant === "applicant"
          ? "Use this form to schedule or reschedule the applicant interview."
          : "Use this form to assign an applicant to the selected created slot.",
    },
    ...(isDirectScheduleMode
      ? [
          {
            id: "schedule-interview-slot",
            target: '[data-onboarding="schedule-interview-slot"]',
            text:
              helpVariant === "applicant"
                ? "Pick the date and interview slot available for this applicant."
                : "Pick the created date and slot you want to book from here.",
          },
        ]
      : []),
    {
      id: "schedule-interview-student",
      target: '[data-onboarding="schedule-interview-student"]',
      text:
        helpVariant === "applicant"
          ? "Confirm the applicant details before saving the interview."
          : "Search and confirm the applicant details you want to assign to this slot.",
    },
    {
      id: "schedule-interview-interviewer",
      target: '[data-onboarding="schedule-interview-interviewer"]',
      text:
        helpVariant === "applicant"
          ? "Review interviewer details here before sending the invite."
          : "Verify the interviewer details for the created slot and update them if needed.",
    },
    {
      id: "schedule-interview-submit",
      target: '[data-onboarding="schedule-interview-submit"]',
      text:
        helpVariant === "applicant"
          ? "Finish scheduling the applicant interview from here."
          : "Book the selected created slot and generate the meeting from here.",
    },
  ];

  const scheduleInterviewFaqs =
    helpVariant === "applicant"
      ? [
          {
            question: "Can I reschedule from this modal?",
            answer: "Yes. The same modal supports rescheduling when it opens in reschedule mode.",
          },
          {
            question: "Why is scheduling blocked?",
            answer: "The status message explains if a prior round or active booking is preventing scheduling.",
          },
        ]
      : [
          {
            question: "How do I schedule from Created Slots?",
            answer: "Open an available slot, select or confirm the applicant details, and save to generate the interview link.",
          },
          {
            question: "Can I change interviewer details before booking?",
            answer: "Yes. Review the interviewer section and update the name or email before you confirm the schedule.",
          },
        ];

  if (!isOpen) return null;

  // Get selected slot details
  const currentSlot = isDirectScheduleMode
    ? slotsForSelectedDate.find((s) => s.id === selectedSlotId)
    : slotData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // A student can be resolved by email or phone. Email is optional after a
    // phone lookup because it is only used as a calendar invite attendee.
    const hasRequiredStudentData = Boolean(
      !isFetchingStudent &&
      studentId.trim() &&
      studentName.trim() &&
      topicName.trim() &&
      studentDataFetched
    );

    if (!hasRequiredStudentData) {
      toast({
        title: "⚠️ Incomplete Information",
        description: "Please fill all required fields",
        variant: "default",
        className: "border-primary/50 bg-primary text-primary-dark",
      });
      return;
    }

    if (isDirectScheduleMode && !selectedSlotId) {
      toast({
        title: "⚠️ Slot Required",
        description: "Please select a date and time slot",
        variant: "default",
        className: "border-primary/50 bg-primary/5 text-primary-dark",
      });
      return;
    }

    const slotToUse = currentSlot;
    if (!slotToUse) {
      toast({
        title: "⚠️ Invalid Slot",
        description: "Please select a valid slot",
        variant: "default",
        className: "border-primary/50 bg-primary/5 text-primary-dark",
      });
      return;
    }

    // Never allow a booking when round eligibility could not be determined.
    // This prevents CFR scheduling when the student has no passed LR round.
    if (!isRescheduleMode && (!interviewStatus || !interviewStatus.canBook)) {
      toast({
        title: "⚠️ Interview Not Eligible",
        description:
          interviewStatus?.message ||
          "Student interview history is not available. Please reload student details and try again.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    const finalInterviewerEmail =
      interviewerEmail || slotToUse.interviewer_email || "";
    if (!finalInterviewerEmail) {
      toast({
        title: "⚠️ Interviewer Required",
        description: "Please enter interviewer email",
        variant: "default",
        className: "border-primary/50 bg-primary/5 text-primary-dark",
      });
      return;
    }

    try {
      await onSchedule(
        slotToUse.id,
        parseInt(studentId),
        studentEmail,
        studentName,
        finalInterviewerEmail,
        interviewerName || finalInterviewerEmail,
        slotToUse.date,
        slotToUse.start_time,
        slotToUse.end_time,
        topicName,
        schedulerEmail || "admin@navgurukul.org",
        schedulerName || "Admin"
      );

      // Reset form
      setStudentId("");
      setStudentEmail("");
      setStudentPhone("");
      setStudentLookupMethod("email");
      setStudentName("");
      setTopicName("");
      setInterviewerEmail("");
      setSchedulerEmail("");
      setSchedulerName("");
      setSelectedDate("");
      setSelectedSlotId(null);
      setStudentDataFetched(false);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast({
        title: "❌ Failed to Schedule Interview",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className:
          "border-destructive/50 bg-destructive/5 text-destructive-foreground",
      });
    }
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hour), parseInt(minute));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl bg-card shadow-large border border-border"
        data-onboarding-portal-root="true"
      >
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle
            className="flex items-center justify-between text-lg font-semibold text-foreground"
            data-onboarding="schedule-interview-title"
          >
            <span>{isRescheduleMode ? "Reschedule Interview" : "Schedule Interview"}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Schedule or reschedule interview slots and interviewer details.
          </DialogDescription>
          <p className="text-sm text-muted-foreground mt-1">
            {isRescheduleMode 
              ? "Select a new time slot and update the interview details"
              : "Create Google Meet link and schedule the interview"
            }
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
          {/* Date and Slot Selection (only in direct schedule mode) */}
          {isDirectScheduleMode && (
            <div
              className="bg-primary/5 border border-primary/20 rounded-lg p-5"
              data-onboarding="schedule-interview-slot"
            >
              <h3 className="font-semibold text-foreground mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Select Date & Slot
              </h3>

              {/* Date Picker */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Date <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlotId(null);
                  }}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-card"
                  required
                >
                  <option value="">Choose a date</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {formatDate(date)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Slot Selection */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select Time Slot <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {slotsForSelectedDate.map((slot) => (
                      <div
                        key={slot.id}
                        onClick={() => {
                          setSelectedSlotId(slot.id);
                          // Auto-fill interviewer details from slot
                          const slotInterviewerEmail = slot.user_email || slot.interviewer_email || "";
                          const slotInterviewerName = slot.user_name || slot.interviewer_name || "";
                          setInterviewerEmail(slotInterviewerEmail);
                          setInterviewerName(slotInterviewerName);
                          // Auto-fill topic based on slot type
                          if (slot.slot_type === "LR") {
                            setTopicName("Learning Round");
                          } else if (slot.slot_type === "CFR") {
                            setTopicName("Cultural Fit Round");
                          }
                        }}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:scale-102 ${
                          selectedSlotId === slot.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30 hover:shadow-soft"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {formatTime(slot.start_time)} -{" "}
                            {formatTime(slot.end_time)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          {(slot.user_name || slot.interviewer_name) && (
                            <p className="text-xs text-muted-foreground ml-6">
                              {slot.user_name || slot.interviewer_name}
                            </p>
                          )}
                          {slot.slot_type && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                slot.slot_type === "LR"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {slot.slot_type === "LR" ? "LR" : "CFR"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Slot Info (only show when slot is selected) */}
          {currentSlot && (
            <div className="bg-muted/30 border border-border rounded-lg p-5 shadow-soft">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Selected Slot Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Date:</span>
                  <span>{formatDate(currentSlot.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Time:</span>
                  <span>
                    {formatTime(currentSlot.start_time)} -{" "}
                    {formatTime(currentSlot.end_time)}
                  </span>
                </div>
                {currentSlot.interviewer_name && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Interviewer:</span>
                    <span>{currentSlot.interviewer_name}</span>
                  </div>
                )}
                {currentSlot.interviewer_email && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{currentSlot.interviewer_email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Student Info */}
          <div
            className="p-4 bg-muted/30 rounded-lg space-y-4 shadow-soft border border-border"
            data-onboarding="schedule-interview-student"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interview Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={topicName}
                readOnly
                className="w-full px-3 py-2 border border-border rounded-md bg-muted text-foreground cursor-not-allowed font-medium"
                placeholder="Auto-filled from slot selection"
                required
              />
            </div>

            {!initialStudentId && (
            <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Find Student By <span className="text-red-500">*</span>
                </label>
                <select
                  value={studentLookupMethod}
                  onChange={(e) => handleLookupMethodChange(e.target.value as "email" | "phone")}
                  disabled={isFetchingStudent}
                  className="w-full mb-2 px-3 py-2 border border-border rounded-md bg-card focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-muted disabled:cursor-not-allowed"
                >
                  <option value="email">Student Email</option>
                  <option value="phone">Phone</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type={studentLookupMethod === "email" ? "email" : "tel"}
                    value={studentLookupMethod === "email" ? studentEmail : studentPhone}
                    onChange={(e) => studentLookupMethod === "email"
                      ? handleEmailChange(e.target.value)
                      : handlePhoneChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-card disabled:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground"
                    placeholder={studentLookupMethod === "email" ? "student@example.com" : "Enter phone number"}
                    required
                    disabled={isFetchingStudent}
                  />
                  <Button
                    type="button"
                    onClick={handleFetchStudent}
                    disabled={isFetchingStudent || !(studentLookupMethod === "email" ? studentEmail : studentPhone)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isFetchingStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {studentDataFetched
                    ? "Student details loaded"
                    : `Enter ${studentLookupMethod === "email" ? "email" : "phone number"} and click search`}
                </p>
                {studentSearchResults.length > 0 && (
                  <div className="mt-2 overflow-hidden rounded-md border border-primary/30 bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-border bg-primary/5 px-3 py-2">
                      <span className="text-xs font-semibold text-foreground">
                        Select a student
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Click on a result to continue
                      </span>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                    {studentSearchResults.map((student, index) => {
                      const resultId = student.student_id || student.id;
                      return (
                        <button
                          key={resultId || index}
                          type="button"
                          onClick={() => handleSelectStudent(student)}
                          aria-label={`Select ${getStudentDisplayName(student)}`}
                          className="group flex w-full items-center justify-between border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-primary/5 focus:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-foreground">
                              {getStudentDisplayName(student)}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {[student.email, student.phone_number || student.phone]
                                .filter(Boolean)
                                .join(" • ") || `Student ID: ${resultId || "—"}`}
                            </span>
                          </span>
                          <span className="ml-3 shrink-0 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                            Select →
                          </span>
                        </button>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hidden Student ID field - value sent in payload but not shown in UI */}
            <input type="hidden" value={studentId} required />

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Student Name <span className="text-red-500">*</span>
              </label>
              {studentDataFetched && !initialStudentId ? (
                <div className="w-full rounded-md border border-border bg-muted px-3 py-2">
                  <span className="block text-sm font-medium text-foreground">
                    {studentName}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {[studentEmail, studentPhone].filter(Boolean).join(" • ")}
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-card disabled:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground"
                  placeholder={initialStudentId ? "Auto-filled from student ID" : "Auto-filled from email"}
                  required
                  disabled={studentDataFetched}
                />
              )}
              {studentDataFetched && interviewStatus && (
                <div
                  className={`text-xs mt-2 px-3 py-2 rounded-md flex items-start gap-2 font-medium ${
                    interviewStatus.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : interviewStatus.type === "warning"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  <span className="text-base">
                    {interviewStatus.type === "success"
                      ? "✓"
                      : interviewStatus.type === "warning"
                        ? "⚠️"
                        : "ℹ️"}
                  </span>
                  <span>{interviewStatus.message}</span>
                </div>
              )}
              {studentDataFetched && !interviewStatus && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1 font-medium">
                  ✓ Student Found
                </p>
              )}
            </div>
          </div>

          {/* Interviewer Info */}
          <div
            className="p-4 bg-muted/30 rounded-lg space-y-4 shadow-soft border border-border"
            data-onboarding="schedule-interview-interviewer"
          >
            <h3 className="font-semibold text-foreground flex items-center">
              <Mail className="w-5 h-5 mr-2 text-primary" />
              Interviewer Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Interviewer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-card font-medium mb-3"
                placeholder="Interviewer Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Interviewer Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={interviewerEmail}
                onChange={(e) => setInterviewerEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-card font-medium"
                placeholder="interviewer@example.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                You can change the interviewer details if needed
              </p>
            </div>
          </div>

          {/* Scheduler Info */}
          <div
            className="p-4 bg-muted/30 rounded-lg space-y-4 shadow-soft border border-border"
            data-onboarding="schedule-interview-scheduler"
          >
            <h3 className="font-semibold text-foreground flex items-center">
              <User className="w-5 h-5 mr-2 text-primary" />
              Scheduler Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Scheduler Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={schedulerName}
                readOnly
                className="w-full px-3 py-2 border border-border rounded-md bg-muted text-foreground cursor-not-allowed font-medium mb-3"
                placeholder="Scheduler Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Scheduler Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={schedulerEmail}
                readOnly
                className="w-full px-3 py-2 border border-border rounded-md bg-muted text-foreground cursor-not-allowed font-medium"
                placeholder="scheduler@example.com"
                required
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-foreground shadow-soft">
            <p className="font-semibold mb-1 text-primary">
              What happens next?
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Google Meet link will be created automatically</li>
              <li>Calendar invites sent to student & interviewer</li>
              <li>Interview details saved to database</li>
              <li>Slot will be marked as booked</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 hover:bg-primary/5 hover:text-primary transition-all hover:shadow-soft"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 font-medium shadow-soft hover:shadow-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              data-onboarding="schedule-interview-submit"
                disabled={
                  isLoading ||
                  (!isRescheduleMode &&
                    (!interviewStatus || !interviewStatus.canBook))
                }
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isRescheduleMode ? "Rescheduling..." : "Creating Meeting..."}
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  {!isRescheduleMode && interviewStatus && !interviewStatus.canBook
                    ? (interviewStatus.message.includes("already has") 
                        ? "Cannot Schedule - Interview Already Scheduled"
                        : "Cannot Schedule - " + interviewStatus.message.split(" before ")[0])
                    : isRescheduleMode
                    ? "Reschedule & Update Meet Link"
                    : "Schedule & Create Meet Link"}
                </>
              )}
            </Button>
          </div>

          <ContextualHelpWidget
            sectionId={`schedule-interview-${helpVariant}`}
            sectionTitle={helpTitle}
            steps={scheduleInterviewGuideSteps}
            faqs={scheduleInterviewFaqs}
            autoStartOnFirstVisit={false}
            floatingContainer="local"
            floatingVariant="sticky"
            showDemoButton={false}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};

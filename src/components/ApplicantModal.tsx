import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, MessageSquare, Pencil, ChevronsUpDown, Check, Calendar as CalendarIcon, Video, Clock } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Edit, MessageSquare, Pencil, ChevronsUpDown, Check } from "lucide-react";
// import { StatusBadge } from "./StatusBadge";
import { InlineEditModal } from "./InlineEditModal";
import { TransitionsModal } from "./TransitionsModal";
import { InterviewDetailsModal } from "./InterviewDetailsModal";
// import { ApplicantCommentsModal } from "./ApplicantCommentsModal";
// import { Calendar } from "lucide-react";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
import { EditableCell } from "./applicant-table/EditableCell";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import {
  updateStudent,
  getStudentById,
  API_MAP,
  submitFinalDecision,
  getBlocksByDistrict,
  getDistrictsByState,
  getPartnerById,
  getDonorById,
  getAllCasts,
  getAllQualification,
  getAllStatus,
  getAllSchools,
  getCampusesApi,
  getAllQuestionSets,
  getAllStages,
  getAllPartners,
  getAllDonors,
  getAllStates,
  getFeedbacks,
  scheduleInterview,
  getMyAvailableSlots,
  getInterviewByStudentId,
  getAllSlots,
  cancelScheduledInterview,
  updateScheduledInterview,
} from "@/utils/api";
import { InlineSubform } from "@/components/Subform";
// import { Input } from "@/components/ui/input";
// import { cn } from "@/lib/utils";
// import StageDropdown, {
//   STAGE_STATUS_MAP,
// } from "./applicant-table/StageDropdown";
// import { Value } from "@radix-ui/react-select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  initClient,
  signIn,
  isSignedIn,
  createCalendarEvent,
  deleteCalendarEvent,
  formatDateTimeForCalendar,
} from "@/utils/googleCalendar";
import { useReferenceData } from "@/hooks/useReferenceData";
import { ScheduleInterviewModal } from "@/components/ScheduleInterviewModal";

// Component to display schedule information in compact format (similar to audit info)
const ScheduleInfoDisplay = ({ row }: any) => {
  const schedules = row.schedule_info;

  // If no schedule info, display a message
  if (!schedules || schedules === "—" || schedules === "No schedule available") {
    return <div className="text-xs text-muted-foreground">—</div>;
  }

  // If schedules is an empty array
  if (Array.isArray(schedules) && schedules.length === 0) {
    return <div className="text-xs text-muted-foreground">—</div>;
  }

  // Ensure schedules is an array
  const scheduleArray = Array.isArray(schedules) ? schedules : [schedules];

  return (
    <div className="text-xs leading-tight space-y-2">
      {scheduleArray.map((schedule: any, index: number) => {
        // The API returns fields directly on the schedule object (not nested in slot_details)
        const date = schedule.date || "—";
        const startTime = schedule.start_time || "—";
        const endTime = schedule.end_time || "—";
        const createdBy = schedule.created_by || "—";
        const studentName = schedule.student_name || "—";
        const interviewerName = schedule.interviewer_name || "—";
        const interviewerEmail = schedule.interviewer_email || "—";
        const meetingLink = schedule.meeting_link || "";
        // const status = schedule.status || "—";

        return (
          <div key={index} className={index > 0 ? "pt-2 border-t border-gray-200" : ""}>
            <div className="mb-0.5">
              <span className="font-semibold">Student:</span> {studentName}
            </div>
            <div className="mb-0.5">
              <span className="font-semibold">Date:</span> {date} ({startTime} - {endTime})
            </div>
            <div className="mb-0.5">
              <span className="font-semibold">Scheduled By:</span> {createdBy}
            </div>
            <div className="mb-0.5">
              <span className="font-semibold">Interviewer:</span> {interviewerName} ({interviewerEmail})
            </div>
            {/* <div className="mb-0.5">
              <span className="font-semibold">Status:</span> {status}
            </div> */}
            {meetingLink && (
              <div>
                <span className="font-semibold">Meet Link:</span>{" "}
                <a
                  href={meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Join Meeting
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface ApplicantModalProps {
  applicant: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplicantModal({
  applicant,
  isOpen,
  onClose,
}: ApplicantModalProps) {
  const { toast } = useToast();
  const { hasEditAccess, isAdmin, user } = usePermissions();
  const [currentApplicant, setCurrentApplicant] = useState(applicant);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransitionsModal, setShowTransitionsModal] = useState(false);
  const [transitionsData, setTransitionsData] = useState<any>(null);
  // const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [joiningDate, setJoiningDate] = useState("");
  const [districtOptions, setDistrictOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [blockOptions, setBlockOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);

  // Schedule interview states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleRoundType, setScheduleRoundType] = useState<"LR" | "CFR" | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [schedulingInProgress, setSchedulingInProgress] = useState(false);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<{
    scheduleId: number;
    roundType: "LR" | "CFR";
    googleEventId?: string;
    oldSlotId?: number;
  } | null>(null);

  // Interview details modal states
  const [showInterviewDetailsModal, setShowInterviewDetailsModal] = useState(false);
  const [interviewDetailsRoundType, setInterviewDetailsRoundType] = useState<"LR" | "CFR" | null>(null);
  const [liveScheduleData, setLiveScheduleData] = useState<any[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  // ✅ OPTIMIZATION: Use useReferenceData hook for cached reference data
  const {
    campusList,
    schoolList,
    currentstatusList,
    religionList,
    questionSetList,
    qualificationList,
    castList,
    partnerList,
    donorList,
    stateList: globalStateList,
    fetchAllReferenceData,
    // Individual fetch functions for on-demand loading
    fetchCampuses,
    fetchSchools,
    fetchCurrentStatuses,
    fetchStages: fetchStagesFromHook,
    fetchReligions,
    fetchQualifications,
    fetchCasts,
    fetchPartners,
    fetchDonors,
    fetchStates,
    fetchQuestionSets,
  } = useReferenceData();

  // Additional lists needed by ApplicantModal
  const [stageList, setStageList] = useState<any[]>([]);

  // State for fetched partner and donor names (fallback when backend doesn't provide them)
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [donorName, setDonorName] = useState<string | null>(null);

  // Refs to track previous values and prevent unnecessary API calls
  const prevStateRef = useRef<string | null>(null);
  const prevDistrictRef = useRef<string | null>(null)

  const [openComboboxes, setOpenComboboxes] = useState({
    state: false,
    district: false,
    block: false,
  });

  // ✅ Transform globalStateList to stateList format (MUST be before stateOptions)
  const stateList = useMemo(() => {
    if (!Array.isArray(globalStateList)) return [];
    return globalStateList;
  }, [globalStateList]);

  // Transform props data to the format expected by the component
  const castes = useMemo(() =>
    (castList || []).map((c: any) => ({
      value: c.id?.toString(),
      label: c.cast_name,
    })), [castList]);

  const qualifications = useMemo(() =>
    (qualificationList || []).map((q: any) => ({
      value: q.id?.toString(),
      label: q.qualification_name,
    })), [qualificationList]);

  const currentWorks = useMemo(() =>
    (currentstatusList || []).map((w: any) => ({
      value: w.id?.toString(),
      label: w.current_status_name,
    })), [currentstatusList]);

  const schools = useMemo(() =>
    (schoolList || []).map((c: any) => ({
      value: c.id?.toString(),
      label: c.school_name,
    })), [schoolList]);

  const campus = useMemo(() =>
    (campusList || []).map((c: any) => ({
      value: c.id?.toString(),
      label: c.campus_name,
    })), [campusList]);

  const questionSets = useMemo(() =>
    (questionSetList || []).map((qs: any) => ({
      value: qs.id?.toString(),
      label: qs.name,
    })), [questionSetList]);

  const stages = useMemo(() =>
    (stageList || []).map((s: any) => ({
      id: s.id,
      name: s.stage_name || s.name,
    })), [stageList]);

  const partners = useMemo(() =>
    (partnerList || []).map((p: any) => ({
      value: p.id?.toString(),
      label: p.partner_name,
    })), [partnerList]);

  const donors = useMemo(() =>
    (donorList || []).map((d: any) => ({
      value: d.id?.toString(),
      label: d.donor_name,
    })), [donorList]);

  const stateOptions = useMemo(() => {
    if (!Array.isArray(stateList)) return [];
    return stateList;
  }, [stateList]);

  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Confirmation dialog state for "Offer Sent"
  const [showOfferSentConfirmation, setShowOfferSentConfirmation] = useState(false);
  const [pendingOfferLetterValue, setPendingOfferLetterValue] = useState<string | null>(null);

  // ✅ OPTIMIZATION: Load reference data on-demand (only when user clicks edit on specific field)
  const ensureFieldDataLoaded = useCallback(async (field: string) => {
    switch (field) {
      case 'campus_id':
        if (campusList.length === 0) {
          await fetchCampuses();
        }
        break;
      case 'current_status_id':
        if (currentstatusList.length === 0) {
          await fetchCurrentStatuses();
        }
        break;
      case 'stage_id':
        if (stageList.length === 0) {
          try {
            const stagesData = await getAllStages();
            setStageList(stagesData || []);
          } catch (error) {
            console.error("Failed to fetch stages:", error);
            setStageList([]);
          }
        }
        break;
      case 'cast_id':
        if (castList.length === 0) {
          await fetchCasts();
        }
        break;
      case 'qualification_id':
        if (qualificationList.length === 0) {
          await fetchQualifications();
        }
        break;
      case 'religion_id':
        if (religionList.length === 0) {
          await fetchReligions();
        }
        break;
      case 'partner_id':
        if (partnerList.length === 0) {
          await fetchPartners();
        }
        break;
      case 'donor_id':
        if (donorList.length === 0) {
          await fetchDonors();
        }
        break;
      case 'school_id':
        if (schoolList.length === 0) {
          await fetchSchools();
        }
        break;
      case 'state':
        if (globalStateList.length === 0) {
          await fetchStates();
        }
        break;
      case 'question_set_id':
        if (questionSetList.length === 0) {
          await fetchQuestionSets();
        }
        break;
      default:
        break;
    }
  }, [
    campusList.length,
    currentstatusList.length,
    stageList.length,
    castList.length,
    qualificationList.length,
    religionList.length,
    partnerList.length,
    donorList.length,
    schoolList.length,
    globalStateList.length,
    questionSetList.length,
    fetchCampuses,
    fetchCurrentStatuses,
    fetchCasts,
    fetchQualifications,
    fetchReligions,
    fetchPartners,
    fetchDonors,
    fetchSchools,
    fetchStates,
    fetchQuestionSets,
  ]);

  // Check Google sign-in status
  useEffect(() => {
    const checkSignInStatus = async () => {
      try {
        await initClient();
        const signedIn = await isSignedIn();
        setIsGoogleSignedIn(signedIn);
      } catch (error) {
        console.error("Failed to check Google sign-in status:", error);
        setIsGoogleSignedIn(false);
      }
    };
    checkSignInStatus();
  }, []);

  // Fetch schedule data from API
  const fetchScheduleData = useCallback(async () => {
    if (!currentApplicant?.id) {
      setLiveScheduleData([]);
      return;
    }

    try {
      // Clear old data first to prevent stale data flash
      setLiveScheduleData([]);
      setIsLoadingSchedules(true);
      const scheduleData = await getInterviewByStudentId(currentApplicant.id);
      setLiveScheduleData(scheduleData || []);
    } catch (error) {
      console.error("Failed to fetch schedule data:", error);
      setLiveScheduleData([]);
    } finally {
      setIsLoadingSchedules(false);
    }
  }, [currentApplicant?.id]);

  // Fetch schedule data when modal opens or after scheduling
  useEffect(() => {
    if (isOpen && currentApplicant?.id) {
      fetchScheduleData();
    } else if (!isOpen) {
      // Reset schedule data when modal closes to prevent showing stale data
      setLiveScheduleData([]);
    }
  }, [isOpen, currentApplicant?.id, refreshKey, fetchScheduleData]);

  // ✅ Load QuestionSets API when modal opens
  // Always load if questionSetList is empty, as we may need it for display or editing
  useEffect(() => {
    const loadQuestionSets = async () => {
      if (isOpen && questionSetList.length === 0) {
        try {
          await fetchQuestionSets();
        } catch (error) {
          console.error('❌ Failed to load QuestionSets:', error);
        }
      }
    };
    loadQuestionSets();
  }, [isOpen, questionSetList.length, fetchQuestionSets]);

  // ✅ Load Schools API when modal opens
  // Always load if schools list is empty, as we may need it for display or editing
  useEffect(() => {
    const loadSchools = async () => {
      if (isOpen && schools.length === 0) {
        try {
          await fetchSchools();
        } catch (error) {
          console.error('❌ Failed to load Schools:', error);
        }
      }
    };
    loadSchools();
  }, [isOpen, schools.length, fetchSchools]);

  // Fetch available slots when schedule modal opens
  const fetchAvailableSlots = useCallback(async (roundType: "LR" | "CFR") => {
    try {
      setSchedulingInProgress(true);
      
      // // Check user role to determine which slots to fetch
      // const userStr = localStorage.getItem("user");
      // const user = userStr ? JSON.parse(userStr) : null;
      // const userRole = user?.role_name || null;
      
      // // Check if user is Admin or Owner (both should have admin privileges)
      // const isAdmin = userRole === "ADMIN" || userRole === "Admin";

      let slots = [];
      // if (isAdmin) {
        // Admin can see ALL available (unbooked) slots from all users
        const response = await getAllSlots({ slot_type: roundType, pageSize: 1000 });
        const allSlots = response.data || [];
        
        // Filter to show only available slots with future dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        slots = allSlots.filter((slot: any) => {
          const slotDate = new Date(slot.date);
          slotDate.setHours(0, 0, 0, 0);
          return slot.status === "Available" && slotDate >= today;
        });
      // } else {
      //   // Regular users see only their own available (unbooked) slots
      //   const allSlots = await getMyAvailableSlots();
        
      //   // Filter for matching slot type and future dates
      //   const today = new Date();
      //   today.setHours(0, 0, 0, 0);
        
      //   slots = allSlots.filter((slot: any) => {
      //     const slotDate = new Date(slot.date);
      //     slotDate.setHours(0, 0, 0, 0);
      //     return slot.slot_type === roundType && 
      //            slot.status === "Available" && 
      //            slotDate >= today;
      //   });
      // }
      
      setAvailableSlots(slots);
    } catch (error) {
      console.error("Failed to fetch available slots:", error);
      toast({
        title: "Error",
        description: "Failed to load available slots",
        variant: "destructive",
      });
      setAvailableSlots([]);
    } finally {
      setSchedulingInProgress(false);
    }
  }, [toast]);

  // Handle opening schedule modal
  const handleOpenScheduleModal = useCallback(async (roundType: "LR" | "CFR") => {
    setScheduleRoundType(roundType);
    setIsScheduleModalOpen(true);
    await fetchAvailableSlots(roundType);
  }, [fetchAvailableSlots, currentApplicant]);

  // Handle schedule interview with Google Calendar integration
  const handleScheduleInterview = useCallback(async (
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
  ) => {
    if (!currentApplicant) return;

    try {
      setSchedulingInProgress(true);

      // Check Google sign-in status
      if (!isGoogleSignedIn) {
        const signInSuccess = await signIn();
        if (!signInSuccess) {
          toast({
            title: "Google Sign-in Required",
            description: "Please sign in to Google to create calendar events",
            variant: "destructive",
          });
          return;
        }
        setIsGoogleSignedIn(true);
      }

      // Create Google Calendar event
      const eventTitle = `${topicName || scheduleRoundType} - Interview`;
      const eventDescription = `Interview for ${studentName}
Round: ${scheduleRoundType === "LR" ? "Learning Round" : "Cultural Fit Round"}
Student ID: ${studentId}
Topic: ${topicName}
Interviewer: ${interviewerName}`;

      const startDateTime = formatDateTimeForCalendar(date, startTime);
      const endDateTime = formatDateTimeForCalendar(date, endTime);

      // If rescheduling, delete the old calendar event first
      if (rescheduleData && rescheduleData.googleEventId) {
        try {
          await deleteCalendarEvent(rescheduleData.googleEventId);
        } catch (error) {
          console.error("Error deleting old calendar event:", error);
          // Show warning but continue with rescheduling
          toast({
            title: "Warning",
            description: "Could not remove old calendar event. Creating new event...",
            variant: "default",
          });
        }
      }

      const calendarEvent = await createCalendarEvent({
        summary: eventTitle,
        description: eventDescription,
        startDateTime,
        endDateTime,
        attendeeEmail: studentEmail || currentApplicant.email || "",
        studentName: studentName || `${currentApplicant.first_name} ${currentApplicant.last_name}`,
        attendees: [adminEmail, studentEmail, interviewerEmail].filter(Boolean),
      });

      if (!calendarEvent || !calendarEvent.success) {
        throw new Error("Failed to create calendar event");
      }

      // Check if this is a reschedule or new schedule
      if (rescheduleData) {
        // Reschedule existing interview
        await updateScheduledInterview(rescheduleData.scheduleId, {
          slot_id: slotId,
          title: eventTitle,
          description: eventDescription,
          meeting_link: calendarEvent.meetLink || "",
          google_event_id: calendarEvent.eventId,
        });

        toast({
          title: "Interview Rescheduled",
          description: `${scheduleRoundType} interview rescheduled successfully`,
        });
      } else {
        // Schedule new interview
        await scheduleInterview({
          slot_id: slotId,
          student_id: studentId,
          title: eventTitle,
          description: eventDescription,
          meeting_link: calendarEvent.meetLink || "",
          google_event_id: calendarEvent.eventId,
          created_by: "Admin" as const,
        });

        toast({
          title: "Interview Scheduled",
          description: `${scheduleRoundType} interview scheduled successfully`,
        });
      }

      // Close modal and refresh schedule data
      setIsScheduleModalOpen(false);
      setRescheduleData(null); // Clear reschedule data
      setRefreshKey(prev => prev + 1);
      
      // Fetch fresh schedule data
      await fetchScheduleData();
    } catch (error) {
      console.error("Failed to schedule interview:", error);
      toast({
        title: "Error",
        description: rescheduleData ? "Failed to reschedule interview" : "Failed to schedule interview",
        variant: "destructive",
      });
    } finally {
      setSchedulingInProgress(false);
    }
  }, [currentApplicant, scheduleRoundType, isGoogleSignedIn, toast, fetchScheduleData, rescheduleData]);

  // Handle cancel schedule
  const handleCancelSchedule = useCallback(async (scheduleId: number) => {
    try {
      // Find the schedule to get google_event_id
      const scheduleToCancel = liveScheduleData.find(
        (s) => s.id === scheduleId || s.schedule_id === scheduleId
      );

      // Check Google sign-in status
      if (!isGoogleSignedIn) {
        const signInSuccess = await signIn();
        if (!signInSuccess) {
          toast({
            title: "Google Sign-in Required",
            description: "Please sign in to Google to remove calendar event",
            variant: "destructive",
          });
          return;
        }
        setIsGoogleSignedIn(true);
      }

      // Delete the calendar event first if google_event_id exists
      if (scheduleToCancel?.google_event_id) {
        try {
          await deleteCalendarEvent(scheduleToCancel.google_event_id);
        } catch (error) {
          console.error("Error deleting calendar event:", error);
          // Show warning but continue with cancellation
          toast({
            title: "⚠️ Warning",
            description: "Could not remove calendar event, but will cancel the interview.",
            variant: "default",
            className: "border-orange-500 bg-orange-50 text-orange-900",
          });
        }
      }

      // Cancel the interview in the backend
      await cancelScheduledInterview(scheduleId, "Cancelled by admin");
      
      toast({
        title: "✅ Interview Cancelled",
        description: "The interview has been successfully cancelled and removed from calendar.",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });

      // Refresh data
      setRefreshKey(prev => prev + 1);
      await fetchScheduleData();
    } catch (error) {
      console.error("Failed to cancel interview:", error);
      toast({
        title: "❌ Failed to Cancel",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
      });
    }
  }, [toast, fetchScheduleData, liveScheduleData, isGoogleSignedIn]);

  // Handle reschedule click - open schedule modal with reschedule data
  const handleRescheduleClick = useCallback((scheduleId: number) => {
    // Find the schedule details from liveScheduleData
    const scheduleToReschedule = liveScheduleData.find(
      (s) => s.id === scheduleId || s.schedule_id === scheduleId
    );
    
    if (!scheduleToReschedule) {
      toast({
        title: "Error",
        description: "Schedule not found",
        variant: "destructive",
      });
      return;
    }

    // Determine round type from interviewDetailsRoundType (current round being viewed)
    const roundType = interviewDetailsRoundType;
    
    if (!roundType) {
      toast({
        title: "Error",
        description: "Round type not specified",
        variant: "destructive",
      });
      return;
    }

    // Set reschedule data with google_event_id for calendar deletion
    setRescheduleData({
      scheduleId: scheduleToReschedule.id || scheduleId,
      roundType,
      googleEventId: scheduleToReschedule.google_event_id,
      oldSlotId: scheduleToReschedule.slot_id,
    });
    setScheduleRoundType(roundType);
    setShowInterviewDetailsModal(false);
    
    // Fetch available slots and open schedule modal
    fetchAvailableSlots(roundType).then(() => {
      setIsScheduleModalOpen(true);
    });
  }, [toast, liveScheduleData, interviewDetailsRoundType, fetchAvailableSlots]);

  // Handle opening interview details modal
  const handleOpenInterviewDetails = useCallback((roundType: "LR" | "CFR") => {
    setInterviewDetailsRoundType(roundType);
    setShowInterviewDetailsModal(true);
  }, []);

  // Helper function to check if student has passed a specific round
  const hasPassedRound = useCallback((applicant: any, roundType: "LR" | "CFR"): boolean => {
    if (!applicant) return false;
    
    if (roundType === "LR") {
      // Check if any learning round has "pass" status
      return applicant.interview_learner_round?.some((round: any) => 
        round.learning_round_status?.toLowerCase().includes("pass")
      ) || false;
    } else if (roundType === "CFR") {
      // Check if any cultural fit round has "pass" status
      return applicant.interview_cultural_fit_round?.some((round: any) => 
        round.cultural_fit_round_status?.toLowerCase().includes("pass")
      ) || false;
    }
    
    return false;
  }, []);

  // Handle schedule new from interview details modal
  const handleScheduleNewFromDetails = useCallback(() => {
    setShowInterviewDetailsModal(false);
    // The roundType is already set from when we opened the details modal
    if (interviewDetailsRoundType) {
      handleOpenScheduleModal(interviewDetailsRoundType);
    }
  }, [interviewDetailsRoundType, handleOpenScheduleModal]);

  const format = (date: Date, formatStr: string) => {
    if (formatStr === "PPP") {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    if (formatStr === "yyyy-MM-dd") {
      return date.toISOString().split("T")[0];
    }
    return date.toLocaleDateString();
  };

  // Helper to convert state name to state code (if needed)
  const getStateCodeFromNameOrCode = (value: string) => {
    if (!value) return null;

    // Try to find by matching the code first (exact match)
    const byCode = stateOptions.find((opt) => opt.value === value);
    if (byCode) return value;

    // Try to find the state_code by matching the name (case-insensitive)
    const byName = stateOptions.find(
      (opt) => opt.label.toUpperCase() === value.toUpperCase()
    );

    return byName ? byName.value : value;
  };

  // Helper to convert district name to district code (if needed)
  const getDistrictCodeFromNameOrCode = (value: string) => {
    if (!value) return null;

    // Try to find by matching the code first (exact match)
    const byCode = districtOptions.find((opt) => opt.value === value);
    if (byCode) return value;

    // Try to find the district_code by matching the name (case-insensitive)
    const byName = districtOptions.find(
      (opt) => opt.label.toUpperCase() === value.toUpperCase()
    );

    return byName ? byName.value : value;
  };

  // Initialize selected state and district from applicant data
  // Wait for states to be loaded before trying to set selectedState
  useEffect(() => {
    if (applicant?.id && stateList.length > 0) {
      // Clear schedule data immediately when applicant changes
      setLiveScheduleData([]);
      setCurrentApplicant(applicant);
      if (applicant.state) {
        const stateCode = getStateCodeFromNameOrCode(applicant.state);
        if (stateCode) {
          setSelectedState(stateCode);
        }
      }
    }
  }, [applicant?.id, stateList.length]);

  // Initialize district after districts are loaded
  useEffect(() => {
    if (applicant?.district && districtOptions.length > 0 && !selectedDistrict) {
      const districtCode = getDistrictCodeFromNameOrCode(applicant.district);
      if (districtCode) {
        setSelectedDistrict(districtCode);
      }
    }
  }, [applicant?.district, districtOptions.length]);

  // Fetch student data on modal open
  useEffect(() => {
    if (isOpen && applicant?.id) {
      const fetchStudent = async () => {
        try {
          const response = await getStudentById(applicant.id);
          let updated: any = response;
          if (response && typeof response === "object" && "data" in response) {
            updated = (response as any).data;
          }
          if (updated?.id) {
            setCurrentApplicant(updated);

            // Only set state if stateList is already loaded
            if (updated.state && stateList.length > 0) {
              const stateCode = getStateCodeFromNameOrCode(updated.state);
              if (stateCode) {
                setSelectedState(stateCode);
              }
            }

            // District will be set after districts are loaded
          } else {
            // console.error("Invalid response - no ID found:", response);
          }
        } catch (err) {
          // console.error("Failed to fetch student data", err);
        }
      };
      fetchStudent();
    }
  }, [isOpen, applicant?.id, refreshKey, stateList.length]);

  // Fetch partner name by ID if not provided in the applicant data
  useEffect(() => {
    const fetchPartnerName = async () => {
      // Only fetch if partner_id exists but partner_name is not provided
      if (currentApplicant?.partner_id && !currentApplicant?.partner_name) {
        try {
          const response = await getPartnerById(currentApplicant.partner_id);
          if (response?.data?.partner_name) {
            setPartnerName(response.data.partner_name);
          }
        } catch (err) {
          console.error("Failed to fetch partner name", err);
        }
      } else {
        setPartnerName(null);
      }
    };
    fetchPartnerName();
  }, [currentApplicant?.partner_id, currentApplicant?.partner_name]);

  // Fetch donor name by ID if not provided in the applicant data
  useEffect(() => {
    const fetchDonorName = async () => {
      // Only fetch if donor_id exists but donor_name is not provided
      if (currentApplicant?.donor_id && !currentApplicant?.donor_name) {
        try {
          const response = await getDonorById(currentApplicant.donor_id);
          if (response?.data?.donor_name) {
            setDonorName(response.data.donor_name);
          }
        } catch (err) {
          console.error("Failed to fetch donor name", err);
        }
      } else {
        setDonorName(null);
      }
    };
    fetchDonorName();
  }, [currentApplicant?.donor_id, currentApplicant?.donor_name]);

  // Set joining date from current applicant
  // useEffect(() => {
  //   if (currentApplicant?.joining_date) {
  //     setJoiningDate(currentApplicant.joining_date.split("T")[0]);
  //   }
  // }, [currentApplicant?.joining_date]);

  // Fix: Load joining date from nested final_decisions if available
  useEffect(() => {
    const jd =
      currentApplicant?.final_decisions?.[0]?.joining_date ||
      currentApplicant?.joining_date ||
      "";
    setJoiningDate(jd ? jd.split("T")[0] : "");
  }, [currentApplicant]);

  // Fetch districts when state changes
  useEffect(() => {
    if (!selectedState) {
      setDistrictOptions([]);
      setBlockOptions([]);
      prevStateRef.current = null;
      return;
    }

    // Skip if state hasn't actually changed (prevents duplicate calls)
    if (prevStateRef.current === selectedState) {
      return;
    }
    prevStateRef.current = selectedState;

    const fetchDistricts = async () => {
      setIsLoadingDistricts(true);
      try {
        const districtsRes = await getDistrictsByState(selectedState);
        const districts = districtsRes?.data || districtsRes || [];
        const mappedDistricts = districts.map((d: any) => ({
          value: d.district_code,
          label: d.district_name,
        }));
        setDistrictOptions(mappedDistricts);
      } catch (err) {
        // console.error("Failed to fetch districts:", err);
        setDistrictOptions([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [selectedState]);

  // Fetch blocks when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setBlockOptions([]);
      prevDistrictRef.current = null;
      return;
    }

    // Skip if district hasn't actually changed (prevents duplicate calls)
    if (prevDistrictRef.current === selectedDistrict) {
      return;
    }
    prevDistrictRef.current = selectedDistrict;

    const fetchBlocks = async () => {
      setIsLoadingBlocks(true);
      try {
        const blocksRes = await getBlocksByDistrict(selectedDistrict);
        const blocks = blocksRes?.data || blocksRes || [];

        // Use id as value and block_name as label
        const mappedBlocks = blocks.map((b: any) => ({
          value: String(b.id), // Use id as value since block_code is not available
          label: b.block_name, // Use block_name for display
        }));

        setBlockOptions(mappedBlocks);
      } catch (err) {
        // console.error("Failed to fetch blocks:", err);
        setBlockOptions([]);
      } finally {
        setIsLoadingBlocks(false);
      }
    };

    fetchBlocks();
  }, [selectedDistrict]);

  // Handler for "Offer Sent" confirmation
  const handleOfferLetterStatusChange = async (value: any) => {
    // Get current offer letter status
    const currentOfferStatus = currentApplicant.final_decisions?.[0]?.offer_letter_status;

    if (!currentApplicant.campus_id) {
      toast({
        title: "⚠️ Campus Required",
        description: "Please select a campus before proceeding with the offer letter status.",
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    // Prevent changing back to "Offer Pending" if already sent or beyond
    if (value === "Offer Pending" && currentOfferStatus && currentOfferStatus !== "Offer Pending") {
      toast({
        title: "❌ Action Not Allowed",
        description: `Cannot change status back to "Offer Pending" from "${currentOfferStatus}". Once an offer has progressed beyond pending status, it cannot be reverted to pending.`,
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
        duration: 6000,
      });
      return; // Don't proceed with the update
    }

    if (value === "Offer Sent") {
      // Prevent sending offer again if already sent
      if (currentOfferStatus === "Offer Sent") {
        toast({
          title: "ℹ️ Already Sent",
          description: "Offer letter has already been sent to this student. No need to send again.",
          variant: "default",
          className: "border-blue-500 bg-blue-50 text-blue-900",
          duration: 4000,
        });
        return;
      }

      // Show confirmation dialog before proceeding
      setPendingOfferLetterValue(value);
      setShowOfferSentConfirmation(true);
      return;
    }
    // For other values, proceed directly
    await handleFinalDecisionUpdate("offer_letter_status", value);
  };

  // Confirm "Offer Sent" selection
  const confirmOfferSent = async () => {
    if (pendingOfferLetterValue) {
      await handleFinalDecisionUpdate("offer_letter_status", pendingOfferLetterValue);
    }
    setShowOfferSentConfirmation(false);
    setPendingOfferLetterValue(null);
  };

  // Cancel "Offer Sent" selection
  const cancelOfferSent = () => {
    setShowOfferSentConfirmation(false);
    setPendingOfferLetterValue(null);
  };

  const handleFinalDecisionUpdate = async (field: string, value: any) => {
    if (!currentApplicant?.id) return;
    try {
      // Use existing local state instead of fetching again
      const existingDecision = currentApplicant?.final_decisions?.[0] || {};

      // Get the current joining_date - prioritize the state value
      let currentJoiningDate = joiningDate;
      if (!currentJoiningDate && existingDecision.joining_date) {
        currentJoiningDate = existingDecision.joining_date.split("T")[0];
      }

      // Create payload with ALL existing values preserved
      const payload: Record<string, any> = {
        student_id: currentApplicant.id,
        id: existingDecision.id,
        // Preserve ALL existing values
        offer_letter_status: existingDecision.offer_letter_status ?? null,
        onboarded_status: existingDecision.onboarded_status ?? null,
        final_notes: existingDecision.final_notes ?? null,
        joining_date: currentJoiningDate || null,
        stage_id: existingDecision.stage_id ?? null,
      };

      // Override with the new value being updated
      if (field === "joining_date") {
        payload.joining_date = value !== "" ? value : null;
      } else {
        payload[field] = value;
      }

      // Determine stage_id based on offer_letter_status and onboarded_status
      const offerLetterStatus = payload.offer_letter_status;
      const onboardedStatus = payload.onboarded_status;

      // Find stage IDs by name
      const finalDecisionStage = stages.find(
        (s) => s.name === "Final Decision"
      );
      const onboardedStage = stages.find((s) => s.name === "Onboarded");

      let newStageId = payload.stage_id; // Keep existing stage by default

      if (offerLetterStatus != null && onboardedStatus != null) {
        // Both offer letter and onboarded exist -> stage 5 (Onboarded)
        newStageId = onboardedStage?.id || 5;
      } else if (offerLetterStatus != null && onboardedStatus == null) {
        // Only offer letter exists -> stage 4 (Final Decision)
        newStageId = finalDecisionStage?.id || 4;
      } else if (onboardedStatus != null) {
        // Only onboarded exists -> stage 5 (Onboarded)
        newStageId = onboardedStage?.id || 5;
      }
      // else: keep existing stage (newStageId remains payload.stage_id)

      payload.stage_id = newStageId;

      await submitFinalDecision(payload);

      // Update local state immediately - no need for extra API call
      setCurrentApplicant((prev) => ({
        ...prev,
        final_decisions: [
          {
            ...existingDecision,
            [field]: value,
            joining_date: field === "joining_date" ? value : currentJoiningDate,
            stage_id: newStageId,
          },
        ],
      }));

      // Also update joiningDate state if that's what was changed
      if (field === "joining_date") {
        setJoiningDate(value);
      }

      toast({
        title: "Success",
        description: "Final decision updated successfully.",
        variant: "default",
        className: "border-green-400 bg-green-50 text-green-900",
      });
    } catch (err) {
      console.error("Failed to update final decision", err);
      toast({
        title: "❌ Unable to Update Final Decision",
        description: getFriendlyErrorMessage(err),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  // const handleCommentsClick = () => {
  //   setShowCommentsModal(true);
  // };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleUpdate = async () => {
    if (!currentApplicant?.id) return;
    try {
      const response = await getStudentById(currentApplicant.id);

      let updated: any = response;
      if (response && typeof response === "object" && "data" in response) {
        updated = (response as any).data;
      }

      if (updated?.id) {
        setCurrentApplicant(updated);
      } else {
        // console.error("Invalid response - no ID found:", response);
      }
    } catch (err) {
      // console.error("Failed to refresh applicant", err);
    }
  };

  const handleTransitions = async () => {
    setShowTransitionsModal(true);
  };

  const getLabel = (
    options: { value: string; label: string }[],
    id: any,
    defaultLabel = "",
    nameField?: string
  ) => {
    // ✅ OPTIMIZATION: First try to get name from currentApplicant data (backend provides it)
    if (nameField && currentApplicant[nameField]) {
      return currentApplicant[nameField];
    }

    // If no id provided, return default
    if (!id) return defaultLabel;

    // Try to find matching option (only if options are loaded)
    if (options && options.length > 0) {
      const matchedOption = options.find((o) => o.value === id?.toString());
      if (matchedOption?.label) return matchedOption.label;
    }

    // Otherwise return the id itself as fallback
    return id?.toString() || defaultLabel;
  };

  // Helper to convert name back to code (for dropdown value matching)
  const getCode = (options: Array<{ value: string; label: string }>, name: string | null | undefined): string | null => {
    if (!name) return null;
    if (!Array.isArray(options) || options.length === 0) return null;
    const matchedOption = options.find((o) => o.label === name);
    return matchedOption?.value || null;
  };

  const handleStateChange = async (value: string) => {
    setSelectedState(value);
    setSelectedDistrict(null);
    setDistrictOptions([]);
    setBlockOptions([]);

    // Convert state code to name before sending to API
    const stateName = stateOptions.find((opt) => opt.value === value)?.label || value;

    if (currentApplicant?.id) {
      await updateStudent(currentApplicant.id, {
        state: stateName,  // Send NAME to API (e.g., "Tripura")
        district: null,
        block: null
      });
    }

    await handleUpdate();
  };

  const handleDistrictChange = async (value: string) => {
    setSelectedDistrict(value);
    setBlockOptions([]);

    // Convert district code to name before sending to API
    const districtName = districtOptions.find((opt) => opt.value === value)?.label || value;

    if (currentApplicant?.id) {
      await updateStudent(currentApplicant.id, {
        district: districtName,  // Send NAME to API (e.g., "North District")
        block: null
      });
    }

    await handleUpdate();
  };

  const handleBlockChange = async (value: string) => {
    if (!currentApplicant?.id) return;

    try {
      // Convert block id to name before sending to API
      const blockName = blockOptions.find((opt) => opt.value === value)?.label || value;

      await updateStudent(currentApplicant.id, {
        block: blockName  // Send NAME to API (e.g., "Block A")
      });

      // Refresh applicant data
      await handleUpdate();

      toast({
        title: "✅ Block Updated",
        description: "Block has been updated successfully",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } catch (error) {
      console.error("Failed to update block:", error);
      toast({
        title: "❌ Unable to Update Block",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  const examSession = currentApplicant?.exam_sessions?.[0] ?? null;

  // Logic to determine if screening is passed (needed before screeningFields definition)
  const isScreeningPassed = (currentApplicant?.exam_sessions || []).some((session: any) => {
    const status = session?.status || "";
    return (
      status.toLowerCase().includes("pass") ||
      status === "Created Student Without Exam"
    );
  });

  const screeningFields = [
    {
      name: "status",
      label: "Status",
      type: "select" as const,
      disabled: isScreeningPassed,
      options: [
        { value: "Screening Test Pass", label: "Screening Test Pass" },
        { value: "Screening Test Fail", label: "Screening Test Fail" },
        // {
        //   value: "Created Student Without Exam",
        //   label: "Created Student Without Exam",
        // },
      ],
    },
    {
      name: "question_set_id",
      label: "Set Name *",
      type: "component" as const,
      component: ({ row, updateRow, disabled }: any) => {
        // Read-only mode (no updateRow passed)
        if (!updateRow) {
          const rowId = row?.question_set_id?.toString();
          
          // Try to find set name from questionSets list by ID
          const set = questionSets.find(s => s.value === rowId);
          
          if (set) {
            return (
              <span className="text-gray-900" title={set.label}>
                {set.label}
              </span>
            );
          }
          // If set_name field exists in row, use it
          if (row?.set_name && row.set_name.trim() !== "") {
            return (
              <span className="text-gray-900" title={row.set_name}>
                {row.set_name}
              </span>
            );
          }
          // Fallback: show ID or dash
          return <span className="text-gray-500">{rowId || "—"}</span>;
        }
        
        // Edit mode: Show dropdown
        return (
          <select
            value={row?.question_set_id || ""}
            onChange={(e) => updateRow("question_set_id", e.target.value)}
            className={`border p-1 rounded w-full ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            disabled={!!disabled}
          >
            <option value="">Select Set</option>
            {questionSets.map((set) => (
              <option key={set.value} value={set.value}>
                {set.label}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      name: "obtained_marks",
      label: "Obtained Marks * (Max: 36)",
      type: "component" as const,
      component: ({ row, updateRow, disabled }: any) => {
        const maxMarks = 36;
        
        // Read-only mode (no updateRow passed)
        if (!updateRow) {
          return (
            <span className="text-gray-900">
              {row?.obtained_marks !== null && row?.obtained_marks !== undefined 
                ? row.obtained_marks 
                : "—"}
            </span>
          );
        }
        
        // Edit mode: Show input
        return (
          <div className="w-full">
            <input
              type="number"
              value={row?.obtained_marks || ""}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = Number(value);

                // Only allow if value is empty, or within valid range (0 to maxMarks)
                if (value === "" || (numValue >= 0 && numValue <= maxMarks)) {
                  updateRow("obtained_marks", value);
                }
                // If value exceeds max, don't update (block the input)
              }}
              className={`border p-1 rounded w-full ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={!!disabled}
              min="0"
              max={maxMarks}
              placeholder="0-36"
            />
          </div>
        );
      },
    },
    {
      name: "school_id",
      label: "Qualifying School",
      type: "component" as const,
      component: ({ row, updateRow, disabled }: any) => {
        // Read-only mode (no updateRow passed)
        if (!updateRow) {
          // Try to find school name from schools list by ID
          const school = schools.find(s => s.value === row?.school_id?.toString());
          if (school) {
            return (
              <span className="text-gray-900" title={school.label}>
                {school.label}
              </span>
            );
          }
          // If school_name field exists in row, use it
          if (row?.school_name && row.school_name.trim() !== "") {
            return (
              <span className="text-gray-900" title={row.school_name}>
                {row.school_name}
              </span>
            );
          }
          // Fallback: show ID or dash
          return <span className="text-gray-500">{row?.school_id || "—"}</span>;
        }
        
        // Edit mode: Show dropdown
        return (
          <select
            value={row?.school_id || ""}
            onChange={(e) => updateRow("school_id", e.target.value)}
            className={`border p-1 rounded w-full ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            disabled={!!disabled}
          >
            <option value="">Select School</option>
            {schools.map((school) => (
              <option key={school.value} value={school.value}>
                {school.label}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      name: "exam_centre",
      label: "Exam Centre *",
      type: "readonly" as const,
    },
    {
      name: "date_of_test",
      label: "Date of Testing *",
      type: "component" as const,
      component: ({ row, updateRow, disabled }: any) => {
        // Read-only mode (no updateRow passed)
        if (!updateRow) {
          return (
            <span className="text-gray-900">
              {row?.date_of_test || "—"}
            </span>
          );
        }
        
        // Edit mode: Show date input
        const today = new Date().toISOString().split('T')[0];
        return (
          <input
            type="date"
            value={row?.date_of_test || ""}
            onChange={(e) => updateRow("date_of_test", e.target.value)}
            className="border p-1 rounded w-full"
            disabled={!!disabled}
            max={today}
          />
        );
      },
    },
    {
      name: "audit_info",
      label: "Audit Info",
      type: "readonly" as const,
    },
  ];

  const initialScreeningData = useMemo(
    () =>
      currentApplicant?.exam_sessions?.map((session) => ({
        id: session.id,
        status: session.status ?? currentApplicant.status ?? "",
        question_set_id: session.question_set_id?.toString() || "",
        set_name: session.set_name || "", // ✅ Include set_name if available
        obtained_marks:
          session.obtained_marks !== null && session.obtained_marks !== undefined
            ? session.obtained_marks.toString()
            : "",
        school_id:
          session.school_id !== null && session.school_id !== undefined
            ? session.school_id.toString()
            : "",
        school_name: session.school_name || "", // ✅ Include school_name if available
        exam_centre: session.exam_centre || "",
        date_of_test: session.date_of_test?.split("T")[0] || "",
        audit_info: {
          created_at: session.created_at || "",
          updated_at: session.updated_at || "",
          last_updated_by: session.last_updated_by || "",
        },
      })) || [],
    [currentApplicant]
  );

  // Map learning round data with audit info and schedule info from API
  const initialLearningData = useMemo(
    () => {
      const learningRounds = currentApplicant?.interview_learner_round || [];
      
      // Get schedule info for learning round from live API data - ONLY LR schedules
      const schedules = liveScheduleData
        .filter((schedule: any) => 
          schedule.slot_type === "LR" || 
          (schedule.slot_details && schedule.slot_details.slot_type === "LR")
        )
        .sort((a: any, b: any) => {
          // Sort by date and time (oldest first, most recent last)
          const dateA = new Date(`${a.date} ${a.start_time}`);
          const dateB = new Date(`${b.date} ${b.start_time}`);
          return dateA.getTime() - dateB.getTime();
        });

      // If no learning rounds exist but schedules do, create placeholder rows (one per schedule)
      if (learningRounds.length === 0 && schedules.length > 0) {
        return schedules.map((schedule: any) => ({
          id: null, // No ID means it's a placeholder
          learning_round_status: "",
          comments: "",
          schedule_info: [schedule], // Pass single schedule as array
          audit_info: {
            created_at: "",
            updated_at: "",
            last_updated_by: "",
          },
        }));
      }

      // Map existing learning rounds with schedule info - ONE schedule per row
      // Match schedules to rows chronologically (oldest schedule to oldest feedback)
      return learningRounds.map((round: any, index: number) => {
        // Each row gets its corresponding schedule (if available)
        const scheduleForThisRow = index < schedules.length ? [schedules[index]] : "—";
        
        return {
          ...round,
          schedule_info: scheduleForThisRow,
          audit_info: {
            created_at: round.created_at || "",
            updated_at: round.updated_at || "",
            last_updated_by: round.last_updated_by || "",
          },
        };
      });
    },
    [currentApplicant, liveScheduleData]
  );

  // Map cultural fit round data with audit info and schedule info from API
  const initialCulturalData = useMemo(
    () => {
      const culturalRounds = currentApplicant?.interview_cultural_fit_round || [];
      
      // Get schedule info for cultural fit round from live API data - ONLY CFR schedules
      const schedules = liveScheduleData
        .filter((schedule: any) => 
          schedule.slot_type === "CFR" || 
          (schedule.slot_details && schedule.slot_details.slot_type === "CFR")
        )
        .sort((a: any, b: any) => {
          // Sort by date and time (oldest first, most recent last)
          const dateA = new Date(`${a.date} ${a.start_time}`);
          const dateB = new Date(`${b.date} ${b.start_time}`);
          return dateA.getTime() - dateB.getTime();
        });

      // If no cultural fit rounds exist but schedules do, create placeholder rows (one per schedule)
      if (culturalRounds.length === 0 && schedules.length > 0) {
        return schedules.map((schedule: any) => ({
          id: null, // No ID means it's a placeholder
          cultural_fit_status: "",
          comments: "",
          schedule_info: [schedule], // Pass single schedule as array
          audit_info: {
            created_at: "",
            updated_at: "",
            last_updated_by: "",
          },
        }));
      }

      // Map existing cultural fit rounds with schedule info - ONE schedule per row
      // Match schedules to rows chronologically (oldest schedule to oldest feedback)
      return culturalRounds.map((round: any, index: number) => {
        // Each row gets its corresponding schedule (if available)
        const scheduleForThisRow = index < schedules.length ? [schedules[index]] : "—";
        
        return {
          ...round,
          schedule_info: scheduleForThisRow,
          audit_info: {
            created_at: round.created_at || "",
            updated_at: round.updated_at || "",
            last_updated_by: round.last_updated_by || "",
          },
        };
      });
    },
    [currentApplicant, liveScheduleData]
  );

  // Early return AFTER all hooks
  if (!applicant || !currentApplicant) return null;

  const screeningSubmit =
    API_MAP?.screening?.submit ??
    (async (payload: any) => {
      // console.error("API_MAP.screening.submit is not available", payload);
      throw new Error("screening submit API not available");
    });

  const screeningUpdate =
    API_MAP?.screening?.update ??
    (async (id: any, payload: any) => {
      // console.error("API_MAP.screening.update is not available", id, payload);
      throw new Error("screening update API not available");
    });

  const isStageDisabled = (applicant: any, stage: string) => {
    // Reuse isScreeningPassed logic - already defined earlier
    const screeningPassed = isScreeningPassed;

    // Check if learning round passed (check all rounds)
    const learnerRounds = applicant?.interview_learner_round || [];
    const learningPassed = learnerRounds.some((round: any) => {
      const status = round?.learning_round_status || "";
      return status.toLowerCase().includes("pass");
    });

    // Check if CFR passed (check all rounds)
    const cfrRounds = applicant?.interview_cultural_fit_round || [];
    const cfrPassed = cfrRounds.some((round: any) => {
      const status = round?.cultural_fit_status || "";
      return status.toLowerCase().includes("pass");
    });

    if (stage === "LR") {
      // Learning Round is disabled if Screening did NOT pass
      return !screeningPassed;
    }

    if (stage === "CFR") {
      // CFR is disabled if Screening did NOT pass OR Learning Round did NOT pass
      return !screeningPassed || !learningPassed;
    }

    if (stage === "OFFER") {
      // Offer Letter is disabled if any of the stages did NOT pass
      return !screeningPassed || !learningPassed || !cfrPassed;
    }

    return false;
  };

  // Logic to determine if learning and cultural rounds are passed (to disable editing)
  const isLearningPassed = (currentApplicant?.interview_learner_round || []).some((round: any) => {
    const status = round?.learning_round_status || "";
    return status.toLowerCase().includes("pass");
  });

  const isCulturalPassed = (currentApplicant?.interview_cultural_fit_round || []).some((round: any) => {
    const status = round?.cultural_fit_status || "";
    return status.toLowerCase().includes("pass");
  });

  // Check if student has started next rounds (to disable deletion of previous rounds)
  const hasLearningRoundData = (currentApplicant?.interview_learner_round || []).length > 0;
  const hasCulturalRoundData = (currentApplicant?.interview_cultural_fit_round || []).length > 0;
  const hasOfferData = !!currentApplicant?.campus_id || (currentApplicant?.final_decisions || []).length > 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <DialogTitle className="text-lg sm:text-xl">Applicant Details</DialogTitle>
            <div className="flex items-center gap-2 mr-8">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTransitions}
                className="flex items-center gap-2"
              >
                Transitions
              </Button>
              {/* <Button
                variant="outline"
                size="sm"
                onClick={handleCommentsClick}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Comments
              </Button> */}
              {/* <Button
                variant="outline"
                size="sm"
                onClick={handleEditClick}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Details
              </Button> */}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    First Name
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="first_name"
                    displayValue={
                      currentApplicant?.first_name || ""
                    }
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Middle Name
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="middle_name"
                    displayValue={
                      currentApplicant?.middle_name || ""
                    }
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Name
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="last_name"
                    displayValue={currentApplicant?.last_name || ""}
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="email"
                    displayValue={currentApplicant.email || ""}
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Mobile Number
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="phone_number"
                    displayValue={currentApplicant.phone_number}
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    WhatsApp Number
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="whatsapp_number"
                    displayValue={
                      currentApplicant.whatsapp_number || ""
                    }
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Gender
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="gender"
                    displayValue={currentApplicant.gender || ""}
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "other", label: "Other" },
                    ]}
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Cast
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="cast_id"
                    value={currentApplicant.cast_id}
                    displayValue={getLabel(castes, currentApplicant.cast_id, "", "cast_name")}
                    onUpdate={handleUpdate}
                    options={castes}
                    onEditStart={() => ensureFieldDataLoaded('cast_id')}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Qualification
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="qualification_id"
                    value={currentApplicant.qualification_id}
                    displayValue={getLabel(
                      qualifications,
                      currentApplicant.qualification_id,
                      "",
                      "qualification_name"
                    )}
                    onUpdate={handleUpdate}
                    options={qualifications}
                    onEditStart={() => ensureFieldDataLoaded('qualification_id')}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Current Work
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="current_status_id"
                    displayValue={
                      currentWorks.find(
                        (w) =>
                          w.value ===
                          currentApplicant.current_status_id?.toString()
                      )?.label || currentApplicant.current_status_name || ""
                    }
                    onUpdate={handleUpdate}
                    options={currentWorks}
                    onEditStart={() => ensureFieldDataLoaded('current_status_id')}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    State
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="state"
                    displayValue={currentApplicant.state}
                    value={getCode(stateOptions, currentApplicant.state) || ""}
                    onUpdate={handleStateChange}
                    options={stateOptions}
                    onEditStart={() => ensureFieldDataLoaded('state')}
                    disabled={!hasEditAccess}
                  />
                </div>
                {/* <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    City
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="city"
                    displayValue={currentApplicant.city || "Not provided"}
                    onUpdate={handleUpdate}
                  />
                </div> */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    District
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="district"
                    displayValue={currentApplicant.district || ""}
                    value={getCode(districtOptions, currentApplicant.district) || ""}
                    onUpdate={handleDistrictChange}
                    options={districtOptions}
                    disabled={
                      !hasEditAccess || !selectedState || isLoadingDistricts
                    }
                    placeholder={!selectedState ? "Select state first" : "Select district"}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Block
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="block"
                    displayValue={currentApplicant.block || ""}
                    value={getCode(blockOptions, currentApplicant.block) || ""}
                    onUpdate={handleBlockChange}
                    options={blockOptions}
                    disabled={
                      !hasEditAccess || !selectedDistrict || isLoadingBlocks
                    }
                    placeholder={!selectedDistrict ? "Select district first" : "Select block"}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Pincode
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="pin_code"
                    displayValue={currentApplicant.pin_code || ""}
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Partner
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="partner_id"
                    value={currentApplicant.partner_id}
                    displayValue={currentApplicant.partner_name || partnerName || ""}
                    onUpdate={handleUpdate}
                    options={partners}
                    onEditStart={() => ensureFieldDataLoaded('partner_id')}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Donor
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="donor_id"
                    value={currentApplicant.donor_id}
                    displayValue={currentApplicant.donor_name || donorName || ""}
                    onUpdate={handleUpdate}
                    options={donors}
                    onEditStart={() => ensureFieldDataLoaded('donor_id')}
                    disabled={!hasEditAccess}
                  />
                </div>
              </div>
            </div>

            {/* Timestamps for Personal Details */}
            <div className="space-y-3 pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Timestamps for Personal Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Created At
                  </label>
                  <p className="text-sm">
                    {currentApplicant.created_at
                      ? new Date(currentApplicant.created_at).toLocaleString()
                      : "Not available"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Last Updated At
                  </label>
                  <p className="text-sm">
                    {currentApplicant.updated_at
                      ? new Date(currentApplicant.updated_at).toLocaleString()
                      : "Not available"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Last Updated By
                  </label>
                  <p className="text-sm">
                    {currentApplicant.last_updated_by
                      ? currentApplicant.last_updated_by
                      : "Not available"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <InlineSubform
            title="Screening Round"
            studentId={currentApplicant.id}
            initialData={initialScreeningData}
            fields={screeningFields}
            submitApi={screeningSubmit}
            updateApi={screeningUpdate}
            deleteApi={API_MAP.screening.delete}
            canDelete={isAdmin}
            disableDelete={hasLearningRoundData}
            onSave={handleUpdate}
            disableAdd={isScreeningPassed}
          // disabled={!hasEditAccess}
          // disabledReason={!hasEditAccess ? "You do not have edit access" : undefined}
          />

          {/* Learning & Cultural Fit Rounds */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div className="col-span-full w-full">
              <InlineSubform
                key={`learning-${currentApplicant.id}-${liveScheduleData.length}`}
                title="Learning Round"
                studentId={currentApplicant.id}
                initialData={initialLearningData}
                customActions={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenInterviewDetails("LR")}
                    className="flex items-center gap-2"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    View Schedules
                  </Button>
                }
                fields={[
                  {
                    name: "learning_round_status",
                    label: "Status *",
                    type: "select" as const,
                    disabled: isStageDisabled(currentApplicant, "LR") || isLearningPassed,
                    options: [
                      {
                        value:"Learning Round Pass",
                        label: "Learning Round Pass"
                      },
                      {
                        value: "Learning Round Fail",
                        label: "Learning Round Fail",
                      },
                      { value: "Reschedule", label: "Reschedule" },
                      { value: "No Show", label: "No Show" },
                    ],
                  },
                  {
                    name: "school_id",
                    label: "Qualifying School",
                    type: "component" as const,
                    component: ({ row, updateRow, disabled }: any) => {
                      // Read-only mode (no updateRow passed)
                      if (!updateRow) {
                        // Try to find school name from schools list by ID
                        const school = schools.find(s => s.value === row?.school_id?.toString());
                        if (school) {
                          return (
                            <span className="text-gray-900" title={school.label}>
                              {school.label}
                            </span>
                          );
                        }
                        // If school_name field exists in row, use it
                        if (row?.school_name && row.school_name.trim() !== "") {
                          return (
                            <span className="text-gray-900" title={row.school_name}>
                              {row.school_name}
                            </span>
                          );
                        }
                        // Fallback: show ID or dash
                        return <span className="text-gray-500">{row?.school_id || "—"}</span>;
                      }
                      
                      // Edit mode: Show dropdown with better styling
                      return (
                        <select
                          value={row?.school_id || ""}
                          onChange={(e) => updateRow("school_id", e.target.value)}
                          className={`border rounded px-3 py-2 min-w-[200px] bg-white hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                          disabled={!!disabled}
                        >
                          <option value="">Select School</option>
                          {schools.map((school) => (
                            <option key={school.value} value={school.value}>
                              {school.label}
                            </option>
                          ))}
                        </select>
                      );
                    },
                  },
                  {
                    name: "comments",
                    label: "Comments *",
                    type: "text" as const,
                    disabled: isStageDisabled(currentApplicant, "LR"),
                  },
                  {
                    name: "audit_info",
                    label: "Audit Info",
                    type: "readonly" as const,
                  },
                ]}
                submitApi={API_MAP.learning.submit}
                updateApi={API_MAP.learning.update}
                deleteApi={API_MAP.learning.delete}
                canDelete={isAdmin}
                disableDelete={hasCulturalRoundData}
                onSave={handleUpdate}
                disableAdd={isLearningPassed}
                disabled={isStageDisabled(currentApplicant, "LR")}
                disabledReason={
                  isStageDisabled(currentApplicant, "LR")
                    ? "Student need to pass Screening Round"
                    : undefined
                }
              />
            </div>
            <div className="col-span-full w-full">
              <InlineSubform
                key={`cultural-${currentApplicant.id}-${liveScheduleData.length}`}
                title="Cultural Fit Round"
                studentId={currentApplicant.id}
                initialData={initialCulturalData}
                customActions={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenInterviewDetails("CFR")}
                    className="flex items-center gap-2"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    View Schedules
                  </Button>
                }
                fields={[
                  {
                    name: "cultural_fit_status",
                    label: "Status *",
                    type: "select" as const,
                    disabled: isStageDisabled(currentApplicant, "CFR") || isCulturalPassed,
                    options: [
                      {
                        value: " Cultural Fit Interview Pass",
                        label: " Cultural Fit Interview Pass",
                      },
                      {
                        value: " Cultural Fit Interview Fail",
                        label: " Cultural Fit Interview Fail",
                      },
                      { value: "Reschedule", label: "Reschedule" },
                      { value: "No Show", label: "No Show" },
                    ],
                  },
                  {
                    name: "comments",
                    label: "Comments *",
                    type: "text" as const,
                    disabled: isStageDisabled(currentApplicant, "LR"),
                  },
                  {
                    name: "audit_info",
                    label: "Audit Info",
                    type: "readonly" as const,
                  }
                ]}
                submitApi={API_MAP.cultural.submit}
                updateApi={API_MAP.cultural.update}
                deleteApi={API_MAP.cultural.delete}
                canDelete={isAdmin}
                disableDelete={hasOfferData}
                onSave={handleUpdate}
                disableAdd={isCulturalPassed}
                disabled={isStageDisabled(currentApplicant, "CFR")}
                disabledReason={
                  isStageDisabled(currentApplicant, "CFR")
                    ? "Student need to pass Learning Round"
                    : undefined
                }
              />
            </div>

            {/* Offer and Final Status */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Offer & Final Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Campus <span className="text-red-500">*</span>
                  </label>
                  {isStageDisabled(currentApplicant, "OFFER") &&
                    !currentApplicant.campus_id ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <EditableCell
                              applicant={currentApplicant}
                              field="campus_id"
                              value={currentApplicant.campus_id}
                              displayValue={getLabel(
                                campus,
                                currentApplicant.campus_id,
                                "",
                                "campus_name"
                              )}
                              onUpdate={handleUpdate}
                              options={campus}
                              onEditStart={() => ensureFieldDataLoaded('campus_id')}
                              disabled={true}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>All rounds should be passed</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <div className={!currentApplicant.campus_id && (currentApplicant.final_decisions?.[0]?.offer_letter_status || currentApplicant.final_decisions?.[0]?.onboarded_status) ? "border-2 border-red-500 rounded" : ""}>
                      <EditableCell
                        applicant={currentApplicant}
                        field="campus_id"
                        value={currentApplicant.campus_id}
                        displayValue={getLabel(
                          campus,
                          currentApplicant.campus_id,
                          "",
                          "campus_name"
                        )}
                        onUpdate={handleUpdate}
                        options={campus}
                        onEditStart={() => ensureFieldDataLoaded('campus_id')}
                        disabled={!hasEditAccess}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Offer Letter Status
                  </label>
                  {isStageDisabled(currentApplicant, "OFFER") &&
                    !currentApplicant.final_decisions?.[0]
                      ?.offer_letter_status ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <EditableCell
                              applicant={currentApplicant}
                              field="offer_letter_status"
                              value={
                                currentApplicant.final_decisions?.[0]
                                  ?.offer_letter_status
                              }
                              displayValue={
                                currentApplicant.final_decisions?.[0]
                                  ?.offer_letter_status || ""
                              }
                              options={[
                                {
                                  value: "Offer Pending",
                                  label: "Offer Pending",
                                },
                                { value: "Offer Sent", label: "Offer Sent" },
                                {
                                  value: "Offer Accepted",
                                  label: "Offer Accepted",
                                },
                                {
                                  value: "Offer Declined",
                                  label: "Offer Declined",
                                },
                                { value: "Waitlisted", label: "Waitlisted" },
                                {
                                  value: "Selected but not joined",
                                  label: "Selected but not joined",
                                },
                              ]}
                              disabled={true}
                              onUpdate={async (value) => {
                                await handleOfferLetterStatusChange(value);
                              }}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>All rounds should be passed</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <EditableCell
                      applicant={currentApplicant}
                      field="offer_letter_status"
                      value={
                        currentApplicant.final_decisions?.[0]
                          ?.offer_letter_status
                      }
                      displayValue={
                        currentApplicant.final_decisions?.[0]
                          ?.offer_letter_status || ""
                      }
                      options={[
                        { value: "Offer Pending", label: "Offer Pending" },
                        { value: "Offer Sent", label: "Offer Sent" },
                        { value: "Offer Accepted", label: "Offer Accepted" },
                        { value: "Offer Declined", label: "Offer Declined" },
                        { value: "Waitlisted", label: "Waitlisted" },
                        {
                          value: "Selected but not joined",
                          label: "Selected but not joined",
                        },
                      ]}
                      disabled={!hasEditAccess}
                      onUpdate={async (value) => {
                        await handleOfferLetterStatusChange(value);
                      }}
                    />
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Onboarded Status
                  </label>
                  {isStageDisabled(currentApplicant, "OFFER") &&
                    !currentApplicant.final_decisions?.[0]?.onboarded_status ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <EditableCell
                              applicant={currentApplicant}
                              field="onboarded_status"
                              value={
                                currentApplicant.final_decisions?.[0]
                                  ?.onboarded_status
                              }
                              displayValue={
                                currentApplicant.final_decisions?.[0]
                                  ?.onboarded_status || ""
                              }
                              options={[
                                { value: "Onboarded", label: "Onboarded" },
                              ]}
                              disabled={true}
                              onUpdate={async (value) => {
                                await handleFinalDecisionUpdate(
                                  "onboarded_status",
                                  value
                                );
                              }}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>All rounds should be passed</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <EditableCell
                      applicant={currentApplicant}
                      field="onboarded_status"
                      value={
                        currentApplicant.final_decisions?.[0]
                          ?.onboarded_status
                      }
                      displayValue={
                        currentApplicant.final_decisions?.[0]
                          ?.onboarded_status || ""
                      }
                      options={[{ value: "Onboarded", label: "Onboarded" }]}
                      disabled={!hasEditAccess}
                      onUpdate={async (value) => {
                        await handleFinalDecisionUpdate(
                          "onboarded_status",
                          value
                        );
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="w-full">
                <label className="text-sm font-medium text-muted-foreground">
                  Joining Date
                </label>
                {isStageDisabled(currentApplicant, "OFFER") &&
                  !currentApplicant.final_decisions?.[0]?.joining_date ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <input
                            type="date"
                            className="border rounded px-2 py-1 w-full cursor-not-allowed opacity-60"
                            value=""
                            disabled={true}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>All rounds should be passed</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <input
                    type="date"
                    className="border rounded px-2 py-1 w-full text-sm sm:text-base"
                    value={
                      joiningDate ||
                      currentApplicant.final_decisions?.[0]?.joining_date?.split(
                        "T"
                      )[0] ||
                      ""
                    }
                    disabled={!hasEditAccess}
                    onChange={async (e) => {
                      const selectedDate = e.target.value;
                      setJoiningDate(selectedDate);

                      try {
                        // Call API immediately when date changes
                        await handleFinalDecisionUpdate(
                          "joining_date",
                          selectedDate || null
                        );

                        // Immediately sync
                        setCurrentApplicant((prev) => ({
                          ...prev,
                          final_decisions: [
                            {
                              ...(prev.final_decisions?.[0] || {}),
                              joining_date: selectedDate,
                            },
                          ],
                        }));
                      } catch (err) {
                        // console.error("Failed to update joining date:", err);
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              {/* Final Note - Full Width */}
              <div className="w-full">
                <label className="text-sm font-medium text-muted-foreground">
                  Final Note
                </label>
                <EditableCell
                  applicant={currentApplicant}
                  field="final_notes"
                  value={
                    currentApplicant.final_decisions?.[0]?.final_notes || ""
                  }
                  displayValue={
                    currentApplicant.final_decisions?.[0]?.final_notes ||
                    "No final note"
                  }
                  renderInput={({ value, onChange }) => (
                    <textarea
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      rows={4}
                      className="border rounded px-2 py-1 w-full resize-y"
                      placeholder="Enter final notes here..."
                    />
                  )}
                  onUpdate={async (value) => {
                    await handleFinalDecisionUpdate("final_notes", value);
                  }}
                />
              </div>

              {/* Audit Information - Below Final Note */}
              <div className="space-y-3 pt-4">
                <h4 className="text-sm font-semibold text-muted-foreground">Timestamps for Offer Letter</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Created At
                    </label>
                    <p className="text-sm mt-1">
                      {currentApplicant.final_decisions?.[0]?.created_at
                        ? new Date(currentApplicant.final_decisions[0].created_at).toLocaleString()
                        : "Not available"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Updated At
                    </label>
                    <p className="text-sm mt-1">
                      {currentApplicant.final_decisions?.[0]?.updated_at
                        ? new Date(currentApplicant.final_decisions[0].updated_at).toLocaleString()
                        : "Not available"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Updated By
                    </label>
                    <p className="text-sm mt-1">
                      {currentApplicant.final_decisions?.[0]?.last_status_updated_by || "Not available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showEditModal && (
        <InlineEditModal
          applicant={currentApplicant}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {showTransitionsModal && (
        <TransitionsModal
          isOpen={showTransitionsModal}
          onClose={() => setShowTransitionsModal(false)}
          studentId={currentApplicant?.id}
          stages={stages}
          statuses={currentstatusList}
        />
      )}

      {/* Confirmation Dialog for "Offer Sent" */}
      <AlertDialog open={showOfferSentConfirmation} onOpenChange={setShowOfferSentConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Offer Sent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this offer as "Offer Sent"? This action will update the applicant's offer letter status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelOfferSent}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOfferSent}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setRescheduleData(null); // Clear reschedule data when closing
        }}
        onSchedule={handleScheduleInterview}
        slotData={null}
        allAvailableSlots={availableSlots}
        isDirectScheduleMode={true}
        isLoading={schedulingInProgress}
        initialStudentId={currentApplicant?.id?.toString()}
        initialStudentEmail={currentApplicant?.email}
        initialStudentName={currentApplicant?.name}
        isRescheduleMode={!!rescheduleData}
      />

      {/* Interview Details Modal - Shows all schedules with cancel/reschedule */}
      <InterviewDetailsModal
        isOpen={showInterviewDetailsModal}
        onClose={() => setShowInterviewDetailsModal(false)}
        scheduleInfo={
          interviewDetailsRoundType === "LR" 
            ? liveScheduleData.filter((s: any) => s.round_type === "LR" || s.title?.includes("Learning"))
            : liveScheduleData.filter((s: any) => s.round_type === "CFR" || s.title?.includes("Cultural"))
        }
        roundType={interviewDetailsRoundType || "LR"}
        studentName={currentApplicant?.name || ""}
        onCancel={handleCancelSchedule}
        onReschedule={handleRescheduleClick}
        onScheduleNew={handleScheduleNewFromDetails}
        canManage={isAdmin}
        currentUserEmail={user?.email || ""}
        isAdmin={isAdmin}
        isStageDisabled={isStageDisabled(currentApplicant, interviewDetailsRoundType || "LR")}
        hasPassedRound={hasPassedRound(currentApplicant, interviewDetailsRoundType || "LR")}
      />

      {/* {showCommentsModal && (
        <ApplicantCommentsModal
          applicantId={currentApplicant.id || ""}
          applicantName={currentApplicant.name || ""}
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
        />
      )} */}
    </>
  );
}



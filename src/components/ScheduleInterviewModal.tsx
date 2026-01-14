import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Loader2,
  Calendar,
  Clock,
  User,
  Mail,
  FileText,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStudentDataByEmail, getCurrentUser } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { useEffect } from "react";

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
    topicName: string
  ) => Promise<void>;
  isLoading: boolean;
}

export const ScheduleInterviewModal = ({
  isOpen,
  onClose,
  slotData,
  allAvailableSlots = [],
  isDirectScheduleMode = false,
  onSchedule,
  isLoading,
}: ScheduleInterviewModalProps) => {
  const [studentId, setStudentId] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [topicName, setTopicName] = useState("");
  const [interviewerEmail, setInterviewerEmail] = useState("");
  const [interviewerName, setInterviewerName] = useState("");
  const [isFetchingStudent, setIsFetchingStudent] = useState(false);
  const [studentDataFetched, setStudentDataFetched] = useState(false);
  const [completeStudentData, setCompleteStudentData] = useState<any>(null);
  const { toast } = useToast();

  // New states for date and slot selection
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  // Default interviewer email and topic name based on slot data
  useEffect(() => {
    if (isOpen) {
      const user = getCurrentUser();

      // Priority: 1. Slot data interviewer, 2. Current user email
      const defaultInterviewerEmail =
        slotData?.interviewer_email || user?.email || "";
      const defaultInterviewerName =
        slotData?.interviewer_name || user?.name || "";

      // Always update interviewer details when slot changes
      setInterviewerEmail(defaultInterviewerEmail);
      setInterviewerName(defaultInterviewerName);

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

  // Fetch student details by email
  const handleFetchStudent = useCallback(async () => {
    if (!studentEmail || !studentEmail.includes("@")) {
      toast({
        title: "⚠️ Invalid Email",
        description: "Please enter a valid email address",
        variant: "default",
        className: "border-primary/50 bg-primary/5 text-primary-dark",
      });
      return;
    }

    setIsFetchingStudent(true);
    try {
      const response = await getStudentDataByEmail(studentEmail);
      // Normalize the response - handle both axios.data and nested data.data structures
      const payload = (response as any)?.data ?? response;
      const studentData = payload?.student ?? payload;
      const studentId = studentData.student_id || studentData.id;
      const fullName =
        studentData.full_name ||
        studentData.name ||
        `${studentData.first_name || ""} ${studentData.last_name || ""}`.trim();

      if (studentId) {
        setStudentId(String(studentId));
        setStudentName(fullName);
        setCompleteStudentData(payload); // Store the complete payload with all interview data
        setStudentDataFetched(true);
        toast({
          title: "✅ Student Found",
          description: `${fullName} has been successfully found`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
      } else {
        throw new Error("Student ID not found in response");
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
    } finally {
      setIsFetchingStudent(false);
    }
  }, [studentEmail, toast]);

  // Reset student data when email changes
  const handleEmailChange = (email: string) => {
    setStudentEmail(email);
    if (studentDataFetched) {
      setStudentId("");
      setStudentName("");
      setCompleteStudentData(null);
      setStudentDataFetched(false);
    }
  };

  // Helper function to check interview round status
  const getInterviewRoundStatus = () => {
    if (!completeStudentData || !studentDataFetched) {
      return null;
    }

    const lrSchedules = completeStudentData.interview_schedules_lr || [];
    const cfrSchedules = completeStudentData.interview_schedules_cfr || [];
    const lrRounds = completeStudentData.interview_learner_round || [];
    const cfrRounds = completeStudentData.interview_cultural_fit_round || [];
    const examSessions = completeStudentData.exam_sessions || [];

    // Check if student has passed screening test (exam_sessions)
    const hasPassedScreening = examSessions.some(
      (exam: any) =>
        exam.status?.toLowerCase().includes("pass")
    );

    console.log(hasPassedScreening);
    // Filter schedules by status - only consider "scheduled" status
    const activeLRSchedules = lrSchedules.filter(
      (schedule: any) => schedule.status?.toLowerCase() === "scheduled"
    );
    const activeCFRSchedules = cfrSchedules.filter(
      (schedule: any) => schedule.status?.toLowerCase() === "scheduled"
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
      if (activeLRSchedules.length > 0) {
        return {
          canBook: false,
          message: "Student already has LR interview scheduled",
          type: "warning",
        };
      }
      if (hasPassedLR) {
        return {
          canBook: false,
          message: "Student has already passed LR round",
          type: "info",
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
          message: "Student must pass LR round before CFR booking",
          type: "warning",
        };
      }

      if (activeCFRSchedules.length > 0) {
        return {
          canBook: false,
          message: "Student already has CFR interview scheduled",
          type: "warning",
        };
      }
      if (hasPassedCFR) {
        return {
          canBook: false,
          message: "Student has already passed CFR round",
          type: "info",
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

  if (!isOpen) return null;

  // Get selected slot details
  const currentSlot = isDirectScheduleMode
    ? slotsForSelectedDate.find((s) => s.id === selectedSlotId)
    : slotData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId || !studentEmail || !studentName || !topicName) {
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
        interviewerEmail,
        interviewerName || interviewerEmail,
        slotToUse.date,
        slotToUse.start_time,
        slotToUse.end_time,
        topicName
      );

      // Reset form
      setStudentId("");
      setStudentEmail("");
      setStudentName("");
      setTopicName("");
      setInterviewerEmail("");
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
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl bg-card shadow-large border border-border">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="flex items-center justify-between text-lg font-semibold text-foreground">
            <span>Schedule Interview</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Create Google Meet link and schedule the interview
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date and Slot Selection (only in direct schedule mode) */}
          {isDirectScheduleMode && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
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
                          {slot.interviewer_name && (
                            <p className="text-xs text-muted-foreground ml-6">
                              {slot.interviewer_name}
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
          <div className="p-4 bg-muted/30 rounded-lg space-y-4 shadow-soft border border-border">
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Student Email <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-card"
                  placeholder="student@example.com"
                  required
                  disabled={isFetchingStudent}
                />
                <Button
                  type="button"
                  onClick={handleFetchStudent}
                  disabled={isFetchingStudent || !studentEmail}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isFetchingStudent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter email and click search to student details
              </p>
            </div>

            {/* Hidden Student ID field - value sent in payload but not shown in UI */}
            <input type="hidden" value={studentId} required />

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Student Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-card disabled:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground"
                placeholder="Auto-filled from email"
                required
                disabled={studentDataFetched}
              />
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
          <div className="p-4 bg-muted/30 rounded-lg space-y-4 shadow-soft border border-border">
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
              disabled={
                isLoading || (interviewStatus && !interviewStatus.canBook)
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Meeting...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  {interviewStatus && !interviewStatus.canBook
                    ? "Cannot Schedule - Already Booked"
                    : "Schedule & Create Meet Link"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

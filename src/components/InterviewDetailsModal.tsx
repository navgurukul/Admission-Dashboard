import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Video,
  AlertTriangle,
  X,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";

interface InterviewSchedule {
  id: number;
  schedule_id: number;
  date: string;
  start_time: string;
  end_time: string;
  interviewer_name?: string;
  interviewer_email?: string;
  meeting_link?: string;
  status: string;
  title?: string;
  google_event_id?: string;
}

interface InterviewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleInfo: InterviewSchedule[];
  roundType: "LR" | "CFR";
  studentName: string;
  onCancel?: (scheduleId: number) => Promise<void>;
  onReschedule?: (scheduleId: number) => void;
  onScheduleNew?: () => void; // Callback to open schedule modal
  canManage?: boolean; // Permission to cancel/reschedule (admin)
  currentUserEmail?: string; // Current logged-in user's email
  isAdmin?: boolean; // Is current user an admin
  isStageDisabled?: boolean; // Is this stage disabled (previous round not passed)
  hasPassedRound?: boolean; // Has student already passed this round
}

export function InterviewDetailsModal({
  isOpen,
  onClose,
  scheduleInfo,
  roundType,
  studentName,
  onCancel,
  onReschedule,
  onScheduleNew,
  canManage = false,
  currentUserEmail = "",
  isAdmin = false,
  isStageDisabled = false,
  hasPassedRound = false,
}: InterviewDetailsModalProps) {
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<number | null>(null);

  const roundName = roundType === "LR" ? "Learning Round" : "Cultural Fit Round";

  // Check if user can manage this specific interview
  const canManageInterview = (schedule: InterviewSchedule) => {
    // Admin can manage all interviews
    if (isAdmin) return true;
    
    // Regular user can only manage if they are the interviewer
    if (currentUserEmail && schedule.interviewer_email) {
      return schedule.interviewer_email.toLowerCase() === currentUserEmail.toLowerCase();
    }
    
    return false;
  };

  // Check if there are any active (booked/scheduled/rescheduled) interviews
  const hasActiveBooking = useMemo(() => {
    return scheduleInfo?.some((schedule) => {
      const status = schedule.status?.toLowerCase() || "";
      return status === "scheduled" || status === "booked" || status === "rescheduled";
    }) || false;
  }, [scheduleInfo]);

  // Determine if user can schedule new interview
  // Cannot schedule if:
  // 1. Student has already passed the round
  // 2. Stage is disabled (previous round not passed)
  // 3. There's already an active booking (scheduled/rescheduled) - applies to everyone including admin
  const canScheduleNew = !hasPassedRound && !isStageDisabled && !hasActiveBooking;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    
    if (statusLower === "scheduled" || statusLower === "booked") {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Scheduled</Badge>;
    }
    if (statusLower === "cancelled") {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
    }
    if (statusLower === "completed") {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>;
    }
    if (statusLower === "rescheduled") {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Rescheduled</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
  };

  const handleCancelInterview = async (scheduleId: number) => {
    if (!onCancel) return;

    setCancelling(scheduleId);
    try {
      await onCancel(scheduleId);
      toast({
        title: "✅ Interview Cancelled",
        description: "The interview has been successfully cancelled.",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
      setShowCancelConfirm(null);
    } catch (error) {
      console.error("Cancel interview failed:", error);
      toast({
        title: "❌ Unable to Cancel",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setCancelling(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Calendar className="w-6 h-6 text-primary" />
                {roundName} - Interview Schedules
              </DialogTitle>
              {/* <DialogDescription className="mt-1">
                Student: {studentName}
              </DialogDescription> */}
            </div>
            {canScheduleNew && onScheduleNew && (
              <Button
                onClick={() => {
                  onClose();
                  onScheduleNew();
                }}
                className="flex items-center gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Schedule New
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {!scheduleInfo || scheduleInfo.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No interviews scheduled</p>
              {hasPassedRound ? (
                <p className="text-sm mt-2 text-blue-600">
                  ✅ Student has already passed {roundType === "LR" ? "Learning Round" : "Cultural Fit Round"}
                </p>
              ) : isStageDisabled ? (
                <p className="text-sm mt-2 text-orange-600">
                  {roundType === "LR" 
                    ? "Student needs to pass Screening Round before scheduling Learning Round interview"
                    : "Student needs to pass Learning Round before scheduling Cultural Fit Round interview"
                  }
                </p>
              ) : (
                <p className="text-sm mt-2">
                  {canScheduleNew 
                    ? "Click \"Schedule New\" to create the first interview"
                    : "No active bookings available"
                  }
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left p-3 font-semibold text-sm">Attempt</th>
                    <th className="text-left p-3 font-semibold text-sm">Date</th>
                    <th className="text-left p-3 font-semibold text-sm">Time</th>
                    <th className="text-left p-3 font-semibold text-sm">Interviewer</th>
                    <th className="text-left p-3 font-semibold text-sm">Status</th>
                    <th className="text-left p-3 font-semibold text-sm">Meeting</th>
                    <th className="text-right p-3 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleInfo.map((schedule, index) => {
                    const isActive = schedule.status?.toLowerCase() === "scheduled" || schedule.status?.toLowerCase() === "booked";
                    const isCancelled = schedule.status?.toLowerCase() === "cancelled";
                    const canManageThis = canManageInterview(schedule);
                    
                    return (
                      <tr 
                        key={schedule.schedule_id || schedule.id || index}
                        className={`border-b hover:bg-muted/30 transition-colors ${
                          isCancelled ? "opacity-50" : ""
                        }`}
                      >
                        <td className="p-3">
                          <div className="font-medium">
                            {schedule.title || `Attempt ${index + 1}`}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {formatDate(schedule.date)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </div>
                        </td>
                        <td className="p-3">
                          {schedule.interviewer_name ? (
                            <div>
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <User className="w-4 h-4 text-muted-foreground" />
                                {schedule.interviewer_name}
                              </div>
                              {schedule.interviewer_email && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                                  <Mail className="w-3 h-3" />
                                  {schedule.interviewer_email}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(schedule.status)}
                        </td>
                        <td className="p-3">
                          {schedule.meeting_link ? (
                            <a
                              href={schedule.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <Video className="w-4 h-4" />
                              Join
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          {!hasPassedRound && canManageThis && isActive && !isCancelled ? (
                            <div className="flex items-center justify-end gap-2">
                              {onReschedule && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onReschedule(schedule.schedule_id || schedule.id)}
                                  className="flex items-center gap-1 h-8 text-xs"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Reschedule
                                </Button>
                              )}
                              {onCancel && !showCancelConfirm && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50 border-red-200 flex items-center gap-1 h-8 text-xs"
                                  onClick={() => setShowCancelConfirm(schedule.schedule_id || schedule.id)}
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Cancel Confirmation Dialog */}
          {showCancelConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Cancel Interview?
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Are you sure you want to cancel this interview? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelConfirm(null)}
                        size="sm"
                      >
                        Keep Interview
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleCancelInterview(showCancelConfirm)}
                        disabled={cancelling === showCancelConfirm}
                        size="sm"
                      >
                        {cancelling === showCancelConfirm ? "Cancelling..." : "Yes, Cancel"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

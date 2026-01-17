import { useState, useEffect } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import {
  Calendar,
  Clock,
  Plus,
  Users,
  Video,
  Trash2,
  Edit,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AddSlotsModal } from "@/components/AddSlotsModal";
import { EditSlotModal } from "@/components/EditSlotModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import {
  getMyAvailableSlots,
  scheduleInterview,
  deleteInterviewSlot,
  getCurrentUser,
} from "@/utils/api";
import {
  initClient,
  signIn,
  isSignedIn,
  createCalendarEvent,
  formatDateTimeForCalendar,
} from "@/utils/googleCalendar";
import { ScheduleInterviewModal } from "@/components/ScheduleInterviewModal";

type SlotData = {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  slot_type?: string; // Add this field
  interviewer_id?: number;
  interviewer_email?: string;
  interviewer_name?: string;
  is_booked: boolean;
  status: string;
  created_at: string;
};

const Schedule = () => {
  const [isAddSlotsModalOpen, setIsAddSlotsModalOpen] = useState(false);
  const [isEditSlotModalOpen, setIsEditSlotModalOpen] = useState(false);
  const [selectedSlotForEdit, setSelectedSlotForEdit] =
    useState<SlotData | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const currentUser = getCurrentUser();
  const roleId = currentUser?.user_role_id || 2;
  const isAdmin = roleId === 1;

  // Add state for admin scheduling
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedSlotForScheduling, setSelectedSlotForScheduling] =
    useState<SlotData | null>(null);

  // Add new state for direct scheduling without slot selection
  const [isDirectScheduleMode, setIsDirectScheduleMode] = useState(false);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [schedulingInProgress, setSchedulingInProgress] = useState(false);

  // State for slots management
  const [availableSlots, setAvailableSlots] = useState<SlotData[]>([]);
  const [allSlots, setAllSlots] = useState<SlotData[]>([]); // Store all slots
  const [selectedDate, setSelectedDate] = useState<string>(""); // Empty means show all
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<SlotData | null>(null);
  const [isDeletingSlot, setIsDeletingSlot] = useState(false);

  // Initialize Google API on mount
  useEffect(() => {
    const initGoogle = async () => {
      try {
        await initClient();
        if (isSignedIn()) {
          setIsGoogleSignedIn(true);
        }
      } catch (error) {
        console.error("Google API init error:", error);
      }
    };
    initGoogle();
  }, []);

  useEffect(() => {
    fetchAllAvailableSlots();
  }, []);

  // Fetch all available slots (no date filter)
  const fetchAllAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const response = await getMyAvailableSlots(); //

      // Handle different response formats
      const slots = Array.isArray(response)
        ? response
        : response?.data?.data || response?.data || [];

      setAllSlots(slots);
      setAvailableSlots(slots); // Show all by default

      // toast({
      //   title: "Success",
      //   description: `Loaded ${slots.length} available slots`,
      // });
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast({
        title: "❌ Unable to Load Slots",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
      setAllSlots([]);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Filter slots by date
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);

    if (newDate === "") {
      // Show all slots if date is cleared
      setAvailableSlots(allSlots);
    } else {
      // Filter slots by selected date
      const filtered = allSlots.filter((slot) => slot.date === newDate);
      setAvailableSlots(filtered);
    }
  };

  // Clear filter and show all slots
  const handleClearFilter = () => {
    setSelectedDate("");
    setAvailableSlots(allSlots);
  };

  //  Admin scheduling function
  const handleAdminScheduleMeet = async (
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
    try {
      setSchedulingInProgress(true);

      if (!isSignedIn()) {
        toast({
          title: "⚠️ Google Sign-in Required",
          description: "Please sign in with Google to create Meet link",
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900"
        });
        await signIn();
        setIsGoogleSignedIn(true);
      }

      const startDateTime = formatDateTimeForCalendar(date, startTime);
      const endDateTime = formatDateTimeForCalendar(date, endTime);

      const eventDetails = {
        summary: `${topicName} - Interview (Admin Scheduled)`,
        description: `Interview scheduled by Admin\nStudent: ${studentName} (${studentEmail})\nInterviewer: ${interviewerName} (${interviewerEmail})\nTopic: ${topicName}`,
        startDateTime,
        endDateTime,
        attendeeEmail: studentEmail,
        studentName: studentName,
        attendees: [adminEmail, studentEmail, interviewerEmail].filter(Boolean),
      };

      toast({
        title: "Creating Meeting...",
        description: "Generating Google Meet link...",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });

      const calendarResult = await createCalendarEvent(eventDetails);

      if (!calendarResult.meetLink) {
        throw new Error("Failed to create Google Meet link");
      }

      const payload = {
        student_id: studentId,
        slot_id: slotId,
        title: `${topicName} - Interview`,
        description: `Admin scheduled interview for ${studentName}. Topic: ${topicName}. Interviewer: ${interviewerName}`,
        meeting_link: calendarResult.meetLink,
        google_event_id: calendarResult.eventId,
        created_by: "Admin" as const,
      };

      await scheduleInterview(payload);

      toast({
        title: "✅ Interview Scheduled",
        description: "Interview scheduled and Meet link created successfully!",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900"
      });

      fetchAllAvailableSlots();
      setIsScheduleModalOpen(false);
      setSelectedSlotForScheduling(null);
      setIsDirectScheduleMode(false);
    } catch (error: any) {
      console.error("Admin scheduling error:", error);
      toast({
        title: "❌ Unable to Schedule Interview",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
    } finally {
      setSchedulingInProgress(false);
    }
  };

  // Check if slot can be deleted
  const canDeleteSlot = (slot: SlotData): boolean => {
    // Cannot delete if booked
    if (slot.is_booked) {
      return false;
    }

    // Cannot delete if in the past
    try {
      const slotDate = new Date(slot.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      slotDate.setHours(0, 0, 0, 0);

      return slotDate >= today;
    } catch {
      return false;
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (slot: SlotData) => {
    if (!canDeleteSlot(slot)) {
      toast({
        title: "⚠️ Cannot Delete Slot",
        description: "Cannot delete booked slots or past date slots",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
      return;
    }
    setSlotToDelete(slot);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!slotToDelete) return;

    try {
      setIsDeletingSlot(true);
      await deleteInterviewSlot(slotToDelete.id);

      toast({
        title: "✅ Slot Deleted",
        description: "Slot deleted successfully",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900"
      });

      // Refresh slots
      fetchAllAvailableSlots();
      setDeleteDialogOpen(false);
      setSlotToDelete(null);
    } catch (error: any) {
      console.error("Error deleting slot:", error);
      toast({
        title: "❌ Unable to Delete Slot",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
    } finally {
      setIsDeletingSlot(false);
    }
  };

  // Calculate statistics
  const todaySlots = allSlots.filter((slot) => {
    const slotDate = new Date(slot.date).toDateString();
    const today = new Date().toDateString();
    return slotDate === today;
  });

  const availableTodayCount = todaySlots.filter(
    (slot) => !slot.is_booked,
  ).length;
  const bookedTodayCount = todaySlots.filter((slot) => slot.is_booked).length;

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

  // Group slots by date
  const groupedSlots = availableSlots.reduce(
    (acc, slot) => {
      const date = slot.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(slot);
      return acc;
    },
    {} as Record<string, SlotData[]>,
  );

  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />

      <main className="md:ml-64 overflow-auto h-screen">
        <div className="p-4 md:p-8 pt-16 md:pt-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">
              {isAdmin ? "Admin View" : "My Dashboard"}
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage interview slots and availability
            </p>
          </div>

          {isAdmin && (
            <Tabs value="my-interviews" className="w-full mb-6">
              <TabsList className={cn("grid w-full", isAdmin ? "grid-cols-3 max-w-xl" : "grid-cols-1 max-w-xs")}>
                <>
                  <TabsTrigger
                    value="interviews"
                    onClick={() => navigate("/admin-view")}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Scheduled Interviews
                  </TabsTrigger>
                  <TabsTrigger
                    value="slots"
                    onClick={() => navigate("/admin-view")}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Created Slots
                  </TabsTrigger>
                </>
                <TabsTrigger
                  value="my-interviews"
                  onClick={() => navigate("/admin-view")}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  My Interviews
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 shadow-medium border border-border hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Today's Booked
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {bookedTodayCount}
                  </p>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-medium border border-border hover:border-secondary-purple/30 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Available Today
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {availableTodayCount}
                  </p>
                </div>
                <div className="w-14 h-14 bg-secondary-purple/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-7 h-7 text-secondary-purple" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-medium border border-border hover:border-primary/30  transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Total Slots
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {allSlots.length}
                  </p>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Available Slots Management */}
          <div className="bg-card rounded-xl shadow-soft border border-border mb-8">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Available Slots Management
                </h2>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setIsAddSlotsModalOpen(true)}
                    className="bg-gradient-primary hover:bg-primary/90 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Slots
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDirectScheduleMode(true);
                      setSelectedSlotForScheduling(null);
                      setIsScheduleModalOpen(true);
                    }}
                    className="bg-primary hover:bg-primary/90 text-white shadow-soft hover:shadow-medium transition-all"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Filter by Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-card"
                  />
                </div>
                {selectedDate && (
                  <Button
                    variant="outline"
                    onClick={handleClearFilter}
                    className="mt-6"
                  >
                    Clear Filter
                  </Button>
                )}
                {/* <div className="mt-6 text-sm text-muted-foreground">
                  {selectedDate && 
                     `Showing slots for ${new Date(selectedDate).toLocaleDateString()}`}
                     
                </div> */}
              </div>
            </div>

            <div className="p-6">
              {loadingSlots ? (
                <div className="text-center text-muted-foreground py-8">
                  Loading slots...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg mb-2">
                    {selectedDate
                      ? `No slots available for ${new Date(selectedDate).toLocaleDateString()}`
                      : "No slots available"}
                  </p>
                  <p className="text-sm">
                    Click "Add Slots" to create new interview slots
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 sticky top-0">
                      <tr>
                        <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                          Date
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                          Slot Type
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                          Start Time
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                          End Time
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                          Status
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableSlots.map((slot) => (
                        <tr
                          key={slot.id}
                          className="border-b border-border hover:bg-muted/20 transition-all"
                        >
                          {/* Date */}
                          <td className="p-4">
                            <span className="text-sm text-foreground">
                              {new Date(slot.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </td>

                          {/* Slot Type */}
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${slot.slot_type === "LR"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : slot.slot_type === "CFR"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                  : "bg-muted text-muted-foreground"
                                }`}
                            >
                              {slot.slot_type === "LR"
                                ? "Learning Round"
                                : slot.slot_type === "CFR"
                                  ? "Cultural Fit Round"
                                  : slot.slot_type || "N/A"}
                            </span>
                          </td>

                          {/* Start Time */}
                          <td className="p-4">
                            <span className="text-sm text-foreground font-medium">
                              {formatTime(slot.start_time)}
                            </span>
                          </td>

                          {/* End Time */}
                          <td className="p-4">
                            <span className="text-sm text-foreground font-medium">
                              {formatTime(slot.end_time)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${slot.is_booked
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-primary/10 text-primary"
                                }`}
                            >
                              {slot.is_booked ? "Booked" : "Available"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {/* {!slot.is_booked && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSlotForScheduling(slot);
                                    setIsScheduleModalOpen(true);
                                  }}
                                  className="bg-primary hover:bg-primary/90 text-white shadow-soft hover:shadow-medium transition-all"
                                  title="Schedule interview"
                                >
                                  <Video className="w-3 h-3 mr-1" />
                                  Schedule
                                </Button>
                              )} */}

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={slot.is_booked}
                                onClick={() => {
                                  setSelectedSlotForEdit(slot);
                                  setIsEditSlotModalOpen(true);
                                }}
                                title={
                                  slot.is_booked
                                    ? "Cannot edit booked slot"
                                    : "Edit slot"
                                }
                              >
                                <Edit className="w-3 h-3 mr-1" />
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={!canDeleteSlot(slot)}
                                onClick={() => openDeleteDialog(slot)}
                                title={
                                  !canDeleteSlot(slot)
                                    ? "Cannot delete booked or past slots"
                                    : "Delete slot"
                                }
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <AddSlotsModal
        isOpen={isAddSlotsModalOpen}
        onClose={() => setIsAddSlotsModalOpen(false)}
        onSuccess={() => {
          setIsAddSlotsModalOpen(false);
          fetchAllAvailableSlots();
        }}
      />

      <EditSlotModal
        isOpen={isEditSlotModalOpen}
        onClose={() => {
          setIsEditSlotModalOpen(false);
          setSelectedSlotForEdit(null);
        }}
        onSuccess={() => {
          setIsEditSlotModalOpen(false);
          setSelectedSlotForEdit(null);
          fetchAllAvailableSlots();
        }}
        slotData={selectedSlotForEdit}
      />

      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setSelectedSlotForScheduling(null);
          setIsDirectScheduleMode(false);
        }}
        slotData={selectedSlotForScheduling}
        allAvailableSlots={availableSlots}
        isDirectScheduleMode={isDirectScheduleMode}
        onSchedule={handleAdminScheduleMeet}
        isLoading={schedulingInProgress}

      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSlotToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Slot"
        description={
          slotToDelete
            ? `Are you sure you want to delete this slot?\n\nDate: ${new Date(slotToDelete.date).toLocaleDateString()}\nTime: ${formatTime(slotToDelete.start_time)} - ${formatTime(slotToDelete.end_time)}
            Slot Type: ${slotToDelete.slot_type}\nThis action cannot be revert.`
            : ""
        }
        confirmText="Delete Slot"
        isLoading={isDeletingSlot}
      />
    </div>
  );
};

export default Schedule;

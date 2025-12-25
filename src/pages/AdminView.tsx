import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Calendar, Clock, AlertCircle, Video, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAllSlots,
  getAllInterviewSchedules,
  scheduleInterview,
  getScheduledInterviews,
  getCurrentUser,
} from "@/utils/api";
import { ApplicantModal } from "@/components/ApplicantModal";
import { ScheduleInterviewModal } from "@/components/ScheduleInterviewModal";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import {
  initClient,
  signIn,
  isSignedIn,
  createCalendarEvent,
  formatDateTimeForCalendar,
} from "@/utils/googleCalendar";

export default function AdminView() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const roleId = currentUser?.user_role_id || 2; // 1: Admin, 2: Interviewer
  const isAdmin = roleId === 1;

  const [activeTab, setActiveTab] = useState(isAdmin ? "interviews" : "my-interviews");
  const [interviews, setInterviews] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [myInterviews, setMyInterviews] = useState<any[]>([]);
  const [myInterviewsLoading, setMyInterviewsLoading] = useState(false);

  // Applicant Modal State
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);

  // Search and filter states for interviews
  const [interviewSearchTerm, setInterviewSearchTerm] = useState("");
  const [interviewDateFilter, setInterviewDateFilter] = useState("");
  const [interviewSlotTypeFilter, setInterviewSlotTypeFilter] = useState("");

  // Search and filter states for slots
  const [slotSearchTerm, setSlotSearchTerm] = useState("");
  const [slotDateFilter, setSlotDateFilter] = useState("");
  const [slotTypeFilter, setSlotTypeFilter] = useState("");

  // Filter states for my interviews
  const [myInterviewDateFilter, setMyInterviewDateFilter] = useState("");

  // Pagination states
  const [interviewCurrentPage, setInterviewCurrentPage] = useState(1);
  const [slotCurrentPage, setSlotCurrentPage] = useState(1);
  const [interviewTotalPages, setInterviewTotalPages] = useState(1);
  const [interviewTotalCount, setInterviewTotalCount] = useState(0);
  const [slotTotalPages, setSlotTotalPages] = useState(1);
  const [slotTotalCount, setSlotTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();

  // Scheduling States
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedSlotForScheduling, setSelectedSlotForScheduling] = useState<any>(null);
  const [schedulingInProgress, setSchedulingInProgress] = useState(false);

  // Initialize Google API on mount
  useEffect(() => {
    const initGoogle = async () => {
      try {
        await initClient();
      } catch (error) {
        console.error("Google API init error:", error);
      }
    };
    initGoogle();
  }, []);

  // Only fetch interviews when interviews tab is active
  useEffect(() => {
    if (activeTab !== "interviews") return;

    const timeoutId = setTimeout(() => {
      fetchInterviews();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [activeTab, interviewCurrentPage, interviewDateFilter, interviewSearchTerm, interviewSlotTypeFilter, itemsPerPage]);

  // Only fetch slots when slots tab is active
  useEffect(() => {
    if (activeTab !== "slots") return;

    const timeoutId = setTimeout(() => {
      fetchSlots();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [activeTab, slotCurrentPage, slotDateFilter, slotSearchTerm, slotTypeFilter, itemsPerPage]);

  // Optimized fetch: Only fetch my interviews when my-interviews tab is active
  useEffect(() => {
    if (activeTab !== "my-interviews") return;

    fetchMyInterviews();
  }, [activeTab, myInterviewDateFilter]);

  const fetchInterviews = async () => {
    try {
      setInterviewsLoading(true);
      const response = await getAllInterviewSchedules({
        page: interviewCurrentPage,
        pageSize: itemsPerPage,
        slot_type: interviewSlotTypeFilter && interviewSlotTypeFilter !== 'all' ? interviewSlotTypeFilter : undefined,
        date: interviewDateFilter || undefined,
        search: interviewSearchTerm || undefined,
      });

      if (response.success && response.data) {
        setInterviews(response.data || []);
        setInterviewTotalPages(response.totalPages || 1);
        setInterviewTotalCount(response.total || 0);
      } else {
        setInterviews([]);
        setInterviewTotalPages(1);
        setInterviewTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
      setInterviews([]);
      setInterviewTotalPages(1);
      setInterviewTotalCount(0);
    } finally {
      setInterviewsLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      setSlotsLoading(true);
      const response = await getAllSlots({
        page: slotCurrentPage,
        pageSize: itemsPerPage,
        slot_type: slotTypeFilter && slotTypeFilter !== 'all' ? slotTypeFilter : undefined,
        date: slotDateFilter || undefined,
        search: slotSearchTerm || undefined,
      });

      if (response.success && response.data) {
        setSlots(response.data || []);
        setSlotTotalPages(response.totalPages || 1);
        setSlotTotalCount(response.total || 0);
      } else {
        setSlots([]);
        setSlotTotalPages(1);
        setSlotTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      setSlots([]);
      setSlotTotalPages(1);
      setSlotTotalCount(0);
    } finally {
      setSlotsLoading(false);
    }
  };

  const fetchMyInterviews = async () => {
    try {
      setMyInterviewsLoading(true);
      const data = await getScheduledInterviews(myInterviewDateFilter || undefined);
      setMyInterviews(data || []);
    } catch (error) {
      console.error("Error fetching my interviews:", error);
      setMyInterviews([]);
    } finally {
      setMyInterviewsLoading(false);
    }
  };

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
        attendees: [studentEmail, interviewerEmail].filter(Boolean),
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

      fetchSlots();
      setIsScheduleModalOpen(false);
      setSelectedSlotForScheduling(null);
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

  const getStatusBadge = (status: string) => {
    let colorClass = "bg-gray-500";
    let displayStatus = status;

    switch (status?.toLowerCase()) {
      // Interview statuses
      case "scheduled":
        colorClass = "bg-green-500";
        displayStatus = "Scheduled";
        break;
      case "rescheduled":
        colorClass = "bg-orange-500";
        displayStatus = "Rescheduled";
        break;
      case "active":
        colorClass = "bg-blue-500";
        displayStatus = "Active";
        break;
      case "completed":
        colorClass = "bg-green-500";
        displayStatus = "Completed";
        break;

      // Slot statuses
      case "booked":
        colorClass = "bg-green-500";
        displayStatus = "Booked";
        break;
      case "available":
        colorClass = "bg-primary/90";
        displayStatus = "Available";
        break;
      case "expired":
        colorClass = "bg-gray-500";
        displayStatus = "Expired";
        break;
      case "cancelled":
      case "canceled":
        colorClass = "bg-red-500";
        displayStatus = "Cancelled";
        break;
    }
    return <Badge className={`${colorClass} text-white hover:${colorClass}`}>{displayStatus}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "N/A";
    try {
      let date;
      // If it's just time (HH:MM:SS or HH:MM)
      if (timeString.includes(":") && !timeString.includes("T")) {
        const today = new Date();
        const [hours, minutes] = timeString.split(":");
        date = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          parseInt(hours),
          parseInt(minutes),
        );
      } else {
        // ISO format
        date = new Date(timeString);
      }

      if (isNaN(date.getTime())) {
        return timeString;
      }

      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Error formatting time:", timeString, error);
      return timeString;
    }
  };


  return (
    <div className="flex min-h-screen bg-background">
      <AdmissionsSidebar />

      <div className="flex-1 md:ml-64 min-w-0">
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">
              {isAdmin ? "Admin View" : "Interviews"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isAdmin
                ? "Overview of all scheduled interviews and created slots"
                : "Manage your scheduled interviews and availability"}
            </p>
          </div>

          <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
            {isAdmin && (
              <TabsList className={cn("grid w-full", isAdmin ? "grid-cols-3 max-w-lg" : "grid-cols-1 max-w-xs")}>
                <TabsTrigger
                  value="interviews"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Scheduled Interviews
                </TabsTrigger>
                <TabsTrigger
                  value="slots"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Created Slots
                </TabsTrigger>
                <TabsTrigger
                  value="my-interviews"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  My Interviews
                </TabsTrigger>
              </TabsList>
            )}

            {/* Interviews Tab */}
            {isAdmin && (
              <TabsContent value="interviews" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5" />
                      All Scheduled Interviews
                    </CardTitle>
                    <div className="flex gap-3 items-center flex-wrap">
                      <div className="w-[300px]">
                        <Input
                          placeholder="Search by name, email, interviewer..."
                          value={interviewSearchTerm}
                          onChange={(e) => setInterviewSearchTerm(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="w-40">
                        <Select
                          value={interviewSlotTypeFilter}
                          onValueChange={setInterviewSlotTypeFilter}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Slot Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="LR">LR (Learning Round)</SelectItem>
                            <SelectItem value="CFR">CFR (Culture Fit)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-48">
                        <Input
                          type="date"
                          value={interviewDateFilter}
                          onChange={(e) => setInterviewDateFilter(e.target.value)}
                          placeholder="Filter by date"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {interviewsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : interviews.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No scheduled interviews found
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-auto max-h-[600px] w-full">
                        <Table>
                          <TableHeader className="sticky top-0 bg-muted/30 z-10">
                            <TableRow className="bg-muted/30">
                              <TableHead className="font-semibold min-w-[200px]">Applicant</TableHead>
                              <TableHead className="font-semibold min-w-[200px]">Interviewer</TableHead>
                              <TableHead className="font-semibold min-w-[150px]">Title</TableHead>
                              <TableHead className="font-semibold min-w-[120px]">Date</TableHead>
                              <TableHead className="font-semibold min-w-[150px]">Time</TableHead>
                              <TableHead className="font-semibold min-w-[120px]">Status</TableHead>
                              <TableHead className="font-semibold min-w-[100px]">Meeting Link</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {interviews.map((interview: any) => (
                              <TableRow key={interview.id} className="hover:bg-muted/20 transition-colors">
                                <TableCell className="min-w-[200px]">
                                  <div
                                    className="cursor-pointer hover:bg-muted p-2 rounded-md transition-colors group"
                                    onClick={() => {
                                      if (interview.student_id) {
                                        setSelectedApplicant({ id: interview.student_id });
                                        setIsApplicantModalOpen(true);
                                      }
                                    }}
                                  >
                                    <div className="font-medium text-foreground group-hover:text-foreground flex items-center gap-2">
                                      {interview.student_name || "Unknown"}
                                      {/* <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /> */}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{interview.student_email || "N/A"}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="min-w-[200px]">
                                  <div>
                                    <div className="font-medium">{interview.interviewer_name || "Not Assigned"}</div>
                                    <div className="text-xs text-muted-foreground">{interview.interviewer_email || "N/A"}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap min-w-[150px]">
                                  <span className="font-medium">{interview.title || "No Title"}</span>
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-sm min-w-[120px]">
                                  {formatDate(interview.slot_date)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-sm min-w-[150px]">
                                  {formatTime(interview.start_time)} - {formatTime(interview.end_time)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap min-w-[120px]">
                                  {getStatusBadge(interview.status)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap min-w-[100px]">
                                  {interview.meeting_link ? (
                                    interview.status?.toLowerCase() === "cancelled" ? (
                                      <span className="flex items-center gap-1 text-muted-foreground text-sm cursor-not-allowed">
                                        <Video className="w-4 h-4" />
                                        <span>Cancelled</span>
                                      </span>
                                    ) : (
                                      <a
                                        href={interview.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-primary hover:underline"
                                      >
                                        <Video className="w-4 h-4" />
                                        <span>Join</span>
                                      </a>
                                    )
                                  ) : (
                                    <span className="text-muted-foreground text-sm">No Link</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {interviewTotalCount > 0 && (
                      <div className="flex justify-between items-center mt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {((interviewCurrentPage - 1) * itemsPerPage) + 1} – {Math.min(interviewCurrentPage * itemsPerPage, interviewTotalCount)} of {interviewTotalCount}
                        </p>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-muted-foreground">Rows:</label>
                            <select
                              value={itemsPerPage}
                              onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setInterviewCurrentPage(1);
                              }}
                              className="border rounded px-2 py-1 bg-white text-sm"
                            >
                              <option value={10}>10</option>
                              <option value={20}>20</option>
                              <option value={50}>50</option>
                              <option value={100}>100</option>
                            </select>
                          </div>
                          <button
                            onClick={() => setInterviewCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={interviewCurrentPage === 1}
                            className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <span className="px-3 py-1 text-sm">
                            Page {interviewCurrentPage} of {interviewTotalPages}
                          </span>
                          <button
                            onClick={() => setInterviewCurrentPage(prev => Math.min(interviewTotalPages, prev + 1))}
                            disabled={interviewCurrentPage === interviewTotalPages}
                            className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Slots Tab */}
            {isAdmin && (
              <TabsContent value="slots" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5" />
                      All Created Slots
                    </CardTitle>
                    <div className="flex gap-3 items-center flex-wrap">
                      <div className="w-[300px]">
                        <Input
                          placeholder="Search by creator name or email..."
                          value={slotSearchTerm}
                          onChange={(e) => setSlotSearchTerm(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="w-40">
                        <Select
                          value={slotTypeFilter}
                          onValueChange={setSlotTypeFilter}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Slot Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="LR">LR (Learning Round)</SelectItem>
                            <SelectItem value="CFR">CFR (Culture Fit)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-48">
                        <Input
                          type="date"
                          value={slotDateFilter}
                          onChange={(e) => setSlotDateFilter(e.target.value)}
                          placeholder="Select Date"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {slotsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No slots found
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-auto max-h-[600px]">
                        <Table>
                          <TableHeader className="sticky top-0 bg-muted/30 z-10">
                            <TableRow className="bg-muted/30">
                              <TableHead className="font-semibold min-w-[200px]">Created By</TableHead>
                              <TableHead className="font-semibold min-w-[120px]">Slot type</TableHead>
                              <TableHead className="font-semibold min-w-[120px]">Date</TableHead>
                              <TableHead className="font-semibold min-w-[150px]">Time</TableHead>
                              <TableHead className="font-semibold min-w-[120px]">Status</TableHead>
                              <TableHead className="font-semibold min-w-[100px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {slots.map((slot: any) => (
                              <TableRow key={slot.id} className="hover:bg-muted/20 transition-colors">
                                <TableCell className="min-w-[200px]">
                                  <div>
                                    <div className="font-medium">{slot.user_name || `User #${slot.created_by}`}</div>
                                    <div className="text-xs text-muted-foreground">{slot.user_email}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="min-w-[120px]">
                                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                    {slot.slot_type || "Not Specified"}
                                  </Badge>
                                </TableCell>

                                <TableCell className="font-medium whitespace-nowrap min-w-[120px]">
                                  {formatDate(slot.date)}
                                </TableCell>
                                <TableCell className="text-sm whitespace-nowrap min-w-[150px]">
                                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                </TableCell>
                                <TableCell className="min-w-[120px]">
                                  {getStatusBadge(slot.status || 'Available')}
                                </TableCell>
                                <TableCell className="min-w-[100px]">
                                  {slot.status?.toLowerCase() === "available" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedSlotForScheduling(slot);
                                        setIsScheduleModalOpen(true);
                                      }}
                                      className="flex items-center gap-1 text-primary hover:bg-primary/5 border-primary/20 shadow-soft hover:shadow-medium transition-all"
                                      title="Schedule interview"
                                    >
                                      <Video className="w-4 h-4" />
                                      <span>Schedule</span>
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {slotTotalCount > 0 && (
                      <div className="flex justify-between items-center mt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {((slotCurrentPage - 1) * itemsPerPage) + 1} – {Math.min(slotCurrentPage * itemsPerPage, slotTotalCount)} of {slotTotalCount}
                        </p>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-muted-foreground">Rows:</label>
                            <select
                              value={itemsPerPage}
                              onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setSlotCurrentPage(1);
                              }}
                              className="border rounded px-2 py-1 bg-white text-sm"
                            >
                              <option value={10}>10</option>
                              <option value={20}>20</option>
                              <option value={50}>50</option>
                              <option value={100}>100</option>
                            </select>
                          </div>
                          <button
                            onClick={() => setSlotCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={slotCurrentPage === 1}
                            className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <span className="px-3 py-1 text-sm">
                            Page {slotCurrentPage} of {slotTotalPages}
                          </span>
                          <button
                            onClick={() => setSlotCurrentPage(prev => Math.min(slotTotalPages, prev + 1))}
                            disabled={slotCurrentPage === slotTotalPages}
                            className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* My Interviews Tab */}
            <TabsContent value="my-interviews" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5" />
                    My Scheduled Interviews
                  </CardTitle>
                  <div className="flex gap-3 items-center flex-wrap">
                    <div className="w-48">
                      <Input
                        type="date"
                        value={myInterviewDateFilter}
                        onChange={(e) => setMyInterviewDateFilter(e.target.value)}
                        placeholder="Filter by date"
                      />
                    </div>
                    {myInterviewDateFilter && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMyInterviewDateFilter("")}
                      >
                        Clear
                      </Button>
                    )}
                    <div className="flex-1" />
                    <Button
                      className="bg-primary hover:bg-primary/90 text-white"
                      onClick={() => navigate("/schedule")}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Manage Available Slots
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {myInterviewsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : myInterviews.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No interviews found for the selected criteria
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-auto max-h-[600px] w-full">
                      <Table>
                        <TableHeader className="sticky top-0 bg-muted/30 z-10">
                          <TableRow className="bg-muted/30">
                            <TableHead className="font-semibold min-w-[200px]">Applicant</TableHead>
                            <TableHead className="font-semibold min-w-[150px]">Title</TableHead>
                            <TableHead className="font-semibold min-w-[120px]">Date</TableHead>
                            <TableHead className="font-semibold min-w-[150px]">Time</TableHead>
                            <TableHead className="font-semibold min-w-[120px]">Status</TableHead>
                            <TableHead className="font-semibold min-w-[100px]">Meeting Link</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {myInterviews.map((interview: any) => (
                            <TableRow key={interview.id} className="hover:bg-muted/20 transition-colors">
                              <TableCell className="min-w-[200px]">
                                <div
                                  className="cursor-pointer hover:bg-muted p-2 rounded-md transition-colors group"
                                  onClick={() => {
                                    if (interview.student_id) {
                                      setSelectedApplicant({ id: interview.student_id });
                                      setIsApplicantModalOpen(true);
                                    }
                                  }}
                                >
                                  <div className="font-medium text-foreground group-hover:text-foreground">
                                    {interview.student_name || `Student #${interview.student_id}`}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{interview.student_email || "N/A"}</div>
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap min-w-[150px]">
                                <span className="font-medium">{interview.title || "Interview"}</span>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm min-w-[120px]">
                                {formatDate(interview.date || interview.start_time)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm min-w-[150px]">
                                {formatTime(interview.start_time)} - {formatTime(interview.end_time)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap min-w-[120px]">
                                {getStatusBadge(interview.status)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap min-w-[100px]">
                                {interview.meeting_link ? (
                                  <a
                                    href={interview.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-primary hover:underline"
                                  >
                                    <Video className="w-4 h-4" />
                                    <span>Join</span>
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground text-sm">No Link</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <ApplicantModal
        applicant={selectedApplicant}
        isOpen={isApplicantModalOpen}
        onClose={() => setIsApplicantModalOpen(false)}
      />
      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setSelectedSlotForScheduling(null);
        }}
        slotData={selectedSlotForScheduling ? {
          ...selectedSlotForScheduling,
          interviewer_name: selectedSlotForScheduling.user_name,
          interviewer_email: selectedSlotForScheduling.user_email
        } : null}
        allAvailableSlots={slots}
        onSchedule={handleAdminScheduleMeet}
        isLoading={schedulingInProgress}
      />
    </div >
  );
}

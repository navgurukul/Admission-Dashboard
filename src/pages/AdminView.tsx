import { useState, useEffect } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Calendar, Clock, AlertCircle, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { getAllSlots, getAllInterviewSchedules } from "@/utils/api";
import { ApplicantModal } from "@/components/ApplicantModal";

export default function AdminView() {
  const [activeTab, setActiveTab] = useState("interviews");
  const [interviews, setInterviews] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

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

  // Pagination states
  const [interviewCurrentPage, setInterviewCurrentPage] = useState(1);
  const [slotCurrentPage, setSlotCurrentPage] = useState(1);
  const [interviewTotalPages, setInterviewTotalPages] = useState(1);
  const [interviewTotalCount, setInterviewTotalCount] = useState(0);
  const [slotTotalPages, setSlotTotalPages] = useState(1);
  const [slotTotalCount, setSlotTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
        colorClass = "bg-orange-500";
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
    // Simple check if it is full ISO string or just time
    if (timeString.includes('T')) {
      return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return timeString;
  };


  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdmissionsSidebar />

      <div className="flex-1 md:ml-64 min-w-0">
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin View</h1>
            <p className="text-gray-600 mt-2">
              Overview of all scheduled interviews and created slots
            </p>
          </div>

          <Tabs defaultValue="interviews" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger
                value="interviews"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                Scheduled Interviews
              </TabsTrigger>
              <TabsTrigger
                value="slots"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                Created Slots
              </TabsTrigger>
            </TabsList>

            {/* Interviews Tab */}
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
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : interviews.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No scheduled interviews found
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-auto max-h-[600px] w-full">
                      <Table>
                        <TableHeader className="sticky top-0 bg-gray-50 z-10">
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold min-w-[200px]">Applicant</TableHead>
                            <TableHead className="font-semibold min-w-[200px]">Interviewer</TableHead>
                            <TableHead className="font-semibold min-w-[150px]">Title</TableHead>
                            <TableHead className="font-semibold min-w-[120px]">Date</TableHead>
                            <TableHead className="font-semibold min-w-[120px]">Status</TableHead>
                            <TableHead className="font-semibold min-w-[100px]">Meeting Link</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {interviews.map((interview: any) => (
                            <TableRow key={interview.id} className="hover:bg-orange-50 transition-colors">
                              <TableCell className="min-w-[200px]">
                                <div
                                  className="cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors group"
                                  onClick={() => {
                                    if (interview.student_id) {
                                      setSelectedApplicant({ id: interview.student_id });
                                      setIsApplicantModalOpen(true);
                                    }
                                  }}
                                >
                                  <div className="font-medium text-black-600 group-hover:text-black-800 flex items-center gap-2">
                                    {interview.student_name || "Unknown"}
                                    {/* <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /> */}
                                  </div>
                                  <div className="text-xs text-gray-500">{interview.student_email || "N/A"}</div>
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[200px]">
                                <div>
                                  <div className="font-medium">{interview.interviewer_name || "Not Assigned"}</div>
                                  <div className="text-xs text-gray-500">{interview.interviewer_email || "N/A"}</div>
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap min-w-[150px]">
                                <span className="font-medium">{interview.title || "No Title"}</span>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm min-w-[120px]">
                                {formatDate(interview.slot_date)}
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
                                    className="flex items-center gap-1 text-orange-600 hover:underline"
                                  >
                                    <Video className="w-4 h-4" />
                                    <span>Join</span>
                                  </a>
                                ) : (
                                  <span className="text-gray-400 text-sm">No Link</span>
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

            {/* Slots Tab */}
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
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No slots found
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-auto max-h-[600px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-gray-50 z-10">
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold min-w-[200px]">Created By</TableHead>
                            <TableHead className="font-semibold min-w-[120px]">Slot type</TableHead>
                            <TableHead className="font-semibold min-w-[120px]">Date</TableHead>
                            <TableHead className="font-semibold min-w-[150px]">Time</TableHead>
                            <TableHead className="font-semibold min-w-[120px]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {slots.map((slot: any) => (
                            <TableRow key={slot.id} className="hover:bg-orange-50 transition-colors">
                              <TableCell className="min-w-[200px]">
                                <div>
                                  <div className="font-medium">{slot.user_name || `User #${slot.created_by}`}</div>
                                  <div className="text-xs text-gray-500">{slot.user_email}</div>
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[120px]">
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
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
          </Tabs>
        </div>
      </div>
      <ApplicantModal
        applicant={selectedApplicant}
        isOpen={isApplicantModalOpen}
        onClose={() => setIsApplicantModalOpen(false)}
      />
    </div>
  );
}

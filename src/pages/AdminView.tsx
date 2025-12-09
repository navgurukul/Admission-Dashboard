import { useState, useEffect } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Calendar, Clock, User, MessageSquare, MapPin, AlertCircle, Filter, Mail, Link, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getScheduledInterviews, getMyAvailableSlots, ScheduledInterview } from "@/utils/api";

// Use the API type directly or extend it if needed for UI state
interface UIInterview extends ScheduledInterview {
  applicant_name?: string; // Optional if not directly available in ScheduledInterview yet
  student_email?: string;
  interviewer_name?: string;
}

interface Slot {
  id: number;
  start_time: string;
  end_time: string;
  date: string;
  is_booked: boolean;
  status: string;
  created_by?: number;
  created_by_name?: string;
  slot_type?: string;
}

export default function AdminView() {
  const [interviews, setInterviews] = useState<UIInterview[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredInterviews, setFilteredInterviews] = useState<UIInterview[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<Slot[]>([]);

  // Search and filter states for interviews
  const [interviewSearchTerm, setInterviewSearchTerm] = useState("");
  const [interviewDateFilter, setInterviewDateFilter] = useState("");

  // Search and filter states for slots
  const [slotSearchTerm, setSlotSearchTerm] = useState("");
  const [slotDateFilter, setSlotDateFilter] = useState("");

  // Pagination states
  const [interviewCurrentPage, setInterviewCurrentPage] = useState(1);
  const [slotCurrentPage, setSlotCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyInterviewFilters();
    setInterviewCurrentPage(1);
  }, [interviews, interviewDateFilter, interviewSearchTerm]);

  useEffect(() => {
    applySlotFilters();
    setSlotCurrentPage(1);
  }, [slots, slotDateFilter, slotSearchTerm]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchInterviews(), fetchSlots()]);
    setLoading(false);
  };

  const fetchInterviews = async () => {
    try {
      const data = await getScheduledInterviews();
      if (!data || data.length === 0) {
        const dummyInterviews: UIInterview[] = [
          {
            id: 1,
            student_id: 101,
            slot_id: 201,
            title: "LR (Learning Round)",
            description: "Technical assessment and learning capabilities",
            meeting_link: "https://meet.google.com/abc-defg-hij",
            status: "scheduled",
            created_at: "2025-12-10T10:00:00Z",
            updated_at: "2025-12-10T10:00:00Z",
            applicant_name: "Rahul Kumar",
            student_email: "rahul.k@example.com",
            interviewer_name: "Priya Sharma"
          },
          {
            id: 2,
            student_id: 102,
            slot_id: 202,
            title: "CFR (Culture Fit Round)",
            description: "Cultural alignment and team fit discussion",
            meeting_link: "https://meet.google.com/xyz-uvwx-yz",
            status: "completed",
            created_at: "2025-12-08T14:30:00Z",
            updated_at: "2025-12-08T15:30:00Z",
            applicant_name: "Priya Sharma",
            student_email: "priya.s@example.com",
            interviewer_name: "Amit Singh"
          },
          {
            id: 3,
            student_id: 103,
            slot_id: 203,
            title: "LR (Learning Round)",
            description: "Problem solving and learning approach",
            meeting_link: "",
            status: "cancelled",
            created_at: "2025-12-12T11:00:00Z",
            updated_at: "2025-12-12T11:00:00Z",
            applicant_name: "Amit Patel",
            student_email: "amit.p@example.com",
            interviewer_name: "Neha Gupta"
          },
          {
            id: 4,
            student_id: 104,
            slot_id: 204,
            title: "CFR (Culture Fit Round)",
            description: "Values alignment and motivation discussion",
            meeting_link: "https://meet.google.com/pqr-stuv-wxy",
            status: "scheduled",
            created_at: "2025-12-15T14:00:00Z",
            updated_at: "2025-12-15T14:00:00Z",
            applicant_name: "Sneha Reddy",
            student_email: "sneha.r@example.com",
            interviewer_name: "Rajesh Kumar"
          }
        ];
        setInterviews(dummyInterviews);
      } else {
        setInterviews(data);
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
      // Fallback to dummy data on error
      const dummyInterviews: UIInterview[] = [
        {
          id: 1,
          student_id: 101,
          slot_id: 201,
          title: "LR (Learning Round)",
          description: "Technical assessment and learning capabilities",
          meeting_link: "https://meet.google.com/abc-defg-hij",
          status: "scheduled",
          created_at: "2025-12-10T10:00:00Z",
          updated_at: "2025-12-10T10:00:00Z",
          applicant_name: "Rahul Kumar",
          student_email: "rahul.k@example.com",
          interviewer_name: "Priya Sharma"
        },
        {
          id: 2,
          student_id: 102,
          slot_id: 202,
          title: "CFR (Culture Fit Round)",
          description: "Cultural alignment and team fit discussion",
          meeting_link: "https://meet.google.com/xyz-uvwx-yz",
          status: "completed",
          created_at: "2025-12-08T14:30:00Z",
          updated_at: "2025-12-08T15:30:00Z",
          applicant_name: "Priya Sharma",
          student_email: "priya.s@example.com",
          interviewer_name: "Amit Singh"
        }
      ];
      setInterviews(dummyInterviews);
    }
  };

  const fetchSlots = async () => {
    try {
      const data = await getMyAvailableSlots();
      if (!data || (Array.isArray(data) && data.length === 0)) {
        const dummySlots: Slot[] = [
          {
            id: 1,
            start_time: "09:00:00",
            end_time: "10:00:00",
            date: "2025-12-15",
            is_booked: false,
            status: "available",
            created_by: 1,
            created_by_name: "Admin User",
            slot_type: "LR (Learning Round)"
          },
          {
            id: 2,
            start_time: "14:00:00",
            end_time: "15:00:00",
            date: "2025-12-15",
            is_booked: true,
            status: "booked",
            created_by: 1,
            created_by_name: "Admin User",
            slot_type: "CFR (Culture Fit Round)"
          },
          {
            id: 3,
            start_time: "11:00:00",
            end_time: "12:00:00",
            date: "2025-12-16",
            is_booked: false,
            status: "available",
            created_by: 2,
            created_by_name: "Priya Sharma",
            slot_type: "LR (Learning Round)"
          },
          {
            id: 4,
            start_time: "16:00:00",
            end_time: "17:00:00",
            date: "2025-12-16",
            is_booked: false,
            status: "available",
            created_by: 2,
            created_by_name: "Amit Singh",
            slot_type: "CFR (Culture Fit Round)"
          }
        ];
        setSlots(dummySlots);
      } else {
        setSlots(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      // Fallback dummy data
      const dummySlots: Slot[] = [
        {
          id: 1,
          start_time: "09:00:00",
          end_time: "10:00:00",
          date: "2025-12-15",
          is_booked: false,
          status: "available",
          created_by: 1,
          created_by_name: "Admin User",
          slot_type: "LR (Learning Round)"
        },
        {
          id: 2,
          start_time: "14:00:00",
          end_time: "15:00:00",
          date: "2025-12-15",
          is_booked: true,
          status: "booked",
          created_by: 1,
          created_by_name: "Admin User",
          slot_type: "CFR (Culture Fit Round)"
        }
      ];
      setSlots(dummySlots);
    }
  };

  const applyInterviewFilters = () => {
    let filtered = [...interviews];

    if (interviewSearchTerm) {
      const searchLower = interviewSearchTerm.toLowerCase();
      filtered = filtered.filter(interview => {
        return (
          interview.applicant_name?.toLowerCase().includes(searchLower) ||
          interview.student_email?.toLowerCase().includes(searchLower) ||
          interview.interviewer_name?.toLowerCase().includes(searchLower) ||
          interview.title?.toLowerCase().includes(searchLower)
        );
      });
    }

    if (interviewDateFilter) {
      filtered = filtered.filter(interview => {
        return interview.created_at?.includes(interviewDateFilter);
      });
    }

    setFilteredInterviews(filtered);
  };

  const applySlotFilters = () => {
    let filtered = [...slots];

    if (slotSearchTerm) {
      const searchLower = slotSearchTerm.toLowerCase();
      filtered = filtered.filter(slot => {
        return (
          slot.created_by_name?.toLowerCase().includes(searchLower) ||
          slot.slot_type?.toLowerCase().includes(searchLower)
        );
      });
    }

    if (slotDateFilter) {
      filtered = filtered.filter(slot =>
        slot.date.includes(slotDateFilter)
      );
    }

    setFilteredSlots(filtered);
  };

  // Pagination helpers
  const getPaginatedData = <T,>(data: T[], currentPage: number): T[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (dataLength: number): number => {
    return Math.ceil(dataLength / itemsPerPage);
  };

  const paginatedInterviews = getPaginatedData(filteredInterviews, interviewCurrentPage);
  const paginatedSlots = getPaginatedData(filteredSlots, slotCurrentPage);
  const interviewTotalPages = getTotalPages(filteredInterviews.length);
  const slotTotalPages = getTotalPages(filteredSlots.length);

  const getStatusBadge = (status: string) => {
    let colorClass = "bg-gray-500";
    switch (status?.toLowerCase()) {
      case "scheduled":
      case "active":
        colorClass = "bg-blue-500";
        break;
      case "completed":
      case "booked":
        colorClass = "bg-green-500";
        break;
      case "cancelled":
        colorClass = "bg-red-500";
        break;
      case "available":
        colorClass = "bg-orange-500";
        break;
    }
    return <Badge className={`${colorClass} text-white hover:${colorClass}`}>{status}</Badge>;
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

      <div className="flex-1 md:ml-64">
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin View</h1>
            <p className="text-gray-600 mt-2">
              Overview of all scheduled interviews and created slots
            </p>
          </div>

          <Tabs defaultValue="interviews" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 ">
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
                  <div className="flex gap-3 items-center">
                    <div className="max-w-md">
                      <Input
                        placeholder="Search by name, email, interviewer..."
                        value={interviewSearchTerm}
                        onChange={(e) => setInterviewSearchTerm(e.target.value)}
                        className="w-full"
                      />
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
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : filteredInterviews.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No scheduled interviews found
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">ID</TableHead>
                            <TableHead className="font-semibold">Title</TableHead>
                            <TableHead className="font-semibold">Applicant</TableHead>
                            <TableHead className="font-semibold">Interviewer</TableHead>
                            <TableHead className="font-semibold">Meeting Link</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedInterviews.map((interview) => (
                            <TableRow key={interview.id} className="hover:bg-orange-50 transition-colors">
                              <TableCell className="font-medium">#{interview.id}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4 text-gray-500" />
                                  {interview.title || "No Title"}
                                </div>
                                <div className="text-xs text-gray-400 mt-1 max-w-[200px] truncate">{interview.description}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{interview.applicant_name || "Unknown"}</div>
                                <div className="text-xs text-gray-500">{interview.student_email}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">{interview.interviewer_name || "Not Assigned"}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {interview.meeting_link ? (
                                  <a
                                    href={interview.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-blue-600 hover:underline"
                                  >
                                    <Video className="w-4 h-4" />
                                    Join
                                  </a>
                                ) : (
                                  <span className="text-gray-400 text-sm">No Link</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {formatDate(interview.created_at)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(interview.status)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {filteredInterviews.length > 0 && (
                    <div className="flex items-center justify-between mt-4 px-2">
                      <p className="text-sm text-gray-600">
                        Showing {((interviewCurrentPage - 1) * itemsPerPage) + 1} to {Math.min(interviewCurrentPage * itemsPerPage, filteredInterviews.length)} of {filteredInterviews.length} interviews
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInterviewCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={interviewCurrentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(interviewTotalPages, 5) }, (_, i) => i + 1).map(page => (
                            <Button
                              key={page}
                              variant={page === interviewCurrentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => setInterviewCurrentPage(page)}
                              className={page === interviewCurrentPage ? "bg-orange-500 hover:bg-orange-600" : ""}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInterviewCurrentPage(prev => Math.min(interviewTotalPages, prev + 1))}
                          disabled={interviewCurrentPage === interviewTotalPages}
                        >
                          Next
                        </Button>
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
                  <div className="flex gap-3 items-center">
                    <div className="max-w-md">
                      <Input
                        placeholder="Search by creator name, slot type..."
                        value={slotSearchTerm}
                        onChange={(e) => setSlotSearchTerm(e.target.value)}
                        className="w-full"
                      />
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
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : filteredSlots.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No slots found
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">Created By</TableHead>
                            <TableHead className="font-semibold">Slot type</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Time</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedSlots.map((slot) => (
                            <TableRow key={slot.id} className="hover:bg-orange-50 transition-colors">
                                <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">{slot.created_by_name || `User #${slot.created_by}`}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                  {slot.slot_type || "Not Specified"}
                                </Badge>
                              </TableCell>
                              
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  {formatDate(slot.date)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(slot.is_booked ? 'Booked' : 'Available')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {filteredSlots.length > 0 && (
                    <div className="flex items-center justify-between mt-4 px-2">
                      <p className="text-sm text-gray-600">
                        Showing {((slotCurrentPage - 1) * itemsPerPage) + 1} to {Math.min(slotCurrentPage * itemsPerPage, filteredSlots.length)} of {filteredSlots.length} slots
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSlotCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={slotCurrentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(slotTotalPages, 5) }, (_, i) => i + 1).map(page => (
                            <Button
                              key={page}
                              variant={page === slotCurrentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSlotCurrentPage(page)}
                              className={page === slotCurrentPage ? "bg-orange-500 hover:bg-orange-600" : ""}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSlotCurrentPage(prev => Math.min(slotTotalPages, prev + 1))}
                          disabled={slotCurrentPage === slotTotalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

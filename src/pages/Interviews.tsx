import { useState, useEffect } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Calendar, Clock, User, MessageSquare, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { getScheduledInterviews, type ScheduledInterview } from "@/utils/api";

const Interviews = () => {
  const [interviews, setInterviews] = useState<ScheduledInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInterviewData();
  }, []);

  const handleSchedules = () => {
    navigate("/schedule");
  };

  const fetchInterviewData = async () => {
    try {
      setLoading(true);

      // Fetch all interviews without date filter
      const data = await getScheduledInterviews();

      // console.log(`Successfully fetched ${data?.length || 0} interview records`);
      // console.log("Interview data:", data);
      setInterviews(data || []);
    } catch (error) {
      console.error("Error fetching interview data:", error);
      toast({
        title: "Error",
        description: "Failed to load interview data",
        variant: "destructive",
      });
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (date: string) => {
    try {
      setLoading(true);
      setSelectedDate(date);

      // If date is empty, fetch all interviews
      if (!date) {
        const data = await getScheduledInterviews();
        // console.log(`Fetched all interviews: ${data?.length || 0} records`);
        setInterviews(data || []);
      } else {
        // Fetch interviews for selected date
        const data = await getScheduledInterviews(date);
        // console.log(`Fetched interviews for ${date}: ${data?.length || 0} records`);
        setInterviews(data || []);
      }
    } catch (error) {
      console.error("Error fetching interviews by date:", error);
      toast({
        title: "Error",
        description: "Failed to load interviews for selected date",
        variant: "destructive",
      });
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "N/A";

    try {
      // Handle both ISO string and time-only formats
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return dateString;
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />

      <main className="md:ml-64 overflow-auto h-screen">
        <div className="p-4 md:p-8 pt-16 md:pt-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Interviews
            </h1>
            <p className="text-muted-foreground">
              Manage interview schedules and feedback
            </p>
          </div>

          <div className="bg-card rounded-xl shadow-soft border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Interview Records
                  {selectedDate && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      (Filtered by: {formatDate(selectedDate)})
                    </span>
                  )}
                </h2>
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex items-center gap-2">
                    Select Date
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    />
                    {selectedDate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDateChange("")}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Button
                    className="bg-gradient-primary hover:bg-primary/90 text-white"
                    onClick={handleSchedules}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Manage Available Slots
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                      Applicant Name
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                      Email
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                      Title
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                      Date
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
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-4 text-center text-muted-foreground"
                      >
                        Loading interviews...
                      </td>
                    </tr>
                  ) : interviews.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-4 text-center text-muted-foreground"
                      >
                        {selectedDate
                          ? "No interviews found for selected date"
                          : "No interview records found"}
                      </td>
                    </tr>
                  ) : (
                    interviews.map((interview) => (
                      <tr
                        key={interview.id}
                        className="border-b border-border hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {/* <User className="w-4 h-4 text-muted-foreground" /> */}
                            <span className="font-medium text-foreground">
                              {interview.student_name ||
                                `Student #${interview.student_id}`}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {/* <Mail className="w-4 h-4 text-muted-foreground" /> */}
                            <span className="text-sm text-foreground">
                              {interview.student_email || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {/* <MessageSquare className="w-4 h-4 text-muted-foreground" /> */}
                            <span className="text-sm text-foreground">
                              {interview.title || "Interview"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {/* <Calendar className="w-4 h-4 text-muted-foreground" /> */}
                            <span className="text-sm text-foreground">
                              {formatDate(
                                interview.date || interview.start_time,
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">
                              {formatTime(interview.start_time)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">
                              {formatTime(interview.end_time)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <StatusBadge status={interview.status as any} />
                        </td>
                        <td className="p-4">
                          <Button
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            size="sm"
                            onClick={() =>
                              interview.meeting_link &&
                              window.open(interview.meeting_link, "_blank")
                            }
                            disabled={!interview.meeting_link}
                          >
                            Join Meeting
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Interviews;

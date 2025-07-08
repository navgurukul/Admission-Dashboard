import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Calendar, Clock, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";

const mockInterviews = [
  {
    id: "INT001",
    applicantName: "Priya Sharma",
    applicantId: "NGK001",
    type: "Learning Round",
    interviewer: "Dr. Sarah Johnson",
    date: "2024-01-15",
    time: "10:00 AM",
    status: "scheduled" as const,
    feedback: ""
  },
  {
    id: "INT002",
    applicantName: "Rajesh Kumar",
    applicantId: "NGK002",
    type: "Cultural Fit",
    interviewer: "Prof. Michael Chen",
    date: "2024-01-15",
    time: "2:00 PM",
    status: "completed" as const,
    feedback: "Strong communication skills, good cultural fit"
  },
  {
    id: "INT003",
    applicantName: "Anjali Patel",
    applicantId: "NGK003",
    type: "Learning Round",
    interviewer: "Dr. Sarah Johnson",
    date: "2024-01-16",
    time: "11:00 AM",
    status: "scheduled" as const,
    feedback: ""
  }
];

const Interviews = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <AdmissionsSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
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
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Today's Interviews</h2>
                <Button className="bg-gradient-primary hover:bg-primary/90 text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Interview
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Applicant</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Interviewer</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Date & Time</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockInterviews.map((interview) => (
                    <tr key={interview.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{interview.applicantName}</p>
                          <p className="text-sm text-muted-foreground">{interview.applicantId}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{interview.type}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{interview.interviewer}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-foreground">{interview.date}</p>
                            <p className="text-xs text-muted-foreground">{interview.time}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={interview.status === "scheduled" ? "screening-test-pass" : "onboarded"} />
                      </td>
                      <td className="p-4">
                        <Button variant="outline" size="sm">
                          {interview.status === "scheduled" ? "Start Interview" : "View Feedback"}
                        </Button>
                      </td>
                    </tr>
                  ))}
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
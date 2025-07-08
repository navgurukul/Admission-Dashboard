import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Mail, UserCheck, UserX, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";

const mockFinalDecisions = [
  {
    id: "NGK001",
    name: "Priya Sharma",
    phone: "+91 9876543210",
    qualifiedProgram: "School of Programming",
    status: "onboarded" as const,
    offerDate: "2024-01-15",
    responseDate: "2024-01-17",
    joinDate: "2024-02-01",
    notes: "Enthusiastic about the program"
  },
  {
    id: "NGK002",
    name: "Rajesh Kumar",
    phone: "+91 8765432109",
    qualifiedProgram: "School of Business",
    status: "offer-accepted" as const,
    offerDate: "2024-01-16",
    responseDate: "2024-01-18",
    joinDate: "2024-02-01",
    notes: "Confirmed attendance"
  },
  {
    id: "NGK003",
    name: "Anjali Patel",
    phone: "+91 7654321098",
    qualifiedProgram: "School of Programming",
    status: "offer-sent" as const,
    offerDate: "2024-01-17",
    responseDate: null,
    joinDate: "2024-02-01",
    notes: "Waiting for response"
  },
  {
    id: "NGK009",
    name: "Sita Devi",
    phone: "+91 9988554433",
    qualifiedProgram: "School of Business",
    status: "offer-declined" as const,
    offerDate: "2024-01-14",
    responseDate: "2024-01-16",
    joinDate: null,
    notes: "Family obligations"
  }
];

const FinalDecisions = () => {
  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />
      
      <main className="ml-64 overflow-auto h-screen">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Final Decisions
            </h1>
            <p className="text-muted-foreground">
              Manage offers, acceptances, and onboarding process
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Offers Sent</p>
                  <p className="text-2xl font-bold text-foreground">45</p>
                </div>
                <div className="w-12 h-12 bg-status-pending/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-status-pending" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Offers Accepted</p>
                  <p className="text-2xl font-bold text-foreground">32</p>
                </div>
                <div className="w-12 h-12 bg-status-active/10 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-status-active" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Successfully Onboarded</p>
                  <p className="text-2xl font-bold text-foreground">28</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending Responses</p>
                  <p className="text-2xl font-bold text-foreground">8</p>
                </div>
                <div className="w-12 h-12 bg-status-pending/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-status-pending" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-soft border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Final Decision Pipeline</h2>
                <Button className="bg-gradient-primary hover:bg-primary/90 text-white">
                  Send Offer Letters
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Applicant</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Program</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Offer Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Response Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Join Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockFinalDecisions.map((applicant) => (
                    <tr key={applicant.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary text-sm font-medium">
                              {applicant.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{applicant.name}</p>
                            <p className="text-sm text-muted-foreground">{applicant.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-foreground">{applicant.qualifiedProgram}</td>
                      <td className="p-4">
                        <StatusBadge status={applicant.status} />
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{applicant.offerDate}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {applicant.responseDate || "Pending"}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {applicant.joinDate || "N/A"}
                      </td>
                      <td className="p-4">
                        <Button variant="outline" size="sm">
                          {applicant.status === "offer-sent" ? "Send Reminder" : "View Details"}
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

export default FinalDecisions;
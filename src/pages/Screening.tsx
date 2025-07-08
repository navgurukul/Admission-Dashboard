import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { ClipboardCheck, TrendingUp, Target, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";

const mockScreeningData = [
  {
    id: "NGK001",
    name: "Priya Sharma",
    phone: "+91 9876543210",
    city: "Mumbai",
    state: "Maharashtra",
    testScore: 16,
    qualifiedProgram: "School of Programming",
    status: "screening-test-pass" as const,
    testDate: "2024-01-10",
    timeSpent: "45 mins"
  },
  {
    id: "NGK002",
    name: "Rajesh Kumar",
    phone: "+91 8765432109",
    city: "Delhi",
    state: "Delhi",
    testScore: 14,
    qualifiedProgram: "School of Business",
    status: "screening-test-pass" as const,
    testDate: "2024-01-09",
    timeSpent: "52 mins"
  },
  {
    id: "NGK007",
    name: "Amit Patel",
    phone: "+91 7766554433",
    city: "Pune",
    state: "Maharashtra",
    testScore: 11,
    qualifiedProgram: null,
    status: "screening-test-fail" as const,
    testDate: "2024-01-08",
    timeSpent: "38 mins"
  }
];

const Screening = () => {
  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />
      
      <main className="ml-64 overflow-auto h-screen">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Screening Tests
            </h1>
            <p className="text-muted-foreground">
              Monitor online assessment results and qualifications
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Tests Taken</p>
                  <p className="text-2xl font-bold text-foreground">245</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ClipboardCheck className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Programming Track</p>
                  <p className="text-2xl font-bold text-foreground">89</p>
                </div>
                <div className="w-12 h-12 bg-status-active/10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-status-active" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Business Track</p>
                  <p className="text-2xl font-bold text-foreground">67</p>
                </div>
                <div className="w-12 h-12 bg-status-prospect/10 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-status-prospect" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Average Score</p>
                  <p className="text-2xl font-bold text-foreground">13.4</p>
                </div>
                <div className="w-12 h-12 bg-status-pending/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-status-pending" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-soft border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Recent Test Results</h2>
                <Button className="bg-gradient-primary hover:bg-primary/90 text-white">
                  Export Results
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Applicant</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Test Score</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Qualified Program</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Test Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Time Spent</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockScreeningData.map((applicant) => (
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
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className={`text-2xl font-bold ${
                            applicant.testScore >= 15 ? 'text-status-active' : 
                            applicant.testScore >= 12 ? 'text-status-prospect' : 
                            'text-status-fail'
                          }`}>
                            {applicant.testScore}
                          </span>
                          <span className="text-sm text-muted-foreground">/ 20</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-foreground">
                          {applicant.qualifiedProgram || "Not Qualified"}
                        </span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={applicant.status} />
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{applicant.testDate}</td>
                      <td className="p-4 text-sm text-muted-foreground">{applicant.timeSpent}</td>
                      <td className="p-4">
                        <Button variant="outline" size="sm">
                          View Details
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

export default Screening;
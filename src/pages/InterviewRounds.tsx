import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";

const mockInterviewRounds = [
  {
    id: "NGK001",
    name: "Priya Sharma",
    phone: "+91 9876543210",
    learningRound: {
      status: "learner-round-pass" as const,
      interviewer: "Dr. Sarah Johnson",
      date: "2024-01-10",
      score: 8.5,
      feedback: "Strong technical understanding"
    },
    culturalFitRound: {
      status: "cultural-fit-pass" as const,
      interviewer: "Prof. Michael Chen",
      date: "2024-01-12",
      score: 9.0,
      feedback: "Excellent cultural fit"
    },
    overallStatus: "cultural-fit-pass" as const
  },
  {
    id: "NGK002",
    name: "Rajesh Kumar",
    phone: "+91 8765432109",
    learningRound: {
      status: "learner-round-pass" as const,
      interviewer: "Dr. Sarah Johnson",
      date: "2024-01-11",
      score: 7.5,
      feedback: "Good problem-solving skills"
    },
    culturalFitRound: {
      status: "screening-test-pass" as const,
      interviewer: "Prof. Michael Chen",
      date: "2024-01-15",
      score: null,
      feedback: ""
    },
    overallStatus: "learner-round-pass" as const
  },
  {
    id: "NGK008",
    name: "Ravi Sharma",
    phone: "+91 8899776655",
    learningRound: {
      status: "learner-round-fail" as const,
      interviewer: "Dr. Sarah Johnson",
      date: "2024-01-09",
      score: 5.0,
      feedback: "Needs improvement in technical skills"
    },
    culturalFitRound: {
      status: "no-show" as const,
      interviewer: null,
      date: null,
      score: null,
      feedback: ""
    },
    overallStatus: "learner-round-fail" as const
  }
];

const InterviewRounds = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <AdmissionsSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Interview Rounds
            </h1>
            <p className="text-muted-foreground">
              Track Learning Round and Cultural Fit interview progress
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Learning Round Pass</p>
                  <p className="text-2xl font-bold text-foreground">89</p>
                </div>
                <div className="w-12 h-12 bg-status-active/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-status-active" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Cultural Fit Pass</p>
                  <p className="text-2xl font-bold text-foreground">67</p>
                </div>
                <div className="w-12 h-12 bg-status-active/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-status-active" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending Interviews</p>
                  <p className="text-2xl font-bold text-foreground">23</p>
                </div>
                <div className="w-12 h-12 bg-status-pending/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-status-pending" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Interview Failures</p>
                  <p className="text-2xl font-bold text-foreground">15</p>
                </div>
                <div className="w-12 h-12 bg-status-fail/10 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-status-fail" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-soft border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Interview Progress</h2>
                <Button className="bg-gradient-primary hover:bg-primary/90 text-white">
                  Schedule Next Round
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Applicant</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Learning Round</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Cultural Fit Round</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Overall Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockInterviewRounds.map((applicant) => (
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
                        <div className="space-y-1">
                          <StatusBadge status={applicant.learningRound.status} />
                          {applicant.learningRound.score && (
                            <p className="text-xs text-muted-foreground">
                              Score: {applicant.learningRound.score}/10
                            </p>
                          )}
                          {applicant.learningRound.interviewer && (
                            <p className="text-xs text-muted-foreground">
                              {applicant.learningRound.interviewer}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {applicant.culturalFitRound.status === "no-show" && !applicant.culturalFitRound.interviewer ? (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          ) : (
                            <>
                              <StatusBadge status={applicant.culturalFitRound.status} />
                              {applicant.culturalFitRound.score && (
                                <p className="text-xs text-muted-foreground">
                                  Score: {applicant.culturalFitRound.score}/10
                                </p>
                              )}
                              {applicant.culturalFitRound.interviewer && (
                                <p className="text-xs text-muted-foreground">
                                  {applicant.culturalFitRound.interviewer}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={applicant.overallStatus} />
                      </td>
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

export default InterviewRounds;
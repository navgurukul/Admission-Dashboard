import { useState, useEffect } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Calendar, Clock, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

type ApplicantData = {
  id: string;
  mobile_no: string;
  unique_number: string | null;
  name: string | null;
  lr_status: string | null;
  cfr_status: string | null;
  lr_comments: string | null;
  cfr_comments: string | null;
  date_of_testing: string | null;
};

const Interviews = () => {
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user: googleUser } = useGoogleAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInterviewData();
  }, []);

  const handleSchedules =()=>{
      navigate("/schedule");
  }
  const fetchInterviewData = async () => {
    try {
      setLoading(true);

      if (!googleUser) {
        setApplicants([]);
        return;
      }

      // Fetch applicants who are in interview stages (have lr_status or cfr_status)
      const { data, error } = await supabase
        .from("admission_dashboard")
        .select(
          "id, mobile_no, unique_number, name, lr_status, cfr_status, lr_comments, cfr_comments, date_of_testing"
        )
        .or("lr_status.not.is.null,cfr_status.not.is.null")
        .order("date_of_testing", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log(
        `Successfully fetched ${data?.length || 0} interview records`
      );
      setApplicants(data || []);
    } catch (error) {
      console.error("Error fetching interview data:", error);
      toast({
        title: "Error",
        description: "Failed to load interview data",
        variant: "destructive",
      });
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const getInterviewType = (applicant: ApplicantData): string => {
    if (applicant.cfr_status) return "Cultural Fit";
    if (applicant.lr_status) return "Learning Round";
    return "Interview";
  };

  const getInterviewStatus = (applicant: ApplicantData): string => {
    if (applicant.cfr_status) return applicant.cfr_status;
    if (applicant.lr_status) return applicant.lr_status;
    return "scheduled";
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
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  Interview Records
                </h2>
                <div className="flex flex-col gap-4 md:flex-row">
                  {/* <Button className="bg-gradient-primary hover:bg-primary/90 text-white">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Interview
                  </Button> */}
                  <Button className="bg-gradient-primary hover:bg-primary/90 text-white" onClick={ handleSchedules}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Interview
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                      Applicant
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                      Type
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                      Date
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                      Status
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                      Comments
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
                        colSpan={6}
                        className="p-4 text-center text-muted-foreground"
                      >
                        Loading interviews...
                      </td>
                    </tr>
                  ) : applicants.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-4 text-center text-muted-foreground"
                      >
                        No interview records found
                      </td>
                    </tr>
                  ) : (
                    applicants.map((applicant) => (
                      <tr
                        key={applicant.id}
                        className="border-b border-border hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground">
                              {applicant.name || "N/A"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {applicant.unique_number || applicant.mobile_no}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">
                              {getInterviewType(applicant)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">
                              {applicant.date_of_testing
                                ? new Date(
                                    applicant.date_of_testing
                                  ).toLocaleDateString()
                                : "Not scheduled"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <StatusBadge
                            status={getInterviewStatus(applicant) as any}
                          />
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-foreground">
                            {applicant.cfr_comments ||
                              applicant.lr_comments ||
                              "No comments"}
                          </span>
                        </td>
                        <td className="p-4">
                          <Button variant="outline" size="sm">
                            View Details
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

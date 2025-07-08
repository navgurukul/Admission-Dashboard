
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Mail, UserCheck, UserX, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type ApplicantData = {
  id: string;
  mobile_no: string;
  unique_number: string | null;
  name: string | null;
  city: string | null;
  block: string | null;
  date_of_testing: string | null;
  final_marks: number | null;
  qualifying_school: string | null;
  lr_status: string | null;
  lr_comments: string | null;
  cfr_status: string | null;
  cfr_comments: string | null;
  offer_letter_status: string | null;
  allotted_school: string | null;
  joining_status: string | null;
  final_notes: string | null;
  triptis_notes: string | null;
  whatsapp_number: string | null;
  caste: string | null;
  gender: string | null;
  qualification: string | null;
  current_work: string | null;
  set_name: string | null;
  exam_centre: string | null;
  created_at: string;
  updated_at: string;
};

const FinalDecisions = () => {
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Filter for Final Decisions stage
  const getFinalDecisionApplicants = (data: ApplicantData[]) => {
    return data.filter(applicant => {
      // In Final Decisions (have joined or have offer letter status)
      if (applicant.joining_status === 'Joined' || applicant.joining_status === 'joined' || applicant.offer_letter_status) {
        return true;
      }
      
      return false;
    });
  };

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('No active session, skipping data fetch');
        setApplicants([]);
        return;
      }

      const { data, error } = await supabase
        .from('admission_dashboard')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const finalDecisionApplicants = getFinalDecisionApplicants(data || []);
      setApplicants(finalDecisionApplicants);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      toast({
        title: "Error",
        description: "Failed to load applicants data",
        variant: "destructive",
      });
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();

    // Set up real-time subscription
    const channel = supabase
      .channel('final_decisions_page_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admission_dashboard'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchApplicants();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up final decisions page subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const offersSent = applicants.filter(a => a.offer_letter_status).length;
  const offersAccepted = applicants.filter(a => 
    a.offer_letter_status?.toLowerCase().includes('accept') || 
    a.joining_status?.toLowerCase().includes('join')
  ).length;
  const onboarded = applicants.filter(a => 
    a.joining_status === 'Joined' || a.joining_status === 'joined'
  ).length;
  const pendingResponses = applicants.filter(a => 
    a.offer_letter_status && !a.joining_status
  ).length;

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
                  <p className="text-2xl font-bold text-foreground">{offersSent}</p>
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
                  <p className="text-2xl font-bold text-foreground">{offersAccepted}</p>
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
                  <p className="text-2xl font-bold text-foreground">{onboarded}</p>
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
                  <p className="text-2xl font-bold text-foreground">{pendingResponses}</p>
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
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Allotted School</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Offer Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Joining Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading applicants...</span>
                        </div>
                      </td>
                    </tr>
                  ) : applicants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center space-y-2">
                          <UserCheck className="w-8 h-8 opacity-50" />
                          <span>No applicants in final decisions stage</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    applicants.map((applicant) => (
                      <tr key={applicant.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-primary text-sm font-medium">
                                {applicant.name ? applicant.name.split(' ').map(n => n[0]).join('') : '?'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{applicant.name || 'No Name'}</p>
                              <p className="text-sm text-muted-foreground">{applicant.unique_number || 'No ID'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-foreground">
                          {applicant.allotted_school || 'Not Assigned'}
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-foreground">
                            {applicant.offer_letter_status || 'No Offer'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-foreground">
                            {applicant.joining_status || 'Pending'}
                          </span>
                        </td>
                        <td className="p-4">
                          <Button variant="outline" size="sm">
                            {applicant.offer_letter_status && !applicant.joining_status ? "Send Reminder" : "View Details"}
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

export default FinalDecisions;

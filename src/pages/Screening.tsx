import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { ClipboardCheck, TrendingUp, Target, Award, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  stage: string | null;
  status: string | null;
};

const Screening = () => {
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Filter for Screening Tests stage using new stage field
  const getScreeningApplicants = (data: ApplicantData[]) => {
    return data.filter(applicant => {
      return applicant.stage === 'screening';
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

      const screeningApplicants = getScreeningApplicants(data || []);
      setApplicants(screeningApplicants);
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
      .channel('screening_page_changes')
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
      console.log('Cleaning up screening page subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredApplicants = applicants.filter(applicant =>
    (applicant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     applicant.mobile_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
     applicant.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     applicant.unique_number?.toLowerCase().includes(searchQuery.toLowerCase())) ?? false
  );

  const testsTaken = filteredApplicants.length;
  const programmingTrack = filteredApplicants.filter(a => a.qualifying_school?.toLowerCase().includes('programming')).length;
  const businessTrack = filteredApplicants.filter(a => a.qualifying_school?.toLowerCase().includes('business')).length;
  const averageScore = filteredApplicants.length > 0 ? 
    (filteredApplicants.reduce((sum, a) => sum + (a.final_marks || 0), 0) / filteredApplicants.length).toFixed(1) : 0;

  const getStatusDisplay = (applicant: ApplicantData): string => {
    if (applicant.status === 'pass') {
      if (applicant.qualifying_school?.toLowerCase().includes('programming')) {
        return 'Qualified for SOP';
      } else if (applicant.qualifying_school?.toLowerCase().includes('business')) {
        return 'Qualified for SOB';
      }
      return 'Pass';
    }
    return applicant.status || 'pending';
  };

  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />
      
      <main className="md:ml-64 overflow-auto h-screen">
        <div className="p-4 md:p-8 pt-16 md:pt-8">
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
                  <p className="text-2xl font-bold text-foreground">{testsTaken}</p>
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
                  <p className="text-2xl font-bold text-foreground">{programmingTrack}</p>
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
                  <p className="text-2xl font-bold text-foreground">{businessTrack}</p>
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
                  <p className="text-2xl font-bold text-foreground">{averageScore}</p>
                </div>
                <div className="w-12 h-12 bg-status-pending/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-status-pending" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Test Results</h2>
                <Button className="bg-gradient-primary hover:bg-primary/90 text-white">
                  Export Results
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, phone, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-muted/30 sticky top-0">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Applicant</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Test Score</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Test Date</th>
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
                  ) : filteredApplicants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center space-y-2">
                          <ClipboardCheck className="w-8 h-8 opacity-50" />
                          <span>{searchQuery ? 'No applicants found matching your search' : 'No applicants in screening stage'}</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredApplicants.map((applicant) => (
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
                              <p className="text-sm text-muted-foreground">{applicant.mobile_no}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-lg font-bold ${
                            (applicant.final_marks || 0) >= 27 ? 'text-status-active' : 
                            (applicant.final_marks || 0) >= 18 ? 'text-status-prospect' : 
                            'text-status-fail'
                          }`}>
                            {applicant.final_marks || 0}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-foreground font-medium">
                            {getStatusDisplay(applicant)}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {applicant.date_of_testing ? new Date(applicant.date_of_testing).toLocaleDateString() : 'N/A'}
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

            {/* Show total count */}
            <div className="px-6 py-4 border-t border-border/50 bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Showing {filteredApplicants.length} of {applicants.length} applicants
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Screening;

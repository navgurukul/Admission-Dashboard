import { useState, useEffect } from "react";
import { Search, Filter, Plus, MoreHorizontal, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "./StatusBadge";
import { ApplicantModal } from "./ApplicantModal";
import { AddApplicantModal } from "./AddApplicantModal";
import CSVImportModal from "./CSVImportModal";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Search as SearchIcon, 
  Filter as FilterIcon, 
  Plus as PlusIcon, 
  Upload as UploadIcon, 
  Download as DownloadIcon, 
  Eye,
  ClipboardCheck
} from "lucide-react";

// Define the type for our applicant data
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

// Function to map current stage based on applicant data
const getCurrentStage = (applicant: ApplicantData): string => {
  // Check if onboarded (Final Decisions)
  if (applicant.joining_status === 'Joined' || applicant.joining_status === 'joined') {
    return 'Final Decisions';
  }
  
  // Check if in interview stage (Interview Rounds)
  if (applicant.lr_status || applicant.cfr_status) {
    return 'Interview Rounds';
  }
  
  // Check if screening test completed (Screening Tests)
  if (applicant.final_marks !== null || applicant.qualifying_school) {
    return 'Screening Tests';
  }
  
  // Default to initial stage (Sourcing & Outreach)
  return 'Sourcing & Outreach';
};

export function ApplicantTable() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  let supabase: any = undefined;
  try {
    supabase = require("@/integrations/supabase/client").supabase;
  } catch {}

  // Fetch applicants from Supabase and set up real-time subscription
  useEffect(() => {
    if (!supabase || !user) return;
    let isMounted = true;
    const checkAndFetch = async () => {
      if (!supabase || !user) return;
      if (isMounted) fetchApplicants();
    };
    checkAndFetch();
    return () => { isMounted = false; };
  }, [user]);

  const fetchApplicants = async () => {
    if (!supabase || !user) return;
    try {
      setLoading(true);
      if (!supabase.from) {
        setLoading(false);
        setApplicants([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('admission_dashboard')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching applicants:', error);
        setApplicants([]);
        return;
      }
      
      setApplicants(data || []);
    } catch (error) {
      console.error('Error in fetchApplicants:', error);
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplicants = applicants.filter(applicant =>
    (applicant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     applicant.mobile_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
     applicant.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     applicant.unique_number?.toLowerCase().includes(searchQuery.toLowerCase())) ?? false
  );

  const handleViewApplicant = (applicant: ApplicantData) => {
    setSelectedApplicant(applicant);
    setIsModalOpen(true);
  };

  const handleExportCSV = async () => {
    try {
      const { data, error } = await supabase
        .from('admission_dashboard')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const headers = [
        'unique_number',
        'set_name', 
        'exam_centre',
        'date_of_testing',
        'name',
        'mobile_no',
        'whatsapp_number',
        'block',
        'city',
        'caste',
        'gender',
        'qualification',
        'current_work',
        'final_marks',
        'qualifying_school',
        'lr_status',
        'lr_comments',
        'cfr_status',
        'cfr_comments',
        'offer_letter_status',
        'allotted_school',
        'joining_status',
        'final_notes',
        'triptis_notes'
      ];

      const csvContent = headers.join(',') + '\n' + 
        data.map(row => headers.map(header => {
          const value = row[header as keyof typeof row];
          return value ? `"${value}"` : '';
        }).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admission_dashboard_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "CSV file downloaded successfully",
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Error",
        description: "Failed to export CSV file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-soft border border-border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">All Applicants</h2>
            <p className="text-muted-foreground text-sm mt-1">Manage and track applicant progress</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="h-9">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="h-9">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              className="bg-gradient-primary hover:bg-primary/90 text-white h-9"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Applicant
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, phone, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Clean Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">Applicant</th>
              <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">Stage</th>
              <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">Status</th>
              <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">Location</th>
              <th className="text-center py-4 px-6 font-medium text-muted-foreground text-sm w-20">Actions</th>
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
                    <Search className="w-8 h-8 opacity-50" />
                    <span>No applicants found</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredApplicants.map((applicant, index) => (
                <tr 
                  key={applicant.id} 
                  className="border-b border-border/30 hover:bg-muted/30 transition-colors group"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-sm font-medium">
                          {applicant.name ? applicant.name.split(' ').map(n => n[0]).join('') : '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {applicant.name || 'No Name'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {applicant.mobile_no}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-foreground font-medium">
                      {getCurrentStage(applicant)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={(applicant.offer_letter_status || applicant.joining_status || 'pending') as any} />
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-foreground">
                      {applicant.city ? `${applicant.city}${applicant.block ? `, ${applicant.block}` : ''}` : 'Not specified'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewApplicant(applicant);
                      }}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                      <span className="sr-only">More options</span>
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

      {/* Modals */}
      <ApplicantModal
        applicant={selectedApplicant}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
      <AddApplicantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchApplicants}
      />
      
      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchApplicants}
      />
    </div>
  );
}

import { useState, useEffect } from "react";
import { Search, Filter, Plus, Eye, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "./StatusBadge";
import { ApplicantModal } from "./ApplicantModal";
import { AddApplicantModal } from "./AddApplicantModal";
import { CSVImportModal } from "./CSVImportModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Define the type for our applicant data
type ApplicantData = {
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

export function ApplicantTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch applicants from Supabase
  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admission_dashboard')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setApplicants(data || []);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      toast({
        title: "Error",
        description: "Failed to load applicants data",
        variant: "destructive",
      });
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">All Applicants</h2>
            <p className="text-muted-foreground text-sm">Manage and track applicant progress</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              className="bg-gradient-primary hover:bg-primary/90 text-white"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Applicant
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search applicants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">#</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">Applicant Name</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">Applicant ID</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">Current Stage</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">Location</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">Last Interaction</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-muted-foreground">
                  Loading applicants...
                </td>
              </tr>
            ) : filteredApplicants.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-muted-foreground">
                  No applicants found
                </td>
              </tr>
            ) : (
              filteredApplicants.map((applicant, index) => (
                <tr 
                  key={applicant.mobile_no} 
                  className="border-b border-border hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => handleViewApplicant(applicant)}
                >
                  <td className="p-4 text-sm text-muted-foreground">{index + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary text-sm font-medium">
                          {applicant.name ? applicant.name.split(' ').map(n => n[0]).join('') : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{applicant.name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{applicant.mobile_no}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-mono text-foreground">{applicant.unique_number || 'N/A'}</td>
                  <td className="p-4 text-sm text-foreground">{applicant.lr_status || applicant.cfr_status || 'Pending'}</td>
                  <td className="p-4">
                    <StatusBadge status={(applicant.offer_letter_status || applicant.joining_status || 'pending') as any} />
                  </td>
                  <td className="p-4 text-sm text-foreground">
                    {applicant.city ? `${applicant.city}${applicant.block ? `, ${applicant.block}` : ''}` : 'N/A'}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {applicant.date_of_testing ? new Date(applicant.date_of_testing).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewApplicant(applicant);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
import { useState, useEffect } from "react";
import { Search, Filter, Plus, MoreHorizontal, Upload, Download, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "./StatusBadge";
import { ApplicantModal } from "./ApplicantModal";
import { AddApplicantModal } from "./AddApplicantModal";
import CSVImportModal from "./CSVImportModal";
import { AdvancedFilterModal } from "./AdvancedFilterModal";
import { InlineEditModal } from "./InlineEditModal";
import { BulkUpdateModal } from "./BulkUpdateModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  stage: string | null;
  status: string | null;
  interview_mode: string | null;
  exam_mode: string | null;
  partner: string | null;
  district: string | null;
  market: string | null;
  interview_date: string | null;
  last_updated: string | null;
  created_at: string;
  updated_at: string;
};

interface FilterState {
  stage: string;
  status: string;
  examMode: string;
  interviewMode: string;
  partner: string[];
  district: string[];
  market: string[];
  dateRange: {
    type: 'application' | 'lastUpdate' | 'interview';
    from?: Date;
    to?: Date;
  };
}

const getStatusDisplay = (applicant: ApplicantData): string => {
  if (applicant.stage === 'screening' && applicant.status === 'pass') {
    if (applicant.qualifying_school?.toLowerCase().includes('programming')) {
      return 'Qualified for SOP';
    } else if (applicant.qualifying_school?.toLowerCase().includes('business')) {
      return 'Qualified for SOB';
    }
    return 'Pass';
  }
  
  return applicant.status || 'pending';
};

export function ApplicantTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [isInlineEditOpen, setIsInlineEditOpen] = useState(false);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    stage: 'all',
    status: 'all',
    examMode: 'all',
    interviewMode: 'all',
    partner: [],
    district: [],
    market: [],
    dateRange: { type: 'application' }
  });
  const { toast } = useToast();

  // Fetch applicants from Supabase and set up real-time subscription
  useEffect(() => {
    fetchApplicants();

    // Set up real-time subscription for automatic updates
    const channel = supabase
      .channel('admission_dashboard_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admission_dashboard'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Refetch data when changes occur
          fetchApplicants();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      
      // Check authentication state
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('No active session, skipping data fetch');
        setApplicants([]);
        return;
      }

      console.log('Fetching applicants with authenticated session');
      const { data, error } = await supabase
        .from('admission_dashboard')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log(`Successfully fetched ${data?.length || 0} applicants`);
      setApplicants(data || []);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load applicants data",
        variant: "destructive",
      });
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data: ApplicantData[]) => {
    return data.filter(applicant => {
      // Text search
      const matchesSearch = !searchQuery || 
        (applicant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         applicant.mobile_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
         applicant.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         applicant.unique_number?.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Stage filter - updated to handle 'all'
      if (filters.stage && filters.stage !== 'all' && applicant.stage !== filters.stage) return false;

      // Status filter - updated to handle 'all'
      if (filters.status && filters.status !== 'all' && applicant.status !== filters.status) return false;

      // Exam mode filter - updated to handle 'all'
      if (filters.examMode && filters.examMode !== 'all' && applicant.exam_mode !== filters.examMode) return false;

      // Interview mode filter - updated to handle 'all'
      if (filters.interviewMode && filters.interviewMode !== 'all' && applicant.interview_mode !== filters.interviewMode) return false;

      // Partner filter
      if (filters.partner.length > 0 && (!applicant.partner || !filters.partner.includes(applicant.partner))) return false;

      // District filter
      if (filters.district.length > 0 && (!applicant.district || !filters.district.includes(applicant.district))) return false;

      // Market filter
      if (filters.market.length > 0 && (!applicant.market || !filters.market.includes(applicant.market))) return false;

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        let dateToCheck: Date | null = null;
        
        switch (filters.dateRange.type) {
          case 'application':
            dateToCheck = applicant.created_at ? new Date(applicant.created_at) : null;
            break;
          case 'lastUpdate':
            dateToCheck = applicant.last_updated ? new Date(applicant.last_updated) : null;
            break;
          case 'interview':
            dateToCheck = applicant.interview_date ? new Date(applicant.interview_date) : null;
            break;
        }

        if (!dateToCheck) return false;
        if (filters.dateRange.from && dateToCheck < filters.dateRange.from) return false;
        if (filters.dateRange.to && dateToCheck > filters.dateRange.to) return false;
      }

      return true;
    });
  };

  const filteredApplicants = applyFilters(applicants);

  const handleViewApplicant = (applicant: ApplicantData) => {
    setSelectedApplicant(applicant);
    setIsModalOpen(true);
  };

  const handleInlineEdit = (applicant: ApplicantData) => {
    setSelectedApplicant(applicant);
    setIsInlineEditOpen(true);
  };

  const handleSelectApplicant = (applicantId: string) => {
    setSelectedApplicants(prev => 
      prev.includes(applicantId) 
        ? prev.filter(id => id !== applicantId)
        : [...prev, applicantId]
    );
  };

  const handleSelectAll = () => {
    if (selectedApplicants.length === filteredApplicants.length) {
      setSelectedApplicants([]);
    } else {
      setSelectedApplicants(filteredApplicants.map(a => a.id));
    }
  };

  const handleExportCSV = async () => {
    try {
      const { data, error } = await supabase
        .from('admission_dashboard')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const headers = [
        'unique_number', 'set_name', 'exam_centre', 'date_of_testing', 'name', 'mobile_no', 'whatsapp_number',
        'block', 'city', 'district', 'market', 'caste', 'gender', 'qualification', 'current_work', 'partner',
        'final_marks', 'qualifying_school', 'lr_status', 'lr_comments', 'cfr_status', 'cfr_comments',
        'offer_letter_status', 'allotted_school', 'joining_status', 'final_notes', 'triptis_notes',
        'stage', 'status', 'exam_mode', 'interview_mode', 'interview_date', 'last_updated'
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
            {selectedApplicants.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setIsBulkUpdateOpen(true)} 
                className="h-9"
              >
                Bulk Update ({selectedApplicants.length})
              </Button>
            )}
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
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9"
            onClick={() => setIsAdvancedFilterOpen(true)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filter
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-muted/30 sticky top-0">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm w-12">
                  <input
                    type="checkbox"
                    checked={selectedApplicants.length === filteredApplicants.length && filteredApplicants.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
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
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading applicants...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredApplicants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center space-y-2">
                      <Search className="w-8 h-8 opacity-50" />
                      <span>No applicants found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApplicants.map((applicant) => (
                  <tr 
                    key={applicant.id} 
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedApplicants.includes(applicant.id)}
                        onChange={() => handleSelectApplicant(applicant.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
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
                      <span className="text-sm text-foreground font-medium capitalize">
                        {applicant.stage || 'contact'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={getStatusDisplay(applicant) as any} />
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-foreground">
                        {applicant.city ? `${applicant.city}${applicant.block ? `, ${applicant.block}` : ''}` : 'Not specified'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInlineEdit(applicant);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="sr-only">Quick edit</span>
                        </Button>
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
                      </div>
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
            {selectedApplicants.length > 0 && ` • ${selectedApplicants.length} selected`}
          </p>
        </div>
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

      <AdvancedFilterModal
        isOpen={isAdvancedFilterOpen}
        onClose={() => setIsAdvancedFilterOpen(false)}
        onApplyFilters={setFilters}
        currentFilters={filters}
      />

      <InlineEditModal
        applicant={selectedApplicant}
        isOpen={isInlineEditOpen}
        onClose={() => setIsInlineEditOpen(false)}
        onSuccess={fetchApplicants}
      />

      <BulkUpdateModal
        selectedApplicants={selectedApplicants}
        isOpen={isBulkUpdateOpen}
        onClose={() => setIsBulkUpdateOpen(false)}
        onSuccess={() => {
          fetchApplicants();
          setSelectedApplicants([]);
        }}
      />
    </div>
  );
}

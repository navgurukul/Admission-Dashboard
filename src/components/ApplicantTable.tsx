
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Filter, Search, Edit, Trash2, Mail, MoreHorizontal, Upload, Download } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { AddApplicantModal } from "./AddApplicantModal";
import { AdvancedFilterModal } from "./AdvancedFilterModal";
import { BulkUpdateModal } from "./BulkUpdateModal";
import { ApplicantModal } from "./ApplicantModal";
import { InlineEditModal } from "./InlineEditModal";
import { ApplicantCommentsModal } from "./ApplicantCommentsModal";
import CSVImportModal from "./CSVImportModal";
import { CampusSelector } from "./CampusSelector";
import { useToast } from "@/hooks/use-toast";

type StatusType = 
  | "pending" 
  | "active" 
  | "inactive" 
  | "qualified" 
  | "disqualified"
  | "pass"
  | "fail"
  | "booked"
  | "rescheduled"
  | "lr_qualified"
  | "lr_failed"
  | "cfr_qualified"
  | "cfr_failed"
  | "offer_pending"
  | "offer_sent"
  | "offer_rejected"
  | "offer_accepted"
  | "Qualified for SOP"
  | "Qualified for SOB";

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

const ApplicantTable = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [applicantToView, setApplicantToView] = useState<any | null>(null);
  const [applicantToEditInline, setApplicantToEditInline] = useState<any | null>(null);
  const [applicantForComments, setApplicantForComments] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [cellValue, setCellValue] = useState("");
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

  const { data: applicants, isLoading, refetch } = useQuery({
    queryKey: ["applicants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admission_dashboard")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching applicants:", error);
        toast({
          title: "Error",
          description: "Failed to fetch applicants",
          variant: "destructive",
        });
      }
      return data;
    },
  });

  const filteredApplicants = useMemo(() => {
    if (!applicants) return [];

    return applicants.filter((applicant) => {
      const searchRegex = new RegExp(searchTerm, "i");
      return (
        searchRegex.test(applicant.name || "") ||
        searchRegex.test(applicant.mobile_no) ||
        searchRegex.test(applicant.unique_number || "")
      );
    });
  }, [applicants, searchTerm]);

  const handleCheckboxChange = (id: string) => {
    setSelectedRows((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((rowId) => rowId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAllRows = () => {
    if (filteredApplicants?.length === selectedRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredApplicants?.map((applicant) => applicant.id) || []);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select applicants to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("admission_dashboard")
        .delete()
        .in("id", selectedRows);

      if (error) {
        console.error("Error deleting applicants:", error);
        toast({
          title: "Error",
          description: "Failed to delete applicants",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Applicants Deleted",
          description: "Successfully deleted selected applicants",
        });
        setSelectedRows([]);
        refetch();
      }
    } catch (error) {
      console.error("Error deleting applicants:", error);
      toast({
        title: "Error",
        description: "Failed to delete applicants",
        variant: "destructive",
      });
    }
  };

  const handleSendOfferLetters = async () => {
    if (selectedRows.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select applicants to send offer letters to",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-offer-letters', {
        body: {
          applicantIds: selectedRows,
          templateIds: {
            offer_letter: 'default-offer-letter-id',
            consent_en: 'default-consent-en-id',
            consent_hi: 'default-consent-hi-id',
            checklist_en: 'default-checklist-en-id',
            checklist_hi: 'default-checklist-hi-id'
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Offer Letters Sent",
        description: `Successfully sent offer letters to ${selectedRows.length} applicants`
      });

      setSelectedRows([]);
      refetch();
    } catch (error) {
      console.error('Error sending offer letters:', error);
      toast({
        title: "Error",
        description: "Failed to send offer letters",
        variant: "destructive"
      });
    }
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const exportToCSV = () => {
    if (!filteredApplicants || filteredApplicants.length === 0) {
      toast({
        title: "No Data",
        description: "No applicants to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'mobile_no', 'unique_number', 'name', 'city', 'block', 'caste', 'gender',
      'qualification', 'current_work', 'qualifying_school', 'whatsapp_number',
      'set_name', 'exam_centre', 'date_of_testing', 'lr_status', 'lr_comments',
      'cfr_status', 'cfr_comments', 'final_marks', 'offer_letter_status',
      'allotted_school', 'joining_status', 'final_notes', 'triptis_notes',
      'campus', 'stage', 'status'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredApplicants.map(applicant => 
        headers.map(header => {
          const value = applicant[header];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `applicants_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredApplicants.length} applicants to CSV`,
    });
  };

  const startCellEdit = (id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setCellValue(currentValue || "");
  };

  const saveCellEdit = async () => {
    if (!editingCell) return;

    try {
      const { error } = await supabase
        .from("admission_dashboard")
        .update({ 
          [editingCell.field]: cellValue,
          last_updated: new Date().toISOString()
        })
        .eq("id", editingCell.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Field updated successfully",
      });

      setEditingCell(null);
      setCellValue("");
      refetch();
    } catch (error) {
      console.error('Error updating field:', error);
      toast({
        title: "Error",
        description: "Failed to update field",
        variant: "destructive",
      });
    }
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
    setCellValue("");
  };

  const EditableCell = ({ applicant, field, displayValue }: { applicant: any, field: string, displayValue: any }) => {
    const isEditing = editingCell?.id === applicant.id && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={cellValue}
            onChange={(e) => setCellValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveCellEdit();
              if (e.key === 'Escape') cancelCellEdit();
            }}
            className="h-8 text-xs"
            autoFocus
          />
          <Button size="sm" onClick={saveCellEdit} className="h-6 px-2">
            ✓
          </Button>
          <Button size="sm" variant="outline" onClick={cancelCellEdit} className="h-6 px-2">
            ✕
          </Button>
        </div>
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[24px]"
        onClick={() => startCellEdit(applicant.id, field, displayValue)}
        title="Click to edit"
      >
        {displayValue || "Click to add"}
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Applicants</CardTitle>
            <CardDescription>
              {filteredApplicants?.length || 0} applicants found
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedRows.length > 0 && (
              <div className="flex items-center gap-2 mr-4">
                <Badge variant="secondary">{selectedRows.length} selected</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkUpdate(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bulk Update
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendOfferLetters}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Offer Letters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
            <Button
              onClick={() => setShowCSVImport(true)}
              variant="outline"
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={() => setShowAdvancedFilters(true)}
              variant="outline"
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button onClick={() => setShowAddModal(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Applicant
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search applicants..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 border rounded-md overflow-hidden">
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 border-b">
                <TableRow>
                  <TableHead className="w-[50px] font-bold">
                    <Checkbox
                      checked={
                        filteredApplicants?.length > 0 &&
                        selectedRows.length === filteredApplicants?.length
                      }
                      onCheckedChange={handleSelectAllRows}
                      aria-label="Select all applicants"
                    />
                  </TableHead>
                  <TableHead className="w-[200px] font-bold">Name</TableHead>
                  <TableHead className="w-[150px] font-bold">Mobile No</TableHead>
                  <TableHead className="w-[120px] font-bold">Campus</TableHead>
                  <TableHead className="w-[120px] font-bold">Stage</TableHead>
                  <TableHead className="w-[120px] font-bold">Status</TableHead>
                  <TableHead className="w-[120px] font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading applicants...
                    </TableCell>
                  </TableRow>
                ) : filteredApplicants?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No applicants found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplicants?.map((applicant) => (
                    <TableRow key={applicant.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(applicant.id)}
                          onCheckedChange={() => handleCheckboxChange(applicant.id)}
                          aria-label={`Select ${applicant.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell 
                          applicant={applicant} 
                          field="name" 
                          displayValue={applicant.name || "No name"} 
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell 
                          applicant={applicant} 
                          field="mobile_no" 
                          displayValue={applicant.mobile_no} 
                        />
                      </TableCell>
                      <TableCell>
                        <CampusSelector
                          currentCampus={applicant.campus}
                          applicantId={applicant.id}
                          onCampusChange={refetch}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={applicant.stage || "contact"}
                          onValueChange={async (value) => {
                            const { error } = await supabase
                              .from("admission_dashboard")
                              .update({ stage: value })
                              .eq("id", applicant.id);

                            if (error) {
                              toast({
                                title: "Error",
                                description: "Failed to update stage",
                                variant: "destructive",
                              });
                            } else {
                              toast({
                                title: "Stage Updated",
                                description: "Successfully updated stage",
                              });
                              refetch();
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a stage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contact">Contact</SelectItem>
                            <SelectItem value="screening">Screening</SelectItem>
                            <SelectItem value="interviews">Interviews</SelectItem>
                            <SelectItem value="decision">Decision</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={(applicant.status || "pending") as StatusType} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setApplicantToView(applicant)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setApplicantForComments(applicant)}>
                              Comments
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      <AddApplicantModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refetch}
      />

      <CSVImportModal
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        onSuccess={refetch}
      />

      <AdvancedFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />

      <BulkUpdateModal
        isOpen={showBulkUpdate}
        onClose={() => setShowBulkUpdate(false)}
        selectedApplicants={selectedRows}
        onSuccess={refetch}
      />

      <ApplicantModal
        applicant={applicantToView}
        isOpen={!!applicantToView}
        onClose={() => setApplicantToView(null)}
      />

      <ApplicantCommentsModal
        applicantId={applicantForComments?.id || ""}
        applicantName={applicantForComments?.name || ""}
        isOpen={!!applicantForComments}
        onClose={() => setApplicantForComments(null)}
      />
    </Card>
  );
};

export default ApplicantTable;

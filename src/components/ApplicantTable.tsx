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
import { Plus, Filter, Search, Edit, Trash2, Eye, Mail } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { AddApplicantModal } from "./AddApplicantModal";
import { AdvancedFilterModal } from "./AdvancedFilterModal";
import { BulkUpdateModal } from "./BulkUpdateModal";
import { ApplicantModal } from "./ApplicantModal";
import { InlineEditModal } from "./InlineEditModal";
import { useToast } from "@/hooks/use-toast";

const ApplicantTable = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [applicantToView, setApplicantToView] = useState<string | null>(null);
  const [applicantToEditInline, setApplicantToEditInline] = useState<{
    id: string;
    column: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
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

  return (
    <Card>
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

      <CardContent>
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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[2rem]">
                <Checkbox
                  checked={
                    filteredApplicants?.length > 0 &&
                    selectedRows.length === filteredApplicants?.length
                  }
                  indeterminate={
                    selectedRows.length > 0 &&
                    selectedRows.length < (filteredApplicants?.length || 0)
                  }
                  onChange={handleSelectAllRows}
                  aria-label="Select all applicants"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Mobile No</TableHead>
              <TableHead>Campus</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
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
                  <TableCell className="w-[2rem]">
                    <Checkbox
                      checked={selectedRows.includes(applicant.id)}
                      onCheckedChange={() => handleCheckboxChange(applicant.id)}
                      aria-label={`Select ${applicant.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    {applicantToEditInline?.id === applicant.id &&
                      applicantToEditInline.column === "name" ? (
                      <InlineEditModal
                        id={applicant.id}
                        column="name"
                        initialValue={applicant.name || ""}
                        onSave={refetch}
                        onCancel={() => setApplicantToEditInline(null)}
                      />
                    ) : (
                      <Button
                        variant="link"
                        onClick={() => setApplicantToView(applicant.id)}
                      >
                        {applicant.name}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {applicantToEditInline?.id === applicant.id &&
                      applicantToEditInline.column === "mobile_no" ? (
                      <InlineEditModal
                        id={applicant.id}
                        column="mobile_no"
                        initialValue={applicant.mobile_no}
                        onSave={refetch}
                        onCancel={() => setApplicantToEditInline(null)}
                      />
                    ) : (
                      <Button
                        variant="link"
                        onClick={() => setApplicantToEditInline({
                          id: applicant.id,
                          column: "mobile_no",
                        })}
                      >
                        {applicant.mobile_no}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>{applicant.campus}</TableCell>
                  <TableCell>
                    <Select
                      value={applicant.stage}
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
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sourcing">Sourcing</SelectItem>
                        <SelectItem value="screening">Screening</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="decision">Final Decision</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={applicant.status || "pending"} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setApplicantToView(applicant.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(applicant.id);
                          toast({
                            title: "Applicant ID Copied",
                            description: "Applicant ID copied to clipboard",
                          });
                        }}
                      >
                        Copy ID
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <AddApplicantModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={refetch}
      />

      <AdvancedFilterModal
        open={showAdvancedFilters}
        onOpenChange={setShowAdvancedFilters}
      />

      <BulkUpdateModal
        open={showBulkUpdate}
        onOpenChange={setShowBulkUpdate}
        selectedRows={selectedRows}
        onSuccess={refetch}
      />

      <ApplicantModal
        applicantId={applicantToView}
        open={!!applicantToView}
        onOpenChange={() => setApplicantToView(null)}
      />
    </Card>
  );
};

export default ApplicantTable;

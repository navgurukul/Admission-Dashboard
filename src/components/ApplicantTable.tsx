
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { AddApplicantModal } from "./AddApplicantModal";
import { AdvancedFilterModal } from "./AdvancedFilterModal";
import { BulkUpdateModal } from "./BulkUpdateModal";
import { ApplicantModal } from "./ApplicantModal";
import { ApplicantCommentsModal } from "./ApplicantCommentsModal";
import CSVImportModal from "./CSVImportModal";
import { useToast } from "@/hooks/use-toast";
import { BulkActions } from "./applicant-table/BulkActions";
import { TableActions } from "./applicant-table/TableActions";
import { ApplicantTableRow } from "./applicant-table/ApplicantTableRow";

const ApplicantTable = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [applicantToView, setApplicantToView] = useState<any | null>(null);
  const [applicantForComments, setApplicantForComments] = useState<any | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    stage: "all",
    status: "all",
    examMode: "all",
    interviewMode: "all",
    partner: [],
    district: [],
    market: [],
    dateRange: { type: "application" as const },
  });
  const { toast } = useToast();

  const [applicants, setApplicants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(() => {
    setIsLoading(true);
    try {
      const storedData = localStorage.getItem("applicants");
      console.log("Stored data from localStorage:", storedData);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log("Parsed applicants data:", parsedData);
        
        // Check if the data structure is correct
        if (parsedData.length > 0) {
          const firstItem = parsedData[0];
          console.log("First item structure:", firstItem);
          console.log("Available fields:", Object.keys(firstItem));
          
          // Fix data structure if needed
          const fixedData = parsedData.map((item: any) => {
            // If the data has old field names, convert them
            return {
              id: item.id || `applicant_${Date.now()}_${Math.random()}`,
              name: item.name || item.Name || '',
              mobileNo: item.mobileNo || item.mobile_no || item["Mobile No"] || item["Mobile No."] || '',
              campus: item.campus || item.allotted_school || '',
              stage: item.stage || item.lr_status || 'sourcing',
              status: item.status || item.joining_status || 'Enrollment Key Generated',
              createdAt: item.createdAt || item.created_at || new Date().toISOString(),
            };
          });
          
          console.log("Fixed data structure:", fixedData[0]);
          setApplicants(fixedData);
          
          // Save the fixed data back to localStorage
          localStorage.setItem("applicants", JSON.stringify(fixedData));
        } else {
          setApplicants(parsedData);
        }
      } else {
        console.log("No data found in localStorage");
        setApplicants([]);
      }
    } catch (error) {
      console.error("Error loading applicants from storage:", error);
      toast({
        title: "Error",
        description: "Failed to load applicants from storage",
        variant: "destructive",
      });
      setApplicants([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load data on component mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  const filteredApplicants = useMemo(() => {
    console.log("Filtering applicants:", applicants);
    if (!applicants) return [];

    const searchRegex = new RegExp(searchTerm, "i");
    const filtered = applicants.filter((applicant) => {
      return (
        searchRegex.test(applicant.name || "") ||
        searchRegex.test(applicant.mobileNo || "") ||
        searchRegex.test(applicant.campus || "")
      );
    });
    console.log("Filtered applicants:", filtered);
    return filtered;
  }, [applicants, searchTerm]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const paginatedApplicants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredApplicants.slice(startIndex, endIndex);
  }, [filteredApplicants, currentPage]);

  const totalPages = Math.ceil(filteredApplicants.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredApplicants]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleCheckboxChange = useCallback((id: string) => {
    setSelectedRows((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((rowId) => rowId !== id)
        : [...prevSelected, id]
    );
  }, []);

  const handleSelectAllRows = useCallback(() => {
    if (paginatedApplicants.length === selectedRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedApplicants.map((applicant) => applicant.id));
    }
  }, [paginatedApplicants, selectedRows.length]);

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
      // Get current data from localStorage
      const storedData = localStorage.getItem("applicants");
      let allData = [];
      
      if (storedData) {
        allData = JSON.parse(storedData);
      }
      
      // Remove selected applicants
      const updatedData = allData.filter((applicant: any) => !selectedRows.includes(applicant.id));
      
      // Save back to localStorage
      localStorage.setItem("applicants", JSON.stringify(updatedData));
      
      toast({
        title: "Applicants Deleted",
        description: "Successfully deleted selected applicants",
      });
      setSelectedRows([]);
      refetch();
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
        variant: "destructive",
      });
      return;
    }

    // For now, just show a success message since we're using localStorage
    toast({
      title: "Offer Letters Sent",
      description: `Successfully sent offer letters to ${selectedRows.length} applicants (localStorage mode)`,
    });

    setSelectedRows([]);
  };

  const handleApplyFilters = (newFilters: any) => {
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
      "mobile_no",
      "unique_number",
      "name",
      "city",
      "block",
      "caste",
      "gender",
      "qualification",
      "current_work",
      "qualifying_school",
      "whatsapp_number",
      "set_name",
      "exam_centre",
      "date_of_testing",
      "lr_status",
      "lr_comments",
      "cfr_status",
      "cfr_comments",
      "final_marks",
      "offer_letter_status",
      "allotted_school",
      "joining_status",
      "final_notes",
      "triptis_notes",
      "campus",
      "stage",
      "status",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredApplicants.map((applicant) =>
        headers
          .map((header) => {
            const value = applicant[header];
            if (value === null || value === undefined) return "";
            const stringValue = String(value);
            return stringValue.includes(",")
              ? `"${stringValue}"`
              : stringValue;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `applicants_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredApplicants.length} applicants to CSV`,
    });
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
            <BulkActions
              selectedRowsCount={selectedRows.length}
              onBulkUpdate={() => setShowBulkUpdate(true)}
              onSendOfferLetters={handleSendOfferLetters}
              onBulkDelete={handleBulkDelete}
            />
            <TableActions
              onCSVImport={() => setShowCSVImport(true)}
              onExportCSV={exportToCSV}
              onShowFilters={() => setShowAdvancedFilters(true)}
              onAddApplicant={() => setShowAddModal(true)}
            />
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
                  <TableHead className="w-12 font-bold">
                    <Checkbox
                      checked={
                        paginatedApplicants.length > 0 &&
                        selectedRows.length === paginatedApplicants.length
                      }
                      onCheckedChange={handleSelectAllRows}
                      aria-label="Select all applicants"
                    />
                  </TableHead>
                  <TableHead className="font-bold min-w-[200px] max-w-[250px]">
                    Name
                  </TableHead>
                  <TableHead className="font-bold min-w-[140px] max-w-[180px]">
                    Mobile No
                  </TableHead>
                  <TableHead className="font-bold min-w-[140px] max-w-[180px]">
                    Campus
                  </TableHead>
                  <TableHead className="font-bold min-w-[120px] max-w-[160px]">
                    Stage
                  </TableHead>
                  <TableHead className="font-bold min-w-[180px] max-w-[220px]">
                    Status
                  </TableHead>
                  <TableHead className="font-bold w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading applicants...
                    </TableCell>
                  </TableRow>
                ) : paginatedApplicants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No applicants found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedApplicants.map((applicant) => (
                    <ApplicantTableRow
                      key={applicant.id}
                      applicant={applicant}
                      isSelected={selectedRows.includes(applicant.id)}
                      onSelect={handleCheckboxChange}
                      onUpdate={refetch}
                      onViewDetails={setApplicantToView}
                      onViewComments={setApplicantForComments}
                      onCampusChange={refetch}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              Next
            </button>
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

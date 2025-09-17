
import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  getStudents,
  getAllSchools,
  getCampusesApi,
  getAllStatuses,
  getAllStages,
  deleteUser,
} from "@/utils/api";

const ApplicantTable = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);

  const [applicantToView, setApplicantToView] = useState<any | null>(null);
  const [applicantForComments, setApplicantForComments] = useState<any | null>(
    null
  );

  const [campusList, setCampusList] = useState<any[]>([]);
  const [schoolList, setSchoolsList] = useState<any[]>([]);
  const [currentstatusList, setcurrentstatusList] = useState<any[]>([]);
  const [stageList, setStageList] = useState<any[]>([]);

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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: studentsData,
    isLoading: isStudentsLoading,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: ["students", currentPage],
    queryFn: async () => {
      const res = await getStudents(currentPage, itemsPerPage);
      console.log("Fetched data:", res);
      return res;
    },
  });

  // Extract students array and total count from the response
  const students = studentsData?.data || [];
  const totalCount = studentsData?.totalCount || 0;

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [campuses, schools] = await Promise.all([
          getCampusesApi(),
          getAllSchools(),
        ]);

        setCampusList(campuses || []);
        setSchoolsList(schools || []);
      } catch (error) {
        console.error("Failed to fetch campuses/schools:", error);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [stages, statuses] = await Promise.all([
          getAllStages(),
          getAllStatuses(),
        ]);

        setStageList(stages || []);
        setcurrentstatusList(statuses || []);
      } catch (error) {
        console.error("Failed to fetch stages/statuses:", error);
      }
    };

    fetchOptions();
  }, []);

  // Map phone to mobile_no if mobile_no is missing
  const applicants = useMemo(() => {
    return (students || []).map((student) => {
      const school = schoolList.find((s) => s.id === student.school_id);
      const campus = campusList.find((c) => c.id === student.campus_id);
      const current_status = currentstatusList.find(
        (s) => s.id === student.current_status_id
      );

      return {
        ...student,
        mobile_no: student.mobile_no || student.phone_number || "",
        name: `${student.first_name || ""} ${student.middle_name || ""} ${
          student.last_name || ""
        }`.trim(),
        school_name: school ? school.school_name : "N/A",
        campus_name: campus ? campus.campus_name : "N/A",
        current_status_name: current_status
          ? current_status.current_status_name
          : "N/A",
      };
    });
  }, [students, schoolList, campusList, currentstatusList]);

  // For client-side search filtering (if needed)
  const filteredApplicants = useMemo(() => {
    if (!applicants) return [];
    
    if (!searchTerm) return applicants;

    const searchRegex = new RegExp(searchTerm, "i");
    return applicants.filter((applicant) => {
      return (
        searchRegex.test(applicant.name || "") ||
        searchRegex.test(applicant.mobile_no) ||
        searchRegex.test(applicant.unique_number || "")
      );
    });
  }, [applicants, searchTerm]);

  // For display - use filtered applicants if searching, otherwise use paginated data from server
  const displayApplicants = searchTerm ? filteredApplicants : applicants;
  
  // Calculate total pages based on whether we're searching or not
  const totalPages = searchTerm 
    ? Math.ceil(filteredApplicants.length / itemsPerPage) || 1
    : Math.ceil(totalCount / itemsPerPage) || 1;

  // Reset page when search changes
  useEffect(() => {
    if (searchTerm) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

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

  // Function to refresh data from both localStorage and database
  const refreshData = useCallback(() => {
    setCurrentPage(1);
    refetchStudents();
  }, [refetchStudents]);

  const handleSelectAllRows = useCallback(() => {
    if (displayApplicants.length === selectedRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(displayApplicants.map((applicant) => applicant.id));
    }
  }, [displayApplicants, selectedRows.length]);

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
          await Promise.all(selectedRows.map((id) => deleteUser(id)));

      toast({
        title: "Applicants Deleted",
        description:
          "Successfully deleted selected applicants from DB",
      });
      setSelectedRows([]);
      refreshData();
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
      "phone_number",
      "whatsapp_number",
      "first_name",
      "middle_name",
      "last_name",
      "dob",
      "gender",
      "email",
      "state",
      "district",
      "city",
      "pin_code",
      "current_status_id",
      "qualification_id",
      "school_medium",
      "cast_id",
      "religion_id",
      "image",
      "triptis_notes",
      "lr_status",
      "lr_comments",
      "cfr_status",
      "cfr_comments",
      "decision_status",
      "offer_letter_status",
      "joining_status",
      "allotted_school",
      "final_notes",
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
            return stringValue.includes(",") ? `"${stringValue}"` : stringValue;
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
              {searchTerm 
                ? `${filteredApplicants?.length || 0} applicants found (filtered)`
                : `${totalCount} total applicants`
              }
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
        <div className="mb-4 space-y-2">
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
                        displayApplicants.length > 0 &&
                        selectedRows.length === displayApplicants.length
                      }
                      onCheckedChange={handleSelectAllRows}
                      aria-label="Select all applicants"
                    />
                  </TableHead>

                  {/* Profile Image */}
                  <TableHead className="font-bold w-16">Image</TableHead>

                  <TableHead className="font-bold min-w-[200px] max-w-[250px]">
                    Full Name
                  </TableHead>

                  <TableHead className="font-bold min-w-[140px] max-w-[180px]">
                    Phone Number
                  </TableHead>

                  <TableHead className="font-bold min-w-[140px] max-w-[180px]">
                    WhatsApp Number
                  </TableHead>

                  <TableHead className="font-bold min-w-[120px] max-w-[160px]">
                    Gender
                  </TableHead>

                  <TableHead className="font-bold min-w-[120px] max-w-[160px]">
                    City
                  </TableHead>

                  <TableHead className="font-bold min-w-[180px] max-w-[220px]">
                    State
                  </TableHead>

                  <TableHead className="font-bold w-24">Pin Code</TableHead>

                  {/* School */}
                  <TableHead className="font-bold min-w-[180px]">
                    School
                  </TableHead>

                  {/* Campus */}
                  <TableHead className="font-bold min-w-[180px]">
                    Campus
                  </TableHead>

                  <TableHead className="w-24 font-bold">
                    Current Status
                  </TableHead>

                  <TableHead className="w-24 font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isStudentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center">
                      Loading applicants...
                    </TableCell>
                  </TableRow>
                ) : displayApplicants.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={13}
                      className="text-center text-muted-foreground py-6"
                    >
                      No applicants found.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayApplicants.map((applicant) => (
                    <ApplicantTableRow
                      key={applicant.id}
                      applicant={applicant}
                      isSelected={selectedRows.includes(applicant.id)}
                      onSelect={handleCheckboxChange}
                      onUpdate={refreshData}
                      onViewDetails={setApplicantToView}
                      onViewComments={setApplicantForComments}
                      onCampusChange={refreshData}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            {searchTerm 
              ? `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredApplicants.length)} - ${Math.min(currentPage * itemsPerPage, filteredApplicants.length)} of ${filteredApplicants.length} filtered results`
              : `Page ${currentPage} of ${totalPages} (${totalCount} total applicants)`
            }
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
        onSuccess={refreshData}
        schoolList={schoolList}
        campusList={campusList}
        currentstatusList={currentstatusList}
      />

      <CSVImportModal
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        onSuccess={refreshData}
      />

      <AdvancedFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
        students={displayApplicants}
      />

      <BulkUpdateModal
        isOpen={showBulkUpdate}
        onClose={() => setShowBulkUpdate(false)}
        selectedApplicants={selectedRows}
        onSuccess={refreshData}
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
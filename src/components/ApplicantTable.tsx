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
  deleteStudent,
  getAllReligions,
  getAllQuestionSets,
  searchStudentsApi,
  getFilterStudent,
} from "@/utils/api";

const ApplicantTable = () => {
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);

  // Applicant Modals
  const [applicantToView, setApplicantToView] = useState<any | null>(null);
  const [applicantForComments, setApplicantForComments] = useState<any | null>(
    null
  );

  // Option lists
  const [campusList, setCampusList] = useState<any[]>([]);
  const [schoolList, setSchoolsList] = useState<any[]>([]);
  const [currentstatusList, setcurrentstatusList] = useState<any[]>([]);
  const [stageList, setStageList] = useState<any[]>([]);
  const [religionList, setReligionList] = useState<any[]>([]);
  const [questionSetList, setQuestionSetList] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Search & filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    stage: "all",
    status: "all",
    examMode: "all",
    interviewMode: "all",
    partner: [],
    district: [],
    market: [],
    school: [],
    religion: [],
    qualification: [],
    currentStatus: [],
    state: undefined,
    gender: undefined,
    dateRange: { type: "application" as const, from: undefined, to: undefined },
  });

  // Selected rows
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { toast } = useToast();

  // Fetch students with server-side pagination
  const {
    data: studentsData,
    isLoading: isStudentsLoading,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: ["students", currentPage, itemsPerPage],
    queryFn: () => getStudents(currentPage, itemsPerPage),
    placeholderData: (previousData) => previousData,
  });

  const students = (studentsData as any)?.data || [];
  const totalStudents = (studentsData as any)?.totalCount || 0;
  const totalPagesFromAPI =
    (studentsData as any)?.totalPages ||
    Math.max(1, Math.ceil(totalStudents / itemsPerPage));

  // Fetch static options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [campuses, schools, religions] = await Promise.all([
          getCampusesApi(),
          getAllSchools(),
          getAllReligions(),
        ]);
        setCampusList(campuses || []);
        setSchoolsList(schools || []);
        setReligionList(religions || []);
      } catch (error) {
        // console.error("Failed to fetch campuses/schools:", error);
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
        // console.error("Failed to fetch stages/statuses:", error);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchQuestionSets = async () => {
      try {
        const response = await getAllQuestionSets();
        setQuestionSetList(response || []);
      } catch (error) {
        // console.error("Error fetching question sets:", error);
      }
    };
    fetchQuestionSets();
  }, []);

  // Map student data with related info
  const applicantsToDisplay = useMemo(() => {
    return students.map((student) => {
      const school = schoolList.find((s) => s.id === student.school_id);
      const campus = campusList.find((c) => c.id === student.campus_id);
      const current_status = currentstatusList.find(
        (s) => s.id === student.current_status_id
      );
      const religion = religionList.find((r) => r.id === student.religion_id);
      const questionSet = questionSetList.find(
        (q) => q.id === student.question_set_id
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
        religion_name: religion ? religion.religion_name : "N/A",
        question_set_name: questionSet ? questionSet.name : "N/A",
        maximumMarks: questionSet ? questionSet.maximumMarks : 0,
      };
    });
  }, [
    students,
    schoolList,
    campusList,
    currentstatusList,
    religionList,
    questionSetList,
  ]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }
      
      // Clear filters when search is performed
      setHasActiveFilters(false);
      setFilteredStudents([]);
      
      try {
        setIsSearching(true);
        const results = await searchStudentsApi(searchTerm.trim());
        setSearchResults(results || []);
      } catch (error) {
        toast({
          title: "Search Error",
          description: "Unable to fetch search results.",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  //  Use API search results if searching, otherwise show fetched students or filtered students
  const filteredApplicants = useMemo(() => {
    // Priority: 1. Search results 2. Filtered students 3. All students
    let source;
    if (searchTerm.trim()) {
      source = searchResults;
    } else if (hasActiveFilters) {
      source = filteredStudents;
    } else {
      source = applicantsToDisplay;
    }

    return source.map((student) => {
      // Handle both API response formats:
      // 1. Regular API: returns IDs (campus_id, school_id, etc.)
      // 2. Filter API: returns names directly (campus_name, school_name, etc.)
      
      const school = schoolList.find((s) => s.id === student.school_id);
      const campus = campusList.find((c) => c.id === student.campus_id);
      const current_status = currentstatusList.find(
        (s) => s.id === student.current_status_id
      );
      const religion = religionList.find((r) => r.id === student.religion_id);
      const questionSet = questionSetList.find(
        (q) => q.id === student.question_set_id
      );

      return {
        ...student,
        name: `${student.first_name || ""} ${student.middle_name || ""} ${
          student.last_name || ""
        }`.trim(),
        // Use the name from filter API if available, otherwise lookup by ID
        school_name: student.school_name || (school ? school.school_name : "N/A"),
        campus_name: student.campus_name || (campus ? campus.campus_name : "N/A"),
        current_status_name: student.current_status_name || (current_status ? current_status.current_status_name : "N/A"),
        religion_name: student.religion_name || (religion ? religion.religion_name : "N/A"),
        question_set_name: student.question_set_name || (questionSet ? questionSet.name : "N/A"),
        maximumMarks: questionSet ? questionSet.maximumMarks : 0,
        stage_name: student.stage_name || "N/A",
      };
    });
  }, [
    searchTerm,
    searchResults,
    hasActiveFilters,
    filteredStudents,
    applicantsToDisplay,
    schoolList,
    campusList,
    currentstatusList,
    religionList,
    questionSetList,
  ]);

  // Reset page when search term changes(its helpfull when seearch handle by backend API)
  // useEffect(() => setCurrentPage(1), [searchTerm]);

  // Checkbox handlers
  const handleCheckboxChange = useCallback((id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAllRows = useCallback(() => {
    setSelectedRows((prev) =>
      prev.length === filteredApplicants.length
        ? []
        : filteredApplicants.map((a) => a.id)
    );
  }, [filteredApplicants]);

  const refreshData = useCallback(async () => {
    // If searching, re-run the search to get updated data
    if (searchTerm.trim()) {
      try {
        const results = await searchStudentsApi(searchTerm.trim());
        setSearchResults(results || []);
      } catch (error) {
        console.error("Error refreshing search results:", error);
      }
    }
    // If filters are active, re-apply them to get updated data
    else if (hasActiveFilters && filters) {
      try {
        const apiParams = transformFiltersToAPI(filters);
        const results = await getFilterStudent(apiParams);
        setFilteredStudents(results || []);
      } catch (error) {
        console.error("Error refreshing filtered data:", error);
      }
    } 
    // Otherwise, refetch regular paginated data
    else {
      setCurrentPage(1);
      refetchStudents();
    }
  }, [searchTerm, hasActiveFilters, filters, refetchStudents]);

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!selectedRows.length) {
      toast({
        title: "No Selection",
        description: "Please select applicants to delete",
        variant: "destructive",
      });
      return;
    }
    try {
      await Promise.all(selectedRows.map((id) => deleteStudent(id)));
      toast({
        title: "Applicants Deleted",
        description: "Successfully deleted selected applicants",
      });
      setSelectedRows([]);
      refreshData();
    } catch (error) {
      // console.error("Error deleting applicants:", error);
      toast({
        title: "Error",
        description: "Failed to delete applicants",
        variant: "destructive",
      });
    }
  };

  const handleSendOfferLetters = async () => {
    if (!selectedRows.length) {
      toast({
        title: "No Selection",
        description: "Please select applicants to send offer letters to",
        variant: "destructive",
      });
    }
  };

  // Transform filter state to API query parameters
  const transformFiltersToAPI = (filterState: any) => {
    const apiParams: any = {};

    // Date range mapping based on type
    if (filterState.dateRange?.from && filterState.dateRange?.to) {
      const formatDate = (date: Date) => {
        const d = new Date(date);
        return d.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      };

      if (filterState.dateRange.type === 'application') {
        apiParams.created_at_from = formatDate(filterState.dateRange.from);
        apiParams.created_at_to = formatDate(filterState.dateRange.to);
      } else if (filterState.dateRange.type === 'lastUpdate') {
        apiParams.updated_at_from = formatDate(filterState.dateRange.from);
        apiParams.updated_at_to = formatDate(filterState.dateRange.to);
      } else if (filterState.dateRange.type === 'interview') {
        apiParams.interview_date_from = formatDate(filterState.dateRange.from);
        apiParams.interview_date_to = formatDate(filterState.dateRange.to);
      }
    }

    // Qualification ID
    if (filterState.qualification?.length && filterState.qualification[0] !== 'all') {
      apiParams.qualification_id = filterState.qualification[0];
    }

    // Campus ID
    if (filterState.partner?.length > 1 && filterState.partner[1] !== 'all') {
      apiParams.campus_id = filterState.partner[1];
    }

    // School ID
    if (filterState.school?.length && filterState.school[0] !== 'all') {
      apiParams.school_id = filterState.school[0];
    }

    // Current Status ID
    if (filterState.currentStatus?.length && filterState.currentStatus[0] !== 'all') {
      apiParams.current_status_id = filterState.currentStatus[0];
    }

    // State
    if (filterState.state && filterState.state !== 'all') {
      apiParams.state = filterState.state;
    }

    // District
    if (filterState.district?.length && filterState.district[0] !== 'all') {
      apiParams.district = filterState.district[0];
    }

    // Gender
    if (filterState.gender && filterState.gender !== 'all') {
      apiParams.gender = filterState.gender;
    }

    return apiParams;
  };

  // Apply filters and fetch filtered students
  const handleApplyFilters = async (newFilters: any) => {
    setFilters(newFilters);
    
    // Check if any meaningful filters are applied
    const hasFilters = 
      (newFilters.qualification?.length && newFilters.qualification[0] !== 'all') ||
      (newFilters.school?.length && newFilters.school[0] !== 'all') ||
      (newFilters.currentStatus?.length && newFilters.currentStatus[0] !== 'all') ||
      (newFilters.partner?.length > 1 && newFilters.partner[1] !== 'all') ||
      (newFilters.state && newFilters.state !== 'all') ||
      (newFilters.district?.length && newFilters.district[0] !== 'all') ||
      (newFilters.gender && newFilters.gender !== 'all') ||
      (newFilters.dateRange?.from && newFilters.dateRange?.to);

    if (!hasFilters) {
      setHasActiveFilters(false);
      setFilteredStudents([]);
      setCurrentPage(1);
      return;
    }

    // Clear search when filters are applied
    setSearchTerm("");
    setSearchResults([]);

    try {
      setIsFiltering(true);
      setHasActiveFilters(true);
      const apiParams = transformFiltersToAPI(newFilters);
      
      // Call the filter API
      const results = await getFilterStudent(apiParams);
      setFilteredStudents(results || []);
      setCurrentPage(1); // Reset to first page when filters are applied
      
      toast({
        title: "Filters Applied",
        description: `Found ${results?.length || 0} applicants matching your criteria`,
      });
    } catch (error) {
      console.error("Error applying filters:", error);
      toast({
        title: "Filter Error",
        description: "Failed to apply filters. Please try again.",
        variant: "destructive",
      });
      setFilteredStudents([]);
    } finally {
      setIsFiltering(false);
    }
  };

  const exportToCSV = () => {
    if (!filteredApplicants.length) {
      toast({
        title: "No Data",
        description: "No applicants to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      // Personal Information
      "first_name",
      "middle_name",
      "last_name",
      "dob",
      "gender",
      "email",
      "phone_number",
      "whatsapp_number",

      // Address Information
      "state",
      "district",
      "city",
      "block",
      "pin_code",

      // Academic / School Information
      "school_medium",
      // "qualification_name",
      // "qualifying_school",

      // Caste / Religion
      "cast_name",
      "religion_name",

      // Status Information
      // "current_status_name",
      // "lr_status",
      // "lr_comments",
      // "cfr_status",
      // "cfr_comments",
      // "decision_status",
      // "offer_letter_status",
      // "joining_status",

      // Additional Notes
      // "communication_notes",
      // "final_notes",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredApplicants.map((applicant: any) =>
        headers
          .map((header) => {
            const value = applicant[header];
            if (value === null || value === undefined) return "";
            const s = String(value);
            return s.includes(",") ? `"${s}"` : s;
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

  // Calculate pagination based on current view (search, filter, or regular)
  const getTotalCount = () => {
    if (searchTerm.trim()) {
      return searchResults.length;
    } else if (hasActiveFilters) {
      return filteredStudents.length;
    } else {
      return totalStudents;
    }
  };

  const currentTotalCount = getTotalCount();
  
  // Calculate total pages based on current view
  const totalPages = Math.ceil(currentTotalCount / itemsPerPage);
  
  // Apply pagination to filtered results
  const paginatedApplicants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredApplicants.slice(startIndex, endIndex);
  }, [filteredApplicants, currentPage, itemsPerPage]);

  const showingStart = paginatedApplicants.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const showingEnd = Math.min(currentPage * itemsPerPage, currentTotalCount);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
          <div className="flex flex-col mr-10">
            <CardTitle>Applicants</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {searchTerm
                ? `${filteredApplicants.length} applicants found (search)`
                : hasActiveFilters
                ? `${filteredApplicants.length} applicants found (filtered)`
                : `${totalStudents} total applicants`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
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
                  <TableHead className="sticky left-0 bg-background z-10 w-12 px-2">
                    <Checkbox
                      checked={
                        filteredApplicants.length > 0 &&
                        selectedRows.length === filteredApplicants.length
                      }
                      onCheckedChange={handleSelectAllRows}
                      aria-label="Select all applicants"
                    />
                  </TableHead>
                  <TableHead className="font-bold w-12 px-3">Image</TableHead>
                  <TableHead className="sticky left-12 bg-background z-10 min-w-[150px] px-3">
                    Full Name
                  </TableHead>
                  <TableHead className="font-bold min-w-[120px] max-w-[220px] px-3">
                    Email
                  </TableHead>
                  <TableHead className="font-bold min-w-[110px] max-w-[130px] px-3">
                    Phone Number
                  </TableHead>
                  <TableHead className="font-bold min-w-[140px] max-w-[180px] px-3">
                    WhatsApp Number
                  </TableHead>
                  
                  <TableHead className="font-bold min-w-[80px] max-w-[100px] px-3">
                    Gender
                  </TableHead>
                  {/* <TableHead className="font-bold min-w-[90px] max-w-[120px] px-3">
                    City
                  </TableHead> */}
                  {/* <TableHead className="font-bold min-w-[100px] max-w-[140px] px-3">
                    State
                  </TableHead> */}

                  {/* <TableHead className="font-bold w-24">Pin Code</TableHead> */}

                  {/* School */}
                  {/* <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
                    Qualifying School
                  </TableHead> */}

                  {/* Campus */}
                  <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
                    Campus
                  </TableHead>

                  <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
                    Current Stage
                  </TableHead>
                  {/* <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
                    Religion
                  </TableHead> */}

                  {/* <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
                    Is Passed
                  </TableHead> */}

                  <TableHead className="w-16 font-bold px-3">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isSearching || isFiltering ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-6">
                      <span className="text-muted-foreground animate-pulse">
                        {isSearching ? "Searching..." : "Applying filters..."}
                      </span>
                    </TableCell>
                  </TableRow>
                ) : paginatedApplicants.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={13}
                      className="text-center text-muted-foreground py-6"
                    >
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
                      onUpdate={refreshData}
                      onViewDetails={setApplicantToView}
                      onViewComments={setApplicantForComments}
                      onCampusChange={refreshData}
                      schoolList={schoolList}
                      campusList={campusList}
                      religionList={religionList}
                      currentstatusList={currentstatusList}
                      questionSetList={questionSetList}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {showingStart} – {showingEnd} of {currentTotalCount}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </CardContent>

      {/* Modals */}
      <AddApplicantModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refreshData}
        schoolList={schoolList}
        campusList={campusList}
        currentstatusList={currentstatusList}
        religionList={religionList}
        questionSetList={questionSetList}
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
        students={students}
        campusList={campusList}
        schoolList={schoolList}
        religionList={religionList}
        currentstatusList={currentstatusList}
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

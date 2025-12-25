import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  // TableHead,
  // TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { Input } from "@/components/ui/input";
// import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";
import { AddApplicantModal } from "./AddApplicantModal";
import { AdvancedFilterModal } from "./AdvancedFilterModal";
import { BulkUpdateModal } from "./BulkUpdateModal";
import { ApplicantModal } from "./ApplicantModal";
// import { ApplicantCommentsModal } from "./ApplicantCommentsModal";
import CSVImportModal from "./CSVImportModal";
import { BulkOfferResultsModal } from "./BulkOfferResultsModal";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { useDashboardRefresh } from "@/hooks/useDashboardRefresh";
import { useApplicantData } from "@/hooks/useApplicantData";
import { useApplicantFilters } from "@/hooks/useApplicantFilters";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { BulkActions } from "./applicant-table/BulkActions";
import { TableActions } from "./applicant-table/TableActions";
import { ApplicantTableRow } from "./applicant-table/ApplicantTableRow";
import { ApplicantTableHeader } from "./applicant-table/ApplicantTableHeader";
import { Pagination } from "./applicant-table/Pagination";
import { SearchBar } from "./applicant-table/SearchBar";
import {
  deleteStudent,
  searchStudentsApi,
  getFilterStudent,
  sendBulkOfferLetters,
} from "@/utils/api";
import { exportApplicantsToCSV } from "@/utils/exportApplicants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  // AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// import { tr } from "date-fns/locale";
// import { cp } from "fs";

const ApplicantTable = () => {
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showBulkOfferResults, setShowBulkOfferResults] = useState(false);
  const [bulkOfferResults, setBulkOfferResults] = useState<any>(null);

  // Applicant Modals
  const [applicantToView, setApplicantToView] = useState<any | null>(null);
  const [applicantForComments, setApplicantForComments] = useState<any | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Export loading state
  const [isExporting, setIsExporting] = useState(false);

  // Loading state for pagination/search/filter (NOT for data updates)
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Selected rows
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const { toast } = useToast();
  const { hasEditAccess } = usePermissions();
  const { triggerRefresh } = useDashboardRefresh();
  const [showBulkOfferConfirmation, setShowBulkOfferConfirmation] = useState(false);
  // Custom hook for data fetching
  const {
    students,
    totalStudents,
    totalPagesFromAPI,
    isStudentsLoading,
    isStudentsFetching,
    refetchStudents,
    campusList,
    schoolList,
    currentstatusList,
    stageList,
    religionList,
    questionSetList,
    qualificationList,
    castList,
    partnerList,
    donorList,
    stateList,
  } = useApplicantData(currentPage, itemsPerPage);

  // Map student data with related info
  const applicantsToDisplay = useMemo(() => {
    return students.map((student) => {
      const school = schoolList.find((s) => s.id === student.school_id);
      const campus = campusList.find((c) => c.id === student.campus_id);
      const current_status = currentstatusList.find(
        (s) => s.id === student.current_status_id,
      );
      const religion = religionList.find((r) => r.id === student.religion_id);
      const questionSet = questionSetList.find(
        (q) => q.id === student.question_set_id,
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

  // Custom hook for filters and search
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    searchResults,
    setSearchResults,
    isSearching,
    filteredStudents,
    setFilteredStudents,
    isFiltering,
    setIsFiltering,
    hasActiveFilters,
    setHasActiveFilters,
    filteredApplicants,
  } = useApplicantFilters(
    applicantsToDisplay,
    campusList,
    schoolList,
    currentstatusList,
    religionList,
    questionSetList
  );

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (searchTerm.trim() || hasActiveFilters) {
      setCurrentPage(1);
    }
  }, [searchTerm, hasActiveFilters]);

  // Clear selected rows when search term or filters change
  useEffect(() => {
    setSelectedRows([]);
  }, [searchTerm, hasActiveFilters]);

  // Track if pagination/itemsPerPage is actively changing (not just data refresh)
  const [isPaginationChanging, setIsPaginationChanging] = useState(false);

  // When pagination changes, set the flag
  useEffect(() => {
    if (!searchTerm.trim() && !hasActiveFilters) {
      setIsPaginationChanging(true);
    }
  }, [currentPage, itemsPerPage]);

  // When data finishes loading, clear the flag
  useEffect(() => {
    if (!isStudentsFetching && isPaginationChanging) {
      setIsPaginationChanging(false);
      setIsLoadingData(false);
    } else if (isStudentsFetching && isPaginationChanging) {
      setIsLoadingData(true);
    }
  }, [isStudentsFetching, isPaginationChanging]);

  // Checkbox handlers
  const handleCheckboxChange = useCallback((id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  }, []);

  const handleSelectAllRows = useCallback(() => {
    setSelectedRows((prev) =>
      prev.length === filteredApplicants.length
        ? []
        : filteredApplicants.map((a) => a.id),
    );
  }, [filteredApplicants]);

  const refreshData = useCallback(async () => {
    // Trigger dashboard stats refresh
    triggerRefresh();
    
    // If searching, re-run the search to get updated data
    if (searchTerm.trim()) {
      try {
        const results = await searchStudentsApi(searchTerm.trim());
        setSearchResults(results || []);
      } catch (error: any) {
        console.error("Error refreshing search results:", error);
      }
    }
    // If filters are active, re-apply them to get updated data
    else if (hasActiveFilters && filters) {
      try {
        const apiParams = transformFiltersToAPI(filters);
        // console.log("Refreshing filtered data with params:", apiParams);
        const results = await getFilterStudent(apiParams);
        setFilteredStudents(results || []);
      } catch (error: any) {
        console.error("Error refreshing filtered data:", error);
        toast({
          title: "❌ Unable to Refresh Data",
          description: getFriendlyErrorMessage(error),
          variant: "destructive",
          className: "border-red-500 bg-red-50 text-red-900",
        });
      }
    }
    // Otherwise, refetch regular paginated data
    else {
      setCurrentPage(1);
      refetchStudents();
    }
  }, [searchTerm, hasActiveFilters, filters, refetchStudents, toast, triggerRefresh]);

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!selectedRows.length) {
      toast({
        title: "⚠️ No Selection",
        description: "Please select applicants to delete",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }
    try {
      await Promise.all(selectedRows.map((id) => deleteStudent(id)));
      toast({
        title: "✅ Applicants Deleted",
        description: "Successfully deleted selected applicants",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
      setSelectedRows([]);
      refreshData();
    } catch (error: any) {
      console.error("Error deleting applicants:", error);
      toast({
        title: "❌ Unable to Delete Applicants",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  const handleSendOfferLetters = async () => {
    if (!selectedRows.length) {
      toast({
        title: "⚠️ No Selection",
        description: "Please select applicants to send offer letters to",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    const selectedStudents = filteredApplicants.filter((applicant) =>
      selectedRows.includes(applicant.id)
    );
    
    // Check for students without campus (check campus_name)
    const studentsWithoutCampus = selectedStudents.filter(
      (student) => !student.campus_name || student.campus_name === "N/A"
    );
    
    if (studentsWithoutCampus.length > 0) {
      // Show names of first 3 students without campus
      const studentNames = studentsWithoutCampus
        .slice(0, 3)
        .map((s) => s.name || `${s.first_name} ${s.last_name}`)
        .join(", ");
      
      const moreCount = studentsWithoutCampus.length - 3;
      
      toast({
        title: "⚠️ Campus Required",
        description: `You’ve selected ${selectedStudents.length} students, but ${studentsWithoutCampus.length} ${
    studentsWithoutCampus.length === 1 ? "student doesn’t" : "students don’t"
  } have a campus assigned${
    studentNames
      ? `. Please assign a campus to: ${studentNames}${
          moreCount > 0 ? ` and ${moreCount} others` : ""
        }`
      : ""
  }. Once campus is assigned, you can send offer letters.`,
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
        duration: 8000,
      });
      
      return; 
    }

    // All students have campus - show confirmation dialog
    setShowBulkOfferConfirmation(true);
  };

  const handleSendBulkOfferLetters = async () => {
  
    try {
      const studentIds = selectedRows.map((id) => Number(id));
      const result = await sendBulkOfferLetters(studentIds);

      // Check if we have results
      if (!result) {
        throw new Error("No response from server");
      }

      // Categorize results
      const categorized = {
        sent: [] as any[],
        alreadySent: [] as any[],
        noEmail: [] as any[],
        alreadyOnboarded: [] as any[],
        notFound: [] as any[],
        otherErrors: [] as any[],
      };

      if (result.results && Array.isArray(result.results)) {
        result.results.forEach((item: any) => {
          const studentName =
            item.student_name ||
            item.name ||
            `Student #${item.student_id || "Unknown"}`;
          const errorMsg = (item.error || item.message || "").toLowerCase();

          const studentData = {
            ...item,
            displayName: studentName,
            errorMessage: item.error || item.message || "Unknown error",
          };

          if (item.success) {
            categorized.sent.push(studentData);
          } else if (
            errorMsg.includes("email") ||
            errorMsg.includes("e-mail") ||
            errorMsg.includes("does not have an email")
          ) {
            categorized.noEmail.push(studentData);
          } else if (
            errorMsg.includes("already sent") ||
            errorMsg.includes("already has offer letter")
          ) {
            categorized.alreadySent.push(studentData);
          } else if (
            errorMsg.includes("onboarded") ||
            errorMsg.includes("onboard")
          ) {
            categorized.alreadyOnboarded.push(studentData);
          } else if (
            errorMsg.includes("not found") ||
            errorMsg.includes("does not exist")
          ) {
            categorized.notFound.push(studentData);
          } else {
            categorized.otherErrors.push(studentData);
          }
        });
      }

      // Set results and show modal
      setBulkOfferResults({
        summary: result.summary,
        categorized: categorized,
      });
      setShowBulkOfferResults(true);

      // Refresh data and clear selection
      refreshData();
      setSelectedRows([]);
    } catch (error: any) {
      console.error("Error sending bulk offer letters:", error);

      // Parse error message for better UX
      let errorMessage = "Failed to send offer letters. Please try again.";

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.toString && typeof error.toString === "function") {
        errorMessage = error.toString();
      }

      // Check for network errors
      if (
        errorMessage.toLowerCase().includes("fetch") ||
        errorMessage.toLowerCase().includes("network")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      toast({
        title: "❌ Unable to Send Offer Letters",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  // Transform filter state to API query parameters
  const transformFiltersToAPI = (filterState: any) => {
    // console.log("Transforming filters to API params:", filterState);
    const apiParams: any = {};

    // Date range mapping based on type
    if (filterState.dateRange?.from && filterState.dateRange?.to) {
      const formatDate = (date: Date) => {
        const d = new Date(date);
        // Use local date to avoid timezone issues
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`; // Format: YYYY-MM-DD
      };

      if (
        filterState.dateRange.type === "application" ||
        filterState.dateRange.type === "applicant"
      ) {
        apiParams.created_at_from = formatDate(filterState.dateRange.from);
        apiParams.created_at_to = formatDate(filterState.dateRange.to);
      } else if (filterState.dateRange.type === "lastUpdate") {
        apiParams.updated_at_from = formatDate(filterState.dateRange.from);
        apiParams.updated_at_to = formatDate(filterState.dateRange.to);
      } else if (filterState.dateRange.type === "interview") {
        apiParams.interview_date_from = formatDate(filterState.dateRange.from);
        apiParams.interview_date_to = formatDate(filterState.dateRange.to);
      }
    }

    if (filterState.stage_id) {
      apiParams.stage_id = filterState.stage_id;
    }
    
    // Stage Status
    if (filterState.stage_status && filterState.stage_status !== "all") {
      apiParams.stage_status = filterState.stage_status;
    }
    
    // Qualification ID
    if (
      filterState.qualification?.length &&
      filterState.qualification[0] !== "all"
    ) {
      apiParams.qualification_id = filterState.qualification[0];
    }

    // Campus ID
    if (filterState.partner?.length && filterState.partner[0] !== "all") {
      apiParams.campus_id = filterState.partner[0];
    }

    // Partner ID
    if (filterState.partnerFilter?.length && filterState.partnerFilter[0] !== "all") {
      apiParams.partner_id = filterState.partnerFilter[0];
    }

    // Donor ID
    if (filterState.donor?.length && filterState.donor[0] !== "all") {
      apiParams.donor_id = filterState.donor[0];
    }

    // School ID
    if (filterState.school?.length && filterState.school[0] !== "all") {
      apiParams.school_id = filterState.school[0];
    }

    // Current Status ID
    if (
      filterState.currentStatus?.length &&
      filterState.currentStatus[0] !== "all"
    ) {
      apiParams.current_status_id = filterState.currentStatus[0];
    }

    // State
    if (filterState.state && filterState.state !== "all") {
      apiParams.state = filterState.state;
    }

    // District
    if (filterState.district?.length && filterState.district[0] !== "all") {
      apiParams.district = filterState.district[0];
    }

    // Gender
    if (filterState.gender && filterState.gender !== "all") {
      apiParams.gender = filterState.gender;
    }

    return apiParams;
  };

  // Build readable tags for active filters to display above the search input
  // Helper: resolve campus name when the value might be an id, index or name string
  const resolveCampusName = (value: any) => {
    if (value === null || value === undefined || value === "") return null;
    // If already a non-numeric string, assume it's a name
    if (typeof value === "string" && /\D/.test(value)) return value;

    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      // Try match by id
      const byId = campusList.find((c) => Number(c.id) === numeric);
      if (byId) return byId.campus_name || byId.name || String(value);
      // Try interpret as index into campusList
      if (numeric >= 0 && numeric < campusList.length) {
        return campusList[numeric]?.campus_name || campusList[numeric]?.name || String(value);
      }
    }

    // Fallback to string representation
    return String(value);
  };

  // Resolver: School name (id | index | name)
  const resolveSchoolName = (value: any) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "string" && /\D/.test(value)) return value;
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      const byId = schoolList.find((s) => Number(s.id) === numeric);
      if (byId) return byId.school_name || byId.name || String(value);
      if (numeric >= 0 && numeric < schoolList.length) {
        return schoolList[numeric]?.school_name || schoolList[numeric]?.name || String(value);
      }
    }
    return String(value);
  };

  // Resolver: QuestionSet / Qualification name (id | index | name)
  const resolveQuestionSetName = (value: any) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "string" && /\D/.test(value)) return value;
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      const byId = questionSetList.find((q) => Number(q.id) === numeric);
      if (byId) return byId.name || String(value);
      if (numeric >= 0 && numeric < questionSetList.length) {
        return questionSetList[numeric]?.name || String(value);
      }
    }
    return String(value);
  };

  // Resolver: Current status name (id | index | name)
  const resolveCurrentStatusName = (value: any) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "string" && /\D/.test(value)) return value;
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      const byId = currentstatusList.find((s) => Number(s.id) === numeric);
      if (byId) return byId.current_status_name || byId.name || String(value);
      if (numeric >= 0 && numeric < currentstatusList.length) {
        return currentstatusList[numeric]?.current_status_name || currentstatusList[numeric]?.name || String(value);
      }
    }
    return String(value);
  };

   const activeFilterTags = useMemo(() => {
     const tags: { key: string; label: string; onRemove?: () => void }[] = [];
    
    // Debug: log first student to see available fields
    if (filteredApplicants && filteredApplicants.length > 0) {
      console.log('Sample filtered student data:', filteredApplicants[0]);
    }
    
    // Helper function to get a better label when lists are empty
    const getBetterLabel = (id: any, type: string): string => {
      // If we have filtered data, try to find a matching entry with the name
      if (filteredApplicants && filteredApplicants.length > 0) {
        for (const student of filteredApplicants) {
          if (type === 'donor' && String(student.donor_id) === String(id) && student.donor_name) {
            return student.donor_name;
          }
          if (type === 'qualification' && String(student.question_set_id) === String(id) && student.question_set_name && student.question_set_name !== 'N/A') {
            return student.question_set_name;
          }
          if (type === 'partner' && String(student.partner_id) === String(id) && student.partner_name) {
            return student.partner_name;
          }
        }
      }
      
      // Fallback - just show the ID (API permissions issue)
      return String(id);
    };

    // Stage chip (only if stage is selected)
    const stageId = (filters as any).stage_id ?? (filters as any).stage;
    const hasStage = stageId && stageId !== "all";
    
    if (hasStage) {
      const stageObj = stageList.find((s) => s.id === stageId) as any;
      const stageName = stageObj?.stage_name || stageObj?.name || stageId || "Stage";
      
      tags.push({
        key: `stage-${stageId}`,
        label: `Stage: ${stageName}`,
        onRemove: () => handleClearSingleFilter("stage")
      });
    }
    
    // Individual stage status chips
    const stageStatusValue = (filters as any).stage_status;
    const stageStatusArray = Array.isArray(stageStatusValue) 
      ? stageStatusValue 
      : stageStatusValue && stageStatusValue !== "all" 
        ? [stageStatusValue] 
        : [];
    
    stageStatusArray.forEach((status: string) => {
      tags.push({
        key: `stage_status-${status}`,
        label: `Status: ${status}`,
        onRemove: () => handleRemoveSingleStageStatus(status)
      });
    });

    // Partner / Campus
    if ((filters as any).partner?.length) {
      const partners = (filters as any).partner.filter((p: any) => p !== "all");
      partners.forEach((p: any) => {
        const campus = campusList.find((c) => Number(c.id) === Number(p));
        const campusLabel = campus?.campus_name || resolveCampusName(p) || p;
        tags.push({
          key: `partner-${p}`,
          label: `Campus: ${campusLabel}`,
        });
      });
    }

    // School
    if ((filters as any).school?.length) {
      const schools = (filters as any).school.filter((s: any) => s !== "all");
      schools.forEach((s: any) => {
        const sch = schoolList.find((sc) => Number(sc.id) === Number(s));
        const schoolLabel = sch?.school_name || resolveSchoolName(s) || s;
        tags.push({
          key: `school-${s}`,
          label: `School: ${schoolLabel}`,
        });
      });
    }

    // Current Status
    if ((filters as any).currentStatus?.length) {
      const curr = (filters as any).currentStatus.filter((c: any) => c !== "all");
      curr.forEach((c: any) => {
        const cs = currentstatusList.find((st) => Number(st.id) === Number(c));
        const csLabel = cs?.current_status_name || resolveCurrentStatusName(c) || c;
        tags.push({
          key: `currentStatus-${c}`,
          label: `Current Status: ${csLabel}`,
        });
      });
    }

    // Qualification (try questionSetList lookup)
    if ((filters as any).qualification?.length) {
      const quals = (filters as any).qualification.filter((q: any) => q !== "all");
      quals.forEach((q: any) => {
        // Try multiple approaches to find the qualification name
        let qualLabel: string | null = null;
        
        // Try finding in qualificationList by ID
        const fromQualList = qualificationList.find((x: any) => 
          String(x.id) === String(q) || 
          x.qualification_name === q || 
          x.name === q
        );
        
        // Try finding in questionSetList by ID
        const fromQuestionSet = questionSetList.find((x: any) => 
          String(x.id) === String(q) || 
          x.name === q
        );
        
        if (fromQualList) {
          qualLabel = fromQualList.qualification_name || fromQualList.name;
        } else if (fromQuestionSet) {
          qualLabel = fromQuestionSet.name || fromQuestionSet.qualification_name;
        }
        
        // If not found in lists, try resolvers and student data
        if (!qualLabel) {
          qualLabel = resolveQuestionSetName(q) || getBetterLabel(q, 'qualification');
        }
        
        tags.push({
          key: `qualification-${q}`,
          label: `Qualification: ${qualLabel}`,
        });
      });
    }

    // Religion
    if ((filters as any).religion?.length) {
      const rels = (filters as any).religion.filter((r: any) => r !== "all");
      rels.forEach((r: any) => {
        const rr = religionList.find((x) => String(x.id) === String(r));
        tags.push({
          key: `religion-${r}`,
          label: `Religion: ${rr?.religion_name || r}`,
          onRemove: () => handleClearSingleFilter("religion"),
        });
      });
    }

    // Partner (org partner, not campus)
    if ((filters as any).partnerFilter?.length) {
      const partners = (filters as any).partnerFilter.filter((p: any) => p !== "all");
      partners.forEach((p: any) => {
        const partner = partnerList.find((pt) => Number(pt.id) === Number(p));
        const partnerLabel = partner?.partner_name || partner?.name || getBetterLabel(p, 'partner');
        
        tags.push({
          key: `partnerFilter-${p}`,
          label: `Partner: ${partnerLabel}`,
          onRemove: () => handleClearSingleFilter("partnerFilter"),
        });
      });
    }

    // Donor
    if ((filters as any).donor?.length) {
      const donors = (filters as any).donor.filter((d: any) => d !== "all");
      donors.forEach((d: any) => {
        const donor = donorList.find((dn) => Number(dn.id) === Number(d));
        const donorLabel = donor?.donor_name || donor?.name || getBetterLabel(d, 'donor');
        
        tags.push({
          key: `donor-${d}`,
          label: `Donor: ${donorLabel}`,
          onRemove: () => handleClearSingleFilter("donor"),
        });
      });
    }

    // State / District / Gender
    if ((filters as any).state && (filters as any).state !== "all") {
      tags.push({ 
        key: `state-${(filters as any).state}`, 
        label: `State: ${(filters as any).state}`,
        onRemove: () => handleClearSingleFilter("state"),
      });
    }
    if ((filters as any).district?.length) {
      const dists = (filters as any).district.filter((d: any) => d !== "all");
      dists.forEach((d: any) => tags.push({ 
        key: `district-${d}`, 
        label: `District: ${d}`,
        onRemove: () => handleClearSingleFilter("district"),
      }));
    }
    if ((filters as any).gender && (filters as any).gender !== "all") {
      tags.push({ 
        key: `gender-${(filters as any).gender}`, 
        label: `Gender: ${(filters as any).gender}`,
        onRemove: () => handleClearSingleFilter("gender"),
      });
    }

    // Date range
    if ((filters as any).dateRange?.from && (filters as any).dateRange?.to) {
      const fromDate = new Date((filters as any).dateRange.from);
      const toDate = new Date((filters as any).dateRange.to);
      
      // Format as dd/MM/yyyy
      const from = `${String(fromDate.getDate()).padStart(2, '0')}/${String(fromDate.getMonth() + 1).padStart(2, '0')}/${fromDate.getFullYear()}`;
      const to = `${String(toDate.getDate()).padStart(2, '0')}/${String(toDate.getMonth() + 1).padStart(2, '0')}/${toDate.getFullYear()}`;
      
      // Make date type more readable
      const dateType = (filters as any).dateRange.type;
      const typeLabel = dateType === "applicant" 
        ? "Created" 
        : dateType === "lastUpdate" 
          ? "Updated" 
          : dateType === "interview"
            ? "Interview"
            : dateType;
      
      tags.push({ 
        key: `daterange-${from}-${to}`, 
        label: `${typeLabel}: ${from} → ${to}`,
        onRemove: () => handleClearSingleFilter("dateRange"),
      });
    }

    return tags;
   }, [filters, campusList, schoolList, currentstatusList, questionSetList, religionList, stageList, partnerList, donorList, qualificationList, filteredApplicants]);
  
  // Use resolved campus name in applicant mapping too (handles API returning numeric/string)
   // Apply filters and fetch filtered students
   const handleApplyFilters = async (newFilters: any) => {
     console.log("Applying filters:", newFilters);
     setFilters(newFilters);

    // Check if any meaningful filters are applied
    const hasFilters =
      (newFilters.stage_id && newFilters.stage_id !== undefined) ||
      (newFilters.stage_status && newFilters.stage_status !== "all") ||
      (newFilters.qualification?.length && newFilters.qualification[0] !== "all") ||
      (newFilters.school?.length && newFilters.school[0] !== "all") ||
      (newFilters.currentStatus?.length && newFilters.currentStatus[0] !== "all") ||
      (newFilters.partner?.length && newFilters.partner[0] !== "all") ||
      (newFilters.partnerFilter?.length && newFilters.partnerFilter[0] !== "all") ||
      (newFilters.donor?.length && newFilters.donor[0] !== "all") ||
      (newFilters.state && newFilters.state !== "all") ||
      (newFilters.district?.length && newFilters.district[0] !== "all") ||
      (newFilters.gender && newFilters.gender !== "all") ||
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
        title: "✅ Filters Applied",
        description: `Found ${
          results?.length || 0
        } applicants matching your criteria`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } catch (error) {
      console.error("Error applying filters:", error);
      toast({
        title: "❌ Unable to Apply Filters",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
      setFilteredStudents([]);
    } finally {
      setIsFiltering(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      stage: "all",
      stage_id: undefined,
      stage_status: "all",
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
      donor: [],
      partnerFilter: [],
      dateRange: { type: "applicant" as const, from: undefined, to: undefined },
    });
    setHasActiveFilters(false);
    setFilteredStudents([]);
    setCurrentPage(1);

    toast({
      title: "✅ Filters Cleared",
      description: "All filters have been removed. Showing all applicants.",
      variant: "default",
      className: "border-green-500 bg-green-50 text-green-900",
    });
  };

  // Remove individual stage status and re-apply filters
  const handleRemoveSingleStageStatus = async (statusToRemove: string) => {
    const currentStatuses = Array.isArray((filters as any).stage_status)
      ? (filters as any).stage_status
      : (filters as any).stage_status && (filters as any).stage_status !== "all"
      ? [(filters as any).stage_status]
      : [];
    
    const newStatuses = currentStatuses.filter((s: string) => s !== statusToRemove);
    
    // If removing the last status, also clear the stage
    // (because a stage with statuses available requires at least one status to be selected)
    let newFilters;
    if (newStatuses.length === 0) {
      newFilters = {
        ...filters,
        stage: "all",
        stage_id: undefined,
        stage_status: "all",
      } as any;
    } else {
      newFilters = {
        ...filters,
        stage_status: newStatuses,
      } as any;
    }

    setFilters(newFilters);

    // Check if any filters are still active
    const hasFilters =
      (newFilters.stage_id && newFilters.stage_id !== undefined) ||
      (newFilters.stage_status && newFilters.stage_status !== "all") ||
      (newFilters.qualification?.length && newFilters.qualification[0] !== "all") ||
      (newFilters.school?.length && newFilters.school[0] !== "all") ||
      (newFilters.currentStatus?.length && newFilters.currentStatus[0] !== "all") ||
      (newFilters.partner?.length && newFilters.partner[0] !== "all") ||
      (newFilters.state && newFilters.state !== "all") ||
      (newFilters.district?.length && newFilters.district[0] !== "all") ||
      (newFilters.gender && newFilters.gender !== "all") ||
      (newFilters.dateRange?.from && newFilters.dateRange?.to);

    if (!hasFilters) {
      setHasActiveFilters(false);
      setFilteredStudents([]);
      setCurrentPage(1);
      toast({
        title: "✅ Filter Removed",
        description: "All filters cleared. Showing all applicants.",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } else {
      try {
        setIsFiltering(true);
        const apiParams = transformFiltersToAPI(newFilters);
        const results = await getFilterStudent(apiParams);
        setFilteredStudents(results || []);
        setCurrentPage(1);

        toast({
          title: "✅ Filter Removed",
          description: `Found ${results?.length || 0} applicants matching your criteria`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
      } catch (error) {
        console.error("Error re-applying filters:", error);
        toast({
          title: "❌ Unable to Update Filters",
          description: getFriendlyErrorMessage(error),
          variant: "destructive",
          className: "border-red-500 bg-red-50 text-red-900",
        });
        setFilteredStudents([]);
      } finally {
        setIsFiltering(false);
      }
    }
  };

  // Clear individual filter and re-apply
  const handleClearSingleFilter = async (filterKey: string) => {
    let newFilters = { ...filters } as any;

    switch (filterKey) {
      case "stage":
        newFilters.stage = "all";
        newFilters.stage_id = undefined;
        newFilters.stage_status = "all";
        break;
      case "stage_status":
        newFilters.stage_status = "all";
        break;
      case "state":
        newFilters.state = undefined;
        newFilters.district = [];
        break;
      case "district":
        newFilters.district = [];
        break;
      case "partner":
      case "campus":
        newFilters.partner = [];
        break;
      case "school":
        newFilters.school = [];
        break;
      case "religion":
        newFilters.religion = [];
        break;
      case "qualification":
        newFilters.qualification = [];
        break;
      case "currentStatus":
        newFilters.currentStatus = [];
        break;
      case "donor":
        newFilters.donor = [];
        break;
      case "partnerFilter":
        newFilters.partnerFilter = [];
        break;
      case "gender":
        newFilters.gender = undefined;
        break;
      case "dateRange":
      case "daterange":
        newFilters.dateRange = { type: newFilters.dateRange.type, from: undefined, to: undefined };
        break;
      default:
        return;
    }

    setFilters(newFilters);

    // Check if any filters are still active
    const hasFilters =
      (newFilters.stage_id && newFilters.stage_id !== undefined) ||
      (newFilters.stage_status && newFilters.stage_status !== "all") ||
      (newFilters.qualification?.length && newFilters.qualification[0] !== "all") ||
      (newFilters.school?.length && newFilters.school[0] !== "all") ||
      (newFilters.currentStatus?.length && newFilters.currentStatus[0] !== "all") ||
      (newFilters.partner?.length && newFilters.partner[0] !== "all") ||
      (newFilters.partnerFilter?.length && newFilters.partnerFilter[0] !== "all") ||
      (newFilters.donor?.length && newFilters.donor[0] !== "all") ||
      (newFilters.religion?.length && newFilters.religion[0] !== "all") ||
      (newFilters.state && newFilters.state !== "all") ||
      (newFilters.district?.length && newFilters.district[0] !== "all") ||
      (newFilters.gender && newFilters.gender !== "all") ||
      (newFilters.dateRange?.from && newFilters.dateRange?.to);

    if (!hasFilters) {
      // No filters remain, clear everything
      setHasActiveFilters(false);
      setFilteredStudents([]);
      setCurrentPage(1);
      toast({
        title: "✅ Filter Removed",
        description: "All filters cleared. Showing all applicants.",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } else {
      // Re-apply remaining filters
      try {
        setIsFiltering(true);
        const apiParams = transformFiltersToAPI(newFilters);
        const results = await getFilterStudent(apiParams);
        setFilteredStudents(results || []);
        setCurrentPage(1);

        toast({
          title: "✅ Filter Removed",
          description: `Found ${results?.length || 0} applicants matching your criteria`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
      } catch (error) {
        console.error("Error re-applying filters:", error);
        toast({
          title: "❌ Unable to Update Filters",
          description: getFriendlyErrorMessage(error),
          variant: "destructive",
          className: "border-red-500 bg-red-50 text-red-900",
        });
        setFilteredStudents([]);
      } finally {
        setIsFiltering(false);
      }
    }
  };

  const exportToCSV = async (exportType: 'all' | 'filtered' | 'selected' = 'all') => {
    // Prevent multiple simultaneous exports
    if (isExporting) {
      toast({
        title: "⚠️ Export in Progress",
        description: "Please wait for the current export to complete",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    // Validate selection if export type is 'selected'
    if (exportType === 'selected' && selectedRows.length === 0) {
      toast({
        title: "⚠️ No Selection",
        description: "Please select applicants to export",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    try {
      setIsExporting(true);
      
      // Get the full applicant data for selected rows if export type is 'selected'
      let selectedApplicantsData: any[] = [];
      if (exportType === 'selected') {
        selectedApplicantsData = filteredApplicants.filter((applicant) =>
          selectedRows.includes(applicant.id)
        );
      }

      await exportApplicantsToCSV({
        questionSetList,
        filteredData: filteredApplicants, // Pass current filtered/searched data
        selectedData: selectedApplicantsData, // Pass selected applicants data
        exportType,
        toast,
      });
    } catch (error) {
      // Error already handled in the utility function
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
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
  const totalPages = useMemo(() => {
    // For search and filter modes, use client-side pagination
    if (searchTerm.trim() || hasActiveFilters) {
      return Math.max(1, Math.ceil(currentTotalCount / itemsPerPage));
    }
    // For normal mode, use server-side pagination count
    return totalPagesFromAPI;
  }, [
    searchTerm,
    hasActiveFilters,
    currentTotalCount,
    itemsPerPage,
    totalPagesFromAPI,
  ]);

  // Apply pagination to filtered results (only for search/filter mode)
  const paginatedApplicants = useMemo(() => {
    // For search or filter mode, apply client-side pagination
    if (searchTerm.trim() || hasActiveFilters) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredApplicants.slice(startIndex, endIndex);
    }
    // For normal mode, use data directly from server (already paginated)
    return filteredApplicants;
  }, [
    searchTerm,
    hasActiveFilters,
    filteredApplicants,
    currentPage,
    itemsPerPage,
  ]);

  const showingStart =
    paginatedApplicants.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
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
            {hasEditAccess && (
              <BulkActions
                selectedRowsCount={selectedRows.length}
                onBulkUpdate={() => setShowBulkUpdate(true)}
                // onBulkUpdate={handleBulkUpdate}
                onSendOfferLetters={handleSendOfferLetters}
                onBulkDelete={() => setShowDeleteConfirm(true)}
              />
            )}
            <TableActions
              onCSVImport={hasEditAccess ? () => setShowCSVImport(true) : undefined}
              onExportCSV={exportToCSV}
              onShowFilters={() => setShowAdvancedFilters(true)}
              onAddApplicant={hasEditAccess ? () => setShowAddModal(true) : undefined}
              isExporting={isExporting}
              hasActiveFilters={hasActiveFilters}
              searchTerm={searchTerm}
              filteredCount={filteredApplicants.length}
              selectedCount={selectedRows.length}
            />
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center text-destructive hover:text-destructive/80 text-sm"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="mb-4 space-y-2">
          {/* Selected filter tags shown above the search input */}
          {activeFilterTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {activeFilterTags.map((t) => (
                <Button
                  key={t.key}
                  size="sm"
                  variant="secondary"
                  className="rounded-full py-1.5 px-3 h-auto flex items-center gap-2 text-xs whitespace-nowrap max-w-none"
                  onClick={() => {
                    if (t.onRemove) {
                      t.onRemove();
                    } else {
                      const filterType = t.key.split('-')[0];
                      handleClearSingleFilter(filterType);
                    }
                  }}
                >
                  <span className="inline-block">{t.label}</span>
                  <X className="w-3 h-3 flex-shrink-0" />
                </Button>
              ))}
            </div>
          )}
           <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
         </div>

        <div className="flex-1 border rounded-md overflow-hidden relative">
          <div className="h-full overflow-auto">
            <Table>
              <ApplicantTableHeader
                selectedRows={selectedRows}
                filteredApplicants={filteredApplicants}
                handleSelectAllRows={handleSelectAllRows}
              />

              <TableBody>
                {isSearching || isFiltering || isLoadingData ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {isSearching ? "Searching applicants..." : isFiltering ? "Applying filters..." : "Loading data..."}
                        </span>
                      </div>
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

        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          totalPages={totalPages}
          showingStart={showingStart}
          showingEnd={showingEnd}
          currentTotalCount={currentTotalCount}
          totalStudents={totalStudents}
          searchTerm={searchTerm}
          hasActiveFilters={hasActiveFilters}
        />
      </CardContent>

      {/* Modals */}
      <AddApplicantModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refreshData}
        schoolList={schoolList}
        // campusList={campusList}
        currentstatusList={currentstatusList}
        religionList={religionList}
        questionSetList={questionSetList}
        qualificationList={qualificationList}
        castList={castList}
        partnerList={partnerList}
        donorList={donorList}
        stateList={stateList}
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
        onClose={() => {
          setApplicantToView(null);
          refreshData(); // Refresh the table data when modal closes
        }}
       
      />
      {/* <ApplicantCommentsModal
        applicantId={applicantForComments?.id || ""}
        applicantName={applicantForComments?.name || ""}
        isOpen={!!applicantForComments}
        onClose={() => setApplicantForComments(null)}
      /> */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRows.length} applicant
              {selectedRows.length > 1 ? "s" : ""}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                setShowDeleteConfirm(false);
                await handleBulkDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Offer Letter Confirmation Dialog */}
      <AlertDialog open={showBulkOfferConfirmation} onOpenChange={setShowBulkOfferConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Offer Letters</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send offer letters to {selectedRows.length} selected applicant
              {selectedRows.length > 1 ? "s" : ""}? All selected students have campus assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-white hover:bg-primary/90"
              onClick={async () => {
                setShowBulkOfferConfirmation(false);
                await handleSendBulkOfferLetters();
              }}
            >
              Send Offer Letters
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkOfferResultsModal
        isOpen={showBulkOfferResults}
        onClose={() => setShowBulkOfferResults(false)}
        results={bulkOfferResults}
      />
    </Card>
  );
};

export default ApplicantTable;

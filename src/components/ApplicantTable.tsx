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
import { Search, X } from "lucide-react";
import { AddApplicantModal } from "./AddApplicantModal";
import { AdvancedFilterModal } from "./AdvancedFilterModal";
import { BulkUpdateModal } from "./BulkUpdateModal";
import { ApplicantModal } from "./ApplicantModal";
import { ApplicantCommentsModal } from "./ApplicantCommentsModal";
import CSVImportModal from "./CSVImportModal";
import { BulkOfferResultsModal } from "./BulkOfferResultsModal";
import { useToast } from "@/hooks/use-toast";
import { useDashboardRefresh } from "@/hooks/useDashboardRefresh";
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
  sendBulkOfferLetters,
} from "@/utils/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { tr } from "date-fns/locale";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Search & filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    stage: "all",
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
    dateRange: { type: "applicant" as const, from: undefined, to: undefined },
  });

  // Selected rows
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const { toast } = useToast();
  const { triggerRefresh } = useDashboardRefresh();

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

  useEffect(() => {
    const fetchQuestionSets = async () => {
      try {
        const response = await getAllQuestionSets();
        setQuestionSetList(response || []);
      } catch (error) {
        console.error("Error fetching question sets:", error);
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

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setCurrentPage(1); // Reset to page 1 when search is cleared
        return;
      }

      // Clear filters when search is performed
      setHasActiveFilters(false);
      setFilteredStudents([]);
      setCurrentPage(1); // Reset to page 1 when searching

      try {
        setIsSearching(true);
        const results = await searchStudentsApi(searchTerm.trim());
        setSearchResults(results || []);
      } catch (error: any) {
        console.error("Search error:", error);
        toast({
          title: "Search Error",
          description:
            error?.message ||
            error?.toString() ||
            "Unable to fetch search results. Please try again.",
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
        (s) => s.id === student.current_status_id,
      );
      const religion = religionList.find((r) => r.id === student.religion_id);
      const questionSet = questionSetList.find(
        (q) => q.id === student.question_set_id,
      );

      return {
        ...student,
        name: `${student.first_name || ""} ${student.middle_name || ""} ${
          student.last_name || ""
        }`.trim(),
        // Use the name from filter API if available, otherwise lookup by ID
        school_name:
          student.school_name || (school ? school.school_name : "N/A"),
        campus_name:
          student.campus_name || (campus ? campus.campus_name : "N/A"),
        current_status_name:
          student.current_status_name ||
          (current_status ? current_status.current_status_name : "N/A"),
        religion_name:
          student.religion_name || (religion ? religion.religion_name : "N/A"),
        question_set_name:
          student.question_set_name || (questionSet ? questionSet.name : "N/A"),
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
        console.log("Refreshing filtered data with params:", apiParams);
        const results = await getFilterStudent(apiParams);
        setFilteredStudents(results || []);
      } catch (error: any) {
        console.error("Error refreshing filtered data:", error);
        toast({
          title: "Refresh Error",
          description: error?.message || "Failed to refresh filtered data.",
          variant: "destructive",
          duration: 5000,
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
        title: "No Selection",
        description: "Please select applicants to delete",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    try {
      await Promise.all(selectedRows.map((id) => deleteStudent(id)));
      toast({
        title: "Applicants Deleted",
        description: "Successfully deleted selected applicants",
        duration: 5000,
      });
      setSelectedRows([]);
      refreshData();
    } catch (error: any) {
      console.error("Error deleting applicants:", error);
      toast({
        title: "Delete Error",
        description:
          error?.message ||
          error?.toString() ||
          "Failed to delete applicants. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleSendOfferLetters = async () => {
    if (!selectedRows.length) {
      toast({
        title: "No Selection",
        description: "Please select applicants to send offer letters to",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleSendBulkOfferLetters = async () => {
    if (selectedRows.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one student to send offer letters",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

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
        title: "❌ Error Sending Offer Letters",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Transform filter state to API query parameters
  const transformFiltersToAPI = (filterState: any) => {
    console.log("Transforming filters to API params:", filterState);
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
     const tags: { key: string; label: string }[] = [];

    // Stage (supports stage_id or stage)
    const stageId = (filters as any).stage_id ?? (filters as any).stage;
    if (stageId && stageId !== "all") {
      const stageObj = stageList.find((s) => s.id === stageId) as any;
      tags.push({
        key: `stage-${stageId}`,
        label: `Stage: ${stageObj?.stage_name || stageObj?.name || stageId}`,
      });
    }

    // Stage status
    if ((filters as any).stage_status && (filters as any).stage_status !== "all") {
      tags.push({
        key: `stage_status-${(filters as any).stage_status}`,
        label: `Stage Status: ${(filters as any).stage_status}`,
      });
    }

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
        const qq = questionSetList.find((x) => Number(x.id) === Number(q));
        const qualLabel = qq?.name || resolveQuestionSetName(q) || q;
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
        const rr = religionList.find((x) => x.id === r);
        tags.push({
          key: `religion-${r}`,
          label: `Religion: ${rr?.religion_name || r}`,
        });
      });
    }

    // State / District / Gender
    if ((filters as any).state && (filters as any).state !== "all") {
      tags.push({ key: `state-${(filters as any).state}`, label: `State: ${(filters as any).state}` });
    }
    if ((filters as any).district?.length) {
      const dists = (filters as any).district.filter((d: any) => d !== "all");
      dists.forEach((d: any) => tags.push({ key: `district-${d}`, label: `District: ${d}` }));
    }
    if ((filters as any).gender && (filters as any).gender !== "all") {
      tags.push({ key: `gender-${(filters as any).gender}`, label: `Gender: ${(filters as any).gender}` });
    }

    // Date range
    if ((filters as any).dateRange?.from && (filters as any).dateRange?.to) {
      const from = new Date((filters as any).dateRange.from).toLocaleDateString();
      const to = new Date((filters as any).dateRange.to).toLocaleDateString();
      const type = (filters as any).dateRange.type || "date";
      tags.push({ key: `daterange-${from}-${to}`, label: `${type} ${from} → ${to}` });
    }

    return tags;
   }, [filters, campusList, schoolList, currentstatusList, questionSetList, religionList, stageList]);
  
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
        title: "Filters Applied",
        description: `Found ${
          results?.length || 0
        } applicants matching your criteria`,
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

  const handleClearFilters = () => {
    setFilters({
      stage: "all",
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
      dateRange: { type: "applicant" as const, from: undefined, to: undefined },
    });
    setHasActiveFilters(false);
    setFilteredStudents([]);
    setCurrentPage(1);

    toast({
      title: "Filters Cleared",
      description: "All filters have been removed. Showing all applicants.",
    });
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

    // सभी applicant fields को include करें
    const headers = [
      // Personal Information
      "id",
      "first_name",
      "middle_name",
      "last_name",
      "dob",
      "gender",
      "email",
      "phone_number",
      "whatsapp_number",
      "mobile_no",

      // Address Information
      "state",
      "district",
      "city",
      "block",
      "pin_code",

      // Academic / School Information
      "school_medium",
      "school_name",
      "school_id",
      "qualification_name",
      "qualifying_school",

      // Campus
      "campus_name",
      "campus_id",

      // Caste / Religion
      "cast_name",
      "religion_name",
      "religion_id",

      // Status Information
      "current_status_name",
      "current_status_id",
      "stage_name",
      "stage_id",
      "lr_status",
      "lr_comments",
      "cfr_status",
      "cfr_comments",
      "decision_status",
      "offer_letter_status",
      "joining_status",

      // Additional Notes & Details
      "communication_notes",
      "final_notes",
      "created_at",
      "updated_at",
      "question_set_name",
      "question_set_id",
      "maximumMarks",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredApplicants.map((applicant: any) =>
        headers
          .map((header) => {
            const value = applicant[header];
            if (value === null || value === undefined) return "";
            const s = String(value);
            // Special handling for fields with commas or quotes
            if (s.includes(",") || s.includes('"') || s.includes("\n")) {
              return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `applicants_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "✅ Export Complete",
      description: `Exported ${filteredApplicants.length} applicants with all details to CSV`,
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
            <BulkActions
              selectedRowsCount={selectedRows.length}
              onBulkUpdate={() => setShowBulkUpdate(true)}
              // onBulkUpdate={handleBulkUpdate}
              onSendOfferLetters={handleSendBulkOfferLetters}
              onBulkDelete={() => setShowDeleteConfirm(true)}
            />
            <TableActions
              onCSVImport={() => setShowCSVImport(true)}
              onExportCSV={exportToCSV}
              onShowFilters={() => setShowAdvancedFilters(true)}
              onAddApplicant={() => setShowAddModal(true)}
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
                <span
                  key={t.key}
                  className="inline-flex items-center bg-muted px-2 py-1 rounded text-sm text-muted-foreground"
                >
                  {t.label}
                </span>
              ))}
            </div>
          )}
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
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Rows:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setItemsPerPage(v);
                  setCurrentPage(1); // reset to first page when page size changes
                }}
                className="border rounded px-2 py-1 bg-white text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={80}>80</option>
                <option value={100}>100</option>
                <option value={currentTotalCount}>All</option>
              </select>
            </div>
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
      <BulkOfferResultsModal
        isOpen={showBulkOfferResults}
        onClose={() => setShowBulkOfferResults(false)}
        results={bulkOfferResults}
      />
    </Card>
  );
};

export default ApplicantTable;

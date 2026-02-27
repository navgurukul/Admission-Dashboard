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
import { useReferenceData } from "@/hooks/useReferenceData";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { BulkActions } from "./applicant-table/BulkActions";
import { TableActions } from "./applicant-table/TableActions";
import { ApplicantTableRow } from "./applicant-table/ApplicantTableRow";
import { ApplicantTableHeader } from "./applicant-table/ApplicantTableHeader";
import { Pagination } from "./applicant-table/Pagination";
import { SearchBar } from "./applicant-table/SearchBar";
import { ColumnVisibility, ColumnConfig } from "./applicant-table/ColumnVisibility";
import {
  deleteStudent,
  searchStudentsApi,
  getFilterStudent,
  sendBulkOfferLetters,
  getStatusesByStageId,
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

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig[]>(() => {
    // Try to load from localStorage with versioning
    const saved = localStorage.getItem('applicantTableColumns_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved columns:', e);
      }
    }
    
    // Default columns configuration - Ordered to match ApplicantModal
    return [
      // Selection & Image
      { id: 'checkbox', label: 'Select', visible: true },
      { id: 'image', label: 'Image', visible: true  },
      
      // Personal Information (matching ApplicantModal order)
      { id: 'name', label: 'Name', visible: true},
      { id: 'email', label: 'Email', visible: true },
      { id: 'phone', label: 'Phone', visible: true },
      { id: 'whatsapp', label: 'WhatsApp', visible: false },
      { id: 'gender', label: 'Gender', visible: true },
      { id: 'dob', label: 'DOB', visible: false },
      { id: 'cast', label: 'Cast', visible: false },
      { id: 'religion', label: 'Religion', visible: false },
      { id: 'qualification', label: 'Qualification', visible: false },
      { id: 'current_status', label: 'Current Status', visible: false },
      
      // Address Information
      { id: 'state', label: 'State', visible: false },
      { id: 'district', label: 'District', visible: false },
      { id: 'block', label: 'Block', visible: false },
      { id: 'pincode', label: 'Pincode', visible: false },
      
      // Partner & Donor
      { id: 'partner', label: 'Partner', visible: false },
      { id: 'donor', label: 'Donor', visible: false },
      
      // Screening Round Fields
      { id: 'screening_status', label: 'Screening Status', visible: false },
      { id: 'screening_obtained_marks', label: 'Screening Marks', visible: true },
      { id: 'screening_exam_centre', label: 'Screening Centre', visible: false },
      { id: 'screening_audit', label: 'Screening Audit', visible: false },
      
      // Learning Round Fields
      { id: 'lr_status', label: 'LR Status', visible: false },
      { id: 'lr_comments', label: 'LR Comments', visible: false },
      { id: 'lr_audit', label: 'LR Audit', visible: false },
      
      // CFR Round Fields
      { id: 'cfr_status', label: 'CFR Status', visible: false },
      { id: 'cfr_comments', label: 'CFR Comments', visible: false },
      { id: 'cfr_audit', label: 'CFR Audit', visible: false },
      
      // Final Decision Fields
      { id: 'offer_letter_status', label: 'Offer Letter Status', visible: false },
      { id: 'onboarded_status', label: 'Onboarded Status', visible: false },
      { id: 'final_notes', label: 'Final Notes', visible: false },
      { id: 'joining_date', label: 'Joining Date', visible: false },
      { id: 'offer_sent_by', label: 'Offer Sent By', visible: false },
      { id: 'offer_audit', label: 'Offer Audit', visible: false },
      
      // Stage & School
      { id: 'stage', label: 'Stage', visible: true },
      { id: 'campus', label: 'Campus', visible: false },
      { id: 'school', label: 'School', visible: true },
      
      // Communication & Timestamps
      { id: 'notes', label: 'Communication Notes', visible: false },
      { id: 'created_at', label: 'Created At', visible: false },
      { id: 'updated_at', label: 'Updated At', visible: false },
      
      // Actions
      { id: 'actions', label: 'Actions', visible: true, locked: true },
    ];
  });

  // Clean up old localStorage keys on mount
  useEffect(() => {
    const oldKeys = ['applicantTableColumns', 'applicantTableColumns_v2'];
    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  const { toast } = useToast();
  const { hasEditAccess } = usePermissions();
  const { triggerRefresh } = useDashboardRefresh();
  const [showBulkOfferConfirmation, setShowBulkOfferConfirmation] = useState(false);
  const [stageStatuses, setStageStatuses] = useState<any[]>([]);
  
  // ✅ CRITICAL OPTIMIZATION: Only fetch students data on initial load
  const {
    students,
    totalStudents,
    totalPagesFromAPI,
    isStudentsLoading,
    isStudentsFetching,
    refetchStudents,
  } = useApplicantData(currentPage, itemsPerPage);

  // ✅ CRITICAL OPTIMIZATION: Load reference data lazily (only when needed for editing/filtering)
  const {
    isLoading: isLoadingReferenceData,
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
    fetchAllReferenceData,
    // Individual fetch functions for field-specific loading (ALL on-demand)
    fetchCampuses,
    fetchCurrentStatuses,
    fetchStages,
    fetchCasts,
    fetchQualifications,
    fetchReligions,
    fetchPartners,
    fetchDonors,
    fetchSchools,
    fetchStates,
  } = useReferenceData();

  // ✅ Intelligent stage status list: Prioritize stage-specific statuses, fallback to general statuses
  // This ensures filter tags always display correct names
  const stageStatusList = useMemo(() => {
    // If we have stage-specific statuses loaded (from getStatusesByStageId), use those first
    if (stageStatuses.length > 0) {
      return stageStatuses.map((s: any) => ({
        id: s.id,
        status_name: s.status_name || s.current_status_name || s.name,
        name: s.status_name || s.current_status_name || s.name,
      }));
    }
    
    // Otherwise, fallback to general current statuses list
    return currentstatusList.map((s: any) => ({
      id: s.id,
      status_name: s.current_status_name || s.status_name || s.name,
      name: s.current_status_name || s.status_name || s.name,
    }));
  }, [currentstatusList, stageStatuses]);

  // ✅ CRITICAL: Load reference data ONLY when user performs an action requiring it
  // This is triggered by: Add button, Edit button, Filter button
  const ensureReferenceDataLoaded = useCallback(async () => {
    if (campusList.length === 0) {
      // console.log("🔄 Loading reference data on-demand...");
      await fetchAllReferenceData();
      // console.log("✅ Reference data loaded successfully");
    } else {
      // console.log("✅ Reference data already loaded, using cache");
    }
  }, [campusList.length, fetchAllReferenceData]);

  // ✅ NEW: Field-specific data loading callbacks - ALL fields load on-demand
  const ensureFieldDataLoaded = useCallback(async (field: string) => {
    // console.log(`🔧 Loading data for field: ${field}`);
    
    switch (field) {
      case 'campus_id':
        if (campusList.length === 0) {
          // console.log('📥 Fetching campuses...');
          await fetchCampuses();
        }
        break;
      case 'current_status_id':
        if (currentstatusList.length === 0) {
          // console.log('📥 Fetching current statuses...');
          await fetchCurrentStatuses();
        }
        break;
      case 'stage_id':
        if (stageList.length === 0) {
          // console.log('📥 Fetching stages...');
          await fetchStages();
        }
        break;
      case 'state':
        if (stateList.length === 0) {
          // console.log('📥 Fetching states...');
          await fetchStates();
        }
        break;
      case 'cast_id':
        if (castList.length === 0) {
          // console.log('📥 Fetching casts...');
          await fetchCasts();
        }
        break;
      case 'qualification_id':
        if (qualificationList.length === 0) {
          // console.log('📥 Fetching qualifications...');
          await fetchQualifications();
        }
        break;
      case 'religion_id':
        if (religionList.length === 0) {
          await fetchReligions();
        }
        break;
      case 'partner_id':
        if (partnerList.length === 0) {
          // console.log('📥 Fetching partners...');
          await fetchPartners();
        }
        break;
      case 'donor_id':
        if (donorList.length === 0) {
          // console.log('📥 Fetching donors...');
          await fetchDonors();
        }
        break;
      case 'school_id':
        if (schoolList.length === 0) {
          // console.log('📥 Fetching schools...');
          await fetchSchools();
        }
        break;
      default:
        // console.log(`⚠️ No specific loader for field: ${field}`);
    }
    
    // console.log(`✅ Data loaded for field: ${field}`);
  }, [
    campusList.length,
    currentstatusList.length,
    stageList.length,
    stateList.length,
    castList.length,
    qualificationList.length,
    religionList.length,
    partnerList.length,
    donorList.length,
    schoolList.length,
    fetchCampuses,
    fetchCurrentStatuses,
    fetchStages,
    fetchStates,
    fetchCasts,
    fetchQualifications,
    fetchReligions,
    fetchPartners,
    fetchDonors,
    fetchSchools,
  ]);

  // Map student data with related info
  const applicantsToDisplay = useMemo(() => {
    // ✅ DEBUG: Log first student to see what backend returns
    if (students.length > 0 && !(window as any).__STUDENT_DEBUG_LOGGED__) {
      // console.log("🔍 Sample student data from API:", students[0]);
      // console.log("📋 Available fields:", Object.keys(students[0]));
      (window as any).__STUDENT_DEBUG_LOGGED__ = true;
    }

    // ✅ OPTIMIZATION: Backend already returns name fields (campus_name, school_name, etc.)
    // We only need to add computed fields like full name and obtained marks
    return students.map((student) => {
      // Get obtained marks from exam_sessions if available
      let obtainedMarks = 0;
      let examSchoolName = student.school_name || "N/A";
      
      if (student.exam_sessions && Array.isArray(student.exam_sessions) && student.exam_sessions.length > 0) {
        const latestExam = student.exam_sessions.reduce((latest: any, current: any) =>
          new Date(current.created_at) > new Date(latest.created_at) ? current : latest
        );
        obtainedMarks = latestExam.obtained_marks || 0;
        
        // Use exam session school name if available, otherwise fall back to student's school_name
        if (latestExam.school_name) {
          examSchoolName = latestExam.school_name;
        } else if (latestExam.school_id && schoolList.length > 0) {
          const examSchool = schoolList.find((s) => s.id === latestExam.school_id);
          examSchoolName = examSchool ? examSchool.school_name : examSchoolName;
        }
      }

      // Find question set for maximum marks (if not already in student data)
      const questionSet = questionSetList.length > 0
        ? questionSetList.find((q) => q.id === student.question_set_id)
        : null;

      return {
        ...student,
        mobile_no: student.mobile_no || student.phone_number || "",
        name: `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}`.trim(),
        school_name: examSchoolName,
        // Backend provides these - use them directly or fallback to "N/A"
        campus_name: student.campus_name || "N/A",
        current_status_name: student.current_status_name || "N/A",
        religion_name: student.religion_name || "N/A",
        question_set_name: student.question_set_name || questionSet?.name || "N/A",
        maximumMarks: student.maximumMarks || questionSet?.maximumMarks || 0,
        obtained_marks: obtainedMarks,
      };
    });
  }, [students, schoolList, questionSetList]);

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
    filteredTotalCount,
    setFilteredTotalCount,
    filteredTotalPages,
    setFilteredTotalPages,
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

  // ✅ Memoize stage ID to prevent unnecessary re-fetches
  const currentStageId = useMemo(() => {
    return (filters as any).stage_id || (filters as any).stage;
  }, [(filters as any).stage_id, (filters as any).stage]);

  // Fetch stage statuses when stage filter changes (on-demand, stage-specific)
  // ✅ OPTIMIZED: Only re-runs when stage ID actually changes
  useEffect(() => {
    const fetchStageStatuses = async () => {
      // Skip if no stage selected or "all" selected
      if (!currentStageId || currentStageId === "all") {
        setStageStatuses([]);
        return;
      }
      
      try {
        const response = await getStatusesByStageId(currentStageId);
        const statusesData = response?.data || response || [];
        setStageStatuses(statusesData);
      } catch (error) {
        console.error("❌ Error fetching stage statuses:", error);
        setStageStatuses([]);
      }
    };

    fetchStageStatuses();
  }, [currentStageId]); // ✅ Single stable dependency

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

  // ✅ Create stable filter signature to prevent duplicate API calls
  // Only changes when actual filter values change, not when object reference changes
  const filterSignature = useMemo(() => {
    return JSON.stringify(filters);
  }, [filters]);

  // Refetch filtered data when page or limit changes
  // ✅ OPTIMIZED: Uses filterSignature instead of filters object
  useEffect(() => {
    if (hasActiveFilters && !isSearching) {
      const fetchFilteredData = async () => {
        try {
          setIsFiltering(true);
          const apiParams = transformFiltersToAPI(filters);
          const apiParamsWithPagination = {
            ...apiParams,
            page: currentPage,
            limit: itemsPerPage,
          };
          // console.log(`🔄 Fetching filtered data: page ${currentPage}, limit ${itemsPerPage}`);
          const response = await getFilterStudent(apiParamsWithPagination);
          setFilteredStudents(response.data || []);
          setFilteredTotalCount(response.total || 0);
          setFilteredTotalPages(response.totalPages || 1);
          // console.log(`✅ Fetched ${response.data?.length || 0} filtered students (total: ${response.total || 0})`);
          
          // Show success toast only when filters change (not on pagination)
          if (currentPage === 1) {
            toast({
              title: "✅ Filters Applied",
              description: `Found ${response.total || 0} applicants matching your criteria`,
              variant: "default",
              className: "border-green-500 bg-green-50 text-green-900",
            });
          }
        } catch (error) {
          console.error("Error refetching filtered data:", error);
          toast({
            title: "❌ Unable to Fetch Filtered Data",
            description: getFriendlyErrorMessage(error),
            variant: "destructive",
            className: "border-red-500 bg-red-50 text-red-900",
          });
        } finally {
          setIsFiltering(false);
        }
      };
      fetchFilteredData();
    }
  }, [currentPage, itemsPerPage, hasActiveFilters, filterSignature, isSearching]); // ✅ filterSignature prevents duplicate calls

  // ✅ Load reference data ONLY when filters are active (on-demand for tag display)
  useEffect(() => {
    const loadRequiredReferenceData = async () => {
      if (!hasActiveFilters) return;
      
      // Check which reference data we actually need based on active filters
      const needsLoading: Promise<void>[] = [];
      
      if ((filters as any).partner?.length && campusList.length === 0) {
        // console.log("🔄 Loading campuses for filter tags...");
        needsLoading.push(fetchCampuses());
      }
      
      if ((filters as any).school?.length && schoolList.length === 0) {
        // console.log("🔄 Loading schools for filter tags...");
        needsLoading.push(fetchSchools());
      }
      
      // Load current statuses if stage_status filter is active AND we don't have stage-specific data
      if ((filters as any).stage_status?.length) {
        if (stageStatuses.length === 0 && currentstatusList.length === 0) {
          // console.log("🔄 Loading current statuses for filter tags...");
          needsLoading.push(fetchCurrentStatuses());
        }
      }
      
      if ((filters as any).stage_id && stageList.length === 0) {
        console.log("🔄 Loading stages for filter tags...");
        needsLoading.push(fetchStages());
      }
      
      if ((filters as any).religion?.length && religionList.length === 0) {
        needsLoading.push(fetchReligions());
      }
      
      if ((filters as any).qualification?.length && qualificationList.length === 0) {
        needsLoading.push(fetchQualifications());
      }
      
      if ((filters as any).partnerFilter?.length && partnerList.length === 0) {
        needsLoading.push(fetchPartners());
      }
      
      if ((filters as any).donor?.length && donorList.length === 0) {
        needsLoading.push(fetchDonors());
      }
      
      if (needsLoading.length > 0) {
        await Promise.all(needsLoading);
      }
    };
    
    loadRequiredReferenceData();
  }, [
    hasActiveFilters, 
    filterSignature, // ✅ Use stable signature instead of filters object
    campusList.length, 
    schoolList.length, 
    currentstatusList.length,
    stageList.length,
    religionList.length,
    qualificationList.length,
    partnerList.length,
    donorList.length,
    stageStatuses.length,
    fetchCampuses,
    fetchSchools,
    fetchCurrentStatuses,
    fetchStages,
    fetchReligions,
    fetchQualifications,
    fetchPartners,
    fetchDonors,
  ]);

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

  // Column visibility handlers
  const handleColumnToggle = useCallback((columnId: string) => {
    setVisibleColumns(prev => {
      const updated = prev.map(col => 
        col.id === columnId && !col.locked
          ? { ...col, visible: !col.visible }
          : col
      );
      // Save to localStorage with versioning
      localStorage.setItem('applicantTableColumns_v3', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleResetToDefault = useCallback(() => {
    // Default visible columns - only the essential ones
    const defaultColumns = [
      { id: 'checkbox', label: 'Select', visible: true, locked: true },
      { id: 'image', label: 'Image', visible: true, locked: true },
      { id: 'name', label: 'Name', visible: true, locked: true },
      { id: 'email', label: 'Email', visible: true, locked: true },
      { id: 'screening_obtained_marks', label: 'Screening Marks', visible: true, locked: false },
      { id: 'phone', label: 'Phone', visible: true, locked: true },
      { id: 'gender', label: 'Gender', visible: true, locked: false },
      { id: 'status', label: 'Status', visible: true, locked: false },
      { id: 'school', label: 'School', visible: true, locked: false },
      { id: 'actions', label: 'Actions', visible: true, locked: true },
    ];

    // Reset all columns to their default visibility
    setVisibleColumns(prev => {
      const updated = prev.map(col => {
        const defaultCol = defaultColumns.find(d => d.id === col.id);
        return defaultCol 
          ? { ...col, visible: defaultCol.visible }
          : { ...col, visible: false }; // All other columns hidden by default
      });
      // Save to localStorage
      localStorage.setItem('applicantTableColumns_v3', JSON.stringify(updated));
      return updated;
    });

    toast({
      title: "Columns Reset",
      description: "Column visibility has been reset to default settings.",
      duration: 3000,
    });
  }, [toast]);

  // ✅ FIXED: Remove visibleColumns from dependencies to prevent API calls on UI-only changes
  const isColumnVisible = useCallback((columnId: string) => {
    const column = visibleColumns.find(col => col.id === columnId);
    return column?.visible ?? true;
  }, [visibleColumns]); // Update when column visibility changes

  // Calculate total visible columns for dynamic colspan
  const visibleColumnCount = useMemo(() => {
    return visibleColumns.filter(col => col.visible).length;
  }, [visibleColumns]);

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
        const apiParamsWithPagination = {
          ...apiParams,
          page: currentPage,
          limit: itemsPerPage,
        };
        const response = await getFilterStudent(apiParamsWithPagination);
        setFilteredStudents(response.data || []);
        setFilteredTotalCount(response.total || 0);
        setFilteredTotalPages(response.totalPages || 1);
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

  // Lightweight update handler for inline edits - refreshes data to show changes
  const handleInlineUpdate = useCallback(() => {
    // Refetch student data to display updated values
    refetchStudents();
    // Also trigger dashboard stats refresh
    triggerRefresh();
  }, [refetchStudents, triggerRefresh]);

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
        description: `You’ve selected ${selectedStudents.length} students, but ${studentsWithoutCampus.length} ${studentsWithoutCampus.length === 1 ? "student doesn’t" : "students don’t"
          } have a campus assigned${studentNames
            ? `. Please assign a campus to: ${studentNames}${moreCount > 0 ? ` and ${moreCount} others` : ""
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
    if (filterState.partnerFilter?.length) {
      const partners = filterState.partnerFilter.filter((p: any) => p !== "all");
      if (partners.length > 0) {
        apiParams.partner_id = partners;
      }
    }

    // Donor ID
    if (filterState.donor?.length) {
      const donors = filterState.donor.filter((d: any) => d !== "all");
      if (donors.length > 0) {
        apiParams.donor_id = donors;
      }
    }

    // School ID
    if (filterState.school?.length) {
      const schools = filterState.school.filter((s: any) => s !== "all");
      if (schools.length > 0) {
        apiParams.school_id = schools;
      }
    }

    // Current Status ID
    if (
      filterState.currentStatus?.length &&
      filterState.currentStatus[0] !== "all"
    ) {
      apiParams.current_status_id = filterState.currentStatus[0];
    }

    // State - prefer state_code (e.g. "AN") over full name
    if (filterState.state && filterState.state !== "all") {
      const stateValue = (() => {
        // Try to resolve from reference stateList where
        // value = state_code, label = state_name
        const match = stateList.find(
          (s) =>
            s.label === filterState.state ||
            s.value === filterState.state
        );
        // If we find a match, use its state_code (value),
        // otherwise fall back to whatever is in the filter
        return match ? match.value : filterState.state;
      })();

      apiParams.state = stateValue;
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

    // // Debug: log first student to see available fields
    // if (filteredApplicants && filteredApplicants.length > 0) {
    //   // console.log('Sample filtered student data:', filteredApplicants[0]);
    // }

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

    // Individual stage status chips with intelligent name resolution
    const stageStatusValue = (filters as any).stage_status;
    const stageStatusArray = Array.isArray(stageStatusValue)
      ? stageStatusValue
      : stageStatusValue && stageStatusValue !== "all"
        ? [stageStatusValue]
        : [];

    stageStatusArray.forEach((statusId: string) => {
      // Strategy: Try multiple sources to find the status name
      // 1. Check stage-specific statuses first (most accurate)
      let statusObj: any = stageStatusList.find((s: any) => String(s.id) === String(statusId));
      
      // 2. If not found, check currentstatusList directly
      if (!statusObj) {
        statusObj = currentstatusList.find((s: any) => String(s.id) === String(statusId));
      }
      
      // 3. Extract the name with multiple fallbacks
      const statusLabel = 
        statusObj?.status_name || 
        statusObj?.current_status_name || 
        statusObj?.name || 
        resolveCurrentStatusName(statusId) || 
        statusId;

      tags.push({
        key: `stage_status-${statusId}`,
        label: `Status: ${statusLabel}`,
        onRemove: () => handleRemoveSingleStageStatus(statusId)
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


    // Current Status
    if ((filters as any).currentStatus?.length) {
      const curr = (filters as any).currentStatus.filter((c: any) => c !== "all");
      curr.forEach((c: any) => {
        const cs = currentstatusList.find((st: any) => String(st.id) === String(c));
        const csLabel = cs?.current_status_name || cs?.name || resolveCurrentStatusName(c) || c;
        tags.push({
          key: `currentStatus-${c}`,
          label: `Current Status: ${csLabel}`,
          onRemove: () => handleClearSingleFilter("currentStatus")
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
          onRemove: () => handleClearSingleFilter("partnerFilter", p),
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
          onRemove: () => handleClearSingleFilter("donor", d),
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
          onRemove: () => handleClearSingleFilter("school", s),
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
  }, [filters, campusList, schoolList, currentstatusList, questionSetList, religionList, stageList, partnerList, donorList, qualificationList, filteredApplicants, stageStatusList]);

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
      (newFilters.school?.length > 0) ||
      (newFilters.currentStatus?.length && newFilters.currentStatus[0] !== "all") ||
      (newFilters.partner?.length && newFilters.partner[0] !== "all") ||
      (newFilters.partnerFilter?.length > 0) ||
      (newFilters.donor?.length > 0) ||
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

    // ✅ Load reference data for filter tags display
    // This ensures filter tags show names instead of IDs
    if (campusList.length === 0) {
      await ensureReferenceDataLoaded();
    }

    // Clear search when filters are applied
    setSearchTerm("");
    setSearchResults([]);

    try {
      setIsFiltering(true);
      setHasActiveFilters(true);
      setCurrentPage(1); // Reset to first page when filters are applied
      
      // ✅ DON'T call API here - let the useEffect handle it to prevent duplicates
      
      // The useEffect on line ~505 will detect the filterSignature change
      // and automatically fetch the filtered data
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
      // ✅ OPTIMIZED: Just update state, let useEffect handle the API call
      setHasActiveFilters(true);
      setCurrentPage(1);
      console.log("✅ Filter removed, useEffect will fetch updated data");
    }
  };

  // Clear individual filter and re-apply
  const handleClearSingleFilter = async (filterKey: string, valueToRemove?: any) => {
    let newFilters = { ...filters } as any;

    if (valueToRemove !== undefined) {
      const currentVal = newFilters[filterKey];
      if (Array.isArray(currentVal)) {
        newFilters[filterKey] = currentVal.filter((v: any) => String(v) !== String(valueToRemove));
        if (newFilters[filterKey].length === 0) {
          if (['partnerFilter', 'donor', 'school', 'partner', 'currentStatus', 'qualification', 'district', 'religion'].includes(filterKey)) {
            newFilters[filterKey] = [];
          } else {
            newFilters[filterKey] = "all";
          }
        }
      }
    } else {
      // Original logic for clearing the whole filter
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
    }

    setFilters(newFilters);

    // Check if any filters are still active
    const hasFilters =
      (newFilters.stage_id && newFilters.stage_id !== undefined) ||
      (newFilters.stage_status && newFilters.stage_status !== "all") ||
      (newFilters.qualification?.length && newFilters.qualification[0] !== "all") ||
      (newFilters.qualification?.length && newFilters.qualification[0] !== "all") ||
      (newFilters.school?.length > 0) ||
      (newFilters.currentStatus?.length && newFilters.currentStatus[0] !== "all") ||
      (newFilters.partner?.length && newFilters.partner[0] !== "all") ||
      (newFilters.partnerFilter?.length > 0) ||
      (newFilters.donor?.length > 0) ||
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
      // ✅ OPTIMIZED: Just update state, let useEffect handle the API call
      setHasActiveFilters(true);
      setCurrentPage(1);
      console.log("✅ Filter removed, useEffect will fetch updated data");
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

      // Prepare filter parameters for filtered export
      let filterParams = null;
      if (exportType === 'filtered' && hasActiveFilters) {
        filterParams = transformFiltersToAPI(filters);
      }

      // Determine what data to pass based on export type
      // For 'all' export without filters/search, pass empty array to trigger API fetch
      // For 'selected' export, pass selected data
      // For 'filtered' export, pass filter params (not paginated data)
      // For search, pass search results
      const shouldPassFilteredData = exportType === 'selected' ||
        (searchTerm.trim().length > 0 && exportType === 'filtered');

      await exportApplicantsToCSV({
        questionSetList,
        filteredData: shouldPassFilteredData ? filteredApplicants : [],
        selectedData: selectedApplicantsData,
        filterParams: filterParams, // Pass filter parameters for batch fetching
        searchTerm: searchTerm.trim(), // Pass search term
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
      return filteredTotalCount;
    } else {
      return totalStudents;
    }
  };

  const currentTotalCount = getTotalCount();

  // Calculate total pages based on current view
  const totalPages = useMemo(() => {
    // For search mode, use client-side pagination
    if (searchTerm.trim()) {
      return Math.max(1, Math.ceil(currentTotalCount / itemsPerPage));
    }
    // For filter mode, use server-side filtered pagination
    if (hasActiveFilters) {
      return filteredTotalPages;
    }
    // For normal mode, use server-side pagination count
    return totalPagesFromAPI;
  }, [
    searchTerm,
    hasActiveFilters,
    currentTotalCount,
    itemsPerPage,
    totalPagesFromAPI,
    filteredTotalPages,
  ]);

  // Apply pagination to search results (only for search mode)
  // For filter and normal mode, data is already paginated by the server
  const paginatedApplicants = useMemo(() => {
    // For search mode, apply client-side pagination
    if (searchTerm.trim()) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredApplicants.slice(startIndex, endIndex);
    }
    // For filter or normal mode, use data directly from server (already paginated)
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
                ? `${currentTotalCount} applicants found (search)`
                : hasActiveFilters
                  ? `${currentTotalCount} applicants found (filtered)`
                  : `${totalStudents} total applicants`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            {hasEditAccess && (
              <BulkActions
                selectedRowsCount={selectedRows.length}
                onBulkUpdate={() => { ensureReferenceDataLoaded(); setShowBulkUpdate(true); }}
                // onBulkUpdate={handleBulkUpdate}
                onSendOfferLetters={handleSendOfferLetters}
                onBulkDelete={() => setShowDeleteConfirm(true)}
              />
            )}
            <TableActions
              onCSVImport={hasEditAccess ? () => { ensureReferenceDataLoaded(); setShowCSVImport(true); } : undefined}
              onExportCSV={exportToCSV}
              onShowFilters={() => { setShowAdvancedFilters(true); }}
              onAddApplicant={hasEditAccess ? () => { ensureReferenceDataLoaded(); setShowAddModal(true); } : undefined}
              isExporting={isExporting}
              hasActiveFilters={hasActiveFilters}
              searchTerm={searchTerm}
              filteredCount={currentTotalCount}
              selectedCount={selectedRows.length}
            />
            <ColumnVisibility
              columns={visibleColumns}
              onColumnToggle={handleColumnToggle}
              onResetToDefault={handleResetToDefault}
            />
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
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full py-1.5 px-3 h-auto flex items-center gap-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleClearFilters}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              )}
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
                isColumnVisible={isColumnVisible}
              />

              <TableBody>
                {isSearching || isFiltering || isLoadingData ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="text-center py-12">
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
                      colSpan={visibleColumnCount}
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
                      onUpdate={handleInlineUpdate}
                      onViewDetails={setApplicantToView}
                      onViewComments={setApplicantForComments}
                      onCampusChange={handleInlineUpdate}
                      ensureReferenceDataLoaded={ensureReferenceDataLoaded}
                      ensureFieldDataLoaded={ensureFieldDataLoaded}
                      isLoadingReferenceData={isLoadingReferenceData}
                      schoolList={schoolList}
                      campusList={campusList}
                      religionList={religionList}
                      currentstatusList={currentstatusList}
                      stageStatusList={stageStatusList}
                      questionSetList={questionSetList}
                      partnerList={partnerList}
                      donorList={donorList}
                      castList={castList}
                      qualificationList={qualificationList}
                      stateList={stateList}
                      isColumnVisible={isColumnVisible}
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

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdmissionsSidebar } from "../components/AdmissionsSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, ArrowLeft } from "lucide-react";
import { AdvancedFilterModal } from "@/components/AdvancedFilterModal";
import { ApplicantModal } from "@/components/ApplicantModal";
import { Pagination } from "@/components/applicant-table/Pagination";
import { getFilterStudent, getCampusById, getCampusStudentStats, CampusStudentStats, getStatusesByStageId } from "@/utils/api";
import { useApplicantData } from "@/hooks/useApplicantData";
import { useOnDemandReferenceData } from "@/hooks/useOnDemandReferenceData";
import { useToast } from "@/hooks/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";

interface FilterState {
  stage: string;
  stage_id?: number;
  stage_status: string | string[];
  examMode: string;
  interviewMode: string;
  partner: string[];
  district: string[];
  school: string[];
  religion: string[];
  qualification: string[];
  currentStatus: string[];
  state?: string;
  gender?: string;
  donor: string[];
  partnerFilter: string[];
  dateRange: {
    type: "applicant" | "lastUpdate" | "interview";
    from?: Date;
    to?: Date;
  };
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "student", label: "Student Data" },
];

const ROWS_PER_PAGE = 10;

const CampusDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [programs, setPrograms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campusName, setCampusName] = useState("");
  const [campusStats, setCampusStats] = useState<CampusStudentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const navigate = useNavigate();
  const [studentPage, setStudentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    stage: "all",
    stage_status: "all",
    examMode: "all",
    interviewMode: "all",
    partner: [],
    district: [],
    school: [],
    religion: [],
    qualification: [],
    currentStatus: [],
    donor: [],
    partnerFilter: [],
    dateRange: { type: "applicant" },
  });
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [filteredStudentsData, setFilteredStudentsData] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ✅ DRY: Use on-demand reference data for filter tags
  // Data is loaded lazily - only when needed for displaying active filter tags
  const {
    campusList,
    schoolList,
    currentstatusList,
    stageList,
    religionList,
    questionSetList,
    qualificationList,
    partnerList,
    donorList,
    loadFieldData, // For loading individual fields on-demand
    loadMultipleFields, // For loading multiple fields at once
  } = useOnDemandReferenceData();

  // Local state to store stage-specific statuses
  const [stageStatuses, setStageStatuses] = useState<any[]>([]);

  // Transform filters to API params helper function
  const transformFiltersToAPI = useCallback((f: any) => {
    const apiParams: any = { campus_id: Number(id) };

    if (f.dateRange?.from && f.dateRange?.to) {
      const formatDate = (date: Date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      if (f.dateRange.type === "applicant") {
        apiParams.created_at_from = formatDate(f.dateRange.from);
        apiParams.created_at_to = formatDate(f.dateRange.to);
      } else if (f.dateRange.type === "lastUpdate") {
        apiParams.updated_at_from = formatDate(f.dateRange.from);
        apiParams.updated_at_to = formatDate(f.dateRange.to);
      } else if (f.dateRange.type === "interview") {
        apiParams.interview_date_from = formatDate(f.dateRange.from);
        apiParams.interview_date_to = formatDate(f.dateRange.to);
      }
    }

    if (f.stage_id) apiParams.stage_id = f.stage_id;
    if (f.stage_status && f.stage_status !== "all") apiParams.stage_status = f.stage_status;
    if (f.qualification?.length && f.qualification[0] !== "all") apiParams.qualification_id = f.qualification[0];
    if (f.partnerFilter?.length && f.partnerFilter[0] !== "all") apiParams.partner_id = f.partnerFilter[0];
    if (f.donor?.length && f.donor[0] !== "all") apiParams.donor_id = f.donor[0];
    if (f.school?.length && f.school[0] !== "all") apiParams.school_id = f.school[0];
    if (f.currentStatus?.length && f.currentStatus[0] !== "all") apiParams.current_status_id = f.currentStatus[0];
    if (f.state && f.state !== "all") apiParams.state = f.state;
    if (f.district?.length && f.district[0] !== "all") apiParams.district = f.district[0];
    if (f.gender && f.gender !== "all") apiParams.gender = f.gender;

    return apiParams;
  }, [id]);

  // ✅ Smart on-demand loading: Load reference data ONLY for active filters
  // This ensures filter tags can display names without pre-loading everything
  useEffect(() => {
    const fieldsToLoad: string[] = [];

    // Check which filters are active and need reference data
    if ((filters as any).stage_id || (filters as any).stage) {
      fieldsToLoad.push('stage');
    }
    if ((filters as any).stage_status) {
      fieldsToLoad.push('current_status'); // stageStatusList
    }
    if ((filters as any).school?.length) {
      fieldsToLoad.push('school');
    }
    if ((filters as any).currentStatus?.length) {
      fieldsToLoad.push('current_status');
    }
    if ((filters as any).qualification?.length) {
      fieldsToLoad.push('qualification', 'question_set');
    }
    if ((filters as any).religion?.length) {
      fieldsToLoad.push('religion');
    }
    if ((filters as any).partnerFilter?.length) {
      fieldsToLoad.push('partner');
    }
    if ((filters as any).donor?.length) {
      fieldsToLoad.push('donor');
    }
    if ((filters as any).cast?.length) {
      fieldsToLoad.push('cast');
    }

    // Remove duplicates and load only if needed
    const uniqueFields = [...new Set(fieldsToLoad)];
    if (uniqueFields.length > 0) {
      loadMultipleFields(uniqueFields);
    }
  }, [filters, loadMultipleFields]);

  // Fetch campus details
  useEffect(() => {
    if (!id) return;

    const fetchCampusDetails = async () => {
      try {
        const response = await getCampusById(Number(id));
        if (response.success && response.data) {
          setCampusName(response.data.campus_name);
        }
      } catch (error) {
        console.error("Failed to fetch campus details:", error);
      }
    };

    fetchCampusDetails();
  }, [id, refreshKey]);

  // Fetch campus stats
  useEffect(() => {
    if (!id) return;

    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const response = await getCampusStudentStats(Number(id));
        if (response.success && response.data) {
          setCampusStats(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch campus stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [id, refreshKey]);

  // Fetch students data with proper server-side pagination
  useEffect(() => {
    if (!id) return;

    // Skip if we have active filters - those are handled separately
    if (hasActiveFilters) return;

    setLoading(true);
    setError(null);

    const fetchStudents = async () => {
      try {
        const response = await getFilterStudent({
          campus_id: Number(id),
          page: studentPage,
          limit: rowsPerPage
        });
        const studentsData = response.data || [];
        setStudents(studentsData);
        setFilteredStudentsData([]);
        setTotalStudents(response.total || 0);
        setTotalPages(response.totalPages || 1);

        // If on overview tab, calculate school capacities from student data
        if (activeTab === "overview") {
          const schoolMap = new Map<string, number>();
          let notAllottedCount = 0;

          studentsData.forEach((student: any) => {
            if (student.school_name) {
              schoolMap.set(
                student.school_name,
                (schoolMap.get(student.school_name) || 0) + 1,
              );
            } else {
              notAllottedCount++;
            }
          });

          const schoolData = Array.from(schoolMap.entries()).map(
            ([name, count]) => ({
              name: name,
              capacity: count,
            }),
          );

          // Add "Not Allotted Schools" if there are students without school
          if (notAllottedCount > 0) {
            schoolData.push({
              name: "Not Allotted Schools",
              capacity: notAllottedCount,
            });
          }

          setPrograms(schoolData);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Failed to fetch student data");
        setStudents([]);
        setPrograms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [id, activeTab, hasActiveFilters, studentPage, rowsPerPage, refreshKey]);

  // Refetch filtered data when page or rowsPerPage changes (and filters are active)
  useEffect(() => {
    if (!id || !hasActiveFilters) return;

    const fetchFilteredData = async () => {
      setLoading(true);
      try {
        const apiParams = transformFiltersToAPI(filters);
        const response = await getFilterStudent({
          ...apiParams,
          page: studentPage,
          limit: rowsPerPage
        });
        setFilteredStudentsData(response.data || []);
        setTotalStudents(response.total || 0);
        setTotalPages(response.totalPages || 1);
      } catch (error) {
        console.error("Error fetching filtered students:", error);
        setError("Failed to fetch filtered students");
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredData();
  }, [studentPage, rowsPerPage, hasActiveFilters, refreshKey]);

  // Use filtered data if filters are active, otherwise use all students
  const displayStudents = hasActiveFilters ? filteredStudentsData : students;
  
  // Client-side search filter only (pagination is server-side)
  const processedStudents = useMemo(() => {
    if (!searchTerm) return displayStudents;
    
    const search = searchTerm.toLowerCase();
    return displayStudents.filter((student) => {
      return (
        (student.first_name && student.first_name.toLowerCase().includes(search)) ||
        (student.last_name && student.last_name.toLowerCase().includes(search)) ||
        (student.email && student.email.toLowerCase().includes(search)) ||
        (student.phone_number && student.phone_number.includes(search))
      );
    });
  }, [displayStudents, searchTerm]);

  // Server-side pagination - no need to slice, data is already paginated
  const paginatedStudents = processedStudents;

  // Calculate display indices for pagination info
  const startIdx = totalStudents === 0 ? 0 : (studentPage - 1) * rowsPerPage + 1;
  const endIdx = Math.min(studentPage * rowsPerPage, totalStudents);

  // Helper functions to resolve names from IDs (duplicate from ApplicantTable)
  const resolveCampusName = (value: any) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "string" && /\D/.test(value)) return value;
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      const byId = campusList.find((c) => Number(c.id) === numeric);
      if (byId) return byId.campus_name || byId.name || String(value);
      if (numeric >= 0 && numeric < campusList.length) {
        return campusList[numeric]?.campus_name || campusList[numeric]?.name || String(value);
      }
    }
    return String(value);
  };

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

  // Build active filter tags (duplicate from ApplicantTable)
  const activeFilterTags = useMemo(() => {
    const tags: { key: string; label: string; onRemove?: () => void }[] = [];

    // Stage chip
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
      // Use stageStatuses to resolve status names (stage-specific statuses)
      const statusObj = stageStatuses.find((s: any) => String(s.id) === String(status));
      const statusLabel = statusObj?.status_name || statusObj?.current_status_name || statusObj?.name || status;

      tags.push({
        key: `stage_status-${status}`,
        label: `Status: ${statusLabel}`,
        onRemove: () => handleRemoveSingleStageStatus(status)
      });
    });

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

    // Qualification
    if ((filters as any).qualification?.length) {
      const quals = (filters as any).qualification.filter((q: any) => q !== "all");
      quals.forEach((q: any) => {
        let qualLabel = q;

        const fromQualList = qualificationList.find((x: any) =>
          String(x.id) === String(q) ||
          x.qualification_name === q ||
          x.name === q
        );

        const fromQuestionSet = questionSetList.find((x: any) =>
          String(x.id) === String(q) ||
          x.name === q
        );

        if (fromQualList) {
          qualLabel = fromQualList.qualification_name || fromQualList.name || q;
        } else if (fromQuestionSet) {
          qualLabel = fromQuestionSet.name || fromQuestionSet.qualification_name || q;
        } else {
          qualLabel = resolveQuestionSetName(q) || q;
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
        const rr = religionList.find((x) => x.id === r);
        tags.push({
          key: `religion-${r}`,
          label: `Religion: ${rr?.religion_name || r}`,
        });
      });
    }

    // Partner
    if ((filters as any).partnerFilter?.length) {
      const partners = (filters as any).partnerFilter.filter((p: any) => p !== "all");
      partners.forEach((p: any) => {
        const partner = partnerList.find((pt) => Number(pt.id) === Number(p));
        const partnerLabel = partner?.partner_name || partner?.name || p;
        tags.push({
          key: `partnerFilter-${p}`,
          label: `Partner: ${partnerLabel}`,
        });
      });
    }

    // Donor
    if ((filters as any).donor?.length) {
      const donors = (filters as any).donor.filter((d: any) => d !== "all");
      donors.forEach((d: any) => {
        const donor = donorList.find((dn) => Number(dn.id) === Number(d));
        const donorLabel = donor?.donor_name || donor?.name || d;
        tags.push({
          key: `donor-${d}`,
          label: `Donor: ${donorLabel}`,
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
  }, [filters, campusList, schoolList, currentstatusList, questionSetList, religionList, stageList, qualificationList, partnerList, donorList, stageStatuses]);

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      stage: "all",
      stage_id: undefined,
      stage_status: "all",
      examMode: "all",
      interviewMode: "all",
      partner: [],
      district: [],
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
    setFilteredStudentsData([]);
    setStageStatuses([]);
    setStudentPage(1);

    toast({
      title: "✅ Filters Cleared",
      description: "All filters have been removed.",
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

    await reapplyFilters(newFilters);
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
      case "partnerFilter":
        newFilters.partnerFilter = [];
        break;
      case "donor":
        newFilters.donor = [];
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

    await reapplyFilters(newFilters);
  };

  // Reapply filters helper function
  const reapplyFilters = async (newFilters: any) => {
    setFilters(newFilters);

    // Fetch stage statuses if stage is still selected
    if (newFilters.stage_id) {
      try {
        const statusesResponse = await getStatusesByStageId(newFilters.stage_id);
        setStageStatuses(statusesResponse || []);
      } catch (error) {
        console.error("Error fetching stage statuses:", error);
        setStageStatuses([]);
      }
    } else {
      setStageStatuses([]);
    }

    // Check if any filters are still active
    const hasFilters =
      (newFilters.stage_id && newFilters.stage_id !== undefined) ||
      (newFilters.stage_status && newFilters.stage_status !== "all") ||
      (newFilters.qualification?.length && newFilters.qualification[0] !== "all") ||
      (newFilters.school?.length && newFilters.school[0] !== "all") ||
      (newFilters.currentStatus?.length && newFilters.currentStatus[0] !== "all") ||
      (newFilters.partnerFilter?.length && newFilters.partnerFilter[0] !== "all") ||
      (newFilters.donor?.length && newFilters.donor[0] !== "all") ||
      (newFilters.state && newFilters.state !== "all") ||
      (newFilters.district?.length && newFilters.district[0] !== "all") ||
      (newFilters.gender && newFilters.gender !== "all") ||
      (newFilters.dateRange?.from && newFilters.dateRange?.to);

    if (!hasFilters) {
      setHasActiveFilters(false);
      setFilteredStudentsData([]);
      setStudentPage(1);
      toast({
        title: "✅ Filter Removed",
        description: "All filters cleared.",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } else {
      try {
        setLoading(true);
        const apiParams = transformFiltersToAPI(newFilters);
        const response = await getFilterStudent({
          ...apiParams,
          page: studentPage,
          limit: rowsPerPage
        });
        setFilteredStudentsData(response.data || []);
        setTotalStudents(response.total || 0);
        setTotalPages(response.totalPages || 1);
        setStudentPage(1);

        toast({
          title: "✅ Filter Removed",
          description: `Found ${response.total || 0} students matching your criteria`,
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
        setFilteredStudentsData([]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdmissionsSidebar />
      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8 md:ml-64">
        {/* Back button - positioned at top left */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/campus")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center md:text-left text-foreground">
            {campusName} Campus
          </h2>
          {/* Back button - shown on desktop */}
          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/campus")}
            // className="hidden md:flex items-center gap-2 shrink-0"
            className="flex items-center gap-2 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campus List
          </Button> */}
        </div>
        <div className="flex justify-center mb-6 gap-2">
          {TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              className={
                activeTab === tab.key
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary"
                  : "border-2 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              }
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === "overview" ? "Programs offered" : "Student Data"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 flex flex-col items-center justify-center">
                    <p className="text-sm font-medium text-blue-600 mb-1">Total Students</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {statsLoading ? "..." : campusStats?.totalStudentsInCampus || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 flex flex-col items-center justify-center">
                    <p className="text-sm font-medium text-green-600 mb-1">Students With School</p>
                    <p className="text-2xl font-bold text-green-900">
                      {statsLoading ? "..." : campusStats?.studentsWithSchool || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4 flex flex-col items-center justify-center">
                    <p className="text-sm font-medium text-orange-600 mb-1">Students Without School</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {statsLoading ? "..." : campusStats?.studentsWithoutSchool || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            {activeTab === "overview" &&
              (loading || statsLoading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : programs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No school data available
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>School Name</TableHead>
                      <TableHead>Number of Students</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campusStats ? (
                      <>
                        {Object.entries(campusStats.schoolBreakdown).map(([name, count], idx) => (
                          <TableRow key={name}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{name}</TableCell>
                            <TableCell>{count}</TableCell>
                          </TableRow>
                        ))}
                        {campusStats.studentsWithoutSchool > 0 && (
                          <TableRow>
                            <TableCell>{Object.keys(campusStats.schoolBreakdown).length + 1}</TableCell>
                            <TableCell>Not Allotted Schools</TableCell>
                            <TableCell>{campusStats.studentsWithoutSchool}</TableCell>
                          </TableRow>
                        )}
                      </>
                    ) : (
                      programs.map((school, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{school.name}</TableCell>
                          <TableCell>{school.capacity}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              ))}
            {activeTab === "student" && (
              <>
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by name, email, or mobile..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => setShowFilterModal(true)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-destructive hover:text-destructive/80 border-destructive/30 hover:border-destructive"
                      onClick={handleClearFilters}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Filter Tags */}
                {activeFilterTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
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

                <AdvancedFilterModal
                  isOpen={showFilterModal}
                  onClose={() => setShowFilterModal(false)}
                  onApplyFilters={async (f, receivedStageStatuses) => {
                    setFilters(f);

                    // Use stage statuses passed from AdvancedFilterModal (already loaded there)
                    if (receivedStageStatuses) {
                      setStageStatuses(receivedStageStatuses);
                    } else {
                      setStageStatuses([]);
                    }

                    // Build API params from filters
                    const apiParams: any = { campus_id: Number(id) };

                    // Date range mapping based on type
                    if (f.dateRange?.from && f.dateRange?.to) {
                      const formatDate = (date: Date) => {
                        const d = new Date(date);
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, "0");
                        const day = String(d.getDate()).padStart(2, "0");
                        return `${year}-${month}-${day}`;
                      };

                      if (f.dateRange.type === "applicant") {
                        apiParams.created_at_from = formatDate(f.dateRange.from);
                        apiParams.created_at_to = formatDate(f.dateRange.to);
                      } else if (f.dateRange.type === "lastUpdate") {
                        apiParams.updated_at_from = formatDate(f.dateRange.from);
                        apiParams.updated_at_to = formatDate(f.dateRange.to);
                      } else if (f.dateRange.type === "interview") {
                        apiParams.interview_date_from = formatDate(f.dateRange.from);
                        apiParams.interview_date_to = formatDate(f.dateRange.to);
                      }
                    }

                    // Stage ID
                    if (f.stage_id) {
                      apiParams.stage_id = f.stage_id;
                    }

                    // Stage Status
                    if (f.stage_status && f.stage_status !== "all") {
                      apiParams.stage_status = f.stage_status;
                    }

                    // Qualification ID
                    if (f.qualification?.length && f.qualification[0] !== "all") {
                      apiParams.qualification_id = f.qualification[0];
                    }

                    // Partner ID (from partnerFilter field)
                    if (f.partnerFilter?.length && f.partnerFilter[0] !== "all") {
                      apiParams.partner_id = f.partnerFilter[0];
                    }

                    // Donor ID
                    if (f.donor?.length && f.donor[0] !== "all") {
                      apiParams.donor_id = f.donor[0];
                    }

                    // School ID
                    if (f.school?.length && f.school[0] !== "all") {
                      apiParams.school_id = f.school[0];
                    }

                    // Current Status ID
                    if (f.currentStatus?.length && f.currentStatus[0] !== "all") {
                      apiParams.current_status_id = f.currentStatus[0];
                    }

                    // State
                    if (f.state && f.state !== "all") {
                      apiParams.state = f.state;
                    }

                    // District
                    if (f.district?.length && f.district[0] !== "all") {
                      apiParams.district = f.district[0];
                    }

                    // Gender
                    if (f.gender && f.gender !== "all") {
                      apiParams.gender = f.gender;
                    }

                    // Check if any filters are applied
                    const hasFilters = Object.keys(apiParams).length > 1; // More than just campus_id

                    if (hasFilters) {
                      setHasActiveFilters(true);
                      setLoading(true);
                      try {
                        const response = await getFilterStudent({
                          ...apiParams,
                          page: 1,
                          limit: rowsPerPage
                        });
                        setFilteredStudentsData(response.data || []);
                        setTotalStudents(response.total || 0);
                        setTotalPages(response.totalPages || 1);
                      } catch (error) {
                        console.error(
                          "Error fetching filtered students:",
                          error,
                        );
                        setError("Failed to fetch filtered students");
                      } finally {
                        setLoading(false);
                      }
                    } else {
                      setHasActiveFilters(false);
                      setFilteredStudentsData([]);
                    }

                    setStudentPage(1);
                  }}
                  currentFilters={filters}
                  students={students}
                  hideCampusFilter={true}
                />
                {loading ? (
                  <p>Loading students...</p>
                ) : error ? (
                  <p className="text-destructive">{error}</p>
                ) : paginatedStudents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No students found
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {paginatedStudents.map((student, idx) => (
                        <div
                          key={student.id}
                          className="bg-card rounded-xl p-6 shadow-soft border border-border hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-lg font-bold text-foreground mb-1">
                                {`${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}`.trim() ||
                                  "No Name"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.email || "No email"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-2"
                              onClick={() => {
                                setSelectedApplicant(student);
                                setShowApplicantModal(true);
                              }}
                            >
                              View
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Number:
                              </span>{" "}
                              {student.phone_number || student.mobile_number || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                WhatsApp:
                              </span>{" "}
                              {student.whatsapp_number || student.alternate_mobile || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Gender:
                              </span>{" "}
                              {student.gender || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                DOB:
                              </span>{" "}
                              {student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                State:
                              </span>{" "}
                              {student.state_name || student.state || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                District:
                              </span>{" "}
                              {student.district || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Caste:
                              </span>{" "}
                              {student.cast_name || student.caste_name || student.caste || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Religion:
                              </span>{" "}
                              {student.religion_name || student.religion || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Qualification:
                              </span>{" "}
                              {student.qualification_name || student.qualification || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                School:
                              </span>{" "}
                              {student.school_name || student.school || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Stage:
                              </span>{" "}
                              {student.stage_name || student.stage || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Status:
                              </span>{" "}
                              {student.current_status_name || "N/A"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Pagination
                      currentPage={studentPage}
                      setCurrentPage={setStudentPage}
                      itemsPerPage={rowsPerPage}
                      setItemsPerPage={setRowsPerPage}
                      totalPages={totalPages}
                      showingStart={startIdx}
                      showingEnd={endIdx}
                      currentTotalCount={totalStudents}
                      totalStudents={totalStudents}
                      searchTerm={searchTerm}
                      hasActiveFilters={hasActiveFilters}
                    />
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Applicant Detail Modal */}
        {selectedApplicant && (
          <ApplicantModal
            applicant={selectedApplicant}
            isOpen={showApplicantModal}
            onClose={() => {
              setShowApplicantModal(false);
              setSelectedApplicant(null);
              // Refresh data after modal closes to get any updates
              setRefreshKey((prev) => prev + 1);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default CampusDetail;

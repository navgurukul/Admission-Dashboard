import React, { useEffect, useState } from "react";
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
import { Search, Filter, X } from "lucide-react";
import { AdvancedFilterModal } from "@/components/AdvancedFilterModal";
import { 
  getFilterStudent, 
  getCampusById, 
  getAllStages,
  getAllSchools,
  getAllQualification,
  getAllStatuses,
  getAllPartners,
  getCampusesApi,
  getAllDonors,
  getAllReligions
} from "@/utils/api";

interface FilterState {
  stage: string;
  stage_id?: number;
  stage_status: string | string[];
  status?: string;
  examMode: string;
  interviewMode: string;
  partner: string[];
  district: string[];
  market?: string[];
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
  const [activeTab, setActiveTab] = useState("overview");
  const [programs, setPrograms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campusName, setCampusName] = useState("");
  const navigate = useNavigate();
  const [studentPage, setStudentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    stage: "all",
    stage_id: undefined,
    stage_status: "all",
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
    donor: [],
    partnerFilter: [],
    dateRange: { type: "applicant" },
  });
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [filteredStudentsData, setFilteredStudentsData] = useState<any[]>([]);
  const [stageList, setStageList] = useState<any[]>([]);
  const [schoolList, setSchoolList] = useState<any[]>([]);
  const [qualificationList, setQualificationList] = useState<any[]>([]);
  const [currentStatusList, setCurrentStatusList] = useState<any[]>([]);
  const [partnerList, setPartnerList] = useState<any[]>([]);
  const [campusList, setCampusList] = useState<any[]>([]);
  const [donorList, setDonorList] = useState<any[]>([]);
  const [religionList, setReligionList] = useState<any[]>([]);

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
  }, [id]);

  // Fetch stages and other dropdown data for filter
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [stages, schools, qualifications, statuses, partners, campuses, donors, religions] = await Promise.all([
          getAllStages(),
          getAllSchools(),
          getAllQualification(),
          getAllStatuses(),
          getAllPartners(),
          getCampusesApi(),
          getAllDonors(),
          getAllReligions(),
        ]);
        
        setStageList(stages || []);
        setSchoolList(schools || []);
        setQualificationList(qualifications || []);
        setCurrentStatusList(statuses || []);
        setPartnerList(partners || []);
        setCampusList(campuses || []);
        setDonorList(donors || []);
        setReligionList(religions || []);
      } catch (error) {
        console.error("Failed to fetch dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  // Helper function to clear individual filters and refetch
  const clearSingleFilter = async (filterKey: string) => {
    const newFilters = { ...filters };
    
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
        break;
      case "district":
        newFilters.district = [];
        break;
      case "partner":
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
      case "partnerFilter":
        newFilters.partnerFilter = [];
        break;
      case "donor":
        newFilters.donor = [];
        break;
    }
    
    setFilters(newFilters);
    
    // Rebuild API params and refetch
    const apiParams: any = { campus_id: Number(id) };
    
    if (newFilters.stage_id) {
      apiParams.stage_id = newFilters.stage_id;
    }
    if (newFilters.stage_status && newFilters.stage_status !== "all") {
      apiParams.stage_status = newFilters.stage_status;
    }
    if (newFilters.qualification?.length && newFilters.qualification[0] !== "all") {
      apiParams.qualification_id = newFilters.qualification[0];
    }
    if (newFilters.school?.length && newFilters.school[0] !== "all") {
      apiParams.school_id = newFilters.school[0];
    }
    if (newFilters.currentStatus?.length && newFilters.currentStatus[0] !== "all") {
      apiParams.current_status_id = newFilters.currentStatus[0];
    }
    if (newFilters.state && newFilters.state !== "all") {
      apiParams.state = newFilters.state;
    }
    if (newFilters.district?.length && newFilters.district[0] !== "all") {
      apiParams.district = newFilters.district[0];
    }
    if (newFilters.partnerFilter?.length && newFilters.partnerFilter[0] !== "all") {
      apiParams.partner_id = newFilters.partnerFilter[0];
    }
    if (newFilters.donor?.length && newFilters.donor[0] !== "all") {
      apiParams.donor_id = newFilters.donor[0];
    }
    if (newFilters.religion?.length && newFilters.religion[0] !== "all") {
      apiParams.religion_id = newFilters.religion[0];
    }
    
    const hasFilters = Object.keys(apiParams).length > 1;
    
    if (hasFilters) {
      setHasActiveFilters(true);
      setLoading(true);
      try {
        const results = await getFilterStudent(apiParams);
        setFilteredStudentsData(results || []);
      } catch (error) {
        console.error("Error refetching after filter clear:", error);
        setError("Failed to fetch filtered students");
      } finally {
        setLoading(false);
      }
    } else {
      // No filters left, reset to showing all campus students
      setHasActiveFilters(false);
      setFilteredStudentsData([]);
    }
  };

  // Helper to remove individual stage status
  const removeSingleStageStatus = async (statusToRemove: string) => {
    const currentStatuses = Array.isArray(filters.stage_status)
      ? filters.stage_status
      : filters.stage_status && filters.stage_status !== "all"
      ? [filters.stage_status]
      : [];
    
    const newStatuses = currentStatuses.filter((s) => s !== statusToRemove);
    
    const newFilters = {
      ...filters,
      stage_status: newStatuses.length > 0 ? newStatuses : "all",
    };
    
    // If removing the last status, also clear the stage
    if (newStatuses.length === 0) {
      newFilters.stage = "all";
      newFilters.stage_id = undefined;
    }
    
    setFilters(newFilters);
    
    // Refetch with updated filters
    const apiParams: any = { campus_id: Number(id) };
    
    if (newFilters.stage_id) {
      apiParams.stage_id = newFilters.stage_id;
    }
    if (newFilters.stage_status && newFilters.stage_status !== "all") {
      apiParams.stage_status = newFilters.stage_status;
    }
    
    const hasFilters = Object.keys(apiParams).length > 1;
    
    if (hasFilters) {
      setHasActiveFilters(true);
      setLoading(true);
      try {
        const results = await getFilterStudent(apiParams);
        setFilteredStudentsData(results || []);
      } catch (error) {
        console.error("Error refetching after status removal:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setHasActiveFilters(false);
      setFilteredStudentsData([]);
    }
  };

  // Build active filter tags
  const activeFilterTags: { key: string; label: string; onRemove: () => void }[] = [];
  
  // Stage
  if (filters.stage && filters.stage !== "all") {
    activeFilterTags.push({
      key: "stage",
      label: `Stage: ${filters.stage}`,
      onRemove: () => clearSingleFilter("stage"),
    });
  }
  
  // Individual stage statuses
  const stageStatusArray = Array.isArray(filters.stage_status)
    ? filters.stage_status
    : filters.stage_status && filters.stage_status !== "all"
    ? [filters.stage_status]
    : [];
  
  stageStatusArray.forEach((status) => {
    activeFilterTags.push({
      key: `stage_status-${status}`,
      label: `Status: ${status}`,
      onRemove: () => removeSingleStageStatus(status),
    });
  });
  
  // State
  if (filters.state) {
    activeFilterTags.push({
      key: "state",
      label: `State: ${filters.state}`,
      onRemove: () => clearSingleFilter("state"),
    });
  }
  
  // District
  if (filters.district?.length) {
    activeFilterTags.push({
      key: "district",
      label: `District: ${filters.district[0]}`,
      onRemove: () => clearSingleFilter("district"),
    });
  }
  
  // Campus (partner field)
  if (filters.partner?.length) {
    const campus = campusList.find((c: any) => String(c.id) === String(filters.partner[0]));
    const campusLabel = campus?.campus_name || campus?.name || filters.partner[0];
    activeFilterTags.push({
      key: "partner",
      label: `Campus: ${campusLabel}`,
      onRemove: () => clearSingleFilter("partner"),
    });
  }
  
  // School
  if (filters.school?.length) {
    const school = schoolList.find((s: any) => String(s.id) === String(filters.school[0]));
    const schoolLabel = school?.school_name || school?.name || filters.school[0];
    activeFilterTags.push({
      key: "school",
      label: `School: ${schoolLabel}`,
      onRemove: () => clearSingleFilter("school"),
    });
  }
  
  // Qualification
  if (filters.qualification?.length) {
    const qualification = qualificationList.find((q: any) => String(q.id) === String(filters.qualification[0]));
    const qualLabel = qualification?.qualification_name || qualification?.name || filters.qualification[0];
    activeFilterTags.push({
      key: "qualification",
      label: `Qualification: ${qualLabel}`,
      onRemove: () => clearSingleFilter("qualification"),
    });
  }
  
  // Current Status
  if (filters.currentStatus?.length) {
    const status = currentStatusList.find((s: any) => String(s.id) === String(filters.currentStatus[0]));
    const statusLabel = status?.current_status_name || status?.name || filters.currentStatus[0];
    activeFilterTags.push({
      key: "currentStatus",
      label: `Current Status: ${statusLabel}`,
      onRemove: () => clearSingleFilter("currentStatus"),
    });
  }
  
  // Partner Filter
  if (filters.partnerFilter?.length) {
    const partner = partnerList.find((p: any) => String(p.id) === String(filters.partnerFilter[0]));
    const partnerLabel = partner?.partner_name || partner?.name || filters.partnerFilter[0];
    activeFilterTags.push({
      key: "partnerFilter",
      label: `Partner: ${partnerLabel}`,
      onRemove: () => clearSingleFilter("partnerFilter"),
    });
  }
  
  // Donor
  if (filters.donor?.length) {
    const donor = donorList.find((d: any) => String(d.id) === String(filters.donor[0]));
    const donorLabel = donor?.donor_name || donor?.name || filters.donor[0];
    activeFilterTags.push({
      key: "donor",
      label: `Donor: ${donorLabel}`,
      onRemove: () => clearSingleFilter("donor"),
    });
  }
  
  // Religion
  if (filters.religion?.length) {
    const religion = religionList.find((r: any) => String(r.id) === String(filters.religion[0]));
    const religionLabel = religion?.religion_name || religion?.name || filters.religion[0];
    activeFilterTags.push({
      key: "religion",
      label: `Religion: ${religionLabel}`,
      onRemove: () => clearSingleFilter("religion"),
    });
  }

  // Fetch students data (used for both overview and student tabs)
  useEffect(() => {
    if (!id) return;

    // Skip if we have active filters - those are handled separately
    if (hasActiveFilters) return;

    setLoading(true);
    setError(null);

    const fetchStudents = async () => {
      try {
        const studentsData = await getFilterStudent({ campus_id: Number(id) });
        setStudents(studentsData || []);
        setFilteredStudentsData([]);

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
  }, [id, activeTab, hasActiveFilters]);

  // Use filtered data if filters are active, otherwise use all students
  const displayStudents = hasActiveFilters ? filteredStudentsData : students;
  const paginatedStudents = displayStudents.slice(
    (studentPage - 1) * rowsPerPage,
    studentPage * rowsPerPage,
  );
  const totalStudentPages = Math.ceil(displayStudents.length / rowsPerPage);
  const startIdx =
    displayStudents.length === 0 ? 0 : (studentPage - 1) * rowsPerPage + 1;
  const endIdx = Math.min(studentPage * rowsPerPage, displayStudents.length);

  // Filtered students based on search only (not filters - filters are applied via API)
  const filteredStudents = paginatedStudents.filter((student) => {
    // If no search term, show all paginated students
    if (!searchTerm.trim()) {
      return true;
    }

    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (student.first_name &&
        student.first_name.toLowerCase().includes(search)) ||
      (student.last_name && student.last_name.toLowerCase().includes(search)) ||
      (student.email && student.email.toLowerCase().includes(search)) ||
      (student.phone_number && student.phone_number.includes(search));

    return matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <AdmissionsSidebar />
      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8 md:ml-64">
        <h2 className="text-3xl font-bold text-center mb-6 text-foreground">
          {campusName} Campus
        </h2>
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
            {activeTab === "overview" &&
              (loading ? (
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
                    {programs.map((school, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{school.name}</TableCell>
                        <TableCell>{school.capacity}</TableCell>
                      </TableRow>
                    ))}
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
                </div>

                {/* Active Filter Tags */}
                {activeFilterTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activeFilterTags.map((tag) => (
                      <Button
                        key={tag.key}
                        size="sm"
                        variant="secondary"
                        className="rounded-full py-1.5 px-3 flex items-center gap-2 h-auto text-xs"
                        onClick={tag.onRemove}
                      >
                        <span>{tag.label}</span>
                        <X className="w-3 h-3" />
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full py-1.5 px-3 h-auto text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setFilters({
                          stage: "all",
                          stage_id: undefined,
                          stage_status: "all",
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
                          donor: [],
                          partnerFilter: [],
                          dateRange: { type: "applicant" },
                        });
                        setHasActiveFilters(false);
                        setFilteredStudentsData([]);
                      }}
                    >
                      Clear All
                    </Button>
                  </div>
                )}

                <AdvancedFilterModal
                  isOpen={showFilterModal}
                  onClose={() => setShowFilterModal(false)}
                  onApplyFilters={async (f) => {
                    setFilters(f);

                    // Build API params from filters
                    const apiParams: any = { campus_id: Number(id) };

                    if (f.partner?.length && f.partner[0] !== "all") {
                      apiParams.school_id = f.partner[0];
                    }
                    if (f.stage_id) {
                      apiParams.stage_id = f.stage_id;
                    }
                    // Stage Status
                    if (f.stage_status && f.stage_status !== "all") {
                      apiParams.stage_status = f.stage_status;
                    }
                    if (
                      f.qualification?.length &&
                      f.qualification[0] !== "all"
                    ) {
                      apiParams.qualification_id = f.qualification[0];
                    }
                    if (f.school?.length && f.school[0] !== "all") {
                      apiParams.school_id = f.school[0];
                    }
                    if (
                      f.currentStatus?.length &&
                      f.currentStatus[0] !== "all"
                    ) {
                      apiParams.current_status_id = f.currentStatus[0];
                    }
                    if (f.state && f.state !== "all") {
                      apiParams.state = f.state;
                    }
                    if (f.district?.length && f.district[0] !== "all") {
                      apiParams.district = f.district[0];
                    }
                    // Partner filter
                    if (f.partnerFilter?.length && f.partnerFilter[0] !== "all") {
                      apiParams.partner_id = f.partnerFilter[0];
                    }
                    // Donor filter
                    if (f.donor?.length && f.donor[0] !== "all") {
                      apiParams.donor_id = f.donor[0];
                    }
                    // Religion filter
                    if (f.religion?.length && f.religion[0] !== "all") {
                      apiParams.religion_id = f.religion[0];
                    }

                    // Check if any filters are applied
                    const hasFilters = Object.keys(apiParams).length > 1; // More than just campus_id

                    console.log("🔍 Filter Applied:", {
                      filterObject: f,
                      apiParams: apiParams,
                      hasFilters: hasFilters
                    });

                    if (hasFilters) {
                      setHasActiveFilters(true);
                      setLoading(true);
                      try {
                        const results = await getFilterStudent(apiParams);
                        console.log("✅ Filter Results:", results?.length, "students found");
                        setFilteredStudentsData(results || []);
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
                  stageList={stageList}
                  hiddenFilters={['campus']}
                />
                {loading ? (
                  <p>Loading students...</p>
                ) : error ? (
                  <p className="text-destructive">{error}</p>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No students found
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredStudents.map((student, idx) => (
                        <div
                          key={student.id}
                          className="bg-card rounded-xl p-6 shadow-soft border border-border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-lg font-bold text-foreground mb-1">
                                {`${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}`.trim() ||
                                  "No Name"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.email || "No email"}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Number:
                              </span>{" "}
                              {student.phone_number || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                WhatsApp:
                              </span>{" "}
                              {student.whatsapp_number || "N/A"}
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
                              {student.dob || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                State:
                              </span>{" "}
                              {student.state || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                District:
                              </span>{" "}
                              {student.district || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Cast:
                              </span>{" "}
                              {student.cast_name || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Religion:
                              </span>{" "}
                              {student.religion_name || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Qualification:
                              </span>{" "}
                              {student.qualification_name || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                School:
                              </span>{" "}
                              {student.school_name || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Stage:
                              </span>{" "}
                              {student.stage_name || student.stage || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Current Work:
                              </span>{" "}
                              {student.current_status_name || "N/A"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center items-center gap-6 mt-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rows per page:</span>
                        <select
                          className="border-2 border-input rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          value={rowsPerPage}
                          onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setStudentPage(1);
                          }}
                        >
                          {[10, 20, 50, 100].map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {startIdx}-{endIdx} of {displayStudents.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          className="px-3 py-1.5 rounded-lg border-2 border-border bg-card text-sm disabled:opacity-50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                          onClick={() =>
                            setStudentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={studentPage === 1}
                          aria-label="Previous page"
                        >
                          &#60;
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg border-2 border-border bg-card text-sm disabled:opacity-50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                          onClick={() =>
                            setStudentPage((p) =>
                              Math.min(totalStudentPages, p + 1),
                            )
                          }
                          disabled={studentPage === totalStudentPages}
                          aria-label="Next page"
                        >
                          &#62;
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CampusDetail;

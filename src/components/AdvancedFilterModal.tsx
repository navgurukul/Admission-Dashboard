import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { getFilterStudent, getAllStages } from "@/utils/api";
import { STAGE_STATUS_MAP } from "./applicant-table/StageDropdown";
import {
  getStatesList,
  getDistrictsList,
  getCampusesList,
  getSchoolsList,
  getReligionsList,
  getQualificationsList,
  getStatusesList,
  getPartnersFromStudents,
  getDistrictsFromStudents,
  getStatesFromStudents,
  State,
  District,
} from "@/utils/filterUtils";

interface FilterState {
  stage: string;
  stage_id?: number;
  stage_status: string;
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
  dateRange: {
    type: "applicant" | "lastUpdate" | "interview";
    from?: Date;
    to?: Date;
  };
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  currentFilters: FilterState;
  students: any[];
  campusList?: any[];
  schoolList?: any[];
  religionList?: any[];
  qualificationList?: any[];
  currentstatusList?: any[];
}

// const STAGE_STATUS_MAP = {
//   sourcing: [
//     "Enrollment Key Generated",
//     "Basic Details Entered",
//     "Duplicate",
//     "Unreachable",
//     "Became Disinterested",
//   ],
//   screening: [
//     "Screening Test Pass",
//     "Screening Test Fail",
//     "Created Student Without Exam",
//   ],
// };

export function AdvancedFilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
  students,
  campusList = [],
  schoolList = [],
  religionList = [],
  qualificationList = [],
  currentstatusList = [],
}: AdvancedFilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(currentFilters);
  const [availableOptions, setAvailableOptions] = useState({
    partners: [] as string[],
    districts: [] as string[],
    schools: [] as any[],
    religions: [] as any[],
    qualifications: [] as any[],
    currentStatuses: [] as any[],
    campuses: [] as any[],
    stages: [] as any[],
  });

  const [availableStates, setAvailableStates] = useState<State[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState({
    states: false,
    districts: false,
    general: false,
  });

  const { toast } = useToast();

  // Use ref to track if initial load is done
  const isInitialLoadDone = useRef(false);
  const prevIsOpen = useRef(isOpen);

  // State change handler - wrapped in useCallback to prevent recreating on every render
  const handleStateChange = useCallback(
    async (selectedState: string, updateFilters = true) => {
      // console.log(" State Selected:", selectedState);

      if (updateFilters) {
        setFilters((prev) => ({
          ...prev,
          state: selectedState === "all" ? undefined : selectedState,
          district: [], // Reset district when state changes
        }));
      }

      if (selectedState === "all") {
        setAvailableDistricts([]);
        return;
      }

      setIsLoading((prev) => ({ ...prev, districts: true }));

      try {
        // Find state code from available states
        const stateObj = availableStates.find((s) => s.name === selectedState);
        const stateCode = stateObj?.state_code || stateObj?.id;

        let districts: District[] = [];

        if (stateCode && stateCode !== selectedState) {
          // Get districts from API using state code
          districts = await getDistrictsList(stateCode);
        } else {
          // Fallback: filter districts from students data
          const studentDistricts = availableOptions.districts;
          districts = studentDistricts.map((district) => ({
            id: district,
            name: district,
          }));
        }

        // console.log(" Districts loaded:", {
        //   state: selectedState,
        //   stateCode,
        //   districts: districts.length
        // });

        setAvailableDistricts(districts);
      } catch (error) {
        // console.error("Error loading districts:", error);
        setAvailableDistricts([]);
      } finally {
        setIsLoading((prev) => ({ ...prev, districts: false }));
      }
    },
    [availableStates, availableOptions.districts],
  );

  // Load all filter data when modal opens - optimized to prevent freezing
  useEffect(() => {
    const loadFilterData = async () => {
      // Only load when modal opens (not on every prop change)
      if (!isOpen) {
        isInitialLoadDone.current = false;
        return;
      }

      // Prevent re-running if modal is already open
      if (prevIsOpen.current === isOpen && isInitialLoadDone.current) {
        return;
      }

      prevIsOpen.current = isOpen;

      setIsLoading((prev) => ({ ...prev, general: true }));
      setFilters(currentFilters);

      try {
        // Load data from APIs in parallel
        const [
          apiStates,
          apiCampuses,
          apiSchools,
          apiReligions,
          apiQualifications,
          apiStatuses,
          apiStages,
        ] = await Promise.all([
          getStatesList(),
          getCampusesList(),
          getSchoolsList(),
          getReligionsList(),
          getQualificationsList(),
          getStatusesList(),
          getAllStages(),
        ]);

        // Extract data from students
        const partnersFromStudents = getPartnersFromStudents(students);
        const districtsFromStudents = getDistrictsFromStudents(students);
        const statesFromStudents = getStatesFromStudents(students);

        // Combine API states with states from students
        const allStates = [...apiStates];
        statesFromStudents.forEach((stateName) => {
          if (!allStates.find((s) => s.name === stateName)) {
            allStates.push({ id: stateName, name: stateName });
          }
        });

        // Use provided lists or API data
        const finalCampuses = campusList.length > 0 ? campusList : apiCampuses;
        const finalSchools = schoolList.length > 0 ? schoolList : apiSchools;
        const finalReligions =
          religionList.length > 0 ? religionList : apiReligions;
        const finalQualifications =
          qualificationList.length > 0 ? qualificationList : apiQualifications;
        const finalStatuses =
          currentstatusList.length > 0 ? currentstatusList : apiStatuses;

        setAvailableOptions({
          partners: partnersFromStudents,
          districts: districtsFromStudents,
          schools: finalSchools,
          religions: finalReligions,
          qualifications: finalQualifications,
          currentStatuses: finalStatuses,
          campuses: finalCampuses,
          stages: apiStages,
     
        });

        setAvailableStates(allStates);

        // Load districts for current state if selected
        if (currentFilters.state && currentFilters.state !== "all") {
          await handleStateChange(currentFilters.state, false);
        }

        isInitialLoadDone.current = true;
      } catch (error) {
        // console.error(" Error loading filter data:", error);
        toast({
          title: "Error",
          description: "Failed to load filter options",
          variant: "destructive",
        });
      } finally {
        setIsLoading((prev) => ({ ...prev, general: false }));
      }
    };

    loadFilterData();
     
  }, [isOpen]); // Only depend on isOpen to prevent infinite loops and freezing

  const resetFilters = () => {
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
      dateRange: { type: "applicant" },
    });
    setAvailableDistricts([]);
  };

  const handleApplyFilters = () => {
    // // Validate qualification field
    // if (!filters.qualification?.length || filters.qualification[0] === 'all') {
    //   toast({
    //     title: "Validation Error",
    //     description: "Please select a qualification before applying filters.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    // Validate date range - if start is selected, end must be selected
    if (filters.dateRange.from && !filters.dateRange.to) {
      toast({
        title: "Incomplete Date Range",
        description: "Please select an end date to complete the date range.",
        variant: "destructive",
      });
      return;
    }

    // Validate date range - if end is selected, start must be selected
    if (filters.dateRange.to && !filters.dateRange.from) {
      toast({
        title: "Incomplete Date Range",
        description: "Please select a start date before selecting an end date.",
        variant: "destructive",
      });
      return;
    }

    // Validate that end date is greater than or equal to start date (allow same day)
    if (filters.dateRange.from && filters.dateRange.to) {
      if (filters.dateRange.from > filters.dateRange.to) {
        toast({
          title: "Invalid Date Range",
          description: "End date cannot be before start date.",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate stage status - mandatory for all stages except sourcing
    if (filters.stage && filters.stage !== "all" && filters.stage.toLowerCase() !== "sourcing") {
      if (!filters.stage_status || filters.stage_status === "all") {
        toast({
          title: "Stage Status Required",
          description: `Please select a stage status for ${filters.stage} stage.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Create processed filters object without the old 'status' field
    const processedFilters: any = {
      ...filters,
    };
    
    // Remove the old 'status' field if it exists
    delete processedFilters.status;
    
    console.log("Current Filters:", processedFilters);
    onApplyFilters(processedFilters);
    onClose();
    toast({
      title: "Filters Applied",
      description: "Your filters have been successfully applied.",
    });
  };


  // Helper function to get display name
  const getDisplayName = (
    item: any,
    nameKey: string = "name",
    fallbackPrefix: string = "Item",
  ) => {
    if (!item) return `${fallbackPrefix}`;
    if (typeof item === "string") return item;

    const possibleKeys = [
      nameKey,
      "name",
      "title",
      "label",
      "school_name",
      "religion_name",
      "current_status_name",
      "qualification_name",
      "campus_name",
      "district_name",
    ];

    for (const key of possibleKeys) {
      if (item[key] && typeof item[key] === "string") {
        return item[key];
      }
    }

    return item.id ? `${fallbackPrefix} ${item.id}` : `${fallbackPrefix}`;
  };

  // Helper function to get value
  const getValue = (item: any, valueKey: string = "id") => {
    if (!item) return "";
    if (typeof item === "string") return item;

    if (item[valueKey]) return String(item[valueKey]);
    if (item.stage_id) return String(item.stage_id);
    if (item.id) return String(item.id);
    if (item.value) return String(item.value);

    return String(item);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Advanced Filters
            {isLoading.general && (
              <span className="text-sm text-muted-foreground">
                (Loading...)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stage & Status & Modes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Stage</h3>
              <Select
                value={filters.stage_id ? String(filters.stage_id) : "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    setFilters((prev) => ({
                      ...prev,
                      stage: "all",
                      stage_id: undefined,
                      stage_status: "all",
                    }));
                    return;
                  }

                  const selectedStage = availableOptions.stages.find(
                    (s: any) =>
                      String(s.stage_id) === String(value) ||
                      String(s.id) === String(value),
                  );

                  if (selectedStage) {
                    const stageName =
                      selectedStage.stage_name ||
                      selectedStage.name ||
                      String(value);
                    const stageId = selectedStage.stage_id || selectedStage.id;

                    setFilters((prev) => ({
                      ...prev,
                      stage: stageName,
                      stage_id: Number(stageId),
                      stage_status: "all",
                    }));
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Stages</SelectItem>
                  {/* <SelectItem value="sourcing">Sourcing</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem> */}

                  {availableOptions.stages.map((stage: any) => {
                    const stageId = stage.stage_id || stage.id;
                    const stageName =
                      stage.stage_name || stage.name || `Stage ${stageId}`;
                    return (
                      <SelectItem key={stageId} value={String(stageId)}>
                        {stageName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Stage Status */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">
                Stage Status
                {filters.stage && 
                 filters.stage !== "all" && 
                 filters.stage.toLowerCase() !== "sourcing" && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </h3>
              <Select
                value={filters.stage_status || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, stage_status: value }))
                }
                disabled={
                  !filters.stage || 
                  filters.stage === "all" || 
                  filters.stage.toLowerCase() === "sourcing"
                }
              >
                <SelectTrigger 
                  className={`w-full ${
                    filters.stage && 
                    filters.stage !== "all" && 
                    filters.stage.toLowerCase() !== "sourcing" && 
                    (!filters.stage_status || filters.stage_status === "all")
                      ? "border-red-300"
                      : ""
                  }`}
                >
                  <SelectValue 
                    placeholder={
                      !filters.stage || filters.stage === "all"
                        ? "Select stage first"
                        : filters.stage.toLowerCase() === "sourcing"
                          ? "Not applicable for Sourcing"
                          : "Select status"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Statuses</SelectItem>
                  {filters.stage && 
                   filters.stage !== "all" && 
                   STAGE_STATUS_MAP[filters.stage.toLowerCase()] &&
                   STAGE_STATUS_MAP[filters.stage.toLowerCase()].map((status: string) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Exam Mode */}
            {/* <div className="space-y-3">
              <h3 className="font-semibold text-sm">Exam Mode</h3>
              <Select
                value={filters.examMode}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, examMode: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select exam mode" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div> */}

            {/* Gender */}
            {/* <div className="space-y-3">
              <h3 className="font-semibold text-sm">Gender</h3>
              <Select
                value={filters.gender || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, gender: value === "all" ? undefined : value }))
                }
                disabled={true}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div> */}

            {/* Interview Mode */}
            {/* <div className="space-y-3">
              <h3 className="font-semibold text-sm">Interview Mode</h3>
              <Select
                value={filters.interviewMode}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, interviewMode: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select interview mode" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </div>

          {/* Location Filters - State, District, Campus */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <h3 className="font-semibold text-sm mb-2">State</h3>
              <Select
                value={filters.state || "all"}
                onValueChange={handleStateChange}
                disabled={isLoading.general}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select State">
                    {filters.state || "All States"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All States</SelectItem>
                  {availableStates.map((state) => (
                    <SelectItem key={state.id} value={state.name}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {/* {availableStates.length} states available */}
                {isLoading.general && " - Loading..."}
              </p>
            </div>

            {/* District / City */}
            <div>
              <h3 className="font-semibold text-sm mb-2">District</h3>
              <Select
                value={filters.district?.[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    district: value === "all" ? [] : [value],
                  }))
                }
                disabled={
                  !filters.state ||
                  filters.state === "all" ||
                  isLoading.districts
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !filters.state || filters.state === "all"
                        ? "Select state first"
                        : isLoading.districts
                          ? "Loading districts..."
                          : "Select district"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Districts</SelectItem>
                  {availableDistricts.map((district) => (
                    <SelectItem key={district.id} value={district.name}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {/* {availableDistricts.length} districts available */}
                {"Select state first"}
                {isLoading.districts && " - Loading..."}
              </p>
            </div>

            {/* Partner */}
            {/* <div>
              <h3 className="font-semibold text-sm mb-2">Partner</h3>
              <Select
                value={filters.partner?.[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    partner: value === "all" ? [] : [value],
                  }))
                }
                disabled={isLoading.general}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoading.general ? "Loading..." : "Select partner"} />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Partners</SelectItem>
                  {availableOptions.partners.map((partner) => (
                    <SelectItem key={partner} value={partner}>
                      {partner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {availableOptions.partners.length} partners available
              </p>
            </div> */}

            {/* Campus */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Campus</h3>
              <Select
                value={filters.partner?.[0] || "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    setFilters((prev) => ({
                      ...prev,
                      partner: [],
                    }));
                  } else {
                    setFilters((prev) => ({
                      ...prev,
                      partner: [value],
                    }));
                  }
                }}
                disabled={isLoading.general}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      isLoading.general ? "Loading..." : "Select campus"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Campuses</SelectItem>
                  {availableOptions.campuses.map((campus) => (
                    <SelectItem key={getValue(campus)} value={getValue(campus)}>
                      {getDisplayName(campus, "campus_name", "Campus")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {/* {availableOptions.campuses.length} campuses available */}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            {/* School */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Qualifying School</h3>
              <Select
                value={filters.school?.[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    school: value === "all" ? [] : [value],
                  }))
                }
                disabled={isLoading.general}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      isLoading.general ? "Loading..." : "Select school"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Schools</SelectItem>
                  {availableOptions.schools.map((school) => (
                    <SelectItem key={getValue(school)} value={getValue(school)}>
                      {getDisplayName(school, "school_name", "School")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {/* {availableOptions.schools.length} schools available */}
              </p>
            </div>

            {/* Qualification */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Qualification</h3>
              <Select
                value={filters.qualification?.[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    qualification: value === "all" ? [] : [value],
                  }))
                }
                disabled={isLoading.general}
              >
                <SelectTrigger
                  className={`w-full ${!filters.qualification?.length || filters.qualification[0] === "all" ? "border-red-300" : ""}`}
                >
                  <SelectValue
                    placeholder={
                      isLoading.general ? "Loading..." : "Select qualification"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Qualifications</SelectItem>
                  {availableOptions.qualifications.map((qualification) => (
                    <SelectItem
                      key={getValue(qualification)}
                      value={getValue(qualification)}
                    >
                      {getDisplayName(
                        qualification,
                        "qualification_name",
                        "Qualification",
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Status */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Current Status</h3>
              <Select
                value={filters.currentStatus?.[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    currentStatus: value === "all" ? [] : [value],
                  }))
                }
                disabled={isLoading.general}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      isLoading.general ? "Loading..." : "Select status"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Statuses</SelectItem>
                  {availableOptions.currentStatuses.map((status) => (
                    <SelectItem key={getValue(status)} value={getValue(status)}>
                      {getDisplayName(status, "current_status_name", "Status")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {/* {availableOptions.currentStatuses.length} statuses available */}
              </p>
            </div>
          </div>

          {/* Date Range */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Date Range</h3>
              {(filters.dateRange.from || filters.dateRange.to) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: {
                        ...prev.dateRange,
                        from: undefined,
                        to: undefined,
                      },
                    }));
                  }}
                  className="h-7 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear Dates
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm">Date Type</Label>
                <Select
                  value={filters.dateRange.type}
                  onValueChange={(
                    value: "applicant" | "lastUpdate" | "interview",
                  ) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, type: value },
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="applicant">
                      Applicant Creation Date
                    </SelectItem>
                    {/* <SelectItem value="lastUpdate">Last Update</SelectItem>
                    <SelectItem value="interview">Interview Date</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">
                  From
                  {filters.dateRange.from && !filters.dateRange.to && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start ${filters.dateRange.from && !filters.dateRange.to ? "border-red-300" : ""}`}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {filters.dateRange.from
                        ? format(filters.dateRange.from, "PP")
                        : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[60]" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from}
                      onSelect={(date) => {
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: {
                            ...prev.dateRange,
                            from: date,
                            // Auto-set end date to same as start date by default
                            to: date,
                          },
                        }));
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {filters.dateRange.from && !filters.dateRange.to && (
                  <p className="text-xs text-red-500 mt-1">
                    Please select end date
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm">
                  To
                  {filters.dateRange.to && !filters.dateRange.from && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start ${filters.dateRange.to && !filters.dateRange.from ? "border-red-300" : ""}`}
                      disabled={!filters.dateRange.from}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {filters.dateRange.to
                        ? format(filters.dateRange.to, "PP")
                        : filters.dateRange.from
                          ? "Pick end date"
                          : "Select start first"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[60]" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to}
                      onSelect={(date) => {
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, to: date },
                        }));
                      }}
                      disabled={(date) =>
                        filters.dateRange.from
                          ? date <= filters.dateRange.from
                          : true
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {!filters.dateRange.from && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Select start date first
                  </p>
                )}
                {filters.dateRange.to && !filters.dateRange.from && (
                  <p className="text-xs text-red-500 mt-1">
                    Please select start date
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex justify-between pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={resetFilters}
            size="sm"
            disabled={isLoading.general}
          >
            Reset All
          </Button>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              size="sm"
              disabled={isLoading.general}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyFilters}
              size="sm"
              className="bg-primary text-primary-foreground"
              disabled={isLoading.general}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

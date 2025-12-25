import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Filter, X, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { 
  getFilterStudent, 
  getStatusesByStageId, 
  getAllDonors, 
  getAllPartners,
  getCampusesApi,
  getAllSchools,
  getAllReligions,
  getAllStatus,
  getAllStages
} from "@/utils/api";
import { cn } from "@/lib/utils";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
// import { STAGE_STATUS_MAP } from "./applicant-table/StageDropdown";
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
  stage_status: string | string[]; // Support both single and multiple
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

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  currentFilters: FilterState;
  students: any[];
  hideCampusFilter?: boolean; // Optional prop to hide campus field
}

export function AdvancedFilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
  students,
  hideCampusFilter = false,
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
    donors: [] as any[],
    partnersList: [] as any[],
  });

  const [availableStates, setAvailableStates] = useState<State[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [stageStatuses, setStageStatuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState({
    states: false,
    districts: false,
    general: false,
  });

  const { toast } = useToast();

  // Use ref to track if initial load is done
  const isInitialLoadDone = useRef(false);
  const prevIsOpen = useRef(isOpen);
  const districtsCache = useRef<Record<string, District[]>>({});

  useEffect(() => {
    const fetchStageStatuses = async () => {
      if (!filters.stage_id || filters.stage === "all" || filters.stage.toLowerCase() === "sourcing") {
        setStageStatuses([]);
        setFilters((prev) => ({ ...prev, stage_status: "all" }));
        return;
      }

      try {
        setIsLoading((prev) => ({ ...prev, general: true }));
        const response = await getStatusesByStageId(filters.stage_id);

        // Extract data array from response
        const statusesData = response?.data || response || [];

        setStageStatuses(statusesData);
      } catch (error) {
        console.error("Error fetching stage statuses:", error);
        setStageStatuses([]);
        toast({
          title: "❌ Unable to Load Data",
          description: "Failed to load stage statuses. Please try again.",
          variant: "destructive",
          className: "border-red-500 bg-red-50 text-red-900",
        });
      } finally {
        setIsLoading((prev) => ({ ...prev, general: false }));
      }
    };

    fetchStageStatuses();
  }, [filters.stage_id, filters.stage, toast]); // Run when stage changes

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
        // Fetch all required data in parallel for optimal performance
        const [
          statesData,
          campusesData,
          schoolsData,
          religionsData,
          qualificationsData,
          statusesData,
          donorsData,
          partnersData,
          stagesData
        ] = await Promise.all([
          getStatesList(),
          getCampusesApi(),
          getAllSchools(),
          getAllReligions(),
          getQualificationsList(),
          getAllStatus(),
          getAllDonors(),
          getAllPartners(),
          getAllStages()
        ]);

        // Extract data from students
        const partnersFromStudents = getPartnersFromStudents(students);
        const districtsFromStudents = getDistrictsFromStudents(students);
        const statesFromStudents = getStatesFromStudents(students);

        // Combine API states with states from students
        const allStates = [...(statesData || [])];
        statesFromStudents.forEach((stateName) => {
          const isStateCode = /^[A-Z]{2,3}$/.test(stateName);
           
          // Check if state already exists by name or code
          const existsInApi = allStates.find(
            (s) => s.name === stateName || s.state_code === stateName || s.id === stateName
          );
          
          // Only add if it's not a state code and doesn't exist in API states
          if (!isStateCode && !existsInApi) {
            allStates.push({ id: stateName, name: stateName });
          }
        });

        setAvailableOptions({
          partners: partnersFromStudents,
          districts: districtsFromStudents,
          schools: schoolsData || [],
          religions: religionsData || [],
          qualifications: qualificationsData || [],
          currentStatuses: statusesData || [],
          campuses: campusesData || [],
          stages: stagesData || [],
          donors: donorsData || [],
          partnersList: partnersData || [],
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
          title: "❌ Unable to Load Data",
          description: getFriendlyErrorMessage(error),
          variant: "destructive",
          className: "border-red-500 bg-red-50 text-red-900",
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
      donor: [],
      partnerFilter: [],
      dateRange: { type: "applicant" },
    });
    setAvailableDistricts([]);
  };

  const handleApplyFilters = () => {
    
    // Validate date range - if start is selected, end must be selected
    if (filters.dateRange.from && !filters.dateRange.to) {
      toast({
        title: "⚠️ Incomplete Date Range",
        description: "Please select an end date to complete the date range.",
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    // Validate date range - if end is selected, start must be selected
    if (filters.dateRange.to && !filters.dateRange.from) {
      toast({
        title: "⚠️ Incomplete Date Range",
        description: "Please select a start date before selecting an end date.",
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    // Validate that end date is greater than or equal to start date (allow same day)
    if (filters.dateRange.from && filters.dateRange.to) {
      if (filters.dateRange.from > filters.dateRange.to) {
        toast({
          title: "⚠️ Invalid Date Range",
          description: "End date cannot be before start date.",
          variant: "destructive",
          className: "border-orange-500 bg-orange-50 text-orange-900",
        });
        return;
      }
    }

    // Validate stage status - mandatory for stages that have statuses available
    if (filters.stage && filters.stage !== "all" && stageStatuses.length > 0) {
      const hasStageStatus = Array.isArray(filters.stage_status)
        ? filters.stage_status.length > 0
        : filters.stage_status && filters.stage_status !== "all";
        
      if (!hasStageStatus) {
        toast({
          title: "⚠️ Stage Status Required",
          description: `Please select at least one stage status for ${filters.stage} stage.`,
          variant: "destructive",
          className: "border-orange-500 bg-orange-50 text-orange-900",
        });
        return;
      }
    }

    // Create processed filters object without the old 'status' field
    const processedFilters: any = {
      ...filters,
    };
    // Hide stage_status if stage is sourcing (since backend doesn't filter on it)
    if (filters.stage && filters.stage.toLowerCase() === "sourcing") {
      processedFilters.stage_status = "all";
    }

    // Remove the old 'status' field if it exists
    delete processedFilters.status;
    
    // console.log("Current Filters:", processedFilters);
    onApplyFilters(processedFilters);
    onClose();
    toast({
      title: "✅ Filters Applied",
      description: "Your filters have been successfully applied.",
      variant: "default",
      className: "border-green-500 bg-green-50 text-green-900",
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
      "partner_name",
      "donor_name",
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

  // --- ADDED: helpers to build active filters and clear individual filter ---
  // Helper to remove individual stage status
  const removeSingleStageStatus = (statusToRemove: string) => {
    setFilters((prev) => {
      const currentStatuses = Array.isArray(prev.stage_status)
        ? prev.stage_status
        : prev.stage_status && prev.stage_status !== "all"
        ? [prev.stage_status]
        : [];
      
      const newStatuses = currentStatuses.filter((s) => s !== statusToRemove);
      
      // If removing the last status and stage has statuses available, also clear the stage
      if (newStatuses.length === 0 && stageStatuses.length > 0) {
        return {
          ...prev,
          stage: "all",
          stage_id: undefined,
          stage_status: "all",
        };
      }
      
      return {
        ...prev,
        stage_status: newStatuses.length > 0 ? newStatuses : "all",
      };
    });
  };

  const clearSingleFilter = (key: string) => {
    setFilters((prev) => {
      switch (key) {
        case "stage":
          return { ...prev, stage: "all", stage_id: undefined, stage_status: "all" };
        case "stage_status":
          return { ...prev, stage_status: "all" };
        case "state":
          setAvailableDistricts([]);
          return { ...prev, state: undefined, district: [] };
        case "district":
          return { ...prev, district: [] };
        case "partner":
        case "campus":
          return { ...prev, partner: [] };
        case "school":
          return { ...prev, school: [] };
        case "religion":
          return { ...prev, religion: [] };
        case "qualification":
          return { ...prev, qualification: [] };
        case "currentStatus":
          return { ...prev, currentStatus: [] };
        case "dateRange":
        case "daterange":
          return { ...prev, dateRange: { type: prev.dateRange.type } };
        default:
          return prev;
      }
    });
  };

  const activeFilters: { key: string; label: string; onRemove?: () => void }[] = [];
  
  // Stage chip (only if stage is selected)
  const hasStage = filters.stage && filters.stage !== "all";
  if (hasStage) {
    activeFilters.push({ 
      key: "stage", 
      label: `Stage: ${filters.stage}`,
      onRemove: () => clearSingleFilter("stage")
    });
  }
  
  // Individual stage status chips
  const stageStatusArray = Array.isArray(filters.stage_status) 
    ? filters.stage_status 
    : filters.stage_status && filters.stage_status !== "all" 
      ? [filters.stage_status] 
      : [];
  
  stageStatusArray.forEach((status) => {
    activeFilters.push({
      key: `stage_status-${status}`,
      label: `Status: ${status}`,
      onRemove: () => removeSingleStageStatus(status)
    });
  });
  
  if (filters.state) activeFilters.push({ key: "state", label: `State: ${filters.state}` });
  if (filters.district?.length) activeFilters.push({ key: "district", label: `District: ${filters.district[0]}` });
  
  // Campus - find and display actual name
  if (filters.partner?.length) {
    const campus = availableOptions.campuses.find((c: any) => String(c.id) === String(filters.partner[0]));
    const campusLabel = campus?.campus_name || campus?.name || filters.partner[0];
    activeFilters.push({ key: "partner", label: `Campus: ${campusLabel}` });
  }
  
  // School - find and display actual name
  if (filters.school?.length) {
    const school = availableOptions.schools.find((s: any) => String(s.id) === String(filters.school[0]));
    const schoolLabel = school?.school_name || school?.name || filters.school[0];
    activeFilters.push({
      key: "school",
      label: `School: ${schoolLabel}`,
    });
  }
  
  // Qualification - find and display actual name
  if (filters.qualification?.length) {
    const qualification = availableOptions.qualifications.find((q: any) => String(q.id) === String(filters.qualification[0]));
    const qualLabel = qualification?.qualification_name || qualification?.name || filters.qualification[0];
    activeFilters.push({
      key: "qualification",
      label: `Qualification: ${qualLabel}`,
    });
  }
  
  // Current Status - find and display actual name
  if (filters.currentStatus?.length) {
    const status = availableOptions.currentStatuses.find((s: any) => String(s.id) === String(filters.currentStatus[0]));
    const statusLabel = status?.current_status_name || status?.name || filters.currentStatus[0];
    activeFilters.push({
      key: "currentStatus",
      label: `Current: ${statusLabel}`,
    });
  }
  if (filters.dateRange.from || filters.dateRange.to) {
    const from = filters.dateRange.from ? format(filters.dateRange.from, "PP") : "";
    const to = filters.dateRange.to ? format(filters.dateRange.to, "PP") : "";
    activeFilters.push({
      key: "dateRange",
      label: `${filters.dateRange.type}: ${from}${from && to ? " - " : ""}${to}`,
    });
  }
  // --- end added helpers ---
  
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

        {/* --- ADDED: show active filter chips --- */}
        {activeFilters.length > 0 && (
          <div className="px-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {activeFilters.map((f) => (
                <Button
                  key={f.key}
                  size="sm"
                  variant="ghost"
                  className="rounded-full py-1.5 px-2 flex items-center gap-2 border h-auto whitespace-nowrap min-w-fit"
                  onClick={() => {
                    if (f.onRemove) {
                      f.onRemove();
                    } else {
                      const filterType = f.key.split('-')[0];
                      clearSingleFilter(filterType);
                    }
                  }}
                >
                  <span className="text-sm inline-block">{f.label}</span>
                  <X className="w-3 h-3 flex-shrink-0" />
                </Button>
              ))}
            </div>
          </div>
        )}
        {/* --- end chips --- */}

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
                  <SelectValue placeholder="Select stage" className="truncate" />
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

            {/* Stage Status - Multi-select Dropdown */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">
                Stage Status
                {filters.stage &&
                  filters.stage !== "all" &&
                  stageStatuses.length > 0 && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
              </h3>
              <Popover modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    disabled={
                      !filters.stage ||
                      filters.stage === "all" ||
                      stageStatuses.length === 0 ||
                      isLoading.general
                    }
                    className={cn(
                      "w-full justify-between h-10",
                      (!filters.stage || filters.stage === "all") && "text-muted-foreground",
                      filters.stage &&
                        filters.stage !== "all" &&
                        stageStatuses.length > 0 &&
                        (!filters.stage_status || 
                          (Array.isArray(filters.stage_status) && filters.stage_status.length === 0) ||
                          filters.stage_status === "all")
                        ? "border-red-300"
                        : ""
                    )}
                  >
                    <span className="truncate">
                      {!filters.stage || filters.stage === "all"
                        ? "Select stage first"
                        : isLoading.general
                            ? "Loading statuses..."
                            : stageStatuses.length === 0
                              ? "No statuses available - Stage can be applied"
                              : Array.isArray(filters.stage_status) && filters.stage_status.length > 0
                                ? `${filters.stage_status.length} selected`
                                : "Select statuses (required)"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[300px] p-0" 
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onInteractOutside={(e) => {
                    // Prevent closing when clicking inside the popover content
                    const target = e.target as HTMLElement;
                    if (target.closest('[cmdk-list]') || target.closest('[cmdk-item]')) {
                      e.preventDefault();
                    }
                  }}
                  onWheel={(e) => e.stopPropagation()}
                >
                  <Command>
                    <CommandInput placeholder="Search statuses..." />
                    <CommandList 
                      className="max-h-[200px] overflow-y-scroll overscroll-contain"
                      style={{ 
                        scrollbarWidth: 'thin',
                        WebkitOverflowScrolling: 'touch'
                      } as React.CSSProperties}
                      onWheel={(e) => e.stopPropagation()}
                    >
                      <CommandEmpty>No status found.</CommandEmpty>
                      <CommandGroup>
                        {/* All Option */}
                        <CommandItem
                          key="all-statuses"
                          value="all"
                          onSelect={() => {
                            setFilters((prev) => {
                              const currentStatuses = Array.isArray(prev.stage_status)
                                ? prev.stage_status
                                : prev.stage_status && prev.stage_status !== "all"
                                ? [prev.stage_status]
                                : [];
                              
                              // If all are currently selected, deselect all
                              // Otherwise, select all
                              const allStatuses = stageStatuses.map((s: any) => s.status_name || s.name);
                              const isAllSelected = currentStatuses.length === allStatuses.length;
                              
                              return {
                                ...prev,
                                stage_status: isAllSelected ? "all" : allStatuses,
                              };
                            });
                          }}
                          className="cursor-pointer font-semibold border-b"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center w-full">
                            <Checkbox
                              checked={
                                Array.isArray(filters.stage_status) &&
                                filters.stage_status.length === stageStatuses.length
                              }
                              className="mr-2"
                              onCheckedChange={() => {}}
                            />
                            <span className="flex-1">Select All</span>
                            {Array.isArray(filters.stage_status) &&
                              filters.stage_status.length === stageStatuses.length && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                          </div>
                        </CommandItem>
                        
                        {stageStatuses.map((status: any) => {
                          const statusName = status.status_name || status.name;
                          const isSelected = Array.isArray(filters.stage_status)
                            ? filters.stage_status.includes(statusName)
                            : filters.stage_status === statusName;
                          
                          return (
                            <CommandItem
                              key={status.id || statusName}
                              value={statusName}
                              onSelect={() => {
                                setFilters((prev) => {
                                  const currentStatuses = Array.isArray(prev.stage_status)
                                    ? prev.stage_status
                                    : prev.stage_status && prev.stage_status !== "all"
                                    ? [prev.stage_status]
                                    : [];
                                  
                                  let newStatuses: string[];
                                  if (isSelected) {
                                    // Remove from selection
                                    newStatuses = currentStatuses.filter((s) => s !== statusName);
                                  } else {
                                    // Add to selection
                                    newStatuses = [...currentStatuses, statusName];
                                  }
                                  
                                  return {
                                    ...prev,
                                    stage_status: newStatuses.length > 0 ? newStatuses : "all",
                                  };
                                });
                              }}
                              className="cursor-pointer"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center w-full">
                                <Checkbox
                                  checked={isSelected}
                                  className="mr-2"
                                  onCheckedChange={() => {}}
                                />
                                <span className="flex-1">{statusName}</span>
                                {isSelected && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
              <Combobox
                  options={[
                    { value: "all", label: "All States" },
                    ...availableStates.map((state) => ({
                      value: state.name,
                      label: state.name,
                    })),
                  ]}
                  value={filters.state || "all"}
                  onValueChange={handleStateChange}
                  placeholder="Select State"
                  searchPlaceholder="Search state..."
                  emptyText="No state found."
                  disabled={isLoading.general}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {/* {availableStates.length} states available */}
                  {isLoading.general && " - Loading..."}
                </p>
              </div>

            {/* District / City */}
            <div>
              <h3 className="font-semibold text-sm mb-2">District</h3>
                <Combobox
                  options={[
                    { value: "all", label: "All Districts" },
                  ...availableDistricts.map((district) => ({
                    value: district.name,
                    label: district.name,
                  })),
                ]}
                value={filters.district?.[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    district: value === "all" ? [] : [value],
                  }))
                }
                placeholder={
                  !filters.state || filters.state === "all"
                    ? "Select state first"
                    : isLoading.districts
                      ? "Loading districts..."
                      : "Select district"
                }
                searchPlaceholder="Search district..."
                emptyText="No district found."
                disabled={
                  !filters.state ||
                  filters.state === "all" ||
                  isLoading.districts
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                {/* {availableDistricts.length} districts available */}
                {"Select state first"}
                {isLoading.districts && " - Loading..."}
              </p>
            </div>

            {/* Campus */}
            {!hideCampusFilter && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Campus</h3>
                <Combobox
                  options={[
                    { value: "all", label: "All Campuses" },
                    ...availableOptions.campuses.map((campus) => ({
                      value: getValue(campus),
                      label: getDisplayName(campus, "campus_name", "Campus"),
                    })),
                  ]}
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
                  placeholder={
                    isLoading.general ? "Loading..." : "Select campus"
                  }
                  searchPlaceholder="Search campus..."
                  emptyText="No campus found."
                  disabled={isLoading.general}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {/* {availableOptions.campuses.length} campuses available */}
                </p>
              </div>
            )}
          </div>

          {/* Partner and Donor Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            {/* Partner */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Partner</h3>
              <Combobox
                  options={[
                    { value: "all", label: "All Partners" },
                    ...availableOptions.partnersList.map((partner) => ({
                      value: getValue(partner),
                      label: getDisplayName(partner, "partner_name", "Partner"),
                    })),
                  ]}
                  value={filters.partnerFilter?.[0] || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      partnerFilter: value === "all" ? [] : [value],
                    }))
                  }
                  placeholder={
                    isLoading.general ? "Loading..." : "Select partner"
                  }
                  searchPlaceholder="Search partner..."
                  emptyText="No partner found."
                  disabled={isLoading.general}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {/* {availableOptions.partnersList.length} partners available */}
                </p>
              </div>

            {/* Donor */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Donor</h3>
                <Combobox
                  options={[
                    { value: "all", label: "All Donors" },
                    ...availableOptions.donors.map((donor) => ({
                      value: getValue(donor),
                      label: getDisplayName(donor, "donor_name", "Donor"),
                    })),
                  ]}
                  value={filters.donor?.[0] || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      donor: value === "all" ? [] : [value],
                    }))
                  }
                  placeholder={
                    isLoading.general ? "Loading..." : "Select donor"
                  }
                  searchPlaceholder="Search donor..."
                  emptyText="No donor found."
                  disabled={isLoading.general}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {/* {availableOptions.donors.length} donors available */}
                </p>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            {/* School */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Qualifying School</h3>
              <Combobox
                options={[
                  { value: "all", label: "All Schools" },
                  ...availableOptions.schools.map((school) => ({
                    value: getValue(school),
                    label: getDisplayName(school, "school_name", "School"),
                  })),
                ]}
                value={filters.school?.[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    school: value === "all" ? [] : [value],
                  }))
                }
                placeholder={
                  isLoading.general ? "Loading..." : "Select school"
                }
                searchPlaceholder="Search school..."
                emptyText="No school found."
                disabled={isLoading.general}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {/* {availableOptions.schools.length} schools available */}
              </p>
            </div>

            {/* Qualification */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Qualification</h3>
              <Combobox
                options={[
                  { value: "all", label: "All Qualifications" },
                  ...availableOptions.qualifications.map((qualification) => ({
                    value: getValue(qualification),
                    label: getDisplayName(
                      qualification,
                      "qualification_name",
                      "Qualification",
                    ),
                  })),
                ]}
                value={filters.qualification?.[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    qualification: value === "all" ? [] : [value],
                  }))
                }
                placeholder={
                  isLoading.general ? "Loading..." : "Select qualification"
                }
                searchPlaceholder="Search qualification..."
                emptyText="No qualification found."
                disabled={isLoading.general}
                className={`${!filters.qualification?.length || filters.qualification[0] === "all" ? "border-red-300" : ""}`}
              />
            </div>

            {/* Current Status */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Current Status</h3>
              <Combobox
                options={[
                  { value: "all", label: "All Statuses" },
                  ...availableOptions.currentStatuses.map((status) => ({
                    value: getValue(status),
                    label: getDisplayName(status, "current_status_name", "Status"),
                  })),
                ]}
                value={filters.currentStatus?.[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    currentStatus: value === "all" ? [] : [value],
                  }))
                }
                placeholder={
                  isLoading.general ? "Loading..." : "Select status"
                }
                searchPlaceholder="Search status..."
                emptyText="No status found."
                disabled={isLoading.general}
              />
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

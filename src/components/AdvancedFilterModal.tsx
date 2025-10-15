import { useState, useEffect } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import {
  getStatesList,
  getDistrictsList,
  getCampusesList,
  getSchoolsList,
  getReligionsList,
  getStatusesList,
  getPartnersFromStudents,
  getDistrictsFromStudents,
  getStatesFromStudents,
  State,
  District
} from "@/utils/filterUtils";

interface FilterState {
  stage: string;
  status: string;
  examMode: string;
  interviewMode: string;
  partner: string[];
  district: string[];
  school: string[];
  religion: string[];
  currentStatus: string[];
  state?: string;
  dateRange: {
    type: "application" | "lastUpdate" | "interview";
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
  currentstatusList?: any[];
}

const STAGE_STATUS_MAP = {
  sourcing: [
    "Enrollment Key Generated",
    "Basic Details Entered",
    "Duplicate",
    "Unreachable",
    "Became Disinterested",
  ],
  screening: [
    "Screening Test Pass",
    "Screening Test Fail",
    "Created Student Without Exam",
  ],
};

export function AdvancedFilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
  students,
  campusList = [],
  schoolList = [],
  religionList = [],
  currentstatusList = [],
}: AdvancedFilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(currentFilters);
  const [availableOptions, setAvailableOptions] = useState({
    partners: [] as string[],
    districts: [] as string[],
    schools: [] as any[],
    religions: [] as any[],
    currentStatuses: [] as any[],
    campuses: [] as any[],
  });

  const [availableStates, setAvailableStates] = useState<State[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState({
    states: false,
    districts: false,
    general: false
  });

  const { toast } = useToast();

  // Load all filter data when modal opens
  useEffect(() => {
    const loadFilterData = async () => {
      if (!isOpen) return;
      
      setIsLoading(prev => ({ ...prev, general: true }));
      setFilters(currentFilters);

      try {
        // Load data from APIs in parallel
        const [
          apiStates,
          apiCampuses, 
          apiSchools,
          apiReligions,
          apiStatuses
        ] = await Promise.all([
          getStatesList(),
          getCampusesList(),
          getSchoolsList(),
          getReligionsList(),
          getStatusesList()
        ]);

        // Extract data from students
        const partnersFromStudents = getPartnersFromStudents(students);
        const districtsFromStudents = getDistrictsFromStudents(students);
        const statesFromStudents = getStatesFromStudents(students);

        // console.log("📊 Student data extracted:", {
        //   partners: partnersFromStudents.length,
        //   districts: districtsFromStudents.length,
        //   states: statesFromStudents.length
        // });

        // Combine API states with states from students
        const allStates = [...apiStates];
        statesFromStudents.forEach(stateName => {
          if (!allStates.find(s => s.name === stateName)) {
            allStates.push({ id: stateName, name: stateName });
          }
        });

        // Use provided lists or API data
        const finalCampuses = campusList.length > 0 ? campusList : apiCampuses;
        const finalSchools = schoolList.length > 0 ? schoolList : apiSchools;
        const finalReligions = religionList.length > 0 ? religionList : apiReligions;
        const finalStatuses = currentstatusList.length > 0 ? currentstatusList : apiStatuses;

        setAvailableOptions({
          partners: partnersFromStudents,
          districts: districtsFromStudents,
          schools: finalSchools,
          religions: finalReligions,
          currentStatuses: finalStatuses,
          campuses: finalCampuses,
        });

        setAvailableStates(allStates);

        // Load districts for current state if selected
        if (currentFilters.state && currentFilters.state !== 'all') {
          await handleStateChange(currentFilters.state, false);
        }

      } catch (error) {
        // console.error(" Error loading filter data:", error);
        toast({
          title: "Error",
          description: "Failed to load filter options",
          variant: "destructive",
        });
      } finally {
        setIsLoading(prev => ({ ...prev, general: false }));
      }
    };

    loadFilterData();
  }, [isOpen, currentFilters, students, campusList, schoolList, religionList, currentstatusList]);

  // State change handler
  const handleStateChange = async (selectedState: string, updateFilters = true) => {
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

    setIsLoading(prev => ({ ...prev, districts: true }));

    try {
      // Find state code from available states
      const stateObj = availableStates.find(s => s.name === selectedState);
      const stateCode = stateObj?.state_code || stateObj?.id;

      let districts: District[] = [];
      
      if (stateCode && stateCode !== selectedState) {
        // Get districts from API using state code
        districts = await getDistrictsList(stateCode);
      } else {
        // Fallback: filter districts from students data
        const studentDistricts = availableOptions.districts;
        districts = studentDistricts.map(district => ({
          id: district,
          name: district
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
      setIsLoading(prev => ({ ...prev, districts: false }));
    }
  };

  const resetFilters = () => {
    setFilters({
      stage: "all",
      status: "all",
      examMode: "all",
      interviewMode: "all",
      partner: [],
      district: [],
      school: [],
      religion: [],
      currentStatus: [],
      state: undefined,
      dateRange: { type: "application" },
    });
    setAvailableDistricts([]);
  };

  const handleApplyFilters = () => {
    // console.log(" Applying Filters:", filters);
    onApplyFilters(filters);
    onClose();
    toast({
      title: "Filters Applied",
      description: "Your filters have been successfully applied.",
    });
  };

  const availableStatuses =
    filters.stage && filters.stage !== "all"
      ? STAGE_STATUS_MAP[filters.stage as keyof typeof STAGE_STATUS_MAP] || []
      : [];

  // Helper function to get display name
  const getDisplayName = (item: any, nameKey: string = 'name', fallbackPrefix: string = 'Item') => {
    if (!item) return `${fallbackPrefix}`;
    if (typeof item === 'string') return item;
    
    const possibleKeys = [
      nameKey, 'name', 'title', 'label', 
      'school_name', 'religion_name', 'current_status_name',
      'campus_name', 'partner_name', 'district_name'
    ];
    
    for (const key of possibleKeys) {
      if (item[key] && typeof item[key] === 'string') {
        return item[key];
      }
    }
    
    return item.id ? `${fallbackPrefix} ${item.id}` : `${fallbackPrefix}`;
  };

  // Helper function to get value
  const getValue = (item: any, valueKey: string = 'id') => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    
    if (item[valueKey]) return String(item[valueKey]);
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
            {isLoading.general && <span className="text-sm text-muted-foreground">(Loading...)</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stage & Status & Modes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Stage</h3>
              <Select
                value={filters.stage}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, stage: value, status: "all" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="sourcing">Sourcing</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                </SelectContent>
              </Select>

              {availableStatuses.length > 0 && (
                <>
                  <Label className="text-sm">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="all">All Statuses</SelectItem>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            {/* Exam Mode */}
            <div className="space-y-3">
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
            </div>

            {/* Interview Mode */}
            <div className="space-y-3">
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
            </div>
          </div>

          {/* Location Filters - State, District, Partner, Campus */}
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
              <h3 className="font-semibold text-sm mb-2">City / District</h3>
              <Select
                value={filters.district?.[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    district: value === "all" ? [] : [value],
                  }))
                }
                disabled={!filters.state || filters.state === 'all' || isLoading.districts}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={
                    !filters.state || filters.state === 'all' 
                      ? "Select state first" 
                      : isLoading.districts ? "Loading districts..." : "Select district"
                  } />
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
            <div>
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
            </div>

            {/* Campus */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Campus</h3>
              <Select
                value={filters.partner?.[1] || "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    setFilters((prev) => ({
                      ...prev,
                      partner: prev.partner.length > 0 ? [prev.partner[0]] : [],
                    }));
                  } else {
                    setFilters((prev) => ({
                      ...prev,
                      partner: prev.partner.length > 0 ? [prev.partner[0], value] : [value],
                    }));
                  }
                }}
                disabled={isLoading.general}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoading.general ? "Loading..." : "Select campus"} />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Campuses</SelectItem>
                  {availableOptions.campuses.map((campus) => (
                    <SelectItem key={getValue(campus)} value={getValue(campus)}>
                      {getDisplayName(campus, 'campus_name', 'Campus')}
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
                  <SelectValue placeholder={isLoading.general ? "Loading..." : "Select school"} />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Schools</SelectItem>
                  {availableOptions.schools.map((school) => (
                    <SelectItem key={getValue(school)} value={getValue(school)}>
                      {getDisplayName(school, 'school_name', 'School')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {/* {availableOptions.schools.length} schools available */}
              </p>
            </div>

            {/* Religion */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Religion</h3>
              <Select
                value={filters.religion?.[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    religion: value === "all" ? [] : [value],
                  }))
                }
                disabled={isLoading.general}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoading.general ? "Loading..." : "Select religion"} />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Religions</SelectItem>
                  {availableOptions.religions.map((religion) => (
                    <SelectItem key={getValue(religion)} value={getValue(religion)}>
                      {getDisplayName(religion, 'religion_name', 'Religion')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {/* {availableOptions.religions.length} religions available */}
              </p>
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
                  <SelectValue placeholder={isLoading.general ? "Loading..." : "Select status"} />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Statuses</SelectItem>
                  {availableOptions.currentStatuses.map((status) => (
                    <SelectItem key={getValue(status)} value={getValue(status)}>
                      {getDisplayName(status, 'current_status_name', 'Status')}
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
            <h3 className="font-semibold text-sm mb-3">Date Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-sm">Date Type</Label>
                <Select
                  value={filters.dateRange.type}
                  onValueChange={(
                    value: "application" | "lastUpdate" | "interview"
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
                    <SelectItem value="application">Application Date</SelectItem>
                    <SelectItem value="lastUpdate">Last Update</SelectItem>
                    <SelectItem value="interview">Interview Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {filters.dateRange.from
                        ? format(filters.dateRange.from, "PP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from}
                      onSelect={(date) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, from: date },
                        }))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-sm">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {filters.dateRange.to
                        ? format(filters.dateRange.to, "PP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to}
                      onSelect={(date) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, to: date },
                        }))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex justify-between pt-4 border-t mt-4">
          <Button variant="outline" onClick={resetFilters} size="sm" disabled={isLoading.general}>
            Reset All
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose} size="sm" disabled={isLoading.general}>
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
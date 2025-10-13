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

// Import your state and city data here if you have separate files
// import states from "./data/states";
// import cities from "./data/cities";

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
  campusList,
  schoolList,
  religionList,
  currentstatusList,
}: AdvancedFilterModalProps) {
  const safeCampusList = Array.isArray(campusList) ? campusList : [];
  const safeSchoolList = Array.isArray(schoolList) ? schoolList : [];
  const safeReligionList = Array.isArray(religionList) ? religionList : [];
  const safeCurrentStatusList = Array.isArray(currentstatusList) ? currentstatusList : [];

  const [filters, setFilters] = useState<FilterState>(currentFilters);
  const [availableOptions, setAvailableOptions] = useState({
    partners: [] as string[],
    districts: [] as string[],
  });

  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const { toast } = useToast();

  // Load states on component mount
  useEffect(() => {
    // If you have state data file, uncomment this:
    // const stateNames = [...new Set(states.map((s) => s.state_name))].sort();
    // setAvailableStates(stateNames);
    
    // For now, extract unique states from students data
    const statesFromStudents = [
      ...new Set(
        students
          .filter((s) => s?.state)
          .map((s) => s.state)
          .filter(Boolean)
      ),
    ].sort();
    setAvailableStates(statesFromStudents as string[]);
  }, [students]);

  // Load modal data when open
  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);

      // Extract partners from students
      const partners = [
        ...new Set(
          students
            .filter((s) => s?.partner)
            .map((s) => s.partner)
            .filter(Boolean)
        ),
      ];

      // Extract districts from students
      const districts = [
        ...new Set(
          students
            .filter((s) => s?.district)
            .map((s) => s.district)
            .filter(Boolean)
        ),
      ];

      setAvailableOptions({
        partners: partners as string[],
        districts: districts as string[],
      });

      // Load cities based on selected state
      if (filters.state) {
        // If you have city data file, uncomment this:
        // const filteredCities = cities
        //   .filter((c) => c.state_name === filters.state)
        //   .map((c) => c.name);
        // setAvailableCities([...new Set(filteredCities)].sort());
        
        // For now, extract cities from students for selected state
        const citiesForState = [
          ...new Set(
            students
              .filter((s) => s?.state === filters.state && s?.district)
              .map((s) => s.district)
              .filter(Boolean)
          ),
        ].sort();
        setAvailableCities(citiesForState as string[]);
      }
    }
  }, [isOpen, currentFilters, students, filters.state]);

  const handleStateChange = (selectedState: string) => {
    if (selectedState === "all") {
      setFilters((prev) => ({
        ...prev,
        state: undefined,
        district: [],
      }));
      setAvailableCities([]);
      return;
    }

    setFilters((prev) => ({
      ...prev,
      state: selectedState,
      district: [],
    }));

    // If you have city data file, uncomment this:
    // const filteredCities = cities
    //   .filter((c) => c.state_name === selectedState)
    //   .map((c) => c.name);
    // setAvailableCities([...new Set(filteredCities)].sort());

    // For now, extract cities from students for selected state
    const citiesForState = [
      ...new Set(
        students
          .filter((s) => s?.state === selectedState && s?.district)
          .map((s) => s.district)
          .filter(Boolean)
      ),
    ].sort();
    setAvailableCities(citiesForState as string[]);
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
    setAvailableCities([]);
  };

  const handleApplyFilters = () => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Advanced Filters
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stage & Status & Modes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            {/* Stage */}
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
            {/* State */}
            <div>
              <h3 className="font-semibold text-sm mb-2">State</h3>
              <Select
                value={filters.state || "all"}
                onValueChange={handleStateChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All States</SelectItem>
                  {availableStates.length > 0 ? (
                    availableStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      No states available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
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
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Cities</SelectItem>
                  {availableCities.length > 0 ? (
                    availableCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      {filters.state ? "No cities available" : "Select a state first"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
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
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select partner" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Partners</SelectItem>
                  {availableOptions.partners.length > 0 ? (
                    availableOptions.partners.map((partner) => (
                      <SelectItem key={partner} value={partner}>
                        {partner}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      No partners available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Campus */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Campus</h3>
              <Select
                value={
                  filters.partner && filters.partner.length > 1
                    ? filters.partner[1]
                    : "all"
                }
                onValueChange={(value) => {
                  if (value === "all") {
                    setFilters((prev) => ({
                      ...prev,
                      partner: prev.partner.length > 0 ? [prev.partner[0]] : [],
                    }));
                  } else {
                    setFilters((prev) => ({
                      ...prev,
                      partner:
                        prev.partner.length > 0
                          ? [prev.partner[0], value]
                          : ["", value],
                    }));
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select campus" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Campuses</SelectItem>
                  {safeCampusList.length > 0 ? (
                    safeCampusList.map((campus) => (
                      <SelectItem key={campus.id} value={String(campus.id)}>
                        {campus.campus_name || `Campus ${campus.id}`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      No campuses available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Education & Demographics */}
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
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Schools</SelectItem>
                  {safeSchoolList.length > 0 ? (
                    safeSchoolList.map((school) => (
                      <SelectItem key={school.id} value={String(school.id)}>
                        {school.school_name || `School ${school.id}`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      No schools available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
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
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select religion" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Religions</SelectItem>
                  {safeReligionList.length > 0 ? (
                    safeReligionList.map((religion) => (
                      <SelectItem key={religion.id} value={String(religion.id)}>
                        {religion.religion_name || `Religion ${religion.id}`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      No religions available
                    </SelectItem>
                  )}
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
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Statuses</SelectItem>
                  {safeCurrentStatusList.length > 0 ? (
                    safeCurrentStatusList.map((status) => (
                      <SelectItem key={status.id} value={String(status.id)}>
                        {status.current_status_name || `Status ${status.id}`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      No statuses available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
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
          <Button variant="outline" onClick={resetFilters} size="sm">
            Reset All
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              onClick={handleApplyFilters}
              size="sm"
              className="bg-primary text-primary-foreground"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
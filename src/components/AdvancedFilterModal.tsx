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
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
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
  getExamCentres,
  getStatusesByStageId,
} from "@/utils/api";
import { cn } from "@/lib/utils";
import { useOnDemandReferenceData } from "@/hooks/useOnDemandReferenceData";
import {
  getStatesList,
  getDistrictsList,
  getDistrictsFromStudents,
  getStatesFromStudents,
  State,
  District,
} from "@/utils/filterUtils";

interface FilterState {
  stage: string;
  stage_id?: number;
  stage_status: string | string[];
  examMode: string;
  interviewMode: string;
  partner: string[];
  district: string[];
  school: string[];
  initial_school: string[];
  religion: string[];
  qualification: string[];
  currentStatus: string[];
  state?: string;
  gender?: string;
  donor: string[];
  partnerFilter: string[];
  exam_centre: string[];
  dateRange: {
    type: "applicant" | "lastUpdate" | "interview";
    from?: Date;
    to?: Date;
  };
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState, stageStatuses?: any[]) => void;
  currentFilters: FilterState;
  students: any[];
  hideCampusFilter?: boolean;
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

  const {
    campusList,
    schoolList,
    currentstatusList,
    stageList,
    religionList,
    qualificationList,
    partnerList,
    donorList,
    loadFieldData,
    loadMultipleFields,
  } = useOnDemandReferenceData();

  const [availableStates, setAvailableStates] = useState<State[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [stageStatuses, setStageStatuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState({
    states: false,
    districts: false,
    general: false,
  });
  const [examCentres, setExamCentres] = useState<string[]>([]);
  const [isLoadingExamCentres, setIsLoadingExamCentres] = useState(false);
  const isExamCentresLoaded = useRef(false);
  const isInitialLoadDone = useRef(false);
  const prevIsOpen = useRef(isOpen);

  const { toast } = useToast();

  const fetchExamCentres = useCallback(async () => {
    if (isExamCentresLoaded.current || isLoadingExamCentres) return;
    setIsLoadingExamCentres(true);
    try {
      const centres = await getExamCentres();
      setExamCentres(centres);
      isExamCentresLoaded.current = true;
    } catch (error) {
      console.error("Error fetching exam centres:", error);
      toast({
        title: "⚠️ Unable to Load Exam Centres",
        description: "Failed to fetch exam centre options. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setIsLoadingExamCentres(false);
    }
  }, [isLoadingExamCentres, toast]);

  useEffect(() => {
    const fetchStageStatuses = async () => {
      if (!filters.stage_id || filters.stage === "all") {
        setStageStatuses([]);
        setFilters((prev) => ({ ...prev, stage_status: "all" }));
        return;
      }
      try {
        setIsLoading((prev) => ({ ...prev, general: true }));
        const response = await getStatusesByStageId(filters.stage_id);
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
  }, [filters.stage_id, filters.stage, toast]);

  const handleStateChange = useCallback(
    async (selectedState: string, updateFilters = true) => {
      if (updateFilters) {
        setFilters((prev) => ({
          ...prev,
          state: selectedState === "all" ? undefined : selectedState,
          district: [],
        }));
      }
      if (selectedState === "all") {
        setAvailableDistricts([]);
        return;
      }
      setIsLoading((prev) => ({ ...prev, districts: true }));
      try {
        const stateObj = availableStates.find((s) => s.name === selectedState);
        const stateCode = stateObj?.state_code || stateObj?.id;
        let districts: District[] = [];
        if (stateCode && stateCode !== selectedState) {
          districts = await getDistrictsList(stateCode);
        } else {
          const studentDistricts = getDistrictsFromStudents(students);
          districts = studentDistricts.map((district) => ({ id: district, name: district }));
        }
        setAvailableDistricts(districts);
      } catch (error) {
        setAvailableDistricts([]);
      } finally {
        setIsLoading((prev) => ({ ...prev, districts: false }));
      }
    },
    [availableStates, students],
  );

  useEffect(() => {
    const loadInitialFilterData = async () => {
      if (!isOpen) {
        isInitialLoadDone.current = false;
        return;
      }
      if (prevIsOpen.current === isOpen && isInitialLoadDone.current) return;
      prevIsOpen.current = isOpen;
      setIsLoading((prev) => ({ ...prev, general: true }));
      setFilters(currentFilters);
      try {
        const statesFromStudents = getStatesFromStudents(students);
        const fieldsToLoad = ["state", "stage"];
        if (currentFilters.partner?.length) fieldsToLoad.push("campus");
        if (currentFilters.school?.length) fieldsToLoad.push("school");
        if (currentFilters.initial_school?.length) fieldsToLoad.push("school");
        if (currentFilters.qualification?.length) fieldsToLoad.push("qualification");
        if (currentFilters.currentStatus?.length) fieldsToLoad.push("current_status");
        if (currentFilters.religion?.length) fieldsToLoad.push("religion");
        if (currentFilters.donor?.length) fieldsToLoad.push("donor");
        if (currentFilters.partnerFilter?.length) fieldsToLoad.push("partnerFilter");
        await loadMultipleFields(fieldsToLoad);
        if (currentFilters.exam_centre?.length) await fetchExamCentres();
        const apiStatesData = await getStatesList();
        const allStates = [...apiStatesData.map((s: any) => ({
          id: s.state_code || s.id,
          name: s.name,
          state_code: s.state_code || s.id,
        }))];
        statesFromStudents.forEach((stateName) => {
          const isStateCode = /^[A-Z]{2,3}$/.test(stateName);
          const existsInApi = allStates.find(
            (s) => s.name === stateName || s.state_code === stateName || s.id === stateName
          );
          if (!isStateCode && !existsInApi) {
            allStates.push({ id: stateName, name: stateName, state_code: stateName });
          }
        });
        setAvailableStates(allStates);
        if (currentFilters.state && currentFilters.state !== "all") {
          await handleStateChange(currentFilters.state, false);
        }
        isInitialLoadDone.current = true;
      } catch (error) {
        console.error("Error loading initial filter data:", error);
        toast({
          title: "⚠️ Unable to Load Filter Data",
          description: "Failed to load filter options. Please try again.",
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900",
        });
      } finally {
        setIsLoading((prev) => ({ ...prev, general: false }));
      }
    };
    loadInitialFilterData();
  }, [isOpen]);

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
      initial_school: [],
      religion: [],
      qualification: [],
      currentStatus: [],
      state: undefined,
      donor: [],
      partnerFilter: [],
      exam_centre: [],
      dateRange: { type: "applicant" },
    });
    setAvailableDistricts([]);
  };

  const handleApplyFilters = () => {
    if (filters.dateRange.from && !filters.dateRange.to) {
      toast({ title: "⚠️ Incomplete Date Range", description: "Please select an end date.", variant: "destructive", className: "border-orange-500 bg-orange-50 text-orange-900" });
      return;
    }
    if (filters.dateRange.to && !filters.dateRange.from) {
      toast({ title: "⚠️ Incomplete Date Range", description: "Please select a start date.", variant: "destructive", className: "border-orange-500 bg-orange-50 text-orange-900" });
      return;
    }
    if (filters.dateRange.from && filters.dateRange.to && filters.dateRange.from > filters.dateRange.to) {
      toast({ title: "⚠️ Invalid Date Range", description: "End date cannot be before start date.", variant: "destructive", className: "border-orange-500 bg-orange-50 text-orange-900" });
      return;
    }
    if (filters.stage && filters.stage !== "all" && stageStatuses.length > 0) {
      const hasStageStatus = Array.isArray(filters.stage_status)
        ? filters.stage_status.length > 0
        : filters.stage_status && filters.stage_status !== "all";
      if (!hasStageStatus) {
        toast({ title: "⚠️ Stage Status Required", description: `Please select at least one stage status for ${filters.stage} stage.`, variant: "destructive", className: "border-orange-500 bg-orange-50 text-orange-900" });
        return;
      }
    }
    const hasValidFilters =
      (filters.stage && filters.stage !== "all") ||
      filters.partner?.length > 0 || filters.district?.length > 0 ||
      filters.school?.length > 0 || filters.initial_school?.length > 0 ||
      filters.religion?.length > 0 || filters.qualification?.length > 0 ||
      filters.currentStatus?.length > 0 || filters.donor?.length > 0 ||
      filters.partnerFilter?.length > 0 || filters.exam_centre?.length > 0 ||
      filters.state || filters.gender || filters.dateRange.from || filters.dateRange.to;
    if (!hasValidFilters) {
      toast({ title: "⚠️ No Filters Selected", description: "Please select at least one filter.", variant: "destructive", className: "border-orange-500 bg-orange-50 text-orange-900" });
      return;
    }
    const processedFilters: any = { ...filters };
    delete processedFilters.status;
    onApplyFilters(processedFilters, stageStatuses);
    onClose();
    toast({ title: "✅ Filters Applied", description: "Your filters have been successfully applied.", variant: "default", className: "border-green-500 bg-green-50 text-green-900" });
  };

  const getDisplayName = (item: any, nameKey: string = "name", fallbackPrefix: string = "Item") => {
    if (!item) return `${fallbackPrefix}`;
    if (typeof item === "string") return item;
    const possibleKeys = [nameKey, "name", "title", "label", "school_name", "religion_name", "current_status_name", "qualification_name", "campus_name", "district_name", "partner_name", "donor_name"];
    for (const key of possibleKeys) {
      if (item[key] && typeof item[key] === "string") return item[key];
    }
    return item.id ? `${fallbackPrefix} ${item.id}` : `${fallbackPrefix}`;
  };

  const getValue = (item: any, valueKey: string = "id") => {
    if (!item) return "";
    if (typeof item === "string") return item;
    if (item[valueKey]) return String(item[valueKey]);
    if (item.stage_id) return String(item.stage_id);
    if (item.id) return String(item.id);
    if (item.value) return String(item.value);
    return String(item);
  };

  const removeSingleStageStatus = (statusToRemove: string) => {
    setFilters((prev) => {
      const currentStatuses = Array.isArray(prev.stage_status)
        ? prev.stage_status
        : prev.stage_status && prev.stage_status !== "all" ? [prev.stage_status] : [];
      const newStatuses = currentStatuses.filter((s) => s !== statusToRemove);
      if (newStatuses.length === 0 && stageStatuses.length > 0) {
        return { ...prev, stage: "all", stage_id: undefined, stage_status: "all" };
      }
      return { ...prev, stage_status: newStatuses.length > 0 ? newStatuses : "all" };
    });
  };

  const clearSingleFilter = (key: string, valueToRemove?: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev } as any;
      if (valueToRemove !== undefined && Array.isArray(newFilters[key])) {
        newFilters[key] = newFilters[key].filter((v: any) => String(v) !== String(valueToRemove));
        return newFilters;
      }
      switch (key) {
        case "stage": return { ...newFilters, stage: "all", stage_id: undefined, stage_status: "all" };
        case "stage_status": return { ...newFilters, stage_status: "all" };
        case "exam_centre": return { ...newFilters, exam_centre: [] };
        case "state": setAvailableDistricts([]); return { ...newFilters, state: undefined, district: [] };
        case "district": return { ...newFilters, district: [] };
        case "partner": case "campus": return { ...newFilters, partner: [] };
        case "school": return { ...newFilters, school: [] };
        case "initial_school": return { ...newFilters, initial_school: [] };
        case "religion": return { ...newFilters, religion: [] };
        case "qualification": return { ...newFilters, qualification: [] };
        case "currentStatus": return { ...newFilters, currentStatus: [] };
        case "donor": return { ...newFilters, donor: [] };
        case "partnerFilter": return { ...newFilters, partnerFilter: [] };
        case "dateRange": case "daterange": return { ...newFilters, dateRange: { type: prev.dateRange.type } };
        default: return prev;
      }
    });
  };

  // Build active filter chips
  const activeFilters: { key: string; label: string; onRemove?: () => void }[] = [];

  if (filters.stage && filters.stage !== "all") {
    activeFilters.push({ key: "stage", label: `Stage: ${filters.stage}`, onRemove: () => clearSingleFilter("stage") });
  }

  const stageStatusArray = Array.isArray(filters.stage_status)
    ? filters.stage_status
    : filters.stage_status && filters.stage_status !== "all" ? [filters.stage_status] : [];
  stageStatusArray.forEach((statusId) => {
    const statusObj = stageStatuses.find((s: any) => String(s.id) === String(statusId));
    const statusLabel = statusObj?.status_name || statusObj?.name || statusId;
    activeFilters.push({ key: `stage_status-${statusId}`, label: `Status: ${statusLabel}`, onRemove: () => removeSingleStageStatus(statusId) });
  });

  if (filters.state) activeFilters.push({ key: "state", label: `State: ${filters.state}`, onRemove: () => clearSingleFilter("state") });
  if (filters.gender) activeFilters.push({ key: "gender", label: `Gender: ${filters.gender}`, onRemove: () => setFilters((prev) => ({ ...prev, gender: undefined })) });

  filters.district?.forEach(d => activeFilters.push({ key: `district-${d}`, label: `District: ${d}`, onRemove: () => clearSingleFilter("district", d) }));
  filters.partner?.forEach(p => {
    const campus = campusList.find((c: any) => String(c.id) === String(p));
    activeFilters.push({ key: `partner-${p}`, label: `Campus: ${campus?.campus_name || campus?.name || p}`, onRemove: () => clearSingleFilter("partner", p) });
  });
  filters.school?.forEach(s => {
    const school = schoolList.find((sc: any) => String(sc.id) === String(s));
    activeFilters.push({ key: `school-${s}`, label: `School: ${school?.school_name || school?.name || s}`, onRemove: () => clearSingleFilter("school", s) });
  });
  filters.initial_school?.forEach(s => {
    const school = schoolList.find((sc: any) => String(sc.id) === String(s));
    activeFilters.push({ key: `initial_school-${s}`, label: `Course: ${school?.school_name || school?.name || s}`, onRemove: () => clearSingleFilter("initial_school", s) });
  });
  filters.qualification?.forEach(q => {
    const qual = qualificationList.find((ql: any) => String(ql.id) === String(q));
    activeFilters.push({ key: `qualification-${q}`, label: `Qualification: ${qual?.qualification_name || qual?.name || q}`, onRemove: () => clearSingleFilter("qualification", q) });
  });
  filters.currentStatus?.forEach(csId => {
    const status = currentstatusList.find((s: any) => String(s.id) === String(csId));
    activeFilters.push({ key: `currentStatus-${csId}`, label: `Status: ${status?.current_status_name || status?.name || csId}`, onRemove: () => clearSingleFilter("currentStatus", csId) });
  });
  filters.religion?.forEach(r => {
    const religion = religionList.find((re: any) => String(re.id) === String(r));
    activeFilters.push({ key: `religion-${r}`, label: `Religion: ${religion?.religion_name || religion?.name || r}`, onRemove: () => clearSingleFilter("religion", r) });
  });
  filters.donor?.forEach(d => {
    const donor = donorList.find((dn: any) => String(dn.id) === String(d));
    activeFilters.push({ key: `donor-${d}`, label: `Donor: ${donor?.donor_name || donor?.name || d}`, onRemove: () => clearSingleFilter("donor", d) });
  });
  filters.partnerFilter?.forEach(pf => {
    const partner = partnerList.find((p: any) => String(p.id) === String(pf));
    activeFilters.push({ key: `partnerFilter-${pf}`, label: `Partner: ${partner?.partner_name || partner?.name || pf}`, onRemove: () => clearSingleFilter("partnerFilter", pf) });
  });
  filters.exam_centre?.forEach(ec => activeFilters.push({ key: `exam_centre-${ec}`, label: `Exam Centre: ${ec}`, onRemove: () => clearSingleFilter("exam_centre", ec) }));

  if (filters.dateRange.from || filters.dateRange.to) {
    const from = filters.dateRange.from ? format(filters.dateRange.from, "dd/MM/yyyy") : "";
    const to = filters.dateRange.to ? format(filters.dateRange.to, "dd/MM/yyyy") : "";
    const dateTypeLabel = filters.dateRange.type === "applicant" ? "Created" : filters.dateRange.type === "lastUpdate" ? "Updated" : "Interview";
    activeFilters.push({ key: "dateRange", label: `${dateTypeLabel}: ${from}${from && to ? " → " : ""}${to}`, onRemove: () => clearSingleFilter("dateRange") });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-6 pt-5 pb-4 border-b bg-background">
          <DialogTitle asChild>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Filter className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Advanced Filters</h2>
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">
                    {activeFilters.length > 0
                      ? `${activeFilters.length} filter${activeFilters.length !== 1 ? "s" : ""} active`
                      : "Refine your applicant search"}
                  </p>
                </div>
              </div>
              {isLoading.general && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pr-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  <span>Loading...</span>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Active Filter Pills */}
        {activeFilters.length > 0 && (
          <div className="flex-shrink-0 px-6 pt-3 pb-2 bg-muted/30 border-b">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active:</span>
              <button
                onClick={resetFilters}
                className="text-xs text-red-500 hover:text-red-600 font-medium hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {activeFilters.map((f) => (
                <span
                  key={f.key}
                  className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium"
                >
                  {f.label}
                  <button
                    onClick={() => f.onRemove ? f.onRemove() : clearSingleFilter(f.key.split("-")[0], f.key.includes("-") ? f.key.split("-")[1] : undefined)}
                    className="ml-0.5 rounded-full hover:bg-white/20 p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Filter Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* ── Section 1: Stage & Status ── */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/30">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Stage & Status</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Stage */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Stage</Label>
                <Select
                  value={filters.stage_id ? String(filters.stage_id) : "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setFilters((prev) => ({ ...prev, stage: "all", stage_id: undefined, stage_status: "all" }));
                      return;
                    }
                    const selectedStage = stageList.find((s: any) => String(s.stage_id) === String(value) || String(s.id) === String(value));
                    if (selectedStage) {
                      const stageName = selectedStage.stage_name || selectedStage.name || String(value);
                      const stageId = selectedStage.stage_id || selectedStage.id;
                      setFilters((prev) => ({ ...prev, stage: stageName, stage_id: Number(stageId), stage_status: "all" }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">All Stages</SelectItem>
                    {stageList.map((stage: any) => {
                      const stageId = stage.stage_id || stage.id;
                      const stageName = stage.stage_name || stage.name || `Stage ${stageId}`;
                      return <SelectItem key={stageId} value={String(stageId)}>{stageName}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Stage Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Stage Status
                  {filters.stage && filters.stage !== "all" && stageStatuses.length > 0 && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Popover modal={false}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      disabled={!filters.stage || filters.stage === "all" || stageStatuses.length === 0 || isLoading.general}
                      className={cn(
                        "w-full justify-between h-9 text-sm font-normal",
                        (!filters.stage || filters.stage === "all") && "text-muted-foreground",
                        filters.stage && filters.stage !== "all" && stageStatuses.length > 0 &&
                        (!filters.stage_status || (Array.isArray(filters.stage_status) && filters.stage_status.length === 0) || filters.stage_status === "all")
                          ? "border-red-300" : ""
                      )}
                    >
                      <span className="truncate">
                        {!filters.stage || filters.stage === "all" ? "Select stage first"
                          : isLoading.general ? "Loading..."
                          : stageStatuses.length === 0 ? "No statuses"
                          : Array.isArray(filters.stage_status) && filters.stage_status.length > 0 ? `${filters.stage_status.length} selected`
                          : "Select statuses"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()} onWheel={(e) => e.stopPropagation()}>
                    <Command>
                      <CommandInput placeholder="Search statuses..." />
                      <CommandList className="max-h-[200px] overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                        <CommandEmpty>No status found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setFilters((prev) => {
                                const currentStatuses = Array.isArray(prev.stage_status) ? prev.stage_status : prev.stage_status && prev.stage_status !== "all" ? [prev.stage_status] : [];
                                const allStatuses = stageStatuses.map((s: any) => String(s.id));
                                return { ...prev, stage_status: currentStatuses.length === allStatuses.length ? "all" : allStatuses };
                              });
                            }}
                            className="cursor-pointer font-semibold border-b"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center w-full gap-2">
                              <Checkbox checked={Array.isArray(filters.stage_status) && filters.stage_status.length === stageStatuses.length} onCheckedChange={() => {}} />
                              <span>Select All</span>
                            </div>
                          </CommandItem>
                          {stageStatuses.map((status: any) => {
                            const statusName = status.status_name || status.name;
                            const statusId = String(status.id);
                            const isSelected = Array.isArray(filters.stage_status) ? filters.stage_status.includes(statusId) : filters.stage_status === statusId;
                            return (
                              <CommandItem
                                key={status.id || statusName}
                                value={statusName}
                                onSelect={() => {
                                  setFilters((prev) => {
                                    const curr = Array.isArray(prev.stage_status) ? prev.stage_status : prev.stage_status && prev.stage_status !== "all" ? [prev.stage_status] : [];
                                    const next = isSelected ? curr.filter((s) => s !== statusId) : [...curr, statusId];
                                    return { ...prev, stage_status: next.length > 0 ? next : "all" };
                                  });
                                }}
                                className="cursor-pointer"
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center w-full gap-2">
                                  <Checkbox checked={isSelected} onCheckedChange={() => {}} />
                                  <span className="flex-1">{statusName}</span>
                                  {isSelected && <Check className="ml-auto h-4 w-4" />}
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

              {/* Gender */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Gender</Label>
                <Select
                  value={filters.gender || "all"}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, gender: value === "all" ? undefined : value }))}
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="All Genders" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Exam Centre */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Exam Centre</Label>
                <MultiSelectCombobox
                  options={examCentres.map((c) => ({ value: String(c), label: String(c) }))}
                  value={filters.exam_centre || []}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, exam_centre: value }))}
                  onOpen={fetchExamCentres}
                  placeholder={isLoading.general || isLoadingExamCentres ? "Loading..." : "Select centres"}
                  searchPlaceholder="Search centre..."
                  emptyText="No exam centre found."
                  disabled={isLoading.general || isLoadingExamCentres}
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: Location ── */}
          <div className="rounded-xl border border-green-200 dark:border-green-800 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-950/30">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Location</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* State */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">State</Label>
                <Combobox
                  options={[
                    { value: "all", label: "All States" },
                    ...availableStates.map((state) => ({ value: state.name, label: state.name })),
                  ]}
                  value={filters.state || "all"}
                  onValueChange={handleStateChange}
                  placeholder="Select State"
                  searchPlaceholder="Search state..."
                  emptyText="No state found."
                  disabled={isLoading.general}
                />
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">District</Label>
                <Combobox
                  options={[
                    { value: "all", label: "All Districts" },
                    ...availableDistricts.map((district) => ({ value: district.name, label: district.name })),
                  ]}
                  value={filters.district?.[0] || "all"}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, district: value === "all" ? [] : [value] }))}
                  placeholder={!filters.state || filters.state === "all" ? "Select state first" : isLoading.districts ? "Loading..." : "Select district"}
                  searchPlaceholder="Search district..."
                  emptyText="No district found."
                  disabled={!filters.state || filters.state === "all" || isLoading.districts}
                />
              </div>

              {/* Campus */}
              {!hideCampusFilter && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Campus</Label>
                  <Combobox
                    options={[
                      { value: "all", label: "All Campuses" },
                      ...campusList.map((campus) => ({ value: getValue(campus), label: getDisplayName(campus, "campus_name", "Campus") })),
                    ]}
                    value={filters.partner?.[0] || "all"}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, partner: value === "all" ? [] : [value] }))}
                    onOpen={() => loadFieldData("campus")}
                    placeholder={isLoading.general ? "Loading..." : "Select campus"}
                    searchPlaceholder="Search campus..."
                    emptyText="No campus found."
                    disabled={isLoading.general}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Section 3: Partner & Donor ── */}
          <div className="rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 dark:bg-purple-950/30">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Partner & Donor</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Partner */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Partner</Label>
                <MultiSelectCombobox
                  options={partnerList.map((partner) => ({ value: String(getValue(partner)), label: getDisplayName(partner, "partner_name", "Partner") }))}
                  value={filters.partnerFilter || []}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, partnerFilter: value }))}
                  onOpen={() => loadFieldData("partnerFilter")}
                  placeholder={isLoading.general ? "Loading..." : "Select partners"}
                  searchPlaceholder="Search partner..."
                  emptyText="No partner found."
                  disabled={isLoading.general}
                />
              </div>

              {/* Donor */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Donor</Label>
                <MultiSelectCombobox
                  options={donorList.map((donor) => ({ value: String(getValue(donor)), label: getDisplayName(donor, "donor_name", "Donor") }))}
                  value={filters.donor || []}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, donor: value }))}
                  onOpen={() => loadFieldData("donor")}
                  placeholder={isLoading.general ? "Loading..." : "Select donors"}
                  searchPlaceholder="Search donor..."
                  emptyText="No donor found."
                  disabled={isLoading.general}
                />
              </div>
            </div>
          </div>

          {/* ── Section 4: Academic & Personal ── */}
          <div className="rounded-xl border border-orange-200 dark:border-orange-800 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 dark:bg-orange-950/30">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Academic & Personal</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Qualifying School */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Qualifying School</Label>
                <MultiSelectCombobox
                  options={schoolList.map((school) => ({ value: String(getValue(school)), label: getDisplayName(school, "school_name", "School") }))}
                  value={filters.school || []}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, school: value }))}
                  onOpen={() => loadFieldData("school")}
                  placeholder={isLoading.general ? "Loading..." : "Select schools"}
                  searchPlaceholder="Search school..."
                  emptyText="No school found."
                  disabled={isLoading.general}
                />
              </div>

              {/* Student Selected Course */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Student Selected Course</Label>
                <MultiSelectCombobox
                  options={schoolList.map((school) => ({ value: String(getValue(school)), label: getDisplayName(school, "school_name", "School") }))}
                  value={filters.initial_school || []}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, initial_school: value }))}
                  onOpen={() => loadFieldData("school")}
                  placeholder={isLoading.general ? "Loading..." : "Select course"}
                  searchPlaceholder="Search school..."
                  emptyText="No school found."
                  disabled={isLoading.general}
                />
              </div>

              {/* Qualification */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Qualification</Label>
                <Combobox
                  options={[
                    { value: "all", label: "All Qualifications" },
                    ...qualificationList.map((q) => ({ value: getValue(q), label: getDisplayName(q, "qualification_name", "Qualification") })),
                  ]}
                  value={filters.qualification?.[0] || "all"}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, qualification: value === "all" ? [] : [value] }))}
                  onOpen={() => loadFieldData("qualification")}
                  placeholder={isLoading.general ? "Loading..." : "Select qualification"}
                  searchPlaceholder="Search qualification..."
                  emptyText="No qualification found."
                  disabled={isLoading.general}
                />
              </div>

              {/* Current Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Current Status</Label>
                <Combobox
                  options={[
                    { value: "all", label: "All Statuses" },
                    ...currentstatusList.map((s) => ({ value: getValue(s), label: getDisplayName(s, "current_status_name", "Status") })),
                  ]}
                  value={filters.currentStatus?.[0] || "all"}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, currentStatus: value === "all" ? [] : [value] }))}
                  onOpen={() => loadFieldData("current_status")}
                  placeholder={isLoading.general ? "Loading..." : "Select status"}
                  searchPlaceholder="Search status..."
                  emptyText="No status found."
                  disabled={isLoading.general}
                />
              </div>

              {/* Religion */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Religion</Label>
                <MultiSelectCombobox
                  options={religionList.map((r) => ({ value: String(getValue(r)), label: getDisplayName(r, "religion_name", "Religion") }))}
                  value={filters.religion || []}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, religion: value }))}
                  onOpen={() => loadFieldData("religion")}
                  placeholder={isLoading.general ? "Loading..." : "Select religion"}
                  searchPlaceholder="Search religion..."
                  emptyText="No religion found."
                  disabled={isLoading.general}
                />
              </div>
            </div>
          </div>

          {/* ── Section 5: Date Range ── */}
          <div className="rounded-xl border border-rose-200 dark:border-rose-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-rose-50 dark:bg-rose-950/30">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wide">Date Range</span>
              </div>
              {(filters.dateRange.from || filters.dateRange.to) && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, dateRange: { ...prev.dateRange, from: undefined, to: undefined } }))}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 hover:underline"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Date Type</Label>
                <Select
                  value={filters.dateRange.type}
                  onValueChange={(value: "applicant" | "lastUpdate" | "interview") =>
                    setFilters((prev) => ({ ...prev, dateRange: { ...prev.dateRange, type: value } }))
                  }
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="applicant">Applicant Creation Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* From */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  From
                  {filters.dateRange.from && !filters.dateRange.to && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-9 justify-start text-sm font-normal",
                        !filters.dateRange.from && "text-muted-foreground",
                        filters.dateRange.from && !filters.dateRange.to && "border-red-300"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {filters.dateRange.from ? format(filters.dateRange.from, "PP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[60]" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from}
                      onSelect={(date) =>
                        setFilters((prev) => ({ ...prev, dateRange: { ...prev.dateRange, from: date, to: date } }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* To */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  To
                  {filters.dateRange.to && !filters.dateRange.from && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!filters.dateRange.from}
                      className={cn(
                        "w-full h-9 justify-start text-sm font-normal",
                        !filters.dateRange.to && "text-muted-foreground",
                        filters.dateRange.to && !filters.dateRange.from && "border-red-300"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {filters.dateRange.to
                        ? format(filters.dateRange.to, "PP")
                        : filters.dateRange.from ? "Pick end date" : "Select start first"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[60]" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to}
                      onSelect={(date) =>
                        setFilters((prev) => ({ ...prev, dateRange: { ...prev.dateRange, to: date } }))
                      }
                      disabled={(date) => (filters.dateRange.from ? date <= filters.dateRange.from : true)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {!filters.dateRange.from && (
                  <p className="text-xs text-muted-foreground">Select start date first</p>
                )}
              </div>
            </div>
          </div>

        </div>
        {/* ── Footer ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t bg-background">
          <Button
            variant="outline"
            onClick={resetFilters}
            size="sm"
            disabled={isLoading.general}
            className="text-muted-foreground"
          >
            Reset All
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} size="sm" disabled={isLoading.general}>
              Cancel
            </Button>
            <Button
              onClick={handleApplyFilters}
              size="sm"
              disabled={isLoading.general}
              className="px-5"
            >
              Apply Filters
              {activeFilters.length > 0 && (
                <span className="ml-2 bg-white/20 text-xs rounded-full px-1.5 py-0.5">
                  {activeFilters.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

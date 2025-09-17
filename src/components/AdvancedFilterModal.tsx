import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface FilterState {
  stage: string;
  status: string;
  examMode: string;
  interviewMode: string;
  partner: string[];
  district: string[];
  market: string[];
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
  students: any[]; //  pass your student list here
}

// Updated stage-status mapping
const STAGE_STATUS_MAP = {
  contact: [],
  screening: ["pass", "fail", "pending"],
  interviews: [
    "booked",
    "pending",
    "rescheduled",
    "lr_qualified",
    "lr_failed",
    "cfr_qualified",
    "cfr_failed",
  ],
  decision: ["offer_pending", "offer_sent", "offer_rejected", "offer_accepted"],
};

export function AdvancedFilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
  students,
}: AdvancedFilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(currentFilters);
  const [availableOptions, setAvailableOptions] = useState({
    partners: [] as string[],
    districts: [] as string[],
    markets: [] as string[],
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);

      //  derive available options from students data
      const partners = [
        ...new Set(students.map((s) => s.partner).filter(Boolean)),
      ] as string[];
      const districts = [
        ...new Set(students.map((s) => s.district).filter(Boolean)),
      ] as string[];
      const markets = [
        ...new Set(students.map((s) => s.market).filter(Boolean)),
      ] as string[];

      setAvailableOptions({ partners, districts, markets });
    }
  }, [isOpen, currentFilters, students]);

  const handleMultiSelectChange = (
    field: "partner" | "district" | "market",
    value: string,
    checked: boolean
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter((item) => item !== value),
    }));
  };

  const resetFilters = () => {
    setFilters({
      stage: "all",
      status: "all",
      examMode: "all",
      interviewMode: "all",
      partner: [],
      district: [],
      market: [],
      dateRange: { type: "application" },
    });
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const availableStatuses =
    filters.stage && filters.stage !== "all"
      ? STAGE_STATUS_MAP[filters.stage as keyof typeof STAGE_STATUS_MAP] || []
      : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Filters
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stage & Status */}
            <div className="space-y-4">
              <h3 className="font-semibold">Stage & Status</h3>
              <div>
                <Label>Stage</Label>
                <Select
                  value={filters.stage}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, stage: value, status: "all" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="interviews">Interviews</SelectItem>
                    <SelectItem value="decision">Decision</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {availableStatuses.length > 0 && (
                <div>
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Mode Filters */}
            <div className="space-y-4">
              <h3 className="font-semibold">Mode</h3>
              <div>
                <Label>Exam Mode</Label>
                <Select
                  value={filters.examMode}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, examMode: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Interview Mode</Label>
                <Select
                  value={filters.interviewMode}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, interviewMode: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interview mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Partner / District / Market */}
            {["partners", "districts", "markets"].map((field) => (
              <div key={field} className="space-y-4">
                <h3 className="font-semibold">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </h3>
                <div className="max-h-32 overflow-y-auto border rounded p-2">
                  {availableOptions[field as keyof typeof availableOptions].length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No {field} available
                    </p>
                  ) : (
                    availableOptions[field as keyof typeof availableOptions].map(
                      (option: string) => (
                        <div key={option} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`${field}-${option}`}
                            checked={
  Array.isArray(filters[field.replace("s", "") as keyof FilterState])
    ? (filters[field.replace("s", "") as keyof FilterState] as string[]).includes(option)
    : false
}
                            onCheckedChange={(checked) =>
                              handleMultiSelectChange(
                                field.replace("s", "") as "partner" | "district" | "market",
                                option,
                                !!checked
                              )
                            }
                          />
                          <Label htmlFor={`${field}-${option}`} className="text-sm">
                            {option}
                          </Label>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>
            ))}

            {/* Date Range */}
            <div className="space-y-4 col-span-full">
              <h3 className="font-semibold">Date Range</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Date Type</Label>
                  <Select
                    value={filters.dateRange.type}
                    onValueChange={(value: "application" | "lastUpdate" | "interview") =>
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, type: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="application">Application Date</SelectItem>
                      <SelectItem value="lastUpdate">Last Update</SelectItem>
                      <SelectItem value="interview">Interview Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.from
                          ? format(filters.dateRange.from, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.from}
                        onSelect={(date) =>
                          setFilters((prev) => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, from: date },
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.to
                          ? format(filters.dateRange.to, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.to}
                        onSelect={(date) =>
                          setFilters((prev) => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, to: date },
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex justify-between pt-4 border-t border-border flex-shrink-0">
          <Button variant="outline" onClick={resetFilters}>
            Reset All
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApplyFilters} className="bg-primary text-primary-foreground">
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

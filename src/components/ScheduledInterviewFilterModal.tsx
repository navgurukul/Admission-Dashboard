import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScheduledInterviewFilterState {
  slotType: string;
  status: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

interface ScheduledInterviewFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: ScheduledInterviewFilterState;
  onApplyFilters: (filters: ScheduledInterviewFilterState) => void;
}

export function ScheduledInterviewFilterModal({
  isOpen,
  onClose,
  currentFilters,
  onApplyFilters,
}: ScheduledInterviewFilterModalProps) {
  const [filters, setFilters] = useState<ScheduledInterviewFilterState>(currentFilters);

  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
    }
  }, [currentFilters, isOpen]);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearAll = () => {
    setFilters({
      slotType: "",
      status: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Filter Scheduled Interviews
           
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slot-type-filter" className="text-sm font-medium">
                Slot Type
              </Label>
              <Select
                value={filters.slotType || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    slotType: value === "all" ? "" : value,
                  }))
                }
              >
                <SelectTrigger id="slot-type-filter">
                  <SelectValue placeholder="Select slot type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="LR">LR (Learning Round)</SelectItem>
                  <SelectItem value="CFR">CFR (Culture Fit)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-sm font-medium">
                Interview Status
              </Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: value === "all" ? "" : value,
                  }))
                }
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="Passed">Passed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-date-filter" className="text-sm font-medium">
                From Date
              </Label>
              <Input
                id="from-date-filter"
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                    // Clear time filters if from date is cleared
                    ...(!e.target.value && { startTime: "", endTime: "" }),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date-filter" className="text-sm font-medium">
                To Date
              </Label>
              <Input
                id="to-date-filter"
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
          </div>

          {filters.startDate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time-filter" className="text-sm font-medium">
                  Start Time
                </Label>
                <Input
                  id="start-time-filter"
                  type="time"
                  value={filters.startTime}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time-filter" className="text-sm font-medium">
                  End Time
                </Label>
                <Input
                  id="end-time-filter"
                  type="time"
                  value={filters.endTime}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button variant="ghost" onClick={handleClearAll} className="text-muted-foreground">
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

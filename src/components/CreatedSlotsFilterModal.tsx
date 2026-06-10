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

interface CreatedSlotsFilterState {
  slotType: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface CreatedSlotsFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: CreatedSlotsFilterState;
  onApplyFilters: (filters: CreatedSlotsFilterState) => void;
}

export function CreatedSlotsFilterModal({
  isOpen,
  onClose,
  currentFilters,
  onApplyFilters,
}: CreatedSlotsFilterModalProps) {
  const [filters, setFilters] = useState<CreatedSlotsFilterState>(currentFilters);

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
      date: "",
      startTime: "",
      endTime: "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Filter Created Slots
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Row 1: Slot Type */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="created-slots-type-filter" className="text-sm font-medium">
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
                <SelectTrigger id="created-slots-type-filter">
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
              <Label htmlFor="created-slots-date-filter" className="text-sm font-medium">
                Date
              </Label>
              <Input
                id="created-slots-date-filter"
                type="date"
                value={filters.date}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    date: e.target.value,
                    // Clear time filters if date is cleared
                    ...(!e.target.value && { startTime: "", endTime: "" }),
                  }))
                }
              />
            </div>
          </div>

          {/* Row 2: Start Time & End Time — only visible when date is selected */}
          {filters.date && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="created-slots-start-time" className="text-sm font-medium">
                  Start Time
                </Label>
                <Input
                  id="created-slots-start-time"
                  type="time"
                  value={filters.startTime}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="created-slots-end-time" className="text-sm font-medium">
                  End Time
                </Label>
                <Input
                  id="created-slots-end-time"
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
            <Button onClick={handleApply}>Apply Filters</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

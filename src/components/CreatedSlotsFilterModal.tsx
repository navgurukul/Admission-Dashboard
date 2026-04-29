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
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Filter Created Slots
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
                onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Calendar, Clock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { updateSlot } from "@/utils/api";
import { isValidTimeFormat, validateTimeRange } from "@/utils/slotValidation";

interface SlotData {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  slot_type?: string;
}

interface BulkEditSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  slots: SlotData[];
}

export function BulkEditSlotModal({
  isOpen,
  onClose,
  onSuccess,
  slots,
}: BulkEditSlotModalProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [slotType, setSlotType] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    setDate(undefined);
    setStartTime("");
    setEndTime("");
    setSlotType("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date && !startTime && !endTime && !slotType) {
      toast({
        title: "⚠️ No Changes",
        description: "Please specify at least one field to bulk edit.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    // Validate time format (HH:mm) if provided
    if (startTime && !isValidTimeFormat(startTime)) {
      toast({
        title: "⚠️ Invalid Time Format",
        description: "Please enter a valid start time in HH:mm format.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (endTime && !isValidTimeFormat(endTime)) {
      toast({
        title: "⚠️ Invalid Time Format",
        description: "Please enter a valid end time in HH:mm format.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    // Since users might only update start or end time, we need to defer time range validation 
    // to the individual slot processing level, or we just validate if BOTH are provided.
    if (startTime && endTime) {
      const rangeValidation = validateTimeRange(startTime, endTime);
      if (!rangeValidation.valid) {
        toast({
          title: "⚠️ Invalid Time Range",
          description: rangeValidation.message,
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900",
        });
        return;
      }
    }

    try {
      setLoading(true);

      const updatePromises = slots.map((slot) => {
        // Fallback to existing values if not specified
        const finalDate = date ? format(date, "yyyy-MM-dd") : format(new Date(slot.date), "yyyy-MM-dd");
        const finalStartTime = startTime ? startTime : slot.start_time;
        const finalEndTime = endTime ? endTime : slot.end_time;
        const finalSlotType = slotType ? slotType : (slot.slot_type || "LR");

        const payload = {
          date: finalDate,
          start_time: finalStartTime,
          end_time: finalEndTime,
          slot_type: finalSlotType,
        };

        return updateSlot(slot.id, payload);
      });

      const results = await Promise.allSettled(updatePromises);

      const fulfilledCount = results.filter((r) => r.status === "fulfilled").length;
      const rejectedResults = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
      const rejectedCount = rejectedResults.length;

      if (fulfilledCount > 0) {
        toast({
          title: "✅ Slots Updated",
          description: `${fulfilledCount} slot(s) updated successfully.`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900"
        });
      }
      
      if (rejectedCount > 0) {
        const errorMessages = rejectedResults
          .map((r) => getFriendlyErrorMessage(r.reason))
          .filter(Boolean);
        const uniqueErrorMessages = Array.from(new Set(errorMessages));
        
        const errorMessageStr = uniqueErrorMessages.length > 0 
          ? uniqueErrorMessages.join(" | ") 
          : "Server rejected the request.";

        toast({
          title: "❌ Partial Update Failed",
          description: `Failed to update ${rejectedCount} slot(s). Reasons: ${errorMessageStr}`,
          variant: "destructive",
          className: "border-red-500 bg-red-50 text-red-900"
        });
      }

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Error bulk updating slots:", error);
      toast({
        title: "❌ Unable to Bulk Update Slots",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" />
            Bulk Edit {slots.length} Slot(s)
          </DialogTitle>
          <div className="text-sm text-muted-foreground mt-2">
            Leave fields blank if you do not want to change them.
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label>New Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Keep existing</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  disabled={(d) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return d < today;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slot-type">New Slot Type (Optional)</Label>
            <Select value={slotType} onValueChange={setSlotType}>
              <SelectTrigger id="slot-type">
                <SelectValue placeholder="Keep existing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LR">Learning Round (LR)</SelectItem>
                <SelectItem value="CFR">Cultural Fit Round (CFR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start-time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start Time
              </Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="Keep existing"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                End Time
              </Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="Keep existing"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary hover:bg-primary/90 text-white"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Slots"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";
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
import { updateSlot } from "@/utils/api";

interface EditSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  slotData: {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    slot_type: string;
  } | null;
}

export function EditSlotModal({
  isOpen,
  onClose,
  onSuccess,
  slotData,
}: EditSlotModalProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [slotType, setSlotType] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (slotData && isOpen) {
      // Parse the date
      setDate(new Date(slotData.date));
      setStartTime(slotData.start_time);
      setEndTime(slotData.end_time);
      setSlotType(slotData.slot_type);
    }
  }, [slotData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    if (!startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all time details",
        variant: "destructive",
      });
      return;
    }

    // Validate time format (HH:mm)
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
      toast({
        title: "Invalid time",
        description: "Times must be in HH:mm format",
        variant: "destructive",
      });
      return;
    }

    // Validate start < end
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    if (toMinutes(startTime) >= toMinutes(endTime)) {
      toast({
        title: "Invalid time range",
        description: "Start time must be earlier than end time",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        date: format(date, "yyyy-MM-dd"),
        start_time: startTime,
        end_time: endTime,
        slot_type: slotType,
      };

      await updateSlot(slotData!.id, payload);

      toast({
        title: "Success",
        description: "Slot updated successfully",
      });

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error updating slot:", error);
      toast({
        title: "Error",
        description: "Failed to update slot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDate(undefined);
    setStartTime("");
    setEndTime("");
    setSlotType("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Edit Interview Slot
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Select Date</Label>
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
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slot-type">Slot Type</Label>
            <Select value={slotType} onValueChange={setSlotType}>
              <SelectTrigger id="slot-type">
                <SelectValue placeholder="Select slot type" />
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
                required
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
                required
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
              {loading ? "Updating..." : "Update Slot"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

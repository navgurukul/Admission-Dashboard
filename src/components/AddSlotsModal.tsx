import { useState } from "react";
import { Calendar, Clock, User, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { createSlotBookingTimes } from "@/utils/api";

interface TimeSlot {
  startTime: string;
  endTime: string;
  interviewer: string;
}

interface AddSlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddSlotsModal({
  isOpen,
  onClose,
  onSuccess,
}: AddSlotsModalProps) {
  const [date, setDate] = useState<Date>();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { startTime: "", endTime: "", interviewer: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addTimeSlot = () => {
    setTimeSlots([
      ...timeSlots,
      { startTime: "", endTime: "", interviewer: "" },
    ]);
  };

  const removeTimeSlot = (index: number) => {
    if (timeSlots.length > 1) {
      const newSlots = timeSlots.filter((_, i) => i !== index);
      setTimeSlots(newSlots);
    }
  };

  const updateTimeSlot = (
    index: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    const newSlots = [...timeSlots];
    newSlots[index][field] = value;
    setTimeSlots(newSlots);
  };

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

    const invalidSlots = timeSlots.some(
      (slot) => !slot.startTime || !slot.endTime
    );
    if (invalidSlots) {
      toast({
        title: "Error",
        description: "Please fill in all time slot details",
        variant: "destructive",
      });
      return;
    }

    // Validate time format (HH:mm) and start < end
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    for (let i = 0; i < timeSlots.length; i++) {
      const { startTime, endTime } = timeSlots[i];

      if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
        toast({
          title: "Invalid time",
          description: `Slot ${i + 1}: times must be in HH:mm format.`,
          variant: "destructive",
        });
        return;
      }

      if (toMinutes(startTime) >= toMinutes(endTime)) {
        toast({
          title: "Invalid time range",
          description: `Slot ${i + 1}: start time must be earlier than end time.`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setLoading(true);

      const slotsData = timeSlots.map((slot) => ({
        date: format(date, "yyyy-MM-dd"),
        start_time: slot.startTime,
        end_time: slot.endTime,
        // interviewer: slot.interviewer,
        created_at: new Date().toISOString(),
      }));

      await createSlotBookingTimes(slotsData);
      console.log("Slots created via API", slotsData);

      toast({
        title: "Success",
        description: `${timeSlots.length} interview slots added successfully`,
      });

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error adding slots:", error);
      toast({
        title: "Error",
        description: "Failed to add interview slots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDate(undefined);
    setTimeSlots([{ startTime: "", endTime: "", interviewer: "" }]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Add Interview Slots
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
                    !date && "text-muted-foreground"
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

          {/* Time Slots */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Time Slots</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTimeSlot}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Slot
              </Button>
            </div>

            {timeSlots.map((slot, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Slot {index + 1}</span>
                  {timeSlots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTimeSlot(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label
                      htmlFor={`start-${index}`}
                      className="flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Start Time
                    </Label>
                    <Input
                      id={`start-${index}`}
                      type="time"
                      value={slot.startTime}
                      onChange={(e) =>
                        updateTimeSlot(index, "startTime", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor={`end-${index}`}
                      className="flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      End Time
                    </Label>
                    <Input
                      id={`end-${index}`}
                      type="time"
                      value={slot.endTime}
                      onChange={(e) =>
                        updateTimeSlot(index, "endTime", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor={`interviewer-${index}`} className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Interviewer Name
                  </Label>
                  <Input
                    id={`interviewer-${index}`}
                    type="text"
                    placeholder="Enter interviewer name"
                    value={slot.interviewer}
                    onChange={(e) => updateTimeSlot(index, 'interviewer', e.target.value)}
                    required
                  />
                </div> */}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-primary hover:bg-primary/90 text-white"
            >
              {loading
                ? "Adding Slots..."
                : `Add ${timeSlots.length} Slot${
                    timeSlots.length > 1 ? "s" : ""
                  }`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

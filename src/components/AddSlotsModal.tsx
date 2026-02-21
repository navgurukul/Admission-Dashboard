import { useState, useEffect } from "react";
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
import { createSlotBookingTimes, getSlotByDate } from "@/utils/api";
import {
  toMinutes,
  timesOverlap,
  formatTime,
  getSlotTypeName,
  validateAgainstExistingSlots,
  isValidTimeFormat,
  validateTimeRange,
} from "@/utils/slotValidation";

interface TimeSlot {
  date?: Date;
  startTime: string;
  endTime: string;
  slot_type: string;
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
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { date: undefined, startTime: "", endTime: "", slot_type: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({});
  const [existingSlotsCache, setExistingSlotsCache] = useState<Record<string, any[]>>({});
  const { toast } = useToast();

  // Fetch existing slots when a date is selected
  const fetchExistingSlotsForDate = async (date: Date, slotType: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const cacheKey = `${dateStr}_${slotType}`;

    // Check cache first
    if (existingSlotsCache[cacheKey]) {
      return existingSlotsCache[cacheKey];
    }

    try {
      const response = await getSlotByDate(dateStr, slotType as "LR" | "CFR");
      const slots = Array.isArray(response) ? response : (response as any)?.data || [];
      
      // Cache the result
      setExistingSlotsCache(prev => ({
        ...prev,
        [cacheKey]: slots,
      }));

      return slots;
    } catch (error) {
      console.error("Error fetching existing slots:", error);
      return [];
    }
  };

  // Wrapper to validate using cached data
  const validateSlotWithCache = async (
    date: Date,
    startTime: string,
    endTime: string,
    slotType: string,
  ): Promise<{ valid: boolean; message?: string }> => {
    // Ensure data is fetched and cached first
    await fetchExistingSlotsForDate(date, slotType);
    
    // Now validate using the shared function
    return validateAgainstExistingSlots(date, startTime, endTime, slotType);
  };

  // Validate within the current form (check duplicates and overlaps)
  const validateWithinForm = (
    slots: TimeSlot[],
  ): { valid: boolean; message?: string } => {
    for (let i = 0; i < slots.length; i++) {
      const slot1 = slots[i];
      if (!slot1.date || !slot1.startTime || !slot1.endTime || !slot1.slot_type) {
        continue;
      }

      for (let j = i + 1; j < slots.length; j++) {
        const slot2 = slots[j];
        if (!slot2.date || !slot2.startTime || !slot2.endTime || !slot2.slot_type) {
          continue;
        }

        // Check if same date
        const sameDate = format(slot1.date, "yyyy-MM-dd") === format(slot2.date, "yyyy-MM-dd");
        
        if (sameDate) {
          const sameType = slot1.slot_type === slot2.slot_type;
          const slot1Type = getSlotTypeName(slot1.slot_type);
          const slot2Type = getSlotTypeName(slot2.slot_type);
          const dateStr = format(slot1.date, "MMM dd, yyyy");

          // Check for exact duplicate (same type, same time)
          if (
            sameType &&
            slot1.startTime === slot2.startTime &&
            slot1.endTime === slot2.endTime
          ) {
            return {
              valid: false,
              message: `Duplicate found! Slot #${i + 1} and Slot #${j + 1} have the same ${slot1Type} time (${formatTime(slot1.startTime)} - ${formatTime(slot1.endTime)}) on ${dateStr}.`,
            };
          }

          // Check for time overlap (regardless of type - can't have overlapping interviews)
          if (timesOverlap(slot1.startTime, slot1.endTime, slot2.startTime, slot2.endTime)) {
            return {
              valid: false,
              message: `Time conflict between your slots! Slot #${i + 1} (${slot1Type}: ${formatTime(slot1.startTime)} - ${formatTime(slot1.endTime)}) overlaps with Slot #${j + 1} (${slot2Type}: ${formatTime(slot2.startTime)} - ${formatTime(slot2.endTime)}) on ${dateStr}.`,
            };
          }
        }
      }
    }

    return { valid: true };
  };

  const addTimeSlot = () => {
    setTimeSlots([
      ...timeSlots,
      { date: undefined, startTime: "", endTime: "", slot_type: "" },
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
    value: string | Date,
  ) => {
    const newSlots = [...timeSlots];
    newSlots[index][field] = value as any;
    setTimeSlots(newSlots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all slots have dates
    const missingDates = timeSlots.some((slot) => !slot.date);
    if (missingDates) {
      toast({
        title: "⚠️ Missing Date",
        description: "Please select a date for all slots before submitting.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    const invalidSlots = timeSlots.some(
      (slot) => !slot.startTime || !slot.endTime || !slot.slot_type,
    );
    if (invalidSlots) {
      toast({
        title: "⚠️ Incomplete Information",
        description: "Please fill in all required fields: slot type, start time, and end time.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    // Validate time format and time range
    for (let i = 0; i < timeSlots.length; i++) {
      const { startTime, endTime } = timeSlots[i];

      if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
        toast({
          title: "⚠️ Invalid Time Format",
          description: `Slot #${i + 1}: Please enter valid times in HH:mm format (e.g., 14:30).`,
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900",
        });
        return;
      }

      // Validate time range (checks start < end, min duration, max duration)
      const rangeValidation = validateTimeRange(startTime, endTime);
      if (!rangeValidation.valid) {
        toast({
          title: "⚠️ Invalid Time Range",
          description: `Slot #${i + 1}: ${rangeValidation.message}`,
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900",
        });
        return;
      }
    }

    // Validate within form for duplicates and overlaps
    const formValidation = validateWithinForm(timeSlots);
    if (!formValidation.valid) {
      toast({
        title: "⚠️ Slot Conflict",
        description: formValidation.message,
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    // Batch fetch all required existing slots to minimize API calls
    toast({
      title: "Validating Slots...",
      description: "Checking for conflicts with existing schedules...",
      variant: "default",
      className: "border-orange-500 bg-orange-50 text-orange-900",
    });

    try {
      // Get unique combinations of date and slot_type
      const uniqueCombinations = new Map<string, { date: Date; slotType: string }>();
      
      timeSlots.forEach((slot) => {
        const dateStr = format(slot.date!, "yyyy-MM-dd");
        const key = `${dateStr}_${slot.slot_type}`;
        if (!uniqueCombinations.has(key)) {
          uniqueCombinations.set(key, { date: slot.date!, slotType: slot.slot_type });
        }
      });

      // Fetch all required slots in parallel (batch request)
      const fetchPromises = Array.from(uniqueCombinations.values()).map(
        ({ date, slotType }) => fetchExistingSlotsForDate(date, slotType)
      );

      await Promise.all(fetchPromises);

      // Now validate each slot against cached data
      for (let i = 0; i < timeSlots.length; i++) {
        const slot = timeSlots[i];
        const validation = await validateSlotWithCache(
          slot.date!,
          slot.startTime,
          slot.endTime,
          slot.slot_type,
        );

        if (!validation.valid) {
          toast({
            title: "⚠️ Cannot Add Slot",
            description: validation.message,
            variant: "default",
            className: "border-orange-500 bg-orange-50 text-orange-900",
          });
          return;
        }
      }
    } catch (error) {
      console.error("Error validating slots:", error);
      toast({
        title: "❌ Validation Failed",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
      return;
    }

    try {
      setLoading(true);

      const slotsData = timeSlots.map((slot) => ({
        date: format(slot.date!, "yyyy-MM-dd"),
        start_time: slot.startTime,
        end_time: slot.endTime,
        slot_type: slot.slot_type,
        created_at: new Date().toISOString(),
      }));

      await createSlotBookingTimes(slotsData);
      // console.log("Slots created via API", slotsData);

      toast({
        title: "✅ Slots Added Successfully",
        description: `${timeSlots.length} interview slot${timeSlots.length > 1 ? 's have' : ' has'} been added to the schedule.`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error adding slots:", error);
      toast({
        title: "❌ Unable to Add Slots",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTimeSlots([
      { date: undefined, startTime: "", endTime: "", slot_type: "" },
    ]);
    setOpenPopovers({});
    setExistingSlotsCache({});
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
                {/* Date Selection */}
                <div className="space-y-2">
                  <Label>Select Date</Label>
                  <Popover
                    open={openPopovers[index]}
                    onOpenChange={(open) =>
                      setOpenPopovers((prev) => ({ ...prev, [index]: open }))
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !slot.date && "text-muted-foreground",
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {slot.date ? (
                          format(slot.date, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={slot.date}
                        onSelect={(newDate) => {
                          if (newDate) {
                            updateTimeSlot(index, "date", newDate);
                            setOpenPopovers((prev) => ({
                              ...prev,
                              [index]: false,
                            }));
                          }
                        }}
                        initialFocus
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

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

                {/* Slot Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor={`slot-type-${index}`}>Slot Type</Label>
                  <Select
                    value={slot.slot_type}
                    onValueChange={(value) =>
                      updateTimeSlot(index, "slot_type", value)
                    }
                  >
                    <SelectTrigger id={`slot-type-${index}`}>
                      <SelectValue placeholder="Select slot type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LR">Learning Round (LR)</SelectItem>
                      <SelectItem value="CFR">
                        Cultural Fit Round (CFR)
                      </SelectItem>
                    </SelectContent>
                  </Select>
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

import { format } from "date-fns";
import { getSlotByDate } from "./api";

/**
 * Convert time string (HH:mm) to minutes for comparison
 */
export const toMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Check if two time ranges overlap
 */
export const timesOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean => {
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  // Two ranges overlap if one starts before the other ends
  return s1 < e2 && s2 < e1;
};

/**
 * Format time for display (12-hour format with AM/PM)
 */
export const formatTime = (timeStr: string): string => {
  const [hour, minute] = timeStr.split(":");
  const hourNum = parseInt(hour);
  const period = hourNum >= 12 ? "PM" : "AM";
  const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
  return `${displayHour}:${minute} ${period}`;
};

/**
 * Get display name for slot type
 */
export const getSlotTypeName = (slotType: string): string => {
  if (slotType === "LR") return "Learning Round";
  if (slotType === "CFR") return "Cultural Fit Round";
  return slotType;
};

/**
 * Validate against existing slots in database
 * @param date - The date to validate
 * @param startTime - Start time in HH:mm format
 * @param endTime - End time in HH:mm format
 * @param slotType - Type of slot (LR or CFR)
 * @param excludeSlotId - Optional slot ID to exclude from validation (for edit mode)
 * @param currentInterviewerId - Current interviewer's ID (to check only their own slots)
 */
export const validateAgainstExistingSlots = async (
  date: Date,
  startTime: string,
  endTime: string,
  slotType: string,
  excludeSlotId?: number,
  currentInterviewerId?: number,
): Promise<{ valid: boolean; message?: string }> => {
  try {
    const dateStr = format(date, "yyyy-MM-dd");
    
    // Fetch slots for BOTH types to check for cross-type conflicts
    const slotTypes = ["LR", "CFR"] as const;
    const allExistingSlotsPromises = slotTypes.map(type => 
      getSlotByDate(dateStr, type).catch(() => [])
    );
    
    const allSlotsResponses = await Promise.all(allExistingSlotsPromises);
    const allExistingSlots = allSlotsResponses.flatMap(response => 
      Array.isArray(response) ? response : (response as any)?.data || []
    );

    for (const existingSlot of allExistingSlots) {
      // Skip the slot being edited (if excludeSlotId is provided)
      if (excludeSlotId && existingSlot.id === excludeSlotId) {
        continue;
      }
      
      // If current user's interviewer ID is available
      if (currentInterviewerId) {
        // Get the slot owner ID (could be interviewer_id or created_by)
        const slotOwnerId = existingSlot.created_by || existingSlot.interviewer_id;
        
        // Skip if existing slot has no owner info (old data - assume different interviewer)
        if (!slotOwnerId) {
          continue;
        }
        // Skip if it's a different interviewer's slot
        if (slotOwnerId !== currentInterviewerId) {
          continue;
        }
        
      }

      const existingSlotType = getSlotTypeName(existingSlot.slot_type);
      const newSlotType = getSlotTypeName(slotType);
      const dateFormatted = format(date, "MMM dd, yyyy");
      const isSameType = existingSlot.slot_type === slotType;

      // Check for exact duplicate (same type, same time)
      if (
        isSameType &&
        existingSlot.start_time === startTime &&
        existingSlot.end_time === endTime
      ) {
        return {
          valid: false,
          message: excludeSlotId
            ? `A ${existingSlotType} slot already exists at this exact time (${formatTime(startTime)} - ${formatTime(endTime)}) on ${dateFormatted}. Please choose a different time.`
            : `This ${existingSlotType} slot (${formatTime(startTime)} - ${formatTime(endTime)}) already exists on ${dateFormatted}. Please choose a different time.`,
        };
      }

      // Check for time overlap (with ANY slot type)
      if (
        timesOverlap(
          startTime,
          endTime,
          existingSlot.start_time,
          existingSlot.end_time,
        )
      ) {
        const conflictMessage = isSameType
          ? `Time conflict! Your ${newSlotType} slot (${formatTime(startTime)} - ${formatTime(endTime)}) overlaps with an existing ${existingSlotType} slot (${formatTime(existingSlot.start_time)} - ${formatTime(existingSlot.end_time)}) on ${dateFormatted}.`
          : `Time conflict! Your ${newSlotType} slot (${formatTime(startTime)} - ${formatTime(endTime)}) overlaps with an existing ${existingSlotType} slot (${formatTime(existingSlot.start_time)} - ${formatTime(existingSlot.end_time)}) on ${dateFormatted}. Slots of different types cannot overlap.`;
        
        return {
          valid: false,
          message: conflictMessage,
        };
      }
    }

    return { valid: true };
  } catch (error) {
    console.error("Error validating slots:", error);
    return { valid: true }; // Allow operation if validation fails to fetch
  }
};

/**
 * Validate time format (HH:mm)
 */
export const isValidTimeFormat = (timeStr: string): boolean => {
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timePattern.test(timeStr);
};

/**
 * Validate time range is reasonable
 * @param startTime - Start time in HH:mm format
 * @param endTime - End time in HH:mm format
 * @returns Object with validation result and optional message
 */
export const validateTimeRange = (
  startTime: string,
  endTime: string,
): { valid: boolean; message?: string } => {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  const durationMinutes = endMinutes - startMinutes;

  // Check if start time is before end time
  if (startMinutes >= endMinutes) {
    return {
      valid: false,
      message: `Start time (${formatTime(startTime)}) must be earlier than end time (${formatTime(endTime)}).`,
    };
  }

  // Check minimum duration (e.g., at least 15 minutes)
  const MIN_DURATION = 15;
  if (durationMinutes < MIN_DURATION) {
    return {
      valid: false,
      message: `Interview slot duration must be at least ${MIN_DURATION} minutes. Current duration: ${durationMinutes} minutes (${formatTime(startTime)} - ${formatTime(endTime)}).`,
    };
  }

  // Check maximum duration (e.g., no more than 4 hours)
  const MAX_DURATION = 240; // 4 hours
  if (durationMinutes > MAX_DURATION) {
    return {
      valid: false,
      message: `Interview slot duration cannot exceed ${MAX_DURATION / 60} hours. Current duration: ${Math.round(durationMinutes / 60 * 10) / 10} hours.`,
    };
  }

  return { valid: true };
};

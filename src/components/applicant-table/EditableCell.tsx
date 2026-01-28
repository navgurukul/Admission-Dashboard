import { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateStudent } from "@/utils/api";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Option = {
  id?: number | string;
  name?: string;
  value?: string | number;
  label?: string;
};

interface EditableCellProps {
  applicant: any;
  field: string;
  displayValue: any;
  value?: any;
  onUpdate?: (value: any) => void;
  onEditStart?: () => void; // NEW: Callback when user starts editing
  isLoadingOptions?: boolean; // NEW: Loading state for options
  showPencil?: boolean;
  options?: Option[];
  fetchOptions?: () => Promise<Option[]>; // NEW: Lazy loading callback
  forceTextDisplay?: boolean; // NEW: Force text display even if options exist
  showActionButtons?: boolean;
  disabled?: boolean;
  renderInput?: (props: {
    value: any;
    onChange: (val: any) => void;
  }) => JSX.Element;
  tooltipMessage?: string;
  placeholder?: string;
}

function normalizeOptions(options?: Option[]): { id: string; name: string }[] {
  if (!options) return [];
  return options
    .map((opt) => ({
      id: opt.id !== undefined ? String(opt.id) : String(opt.value ?? ""),
      name: opt.name ?? opt.label ?? String(opt.value ?? ""),
    }))
    .filter((opt) => opt.id !== "");
}

export function EditableCell({
  applicant,
  field,
  displayValue,
  value,
  onUpdate,
  onEditStart,
  isLoadingOptions = false,
  showPencil = false,
  options,
  fetchOptions,
  forceTextDisplay = false,
  showActionButtons = true,
  disabled,
  renderInput,
  tooltipMessage,
  placeholder = "Select option",
}: EditableCellProps) {
  const [editingCell, setEditingCell] = useState<{
    id: number;
    field: string;
  } | null>(null);
  const [cellValue, setCellValue] = useState<any>(value ?? displayValue ?? "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false); // Local loading state for this cell
  const { toast } = useToast();

  // Memoize normalized options to prevent recalculation on every render
  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);

  useEffect(() => {
    setCellValue(value ?? displayValue ?? "");
  }, [value, displayValue]);

  const startCellEdit = async (id: number, field: string, currentValue: any) => {
    // ✅ Set editing mode FIRST so dropdown appears immediately
    setEditingCell({ id, field });
    setCellValue(currentValue ?? value ?? displayValue ?? "");
    
    // ✅ Then load data in the background (if not already loaded)
    // The dropdown will show with loading spinner while data loads
    if (onEditStart && normalizedOptions.length === 0) {
      // console.log(`🔧 Starting edit for field: ${field}, loading data if needed...`);
      setIsLoadingData(true);
      try {
        await onEditStart();
        // console.log(`✅ Data ready for field: ${field}`);
      } finally {
        setIsLoadingData(false);
      }
    }
  };

  const saveCellEdit = async () => {
    if (!applicant?.id) {
      console.error("Applicant ID is missing in EditableCell:", applicant);
      toast({
        title: "❌ Unable to Update",
        description: "Cannot update: Student ID is missing",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
      return;
    }

    if (
      (field === "phone_number" || field === "whatsapp_number") &&
      cellValue &&
      !/^\d{10}$/.test(cellValue)
    ) {
      toast({
        title: "⚠️ Invalid Mobile Number",
        description: "Mobile number must be exactly 10 digits",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (
      field === "pin_code" &&
      cellValue &&
      !/^\d{6}$/.test(cellValue)
    ) {
      toast({
        title: "⚠️ Invalid Pincode",
        description: "Pincode must be exactly 6 digits",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (
      field === "email" &&
      cellValue &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cellValue)
    ) {
      toast({
        title: "⚠️ Invalid Email",
        description: "Please enter a valid email address",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    // Validate date of birth - cannot be empty and minimum age 16.5 years
    if (field === "dob") {
      // Check if date is empty or invalid (like "N/A")
      if (!cellValue || cellValue === "" || cellValue === null || cellValue === "N/A" || cellValue === "n/a") {
        toast({
          title: "⚠️ Date of Birth Required",
          description: "Please select a date of birth. This field cannot be empty.",
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900",
        });
        return;
      }

      const selectedDate = new Date(cellValue);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare only dates
      
      // Check if the date is valid
      if (isNaN(selectedDate.getTime())) {
        toast({
          title: "⚠️ Invalid Date Format",
          description: "Please select a valid date of birth",
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900",
        });
        return;
      }
      
      if (selectedDate > today) {
        toast({
          title: "⚠️ Invalid Date of Birth",
          description: "Date of birth cannot be in the future",
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900",
        });
        return;
      }

      // Calculate age in years (including decimal for months)
      const ageInMilliseconds = today.getTime() - selectedDate.getTime();
      const ageInYears = ageInMilliseconds / (365.25 * 24 * 60 * 60 * 1000);
      
      if (ageInYears < 16.5) {
        toast({
          title: "⚠️ Age Requirement Not Met",
          description: "Applicant must be at least 16.5 years old (16 years and 6 months)",
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900",
        });
        return;
      }
    }

    if (!editingCell || isUpdating) return;

    // ✅ Define required fields that cannot be cleared/emptied
    const requiredFields = [
      'first_name',
      'last_name', 
      'email',
      'phone_number',
      'whatsapp_number'
    ];

    // ✅ Check if user is trying to clear a required field
    const isRequiredField = requiredFields.includes(field);
    const isEmptyValue = !cellValue || cellValue.toString().trim() === '';
    
    if (isRequiredField && isEmptyValue) {
      toast({
        title: "⚠️ Required Field",
        description: `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} cannot be empty. Please enter a value.`,
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const isIdField = String(field).endsWith("_id");
      const payload: any = {};

      if (isIdField) {
        payload[field] =
          cellValue === "" || cellValue === "none" ? null : Number(cellValue);
      } else {
        payload[field] = cellValue ?? "";
      }

      await updateStudent(applicant.id, payload);
      toast({ 
        title: "✅ Field Updated", 
        description: "Field updated successfully",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
      setEditingCell(null);
      if (onUpdate) {
        onUpdate(payload[field]); // Pass updated value
      }
    } catch (error: any) {
      console.error("Error updating field:", error);
      toast({
        title: "❌ Unable to Update Field",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
    setCellValue("");
  };

  // Memoize dropdown change handler to prevent recreation on each render
  const handleDirectDropdownChange = useCallback(async (newValue: string) => {
    if (!applicant?.id) {
      console.error("Applicant ID is missing in EditableCell:", applicant);
      toast({
        title: "❌ Unable to Update",
        description: "Cannot update: Student ID is missing",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
      return;
    }

    // ✅ Define required dropdown fields that cannot be cleared
    const requiredDropdownFields = [
      'gender',
      'campus_id'
    ];

    // ✅ Check if user is trying to clear a required dropdown field
    const isRequiredDropdown = requiredDropdownFields.includes(field);
    const isClearingValue = newValue === "none" || newValue === "";
    
    if (isRequiredDropdown && isClearingValue) {
      toast({
        title: "⚠️ Required Field",
        description: `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} is required and cannot be cleared. Please select a value.`,
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const isIdField = String(field).endsWith("_id");
      const payload: any = {};

      // Special handling for state, district, block - convert codes to names
      if (field === "state" || field === "district" || field === "block") {
        if (newValue === "none" || newValue === "") {
          payload[field] = null;
        } else {
          // Find the label (name) from the options and send NAME to API
          const selectedOption = normalizedOptions.find((opt) => opt.id === newValue);
          payload[field] = selectedOption ? selectedOption.name : newValue;
        }
      } else if (newValue === "none" || newValue === "") {
        payload[field] = null;
      } else if (isIdField) {
        payload[field] = Number(newValue);
      } else {
        payload[field] = newValue;
      }

      await updateStudent(applicant.id, payload);
      toast({ 
        title: "✅ Field Updated", 
        description: "Field updated successfully",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
      setCellValue(payload[field]);
      
      // Exit edit mode for forceTextDisplay fields after successful update
      if (forceTextDisplay) {
        setEditingCell(null);
      }
      
      if (onUpdate) {
        onUpdate(newValue); // Pass the code/id for state management, but API gets the name
      }
    } catch (error: any) {
      console.error("Error updating field:", error);
      toast({
        title: "❌ Unable to Update Field",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [applicant, field, isUpdating, onUpdate, toast, normalizedOptions, forceTextDisplay]);

  const isEditing =
    editingCell?.id === applicant.id && editingCell?.field === field;
  // If forceTextDisplay is true, only show dropdown when actively editing
  // Also treat as dropdown if we're loading options (to show loading state instead of text input)
  const isDropdownField = forceTextDisplay 
    ? ((normalizedOptions.length > 0 || isLoadingOptions || isLoadingData) && isEditing) 
    : (normalizedOptions.length > 0 || isLoadingOptions || isLoadingData);

  const getCurrentDropdownValue = () => {
    // Priority: 1. value prop, 2. Try to match displayValue with options, 3. "none"
    if (value !== null && value !== undefined) {
      return String(value);
    }

    // Try to match displayValue with option names (for cases like gender where value isn't passed)
    if (displayValue && normalizedOptions.length > 0) {
      const matchedOption = normalizedOptions.find(
        (opt) => opt.name.toLowerCase() === String(displayValue).toLowerCase(),
      );
      if (matchedOption) {
        return matchedOption.id;
      }
    }

    return "none";
  };

  // Memoize combobox options conversion
  const comboboxOptions: ComboboxOption[] | null = useMemo(() => {
    if (normalizedOptions.length > 10) {
      return normalizedOptions.map((opt) => ({
        value: opt.id,
        label: opt.name,
      }));
    }
    return null;
  }, [normalizedOptions]);

  if (isDropdownField) {
    const currentValue = getCurrentDropdownValue();
    
    // Define required fields that should not show "Select/Clear" option
    const requiredDropdownFields = ['gender', 'campus_id'];
    const isRequiredDropdown = requiredDropdownFields.includes(field);
    
    // Hide "Select" option for required fields or offer_letter_status if value exists
    const shouldHideSelectOption =
      isRequiredDropdown ||
      (field === "offer_letter_status" &&
        currentValue !== "none" &&
        currentValue !== null &&
        currentValue !== undefined);

    // ✅ Show minimal loading state while options are being fetched
    // This should rarely be seen since we pre-load on hover
    if ((isLoadingOptions || isLoadingData) && normalizedOptions.length === 0) {
      return (
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
          <span className="text-xs">Loading options...</span>
        </div>
      );
    }

    // Use Combobox for fields with many options (searchable)
    // Also always use Combobox for location fields (state, district, block) for consistent UX
    const locationFields = ['state', 'district', 'block'];
    const useCombobox = normalizedOptions.length > 10 || locationFields.includes(field);

    if (useCombobox) {
      const comboboxOptions: ComboboxOption[] = normalizedOptions.map((opt) => ({
        value: opt.id,
        label: opt.name,
      }));

      return (
        <Combobox
          options={comboboxOptions}
          value={currentValue === "none" ? "" : currentValue}
          onValueChange={(val) => !disabled && handleDirectDropdownChange(val || "none")}
          placeholder={placeholder || "Select option..."}
          searchPlaceholder="Search..."
          emptyText="No option found."
          disabled={isUpdating || disabled}
          className={cn(
            'max-w-full overflow-hidden',
            disabled ? '!opacity-100 !cursor-default' : ''
          )}
        />
      );
    }

    return (
      <Select
        value={currentValue}
        onValueChange={(val) => !disabled && handleDirectDropdownChange(val)}
        disabled={isUpdating || disabled}
      >
        <SelectTrigger
          className={`h-8 border-0 shadow-none hover:bg-muted/50 focus:ring-1 focus:ring-ring ${disabled ? '!opacity-100 !cursor-default [&>svg]:hidden' : ''
            }`}
          style={disabled ? { opacity: 1 } : {}}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {!shouldHideSelectOption && (
            <SelectItem value="none">
              <span className="text-muted-foreground italic">
                {currentValue && currentValue !== "none" ? "Clear (Remove)" : "Select"}
              </span>
            </SelectItem>
          )}
          {normalizedOptions.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (isEditing) {
    // Special rendering for DOB field with calendar picker
    if (field === "dob") {
      // Safely parse the date value
      let dateValue: Date | undefined;
      if (cellValue && cellValue !== "N/A" && cellValue !== "n/a") {
        const parsedDate = new Date(cellValue);
        // Only use the date if it's valid
        if (!isNaN(parsedDate.getTime())) {
          dateValue = parsedDate;
        }
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculate minimum allowed date (16.5 years ago from today)
      const minAllowedDate = new Date(today);
      minAllowedDate.setFullYear(today.getFullYear() - 16);
      minAllowedDate.setMonth(today.getMonth() - 6); // Subtract 6 months for the 0.5 year
      
      // Calculate maximum allowed date for year selector (earliest possible DOB)
      const maxYearForSelector = today.getFullYear() - 16;
      const minYearForSelector = 1940;
      
      return (
        <div className="flex flex-col gap-1 w-full relative z-50">
          <div className="flex items-center gap-1">
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 h-7 justify-start text-left font-normal text-xs px-2 border-0 shadow-none hover:bg-muted/50",
                    !cellValue && "text-muted-foreground"
                  )}
                  disabled={isUpdating || disabled}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {dateValue && !isNaN(dateValue.getTime()) ? (
                    dateValue.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  ) : (
                    <span>Pick DOB</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0 z-[100]" 
                align="center"
                side="bottom"
                sideOffset={5}
              >
                <div className="p-3 space-y-2">
                  {/* Age Requirement Notice */}
                  <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded px-2 py-1.5 mb-2">
                    ℹ️ Required | Minimum age: 16 years 6 months
                  </div>
                  
                  {/* Year and Month Selectors */}
                  <div className="flex gap-2 pb-2 border-b">
                    <select
                      value={dateValue?.getMonth() ?? 0}
                      onChange={(e) => {
                        const year = dateValue?.getFullYear() ?? 2000;
                        const month = parseInt(e.target.value);
                        const day = dateValue?.getDate() ?? 1;
                        
                        // Create new date and validate
                        const newDate = new Date(year, month, day);
                        if (!isNaN(newDate.getTime())) {
                          setCellValue(newDate.toISOString().split('T')[0]);
                        }
                      }}
                      className="flex-1 px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-ring"
                    >
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                        <option key={idx} value={idx}>{month}</option>
                      ))}
                    </select>
                    <select
                      value={dateValue?.getFullYear() ?? 2000}
                      onChange={(e) => {
                        const year = parseInt(e.target.value);
                        const month = dateValue?.getMonth() ?? 0;
                        const day = dateValue?.getDate() ?? 1;
                        
                        // Create new date and validate
                        const newDate = new Date(year, month, day);
                        if (!isNaN(newDate.getTime())) {
                          setCellValue(newDate.toISOString().split('T')[0]);
                        }
                      }}
                      className="flex-1 px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-ring"
                    >
                      {Array.from({ length: maxYearForSelector - minYearForSelector + 1 }, (_, i) => minYearForSelector + i).reverse().map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Calendar */}
                  <Calendar
                    mode="single"
                    selected={dateValue}
                    onSelect={(newDate) => {
                      if (newDate) {
                        const formattedDate = newDate.toISOString().split('T')[0];
                        setCellValue(formattedDate);
                        setDatePickerOpen(false);
                      }
                    }}
                    disabled={(date) => {
                      // Disable future dates
                      if (date > today) return true;
                      
                      // Disable dates that would make age < 16.5 years
                      if (date > minAllowedDate) return true;
                      
                      return false;
                    }}
                    month={dateValue && !isNaN(dateValue.getTime()) ? dateValue : new Date(2000, 0)}
                    onMonthChange={(month) => {
                      if (month && !isNaN(month.getTime())) {
                        setCellValue(month.toISOString().split('T')[0]);
                      }
                    }}
                    className="rounded-md"
                    classNames={{
                      months: "flex flex-col sm:flex-row",
                      month: "space-y-2",
                      caption: "hidden",
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.7rem]",
                      row: "flex w-full mt-1",
                      cell: "h-8 w-8 text-center text-xs p-0 relative",
                      day: "h-8 w-8 p-0 font-normal hover:bg-muted rounded-md",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-30",
                      day_hidden: "invisible",
                    }}
                  />

                  {/* Note: Clear button removed since DOB is required */}
                </div>
              </PopoverContent>
            </Popover>
            {/* Note: Clear button (X) removed since DOB is required field */}
          </div>
          {showActionButtons && (
            <div className="flex gap-2 mt-1">
              <Button
                size="sm"
                onClick={saveCellEdit}
                className="h-6 px-2"
                disabled={isUpdating || disabled}
              >
                {isUpdating ? "..." : "✓"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelCellEdit}
                className="h-6 px-2"
                disabled={isUpdating}
              >
                ✕
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1 w-full">
        {renderInput ? (
          <div className="flex-1 min-w-0">
            {renderInput({ value: cellValue, onChange: setCellValue })}
          </div>
        ) : (
          <Input
            type={
              field === "phone_number" || 
              field === "whatsapp_number" || 
              field === "pin_code"
                ? "tel"
                : "text"
            }
            value={cellValue ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              // Filter out numbers from name fields
              if (field === "first_name" || field === "middle_name" || field === "last_name") {
                setCellValue(value.replace(/[0-9]/g, ""));
              }
              // For phone/pincode fields, only allow digits
              else if (
                field === "phone_number" || 
                field === "whatsapp_number" || 
                field === "pin_code"
              ) {
                // Only allow digits and limit length
                const maxLength = field === "pin_code" ? 6 : 10;
                if (/^\d*$/.test(value) && value.length <= maxLength) {
                  setCellValue(value);
                }
              } else {
                setCellValue(value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveCellEdit();
              if (e.key === "Escape") cancelCellEdit();
            }}
            className="h-7 text-xs flex-1  min-w-0"
            autoFocus
            disabled={isUpdating || disabled}
            maxLength={
              field === "pin_code" 
                ? 6 
                : field === "phone_number" || field === "whatsapp_number"
                ? 10
                : undefined
            }
            inputMode={
              field === "phone_number" || 
              field === "whatsapp_number" || 
              field === "pin_code"
                ? "numeric"
                : "text"
            }
          />
        )}
        {showActionButtons && (
          <div className="flex gap-2 mt-1">
            <Button
              size="sm"
              onClick={saveCellEdit}
              className="h-6 px-2"
              disabled={isUpdating || disabled}
            >
              {isUpdating ? "..." : "✓"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={cancelCellEdit}
              className="h-6 px-2"
              disabled={isUpdating}
            >
              ✕
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-1 rounded min-h-[24px] flex items-center gap-2 group overflow-hidden ${disabled
          ? "cursor-default opacity-70"
          : "cursor-pointer hover:bg-muted/50"
        }`}
      onClick={() => {
        if (!disabled && !isUpdating) {
          startCellEdit(applicant.id, field, value ?? displayValue);
        }
      }}
      title={
        disabled && tooltipMessage
          ? tooltipMessage
          : disabled
            ? "Editing disabled"
            : "Click to edit"
      }
    >
      <span className="flex-1 whitespace-pre-wrap break-words text-sm max-w-full">
        {isUpdating 
          ? "Updating..." 
          : displayValue ? (
              displayValue
            ) : (
              <span className="text-muted-foreground italic">
                Not provided
              </span>
            )
        }
      </span>
      {showPencil && !isUpdating && (
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </div>
  );
}

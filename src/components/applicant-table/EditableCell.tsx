import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateStudent } from "@/utils/api";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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
  showPencil?: boolean;
  options?: Option[];
  showActionButtons?: boolean;
  disabled?: boolean;
  renderInput?: (props: {
    value: any;
    onChange: (val: any) => void;
  }) => JSX.Element;
  tooltipMessage?: string;
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
  showPencil = false,
  options,
  showActionButtons = true,
  disabled,
  renderInput,
  tooltipMessage,
}: EditableCellProps) {
  const [editingCell, setEditingCell] = useState<{
    id: number;
    field: string;
  } | null>(null);
  const [cellValue, setCellValue] = useState<any>(value ?? displayValue ?? "");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCellValue(value ?? displayValue ?? "");
  }, [value, displayValue]);

  const startCellEdit = (id: number, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setCellValue(currentValue ?? value ?? displayValue ?? "");
  };

  const saveCellEdit = async () => {
    if (!applicant?.id) {
      console.error("Applicant ID is missing in EditableCell:", applicant);
      toast({
        title: "Error",
        description: "Cannot update: Student ID is missing",
        variant: "destructive",
      });
      return;
    }

    if (
      (field === "phone_number" || field === "whatsapp_number") &&
      !/^\d{10}$/.test(cellValue)
    ) {
      toast({
        title: "Invalid Mobile Number",
        description: "Mobile number must be exactly 10 digits",
        variant: "destructive",
      });
      return;
    }

    if (
      field === "email" &&
      cellValue &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cellValue)
    ) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!editingCell || isUpdating) return;

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
      toast({ title: "Success", description: "Field updated successfully" });
      setEditingCell(null);
      if (onUpdate) {
        onUpdate(payload[field]); // Pass updated value
      }
    } catch (error: any) {
      console.error("Error updating field:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update field",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
    setCellValue("");
  };

  const handleDirectDropdownChange = async (newValue: string) => {
    if (!applicant?.id) {
      console.error("Applicant ID is missing in EditableCell:", applicant);
      toast({
        title: "Error",
        description: "Cannot update: Student ID is missing",
        variant: "destructive",
      });
      return;
    }

    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const isIdField = String(field).endsWith("_id");
      const payload: any = {};

      if (newValue === "none" || newValue === "") {
        payload[field] = null;
      } else if (isIdField) {
        payload[field] = Number(newValue);
      } else {
        payload[field] = newValue;
      }

      await updateStudent(applicant.id, payload);
      toast({ title: "Success", description: "Field updated successfully" });
      setCellValue(payload[field]);
      if (onUpdate) {
        onUpdate(payload[field]); // Pass updated value
      }
    } catch (error: any) {
      console.error("Error updating field:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update field",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const isEditing =
    editingCell?.id === applicant.id && editingCell?.field === field;
  const normalizedOptions = normalizeOptions(options);
  const isDropdownField = normalizedOptions.length > 0;

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

  if (isDropdownField) {
    const currentValue = getCurrentDropdownValue();
    // Hide "Select" option for offer_letter_status and onboarded_status if value exists
    const shouldHideSelectOption =
      field === "offer_letter_status" &&
      currentValue !== "none" &&
      currentValue !== null &&
      currentValue !== undefined;

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
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          {!shouldHideSelectOption && (
            <SelectItem value="none">
              <span className="text-muted-foreground">Select</span>
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
    return (
      <div className="flex flex-col gap-1 w-full">
        {renderInput ? (
          <div className="flex-1 min-w-0">
            {renderInput({ value: cellValue, onChange: setCellValue })}
          </div>
        ) : (
          <Input
            value={cellValue ?? ""}
            onChange={(e) => setCellValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveCellEdit();
              if (e.key === "Escape") cancelCellEdit();
            }}
            className="h-7 text-xs flex-1  min-w-0"
            autoFocus
            disabled={isUpdating || disabled}
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
      className={`p-1 rounded min-h-[24px] flex items-center gap-2 group ${disabled
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
      <span className="flex-1 whitespace-pre-wrap break-words">
        {isUpdating ? "Updating..." : displayValue || "Click to add"}
      </span>
      {showPencil && !isUpdating && (
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </div>
  );
}

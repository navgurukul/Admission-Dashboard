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
  onUpdate: () => void;
  showPencil?: boolean;
  options?: Option[];
}

function normalizeOptions(options?: Option[]): { id: string; name: string }[] {
  if (!options) return [];
  return options.map((opt) => ({
    id: opt.id !== undefined ? String(opt.id) : String(opt.value ?? ""),
    name: opt.name ?? opt.label ?? String(opt.value ?? ""),
  }));
}

export function EditableCell({
  applicant,
  field,
  displayValue,
  value,
  onUpdate,
  showPencil = false,
  options,
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
    if (!editingCell || isUpdating) return;

    setIsUpdating(true);
    try {
      const isIdField = String(field).endsWith("_id");
      const payload: any = {};

      if (isIdField) {
        payload[field] =
          cellValue === "" || cellValue === "none" ? null : Number(cellValue);
      } else {
        payload[field] = cellValue === "" ? "" : cellValue ?? "";
      }

      await updateStudent(applicant.id, payload);
      toast({ title: "Success", description: "Field updated successfully" });
      setEditingCell(null);
      setCellValue("");
      onUpdate();
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
      onUpdate();
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

  const getCurrentDropdownValue = () => {
    if (value !== null && value !== undefined) {
      return String(value);
    }
    return "none";
  };

  const isEditing =
    editingCell?.id === applicant.id && editingCell?.field === field;
  const normalizedOptions = normalizeOptions(options);
  const isDropdownField = normalizedOptions.length > 0;

  if (isDropdownField) {
    return (
      <Select
        value={getCurrentDropdownValue()}
        onValueChange={handleDirectDropdownChange}
        disabled={isUpdating}
      >
        <SelectTrigger className="h-8 text-xs border-0 shadow-none hover:bg-muted/50 focus:ring-1 focus:ring-ring">
          <SelectValue placeholder="Select option">
            {isUpdating ? "Updating..." : displayValue || "Select option"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">Select</span>
          </SelectItem>
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
      <div className="flex items-center gap-2">
        <Input
          value={cellValue ?? ""}
          onChange={(e) => setCellValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveCellEdit();
            if (e.key === "Escape") cancelCellEdit();
          }}
          className="h-8 text-xs"
          autoFocus
          disabled={isUpdating}
        />
        <Button
          size="sm"
          onClick={saveCellEdit}
          className="h-6 px-2"
          disabled={isUpdating}
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
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[24px] flex items-center gap-2 group"
      onClick={() =>
        !isUpdating && startCellEdit(applicant.id, field, value ?? displayValue)
      }
      title="Click to edit"
    >
      <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
        {isUpdating ? "Updating..." : displayValue || "Click to add"}
      </span>
      {showPencil && !isUpdating && (
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </div>
  );
}

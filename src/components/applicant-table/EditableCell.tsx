import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateStudent } from "@/utils/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  value: string | number;
  label: string;
}

interface EditableCellProps {
  applicant: any;
  field: string;
  displayValue: any;
  onUpdate: () => void;
  showPencil?: boolean;
  options?: Option[];
}

export function EditableCell({
  applicant,
  field,
  displayValue,
  onUpdate,
  showPencil = false,
  options,
}: EditableCellProps) {
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [cellValue, setCellValue] = useState<any>(displayValue || "");
  const { toast } = useToast();

  // Sync cellValue when displayValue changes (unless editing)
  useEffect(() => {
    if (!editingCell) setCellValue(displayValue || "");
  }, [displayValue, editingCell]);

  const startCellEdit = (id: number, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setCellValue(currentValue || "");
  };

  const saveCellEdit = async () => {
    if (!editingCell) return;
    try {
      const payload: any = {};
      payload[field] =
        String(field).endsWith("_id") || !isNaN(Number(cellValue))
          ? cellValue === ""
            ? null
            : Number(cellValue)
          : cellValue;

      await updateStudent(editingCell.id, payload); // API call

      setEditingCell(null);
      setCellValue("");
      onUpdate(); // Refresh after API success
      toast({ title: "Success", description: "Field updated successfully" });
    } catch (error: any) {
      console.error("Error updating field:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update field",
        variant: "destructive",
      });
    }
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
    setCellValue("");
  };

  const isEditing = editingCell?.id === applicant?.id && editingCell?.field === field;

  // Dropdown edit
  if (isEditing && options && options.length > 0) {
    return (
      <div className="flex items-center gap-2">
        <Select value={String(cellValue || "")} onValueChange={setCellValue}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={`Select ${field.replace("_", " ")}`} />
          </SelectTrigger>
          <SelectContent>
            {!cellValue && (
              <SelectItem value="" disabled>
                {`Select ${field.replace("_", " ")}`}
              </SelectItem>
            )}
            {options.map((opt, i) => (
              <SelectItem key={i} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={saveCellEdit} className="h-6 px-2">✓</Button>
        <Button size="sm" variant="outline" onClick={cancelCellEdit} className="h-6 px-2">✕</Button>
      </div>
    );
  }

  // Text input edit
  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={cellValue}
          onChange={(e) => setCellValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveCellEdit();
            if (e.key === "Escape") cancelCellEdit();
          }}
          className="h-8 text-xs"
          autoFocus
        />
        <Button size="sm" onClick={saveCellEdit} className="h-6 px-2">✓</Button>
        <Button size="sm" variant="outline" onClick={cancelCellEdit} className="h-6 px-2">✕</Button>
      </div>
    );
  }

  // Default display
  return (
    <div
      className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[24px] flex items-center gap-2 group"
      onClick={() => startCellEdit(applicant?.id || 0, field, displayValue)}
      title="Click to edit"
    >
      <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
        {displayValue || "Click to add"}
      </span>
      {showPencil && (
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </div>
  );
}

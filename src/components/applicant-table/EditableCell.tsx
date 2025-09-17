import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateUser, updateSchool, updateCampusApi, updateCast } from "@/utils/api";

interface EditableCellProps {
  applicant: any;
  field: string;
  displayValue: any;
  onUpdate: () => void;
  showPencil?: boolean;
}

export function EditableCell({
  applicant,
  field,
  displayValue,
  onUpdate,
  showPencil = false,
}: EditableCellProps) {
  const [editingCell, setEditingCell] = useState<{ id:number; field: string } | null>(null);
  const [cellValue, setCellValue] = useState<any>(displayValue || "");
  const { toast } = useToast();

  const startCellEdit = (id:number, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setCellValue(currentValue || "");
  };

  const saveCellEdit = async () => {
    if (!editingCell) return;
    try {
      switch (field) {
        case "school_name":
        case "school_id":
          await updateSchool(editingCell.id, { [field]: cellValue });
          break;
        case "campus_name":
        case "campus_id":
          await updateCampusApi(editingCell.id, { [field]: cellValue });
          break;
        case "caste":
          await updateCast(editingCell.id, { [field]: cellValue });
          break;
        default:
          await updateUser(editingCell.id, { [field]: cellValue });
      }

      toast({
        title: "Success",
        description: "Field updated successfully",
      });

      setEditingCell(null);
      setCellValue("");
      onUpdate(); // Refresh parent table
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

  const isEditing = editingCell?.id === applicant.id && editingCell?.field === field;

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

  return (
    <div
      className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[24px] flex items-center gap-2 group"
      onClick={() => startCellEdit(applicant.id, field, displayValue)}
      title="Click to edit"
    >
      <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{displayValue || "Click to add"}</span>
      {showPencil && (
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </div>
  );
}

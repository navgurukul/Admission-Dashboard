import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Save, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { getCurrentUser } from "@/utils/api";

interface RowField {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "component" | "readonly";
  options?: { value: string; label: string }[];
  component?: React.ComponentType<any>;
  disabled?: boolean;
}

interface InlineSubformProps {
  title: string;
  initialData: any[];
  fields: RowField[];
  studentId?: number | string;
  submitApi: (payload: any) => Promise<any>;
  updateApi: (id: number | string, payload: any) => Promise<any>;
  deleteApi?: (id: number | string) => Promise<any>;
  onSave?: () => void;
  disabled?: boolean;
  disabledReason?: string;
  disableAdd?: boolean;
  customActions?: React.ReactNode; // Custom action buttons to display alongside Add Row
  canDelete?: boolean; // Permission to delete entries (admin only)
  disableDelete?: boolean; // Disable delete when student has moved to next round
}

// Map payload based on round type
function mapPayload(row: any, fields: RowField[], studentId?: number | string) {
  const isScreening = fields.some((f) =>
    [
      "question_set_id",
      "obtained_marks",
      // "is_passed",
      // "school_id",
      "exam_centre",
      "date_of_test",
    ].includes(f.name),
  );

  if (isScreening) {
    const statusVal = row.status ?? row.status_name ?? undefined;

    const payload = {
      question_set_id: row.question_set_id || null,
      obtained_marks: row.obtained_marks === "" ? null : row.obtained_marks,
      school_id: row.school_id || null,
      exam_centre: row.exam_centre || null,
      date_of_test: row.date_of_test || null,
      status: statusVal,
    };
    return row.id ? payload : { student_id: studentId, ...payload };
  }

  if ("learning_round_status" in row) {
    return row.id
      ? {
        learning_round_status: row.learning_round_status,
        school_id: row.school_id || null,
        comments: row.comments,
      }
      : {
        student_id: studentId,
        learning_round_status: row.learning_round_status,
        school_id: row.school_id || null,
        comments: row.comments,
      };
  } else if ("cultural_fit_status" in row) {
    return row.id
      ? {
        cultural_fit_status: row.cultural_fit_status,
        comments: row.comments,
      }
      : {
        student_id: studentId,
        cultural_fit_status: row.cultural_fit_status,
        comments: row.comments,
      };
  }

  return { ...row, student_id: studentId };
}

// Helper to choose which fields are editable
const getEditableFields = (row: any, allFields: RowField[]) => {
  if (!row.id) return allFields; // new row: all editable

  // Check if this is a screening round - use unique screening fields only
  const isScreeningRound = allFields.some((f) =>
    ["question_set_id", "obtained_marks", "exam_centre", "date_of_test"].includes(f.name)
  );

  // Check if this is a learning round
  const isLearningRound = allFields.some((f) => f.name === "learning_round_status");

  // For existing rows, check if status field is disabled (round is passed)
  const statusField = allFields.find((f) =>
    ["status", "learning_round_status", "cultural_fit_status"].includes(f.name)
  );
  
  // If status field is disabled (round passed), only allow specific fields
  if (statusField?.disabled) {
    if (isScreeningRound) {
      return allFields.filter((f) => f.name === "school_id");
    }
    if (isLearningRound) {
      return allFields.filter((f) => f.name === "comments" || f.name === "school_id");
    }
    return allFields.filter((f) => f.name === "comments");
  }

  // For screening round in edit mode (not passed), allow all screening fields
  if (isScreeningRound) {
    return allFields.filter((f) => 
      ["status", "question_set_id", "obtained_marks", "school_id", "exam_centre", "date_of_test"].includes(f.name) ||
      f.type === "readonly"
    );
  }

  // For learning/cultural rounds in edit mode (not passed), allow status, school_id, and comments
  return allFields.filter((f) => {
    if (["learning_round_status", "school_id", "comments"].includes(f.name)) return true;
    if (["cultural_fit_status", "comments"].includes(f.name)) return true;
    if (f.type === "readonly") return true;
    return false;
  });
};

// Always-mounted editable cell component
const EditableCell = ({ row, field, isEditable, updateRow }: any) => {
  const isDisabled = !isEditable || field.disabled;

  if (field.type === "select") {
    return (
      <Select
        value={row[field.name] || "CLEAR_SELECTION"}
        onValueChange={(val) => {
          // Convert CLEAR_SELECTION back to empty string
          const actualValue = val === "CLEAR_SELECTION" ? "" : val;
          updateRow(field.name, actualValue);
        }}
        disabled={isDisabled}
      >
        <SelectTrigger
          className={`w-full min-w-full text-sm whitespace-normal h-auto ${isDisabled ? "cursor-not-allowed opacity-50 pointer-events-none" : ""}`}
        >
          <SelectValue placeholder={`Select ${field.label}`} />
        </SelectTrigger>
        <SelectContent className="max-w-full w-full">
          {/* Add clear selection option with a valid non-empty value */}
          <SelectItem value="CLEAR_SELECTION">
            <span className="text-gray-400">Selection</span>
          </SelectItem>
          {field.options?.filter(opt => opt.value !== "").map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else if (field.type === "component" && field.component) {
    return (
      <field.component
        row={row}
        updateRow={(fName: string, val: any) => updateRow(fName, val)}
        disabled={isDisabled}
        className={isDisabled ? "cursor-not-allowed opacity-50 pointer-events-none" : ""}
      />
    );
  } else {
    // Use textarea for comments and note fields
    if (field.name === "comments" || field.name === "note" || field.name === "notes") {
      return (
        <textarea
          value={row[field.name] || ""}
          onChange={(e) => updateRow(field.name, e.target.value)}
          disabled={isDisabled}
          className={`border rounded px-2 py-1 w-full min-w-full min-h-[80px] resize-y ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
          placeholder={`Enter ${field.label || field.name}...`}
        />
      );
    }
    
    // Use number input for number fields
    if (field.type === "number") {
      return (
        <Input
          type="number"
          value={row[field.name] || ""}
          onChange={(e) => {
            const value = e.target.value;
            // Only update if it's a valid non-negative number or empty string
            if (value === "") {
              updateRow(field.name, value);
            } else if (!isNaN(Number(value)) && Number(value) >= 0) {
              updateRow(field.name, value);
            }
            // Reject negative numbers silently
          }}
          onKeyDown={(e) => {
            // Prevent typing minus sign or 'e' (scientific notation)
            if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
              e.preventDefault();
            }
          }}
          disabled={isDisabled}
          className={`w-full min-w-full ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
          placeholder="0"
          min="0"
        />
      );
    }
    
    return (
      <Input
        value={row[field.name]}
        onChange={(e) => updateRow(field.name, e.target.value)}
        disabled={isDisabled}
        className={`w-full min-w-full ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
      />
    );
  }
};

export function InlineSubform({
  title,
  initialData,
  fields,
  studentId,
  submitApi,
  updateApi,
  deleteApi,
  onSave,
  disabled,
  disabledReason,
  disableAdd,
  customActions,
  canDelete = false, // Default to false (no delete permission)
  disableDelete = false, // Default to false (deletion not disabled by round progression)
}: InlineSubformProps) {
  const [rows, setRows] = useState(initialData.map((r) => ({ ...r })));
  const [originalRows, setOriginalRows] = useState(initialData.map((r) => ({ ...r })));
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);
  const [savingRows, setSavingRows] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    // Only update if the initialData actually changed
    const currentIds = rows
      .map((r) => r.id)
      .filter(Boolean)
      .sort();
    const newIds = initialData
      .map((r) => r.id)
      .filter(Boolean)
      .sort();

    // Check if IDs are different
    const idsChanged = JSON.stringify(currentIds) !== JSON.stringify(newIds);

    // Check if audit info has changed for existing rows
    const auditInfoChanged = initialData.some((newRow) => {
      const existingRow = rows.find((r) => r.id === newRow.id);
      if (!existingRow) return false;
      
      // Compare audit_info fields
      const newAudit = newRow.audit_info || {};
      const existingAudit = existingRow.audit_info || {};
      
      return (
        newAudit.updated_at !== existingAudit.updated_at ||
        newAudit.last_updated_by !== existingAudit.last_updated_by
      );
    });

    // Check if schedule_info has changed (from "—" to array or vice versa)
    const scheduleInfoChanged = initialData.some((newRow) => {
      const existingRow = rows.find((r) => r.id === newRow.id);
      if (!existingRow) return false;
      
      const newSchedule = newRow.schedule_info;
      const existingSchedule = existingRow.schedule_info;
      
      // Check if one is "—" and the other is an array, or array lengths differ
      const newIsArray = Array.isArray(newSchedule);
      const existingIsArray = Array.isArray(existingSchedule);
      
      if (newIsArray !== existingIsArray) return true;
      if (newIsArray && existingIsArray && newSchedule.length !== existingSchedule.length) return true;
      
      return false;
    });

    if (idsChanged || rows.length === 0 || auditInfoChanged || scheduleInfoChanged) {
      const mappedData = initialData.map((r) => ({ ...r }));
      setRows(mappedData);
      setOriginalRows(mappedData);
    }
  }, [initialData]);

  const editableFieldsMap = useMemo(() => {
    return rows.map(
      (row) => new Set(getEditableFields(row, fields).map((f) => f.name)),
    );
  }, [rows, fields]);

  const updateRow = (index: number, field: string, value: any) => {
    setRows((prev) => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value };
      return newRows;
    });
  };

  const addRow = () => {
    const newRow: any = {};
    fields.forEach((f) => (newRow[f.name] = ""));
    setRows((prev) => [...prev, { ...newRow, isEditing: true }]);
  };

  const toggleEdit = (index: number, edit: boolean) => {
    setRows((prev) => {
      const newRows = [...prev];
      newRows[index].isEditing = edit;
      return newRows;
    });
  };

  // Check if row has actual changes compared to original
  const hasChanges = (index: number) => {
    const currentRow = rows[index];
    const originalRow = originalRows[index];
    
    if (!currentRow.id) return true;
    if (!originalRow) return true;
    // Get editable fields for this row
    const editableFields = getEditableFields(currentRow, fields);
    
    // Check if any editable field has changed
    for (const field of editableFields) {
      const currentValue = currentRow[field.name];
      const originalValue = originalRow[field.name];
      
      //  undefined, and empty string as equivalent
      const normalizedCurrent = currentValue == null || currentValue === "" ? null : currentValue;
      const normalizedOriginal = originalValue == null || originalValue === "" ? null : originalValue;
      
      if (normalizedCurrent !== normalizedOriginal) {
        return true;
      }
    }
    
    return false;
  };

  const saveRow = async (index: number) => {
    // Prevent double-clicking
    if (savingRows.has(index)) {
      return;
    }

    const row = rows[index];
    const editableFields = getEditableFields(row, fields);

    // Check if there are actual changes (only for existing rows)
    if (row.id && !hasChanges(index)) {
      toggleEdit(index, false);
      return;
    }

    // Mark row as saving
    setSavingRows(prev => new Set(prev).add(index));

    if (!row.id) {
      // Conditional validation based on status
      const status = row.status;

      // Check if this is a screening round (has screening-specific fields)
      const isScreeningRound = fields.some((f) =>
        ["question_set_id", "obtained_marks", "is_passed", "school_id", "exam_centre", "date_of_test"].includes(f.name)
      );

      for (const field of editableFields) {
        const fieldValue = row[field.name];
        const isEmpty = !fieldValue || fieldValue.toString().trim() === "";

        // Skip validation for status and school_id in Screening Round - they are not mandatory
        if (isScreeningRound && (field.name === "status" || field.name === "school_id")) {
          continue;
        }

        // Skip validation for specific fields based on status
        if (field.name === "school_id") {
          // If status is "Screening Test Fail", school_id is NOT mandatory
          if (status === "Screening Test Fail") {
            continue; // Skip validation for this field
          }
        }

        // Skip validation for audit_info field - it's always readonly and not mandatory
        if (field.name === "audit_info") {
          continue;
        }

        // If status is "Created Student Without Exam", ALL fields are non-mandatory
        if (status === "Created Student Without Exam") {
          continue; // Skip validation for all fields
        }

        // Validate obtained_marks should not exceed 36 for screening round
        if (isScreeningRound && field.name === "obtained_marks") {
          const obtainedMarks = Number(row.obtained_marks);
          if (obtainedMarks > 36) {
            toast({
              title: "⚠️ Validation Error",
              description: "Obtained marks cannot exceed 36",
              variant: "destructive",
              className: "border-orange-500 bg-orange-50 text-orange-900",
            });
            return;
          }
          if (obtainedMarks < 0) {
            toast({
              title: "⚠️ Validation Error",
              description: "Obtained marks cannot be negative",
              variant: "destructive",
              className: "border-orange-500 bg-orange-50 text-orange-900",
            });
            return;
          }
        }

        // For all other cases, validate required fields
        if (isEmpty) {
          toast({
            title: "⚠️ Validation Error",
            description: `Please fill the field: ${field.label}`,
            variant: "destructive",
            className: "border-orange-500 bg-orange-50 text-orange-900",
          });
          return;
        }
      }
    }

    const currentUser = getCurrentUser();
    const payload = {
      ...mapPayload(row, fields, studentId),
      updated_by: currentUser?.name || currentUser?.email || "Unknown",
      last_updated_by: currentUser?.name || currentUser?.email || "Unknown"
    };

    try {
      let res;
      if (row.id) {
        const response = await updateApi(row.id, payload);
        res =
          typeof response.json === "function"
            ? await response.json()
            : response;

        // Check if the response indicates an error
        if (res.success === false) {
          throw new Error(res.message || "Failed to update entry");
        }

        toast({
          title: "✅ Updated Successfully",
          description: "Row updated successfully.",
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
      } else {
        const response = await submitApi(payload);
        res =
          typeof response.json === "function"
            ? await response.json()
            : response;
        
        // Check if the response indicates an error
        if (res.success === false) {
          throw new Error(res.message || "Failed to create entry");
        }
        
        toast({
          title: "✅ Created Successfully",
          description: "Row created successfully.",
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
      }

      // Update the row with response data first
      const updatedRow = { ...row, ...res, isEditing: false };
      setRows((prev) => {
        const newRows = [...prev];
        newRows[index] = updatedRow;
        return newRows;
      });
      
      // Update originalRows to reflect the saved state
      setOriginalRows((prev) => {
        const newRows = [...prev];
        newRows[index] = { ...updatedRow };
        return newRows;
      });

      // Call onSave callback after state is updated
      // This allows parent to refresh with the new data
      if (onSave) {
        // Use setTimeout to ensure state update completes first
        setTimeout(() => {
          onSave();
        }, 0);
      }
    } catch (err) {
      console.error("Save failed", err);
      
      // Custom error message for question set issues
      let errorMessage = getFriendlyErrorMessage(err);
      if (err instanceof Error && err.message.includes("Question set") && err.message.includes("does not exist")) {
        errorMessage = "The selected question set is not available or has been deleted. Please select another question set.";
      }
      
      toast({
        title: "❌ Unable to Save",
        description: errorMessage,
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      // Remove row from saving state
      setSavingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const deleteRow = async (idx: number) => {
    const row = rows[idx];
    
    // Only allow deletion if row has an ID (exists in database) and deleteApi is provided
    if (!row.id || !deleteApi) return;

    // Open confirmation dialog
    setRowToDelete(idx);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (rowToDelete === null) return;
    
    const row = rows[rowToDelete];
    if (!row.id || !deleteApi) return;

    try {
      await deleteApi(row.id);
      
      toast({
        title: "✅ Entry Deleted",
        description: "The entry has been successfully deleted.",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });

      // Close dialog and reset state
      setDeleteConfirmOpen(false);
      setRowToDelete(null);

      // Refresh data by calling onSave callback
      onSave?.();
    } catch (err) {
      console.error("Delete failed", err);
      toast({
        title: "❌ Unable to Delete",
        description: getFriendlyErrorMessage(err),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
      
      // Close dialog even on error
      setDeleteConfirmOpen(false);
      setRowToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };

  const getDisplayValue = (row: any, field: RowField) => {
    // Handle audit_info field specially
    if (field.name === "audit_info") {
      const auditData = row[field.name];
      if (!auditData || typeof auditData !== 'object') return "—";

      const formatTimestamp = (timestamp: string) => {
        if (!timestamp) return "—";
        try {
          const date = new Date(timestamp);
          return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        } catch {
          return timestamp;
        }
      };

      const created = formatTimestamp(auditData.created_at);
      const updated = formatTimestamp(auditData.updated_at);
      const updatedBy = auditData.last_updated_by || "—";

      return (
        <div className="text-xs leading-tight">
          <div className="mb-0.5"><span className="font-semibold">Created:</span> {created}</div>
          <div className="mb-0.5"><span className="font-semibold">Updated:</span> {updated}</div>
          <div><span className="font-semibold">By:</span> {updatedBy}</div>
        </div>
      );
    }

    // Format timestamp fields
    if (field.name === "created_at" || field.name === "updated_at") {
      if (!row[field.name]) return "—";
      try {
        const date = new Date(row[field.name]);
        return date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      } catch {
        return row[field.name];
      }
    }

    // Display last_updated_by as is
    if (field.name === "last_updated_by") {
      return row[field.name] || "—";
    }

    if (field.options) {
      const match = field.options.find((o) => o.value === row[field.name]);
      return match ? match.label : row[field.name] || "—";
    }
    return row[field.name] || "—";
  };

  return (
    <div className="space-y-3 border rounded-lg p-4 max-h-[60vh] overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          {/* Custom action buttons (e.g., Schedule Interview) */}
          {customActions}
          
          {/* Add Row button */}
          {disabled || disableAdd ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addRow}
                      disabled={true}
                      className="opacity-50 cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Row
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {disableAdd 
                      ? "Cannot add more rows - round already passed" 
                      : disabledReason || "Action disabled"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button size="sm" variant="outline" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" /> Add Row
            </Button>
          )}
        </div>
      </div>

      {/* Table container: allow vertical and horizontal scrolling if content is large */}
      <div className="overflow-x-auto w-full max-h-[48vh] overflow-auto">
        <table className="w-full min-w-full border-collapse text-sm table-auto">
          <thead>
            <tr className="bg-gray-100 text-left font-medium text-gray-700">
              {fields.filter((f) => f.name !== "schedule_info").map((f) => (
                <th key={f.name} className="px-3 py-2 border-b whitespace-nowrap">
                  {f.label}
                </th>
              ))}
              <th className="px-3 py-2 border-b text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.filter(row => row.id || row.isEditing).map((row) => {
              const idx = rows.indexOf(row);
              return (
              <tr key={idx} className="border-b hover:bg-gray-50">
                {fields.filter((f) => f.name !== "schedule_info").map((f) => {
                  // Audit fields should always be readonly
                  const isAuditField = ["created_at", "updated_at", "last_updated_by", "audit_info"].includes(f.name);
                  const isStatusField = f.name === "status" || f.name.includes("status");
                  const isTextAreaField = f.name === "comments" || f.name === "note" || f.name === "notes";
                  const isEditable =
                    row.isEditing && editableFieldsMap[idx].has(f.name) && !isAuditField;
                  return (
                    <td
                      key={f.name}
                      className={`px-3 py-2 align-top ${isTextAreaField
                        ? "whitespace-pre-wrap break-words w-full min-w-[250px] max-w-[400px]"
                        : f.name === "audit_info"
                          ? "w-auto min-w-[280px] max-w-[320px]"
                          : isAuditField
                            ? "w-auto min-w-[200px]"
                            : isStatusField
                              ? "w-auto min-w-[250px] max-w-[300px]"
                              : "w-auto"
                        }`}
                    >
                      {!isEditable && f.type === "component" && f.component ? (
                        // Render component field directly (no wrapper)
                        <f.component row={row} />
                      ) : !isEditable && (f.type === "readonly" || isAuditField) ? (
                        <div className={`p-2 rounded w-full break-words ${isAuditField ? "bg-gray-50" : "bg-gray-100"}`}>
                          {getDisplayValue(row, f)}
                        </div>
                      ) : !isEditable && (f.name === "comments" || f.name === "note" || f.name === "notes") ? (
                        <div className="p-2 rounded bg-gray-50 whitespace-pre-wrap break-words max-w-[400px]">
                          {row[f.name] || "—"}
                        </div>
                      ) : !isEditable ? (
                        <div className="p-2 rounded bg-gray-50 w-full break-words">
                          {getDisplayValue(row, f)}
                        </div>
                      ) : (
                        <EditableCell
                          row={row}
                          field={f}
                          isEditable={isEditable}
                          updateRow={(fieldName, value) =>
                            updateRow(idx, fieldName, value)
                          }
                        />
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    {!row.isEditing ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={`text-blue-600 hover:bg-blue-50 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={() => toggleEdit(idx, true)}
                          disabled={disabled}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {/* Delete button - only show if row has ID, deleteApi is provided, and user has delete permission (admin) */}
                        {row.id && deleteApi && canDelete && (
                          disableDelete ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="text-red-600 hover:bg-red-50 opacity-50 cursor-not-allowed"
                                      disabled={true}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Cannot delete - Student has progressed to next round</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => deleteRow(idx)}
                              disabled={disabled}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )
                        )}
                      </>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className={`text-green-600 hover:bg-green-50 ${row.id && !hasChanges(idx) ? "opacity-50" : ""} ${savingRows.has(idx) ? "opacity-50" : ""}`}
                              onClick={() => saveRow(idx)}
                              disabled={savingRows.has(idx)}
                            >
                              {savingRows.has(idx) ? (
                                <div className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          {row.id && !hasChanges(idx) && (
                            <TooltipContent>
                              <p>No changes to save</p>
                            </TooltipContent>
                          )}
                          {savingRows.has(idx) && (
                            <TooltipContent>
                              <p>Saving...</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDelete}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

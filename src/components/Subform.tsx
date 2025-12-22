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
import { Plus, Pencil, Save } from "lucide-react";
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
  onSave?: () => void;
  disabled?: boolean;
  disabledReason?: string;
  disableAdd?: boolean;
}

// Map payload based on round type
function mapPayload(row: any, fields: RowField[], studentId?: number | string) {
  const isScreening = fields.some((f) =>
    [
      "question_set_id",
      "obtained_marks",
      "is_passed",
      "school_id",
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
        comments: row.comments,
      }
      : {
        student_id: studentId,
        learning_round_status: row.learning_round_status,
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

  // For existing rows, check if status field is disabled (round is passed)
  const statusField = allFields.find((f) => 
    ["status", "learning_round_status", "cultural_fit_status"].includes(f.name)
  );
  
  // If status field is disabled (round passed), only allow comments to be edited
  if (statusField?.disabled) {
    return allFields.filter((f) => f.name === "comments");
  }

  // Otherwise, allow editing of status, school_id, and comments
  return allFields.filter((f) => {
    if (["status", "school_id"].includes(f.name)) return true;
    if (["learning_round_status", "comments"].includes(f.name)) return true;
    if (["cultural_fit_status", "comments"].includes(f.name)) return true;
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
  onSave,
  disabled,
  disabledReason,
  disableAdd,
}: InlineSubformProps) {
  const [rows, setRows] = useState(initialData.map((r) => ({ ...r })));
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

    if (idsChanged || rows.length === 0 || auditInfoChanged) {
      setRows(initialData.map((r) => ({ ...r })));
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

  const saveRow = async (index: number) => {
    const row = rows[index];
    const editableFields = getEditableFields(row, fields);

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
      toast({
        title: "❌ Unable to Save",
        description: getFriendlyErrorMessage(err),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
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

      {/* Table container: allow vertical and horizontal scrolling if content is large */}
      <div className="overflow-x-auto w-full max-h-[48vh] overflow-auto">
        <table className="w-full min-w-full border-collapse text-sm table-auto">
          <thead>
            <tr className="bg-gray-100 text-left font-medium text-gray-700">
              {fields.map((f) => (
                <th key={f.name} className="px-3 py-2 border-b whitespace-nowrap">
                  {f.label}
                </th>
              ))}
              <th className="px-3 py-2 border-b text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                {fields.map((f) => {
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
                      {!isEditable && (f.type === "readonly" || isAuditField) ? (
                        <div className={`p-2 rounded w-full break-words ${isAuditField ? "bg-gray-50" : "bg-gray-100"}`}>
                          {getDisplayValue(row, f)}
                        </div>
                      ) : !isEditable && (f.name === "comments" || f.name === "note" || f.name === "notes") ? (
                        <div className="p-2 rounded bg-gray-50 whitespace-pre-wrap break-words max-w-[400px]">
                          {row[f.name] || "—"}
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
                  {!row.isEditing ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`text-blue-600 hover:bg-blue-50 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => toggleEdit(idx, true)}
                      disabled={disabled}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-green-600 hover:bg-green-50"
                      onClick={() => saveRow(idx)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

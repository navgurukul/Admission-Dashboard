import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Pencil, Save } from "lucide-react";

interface RowField {
  name: string;
  label: string;
  type: "text" | "select" | "component" | "readonly";
  options?: { value: string; label: string }[];
  component?: React.ComponentType<any>;
}

interface InlineSubformProps {
  title: string;
  initialData: any[];
  fields: RowField[];
  studentId?: number | string;
  submitApi: (payload: any) => Promise<any>;
  updateApi: (id: number | string, payload: any) => Promise<any>;
  onSave?: () => void;
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
    ].includes(f.name)
  );

  if (isScreening) {
    // read stage/status from either possible keys used across the app
    const stageVal = row.stage_name ?? row.stage_name ?? undefined;
    const statusVal = row.status ?? row.status_name ?? undefined;

    const payload = {
      question_set_id: row.question_set_id || null,
      obtained_marks: row.obtained_marks === "" ? null : row.obtained_marks,
      is_passed:
        row.is_passed === "1" || row.is_passed === 1 || row.is_passed === true
          ? true
          : false,
      school_id: row.school_id || null,
      exam_centre: row.exam_centre || null,
      date_of_test: row.date_of_test || null,
      // include canonical names expected by API
      stage_name: stageVal,
      status: statusVal,
    };
    return row.id ? payload : { student_id: studentId, ...payload };
    console.log("payload",payload)
  }

  if ("learning_round_status" in row) {
    return row.id
      ? {
          learning_round_status: row.learning_round_status,
          comments: row.comments,
          booking_status: "completed",
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
          booking_status: "completed",
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
  if (!row.id) {
    return allFields; // new row: all editable
  }

  // Determine editable fields based on what fields exist in the row
  const fieldNames = Object.keys(row);

  return allFields.filter((f) => {
    if (
      f.name === "stage_name" ||
      f.name === "status" ||
      f.name === "school_id"
    ) {
      return true; // screening-related
    }
    if (f.name === "learning_round_status" || f.name === "comments") {
      return true; // learning round
    }
    if (f.name === "cultural_fit_status" || f.name === "comments") {
      return true; // cultural fit
    }
    return false;
  });
};

export function InlineSubform({
  title,
  initialData,
  fields,
  studentId,
  submitApi,
  updateApi,
  onSave,
}: InlineSubformProps) {
  const [rows, setRows] = useState(initialData.map((r) => ({ ...r })));

  useEffect(() => {
    setRows(initialData.map((r) => ({ ...r })));
  }, [initialData]);

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

    if (!row.id) {
      // Validate fields
      const editableFields = getEditableFields(row, fields);
      // Validate only the fields that are editable for this row (new rows => all fields)
      for (let field of editableFields) {
        if (!row[field.name] || row[field.name].toString().trim() === "") {
          toast({
            title: "Validation Error",
            description: `Please fill the field: ${field.label}`,
            variant: "destructive", // red style
          });
          return;
        }
      }
    }

    const payload = mapPayload(row, fields, studentId);

    try {
      let res;
      if (row.id) {
        const response = await updateApi(row.id, payload);
        res =
          typeof response.json === "function"
            ? await response.json()
            : response;

        toast({
          title: "Updated Successfully",
          description: "Row updated successfully.",
          variant: "default",
        });
      } else {
        const response = await submitApi(payload);
        res =
          typeof response.json === "function"
            ? await response.json()
            : response;
        toast({
          title: "Created Successfully",
          description: "Row created successfully.",
          variant: "default",
        });
      }

      setRows((prev) => {
        const newRows = [...prev];
        newRows[index] = { ...row, ...res, isEditing: false };
        return newRows;
      });

      onSave?.();
    } catch (err) {
      console.error("Save failed", err);
      toast({
        title: "Save Failed",
        description: "Something went wrong while saving.",
        variant: "destructive",
      });
    }
  };

  const getDisplayValue = (row: any, field: RowField) => {
    if (field.options) {
      const match = field.options.find((o) => o.value === row[field.name]);
      return match ? match.label : row[field.name] || "—";
    }
    return row[field.name] || "—";
  };

  return (
    <div className="space-y-3 border rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold">{title}</h3>
        <Button size="sm" variant="outline" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" /> Add Row
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 text-left font-medium text-gray-700">
              {fields.map((f) => (
                <th key={f.name} className="px-3 py-2 border-b">
                  {f.label}
                </th>
              ))}
              <th className="px-3 py-2 border-b text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const editableFields = getEditableFields(row, fields);
              return (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  {fields.map((f) => (
                    <td
                      key={f.name}
                      className={`px-3 py-2 align-top ${
                        f.name === "comments"
                          ? "whitespace-pre-wrap break-words min-w-[150px] max-w-[250px]"
                          : ""
                      }`}
                    >
                      {/* Show display value when not editing OR (existing row AND readonly) OR field not in editableFields */}
                      {!row.isEditing ||
                      (row.id && f.type === "readonly") ||
                      !editableFields.includes(f) ? (
                        <p
                          className={`p-1 ${
                            f.type === "readonly" ? "bg-gray-100 rounded" : ""
                          }`}
                        >
                          {getDisplayValue(row, f)}
                        </p>
                      ) : f.type === "select" ? (
                        <Select
                          value={row[f.name]}
                          onValueChange={(val) => updateRow(idx, f.name, val)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={`Select ${f.label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {f.options?.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : f.type === "component" && f.component ? (
                        // compute disabled for this component: disabled when field is not editable for this row
                        <f.component
                          row={row}
                          updateRow={(field: string, val: any) =>
                            updateRow(idx, field, val)
                          }
                          disabled={!editableFields.includes(f)}
                        />
                      ) : (
                        <Input
                          value={row[f.name]}
                          onChange={(e) =>
                            updateRow(idx, f.name, e.target.value)
                          }
                        />
                      )}
                    </td>
                  ))}

                  <td className="px-3 py-2 text-right">
                    {!row.isEditing ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => toggleEdit(idx, true)}
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

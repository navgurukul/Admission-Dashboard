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

  return allFields.filter((f) => {
    if (["status", "school_id"].includes(f.name)) return true;
    if (["learning_round_status", "comments"].includes(f.name)) return true;
    if (["cultural_fit_status", "comments"].includes(f.name)) return true;
    return false;
  });
};

// Always-mounted editable cell component
const EditableCell = ({ row, field, isEditable, updateRow }: any) => {
  if (field.type === "select") {
    return (
      <Select value={row[field.name]} onValueChange={(val) => updateRow(field.name, val)} disabled={!isEditable}>
        <SelectTrigger
          className={`w-full ${!isEditable ? "cursor-text pointer-events-none" : ""}`}
        >
          <SelectValue placeholder={`Select ${field.label}`} />
        </SelectTrigger>
        <SelectContent>
          {field.options?.map((opt) => (
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
        disabled={!isEditable}
        className={!isEditable ? "cursor-text pointer-events-none" : ""}
      />
    );
  } else {
    return (
      <Input
        value={row[field.name]}
        onChange={(e) => updateRow(field.name, e.target.value)}
        disabled={!isEditable}
        className={!isEditable ? "cursor-text" : ""}
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
}: InlineSubformProps) {
  const [rows, setRows] = useState(initialData.map((r) => ({ ...r })));
  const { toast } = useToast();

  useEffect(() => {
    setRows(initialData.map((r) => ({ ...r })));
  }, [initialData]);

  const editableFieldsMap = useMemo(() => {
    return rows.map((row) => new Set(getEditableFields(row, fields).map(f => f.name)));
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
      for (let field of editableFields) {
        if (!row[field.name] || row[field.name].toString().trim() === "") {
          toast({
            title: "Validation Error",
            description: `Please fill the field: ${field.label}`,
            variant: "destructive",
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
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                {fields.map((f) => {
                  const isEditable = row.isEditing && editableFieldsMap[idx].has(f.name);
                  return (
                    <td
                      key={f.name}
                      className={`px-3 py-2 align-top ${
                        f.name === "comments"
                          ? "whitespace-pre-wrap break-words min-w-[150px] max-w-[250px]"
                          : ""
                      }`}
                    >
                      {!isEditable && f.type === "readonly" ? (
                        <p className="p-1 bg-gray-100 rounded">{getDisplayValue(row, f)}</p>
                      ) : (
                        <EditableCell
                          row={row}
                          field={f}
                          isEditable={isEditable}
                          updateRow={(fieldName, value) => updateRow(idx, fieldName, value)}
                        />
                      )}
                    </td>
                  );
                })}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

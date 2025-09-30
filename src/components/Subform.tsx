import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  type: "text" | "select";
  options?: { value: string; label: string }[];
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

function mapPayload(
  row: any,
  fields: RowField[],
  studentId: number | string | undefined
) {
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

  const updateRow = (index: number, field: string, value: any) => {
    setRows((prev) => {
      const newRows = [...prev];
      newRows[index][field] = value;
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
    const payload = mapPayload(row, fields, studentId);

    try {
      let res;
      if (row.id) {
        const response = await updateApi(row.id, payload);
        res =
          typeof response.json === "function"
            ? await response.json()
            : response;
      } else {
        const response = await submitApi(payload);
        res =
          typeof response.json === "function"
            ? await response.json()
            : response;
      }

      setRows((prev) => {
        const newRows = [...prev];
        newRows[index] = { ...row, ...res, isEditing: false };
        return newRows;
      });

      onSave?.();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  return (
    <div className="space-y-3 border rounded-lg p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold">{title}</h3>
        <Button size="sm" variant="outline" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" /> Add Row
        </Button>
      </div>

      {/* Table View */}
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
                {fields.map((f) => (
                  <td
                    key={f.name}
                    className={`px-3 py-2 align-top ${
                      f.name === "comments"
                        ? "whitespace-pre-wrap break-words min-w-[150px] max-w-[250px]"
                        : ""
                    }`}
                  >
                    {!row.isEditing ? (
                      f.type === "select" ? (
                        f.options?.find((o) => o.value === row[f.name])
                          ?.label || "—"
                      ) : (
                        row[f.name] || "—"
                      )
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
                    ) : (
                      <Input
                        value={row[f.name]}
                        onChange={(e) => updateRow(idx, f.name, e.target.value)}
                      />
                    )}
                  </td>
                ))}

                {/* Actions */}
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

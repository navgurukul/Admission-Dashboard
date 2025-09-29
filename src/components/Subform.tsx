import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { X, Plus, Pencil } from "lucide-react";

interface RowField {
  name: string;
  label: string;
  type: "text" | "select";
  options?: { value: string; label: string }[];
}

interface InlineSubformProps {
  title: string;
  initialData: Record<string, any>[];
  fields: RowField[];
  onSave: (data: Record<string, any>[]) => void;
}

export function InlineSubform({ title, initialData, fields, onSave }: InlineSubformProps) {
  const [rows, setRows] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);

  const handleRemove = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleChange = (idx: number, field: string, value: any) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
      )
    );
  };

  const handleAdd = () => {
    const emptyRow: Record<string, any> = {};
    fields.forEach((f) => {
      emptyRow[f.name] = f.type === "select" ? (f.options?.[0]?.value || "") : "";
    });
    setRows((prev) => [...prev, emptyRow]);
  };

  const handleSave = () => {
    onSave(rows);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4 border p-4 rounded-lg shadow-sm">
      {/* Header with edit button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {fields.map((field) => (
              <div key={field.name} className="flex-1">
                <label className="text-sm font-medium">{field.label}</label>

                {!isEditing ? (
                  // Read-only mode
                  <p className="text-sm text-muted-foreground border rounded-md p-2">
                    {row[field.name] || "—"}
                  </p>
                ) : field.type === "select" ? (
                  <Select
                    value={row[field.name]}
                    onValueChange={(val) => handleChange(idx, field.name, val)}
                  >
                    <SelectTrigger>
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
                ) : (
                  <Input
                    value={row[field.name]}
                    onChange={(e) => handleChange(idx, field.name, e.target.value)}
                  />
                )}
              </div>
            ))}

            {isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(idx)}
                className="mt-6"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleAdd} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add Row
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}
    </div>
  );
}

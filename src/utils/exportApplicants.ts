import { exportStudents } from "./api";
import { ALL_CSV_FIELDS } from "@/components/CSVExportFieldsModal";

interface ExportOptions {
  questionSetList?: any[];
  filteredData?: any[];
  selectedData?: any[];
  filterParams?: Record<string, any> | null;
  searchTerm?: string;
  exportType?: "all" | "filtered" | "selected";
  selectedFields?: string[];
  toast: (options: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
    duration?: number;
  }) => void;
}

export const exportApplicantsToCSV = async ({
  selectedData = [],
  filterParams = null,
  searchTerm = "",
  exportType = "all",
  selectedFields = [],
  toast,
}: ExportOptions) => {
  const columns = selectedFields
    .map((fieldId) => ALL_CSV_FIELDS.find((field) => field.id === fieldId)?.label?.replace(/^\*/, ""))
    .filter((label): label is string => Boolean(label));

  if (!columns.length) {
    toast({
      title: "No Fields Selected",
      description: "Please select at least one field to export",
      variant: "destructive",
    });
    return;
  }

  const studentIds = exportType === "selected"
    ? selectedData
        .map((student) => student.student_id ?? student.id)
        .filter((id) => id !== undefined && id !== null)
    : [];

  const filters = {
    ...(filterParams || {}),
    ...(searchTerm.trim() ? { search: searchTerm.trim() } : {}),
  };

  try {
    toast({ title: "Preparing Export", description: "Generating student export..." });
    const file = await exportStudents({ student_ids: studentIds, columns, filters });
    if (!file.size) {
      toast({ title: "No Data", description: "No applicants to export", variant: "destructive" });
      return;
    }

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `applicants_${new Date().toISOString().split("T")[0]}.csv`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast({ title: "Export Complete", description: "Student export downloaded." });
  } catch (error: any) {
    console.error("Error exporting students:", error);
    toast({
      title: "Export Error",
      description: error?.message || "Failed to export students.",
      variant: "destructive",
    });
    throw error;
  }
};

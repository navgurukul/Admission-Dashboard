import { Button } from "@/components/ui/button";
import { Upload, Download, Filter, Plus } from "lucide-react";

interface TableActionsProps {
  onCSVImport: () => void;
  onExportCSV: () => void;
  onShowFilters: () => void;
  onAddApplicant: () => void;
}

export const TableActions = ({
  onCSVImport,
  onExportCSV,
  onShowFilters,
  onAddApplicant,
}: TableActionsProps) => {
  return (
    <>
      <Button onClick={onCSVImport} variant="outline" size="sm">
        <Upload className="h-4 w-4 mr-2" />
        Import CSV
      </Button>
      <Button onClick={onExportCSV} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <Button onClick={onShowFilters} variant="outline" size="sm">
        <Filter className="h-4 w-4 mr-2" />
        Filters
      </Button>
      <Button onClick={onAddApplicant} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add Applicant
      </Button>
    </>
  );
};

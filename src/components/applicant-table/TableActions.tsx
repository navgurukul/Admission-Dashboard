import { Button } from "@/components/ui/button";
import { Upload, Download, Filter, Plus, Loader2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TableActionsProps {
  onCSVImport: () => void;
  onExportCSV: (exportType?: 'all' | 'filtered' | 'selected') => void;
  onShowFilters: () => void;
  onAddApplicant: () => void;
  isExporting?: boolean;
  hasActiveFilters?: boolean;
  searchTerm?: string;
  filteredCount?: number;
  selectedCount?: number;
}

export const TableActions = ({
  onCSVImport,
  onExportCSV,
  onShowFilters,
  onAddApplicant,
  isExporting = false,
  hasActiveFilters = false,
  searchTerm = "",
  filteredCount = 0,
  selectedCount = 0,
}: TableActionsProps) => {
  const hasFiltersOrSearch = hasActiveFilters || searchTerm.trim().length > 0;
  const hasSelection = selectedCount > 0;
  
  // Show dropdown if there are filters/search OR selections
  const showDropdown = hasFiltersOrSearch || hasSelection;

  return (
    <>
      <Button onClick={onCSVImport} variant="outline" size="sm">
        <Upload className="h-4 w-4 mr-2" />
        Import CSV
      </Button>

      {/* Export button with dropdown */}
      {showDropdown ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                  <ChevronDown className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExportCSV('all')}>
              <Download className="h-4 w-4 mr-2" />
              Export All Data
            </DropdownMenuItem>
            {hasFiltersOrSearch && (
              <DropdownMenuItem onClick={() => onExportCSV('filtered')}>
                <Download className="h-4 w-4 mr-2" />
                Export {searchTerm.trim() ? 'Search' : 'Filtered'} Results ({filteredCount})
              </DropdownMenuItem>
            )}
            {hasSelection && (
              <DropdownMenuItem onClick={() => onExportCSV('selected')}>
                <Download className="h-4 w-4 mr-2" />
                Export Selected ({selectedCount})
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button 
          onClick={() => onExportCSV('all')} 
          variant="outline" 
          size="sm"
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </>
          )}
        </Button>
      )}

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

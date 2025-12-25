import { Button } from "@/components/ui/button";
import { Upload, Download, Filter, Plus, Loader2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TableActionsProps {
  onCSVImport?: () => void;
  onExportCSV: (exportType?: 'all' | 'filtered' | 'selected') => void;
  onShowFilters: () => void;
  onAddApplicant?: () => void;
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
    <div className="flex flex-wrap gap-2">
      {onCSVImport && (
        <Button onClick={onCSVImport} variant="outline" size="sm" className="flex-shrink-0">
          <Upload className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Import CSV</span>
        </Button>
      )}

      {/* Export button with dropdown */}
      {showDropdown ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              disabled={isExporting}
              className="flex-shrink-0"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
                  <span className="hidden md:inline">Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Export CSV</span>
                  <ChevronDown className="h-4 w-4 md:ml-2" />
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
          className="flex-shrink-0"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
              <span className="hidden md:inline">Exporting...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Export CSV</span>
            </>
          )}
        </Button>
      )}

      <Button onClick={onShowFilters} variant="outline" size="sm" className="flex-shrink-0">
        <Filter className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Filters</span>
      </Button>
      {onAddApplicant && (
        <Button onClick={onAddApplicant} size="sm" className="flex-shrink-0">
          <Plus className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Add Applicant</span>
        </Button>
      )}
    </div>
  );
};

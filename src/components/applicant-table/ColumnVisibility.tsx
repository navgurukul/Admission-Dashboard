import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Columns3, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  locked?: boolean; // Can't be hidden (like checkbox, name, actions)
}

interface ColumnVisibilityProps {
  columns: ColumnConfig[];
  onColumnToggle: (columnId: string) => void;
  onResetToDefault?: () => void;
}

export const ColumnVisibility = ({
  columns,
  onColumnToggle,
  onResetToDefault,
}: ColumnVisibilityProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Filter out checkbox, actions, city, and activities from display, and filter by search term
  const displayColumns = columns.filter(
    (col) => col.id !== 'checkbox' && col.id !== 'actions' && col.id !== 'city' && col.id !== 'activities'
  );

  const filteredColumns = displayColumns.filter((column) =>
    column.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unlocked columns from filtered results (columns that can be toggled)
  const unlockableFilteredColumns = filteredColumns.filter((col) => !col.locked);
  const allFilteredVisible = unlockableFilteredColumns.every((col) => col.visible);
  const someFilteredVisible = unlockableFilteredColumns.some((col) => col.visible);

  // Handle Select All - only selects filtered/searched columns
  const handleSelectAll = () => {
    unlockableFilteredColumns.forEach((col) => {
      if (!col.visible) {
        onColumnToggle(col.id);
      }
    });
  };

  // Handle Deselect All
  const handleDeselectAll = () => {
    unlockableFilteredColumns.forEach((col) => {
      if (col.visible) {
        onColumnToggle(col.id);
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Columns3 className="h-4 w-4" />
          Columns
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[400px] p-0 z-[100]">
        <div className="flex flex-col h-full max-h-screen">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
            <SheetTitle>Column Visibility</SheetTitle>
            <SheetDescription>
              Select which columns to display in the table
            </SheetDescription>
          </SheetHeader>

          {/* Search Box */}
          <div className="px-6 py-4 border-b flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Select All / Reset to Default Buttons */}
          <div className="px-6 py-3 border-b bg-muted/20 flex-shrink-0">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={allFilteredVisible || unlockableFilteredColumns.length === 0}
                className="flex-1 h-8 text-xs"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onResetToDefault) {
                    onResetToDefault();
                    setIsOpen(false);
                  }
                }}
                disabled={!someFilteredVisible && !onResetToDefault}
                className="flex-1 h-8 text-xs"
              >
                Reset to Default
              </Button>
            </div>
          </div>

          {/* Column List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="space-y-1">
              {filteredColumns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No columns found
                </div>
              ) : (
                filteredColumns.map((column) => (
                  <div
                    key={column.id}
                    className={`flex items-center space-x-3 py-2.5 px-3 rounded-md hover:bg-accent transition-colors ${
                      column.locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                    }`}
                    onClick={() => !column.locked && onColumnToggle(column.id)}
                  >
                    <Checkbox
                      checked={column.visible}
                      disabled={column.locked}
                      onCheckedChange={() => !column.locked && onColumnToggle(column.id)}
                      className="pointer-events-none"
                    />
                    <label
                      className={`text-sm font-medium leading-none flex-1 ${
                        column.locked ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      {column.label}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer with Stats */}
          <div className="px-6 py-4 border-t bg-muted/30 flex-shrink-0">
            <div className="text-sm text-muted-foreground">
              {displayColumns.filter((c) => c.visible).length} of {displayColumns.length} columns visible
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

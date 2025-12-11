import { Loader2 } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  itemsPerPage: number;
  setItemsPerPage: (size: number) => void;
  totalPages: number;
  showingStart: number;
  showingEnd: number;
  currentTotalCount: number;
  totalStudents: number;
  isStudentsFetching: boolean;
  searchTerm: string;
  hasActiveFilters: boolean;
}

export const Pagination = ({
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalPages,
  showingStart,
  showingEnd,
  currentTotalCount,
  totalStudents,
  isStudentsFetching,
  searchTerm,
  hasActiveFilters,
}: PaginationProps) => {
  return (
    <div className="flex justify-between items-center mt-4">
      <p className="text-sm text-muted-foreground">
        {isStudentsFetching && !searchTerm.trim() && !hasActiveFilters ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </span>
        ) : (
          <>
            Showing {showingStart} – {showingEnd} of {currentTotalCount}
          </>
        )}
      </p>
      <div className="flex gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Rows:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              const v = Number(e.target.value);
              setItemsPerPage(v);
              setCurrentPage(1); // reset to first page when page size changes
            }}
            disabled={
              isStudentsFetching && !searchTerm.trim() && !hasActiveFilters
            }
            className="border rounded px-2 py-1 bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={80}>80</option>
            <option value={100}>100</option>
          </select>
        </div>
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={
            currentPage === 1 ||
            (isStudentsFetching && !searchTerm.trim() && !hasActiveFilters)
          }
          className="px-3 py-1 rounded border bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="px-3 py-1 text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={
            currentPage === totalPages ||
            (isStudentsFetching && !searchTerm.trim() && !hasActiveFilters)
          }
          className="px-3 py-1 rounded border bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

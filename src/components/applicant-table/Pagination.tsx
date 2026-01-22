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
  searchTerm,
  hasActiveFilters,
}: PaginationProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mt-4">
      {/* Showing count - Hidden on mobile, visible on sm and up */}
      <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left order-2 sm:order-1">
        Showing {showingStart} – {showingEnd} of {currentTotalCount}
      </p>
      
      {/* Pagination controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 order-1 sm:order-2">
        {/* Rows per page selector */}
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Rows:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              const v = Number(e.target.value);
              setItemsPerPage(v);
              setCurrentPage(1); // reset to first page when page size changes
            }}
            className="border rounded px-2 py-1.5 bg-white text-xs sm:text-sm min-w-[70px] focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={80}>80</option>
            <option value={100}>100</option>
          </select>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded border bg-white text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <span className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded border bg-white text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

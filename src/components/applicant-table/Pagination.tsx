import { useState, useRef, useEffect } from "react";

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
  totalPages: rawTotalPages,
  showingStart,
  showingEnd,
  currentTotalCount,
  totalStudents: _totalStudents,
  searchTerm: _searchTerm,
  hasActiveFilters: _hasActiveFilters,
}: PaginationProps) => {
  // Guard: totalPages should never be less than 1
  const totalPages = Math.max(1, rawTotalPages || 1);

  const [jumpValue, setJumpValue] = useState("");
  const [jumpError, setJumpError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup error timer on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  // Clear jumpValue if currentPage changes externally (e.g. Previous/Next clicked)
  useEffect(() => {
    setJumpValue("");
    setJumpError(false);
  }, [currentPage]);

  const triggerError = () => {
    setJumpError(true);
    inputRef.current?.focus();
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setJumpError(false), 1500);
  };

  const handleJump = () => {
    const page = parseInt(jumpValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setJumpValue("");
      setJumpError(false);
      inputRef.current?.blur();
    } else {
      triggerError();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleJump();
    } else if (e.key === "Escape") {
      setJumpValue("");
      setJumpError(false);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      inputRef.current?.blur();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const val = e.target.value.replace(/\D/g, "");
    setJumpValue(val);
    if (jumpError) {
      setJumpError(false);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    }
  };

  const totalPagesDigits = String(totalPages).length;

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mt-4">
      {/* Showing count */}
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
              setCurrentPage(1);
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

        {/* Jump to page */}
        <div className="flex items-center justify-center gap-1.5">
          <label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Jump:</label>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={jumpValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={String(currentPage)}
            maxLength={totalPagesDigits + 1}
            className={`border rounded px-2 py-1.5 bg-white text-xs sm:text-sm text-center focus:outline-none focus:ring-2 transition-colors ${
              jumpError
                ? "border-red-400 ring-2 ring-red-300 bg-red-50"
                : "focus:ring-primary"
            }`}
            style={{ width: `${Math.max(3, totalPagesDigits + 1.5)}ch` }}
            aria-label={`Jump to page, 1 to ${totalPages}`}
          />
          <button
            onClick={handleJump}
            disabled={jumpValue === ""}
            className="px-2.5 py-1.5 rounded border bg-white text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 transition-colors whitespace-nowrap"
          >
            Go
          </button>
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

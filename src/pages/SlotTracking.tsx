import { useState, useEffect } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { getCurrentUser, getAllUsers, getInterviewerStats } from "@/utils/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  CalendarDays,
  User,
  X,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

interface InterviewerStat {
  interviewer_id: number;
  interviewer_name: string;
  date: string;
  slot_type: string;
  total_slots: number;
  empty_slots: number;
  interview_done: number;
  pass: number;
  fail: number;
  reschedule: number;
  no_show: number;
  disinterested: number;
  not_eligible: number;
}

interface ApiResponse {
  success: boolean;
  data: InterviewerStat[];
  message?: string;
}

interface UserOption {
  id: number;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr || dateStr === "all") return "All Dates";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const buildQuery = (params: Record<string, string>): string => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return qs ? `?${qs}` : "";
};

// ─── Component ────────────────────────────────────────────────────────────────

const SlotTracking = () => {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  const isAdmin = Number(currentUser?.user_role_id) === 1;

  // View mode
  const [viewMode, setViewMode] = useState<"my" | "all" | "today">("my");

  // Filters
  const [dateFilter, setDateFilter] = useState<string>("");
  const [interviewerIdFilter, setInterviewerIdFilter] = useState<string>("");

  // Users list for dropdown
  const [usersList, setUsersList] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);

  // Data
  const [stats, setStats] = useState<InterviewerStat[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Sort
  const [sortField, setSortField] = useState<keyof InterviewerStat | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Pagination
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchStats = async (page = currentPage) => {
    // "My Stats" mein user ID nahi mili toh fetch mat karo
    if (viewMode === "my" && !currentUserId) {
      toast({
        title: "⚠️ User not found",
        description: "Could not identify logged-in user. Please refresh or login again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
      return;
    }

    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: page,
        limit: pageSize,
      };

      if (viewMode === "my") {
        params.interviewer_id = String(currentUserId);
        params.date = dateFilter.trim() || "all";

      } else if (viewMode === "today") {
        params.date = new Date().toISOString().split("T")[0];

      } else {
        if (interviewerIdFilter.trim()) {
          params.interviewer_id = interviewerIdFilter.trim();
        }
        params.date = dateFilter.trim() || "all";
      }

      const json = await getInterviewerStats(params);
      if (!json.success) throw new Error(json.message || "API returned failure");

      let items = [];
      let total = 0;
      
      if (Array.isArray(json.data)) {
        items = json.data;
        total = json.pagination?.total || json.total || json.totalRecords || json.pagination?.totalItems || items.length;
      } else if (json.data && Array.isArray(json.data.records)) {
        items = json.data.records;
        total = json.data.total || json.data.pagination?.total || items.length;
      } else if (json.data && Array.isArray(json.data.data)) {
        items = json.data.data;
        total = json.data.total || json.total || items.length;
      }
      
      setStats(items);
      setTotalRows(total);
    } catch (err: any) {
      console.error("SlotTracking fetch error:", err);
      toast({
        title: "❌ Failed to load stats",
        description: err?.message || "Unknown error",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
      setStats([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, currentPage, pageSize]);

  // ── Fetch Users for dropdown ───────────────────────────────────────────────

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      // High limit to get all users in one call
      const res = await getAllUsers(1, 70);
      const mapped = (res.users || [])
        .filter((u) => u.id && u.name)
        .map((u) => ({ id: Number(u.id), name: String(u.name) }));
      setUsersList(mapped);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Load users once on mount (needed only for "all" mode dropdown)
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sort ──────────────────────────────────────────────────────────────────

  const handleSort = (field: keyof InterviewerStat) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedStats = [...stats].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
    return sortDir === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  // ── Clear filters ─────────────────────────────────────────────────────────

  const clearFilters = () => {
    setDateFilter("");
    setInterviewerIdFilter("");
    setCurrentPage(1);
  };

  const hasActiveFilter = dateFilter || (viewMode === "all" && interviewerIdFilter);

  // Helper: interviewer name from id
  const getInterviewerName = (id: string) =>
    usersList.find((u) => String(u.id) === id)?.name || `ID: ${id}`;

  // ── Pagination ────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil((totalRows || sortedStats.length) / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  
  // Check if backend actually paginated by checking if it returned less or equal to pageSize 
  // but totalRows is more. If it did, we don't slice because it's already sliced by backend.
  // Otherwise, we do client-side slice to guarantee max 10 items.
  const isBackendPaginated = sortedStats.length <= pageSize && (totalRows > sortedStats.length);
  
  const paginatedStats = isBackendPaginated 
    ? sortedStats 
    : sortedStats.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ── Totals ────────────────────────────────────────────────────────────────

  const totals = sortedStats.reduce(
    (acc, row) => ({
      interview_done: acc.interview_done + (row.interview_done || 0),
      pass: acc.pass + (row.pass || 0),
      fail: acc.fail + (row.fail || 0),
      total_slots: acc.total_slots + (row.total_slots || 0),
      empty_slots: acc.empty_slots + (row.empty_slots || 0),
      no_show: acc.no_show + (row.no_show || 0),
    }),
    { interview_done: 0, pass: 0, fail: 0, total_slots: 0, empty_slots: 0, no_show: 0 }
  );

  // ── Column helpers ────────────────────────────────────────────────────────

  const SortIcon = ({ field }: { field: keyof InterviewerStat }) =>
    sortField === field ? (
      sortDir === "asc" ? (
        <ChevronUp className="inline w-3 h-3 ml-0.5" />
      ) : (
        <ChevronDown className="inline w-3 h-3 ml-0.5" />
      )
    ) : (
      <ChevronDown className="inline w-3 h-3 ml-0.5 opacity-25" />
    );

  const Th = ({
    label,
    field,
    className = "",
  }: {
    label: string;
    field?: keyof InterviewerStat;
    className?: string;
  }) => (
    <th
      className={`px-2 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${
        field ? "cursor-pointer select-none hover:text-foreground" : ""
      } ${className}`}
      onClick={field ? () => handleSort(field) : undefined}
    >
      {label}
      {field && <SortIcon field={field} />}
    </th>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-muted/40 flex">
      <AdmissionsSidebar />

      <main className="md:ml-64 flex-1 p-3 sm:p-6 overflow-y-auto h-screen">
        <div className="max-w-[1400px] mx-auto space-y-3 mt-12 md:mt-0">

          {/* ── Page header ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Slot Tracking</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {viewMode === "my"
                  ? "Your slot performance report"
                  : viewMode === "today"
                  ? "Today's slot performance — all interviewers"
                  : "Interviewer-wise slot performance report"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center self-start sm:self-auto">
              {/* View Mode Toggle */}
              <div className="flex gap-1 bg-muted/60 p-1 rounded-lg">
                <Button
                  size="sm"
                  variant={viewMode === "my" ? "default" : "ghost"}
                  onClick={() => { setViewMode("my"); clearFilters(); }}
                  className="h-8 gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  My Stats
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "today" ? "default" : "ghost"}
                  onClick={() => { setViewMode("today"); clearFilters(); }}
                  className="h-8 gap-1.5"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Today's Slots
                </Button>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant={viewMode === "all" ? "default" : "ghost"}
                    onClick={() => { setViewMode("all"); clearFilters(); }}
                    className="h-8 gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    View All
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchStats(currentPage)}
                disabled={loading}
                className="gap-2 h-8"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* ── Summary cards ── */}
          {sortedStats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { label: "Total Slots", value: totals.total_slots, color: "text-purple-600" },
                { label: "Empty Slots", value: totals.empty_slots, color: "text-orange-500" },
                { label: "Pass", value: totals.pass, color: "text-green-600" },
                { label: "Fail", value: totals.fail, color: "text-red-500" },
                { label: "No Show", value: totals.no_show, color: "text-gray-500" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="bg-card border border-border rounded-xl p-2 shadow-sm"
                >
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className={`text-xl font-bold mt-0.5 ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Filters (hidden in Today mode) ── */}
          {viewMode !== "today" && (
            <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
              <div className="flex flex-wrap items-end gap-2">

                {/* Date filter */}
                <div className="flex flex-col gap-1 min-w-[160px]">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Date
                  </label>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                {/* Interviewer dropdown — only in "all" mode */}
                {viewMode === "all" && (
                  <div className="flex flex-col gap-1 min-w-[190px]">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" /> Interviewer
                    </label>
                    <Select
                      value={interviewerIdFilter}
                      onValueChange={(val) =>
                        setInterviewerIdFilter(val === "all" ? "" : val)
                      }
                      disabled={usersLoading}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue
                          placeholder={
                            usersLoading ? "Loading users..." : "All interviewers"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All interviewers</SelectItem>
                        {usersList.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 ml-auto">
                  {hasActiveFilter && (
                    <Button size="sm" variant="ghost" onClick={clearFilters} className="h-9 gap-1">
                      <X className="w-3.5 h-3.5" /> Clear
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      if (currentPage === 1) fetchStats(1);
                      else setCurrentPage(1);
                    }}
                    disabled={loading}
                    className="h-9 gap-2 bg-primary text-white hover:bg-primary/90"
                  >
                    <Search className="w-3.5 h-3.5" />
                    {loading ? "Loading..." : "Apply"}
                  </Button>
                </div>
              </div>

              {/* Active filter badges */}
              {hasActiveFilter && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                  {viewMode === "my" && currentUserId && (
                    <Badge variant="secondary" className="gap-1 text-xs bg-blue-50 text-blue-700 border-blue-200">
                      <User className="w-3 h-3" />
                      My Data (ID: {currentUserId})
                    </Badge>
                  )}
                  {viewMode === "all" && interviewerIdFilter && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      {getInterviewerName(interviewerIdFilter)}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setInterviewerIdFilter("")}
                      />
                    </Badge>
                  )}
                  {dateFilter && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      Date: {formatDisplayDate(dateFilter)}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setDateFilter("")}
                      />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Table ── */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <Th label="Date" field="date" />
                    <Th label="Name" field="interviewer_name" />
                    <Th label="Type" field="slot_type" className="text-gray-600" />
                    <Th label="Total Slots" field="total_slots" className="text-purple-600" />
                    <Th label="Empty Slots" field="empty_slots" className="text-orange-400" />
                    <Th label="Interview Done" field="interview_done" className="text-blue-600" />
                    <Th label="Pass" field="pass" className="text-green-600" />
                    <Th label="Fail" field="fail" className="text-red-500" />
                    <Th label="Reschedule" field="reschedule" className="text-yellow-600" />
                    <Th label="No Show" field="no_show" className="text-gray-500" />
                    <Th label="Disinterested" field="disinterested" className="text-orange-500" />
                    <Th label="Not Eligible" field="not_eligible" className="text-red-600" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 12 }).map((_, j) => (
                          <td key={j} className="px-3 py-3">
                            <div className="h-4 bg-muted rounded w-16" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : sortedStats.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-6 py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <CalendarDays className="w-8 h-8 opacity-30" />
                          <p className="font-medium">No data found</p>
                          <p className="text-xs">Try adjusting filters or refreshing</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedStats.map((row, idx) => (
                      <tr
                        key={`${row.interviewer_id}-${row.date}-${idx}`}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-2 py-1.5 text-foreground whitespace-nowrap">
                          {formatDisplayDate(row.date)}
                        </td>
                        <td className="px-2 py-1.5 font-medium text-foreground whitespace-nowrap">
                          {row.interviewer_name}
                        </td>
                        <td className="px-2 py-1.5 text-gray-700 whitespace-nowrap">
                          {row.slot_type || "-"}
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
                            {row.total_slots || 0}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-50 text-orange-500 text-xs font-semibold">
                            {row.empty_slots || 0}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                            {row.interview_done || 0}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                            {row.pass || 0}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                            {row.fail || 0}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-50 text-yellow-700 text-xs font-semibold">
                            {row.reschedule || 0}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                            {row.no_show || 0}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold">
                            {row.disinterested || 0}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
                            {row.not_eligible || 0}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Footer totals row */}
                {/* 
                {!loading && sortedStats.length > 1 && (
                  <tfoot className="bg-muted/60 border-t-2 border-border">
                    <tr>
                      <td className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        Total
                      </td>
                      <td className="px-2 py-1.5" />
                      <td className="px-2 py-1.5 font-bold text-blue-700">{totals.done}</td>
                      <td className="px-2 py-1.5 font-bold text-green-700">{totals.pass}</td>
                      <td className="px-2 py-1.5 font-bold text-red-600">{totals.fail}</td>
                      <td className="px-2 py-1.5 font-bold text-yellow-700">
                        {sortedStats.reduce((s, r) => s + (r.reschedule || 0), 0)}
                      </td>
                      <td className="px-2 py-1.5 font-bold text-gray-600">{totals.no_show}</td>
                      <td className="px-2 py-1.5 font-bold text-orange-600">
                        {sortedStats.reduce((s, r) => s + (r.disinterested || 0), 0)}
                      </td>
                      <td className="px-2 py-1.5 font-bold text-purple-700">{totals.slots}</td>
                      <td className="px-2 py-1.5 font-bold text-orange-500">{totals.empty}</td>
                    </tr>
                  </tfoot>
                )}
                */}
              </table>
            </div>

            {!loading && sortedStats.length > 0 && (
              <div className="px-4 py-3 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-sm text-muted-foreground">
                <div className="font-medium">
                  Showing <span className="text-foreground">{(safePage - 1) * pageSize + 1} – {Math.min(safePage * pageSize, totalRows || sortedStats.length)}</span> of <span className="text-foreground">{totalRows || sortedStats.length}</span> rows
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span>Rows:</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(val) => {
                        setPageSize(Number(val));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[70px] h-8 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="h-8 bg-background px-3"
                    >
                      Previous
                    </Button>
                    <span className="font-medium text-foreground whitespace-nowrap px-2 text-center">
                      Page {safePage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="h-8 bg-background px-3"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default SlotTracking;

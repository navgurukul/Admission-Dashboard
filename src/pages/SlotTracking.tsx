import { useState, useEffect } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { getAuthHeaders, getCurrentUser, getAllUsers } from "@/utils/api";
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
  done: number;
  pass: number;
  fail: number;
  reschedule: number;
  no_show: number;
  disinterested: number;
  slots: number;
  empty: number;
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
  const [loading, setLoading] = useState<boolean>(false);

  // Sort
  const [sortField, setSortField] = useState<keyof InterviewerStat | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchStats = async () => {
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
      const params: Record<string, string> = {};

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

      const query = buildQuery(params);
      const url = `${BASE_URL}/reports/interviewer-stats${query}`;

      const res = await fetch(url, { headers: getAuthHeaders() as HeadersInit });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message || `HTTP ${res.status}`);
      }

      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.message || "API returned failure");

      setStats(Array.isArray(json.data) ? json.data : []);
    } catch (err: any) {
      console.error("SlotTracking fetch error:", err);
      toast({
        title: "❌ Failed to load stats",
        description: err?.message || "Unknown error",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

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
  };

  const hasActiveFilter = dateFilter || (viewMode === "all" && interviewerIdFilter);

  // Helper: interviewer name from id
  const getInterviewerName = (id: string) =>
    usersList.find((u) => String(u.id) === id)?.name || `ID: ${id}`;

  // ── Totals ────────────────────────────────────────────────────────────────

  const totals = sortedStats.reduce(
    (acc, row) => ({
      done: acc.done + (row.done || 0),
      pass: acc.pass + (row.pass || 0),
      fail: acc.fail + (row.fail || 0),
      slots: acc.slots + (row.slots || 0),
      empty: acc.empty + (row.empty || 0),
      no_show: acc.no_show + (row.no_show || 0),
    }),
    { done: 0, pass: 0, fail: 0, slots: 0, empty: 0, no_show: 0 }
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
      className={`px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${
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
        <div className="max-w-[1400px] mx-auto space-y-5 mt-12 md:mt-0">

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
                onClick={fetchStats}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Total Done", value: totals.done, color: "text-blue-600" },
                { label: "Pass", value: totals.pass, color: "text-green-600" },
                { label: "Fail", value: totals.fail, color: "text-red-500" },
                { label: "Total Slots", value: totals.slots, color: "text-purple-600" },
                { label: "Empty", value: totals.empty, color: "text-orange-500" },
                { label: "No Show", value: totals.no_show, color: "text-gray-500" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="bg-card border border-border rounded-xl p-3 shadow-sm"
                >
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Filters (hidden in Today mode) ── */}
          {viewMode !== "today" && (
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex flex-wrap items-end gap-3">

                {/* Date filter */}
                <div className="flex flex-col gap-1 min-w-[160px]">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Date
                  </label>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="h-9 text-sm"
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
                      <SelectTrigger className="h-9 text-sm">
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
                    onClick={fetchStats}
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
                    <Th label="Done" field="done" className="text-blue-600" />
                    <Th label="Pass" field="pass" className="text-green-600" />
                    <Th label="Fail" field="fail" className="text-red-500" />
                    <Th label="Reschedule" field="reschedule" className="text-yellow-600" />
                    <Th label="No Show" field="no_show" className="text-gray-500" />
                    <Th label="Disinterested" field="disinterested" className="text-orange-500" />
                    <Th label="Slots" field="slots" className="text-purple-600" />
                    <Th label="Empty" field="empty" className="text-orange-400" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <td key={j} className="px-3 py-3">
                            <div className="h-4 bg-muted rounded w-16" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : sortedStats.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <CalendarDays className="w-8 h-8 opacity-30" />
                          <p className="font-medium">No data found</p>
                          <p className="text-xs">Try adjusting filters or refreshing</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedStats.map((row, idx) => (
                      <tr
                        key={`${row.interviewer_id}-${row.date}-${idx}`}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-3 py-3 font-medium text-foreground whitespace-nowrap">
                          {formatDisplayDate(row.date)}
                        </td>
                        <td className="px-3 py-3 font-medium text-foreground whitespace-nowrap">
                          {row.interviewer_name}
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                            {row.done || 0}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                            {row.pass || 0}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                            {row.fail || 0}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-50 text-yellow-700 text-xs font-semibold">
                            {row.reschedule || 0}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                            {row.no_show || 0}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold">
                            {row.disinterested || 0}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
                            {row.slots || 0}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-50 text-orange-500 text-xs font-semibold">
                            {row.empty || 0}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Footer totals row */}
                {!loading && sortedStats.length > 1 && (
                  <tfoot className="bg-muted/60 border-t-2 border-border">
                    <tr>
                      <td className="px-3 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        Total
                      </td>
                      <td className="px-3 py-3" />
                      <td className="px-3 py-3 font-bold text-blue-700">{totals.done}</td>
                      <td className="px-3 py-3 font-bold text-green-700">{totals.pass}</td>
                      <td className="px-3 py-3 font-bold text-red-600">{totals.fail}</td>
                      <td className="px-3 py-3 font-bold text-yellow-700">
                        {sortedStats.reduce((s, r) => s + (r.reschedule || 0), 0)}
                      </td>
                      <td className="px-3 py-3 font-bold text-gray-600">{totals.no_show}</td>
                      <td className="px-3 py-3 font-bold text-orange-600">
                        {sortedStats.reduce((s, r) => s + (r.disinterested || 0), 0)}
                      </td>
                      <td className="px-3 py-3 font-bold text-purple-700">{totals.slots}</td>
                      <td className="px-3 py-3 font-bold text-orange-500">{totals.empty}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {!loading && sortedStats.length > 0 && (
              <div className="px-4 py-2.5 border-t border-border text-xs text-muted-foreground">
                Showing {sortedStats.length} row{sortedStats.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default SlotTracking;

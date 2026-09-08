import { useState, useEffect, useMemo, useRef } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { getCurrentUser, getAllUsers, getInterviewerStats } from "@/utils/api";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
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
  CalendarRange,
  User,
  X,
  Users,
  Download,
  Sparkles,
  Filter,
  Calendar,
  FileSpreadsheet,
  Table as TableIcon,
  Camera,
  Loader2,
  FileDown,
  CheckCircle2,
  XCircle,
  RotateCcw,
  EyeOff,
  Frown,
  UserX,
} from "lucide-react";

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

interface SlotStatSummary {
  total_slots?: number;
  empty_slots?: number;
  interview_done?: number;
  pass?: number;
  fail?: number;
  reschedule?: number;
  no_show?: number;
  disinterested?: number;
  not_eligible?: number;
}

interface AllTimeSummary {
  LR?: SlotStatSummary;
  CFR?: SlotStatSummary;
  CRF?: SlotStatSummary;
  Total?: SlotStatSummary;
}

interface UserOption {
  id: number;
  name: string;
}

type TimePeriodMode = "daily" | "weekly" | "monthly" | "all_time" | "custom";

interface DateAggregatedRow {
  date: string;
  formattedDate: string;
  finalTotalDone: number;
  finalTotalPass: number;
  finalTotalFail: number;
  finalTotalReschedule: number;
  finalTotalNoShow: number;
  finalTotalDisinterested: number;
  finalTotalNotEligible: number;
  finalTotalSlots: number;
  finalTotalEmpty: number;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

const formatDateISO = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayDate = (): string => formatDateISO(new Date());

const getYesterdayDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateISO(d);
};

const getThisWeekRange = (): { start: string; end: string } => {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: formatDateISO(monday), end: formatDateISO(sunday) };
};

const getThisMonthRange = (): { start: string; end: string } => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: formatDateISO(firstDay), end: formatDateISO(lastDay) };
};

const formatSheetDate = (dateStr: string): string => {
  if (!dateStr || dateStr === "all") return "All Dates";
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = monthNames[d.getMonth()];
    return `${day} ${month}`;
  } catch {
    return dateStr;
  }
};

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

const isLRType = (type?: string): boolean => {
  if (!type) return false;
  const t = type.trim().toUpperCase();
  return t === "LR" || t.includes("LEARNING");
};

const isCRFType = (type?: string): boolean => {
  if (!type) return false;
  const t = type.trim().toUpperCase();
  return t === "CRF" || t === "CFR" || t.includes("CULTURE") || t.includes("CULTURAL");
};

const aggregateByDate = (items: InterviewerStat[]): DateAggregatedRow[] => {
  const map = new Map<string, DateAggregatedRow>();

  items.forEach((item) => {
    const d = item.date || "Unknown";
    const existing = map.get(d) || {
      date: d,
      formattedDate: formatSheetDate(d),
      finalTotalDone: 0,
      finalTotalPass: 0,
      finalTotalFail: 0,
      finalTotalReschedule: 0,
      finalTotalNoShow: 0,
      finalTotalDisinterested: 0,
      finalTotalNotEligible: 0,
      finalTotalSlots: 0,
      finalTotalEmpty: 0,
    };

    existing.finalTotalDone += item.interview_done || 0;
    existing.finalTotalPass += item.pass || 0;
    existing.finalTotalFail += item.fail || 0;
    existing.finalTotalReschedule += item.reschedule || 0;
    existing.finalTotalNoShow += item.no_show || 0;
    existing.finalTotalDisinterested += item.disinterested || 0;
    existing.finalTotalNotEligible += item.not_eligible || 0;
    existing.finalTotalSlots += item.total_slots || 0;
    existing.finalTotalEmpty += item.empty_slots || 0;

    map.set(d, existing);
  });

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
};

const calculateGroupTotal = (rows: DateAggregatedRow[]): DateAggregatedRow => {
  return rows.reduce(
    (acc, r) => ({
      date: "Total",
      formattedDate: "Total",
      finalTotalDone: acc.finalTotalDone + r.finalTotalDone,
      finalTotalPass: acc.finalTotalPass + r.finalTotalPass,
      finalTotalFail: acc.finalTotalFail + r.finalTotalFail,
      finalTotalReschedule: acc.finalTotalReschedule + r.finalTotalReschedule,
      finalTotalNoShow: acc.finalTotalNoShow + r.finalTotalNoShow,
      finalTotalDisinterested: acc.finalTotalDisinterested + r.finalTotalDisinterested,
      finalTotalNotEligible: acc.finalTotalNotEligible + r.finalTotalNotEligible,
      finalTotalSlots: acc.finalTotalSlots + r.finalTotalSlots,
      finalTotalEmpty: acc.finalTotalEmpty + r.finalTotalEmpty,
    }),
    {
      date: "Total",
      formattedDate: "Total",
      finalTotalDone: 0,
      finalTotalPass: 0,
      finalTotalFail: 0,
      finalTotalReschedule: 0,
      finalTotalNoShow: 0,
      finalTotalDisinterested: 0,
      finalTotalNotEligible: 0,
      finalTotalSlots: 0,
      finalTotalEmpty: 0,
    }
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SlotTracking = () => {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  const userRole = Number(currentUser?.user_role_id);
  const isAdmin = userRole === 1 || userRole === 3;

  const [viewScope, setViewScope] = useState<"my" | "all">(isAdmin ? "all" : "my");
  const [timeMode, setTimeMode] = useState<TimePeriodMode>("daily");
  const [showReports, setShowReports] = useState<boolean>(false);
  const [todaySlotsPage, setTodaySlotsPage] = useState<number>(1);
  const [todaySlotsRowsPerPage, setTodaySlotsRowsPerPage] = useState<number>(10);

  const [dailyDate, setDailyDate] = useState<string>(getTodayDate());
  const [weekRange, setWeekRange] = useState<{ start: string; end: string }>(getThisWeekRange());
  const [monthRange, setMonthRange] = useState<{ start: string; end: string }>(getThisMonthRange());
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: getTodayDate(),
    end: getTodayDate(),
  });

  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [usersList, setUsersList] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);

  const [stats, setStats] = useState<InterviewerStat[]>([]);
  const [allTimeSummary, setAllTimeSummary] = useState<AllTimeSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const [capturingScreenshot, setCapturingScreenshot] = useState<boolean>(false);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);

  const getActiveApiParams = () => {
    let start_date = "";
    let end_date: string | undefined = undefined;

    switch (timeMode) {
      case "daily":
        start_date = dailyDate || getTodayDate();
        end_date = dailyDate || getTodayDate();
        break;
      case "weekly":
        start_date = weekRange.start;
        end_date = weekRange.end;
        break;
      case "monthly":
        start_date = monthRange.start;
        end_date = monthRange.end;
        break;
      case "all_time":
        start_date = "all";
        end_date = undefined;
        break;
      case "custom":
        start_date = customRange.start;
        end_date = customRange.end;
        break;
    }

    const params: { start_date: string; end_date?: string; interviewer_id?: string } = { start_date };

    if (end_date && start_date !== "all") {
      params.end_date = end_date;
    }

    if (viewScope === "my" && currentUserId) {
      params.interviewer_id = String(currentUserId);
    } else if (viewScope === "all" && selectedInterviewerId.trim() && selectedInterviewerId !== "all") {
      params.interviewer_id = selectedInterviewerId.trim();
    }

    return params;
  };

  const fetchStats = async () => {
    if (viewScope === "my" && !currentUserId) {
      toast({
        title: "⚠️ User not identified",
        description: "Could not find your logged-in user ID. Please re-login.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const activeParams = getActiveApiParams();
      const params: Record<string, any> = { ...activeParams, limit: 1000 };

      const json = await getInterviewerStats(params);
      if (!json.success && json.success !== undefined) {
        throw new Error(json.message || "API returned failure");
      }

      const dataObj = json.data || json;

      if (
        dataObj &&
        typeof dataObj === "object" &&
        !Array.isArray(dataObj) &&
        (dataObj.LR || dataObj.CFR || dataObj.CRF || dataObj.Total)
      ) {
        setAllTimeSummary(dataObj as AllTimeSummary);
        setStats([]);
      } else {
        setAllTimeSummary(null);
        let items: InterviewerStat[] = [];
        if (Array.isArray(json.data)) items = json.data;
        else if (json.data && Array.isArray(json.data.records)) items = json.data.records;
        else if (json.data && Array.isArray(json.data.data)) items = json.data.data;
        else if (Array.isArray(json.records)) items = json.records;
        setStats(items);
      }
    } catch (err: any) {
      console.error("SlotTracking fetch error:", err);
      toast({
        title: "❌ Failed to load slot stats",
        description: err?.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setStats([]);
      setAllTimeSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [
    viewScope,
    timeMode,
    dailyDate,
    weekRange.start,
    weekRange.end,
    monthRange.start,
    monthRange.end,
    customRange.start,
    customRange.end,
    selectedInterviewerId,
  ]);

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await getAllUsers(1, 100);
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
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  // ── Sheet Calculations ───────────────────────────────────────────────────

  // Pagination for Today's Slots
  const paginatedStats = useMemo(() => {
    if (!showReports && timeMode === "daily") {
      const startIdx = (todaySlotsPage - 1) * todaySlotsRowsPerPage;
      const endIdx = startIdx + todaySlotsRowsPerPage;
      return stats.slice(startIdx, endIdx);
    }
    return stats;
  }, [stats, todaySlotsPage, todaySlotsRowsPerPage, showReports, timeMode]);

  const totalPages = useMemo(() => {
    return Math.ceil(stats.length / todaySlotsRowsPerPage);
  }, [stats.length, todaySlotsRowsPerPage]);

  const lrItems = useMemo(() => stats.filter((s) => isLRType(s.slot_type)), [stats]);
  const lrDateRows = useMemo(() => {
    if (lrItems.length > 0) {
      return aggregateByDate(lrItems);
    }
    if (allTimeSummary?.LR) {
      const lr = allTimeSummary.LR;
      const displayLabel =
        timeMode === "daily"
          ? formatDisplayDate(dailyDate)
          : timeMode === "weekly"
          ? `${weekRange.start} - ${weekRange.end}`
          : timeMode === "monthly"
          ? `${monthRange.start} - ${monthRange.end}`
          : timeMode === "custom"
          ? `${customRange.start} - ${customRange.end}`
          : "All Time";
      return [
        {
          date: displayLabel,
          formattedDate: displayLabel,
          finalTotalDone: lr.interview_done || 0,
          finalTotalPass: lr.pass || 0,
          finalTotalFail: lr.fail || 0,
          finalTotalReschedule: lr.reschedule || 0,
          finalTotalNoShow: lr.no_show || 0,
          finalTotalDisinterested: lr.disinterested || 0,
          finalTotalNotEligible: lr.not_eligible || 0,
          finalTotalSlots: lr.total_slots || 0,
          finalTotalEmpty: lr.empty_slots || 0,
        },
      ];
    }
    return aggregateByDate(lrItems);
  }, [allTimeSummary, lrItems, timeMode, dailyDate, weekRange, monthRange, customRange]);

  const lrTotalRow = useMemo(() => {
    if (allTimeSummary?.LR) {
      const lr = allTimeSummary.LR;
      return {
        date: "Total",
        formattedDate: "Total",
        finalTotalDone: lr.interview_done || 0,
        finalTotalPass: lr.pass || 0,
        finalTotalFail: lr.fail || 0,
        finalTotalReschedule: lr.reschedule || 0,
        finalTotalNoShow: lr.no_show || 0,
        finalTotalDisinterested: lr.disinterested || 0,
        finalTotalNotEligible: lr.not_eligible || 0,
        finalTotalSlots: lr.total_slots || 0,
        finalTotalEmpty: lr.empty_slots || 0,
      };
    }
    return calculateGroupTotal(lrDateRows);
  }, [allTimeSummary, lrDateRows]);

  const crfItems = useMemo(() => stats.filter((s) => isCRFType(s.slot_type)), [stats]);
  const crfDateRows = useMemo(() => {
    if (crfItems.length > 0) {
      return aggregateByDate(crfItems);
    }
    const cfr = allTimeSummary?.CFR || allTimeSummary?.CRF;
    if (cfr) {
      const displayLabel =
        timeMode === "daily"
          ? formatDisplayDate(dailyDate)
          : timeMode === "weekly"
          ? `${weekRange.start} - ${weekRange.end}`
          : timeMode === "monthly"
          ? `${monthRange.start} - ${monthRange.end}`
          : timeMode === "custom"
          ? `${customRange.start} - ${customRange.end}`
          : "All Time";
      return [
        {
          date: displayLabel,
          formattedDate: displayLabel,
          finalTotalDone: cfr.interview_done || 0,
          finalTotalPass: cfr.pass || 0,
          finalTotalFail: cfr.fail || 0,
          finalTotalReschedule: cfr.reschedule || 0,
          finalTotalNoShow: cfr.no_show || 0,
          finalTotalDisinterested: cfr.disinterested || 0,
          finalTotalNotEligible: cfr.not_eligible || 0,
          finalTotalSlots: cfr.total_slots || 0,
          finalTotalEmpty: cfr.empty_slots || 0,
        },
      ];
    }
    return aggregateByDate(crfItems);
  }, [allTimeSummary, crfItems, timeMode, dailyDate, weekRange, monthRange, customRange]);

  const crfTotalRow = useMemo(() => {
    const cfr = allTimeSummary?.CFR || allTimeSummary?.CRF;
    if (cfr) {
      return {
        date: "Total",
        formattedDate: "Total",
        finalTotalDone: cfr.interview_done || 0,
        finalTotalPass: cfr.pass || 0,
        finalTotalFail: cfr.fail || 0,
        finalTotalReschedule: cfr.reschedule || 0,
        finalTotalNoShow: cfr.no_show || 0,
        finalTotalDisinterested: cfr.disinterested || 0,
        finalTotalNotEligible: cfr.not_eligible || 0,
        finalTotalSlots: cfr.total_slots || 0,
        finalTotalEmpty: cfr.empty_slots || 0,
      };
    }
    return calculateGroupTotal(crfDateRows);
  }, [allTimeSummary, crfDateRows]);

  const grandTotalRow = useMemo((): DateAggregatedRow => {
    if (allTimeSummary?.Total) {
      const tot = allTimeSummary.Total;
      return {
        date: "Total",
        formattedDate: "Total",
        finalTotalDone: tot.interview_done || 0,
        finalTotalPass: tot.pass || 0,
        finalTotalFail: tot.fail || 0,
        finalTotalReschedule: tot.reschedule || 0,
        finalTotalNoShow: tot.no_show || 0,
        finalTotalDisinterested: tot.disinterested || 0,
        finalTotalNotEligible: tot.not_eligible || 0,
        finalTotalSlots: tot.total_slots || 0,
        finalTotalEmpty: tot.empty_slots || 0,
      };
    }
    return {
      date: "Total",
      formattedDate: "Total",
      finalTotalDone: lrTotalRow.finalTotalDone + crfTotalRow.finalTotalDone,
      finalTotalPass: lrTotalRow.finalTotalPass + crfTotalRow.finalTotalPass,
      finalTotalFail: lrTotalRow.finalTotalFail + crfTotalRow.finalTotalFail,
      finalTotalReschedule: lrTotalRow.finalTotalReschedule + crfTotalRow.finalTotalReschedule,
      finalTotalNoShow: lrTotalRow.finalTotalNoShow + crfTotalRow.finalTotalNoShow,
      finalTotalDisinterested: lrTotalRow.finalTotalDisinterested + crfTotalRow.finalTotalDisinterested,
      finalTotalNotEligible: lrTotalRow.finalTotalNotEligible + crfTotalRow.finalTotalNotEligible,
      finalTotalSlots: lrTotalRow.finalTotalSlots + crfTotalRow.finalTotalSlots,
      finalTotalEmpty: lrTotalRow.finalTotalEmpty + crfTotalRow.finalTotalEmpty,
    };
  }, [allTimeSummary, lrTotalRow, crfTotalRow]);

  // ── Chart Datasets ────────────────────────────────────────────────────────

  const trendData = useMemo(() => {
    const datesMap = new Map<string, { date: string; LR: number; CFR: number }>();

    lrDateRows.forEach((r) => {
      if (r.date === "Total" || r.date === "All Time") return;
      const key = r.date;
      const formatted = r.formattedDate;
      const cur = datesMap.get(key) || { date: formatted, LR: 0, CFR: 0 };
      cur.LR += r.finalTotalDone;
      datesMap.set(key, cur);
    });

    crfDateRows.forEach((r) => {
      if (r.date === "Total" || r.date === "All Time") return;
      const key = r.date;
      const formatted = r.formattedDate;
      const cur = datesMap.get(key) || { date: formatted, LR: 0, CFR: 0 };
      cur.CFR += r.finalTotalDone;
      datesMap.set(key, cur);
    });

    return Array.from(datesMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [lrDateRows, crfDateRows]);

  const pieData = useMemo(() => {
    const raw = [
      { name: "Pass", value: grandTotalRow.finalTotalPass, color: "#16A34A" },
      { name: "Fail", value: grandTotalRow.finalTotalFail, color: "#DC2626" },
      { name: "Reschedule", value: grandTotalRow.finalTotalReschedule, color: "#EA580C" },
      { name: "No Show", value: grandTotalRow.finalTotalNoShow, color: "#6B7280" },
      { name: "Disinterested", value: grandTotalRow.finalTotalDisinterested, color: "#EAB308" },
      { name: "Not Eligible", value: grandTotalRow.finalTotalNotEligible, color: "#EC4899" },
    ];
    return raw;
  }, [grandTotalRow]);

  const barData = useMemo(() => {
    return [
      { name: "LR", done: lrTotalRow.finalTotalDone, fill: "#3B82F6" },
      { name: "CFR", done: crfTotalRow.finalTotalDone, fill: "#22C55E" },
    ];
  }, [lrTotalRow, crfTotalRow]);

  // ── CSV Export ───────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    const csvLines: string[] = [];
    csvLines.push("Performance Summary Report");
    csvLines.push(`Period: ${timeMode.toUpperCase()}`);
    csvLines.push("");

    csvLines.push("Round,Total Slots,Interviews Done,Pass,Fail,Reschedule,No Show,Disinterested,Not Eligible,Empty Slots");
    csvLines.push(
      `LR,${lrTotalRow.finalTotalSlots},${lrTotalRow.finalTotalDone},${lrTotalRow.finalTotalPass},${lrTotalRow.finalTotalFail},${lrTotalRow.finalTotalReschedule},${lrTotalRow.finalTotalNoShow},${lrTotalRow.finalTotalDisinterested},${lrTotalRow.finalTotalNotEligible},${lrTotalRow.finalTotalEmpty}`
    );
    csvLines.push(
      `CFR,${crfTotalRow.finalTotalSlots},${crfTotalRow.finalTotalDone},${crfTotalRow.finalTotalPass},${crfTotalRow.finalTotalFail},${crfTotalRow.finalTotalReschedule},${crfTotalRow.finalTotalNoShow},${crfTotalRow.finalTotalDisinterested},${crfTotalRow.finalTotalNotEligible},${crfTotalRow.finalTotalEmpty}`
    );
    csvLines.push(
      `Total,${grandTotalRow.finalTotalSlots},${grandTotalRow.finalTotalDone},${grandTotalRow.finalTotalPass},${grandTotalRow.finalTotalFail},${grandTotalRow.finalTotalReschedule},${grandTotalRow.finalTotalNoShow},${grandTotalRow.finalTotalDisinterested},${grandTotalRow.finalTotalNotEligible},${grandTotalRow.finalTotalEmpty}`
    );

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reports-${timeMode}-${formatDateISO(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "✅ Report Exported",
      description: "Downloaded summary report as CSV file.",
    });
  };

  const handleDownloadPDF = async () => {
    if (!sheetRef.current) return;
    setGeneratingPdf(true);
    try {
      toast({
        title: "📄 Generating PDF...",
        description: "Please wait while your report PDF is being generated.",
      });

      const dataUrl = await toPng(sheetRef.current, {
        cacheBust: true,
        quality: 0.95,
        backgroundColor: "#F8FAFC",
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`reports-${timeMode}-${formatDateISO(new Date())}.pdf`);

      toast({
        title: "✅ PDF Downloaded",
        description: "Your report PDF has been downloaded successfully.",
      });
    } catch (error: any) {
      console.error("Failed to generate PDF:", error);
      toast({
        title: "❌ PDF Generation Failed",
        description: error?.message || "Could not generate PDF file.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-zinc-950 flex font-sans text-slate-900 dark:text-slate-100">
      <AdmissionsSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 overflow-y-auto h-screen">
        <div ref={sheetRef} className="max-w-[1550px] mx-auto space-y-5 mt-12 md:mt-0 pb-12">

          {/* ── Page Header Bar ── */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Reports
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {!showReports && timeMode === "daily" && "Today's slot tracking and performance metrics"}
                {showReports && timeMode === "daily" && "Daily performance report for all interviews"}
                {showReports && timeMode === "weekly" && "Weekly performance report for all interviews"}
                {showReports && timeMode === "monthly" && "Monthly performance report for all interviews"}
                {timeMode === "all_time" && "All-time performance overview for all interviews"}
                {timeMode === "custom" && "Custom date range performance report"}
              </p>
            </div>

            {/* Top Right Action Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <Select
                  value={selectedInterviewerId || "all"}
                  onValueChange={(val) => setSelectedInterviewerId(val === "all" ? "" : val)}
                  disabled={usersLoading}
                >
                  <SelectTrigger className="h-9 text-xs w-[180px] bg-white dark:bg-zinc-900 border-slate-200">
                    <SelectValue placeholder={usersLoading ? "Loading..." : "All Interviewers"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Interviewers</SelectItem>
                    {usersList.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewScope(viewScope === "all" ? "my" : "all")}
                className="h-9 gap-1.5 text-xs font-medium bg-white dark:bg-zinc-900 border-slate-200"
              >
                <User className="w-3.5 h-3.5 text-slate-600" />
                {viewScope === "all" ? "All Interviewers" : "My Stats"}
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setShowReports(false);
                  setTimeMode("daily");
                  setDailyDate(getTodayDate());
                }}
                className={`h-9 gap-1.5 text-xs font-medium shadow-sm ${!showReports && timeMode === "daily"
                  ? "bg-[#E11D48] hover:bg-[#BE123C] text-white"
                  : "bg-white dark:bg-zinc-900 border border-slate-200 text-slate-700 dark:text-slate-200"
                  }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Today's Slots
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setShowReports(true);
                  if (timeMode === "all_time" || timeMode === "custom" || !showReports) {
                    setTimeMode("weekly");
                  }
                }}
                className={`h-9 gap-1.5 text-xs font-medium shadow-sm ${showReports
                  ? "bg-slate-900 dark:bg-zinc-800 text-white"
                  : "bg-white dark:bg-zinc-900 border border-slate-200 text-slate-700 dark:text-slate-200"
                  }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Reports
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setTimeMode("all_time")}
                className={`h-9 gap-1.5 text-xs font-medium border-slate-200 ${timeMode === "all_time" ? "bg-indigo-50 text-indigo-700 border-indigo-300" : "bg-white dark:bg-zinc-900"
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                View All
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchStats}
                disabled={loading}
                className="h-9 gap-1.5 text-xs font-medium bg-white dark:bg-zinc-900 border-slate-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={loading}
                className="h-9 gap-1.5 text-xs font-medium bg-white dark:bg-zinc-900 border-slate-200 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-slate-700" />
                Export
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={loading || generatingPdf}
                className="h-9 gap-1.5 text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-800 shadow-sm"
              >
                {generatingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                )}
                PDF Download
              </Button>
            </div>
          </div>

          {/* ── Today's Slots Detail View ── */}
          {!showReports && timeMode === "daily" && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Today's Slot Details</h3>
                {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 p-4 border-b border-slate-200 dark:border-zinc-800">
                <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-lg p-3">
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Total Slots</div>
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.reduce((sum, s) => sum + (s.total_slots || 0), 0)}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-lg p-3">
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Empty Slots</div>
                  <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.reduce((sum, s) => sum + (s.empty_slots || 0), 0)}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-lg p-3">
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Pass</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.reduce((sum, s) => sum + (s.pass || 0), 0)}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-lg p-3">
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Fail</div>
                  <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                    {stats.reduce((sum, s) => sum + (s.fail || 0), 0)}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-lg p-3">
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">No Show</div>
                  <div className="text-xl font-bold text-slate-600 dark:text-slate-400">
                    {stats.reduce((sum, s) => sum + (s.no_show || 0), 0)}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-lg p-3">
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Reschedule</div>
                  <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.reduce((sum, s) => sum + (s.reschedule || 0), 0)}
                  </div>
                </div>
              </div>

              {/* Detail Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8FAFC] dark:bg-zinc-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 sticky left-0 bg-[#F8FAFC] dark:bg-zinc-800/60 z-10">DATE</th>
                      <th className="px-4 py-3">NAME</th>
                      <th className="px-4 py-3">TYPE</th>
                      <th className="px-4 py-3 text-center text-purple-600 dark:text-purple-400">TOTAL SLOTS</th>
                      <th className="px-4 py-3 text-center text-orange-600 dark:text-orange-400">EMPTY SLOTS</th>
                      <th className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">INTERVIEW DONE</th>
                      <th className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400">PASS</th>
                      <th className="px-4 py-3 text-center text-rose-600 dark:text-rose-400">FAIL</th>
                      <th className="px-4 py-3 text-center text-orange-600 dark:text-orange-400">RESCHEDULE</th>
                      <th className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">NO SHOW</th>
                      <th className="px-4 py-3 text-center text-amber-600 dark:text-amber-400">DISINTERESTED</th>
                      <th className="px-4 py-3 text-center text-rose-500 dark:text-rose-400">NOT ELIGIBLE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {loading ? (
                      <tr>
                        <td colSpan={12} className="px-4 py-8 text-center text-slate-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                          Loading slot details...
                        </td>
                      </tr>
                    ) : stats.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-4 py-8 text-center text-slate-500">
                          No slot data available for today
                        </td>
                      </tr>
                    ) : (
                      paginatedStats.map((stat, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                          <td className="px-4 py-3 sticky left-0 bg-white dark:bg-zinc-900 font-medium text-slate-900 dark:text-slate-100">
                            {formatDisplayDate(stat.date)}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                            {stat.interviewer_name || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={`${isLRType(stat.slot_type)
                                ? "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-400"
                                : "border-green-300 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-400"
                                }`}
                            >
                              {stat.slot_type || "—"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center text-purple-600 dark:text-purple-400 font-semibold">
                            {stat.total_slots || 0}
                          </td>
                          <td className="px-4 py-3 text-center text-orange-600 dark:text-orange-400 font-semibold">
                            {stat.empty_slots || 0}
                          </td>
                          <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400 font-semibold">
                            {stat.interview_done || 0}
                          </td>
                          <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                            {stat.pass || 0}
                          </td>
                          <td className="px-4 py-3 text-center text-rose-600 dark:text-rose-400 font-semibold">
                            {stat.fail || 0}
                          </td>
                          <td className="px-4 py-3 text-center text-orange-600 dark:text-orange-400 font-semibold">
                            {stat.reschedule || 0}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-semibold">
                            {stat.no_show || 0}
                          </td>
                          <td className="px-4 py-3 text-center text-amber-600 dark:text-amber-400 font-semibold">
                            {stat.disinterested || 0}
                          </td>
                          <td className="px-4 py-3 text-center text-rose-500 dark:text-rose-400 font-semibold">
                            {stat.not_eligible || 0}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer with pagination */}
              <div className="px-4 py-3 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Showing{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {stats.length > 0 ? (todaySlotsPage - 1) * todaySlotsRowsPerPage + 1 : 0}
                  </span>{" "}
                  –{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {Math.min(todaySlotsPage * todaySlotsRowsPerPage, stats.length)}
                  </span>{" "}
                  of <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.length}</span> rows
                </div>

                <div className="flex items-center gap-3">
                  {/* Rows per page selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Rows:</span>
                    <Select
                      value={String(todaySlotsRowsPerPage)}
                      onValueChange={(val) => {
                        setTodaySlotsRowsPerPage(Number(val));
                        setTodaySlotsPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-16 text-xs bg-white dark:bg-zinc-900 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pagination buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTodaySlotsPage((p) => Math.max(1, p - 1))}
                      disabled={todaySlotsPage === 1 || stats.length === 0}
                      className="h-8 px-3 text-xs"
                    >
                      Previous
                    </Button>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 px-2">
                      Page {stats.length > 0 ? todaySlotsPage : 0} of {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTodaySlotsPage((p) => Math.min(totalPages, p + 1))}
                      disabled={todaySlotsPage >= totalPages || stats.length === 0}
                      className="h-8 px-3 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tabs & Filter Controls Bar ── */}
          {showReports && (timeMode === "daily" || timeMode === "weekly" || timeMode === "monthly") && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
              {/* Tabs */}
              <div className="border-b border-slate-200 dark:border-zinc-800 flex items-center gap-8 text-sm font-medium">
                <button
                  onClick={() => setTimeMode("daily")}
                  className={`pb-2.5 transition-all relative ${timeMode === "daily"
                    ? "text-[#E11D48] font-semibold border-b-2 border-[#E11D48]"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                    }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setTimeMode("weekly")}
                  className={`pb-2.5 transition-all relative ${timeMode === "weekly"
                    ? "text-[#E11D48] font-semibold border-b-2 border-[#E11D48]"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                    }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setTimeMode("monthly")}
                  className={`pb-2.5 transition-all relative ${timeMode === "monthly"
                    ? "text-[#E11D48] font-semibold border-b-2 border-[#E11D48]"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                    }`}
                >
                  Monthly
                </button>
              </div>

              {/* Date selector row */}
              <div className="flex flex-wrap items-center gap-3">
                {timeMode === "daily" && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500">Date</span>
                    <Input
                      type="date"
                      value={dailyDate}
                      onChange={(e) => setDailyDate(e.target.value)}
                      className="h-9 text-xs w-[180px] bg-white dark:bg-zinc-900 border-slate-200"
                    />
                  </div>
                )}

                {timeMode === "weekly" && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500">Week</span>
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 rounded-lg px-3 py-1 shadow-sm">
                      <Input
                        type="date"
                        value={weekRange.start}
                        onChange={(e) => setWeekRange((prev) => ({ ...prev, start: e.target.value }))}
                        className="h-7 text-xs w-[130px] border-none p-0 focus-visible:ring-0"
                      />
                      <span className="text-xs text-slate-400">-</span>
                      <Input
                        type="date"
                        value={weekRange.end}
                        onChange={(e) => setWeekRange((prev) => ({ ...prev, end: e.target.value }))}
                        className="h-7 text-xs w-[130px] border-none p-0 focus-visible:ring-0"
                      />
                    </div>
                  </div>
                )}

                {timeMode === "monthly" && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500">Month</span>
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 rounded-lg px-3 py-1 shadow-sm">
                      <Input
                        type="date"
                        value={monthRange.start}
                        onChange={(e) => setMonthRange((prev) => ({ ...prev, start: e.target.value }))}
                        className="h-7 text-xs w-[130px] border-none p-0 focus-visible:ring-0"
                      />
                      <span className="text-xs text-slate-400">-</span>
                      <Input
                        type="date"
                        value={monthRange.end}
                        onChange={(e) => setMonthRange((prev) => ({ ...prev, end: e.target.value }))}
                        className="h-7 text-xs w-[130px] border-none p-0 focus-visible:ring-0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Row of 9 Metric Cards ── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 pt-2">
                {/* Total Slots */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Total Slots</span>
                    <div className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3 text-xl font-bold text-purple-600 dark:text-purple-400">
                    {grandTotalRow.finalTotalSlots.toLocaleString()}
                  </div>
                </div>

                {/* Interviews Done */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Interviews Done</span>
                    <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3 text-xl font-bold text-blue-600 dark:text-blue-400">
                    {grandTotalRow.finalTotalDone.toLocaleString()}
                  </div>
                </div>

                {/* Pass */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Pass</span>
                    <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {grandTotalRow.finalTotalPass.toLocaleString()}
                  </div>
                </div>

                {/* Fail */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Fail</span>
                    <div className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                      <XCircle className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3 text-xl font-bold text-rose-600 dark:text-rose-400">
                    {grandTotalRow.finalTotalFail.toLocaleString()}
                  </div>
                </div>

                {/* Reschedule */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Reschedule</span>
                    <div className="w-6 h-6 rounded-md bg-orange-50 dark:bg-orange-950 text-orange-600 flex items-center justify-center">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3 text-xl font-bold text-orange-600 dark:text-orange-400">
                    {grandTotalRow.finalTotalReschedule.toLocaleString()}
                  </div>
                </div>

                {/* No Show */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">No Show</span>
                    <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 flex items-center justify-center">
                      <EyeOff className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3 text-xl font-bold text-slate-600 dark:text-slate-300">
                    {grandTotalRow.finalTotalNoShow.toLocaleString()}
                  </div>
                </div>

                {/* Disinterested */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Disinterested</span>
                    <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                      <Frown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3 text-xl font-bold text-amber-600 dark:text-amber-400">
                    {grandTotalRow.finalTotalDisinterested.toLocaleString()}
                  </div>
                </div>

                {/* Not Eligible */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Not Eligible</span>
                    <div className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                      <UserX className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3 text-xl font-bold text-rose-600 dark:text-rose-400">
                    {grandTotalRow.finalTotalNotEligible.toLocaleString()}
                  </div>
                </div>

                {/* Empty Slots */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Empty Slots</span>
                    <div className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                      <CalendarDays className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3 text-xl font-bold text-purple-600 dark:text-purple-400">
                    {grandTotalRow.finalTotalEmpty.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Performance by Round Table ── */}
          {showReports && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Performance by Round</h3>
                {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8FAFC] dark:bg-zinc-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3">Round</th>
                      <th className="px-4 py-3 text-center text-purple-600 dark:text-purple-400">Total Slots</th>
                      <th className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">Interviews Done</th>
                      <th className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400">Pass</th>
                      <th className="px-4 py-3 text-center text-rose-600 dark:text-rose-400">Fail</th>
                      <th className="px-4 py-3 text-center text-orange-600 dark:text-orange-400">Reschedule</th>
                      <th className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">No Show</th>
                      <th className="px-4 py-3 text-center text-amber-600 dark:text-amber-400">Disinterested</th>
                      <th className="px-4 py-3 text-center text-rose-500 dark:text-rose-400">Not Eligible</th>
                      <th className="px-4 py-3 text-center text-purple-600 dark:text-purple-400">Empty Slots</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                    {/* LR Row */}
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">LR</td>
                      <td className="px-4 py-3 text-center text-purple-600 dark:text-purple-400 font-semibold">{lrTotalRow.finalTotalSlots}</td>
                      <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400 font-semibold">{lrTotalRow.finalTotalDone}</td>
                      <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">{lrTotalRow.finalTotalPass}</td>
                      <td className="px-4 py-3 text-center text-rose-600 dark:text-rose-400 font-semibold">{lrTotalRow.finalTotalFail}</td>
                      <td className="px-4 py-3 text-center text-orange-600 dark:text-orange-400 font-semibold">{lrTotalRow.finalTotalReschedule}</td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-semibold">{lrTotalRow.finalTotalNoShow}</td>
                      <td className="px-4 py-3 text-center text-amber-600 dark:text-amber-400 font-semibold">{lrTotalRow.finalTotalDisinterested}</td>
                      <td className="px-4 py-3 text-center text-rose-500 dark:text-rose-400 font-semibold">{lrTotalRow.finalTotalNotEligible}</td>
                      <td className="px-4 py-3 text-center text-purple-600 dark:text-purple-400 font-semibold">{lrTotalRow.finalTotalEmpty}</td>
                    </tr>

                    {/* CFR Row */}
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">CFR</td>
                      <td className="px-4 py-3 text-center text-purple-600 dark:text-purple-400 font-semibold">{crfTotalRow.finalTotalSlots}</td>
                      <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400 font-semibold">{crfTotalRow.finalTotalDone}</td>
                      <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">{crfTotalRow.finalTotalPass}</td>
                      <td className="px-4 py-3 text-center text-rose-600 dark:text-rose-400 font-semibold">{crfTotalRow.finalTotalFail}</td>
                      <td className="px-4 py-3 text-center text-orange-600 dark:text-orange-400 font-semibold">{crfTotalRow.finalTotalReschedule}</td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-semibold">{crfTotalRow.finalTotalNoShow}</td>
                      <td className="px-4 py-3 text-center text-amber-600 dark:text-amber-400 font-semibold">{crfTotalRow.finalTotalDisinterested}</td>
                      <td className="px-4 py-3 text-center text-rose-500 dark:text-rose-400 font-semibold">{crfTotalRow.finalTotalNotEligible}</td>
                      <td className="px-4 py-3 text-center text-purple-600 dark:text-purple-400 font-semibold">{crfTotalRow.finalTotalEmpty}</td>
                    </tr>

                    {/* Total Row */}
                    <tr className="bg-slate-50 dark:bg-zinc-800/80 font-bold border-t-2 border-slate-200 dark:border-zinc-700">
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-bold">Total</td>
                      <td className="px-4 py-3 text-center text-purple-600 dark:text-purple-400 font-bold">{grandTotalRow.finalTotalSlots}</td>
                      <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400 font-bold">{grandTotalRow.finalTotalDone}</td>
                      <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">{grandTotalRow.finalTotalPass}</td>
                      <td className="px-4 py-3 text-center text-rose-600 dark:text-rose-400 font-bold">{grandTotalRow.finalTotalFail}</td>
                      <td className="px-4 py-3 text-center text-orange-600 dark:text-orange-400 font-bold">{grandTotalRow.finalTotalReschedule}</td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-bold">{grandTotalRow.finalTotalNoShow}</td>
                      <td className="px-4 py-3 text-center text-amber-600 dark:text-amber-400 font-bold">{grandTotalRow.finalTotalDisinterested}</td>
                      <td className="px-4 py-3 text-center text-rose-500 dark:text-rose-400 font-bold">{grandTotalRow.finalTotalNotEligible}</td>
                      <td className="px-4 py-3 text-center text-purple-600 dark:text-purple-400 font-bold">{grandTotalRow.finalTotalEmpty}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Charts Panel ── */}
          {showReports && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left/Middle Chart Panel */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {timeMode === "daily"
                      ? "Interviews Done by Round"
                      : `Daily Interviews Trend (${formatDisplayDate(weekRange.start)} - ${formatDisplayDate(weekRange.end)})`}
                  </h3>
                </div>

                {timeMode === "daily" ? (
                  <div className="h-[260px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #E2E8F0" }} />
                        <Bar dataKey="done" radius={[6, 6, 0, 0]} barSize={60}>
                          {barData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[260px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #E2E8F0" }} />
                        <Legend wrapperStyle={{ fontSize: "12px" }} align="right" verticalAlign="top" />
                        <Line type="monotone" dataKey="LR" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="CFR" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Right Chart Panel (Result Distribution Donut) */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Result Distribution</h3>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                  <div className="w-[180px] h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend List */}
                  <div className="flex flex-col gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 w-full sm:w-auto">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">({item.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default SlotTracking;
